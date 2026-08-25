import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Moon, 
  Sun, 
  Bell, 
  Download, 
  User, 
  LogOut, 
  Trash2, 
  X, 
  Check, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../hooks/usePWA';
import { showToast } from '../../utils/toast';
import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission } from '../../hooks/useLocalNotifications';
import { isDeveloperEmail } from '../../config/admins';

export const PlayerSettingsModal = ({ isOpen, onClose, player }) => {
  const { t, language, setLanguage, isEn } = useTranslation();
  const { darkMode, toggleTheme } = useTheme();
  const { user, userProfile, logout, switchMode } = useAuth();
  const { deferredPrompt, isInstalled, installApp } = usePWA();

  const [notifEnabled, setNotifEnabled] = useState(() => {
    return localStorage.getItem('mister11_notifications_enabled') !== 'false';
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleToggleNotif = async () => {
    const nextVal = !notifEnabled;
    setNotifEnabled(nextVal);
    localStorage.setItem('mister11_notifications_enabled', String(nextVal));

    if (nextVal && Capacitor.isNativePlatform()) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showToast(isEn ? 'Notification permissions denied.' : 'No se concedieron permisos de notificación.', 'warning');
      } else {
        showToast(isEn ? 'Reminders activated.' : 'Recordatorios activados.', 'success');
      }
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    showToast(newLang === 'English (EN)' ? 'Language changed to English' : 'Idioma cambiado a Español', 'success');
  };

  const handleLogout = async () => {
    if (window.confirm(isEn ? 'Do you want to log out?' : '¿Deseas cerrar sesión?')) {
      try {
        await logout();
        window.location.href = '/';
      } catch (err) {
        console.error('Error logging out:', err);
      }
    }
  };

  const canSwitchCoach = Boolean(
    isDeveloperEmail(user?.email) || 
    userProfile?.role === 'coach' || 
    userProfile?.role === 'admin' || 
    user?.email === 'lanuevaolarecord@gmail.com' || 
    user?.email === 'jhocatv@gmail.com'
  );

  return (
    <div 
      className="player-settings-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="player-settings-modal"
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: darkMode ? '#111B21' : '#FFFFFF',
          border: `1.5px solid ${darkMode ? 'rgba(76, 175, 125, 0.35)' : '#CBD5E1'}`,
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
          color: darkMode ? '#FFFFFF' : '#0F172A',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(76, 175, 125, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={18} color="#4CAF7D" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              {t('player.settings.modalTitle')}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary, #94A3B8)', 
              cursor: 'pointer', 
              padding: '6px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. SECCIÓN: IDIOMA */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={15} color="#4CAF7D" /> {t('player.settings.language')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleLanguageChange('Español (ES)')}
              style={{
                minHeight: '48px',
                padding: '10px',
                borderRadius: '12px',
                border: `1.5px solid ${language === 'Español (ES)' ? '#4CAF7D' : (darkMode ? 'rgba(255,255,255,0.1)' : '#CBD5E1')}`,
                background: language === 'Español (ES)' ? 'rgba(76, 175, 125, 0.2)' : (darkMode ? 'rgba(27, 58, 45, 0.3)' : '#F8FAFC'),
                color: language === 'Español (ES)' ? '#4CAF7D' : (darkMode ? '#FFFFFF' : '#0F172A'),
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🇪🇸</span> Español (ES) {language === 'Español (ES)' && <Check size={16} />}
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('English (EN)')}
              style={{
                minHeight: '48px',
                padding: '10px',
                borderRadius: '12px',
                border: `1.5px solid ${language === 'English (EN)' ? '#4CAF7D' : (darkMode ? 'rgba(255,255,255,0.1)' : '#CBD5E1')}`,
                background: language === 'English (EN)' ? 'rgba(76, 175, 125, 0.2)' : (darkMode ? 'rgba(27, 58, 45, 0.3)' : '#F8FAFC'),
                color: language === 'English (EN)' ? '#4CAF7D' : (darkMode ? '#FFFFFF' : '#0F172A'),
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🇬🇧</span> English (EN) {language === 'English (EN)' && <Check size={16} />}
            </button>
          </div>
        </div>

        {/* 2. SECCIÓN: TEMA (MODO OSCURO / CLARO) */}
        <div style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '12px', background: darkMode ? 'rgba(0,0,0,0.25)' : '#F8FAFC', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {darkMode ? <Moon size={18} color="#C9A84C" /> : <Sun size={18} color="#F59E0B" />}
              <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{t('player.settings.theme')}</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: '52px',
                height: '30px',
                borderRadius: '15px',
                backgroundColor: darkMode ? '#4CAF7D' : '#CBD5E1',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                padding: '2px'
              }}
              aria-label="Toggle tema oscuro/claro"
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                transform: darkMode ? 'translateX(22px)' : 'translateX(0px)',
                transition: 'transform 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </div>

        {/* 3. SECCIÓN: RECORDATORIOS DE SESIÓN */}
        <div style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '12px', background: darkMode ? 'rgba(0,0,0,0.25)' : '#F8FAFC', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#4CAF7D" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{t('player.settings.notifications')}</span>
            </div>
            <button
              type="button"
              onClick={handleToggleNotif}
              style={{
                width: '52px',
                height: '30px',
                borderRadius: '15px',
                backgroundColor: notifEnabled ? '#4CAF7D' : '#CBD5E1',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                padding: '2px'
              }}
              aria-label="Toggle notificaciones"
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                transform: notifEnabled ? 'translateX(22px)' : 'translateX(0px)',
                transition: 'transform 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary, #94A3B8)', lineHeight: '1.4' }}>
            {t('player.settings.notificationsDesc')}
          </p>
        </div>

        {/* 4. INSTALAR PWA SI ESTÁ DISPONIBLE */}
        {deferredPrompt && !isInstalled && (
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={installApp}
              style={{
                width: '100%',
                minHeight: '48px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Download size={18} /> {t('player.settings.installApp')}
            </button>
          </div>
        )}

        {/* 5. ACCIONES DE SESIÓN Y CUENTA */}
        <div style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {canSwitchCoach && (
            <button
              type="button"
              onClick={() => {
                switchMode('coach');
                window.location.href = '/';
              }}
              style={{
                width: '100%',
                minHeight: '48px',
                border: '1.5px solid #3B82F6',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#60A5FA',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <User size={18} /> {t('player.profile.switchToCoach')}
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              minHeight: '48px',
              border: `1.5px solid ${darkMode ? 'rgba(255,255,255,0.15)' : '#CBD5E1'}`,
              background: darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
              color: darkMode ? '#FFFFFF' : '#0F172A',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <LogOut size={18} /> {t('player.profile.logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSettingsModal;
