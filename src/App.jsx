import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './context/AuthContext';
import { db } from './firebaseConfig';
import { APP_VERSION } from './constants/appVersion';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// ── Carga ESTÁTICA (crítica en boot) ─────────────────────────────────────────
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import PageLoader from './components/PageLoader';
import ErrorBoundary from './components/ErrorBoundary';

// ── Carga DIFERIDA (code splitting) — se cargan solo cuando se navega ────────
const PizarraTactica    = lazy(() => import('./pages/PizarraTactica'));
const MiEquipo          = lazy(() => import('./pages/MiEquipo'));
const Sesiones          = lazy(() => import('./pages/Sesiones'));
const Planificacion     = lazy(() => import('./pages/Planificacion'));
const Tests             = lazy(() => import('./pages/Tests'));
const Partidos          = lazy(() => import('./pages/Partidos'));
const IAGeneradora      = lazy(() => import('./pages/IAGeneradora'));
const AdminPanel        = lazy(() => import('./pages/AdminPanel'));
const Instalar          = lazy(() => import('./pages/Instalar'));
const SharedPlan        = lazy(() => import('./pages/SharedPlan'));
const SharedSession     = lazy(() => import('./pages/SharedSession'));
const AcceptInvitation  = lazy(() => import('./pages/AcceptInvitation'));
const JoinTeam          = lazy(() => import('./pages/JoinTeam'));
const ConsentimientoFirma = lazy(() => import('./pages/ConsentimientoFirma'));
const ConsentForm       = lazy(() => import('./pages/ConsentForm'));
const DemoMode          = lazy(() => import('./pages/DemoMode'));
const PlayerDashboard   = lazy(() => import('./pages/PlayerDashboard'));

import { TeamRoleSelectorModal } from './components/TeamRoleSelectorModal';
import './App.css';

