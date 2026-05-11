import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './context/AuthContext';
import { db } from './firebaseConfig';
import { APP_VERSION } from './constants/appVersion';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PizarraTactica from './pages/PizarraTactica';
import MiEquipo from './pages/MiEquipo';
import Sesiones from './pages/Sesiones';
import Planificacion from './pages/Planificacion';
import Tests from './pages/Tests';
import Partidos from './pages/Partidos';
import IAGeneradora from './pages/IAGeneradora';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Instalar from './pages/Instalar';

import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const versionRef = doc(db, 'config', 'global');
        const versionSnap = await getDoc(versionRef);
        
        if (versionSnap.exists()) {
          const remoteVersion = versionSnap.data().appVersion;
          if (remoteVersion && remoteVersion !== APP_VERSION) {
            setShowUpdate(true);
          }
        }
      } catch (error) {
        console.error("Error al comprobar la versión:", error);
      }
    };

    checkVersion();
  }, []);

  // 4. Mientras onAuthStateChanged no ha respondido todavía, muestra pantalla de carga
  if (loading) {
    return (
      <div className="global-loader">
        <div className="loader-content">
          <div className="loader-logo">MÍSTER<span>11</span></div>
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // 5. Lógica de autenticación: Si devuelve un usuario, muestra la app; si devuelve null, muestra login
  return (
    <>
      {showUpdate && (
        <div className="update-notification">
          <div className="update-content">
            <span className="update-icon">🚀</span>
            <p>Hay una nueva versión disponible. Recarga la página (web) o descarga el nuevo APK (Android).</p>
            <button className="update-close" onClick={() => setShowUpdate(false)}>×</button>
          </div>
        </div>
      )}
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />

        <Route 
          path="/instalar" 
          element={<Instalar />} 
        />

        <Route 
          path="/*" 
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="pizarra" element={<PizarraTactica />} />
          <Route path="equipo" element={<MiEquipo />} />
          <Route path="sesiones" element={<Sesiones />} />
          <Route path="planificacion" element={<Planificacion />} />
          <Route path="tests" element={<Tests />} />
          <Route path="partidos" element={<Partidos />} />
          <Route path="ia-generadora" element={<IAGeneradora />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
