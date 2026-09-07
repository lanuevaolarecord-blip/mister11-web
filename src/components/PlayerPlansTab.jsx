import React, { useState } from 'react';
import { usePlayerPlans } from '../hooks/usePlayerPlans';
import { useExercises } from '../hooks/useExercises';
import { useTeams } from '../hooks/useTeams';
import AssignPlanModal from './AssignPlanModal';
import { CheckCircle, Circle, Activity, Trash2, Plus, Share2, Copy } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useTranslation } from '../hooks/useTranslation';
import './PlayerPlansTab.css';

const PlayerPlansTab = ({ player, activeTeamId }) => {
  const { playerPlans, teamPlans, loading, updatePlayerPlan, removePlayerPlan } = usePlayerPlans(activeTeamId);
  const { exercises } = useExercises(activeTeamId);
  const { activeTeam } = useTeams();
  const { t, isEn, fmtPlural } = useTranslation();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedLink, setSharedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSharePlan = async (plan) => {
    try {
      if (!plan) {
        alert(isEn ? 'Error: Could not retrieve plan details.' : 'Error: No se pudo obtener la información del plan.');
        return;
      }

      // Usamos el id del plan o generamos uno único
      const planDocId = plan.id || `shared_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const resolvedExercises = (plan.exercises || []).map(ex => {
        const found = exercises.find(e => e.id === ex.exerciseId);
        return {
          ...ex,
          name: ex.name || found?.name || found?.titulo || (isEn ? 'Exercise' : 'Ejercicio'),
          description: ex.description || found?.description || found?.descripcion || '',
          category: ex.category || found?.category || found?.categoria || (isEn ? 'General' : 'General'),
          duration: ex.duration || found?.duration || found?.duracion || '15 min'
        };
      });

      const sharedData = {
        title: plan.name || plan.reason || (isEn ? 'Individual Training Plan' : 'Plan de Desarrollo Individual'),
        teamName: activeTeam?.nombre || activeTeam?.name || 'Míster11 Club',
        playerName: player?.name || (isEn ? 'Player' : 'Jugador'),
        playerNumber: player?.number || '11',
        playerPosition: player?.position || 'MC',
        exercises: resolvedExercises,
        coachNotes: plan.description || '',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'sharedPlans', planDocId), sharedData);

      const url = `${window.location.origin}/shared/plan/${planDocId}`;
      setSharedLink(url);
      setShowShareModal(true);
      setCopied(false);
    } catch (err) {
      console.error("Error sharing plan:", err);
      alert(isEn ? 'Error creating public plan link.' : 'Error al crear el enlace público del plan.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sharedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const allPlans = [...playerPlans, ...teamPlans];

  const getExerciseDetails = (exId) => {
    return exercises.find(e => e.id === exId) || {};
  };

  const toggleExerciseCompletion = async (planId, exId, isTeamPlan) => {
    if (isTeamPlan) return; 

    const plan = playerPlans.find(p => p.id === planId);
    if (!plan || !plan.exercises) return;

    const today = new Date().toISOString().slice(0, 10);
    const exIndex = plan.exercises.findIndex(e => e.exerciseId === exId);
    if (exIndex === -1) return;

    const completed = plan.exercises[exIndex].completedDates || [];
    let newCompleted;

    if (completed.includes(today)) {
      newCompleted = completed.filter(d => d !== today);
    } else {
      newCompleted = [...completed, today];
    }

    const updatedExercises = [...plan.exercises];
    updatedExercises[exIndex] = { ...updatedExercises[exIndex], completedDates: newCompleted };

    await updatePlayerPlan(planId, { exercises: updatedExercises });
  };

  return (
    <div className="player-plans-tab">
      <div className="plans-header">
        <h3>{t('plans.routinesAndPrevention')}</h3>
        <button className="btn-primary" onClick={() => setShowAssignModal(true)}>
          <Plus size={16} /> {t('plans.recommendExercises')}
        </button>
      </div>

      {loading ? (
        <p>{t('plans.loadingPlans')}</p>
      ) : allPlans.length === 0 ? (
        <div className="empty-plans">
          <Activity size={40} color="#CBD5E1" />
          <p>{t('plans.noPlansAssigned')}</p>
        </div>
      ) : (
        <div className="plans-list">
          {allPlans.map(plan => {
            const isTeamPlan = !plan.playerId;
            return (
              <div key={plan.id} className="plan-card">
                <div className="plan-card-header">
                  <div>
                    <h4>{plan.name || plan.reason || (isEn ? 'Assigned Plan' : 'Plan Asignado')}</h4>
                    <span className={`plan-badge ${isTeamPlan ? 'team' : 'individual'}`}>
                      {isTeamPlan ? t('plans.badgeTeam') : t('plans.badgeIndividual')}
                    </span>
                  </div>
                  <div className="plan-card-header-actions">
                    <button className="btn-share-plan" onClick={() => handleSharePlan(plan)} title={t('plans.sharePlan')}>
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
                          <span>{ex.frequency || (isEn ? 'Daily' : 'Diario')} | {fmtPlural(completedDates.length, 'plans.streakDays')}</span>
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
              background: '#1B3A2D', color: '#fff', padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTopLeftRadius: '16px', borderTopRightRadius: '16px'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>{t('plans.sharePlan')}</h2>
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
                {isEn ? 'Share this link with your players so they can view their exercise plan without logging in:' : 'Comparte este enlace con tus jugadores para que puedan ver su plan de ejercicios sin necesidad de iniciar sesión:'}
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
                    color: '#0f172a', fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <button 
                onClick={copyToClipboard} 
                style={{
                  background: copied ? '#4CAF7D' : '#1B3A2D', 
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
                {copied ? (isEn ? 'COPIED!' : '¡ENLACE COPIADO!') : (isEn ? 'COPY LINK' : 'COPIAR ENLACE')}
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
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPlansTab;
