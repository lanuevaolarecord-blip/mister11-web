import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, ArrowRight, X } from 'lucide-react';

export const TeamRoleSelectorModal = () => {
  const {
    showRoleSelectorModal,
    setShowRoleSelectorModal,
    coachTeams,
    playerTeams,
    changeActiveCoachTeam,
    changeActivePlayerTeam,
    activeCoachTeamId,
    activePlayerTeamId
  } = useAuth();

  if (!showRoleSelectorModal?.isOpen) return null;

  const isCoach = showRoleSelectorModal.role === 'coach';
  const teamsList = isCoach ? coachTeams : playerTeams;
  const activeId = isCoach ? activeCoachTeamId : activePlayerTeamId;

  const handleSelect = (teamId) => {
    if (isCoach) {
      changeActiveCoachTeam(teamId);
      window.location.href = '/';
    } else {
      changeActivePlayerTeam(teamId);
      window.location.href = '/player-dashboard';
    }
    setShowRoleSelectorModal({ isOpen: false, role: null });
  };

  const handleClose = () => {
    setShowRoleSelectorModal({ isOpen: false, role: null });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card, #162228)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header del Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>{isCoach ? '📋' : '⚽'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
                {isCoach ? 'Selecciona tu Equipo (Entrenador)' : 'Selecciona tu Equipo (Jugador)'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary, rgba(255,255,255,0.6))' }}>
                {isCoach ? '¿En qué plantilla deseas dirigir hoy?' : '¿En qué equipo deseas ingresar como jugador?'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Listado de Tarjetas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
          {teamsList.map((team) => {
            const isSelected = team.id === activeId;
            const teamName = team.nombre || team.name || 'Mi Equipo';
            const category = team.categoria || team.category || 'General';
            const roleBadge = isCoach 
              ? (team.staffRole === 'assistant' ? 'Segundo Entrenador' : 'Entrenador Principal')
              : (team.position ? `${team.position} #${team.number || ''}` : 'Jugador');

            return (
              <div
                key={team.id}
                onClick={() => handleSelect(team.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(76, 175, 125, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1.5px solid ${isSelected ? '#4CAF7D' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: isCoach ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: isCoach ? '#3B82F6' : '#10B981'
                  }}>
                    {isCoach ? <Shield size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                      {teamName}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: isSelected ? '#4CAF7D' : 'var(--text-secondary, rgba(255,255,255,0.6))', fontWeight: 600 }}>
                      {category} • {roleBadge}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: isSelected ? '#4CAF7D' : 'var(--text-secondary, #94a3b8)',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  <span>{isSelected ? 'Activo' : 'Entrar'}</span>
                  <ArrowRight size={15} />
                </div>
              </div>
            );
          })}

          {teamsList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary, #94a3b8)' }}>
              No se encontraron equipos registrados para este rol.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
