import React, { useState } from 'react';
import { usePlayerPlans } from '../hooks/usePlayerPlans';
import { useExercises } from '../hooks/useExercises';
import AssignPlanModal from './AssignPlanModal';
import { CheckCircle, Circle, Activity, Trash2, Plus } from 'lucide-react';
import './PlayerPlansTab.css';

const PlayerPlansTab = ({ player, activeTeamId }) => {
  const { playerPlans, teamPlans, loading, updatePlayerPlan, removePlayerPlan } = usePlayerPlans(activeTeamId);
  const { exercises } = useExercises(activeTeamId);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const activePlayerPlans = playerPlans.filter(p => p.playerId === player.id && p.active);
  // Team plans that apply to all
  const activeTeamPlansForPlayer = teamPlans.filter(p => p.active && (p.assignedToAll || (p.playerIds && p.playerIds.includes(player.id))));

  const allPlans = [...activePlayerPlans, ...activeTeamPlansForPlayer];

  const getExerciseDetails = (exId) => {
    return exercises.find(e => e.id === exId) || { name: 'Ejercicio Desconocido' };
  };

  const toggleExerciseCompletion = async (planId, exId, isTeamPlan) => {
    const today = new Date().toISOString().slice(0, 10);
    const plan = isTeamPlan ? teamPlans.find(p => p.id === planId) : playerPlans.find(p => p.id === planId);
    if (!plan) return;

    // For team plans, we need a structure that tracks per-player completion. 
    // Simplified for now: assume we only modify individual plans.
    if (isTeamPlan) {
      alert("Para simplificar, el registro de planes de equipo se hace desde el panel general o se replica al jugador. Por ahora marca solo los individuales.");
      return;
    }

    const exIndex = plan.exercises.findIndex(e => e.exerciseId === exId);
    if (exIndex === -1) return;

    const currentCompleted = plan.exercises[exIndex].completedDates || [];
    const hasCompletedToday = currentCompleted.includes(today);

    let newCompleted;
    if (hasCompletedToday) {
      newCompleted = currentCompleted.filter(d => d !== today);
    } else {
      newCompleted = [...currentCompleted, today];
    }

    const updatedExercises = [...plan.exercises];
    updatedExercises[exIndex] = { ...updatedExercises[exIndex], completedDates: newCompleted };

    await updatePlayerPlan(planId, { exercises: updatedExercises });
  };

  return (
    <div className="player-plans-tab">
      <div className="plans-header">
        <h3>Rutinas y Prevención</h3>
        <button className="btn-primary" onClick={() => setShowAssignModal(true)}>
          <Plus size={16} /> Recomendar Ejercicios
        </button>
      </div>

      {loading ? (
        <p>Cargando planes...</p>
      ) : allPlans.length === 0 ? (
        <div className="empty-plans">
          <Activity size={40} color="#CBD5E1" />
          <p>El jugador no tiene planes asignados.</p>
        </div>
      ) : (
        <div className="plans-list">
          {allPlans.map(plan => {
            const isTeamPlan = !plan.playerId;
            return (
              <div key={plan.id} className="plan-card">
                <div className="plan-card-header">
                  <div>
                    <h4>{plan.name || plan.reason || 'Plan Asignado'}</h4>
                    <span className={`plan-badge ${isTeamPlan ? 'team' : 'individual'}`}>
                      {isTeamPlan ? 'Equipo' : 'Individual'}
                    </span>
                  </div>
                  {!isTeamPlan && (
                    <button className="btn-delete-plan" onClick={() => removePlayerPlan(plan.id)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div className="plan-exercises">
                  {plan.exercises && plan.exercises.map((ex, i) => {
                    const exDetails = getExerciseDetails(ex.exerciseId);
                    const completedDates = ex.completedDates || [];
                    const today = new Date().toISOString().slice(0, 10);
                    const isDoneToday = completedDates.includes(today);
                    
                    return (
                      <div key={i} className="plan-exercise-item">
                        <button 
                          className="btn-check-exercise"
                          onClick={() => toggleExerciseCompletion(plan.id, ex.exerciseId, isTeamPlan)}
                          disabled={isTeamPlan}
                        >
                          {isDoneToday ? <CheckCircle size={20} color="#4CAF7D" /> : <Circle size={20} color="#94A3B8" />}
                        </button>
                        <div className="ex-details">
                          <strong>{exDetails.name || exDetails.titulo}</strong>
                          <span>{ex.frequency || 'Diario'} | Racha: {completedDates.length} días</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAssignModal && (
        <AssignPlanModal 
          player={player} 
          activeTeamId={activeTeamId} 
          onClose={() => setShowAssignModal(false)} 
        />
      )}
    </div>
  );
};

export default PlayerPlansTab;
