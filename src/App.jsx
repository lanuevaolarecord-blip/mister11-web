import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './context/AuthContext';
import { db } from './firebaseConfig';
import { APP_VERSION } from './constants/appVersion';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

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
import LandingPage from './pages/LandingPage';
import SharedPlan from './pages/SharedPlan';
import AcceptInvitation from './pages/AcceptInvitation';
import ConsentimientoFirma from './pages/ConsentimientoFirma';

import './App.css';

function compareVersions(remote, local) {
  const toNum = (v) => (v || "0").split('.').map(n => parseInt(n, 10));
  const r = toNum(remote);
  const l = toNum(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const ri = r[i] || 0;
    const li = l[i] || 0;
    if (ri > li) return 1;
    if (ri < li) return -1;
  }
  return 0;
}

function RedirectToRoot() {
  const location = useLocation();
  return <Navigate to={`/${location.search}`} replace />;
}

function App() {
  const { user, loading } = useAuth();
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateData, setUpdateData] = useState({ version: '', url: '' });

  useEffect(() => {
    if (user) {
      const pendingInviteToken = localStorage.getItem('mister11_pending_invite_token');
      if (pendingInviteToken) {
        window.location.href = `/accept-invitation?token=${pendingInviteToken}`;
      }
    }
  }, [user]);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const versionRef = doc(db, 'config', 'global');
        const versionSnap = await getDoc(versionRef);
        
        if (versionSnap.exists()) {
          const data = versionSnap.data();
          const remoteVersion = data.appVersion;
          const apkUrl = data.apkUrl || '';
          
          if (remoteVersion && compareVersions(remoteVersion, APP_VERSION) > 0) {
            // Verificar si el usuario ya cerró esta versión específica
            const dismissedVersion = localStorage.getItem('dismissedUpdateVersion');
            if (dismissedVersion !== remoteVersion) {
              setUpdateData({ version: remoteVersion, url: apkUrl });
              setShowUpdate(true);
            }
          }
        }
      } catch (error) {
        console.error("Error al comprobar la versión:", error);
      }
    };

    checkVersion();
  }, []);

  const handleCloseUpdate = () => {
    // Guardar en localStorage que se cerró esta versión
    if (updateData.version) {
      localStorage.setItem('dismissedUpdateVersion', updateData.version);
    }
    setShowUpdate(false);
  };

  const [globalActionLoading, setGlobalActionLoading] = useState({ show: false, message: '' });

  useEffect(() => {
    const handleGlobalLoading = (e) => {
      setGlobalActionLoading({
        show: e.detail?.show || false,
        message: e.detail?.message || 'Procesando...'
      });
    };
    window.addEventListener('m11-loading', handleGlobalLoading);
    return () => window.removeEventListener('m11-loading', handleGlobalLoading);
  }, []);

  // 4. Mientras onAuthStateChanged no ha respondido todavía, muestra pantalla de carga
  if (loading) {
    return (
      <div className="global-loader">
        <div className="loader-content">
          <img src="/logo_mister11.png" alt="Míster11" className="loader-logo-img" />
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // 5. Lógica de autenticación: Si devuelve un usuario, muestra la app; si devuelve null, muestra login
  return (
    <>
      {globalActionLoading.show && (
        <div className="global-loader" style={{ zIndex: 99999, background: 'rgba(0,0,0,0.8)' }}>
          <div className="loader-content">
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: 'white', fontWeight: 'bold' }}>{globalActionLoading.message}</p>
          </div>
        </div>
      )}
      {showUpdate && (
        <div className="update-notification">
          <div className="update-content">
            <span className="update-icon">🚀</span>
            <div className="update-text">
              <p>
                <strong>¡Nueva versión {updateData.version} disponible!</strong><br />
                Mejoras y correcciones listas para tu equipo.
              </p>
              <div className="update-actions">
                <button className="btn-update-action refresh" onClick={() => window.location.reload()}>
                  Recargar Web
                </button>
                {updateData.url && (
                  <button
                    className="btn-update-action download"
                    onClick={async () => {
                      if (Capacitor.isNativePlatform()) {
                        try {
                          await Browser.open({ url: updateData.url, presentationStyle: 'popover' });
                        } catch (err) {
                          console.error('Error opening browser:', err);
                          window.open(updateData.url, '_blank');
                        }
                      } else {
                        window.open(updateData.url, '_blank');
                      }
                    }}
                  >
                    Descargar APK
                  </button>
                )}
              </div>
            </div>
            <button className="update-close" onClick={handleCloseUpdate}>×</button>
          </div>
        </div>
      )}
      <Routes>
        <Route 
          path="/" 
          element={user ? <Layout /> : <LandingPage />}
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />

        <Route 
          path="/shared/plan/:planId" 
          element={<SharedPlan />} 
        />

        <Route 
          path="/instalar" 
          element={<Instalar />} 
        />

        <Route 
          path="/accept-invitation" 
          element={<AcceptInvitation />} 
        />

        <Route 
          path="/shared/consentimiento" 
          element={<ConsentimientoFirma />} 
        />

        <Route 
          path="/*" 
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route path="dashboard" element={<RedirectToRoot />} />
          <Route path="pricing" element={<Navigate to="/admin" state={{ activeTab: 'ajustes' }} replace />} />
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
