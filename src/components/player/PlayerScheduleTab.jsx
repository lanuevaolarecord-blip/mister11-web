import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { showToast } from '../../utils/toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const PlayerScheduleTab = ({ player, team, teamPath, isParentView = false }) => {
  const { user } = useAuth();
  const { t, locale, isEn } = useTranslation();
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [savingEventId, setSavingEventId] = useState(null);

  const RSVP_OPTIONS = [
    { id: 'going', label: t('player.schedule.rsvpGoing'), color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle },
    { id: 'not_going', label: t('player.schedule.rsvpNotGoing'), color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', icon: XCircle },
    { id: 'late', label: t('player.schedule.rsvpLate'), color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: AlertTriangle },
    { id: 'justified', label: t('player.schedule.rsvpJustified'), color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', icon: HelpCircle },
  ];

  const effectivePlayerId = player?.id || user?.uid;
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';

  // Escuchar eventos (sesiones y partidos) del equipo de forma reactiva y aislada
  useEffect(() => {
    if (!cleanPath) return;

    // 1. Escuchar sesiones de entrenamiento
    const sessionsRef = collection(db, `${cleanPath}/sessions`);
    const unsubSessions = onSnapshot(sessionsRef, (snap) => {
      const sessions = snap.docs.map(d => {
        const data = d.data() || {};
        return {
          ...data,
          id: d.id,
          type: 'session',
          title: data.titulo || data.title || data.nombre || data.name || t('player.schedule.training'),
          date: data.fecha || data.date || data.dia || data.sessionDate || data.createdAt,
          time: data.hora || data.time || data.startTime || '18:30',
          duration: data.duracion || data.duration || 90,
          location: data.lugar || data.location || 'Campo Municipal',
        };
      });

      // 2. Escuchar partidos oficiales y amistosos
      const matchesRef = collection(db, `${cleanPath}/matches`);
      const unsubMatches = onSnapshot(matchesRef, (snapM) => {
        const matches = snapM.docs.map(d => {
          const data = d.data() || {};
          const rivalName = data.rival || data.opponent || data.rivalName || 'Rival';
          const isHome = data.isHome !== false;
          return {
            ...data,
            id: d.id,
            type: 'match',
            title: data.titulo || data.title || (isHome ? `vs ${rivalName}` : `@ ${rivalName}`),
            date: data.fecha || data.date || data.dia || data.matchDate || data.createdAt,
            time: data.hora || data.time || data.startTime || '11:00',
            duration: data.duracion || 90,
            location: data.lugar || data.location || (isHome ? 'Campo Local' : 'Campo Visitante'),
          };
        });

        const combined = [...sessions, ...matches];
        combined.sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime() || 0;
          const dateB = new Date(b.date || 0).getTime() || 0;
          return dateA - dateB;
        });
        setEvents(combined);
      }, (err) => {
        console.warn('Error cargando partidos:', err);
        setEvents(sessions);
      });

      return () => unsubMatches();
    }, (err) => {
      console.warn('Error cargando sesiones:', err);
    });

    return () => unsubSessions();
  }, [cleanPath, t]);

  // Escuchar RSVPs guardados en attendance para el jugador activo
  useEffect(() => {
    if (!cleanPath) return;

    const attRef = collection(db, `${cleanPath}/attendance`);
    const unsubAtt = onSnapshot(attRef, (snap) => {
      const rsvpMap = {};
      snap.docs.forEach(docSnap => {
        const data = docSnap.data() || {};
        const eventId = docSnap.id;
        if (data.playerRsvp && data.playerRsvp[effectivePlayerId]) {
          rsvpMap[eventId] = data.playerRsvp[effectivePlayerId];
        }
      });
      setRsvps(rsvpMap);
    });

    return () => unsubAtt();
  }, [cleanPath, effectivePlayerId]);

  const handleRsvp = async (eventId, optionId) => {
    if (!cleanPath || !eventId) return;
    setSavingEventId(eventId);

    try {
      const attDocRef = doc(db, `${cleanPath}/attendance`, eventId);
      await setDoc(attDocRef, {
        playerRsvp: {
          [effectivePlayerId]: {
            status: optionId,
            playerName: player?.name || user?.displayName || 'Jugador',
            respondedBy: isParentView ? 'parent' : 'player',
            updatedAt: serverTimestamp(),
          }
        }
      }, { merge: true });

      setRsvps(prev => ({
        ...prev,
        [eventId]: { status: optionId }
      }));

      const optLabel = RSVP_OPTIONS.find(o => o.id === optionId)?.label || optionId;
      showToast(t('player.schedule.rsvpConfirmed', { status: optLabel }), 'success');
    } catch (err) {
      console.error('Error guardando RSVP:', err);
      showToast('Error al guardar asistencia.', 'error');
    } finally {
      setSavingEventId(null);
    }
  };

  const parseEventDate = (rawDate) => {
    if (!rawDate) return null;
    if (typeof rawDate === 'number') {
      const dObj = new Date(rawDate);
      return { year: dObj.getFullYear(), month: dObj.getMonth(), day: dObj.getDate(), dateObj: dObj };
    }
    if (rawDate?.toDate && typeof rawDate.toDate === 'function') {
      const dObj = rawDate.toDate();
      return { year: dObj.getFullYear(), month: dObj.getMonth(), day: dObj.getDate(), dateObj: dObj };
    }
    if (rawDate?.seconds) {
      const dObj = new Date(rawDate.seconds * 1000);
      return { year: dObj.getFullYear(), month: dObj.getMonth(), day: dObj.getDate(), dateObj: dObj };
    }
    if (rawDate instanceof Date) {
      return { year: rawDate.getFullYear(), month: rawDate.getMonth(), day: rawDate.getDate(), dateObj: rawDate };
    }
    if (typeof rawDate === 'string') {
      if (rawDate.includes('-')) {
        const clean = rawDate.split('T')[0];
        const parts = clean.split('-').map(n => parseInt(n, 10));
        if (parts.length === 3) {
          const [y, m, d] = parts;
          return { year: y, month: m - 1, day: d, dateObj: new Date(y, m - 1, d) };
        }
      }
      if (rawDate.includes('/')) {
        const clean = rawDate.split('T')[0];
        const parts = clean.split('/').map(n => parseInt(n, 10));
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return { year: y, month: m - 1, day: d, dateObj: new Date(y, m - 1, d) };
        }
      }
      const fallbackDate = new Date(rawDate);
      if (!isNaN(fallbackDate.getTime())) {
        return { year: fallbackDate.getFullYear(), month: fallbackDate.getMonth(), day: fallbackDate.getDate(), dateObj: fallbackDate };
      }
    }
    return null;
  };

  const filteredEvents = events.filter(e => {
    const parsed = parseEventDate(e.date || e.fecha);
    if (!parsed) return false;
    return parsed.month === selectedMonth.getMonth() && parsed.year === selectedMonth.getFullYear();
  });

  const prevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const isCurrentMonth = selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear();
  const monthYearLabel = selectedMonth.toLocaleDateString(locale || 'es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="player-tab-content player-schedule-tab">
      
      {/* Selector de Mes */}
      <div className="schedule-month-selector">
        <button className="month-nav-btn" onClick={prevMonth} aria-label={isEn ? 'Previous month' : 'Mes anterior'}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="month-display-label">
            {monthYearLabel.toUpperCase()}
          </span>
          {!isCurrentMonth && (
            <button 
              type="button" 
              onClick={goToCurrentMonth}
              style={{
                background: 'none',
                border: 'none',
                color: '#10B981',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px',
                marginTop: '2px',
                minHeight: '28px'
              }}
            >
              • {t('player.schedule.backToCurrentMonth')} •
            </button>
          )}
        </div>
        <button className="month-nav-btn" onClick={nextMonth} aria-label={isEn ? 'Next month' : 'Mes siguiente'}>
          <ChevronRight size={20} />
        </button>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="events-cards-list">
          {filteredEvents.map((evt) => {
            const currentRsvp = rsvps[evt.id]?.status;
            const isMatch = evt.type === 'match';
            const parsed = parseEventDate(evt.date || evt.fecha);
            const dateDisplay = parsed?.dateObj 
              ? parsed.dateObj.toLocaleDateString(locale || 'es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) 
              : (evt.date || 'Fecha');

            const isFinished = evt.status === 'finalizado' || evt.estado === 'finalizado';
            const isCalled = evt.convocados?.includes(effectivePlayerId) || 
                             evt.titulares?.includes(effectivePlayerId) || 
                             evt.suplentes?.includes(effectivePlayerId);
            const isStarter = evt.titulares?.includes(effectivePlayerId);
            const isSub = evt.suplentes?.includes(effectivePlayerId);
            const isReserva = evt.reservas?.includes(effectivePlayerId);
            const playerStats = evt.playerStats?.[effectivePlayerId];

            return (
              <div key={evt.id} className={`event-card-item ${isMatch ? 'match-card' : 'session-card'}`}>
                <div className="event-card-top">
                  <div className="event-type-badge">
                    {isMatch ? `🏆 ${t('player.schedule.match')}` : `⚽ ${t('player.schedule.training')}`}
                  </div>
                  <div className="event-date-pill">
                    {dateDisplay}
                  </div>
                </div>

                <h3 className="event-title">{evt.title}</h3>

                <div className="event-meta-info">
                  <span><Clock size={14} /> {evt.time} ({evt.duration} min)</span>
                  <span><MapPin size={14} /> {evt.location}</span>
                </div>

                {/* SECCIÓN DE ESTADO DE CONVOCATORIA PARA PARTIDOS */}
                {isMatch && (
                  <div className="callup-status-box" style={{
                    margin: '12px 0',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isCalled 
                      ? 'rgba(16, 185, 129, 0.12)' 
                      : isReserva 
                      ? 'rgba(245, 158, 11, 0.12)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isCalled ? 'rgba(16, 185, 129, 0.35)' : isReserva ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`
                  }}>
                    {!isFinished ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCalled ? (
                          <>
                            <ShieldCheck size={18} color="#10B981" />
                            <div>
                              <strong style={{ color: '#10B981', fontSize: '0.88rem', display: 'block' }}>
                                {isEn ? 'Called up for the match!' : '¡Convocado para el partido!'}
                              </strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                {isEn ? 'You have been selected by the coaching staff.' : 'Has sido convocado por el cuerpo técnico. ¡Da el 100% en el campo!'}
                              </span>
                            </div>
                          </>
                        ) : isReserva ? (
                          <>
                            <AlertTriangle size={18} color="#F59E0B" />
                            <div>
                              <strong style={{ color: '#F59E0B', fontSize: '0.88rem', display: 'block' }}>
                                {isEn ? 'Standby / Reserve list' : 'Reserva / Convocatoria en espera'}
                              </strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                {isEn ? 'Stay tuned in case of last minute updates.' : 'Mantente atento por si se produce alguna vacante de última hora.'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <HelpCircle size={18} color="var(--text-secondary)" />
                            <div>
                              <strong style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'block' }}>
                                {isEn ? 'Not called up for this match' : 'No convocado para esta jornada'}
                              </strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {isEn ? 'Keep working hard in training!' : '¡Mucho ánimo y a seguir dándolo todo en los entrenamientos!'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>
                            {isStarter ? (isEn ? '⭐ Starter' : '⭐ Titular') : isSub ? (isEn ? '🔄 Substitute' : '🔄 Suplente') : isCalled ? (isEn ? '📋 Called up' : '📋 Convocado') : (isEn ? 'No minutes' : 'Sin minutos')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                            ⏱️ {playerStats?.minutesPlayed || 0} min {isEn ? 'played' : 'jugados'}
                          </span>
                        </div>
                        {playerStats?.coachRating && (
                          <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
                            {isEn ? 'Coach Rating:' : 'Nota del Míster:'} {playerStats.coachRating} / 10
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* BOTONES RSVP CON TOUCH TARGETS >= 48px */}
                <div className="rsvp-section">
                  <span className="rsvp-prompt" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                    {isParentView 
                      ? (isEn ? `Will ${player?.name || 'your child'} attend?` : `¿Asistirá ${player?.name || 'tu hijo'} a este evento?`) 
                      : (isEn ? 'Will you attend this event?' : '¿Asistirás a esta sesión?')}
                  </span>
                  <div className="rsvp-buttons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {RSVP_OPTIONS.map((opt) => {
                      const isSelected = currentRsvp === opt.id;
                      const Icon = opt.icon;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`rsvp-btn ${isSelected ? 'selected' : ''}`}
                          style={{
                            borderColor: isSelected ? opt.color : 'var(--border-color)',
                            backgroundColor: isSelected ? opt.bg : 'transparent',
                            color: isSelected ? opt.color : 'var(--text-secondary)',
                            minHeight: '48px',
                            minWidth: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleRsvp(evt.id, opt.id)}
                          disabled={savingEventId === evt.id}
                        >
                          <Icon size={18} color={isSelected ? opt.color : 'currentColor'} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="schedule-empty-box" style={{ padding: '32px 16px', textAlign: 'center' }}>
          <CalendarIcon size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.7 }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800 }}>{t('player.schedule.noEvents')}</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isEn ? 'Your coach has not scheduled sessions or matches for this month yet.' : 'Tu entrenador aún no ha programado sesiones o partidos en este mes.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerScheduleTab;
