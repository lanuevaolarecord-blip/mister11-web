import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signOut,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
} from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Capacitor } from "@capacitor/core";

// Configuración definitiva de Firebase para Míster11
const firebaseConfig = {
  apiKey: "AIzaSyAIsUQOnmsMLOt16kwis2s7ODv-mpzeeWo",
  authDomain: "mister11.firebaseapp.com",
  projectId: "mister11",
  storageBucket: "mister11.firebasestorage.app",
  messagingSenderId: "954668402587",
  appId: "1:954668402587:web:ccae27f1bba1396d2b833e",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Forzar persistencia para sesiones duraderas
setPersistence(auth, browserLocalPersistence).catch(console.error);

/**
 * Inicializa el documento de usuario en Firestore si es la primera vez que entra.
 * Registra el trialStartDate en base de datos para evitar que se pueda bypassear.
 */
const initUserDocument = async (uid, email, displayName) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    // Primera vez que entra este usuario → crear documento con trial de 7 días
    await setDoc(userRef, {
      email: email || '',
      displayName: displayName || '',
      plan: 'trial',
      trialStartDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }
};

const signInWithGoogle = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Cargamos el plugin de Capacitor Firebase Authentication
      const { FirebaseAuthentication } = await import(
        "@capacitor-firebase/authentication"
      );

      let result = null;

      // 1. Intentar primero con flujo clásico nativo (GoogleSignInClient)
      try {
        result = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: false,
        });
      } catch (err1) {
        console.warn("[signInWithGoogle] Intento nativo legacy falló:", err1);

        const errMsg1 = err1?.message || String(err1);
        const isUserCancel =
          errMsg1.toLowerCase().includes("cancel") ||
          errMsg1.toLowerCase().includes("cancelled") ||
          err1?.code === "12501" ||
          errMsg1.toLowerCase().includes("sign_in_cancelled");

        if (isUserCancel) {
          throw new Error("Inicio de sesión cancelado por el usuario.");
        }

        // 2. Probar con CredentialManager (Android 14+)
        try {
          result = await FirebaseAuthentication.signInWithGoogle({
            useCredentialManager: true,
          });
        } catch (err2) {
          console.warn("[signInWithGoogle] Intento nativo CredentialManager falló:", err2);
          const errMsg2 = err2?.message || String(err2);
          if (
            errMsg2.toLowerCase().includes("cancel") ||
            errMsg2.toLowerCase().includes("cancelled") ||
            err2?.code === "12501" ||
            errMsg2.toLowerCase().includes("sign_in_cancelled")
          ) {
            throw new Error("Inicio de sesión cancelado por el usuario.");
          }
          throw err2 || err1;
        }
      }

      // 3. Extraer el ID Token de todas las estructuras posibles de respuesta
      let idToken =
        result?.credential?.idToken ||
        result?.user?.idToken ||
        result?.idToken ||
        result?.credential?.accessToken;

      // Si aún no tenemos el idToken pero hay un usuario autenticado nativamente
      if (!idToken) {
        try {
          const tokenRes = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
          if (tokenRes?.token) {
            idToken = tokenRes.token;
          }
        } catch (tokenErr) {
          console.warn("[signInWithGoogle] No se pudo obtener token vía getIdToken:", tokenErr);
        }
      }

      if (!idToken) {
        throw new Error("No se pudo obtener el token de autenticación de Google.");
      }

      // 4. Crear la credencial para sincronizar con el SDK Web de Firebase JS
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);

      // 5. Inicializar o verificar documento de usuario en Firestore
      await initUserDocument(userCred.user.uid, userCred.user.email, userCred.user.displayName);
      return userCred;
    } catch (nativeErr) {
      console.error("[signInWithGoogle] Error en autenticación nativa:", nativeErr);
      const errMsg = nativeErr?.message || String(nativeErr);
      if (
        errMsg.toLowerCase().includes("cancel") ||
        errMsg.toLowerCase().includes("cancelled") ||
        nativeErr?.code === "12501" ||
        errMsg.toLowerCase().includes("sign_in_cancelled")
      ) {
        throw new Error("Inicio de sesión cancelado por el usuario.");
      }
      throw new Error(
        errMsg || "Error al autenticar con Google. Por favor, verifica tu conexión e intenta de nuevo."
      );
    }
  }

  // Flujo Web puro para navegadores de escritorio / PWA
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await initUserDocument(result.user.uid, result.user.email, result.user.displayName);
    return result;
  } catch (error) {
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/cancelled-popup-request"
    ) {
      return await signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
};

export {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithGoogle,
  signInAnonymously,
  signOut,
  storage,
  initUserDocument
};

