import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, XCircle, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const RSVP_OPTIONS = [
  { id: 'going', label: 'Iré', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle },
  { id: 'not_going', label: 'No iré', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', icon: XCircle },
  { id: 'late', label: 'Llegaré tarde', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: AlertTriangle },
  { id: 'justified', label: 'Justificado', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', icon: HelpCircle },
];

export const PlayerScheduleTab = ({ player, team, teamPath }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [savingEventId, setSavingEventId] = useState(null);

  // Escuchar eventos (sesiones y partidos)
  useEffect(() => {
    if (!teamPath) return;

    // 1. Escuchar sesiones
    const sessionsRef = collection(db, `${teamPath}/sessions`);
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
      const matchesRef = collection(db, `${teamPath}/matches`);
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
  }, [teamPath]);

  // Escuchar RSVPs guardados en attendance
  useEffect(() => {
    if (!teamPath) return;

    const attRef = collection(db, `${teamPath}/attendance`);
    const unsubAtt = onSnapshot(attRef, (snap) => {
      const rsvpMap = {};
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const eventId = docSnap.id;
        const playerId = player?.id || user?.uid;
        if (data.playerRsvp && data.playerRsvp[playerId]) {
          rsvpMap[eventId] = data.playerRsvp[playerId];
        }
      });
      setRsvps(rsvpMap);
    });

    return () => unsubAtt();
  }, [teamPath, player?.id, user?.uid]);

  const handleRsvp = async (eventId, optionId) => {
    if (!teamPath || !eventId) return;
    const playerId = player?.id || user?.uid;
    setSavingEventId(eventId);

    try {
      const attDocRef = doc(db, `${teamPath}/attendance`, eventId);
      await setDoc(attDocRef, {
        playerRsvp: {
          [playerId]: {
            status: optionId,
            playerName: player?.name || user?.displayName || 'Jugador',
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

  // Función ultra-robusta para parsear fechas de sesiones, partidos y planning
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

  // Filtrar eventos del mes seleccionado
  const filteredEvents = events.filter(e => {
    const parsed = parseEventDate(e.date || e.fecha);
    if (!parsed) return false;
    return parsed.month === selectedMonth.getMonth() && parsed.year === selectedMonth.getFullYear();
  });

  const monthYearLabel = selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  // Eventos a mostrar: si el mes no tiene eventos pero hay otros en la temporada, permitir ver próximos
  const displayEvents = filteredEvents.length > 0 ? filteredEvents : events;
  const isShowingAllUpcoming = filteredEvents.length === 0 && events.length > 0;

  return (
    <div className="player-tab-content player-schedule-tab">
      <div className="tab-header-box">
        <h2 className="tab-title">Agenda y Convocatorias</h2>
        <p className="tab-subtitle">Confirma tu asistencia a los próximos entrenamientos y partidos.</p>
      </div>

      {/* Selector de Mes */}
      <div className="month-picker-bar">
        <button className="month-nav-btn" onClick={prevMonth} aria-label="Mes anterior">
          <ChevronLeft size={20} />
        </button>
        <span className="month-label">{monthYearLabel.toUpperCase()}</span>
        <button className="month-nav-btn" onClick={nextMonth} aria-label="Mes siguiente">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Listado de Eventos con RSVP */}
      {isShowingAllUpcoming && (
        <div style={{
          background: 'rgba(212, 168, 67, 0.12)',
          border: '1px solid rgba(212, 168, 67, 0.3)',
          borderRadius: '10px',
          padding: '8px 12px',
          marginBottom: '14px',
          fontSize: '12px',
          color: '#D4A843',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          📌 Sin eventos en {monthYearLabel} · Mostrando todas las convocatorias y sesiones del equipo:
        </div>
      )}

      {displayEvents.length > 0 ? (
        <div className="events-cards-list">
          {displayEvents.map((evt) => {
            const currentRsvp = rsvps[evt.id]?.status;
            const isMatch = evt.type === 'match';
            const parsed = parseEventDate(evt.date || evt.fecha);
            const dateDisplay = parsed?.dateObj 
              ? parsed.dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) 
              : (evt.date || 'Fecha');

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

                {/* BOTONES RSVP */}
                <div className="rsvp-section">
                  <span className="rsvp-prompt">¿Asistirás a esta sesión?</span>
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
                            color: isSelected ? opt.color : 'var(--text-secondary)'
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
