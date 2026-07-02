import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationsPanel from './NotificationsPanel';
import { useSettings } from '../hooks/useSettings';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

const Layout = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { isOffline } = useOfflineStatus();

  return (
    <div className="app-container">
      {/* ── Banner de sin conexión ──────────────────────────────────────── */}
      {isOffline && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(90deg, #D97706, #B45309)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: '600',
            fontFamily: 'Outfit, Inter, sans-serif',
            letterSpacing: '0.2px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontSize: '1rem' }}>📡</span>
          <span>Sin conexión · Mostrando datos guardados · Los cambios se sincronizarán al reconectar</span>
        </div>
      )}

      <button 
        className="hamburger-btn" 
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open Menu"
        style={isOffline ? { top: 'calc(36px + 12px)' } : {}}
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
        style={isOffline ? { paddingTop: '36px' } : {}}
      >
        <Header onToggleNotif={() => setIsNotifOpen(!isNotifOpen)} />
        <main className="main-wrapper">
          <Outlet />
        </main>
      </div>
      <NotificationsPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
};

export default Layout;
