import React from 'react';
import { X, Bell, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationsPanel.css';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { notifications, loading } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-panel" onClick={e => e.stopPropagation()}>
        <div className="notifications-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} />
            <h2>Notificaciones</h2>
          </div>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="notifications-list">
          {notifications.map(n => (
            <div key={n.id} className={`notification-item ${n.type}`}>
              <div className="notif-icon">
                {n.type === 'info' && <Info size={16} />}
                {n.type === 'warning' && <AlertTriangle size={16} />}
                {n.type === 'success' && <span style={{color: 'var(--accent)'}}>✓</span>}
              </div>
              <div className="notif-content">
                <p>{n.text}</p>
                <span>{n.time}</span>
              </div>
            </div>
          ))}
          {notifications.length === 0 && <p className="empty-msg">No tienes notificaciones pendientes.</p>}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
