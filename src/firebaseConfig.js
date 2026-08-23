// ============================================================
// IMPORT ESTÁTICO — CRÍTICO para Capacitor Android.
// NO usar await import() dinámico para plugins nativos:
// causa el error "Failed to fetch dynamically imported module"
// en el WebView porque Vite genera un chunk separado que
// el WebView de Android no puede cargar desde localhost.
// ============================================================
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

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
  // ─── FLUJO NATIVO (APK / Play Store) ───────────────────────────────────
  if (Capacitor.isNativePlatform()) {
    try {
      console.log("=== GOOGLE SIGN-IN NATIVO — Plugin estático ===");

      let result;

      // Intento 1: Credential Manager moderno (Android 9+)
      try {
        result = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: true,
        });
        console.log("✅ Credential Manager OK");
      } catch (credErr) {
        console.warn("Credential Manager falló, probando GoogleSignInClient clásico:", credErr?.message || credErr);
        // Intento 2: GoogleSignInClient legacy
        result = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: false,
        });
        console.log("✅ GoogleSignInClient OK");
      }

      console.log("Respuesta nativa:", JSON.stringify(result));

      // Extraer ID Token del resultado
      let idToken =
        result?.credential?.idToken ||
        result?.user?.idToken ||
        result?.idToken ||
        result?.credential?.accessToken;

      // Si no llegó el token en el resultado, pedirlo explícitamente
      if (!idToken) {
        try {
          const tokenRes = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
          if (tokenRes?.token) {
            idToken = tokenRes.token;
            console.log("✅ Token obtenido vía getIdToken");
          }
        } catch (tokenErr) {
          console.warn("getIdToken también falló:", tokenErr?.message || tokenErr);
        }
      }

      // Intercambiar token con Firebase Web SDK
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCred = await signInWithCredential(auth, credential);
        console.log("✅ Firebase Auth exitoso:", userCred.user.email);
        await initUserDocument(userCred.user.uid, userCred.user.email, userCred.user.displayName);
        return userCred;
      }

      // Sin token pero con usuario ya autenticado en el plugin
      if (result?.user?.uid) {
        console.log("✅ Usuario autenticado sin intercambio de token");
        await initUserDocument(result.user.uid, result.user.email, result.user.displayName);
        return result;
      }

      // Si llegamos aquí sin resultado útil, forzamos el fallback web
      console.warn("Sin token ni usuario en respuesta nativa → fallback web");

    } catch (nativeErr) {
      const errMsg = nativeErr?.message || String(nativeErr || "");
      console.warn("[signInWithGoogle] Error nativo:", errMsg);

      // Cancelación voluntaria del usuario → no hacer fallback
      if (
        errMsg.includes("cancel") ||
        errMsg.includes("cancelled") ||
        nativeErr?.code === "12501" ||
        errMsg.includes("sign_in_cancelled")
      ) {
        throw new Error("Inicio de sesión cancelado por el usuario.");
      }

      // Cualquier otro error nativo (error 10, DEVELOPER_ERROR, etc.)
      // → caemos al flujo web como fallback silencioso
      console.log("Activando fallback web seguro...");
    }
  }

  // ─── FLUJO WEB (navegador / fallback desde fallo nativo) ───────────────
  console.log("Usando flujo Firebase Web Auth (Popup / Redirect)");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await initUserDocument(result.user.uid, result.user.email, result.user.displayName);
    return result;
  } catch (error) {
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/cancelled-popup-request"
    ) {
      console.log("Popup bloqueado → usando Redirect");
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
