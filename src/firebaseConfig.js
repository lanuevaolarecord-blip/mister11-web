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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
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
const initUserDocument = async (uid, email, displayName, defaultRole = 'coach') => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    // Primera vez que entra este usuario → crear documento con trial de 7 días
    await setDoc(userRef, {
      email: email || '',
      displayName: displayName || '',
      role: defaultRole,
      plan: 'trial',
      trialStartDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }
};

const registerWithEmail = async (email, password, displayName, role = 'coach') => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && result.user) {
    try {
      await updateProfile(result.user, { displayName });
    } catch (_) {}
  }
  await initUserDocument(result.user.uid, result.user.email, displayName || '', role);
  return result;
};

const signInWithEmail = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

const resetPassword = async (email) => {
  return await sendPasswordResetEmail(auth, email);
};

const WEB_CLIENT_ID = "954668402587-im73oik073ds12jvkfn0diasvdmkb9qc.apps.googleusercontent.com";

const signInWithGoogle = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      console.log("=== INICIANDO GOOGLE SIGN-IN NATIVO ===");
      console.log("Web Client ID (Audiencia):", WEB_CLIENT_ID);
      console.log("Package:", "com.mister11.app");

      const { FirebaseAuthentication } = await import(
        "@capacitor-firebase/authentication"
      );

      let result;
      // Intento 1: Credential Manager nativo moderno con librerías empaquetadas
      try {
        result = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: true,
        });
      } catch (credErr) {
        console.warn("Intento Credential Manager no completado, activando GoogleSignInClient clásico...", credErr);
        // Intento 2: GoogleSignInClient directo
        result = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: false,
        });
      }

      console.log("✅ Respuesta nativa recibida:", JSON.stringify(result));

      // Extraer el ID Token
      let idToken =
        result?.credential?.idToken ||
        result?.user?.idToken ||
        result?.idToken ||
        result?.credential?.accessToken;

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

      if (idToken) {
        console.log("Intercambiando token con Firebase Auth...");
        const credential = GoogleAuthProvider.credential(idToken);
        const userCred = await signInWithCredential(auth, credential);
        console.log("✅ Firebase Auth exitoso:", userCred.user.email);
        await initUserDocument(userCred.user.uid, userCred.user.email, userCred.user.displayName);
        return userCred;
      }

      if (result?.user?.uid) {
        await initUserDocument(result.user.uid, result.user.email, result.user.displayName);
        return result;
      }
    } catch (nativeErr) {
      console.warn("[signInWithGoogle] Error en intento nativo:", nativeErr);
      const errMsg = nativeErr?.message || String(nativeErr);
      if (
        errMsg.toLowerCase().includes("cancel") ||
        errMsg.toLowerCase().includes("cancelled") ||
        nativeErr?.code === "12501" ||
        errMsg.toLowerCase().includes("sign_in_cancelled")
      ) {
        throw new Error("Inicio de sesión cancelado por el usuario.");
      }
      console.log("Activando fallback web transparente ante fallo nativo...");
    }
  }

  // Flujo Web puro o Fallback seguro para cualquier error nativo (como error 10)
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
  signInWithEmail,
  registerWithEmail,
  resetPassword,
  signInAnonymously,
  signOut,
  storage,
  initUserDocument
};


