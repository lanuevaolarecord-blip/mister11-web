import React from 'react';
import { X, Bell, Info, AlertTriangle } from 'lucide-react';
import { useNotifications, formatNotificationTime } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import './NotificationsPanel.css';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { activeTeamId } = useAuth();
  const { notifications, loading } = useNotifications(activeTeamId);
  const { t, isEn } = useTranslation();

  if (!isOpen) return null;

  const currentLangCode = isEn ? 'en' : 'es';

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-panel" onClick={e => e.stopPropagation()}>
        <div className="notifications-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} />
            <h2>{t('notifications.title')}</h2>
          </div>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="notifications-list">
          {notifications.map(n => {
            const hasTemplate = Boolean(n.template);
            const contentText = hasTemplate
              ? t(n.template, n.payload || {})
              : (n.text || '');
            
            const isDiscordant = !hasTemplate && n.locale && n.locale !== currentLangCode;

            return (
              <div key={n.id} className={`notification-item ${n.type}`}>
                <div className="notif-icon">
                  {n.type === 'info' && <Info size={16} />}
                  {n.type === 'warning' && <AlertTriangle size={16} />}
                  {n.type === 'success' && <span style={{color: 'var(--accent)'}}>✓</span>}
                </div>
                <div className="notif-content">
                  <p>{contentText}</p>
                  <div className="notif-content-row">
                    <span>{formatNotificationTime(n.rawDate)}</span>
                    {isDiscordant && (
                      <span 
                        className="badge-original-lang" 
                        title={n.locale === 'es' ? t('common.originalLanguageEs') : t('common.originalLanguageEn')}
                      >
                        {n.locale === 'es' ? t('common.originalBadgeEs') : t('common.originalBadgeEn')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {notifications.length === 0 && <p className="empty-msg">{t('notifications.empty')}</p>}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
