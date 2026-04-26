import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationsPanel from './NotificationsPanel';

const Layout = () => {
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);

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