function compareVersions(remote, local) {
  const toNum = (v) => (v || "0").split('.').map(n => parseInt(n, 10));
  const r = toNum(remote);
  const l = toNum(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const ri = r[i] || 0;
    const li = l[i] || 0;
    if (ri > li) return 1;
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
  const { user, loading, isPlayer } = useAuth();
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateData, setUpdateData] = useState({ version: '', url: '' });
  const [splashSlowWarning, setSplashSlowWarning] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSplashSlowWarning(false);
      return;
    }
    const timer = setTimeout(() => {
      setSplashSlowWarning(true);
    }, 6500);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (user) {
      const pendingInviteToken = localStorage.getItem('mister11_pending_invite_token');
      if (pendingInviteToken) {
        window.location.href = `/accept-invitation?token=${pendingInviteToken}`;
      }
    }
  }, [user]);

  useEffect(() => {
    // Comprobación de versión en segundo plano diferida para no interferir en el arranque
    const timer = setTimeout(async () => {
      try {
        const versionRef = doc(db, 'config', 'global');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout config')), 4000)
        );
        const versionSnap = await Promise.race([getDoc(versionRef), timeoutPromise]);
        
        if (versionSnap && versionSnap.exists()) {
          const data = versionSnap.data();
          const remoteVersion = data.appVersion || data.latestApkVersion;
          // Unificado: usa apkDownloadUrl (igual que AdminPanel) con fallback a apkUrl
          const apkUrl = data.apkDownloadUrl || data.apkUrl || '/mister11.apk';
          
          if (remoteVersion && compareVersions(remoteVersion, APP_VERSION) > 0) {
            const dismissedVersion = localStorage.getItem('dismissedUpdateVersion');
            if (dismissedVersion !== remoteVersion) {
              setUpdateData({ version: remoteVersion, url: apkUrl });
              setShowUpdate(true);
            }
          }
        }
      } catch (error) {
        console.warn("[App] Comprobación no crítica de versión en background finalizada:", error?.message || error);
      }
    }, 1500);

    return () => clearTimeout(timer);
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

  // 4. Mientras onAuthStateChanged no ha respondido todavía, muestra pantalla de carga con Watchdog de rescate
  if (loading && !bypassLoading) {
    return (
      <div className="global-loader" style={{ backgroundColor: '#111B21', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="loader-content" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <img src="/logo_mister11.png" alt="Míster11" className="loader-logo-img" style={{ height: '72px', marginBottom: '20px' }} />
          <div className="spinner"></div>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Cargando...</p>
          
          {splashSlowWarning && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '13px', color: '#FCD34D', margin: '0 0 14px 0', fontWeight: 700 }}>
                ⚠️ El inicio está tardando más de lo habitual.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setBypassLoading(true)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10B981',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Continuar sin esperar
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Reintentar conexión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.clear();
                      sessionStorage.clear();
                      if ('caches' in window) {
                        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                      }
                    } catch (_) {}
                    window.location.reload();
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#EF4444',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  🧹 Limpiar caché y reiniciar
                </button>
              </div>
            </div>
          )}
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
                      try {
                        const response = await fetch(updateData.url);
                        if (!response.ok) throw new Error('fetch failed');
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(
                          new Blob([blob], { type: 'application/vnd.android.package-archive' })
                        );
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = `mister11-v${updateData.version}.apk`;
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                        }, 5000);
                      } catch {
                        // Fallback
                        window.open(updateData.url, '_system');
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
      <TeamRoleSelectorModal />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                isPlayer ? <ErrorBoundary><PlayerDashboard /></ErrorBoundary> : <Layout />
              ) : (
                <LandingPage />
              )
            }
          >
            <Route index element={<ErrorBoundary>{isPlayer ? <PlayerDashboard /> : <Dashboard />}</ErrorBoundary>} />
          </Route>

          <Route 
            path="/player-dashboard" 
            element={user ? <ErrorBoundary><PlayerDashboard /></ErrorBoundary> : <Navigate to="/login" replace />} 
          />

          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <Login />} 
          />

          <Route 
            path="/shared/plan/:planId" 
            element={<SharedPlan />} 
          />

          <Route 
            path="/shared/session/:shareId" 
            element={<SharedSession />} 
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
            path="/join-team/:token" 
            element={<JoinTeam />} 
          />

          <Route 
            path="/join-team" 
            element={<JoinTeam />} 
          />

          <Route 
            path="/join/:teamId/:code" 
            element={<JoinTeam />} 
          />

          <Route 
            path="/join/:code" 
            element={<JoinTeam />} 
          />

          <Route 
            path="/shared/consentimiento" 
            element={<ConsentimientoFirma />} 
          />

          <Route 
            path="/consentimiento" 
            element={<ConsentForm />} 
          />

          {/* Ruta /demo: modo screenshots para Google Play Store (sin auth) */}
          <Route
            path="/demo"
            element={<DemoMode />}
          />

          <Route 
            path="/*" 
            element={
              user ? (
                isPlayer ? <ErrorBoundary><PlayerDashboard /></ErrorBoundary> : <Layout />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route path="dashboard" element={<RedirectToRoot />} />
            <Route path="pricing" element={<Navigate to="/admin" state={{ activeTab: 'ajustes' }} replace />} />
            <Route path="pizarra" element={<ErrorBoundary><PizarraTactica /></ErrorBoundary>} />
            <Route path="equipo" element={<ErrorBoundary><MiEquipo /></ErrorBoundary>} />
            <Route path="sesiones" element={<ErrorBoundary><Sesiones /></ErrorBoundary>} />
            <Route path="planificacion" element={<ErrorBoundary><Planificacion /></ErrorBoundary>} />
            <Route path="tests" element={<ErrorBoundary><Tests /></ErrorBoundary>} />
            <Route path="partidos" element={<ErrorBoundary><Partidos /></ErrorBoundary>} />
            <Route path="ia-generadora" element={<ErrorBoundary><IAGeneradora /></ErrorBoundary>} />
            <Route path="admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
            {/* Ruta 404 para subrutas desconocidas dentro del layout */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Ruta 404 global para rutas no reconocidas por el router */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
