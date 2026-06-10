import React, { useState } from 'react';
import { usePlayerPlans } from '../hooks/usePlayerPlans';
import { useExercises } from '../hooks/useExercises';
import { useTeams } from '../hooks/useTeams';
import AssignPlanModal from './AssignPlanModal';
import { CheckCircle, Circle, Activity, Trash2, Plus, Share2, Copy } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import './PlayerPlansTab.css';

const PlayerPlansTab = ({ player, activeTeamId }) => {
  const { playerPlans, teamPlans, loading, updatePlayerPlan, removePlayerPlan } = usePlayerPlans(activeTeamId);
  const { exercises } = useExercises(activeTeamId);
  const { activeTeam } = useTeams();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedLink, setSharedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSharePlan = async (plan) => {
    try {
      if (!plan) {
        alert("Error: No se pudo obtener la información del plan.");
        return;
      }

      // Usamos el id del plan o generamos uno único
      const planDocId = plan.id || `shared_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const resolvedExercises = (plan.exercises || []).map(ex => {
        const details = exercises.find(e => e.id === ex.exerciseId) || { name: ex.exerciseId || 'Ejercicio', description: '' };
        return {
          name: details.name || details.titulo || ex.exerciseId || 'Ejercicio',
          description: details.description || details.descripcion || '',
          frequency: ex.frequency || 'Diario'
        };
      });

      const sharedPlanData = {
        name: plan.name || plan.reason || 'Plan Asignado',
        teamName: activeTeam ? (activeTeam.nombre || activeTeam.name || '') : '',
        exercises: resolvedExercises,
        sharedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'sharedPlans', planDocId), sharedPlanData);

      const shareUrl = `${window.location.origin}/shared/plan/${planDocId}`;
      setSharedLink(shareUrl);
      setShowShareModal(true);
      setCopied(false);
    } catch (error) {
      console.error("Error al compartir el plan:", error);
      alert(`Error al generar el enlace: ${error.message || 'Error desconocido. Verifica tu conexión e inténtalo de nuevo.'}`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                  <div className="plan-card-header-actions">
                    <button className="btn-share-plan" onClick={() => handleSharePlan(plan)} title="Compartir Plan">
                      <Share2 size={16} />
                    </button>
                    {!isTeamPlan && (
                      <button className="btn-delete-plan" onClick={() => removePlayerPlan(plan.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
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

      {showShareModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '450px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: '#004B87', color: '#fff', padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTopLeftRadius: '16px', borderTopRightRadius: '16px'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>🔗 Compartir Plan</h2>
              <button onClick={() => setShowShareModal(false)} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                borderRadius: '8px', padding: '8px', cursor: 'pointer', minHeight: '44px', minWidth: '44px'
              }}>
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.5 }}>
                Comparte este enlace con tus jugadores para que puedan ver su plan de ejercicios sin necesidad de iniciar sesión:
              </p>
              <div style={{
                display: 'flex', gap: '8px', background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px',
                alignItems: 'center', overflow: 'hidden'
              }}>
                <input
                  type="text"
                  readOnly
                  value={sharedLink}
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    fontSize: '0.85rem', color: '#334155', outline: 'none', padding: 0
                  }}
                  onClick={(e) => e.target.select()}
                />
              </div>

              {/* Action Buttons */}
              <button 
                onClick={handleCopyLink} 
                style={{
                  background: copied ? '#4CAF7D' : '#004B87', 
                  color: 'white', 
                  fontWeight: 700, 
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textTransform: 'uppercase',
                  transition: 'background-color 0.2s'
                }}
              >
                <Copy size={16} />
                {copied ? '¡ENLACE COPIADO!' : 'COPIAR ENLACE'}
              </button>
              
              <button 
                onClick={() => setShowShareModal(false)} 
                style={{
                  background: 'transparent', 
                  color: '#475569', 
                  fontWeight: 600, 
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPlansTab;
