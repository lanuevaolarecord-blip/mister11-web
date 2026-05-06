import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationsPanel from './NotificationsPanel';
import { useSettings } from '../hooks/useSettings';

const Layout = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();

  // Theme is now managed globally by ThemeProvider/ThemeContext
  // document.documentElement class is handled there.

  return (
    <div className="app-container">
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
      
      <div className="main-content">
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
