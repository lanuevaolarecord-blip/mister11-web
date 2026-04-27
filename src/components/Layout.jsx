import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationsPanel from './NotificationsPanel';
import { useSettings } from '../hooks/useSettings';

const Layout = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  return (
    <div className="app-container">
      <Sidebar />
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
