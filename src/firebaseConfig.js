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
  // ─── FLUJO 100% NATIVO (Android APK / Google Play Store) ───────────────
  if (Capacitor.isNativePlatform()) {
    console.log("=== GOOGLE SIGN-IN 100% NATIVO ===");
    try {
      let result;

      // 1. Iniciar selector nativo de Google en Android
      try {
        result = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: true,
        });
      } catch (cmErr) {
        console.warn("[signInWithGoogle] Reintentando con cliente estándar:", cmErr?.message || cmErr);
        result = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: false,
        });
      }

      console.log("✅ Selector nativo completado:", JSON.stringify(result));

      // 2. Extraer ID Token devuelto por Google
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
        } catch (tokErr) {
          console.warn("[signInWithGoogle] getIdToken:", tokErr?.message || tokErr);
        }
      }

      // 3. Autenticar en Firebase JS SDK dentro de la app
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCred = await signInWithCredential(auth, credential);
        console.log("✅ Sesión iniciada con éxito:", userCred.user.email);
        await initUserDocument(userCred.user.uid, userCred.user.email, userCred.user.displayName || '');
        return userCred;
      }

      // 4. Si el plugin ya autenticó al usuario en la capa nativa
      if (result?.user?.uid) {
        console.log("✅ Usuario nativo verificado:", result.user.email);
        await initUserDocument(result.user.uid, result.user.email || '', result.user.displayName || '');
        return result;
      }

      throw new Error("No se pudo obtener el token de autenticación de Google.");
    } catch (nativeErr) {
      console.error("[signInWithGoogle] Error en login nativo:", nativeErr);
      const errMsg = nativeErr?.message || String(nativeErr || "");

      // Si el usuario simplemente cerró el selector de cuentas
      if (
        errMsg.toLowerCase().includes("cancel") ||
        errMsg.toLowerCase().includes("cancelled") ||
        nativeErr?.code === "12501" ||
        errMsg.toLowerCase().includes("sign_in_cancelled")
      ) {
        throw new Error("Inicio de sesión cancelado por el usuario.");
      }

      // Si es error 10 u otro error de servicios de Google
      if (errMsg.includes("10:") || errMsg === "10" || nativeErr?.code === "10") {
        throw new Error("Error de sincronización con Google Play (Código 10). Verifica tu conexión o entra con Email/Contraseña.");
      }

      throw new Error(errMsg || "Error al iniciar sesión con Google.");
    }
  }

  // ─── FLUJO EXCLUSIVO PARA NAVEGADOR WEB DE ESCRITORIO (PC / Mac) ────────
  console.log("Usando flujo Firebase Web Auth Popup para navegador");
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
