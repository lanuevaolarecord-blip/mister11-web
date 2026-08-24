import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
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
  ShieldCheck,
  Award,
  Sparkles,
  Trophy
} from 'lucide-react';

const RSVP_OPTIONS = [
  { id: 'going', label: 'Iré', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle },
  { id: 'not_going', label: 'No iré', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', icon: XCircle },
  { id: 'late', label: 'Llegaré tarde', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: AlertTriangle },
  { id: 'justified', label: 'Justificado', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', icon: HelpCircle },
];

export const PlayerScheduleTab = ({ player, team, teamPath, isParentView = false }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [savingEventId, setSavingEventId] = useState(null);

  const effectivePlayerId = player?.id || user?.uid;
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';

  // Escuchar eventos (sesiones y partidos) en tiempo real con onSnapshot
  useEffect(() => {
    if (!cleanPath) return;

    // 1. Escuchar sesiones
    const sessionsRef = collection(db, `${cleanPath}/sessions`);
    const unsubSessions = onSnapshot(sessionsRef, (snap) => {
      const sessions = snap.docs.map(d => ({
        id: d.id,
        type: 'session',
        title: d.data().titulo || d.data().title || 'Entrenamiento',
        date: d.data().fecha || d.data().date,
        time: d.data().hora || d.data().time || '18:30',
        duration: d.data().duracion || 90,
        location: d.data().lugar || d.data().location || 'Campo Municipal',
        ...d.data()
      }));

      // 2. Escuchar partidos
      const matchesRef = collection(db, `${cleanPath}/matches`);
      const unsubMatches = onSnapshot(matchesRef, (snapM) => {
        const matches = snapM.docs.map(d => ({
          id: d.id,
          type: 'match',
          title: `vs ${d.data().rival || d.data().opponent || 'Rival'}`,
          date: d.data().fecha || d.data().date,
          time: d.data().hora || d.data().time || '11:00',
          duration: 90,
          location: d.data().lugar || (d.data().isHome ? 'Campo Local' : 'Campo Visitante'),
          ...d.data()
        }));

        const combined = [...sessions, ...matches];
        combined.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        setEvents(combined);
      }, (err) => {
        setEvents(sessions);
      });

      return () => unsubMatches();
    }, (err) => {
      console.warn('Error cargando eventos de agenda:', err);
    });

    return () => unsubSessions();
  }, [cleanPath]);

  // Escuchar RSVPs guardados en attendance
  useEffect(() => {
    if (!cleanPath) return;

    const attRef = collection(db, `${cleanPath}/attendance`);
    const unsubAtt = onSnapshot(attRef, (snap) => {
      const rsvpMap = {};
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
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

      const optLabel = RSVP_OPTIONS.find(o => o.id === optionId)?.label;
      showToast(`Asistencia confirmada: "${optLabel}"`, 'success');
    } catch (err) {
      console.error('Error guardando RSVP:', err);
      showToast('Error al guardar asistencia.', 'error');
    } finally {
      setSavingEventId(null);
    }
  };

  const parseEventDate = (rawDate) => {
    if (!rawDate) return null;
    if (typeof rawDate === 'string') {
      if (rawDate.includes('-')) {
        const clean = rawDate.split('T')[0];
        const [y, m, d] = clean.split('-').map(n => parseInt(n, 10));
        return { year: y, month: m - 1, day: d, dateObj: new Date(y, m - 1, d), str: clean };
      }
      if (rawDate.includes('/')) {
        const [d, m, y] = rawDate.split('/').map(n => parseInt(n, 10));
        return { year: y, month: m - 1, day: d, dateObj: new Date(y, m - 1, d), str: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` };
      }
    }
    if (rawDate?.toDate) {
      const dObj = rawDate.toDate();
      return { year: dObj.getFullYear(), month: dObj.getMonth(), day: dObj.getDate(), dateObj: dObj, str: dObj.toISOString().split('T')[0] };
    }
    if (rawDate instanceof Date) {
      return { year: rawDate.getFullYear(), month: rawDate.getMonth(), day: rawDate.getDate(), dateObj: rawDate, str: rawDate.toISOString().split('T')[0] };
    }
    return null;
  };

  // Si hay eventos y el mes seleccionado no tiene, pero otros sí, autocalibrar al mes con eventos más cercano en la primera carga
  useEffect(() => {
    if (events.length > 0) {
      const thisMonthEvents = events.filter(e => {
        const p = parseEventDate(e.date || e.fecha);
        return p && p.month === selectedMonth.getMonth() && p.year === selectedMonth.getFullYear();
      });
      if (thisMonthEvents.length === 0) {
        // Encontrar el evento más próximo o más reciente
        const firstEvent = events[0];
        const pFirst = parseEventDate(firstEvent.date || firstEvent.fecha);
        if (pFirst) {
          setSelectedMonth(new Date(pFirst.year, pFirst.month, 1));
        }
      }
    }
  }, [events.length]);

  const filteredEvents = events.filter(e => {
    const parsed = parseEventDate(e.date || e.fecha);
    if (!parsed) return false;
    return parsed.month === selectedMonth.getMonth() && parsed.year === selectedMonth.getFullYear();
  });

  const displayEvents = filteredEvents.length > 0 ? filteredEvents : events;

  const prevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthYearLabel = selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="player-tab-content player-schedule-tab">
      
      {/* Selector de Mes */}
      <div className="schedule-month-selector">
        <button className="month-nav-btn" onClick={prevMonth} aria-label="Mes anterior">
          <ChevronLeft size={20} />
        </button>
        <span className="month-display-label">
          {monthYearLabel.toUpperCase()}
        </span>
        <button className="month-nav-btn" onClick={nextMonth} aria-label="Mes siguiente">
          <ChevronRight size={20} />
        </button>
      </div>

      {displayEvents.length > 0 ? (
        <div className="events-cards-list">
          {displayEvents.map((evt) => {
            const currentRsvp = rsvps[evt.id]?.status;
            const isMatch = evt.type === 'match';
            const parsed = parseEventDate(evt.date || evt.fecha);
            const dateDisplay = parsed?.dateObj 
              ? parsed.dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) 
              : (evt.date || 'Fecha');

            // LÓGICA DE PRIVACIDAD DE CONVOCATORIA (FASE 2)
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
                    {isMatch ? '🏆 PARTIDO' : '⚽ ENTRENAMIENTO'}
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
                      // ANTES DEL PARTIDO: PRIVACIDAD TOTAL (Solo Convocado / Reserva / No Convocado)
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCalled ? (
                          <>
                            <ShieldCheck size={18} color="#10B981" />
                            <div>
                              <strong style={{ color: '#10B981', fontSize: '0.88rem', display: 'block' }}>
                                ¡Convocado para el partido!
                              </strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                Has sido convocado por el cuerpo técnico. ¡Da el 100% en el campo!
                              </span>
                            </div>
                          </>
                        ) : isReserva ? (
                          <>
                            <AlertTriangle size={18} color="#F59E0B" />
                            <div>
                              <strong style={{ color: '#F59E0B', fontSize: '0.88rem', display: 'block' }}>
                                Reserva / Convocatoria en espera
                              </strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                Mantente atento por si se produce alguna vacante de última hora.
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <HelpCircle size={18} color="var(--text-secondary)" />
                            <div>
                              <strong style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'block' }}>
                                No convocado para esta jornada
                              </strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                ¡Mucho ánimo y a seguir dándolo todo en los entrenamientos!
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      // TRAS EL PARTIDO: DATOS COMPLETOS
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>
                            {isStarter ? '⭐ Titular' : isSub ? '🔄 Suplente' : isCalled ? '📋 Convocado' : 'Sin minutos'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                            ⏱️ {playerStats?.minutesPlayed || 0} min jugados
                          </span>
                        </div>
                        {playerStats?.coachRating && (
                          <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
                            Nota del Míster: {playerStats.coachRating} / 10
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* BOTONES RSVP */}
                <div className="rsvp-section">
                  <span className="rsvp-prompt">
                    {isParentView ? `¿Asistirá ${player?.name || 'tu hijo'} a este evento?` : '¿Asistirás a esta sesión?'}
                  </span>
                  <div className="rsvp-buttons-grid">
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
                            minHeight: '44px'
                          }}
                          onClick={() => handleRsvp(evt.id, opt.id)}
                          disabled={savingEventId === evt.id}
                        >
                          <Icon size={16} color={isSelected ? opt.color : 'currentColor'} />
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
        <div className="schedule-empty-box">
          <CalendarIcon size={36} color="var(--text-muted)" />
          <h4>No hay eventos programados</h4>
          <p>Tu entrenador aún no ha programado sesiones o partidos en el calendario.</p>
        </div>
      )}
    </div>
  );
};

export default PlayerScheduleTab;
