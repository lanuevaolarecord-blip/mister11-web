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
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Forzar persistencia para sesiones duraderas
setPersistence(auth, browserLocalPersistence).catch(console.error);

/**
 * Función central de login optimizada para Android y Web
 */
const signInWithGoogle = async () => {
  if (Capacitor.isNativePlatform()) {
    // IMPORTANTE: Cargamos el plugin dinámicamente para evitar errores en web
    const { FirebaseAuthentication } = await import(
      "@capacitor-firebase/authentication"
    );

    // Ejecutar login nativo
    const result = await FirebaseAuthentication.signInWithGoogle();

    // Verificamos si tenemos el idToken (crucial para Firebase)
    const idToken = result.credential?.idToken || result.user?.idToken;

    if (!idToken) {
      throw new Error("No se obtuvo el ID Token de Google Nativo.");
    }

    // Crear la credencial para el SDK de JS
    const credential = GoogleAuthProvider.credential(idToken);

    // Autenticar en el SDK de JS para que Firestore funcione
    return await signInWithCredential(auth, credential);
  }

  // Flujo Web (Popup -> Redirect)
  try {
    return await signInWithPopup(auth, googleProvider);
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
  signOut,
};
