import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Dumbbell, 
  TrendingUp, 
  Sparkles, 
  Award, 
  Clock, 
  Flame, 
  MessageSquare 
} from 'lucide-react';
import './PlayerPlansPortalTab.css';

export const PlayerPlansPortalTab = ({ player, team, teamPath }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Escuchar planes asignados a este jugador
  useEffect(() => {
    if (!teamPath || !player?.id) {
      setLoading(false);
      return;
    }

    const plansRef = collection(db, `${teamPath}/playerPlans`);
    const unsub = onSnapshot(plansRef, (snapshot) => {
      const allPlans = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const myPlans = allPlans.filter(p => p.playerId === player.id && p.active !== false);
      setPlans(myPlans);
      setLoading(false);
    }, (err) => {
      console.warn('[PlayerPlansPortalTab] Error cargando planes:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [teamPath, player?.id]);

  const toggleExerciseDay = async (planId, exIndex) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan || !plan.exercises?.[exIndex]) return;

    try {
      const exercise = plan.exercises[exIndex];
      const completedDates = exercise.completedDates || [];
      const isDoneToday = completedDates.includes(todayStr);

      const newDates = isDoneToday 
        ? completedDates.filter(d => d !== todayStr) 
        : [...completedDates, todayStr];

      const updatedExercises = [...plan.exercises];
      updatedExercises[exIndex] = {
        ...exercise,
        completedDates: newDates
      };

      const planDocRef = doc(db, `${teamPath}/playerPlans`, planId);
      await updateDoc(planDocRef, { exercises: updatedExercises });

      if (!isDoneToday) {
        showToast('¡Ejercicio completado hoy! +10 XP', 'success');
      }
    } catch (err) {
      console.error('Error actualizando ejercicio:', err);
      showToast('Error al actualizar ejercicio', 'error');
    }
  };

  return (
    <div className="player-tab-content player-plans-portal-tab">
      <div className="tab-header-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Target size={22} color="#10B981" />
          <h2 className="tab-title">Plan de Mejora Individual</h2>
        </div>
        <p className="tab-subtitle">
          Objetivos personalizados, tareas técnicas y rutinas preventivas asignadas por tu cuerpo técnico.
        </p>
      </div>

      {/* TARJETA RESUMEN DE PROGRESO */}
      <div className="hud-card plan-summary-card">
        <div className="hud-header">
          <span className="hud-badge">
            <TrendingUp size={14} /> EVOLUCIÓN INDIVIDUAL
          </span>
          <span className="plan-count-badge">
            {plans.length} {plans.length === 1 ? 'Plan Activo' : 'Planes Activos'}
          </span>
        </div>

        <div className="plan-stats-row">
          <div className="plan-stat-item">
            <span className="stat-value">{player?.position || 'MC'}</span>
            <span className="stat-label">Posición</span>
          </div>
          <div className="plan-stat-item">
            <span className="stat-value">{player?.category || team?.categoria || 'Juvenil'}</span>
            <span className="stat-label">Categoría</span>
          </div>
          <div className="plan-stat-item">
            <span className="stat-value" style={{ color: '#10B981' }}>Activo</span>
            <span className="stat-label">Seguimiento</span>
          </div>
        </div>
      </div>

      {/* LISTADO DE PLANES Y RUTINAS */}
      {loading ? (
        <div className="plans-loading">Cargando tu plan de mejora...</div>
      ) : plans.length === 0 ? (
        <div className="hud-card empty-plans-card">
          <div className="empty-icon-wrap">
            <Award size={32} color="#D4A843" />
          </div>
          <h3>¡Todo al día!</h3>
          <p>
            Tu entrenador aún no ha asignado un plan individual de ejercicios para esta semana. Sigue dando el 100% en cada entrenamiento.
          </p>
        </div>
      ) : (
        <div className="plans-list-container">
          {plans.map((plan) => {
            const exercises = plan.exercises || [];
            const completedCount = exercises.filter(e => (e.completedDates || []).includes(todayStr)).length;
            const progressPct = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

            return (
              <div key={plan.id} className="hud-card player-plan-item-card">
                <div className="plan-item-top">
                  <div className="plan-type-pill">
                    <Dumbbell size={14} /> {plan.type || 'Rutina Técnica y Preventiva'}
                  </div>
                  <span className="plan-date-tag">
                    {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'Activo'}
                  </span>
                </div>

                <h3 className="plan-item-title">{plan.title || plan.name || 'Plan de Desarrollo Individual'}</h3>
                
                {plan.description && (
                  <p className="plan-item-desc">{plan.description}</p>
                )}

                {/* FEEDBACK DEL ENTRENADOR */}
                {plan.coachNotes && (
                  <div className="coach-feedback-box">
                    <div className="feedback-title">
                      <MessageSquare size={14} color="#10B981" />
                      <span>Mensaje de tu Entrenador:</span>
                    </div>
                    <p className="feedback-text">"{plan.coachNotes}"</p>
                  </div>
                )}

                {/* PROGRESO DE HOY */}
                {exercises.length > 0 && (
                  <div className="plan-exercises-section">
                    <div className="exercises-header-row">
                      <span className="exercises-title">Ejercicios para Hoy:</span>
                      <span className="exercises-counter">{completedCount} / {exercises.length} hechos</span>
                    </div>

                    <div className="exercises-checklist">
                      {exercises.map((ex, idx) => {
                        const isDone = (ex.completedDates || []).includes(todayStr);
                        return (
                          <div 
                            key={idx} 
                            className={`exercise-check-row ${isDone ? 'done' : ''}`}
                            onClick={() => toggleExerciseDay(plan.id, idx)}
                          >
                            <button type="button" className="check-btn">
                              {isDone ? (
                                <CheckCircle2 size={20} color="#10B981" />
                              ) : (
                                <Circle size={20} color="rgba(255,255,255,0.3)" />
                              )}
                            </button>

                            <div className="exercise-info">
                              <span className="exercise-name">{ex.name || ex.exerciseName || `Ejercicio #${idx + 1}`}</span>
                              {ex.sets && (
                                <span className="exercise-meta">{ex.sets} series · {ex.reps || ex.duration || 'Al fallo técnico'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
