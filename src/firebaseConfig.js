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
    const result = await signInWithPopup(auth, googleProvider);
    // Inicializar documento de usuario en Firestore (solo si es nuevo)
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

