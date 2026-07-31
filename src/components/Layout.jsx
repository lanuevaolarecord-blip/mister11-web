import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationsPanel from './NotificationsPanel';
import { useSettings } from '../hooks/useSettings';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import BottomNav from './BottomNav';

const Layout = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { isOffline } = useOfflineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(false);
  }, [isOffline]);

  return (
    <div className="app-container">
      {/* ── Banner de sin conexión (Toast Flotante y Discreto) ───────────── */}
      {isOffline && !isDismissed && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 z-[1500] text-sm"
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#d97706',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1500,
            fontSize: '0.85rem',
            fontWeight: '600',
            fontFamily: 'Outfit, Inter, sans-serif',
            width: '90%',
            maxWidth: '480px',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>📡</span>
            <span>Sin conexión · Mostrando datos locales guardados</span>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0 4px',
              fontWeight: 'bold',
              lineHeight: 1,
            }}
            title="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}

      <button 
        className="hamburger-btn" 
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div
        className="main-content"
      >
        <Header onToggleNotif={() => setIsNotifOpen(!isNotifOpen)} />
        <main className="main-wrapper">
          <Outlet />
        </main>
      </div>
      <NotificationsPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <BottomNav />
    </div>
  );
};

export default Layout;
