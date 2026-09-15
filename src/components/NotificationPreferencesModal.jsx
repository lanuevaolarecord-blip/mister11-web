import React, { useState, useEffect } from 'react';
import { Bell, Activity, Calendar, MessageSquare, Clock, Shield, X, CheckCircle } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import './NotificationPreferencesModal.css';

export default function NotificationPreferencesModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { t, isEn } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState({
    wellnessDailyReminder: true,
    wellnessReminderTime: '20:00',
    chatAlerts: true,
    matchAlerts: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    frequencyCap: 3
  });

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    const loadPreferences = async () => {
      setLoading(true);
      try {
        const prefRef = doc(db, 'users', user.uid, 'settings', 'notifications');
        const snap = await getDoc(prefRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setPrefs(prev => ({
            ...prev,
            ...data,
            quietHours: {
              ...prev.quietHours,
              ...(data.quietHours || {})
            }
          }));
        }
      } catch (err) {
        console.warn('[NotificationPreferences] Error loading:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const prefRef = doc(db, 'users', user.uid, 'settings', 'notifications');
      await setDoc(prefRef, {
        ...prefs,
        updatedAt: serverTimestamp()
      }, { merge: true });

      showToast(t('notifPrefs.savedToast'), 'success');
      onClose();
    } catch (err) {
      console.error('[NotificationPreferences] Error saving:', err);
      showToast(t('notifPrefs.errorToast'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="notif-pref-overlay" onClick={onClose}>
      <div className="notif-pref-content" onClick={e => e.stopPropagation()}>
        <div className="notif-pref-header">
          <div className="notif-pref-title-wrap">
            <Bell className="notif-pref-icon" size={20} />
            <h2 className="notif-pref-title">{t('notifPrefs.title')}</h2>
          </div>
          <button type="button" className="notif-pref-close-btn" onClick={onClose} aria-label={t('btn.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="notif-pref-body">
          {loading ? (
            <div className="notif-pref-loading">{t('common.loading')}</div>
          ) : (
            <div className="notif-pref-sections">
              {/* Wellness Reminder */}
              <div className="notif-pref-card">
                <div className="notif-pref-card-header">
                  <div className="notif-pref-card-title-wrap">
                    <Activity className="notif-pref-card-icon" size={18} />
                    <div>
                      <h4 className="notif-pref-card-title">{t('notifPrefs.wellnessTitle')}</h4>
                      <p className="notif-pref-card-desc">{t('notifPrefs.wellnessDesc')}</p>
                    </div>
                  </div>
                  <label className="notif-pref-switch">
                    <input
                      type="checkbox"
                      checked={prefs.wellnessDailyReminder}
                      onChange={e => setPrefs({ ...prefs, wellnessDailyReminder: e.target.checked })}
                    />
                    <span className="notif-pref-slider" />
                  </label>
                </div>

                {prefs.wellnessDailyReminder && (
                  <div className="notif-pref-inline-field">
                    <span className="notif-pref-field-label">{t('notifPrefs.reminderTime')}</span>
                    <input
                      type="time"
                      className="notif-pref-time-input"
                      value={prefs.wellnessReminderTime}
                      onChange={e => setPrefs({ ...prefs, wellnessReminderTime: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Chat & Match alerts */}
              <div className="notif-pref-card">
                <div className="notif-pref-card-header">
                  <div className="notif-pref-card-title-wrap">
                    <MessageSquare className="notif-pref-card-icon" size={18} />
                    <div>
                      <h4 className="notif-pref-card-title">{t('notifPrefs.chatTitle')}</h4>
                      <p className="notif-pref-card-desc">{t('notifPrefs.chatDesc')}</p>
                    </div>
                  </div>
                  <label className="notif-pref-switch">
                    <input
                      type="checkbox"
                      checked={prefs.chatAlerts}
                      onChange={e => setPrefs({ ...prefs, chatAlerts: e.target.checked })}
                    />
                    <span className="notif-pref-slider" />
                  </label>
                </div>
              </div>

              <div className="notif-pref-card">
                <div className="notif-pref-card-header">
                  <div className="notif-pref-card-title-wrap">
                    <Calendar className="notif-pref-card-icon" size={18} />
                    <div>
                      <h4 className="notif-pref-card-title">{t('notifPrefs.matchTitle')}</h4>
                      <p className="notif-pref-card-desc">{t('notifPrefs.matchDesc')}</p>
                    </div>
                  </div>
                  <label className="notif-pref-switch">
                    <input
                      type="checkbox"
                      checked={prefs.matchAlerts}
                      onChange={e => setPrefs({ ...prefs, matchAlerts: e.target.checked })}
                    />
                    <span className="notif-pref-slider" />
                  </label>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="notif-pref-card">
                <div className="notif-pref-card-header">
                  <div className="notif-pref-card-title-wrap">
                    <Clock className="notif-pref-card-icon" size={18} />
                    <div>
                      <h4 className="notif-pref-card-title">{t('notifPrefs.quietHoursTitle')}</h4>
                      <p className="notif-pref-card-desc">{t('notifPrefs.quietHoursDesc')}</p>
                    </div>
                  </div>
                  <label className="notif-pref-switch">
                    <input
                      type="checkbox"
                      checked={prefs.quietHours.enabled}
                      onChange={e => setPrefs({
                        ...prefs,
                        quietHours: { ...prefs.quietHours, enabled: e.target.checked }
                      })}
                    />
                    <span className="notif-pref-slider" />
                  </label>
                </div>

                {prefs.quietHours.enabled && (
                  <div className="notif-pref-time-range">
                    <div className="notif-pref-inline-field">
                      <span className="notif-pref-field-label">{t('notifPrefs.quietHoursStart')}</span>
                      <input
                        type="time"
                        className="notif-pref-time-input"
                        value={prefs.quietHours.start}
                        onChange={e => setPrefs({
                          ...prefs,
                          quietHours: { ...prefs.quietHours, start: e.target.value }
                        })}
                      />
                    </div>
                    <div className="notif-pref-inline-field">
                      <span className="notif-pref-field-label">{t('notifPrefs.quietHoursEnd')}</span>
                      <input
                        type="time"
                        className="notif-pref-time-input"
                        value={prefs.quietHours.end}
                        onChange={e => setPrefs({
                          ...prefs,
                          quietHours: { ...prefs.quietHours, end: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Frequency Cap */}
              <div className="notif-pref-card">
                <div className="notif-pref-card-header">
                  <div className="notif-pref-card-title-wrap">
                    <Shield className="notif-pref-card-icon" size={18} />
                    <div>
                      <h4 className="notif-pref-card-title">{t('notifPrefs.frequencyCapTitle')}</h4>
                      <p className="notif-pref-card-desc">{t('notifPrefs.frequencyCapDesc')}</p>
                    </div>
                  </div>
                  <select
                    className="notif-pref-select"
                    value={prefs.frequencyCap}
                    onChange={e => setPrefs({ ...prefs, frequencyCap: parseInt(e.target.value, 10) })}
                  >
                    <option value={1}>1 / {t('notifPrefs.perDay')}</option>
                    <option value={3}>3 / {t('notifPrefs.perDay')}</option>
                    <option value={5}>5 / {t('notifPrefs.perDay')}</option>
                    <option value={10}>10 / {t('notifPrefs.perDay')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="notif-pref-footer">
          <button type="button" className="notif-pref-cancel-btn" onClick={onClose}>
            {t('btn.cancel')}
          </button>
          <button
            type="button"
            className="notif-pref-save-btn"
            disabled={saving || loading}
            onClick={handleSave}
          >
            <CheckCircle size={18} />
            <span>{saving ? t('common.loading') : t('btn.save')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
