import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { showToast } from '../utils/toast';
import InviteCoachModal from './InviteCoachModal';
import { Sparkles, Users, Layers, Plus, Shield, Check, X } from 'lucide-react';

const ClubManagement = () => {
  const { club, clubId, clubRole, user } = useAuth();
  const { teams, addTeam } = useTeams();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedCoachForTeams, setSelectedCoachForTeams] = useState(null);
  const [coachSelectedTeams, setCoachSelectedTeams] = useState([]);
  const [savingTeams, setSavingTeams] = useState(false);

  const clubTeams = teams.filter(t => t.source === 'club');

  const handleSaveTeams = async () => {
    if (!selectedCoachForTeams) return;
    setSavingTeams(true);
    try {
      const coachEmail = selectedCoachForTeams.email;
      const coachUid = selectedCoachForTeams.uid || null;

      // 1. Update coaches list on club document
      const updatedCoaches = (club?.coaches || []).map(c => {
        if (c.email === coachEmail) {
          return { ...c, assignedTeams: coachSelectedTeams };
        }
        return c;
      });
      await updateDoc(doc(db, 'clubs', clubId), { coaches: updatedCoaches });

      // 2. If user already accepted (has uid), sync with each team's assignedCoaches list
      if (coachUid) {
        for (const team of clubTeams) {
          const teamRef = doc(db, 'clubs', clubId, 'teams', team.id);
          if (coachSelectedTeams.includes(team.id)) {
            await updateDoc(teamRef, {
              assignedCoaches: arrayUnion(coachUid)
            });
          } else {
            const teamSnap = await getDoc(teamRef);
            if (teamSnap.exists()) {
              const tData = teamSnap.data();
              const currentCoaches = tData.assignedCoaches || [];
              if (currentCoaches.includes(coachUid)) {
                await updateDoc(teamRef, {
                  assignedCoaches: currentCoaches.filter(id => id !== coachUid)
                });
              }
            }
          }
        }
      }

      showToast("Equipos asignados correctamente.", "success");
      setSelectedCoachForTeams(null);
    } catch (err) {
      console.error("Error saving coach teams:", err);
      showToast("Error al asignar equipos.", "error");
    } finally {
      setSavingTeams(false);
    }
  };

  const handleCreateClubTeam = async () => {
    const name = window.prompt("Nombre del equipo:");
    if (!name) return;
    const category = window.prompt("Categoría (Ej. Juvenil A, Femenino Senior):", "General");
    const season = window.prompt("Temporada (Ej. 2026-27):", "2026-27");
    try {
      await addTeam({ nombre: name, categoria: category || 'General', temporada: season || '2026-27' }, 'club');
      showToast("Equipo del club creado correctamente.", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al crear el equipo del club.", "error");
    }
  };

  return (
    <div className="settings-grid">
      {/* 1. SECCIÓN SUSCRIPCIÓN DEL CLUB */}
      <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header-icon">
          <Sparkles size={20} style={{ color: 'var(--accent-gold)' }} />
          <h3>Estado de Suscripción del Club</h3>
        </div>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span className="plan-badge-large" style={{ background: 'rgba(33,150,243,0.15)', color: '#2196F3', borderColor: 'rgba(33,150,243,0.3)', marginRight: '10px', display: 'inline-block', fontWeight: 'bold' }}>
              PLAN CLUB ACTIVO
            </span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Suscripción administrada centralizadamente. Todos los miembros agregados disfrutan de acceso Pro ilimitado mientras gestionan los equipos de la organización.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN ENTRENADORES */}
      <div className="settings-card" style={{ flex: 1, minWidth: '320px' }}>
        <div className="card-header-icon" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--accent-gold)" />
            <h3 style={{ color: 'var(--text-primary)' }}>Entrenadores de la Organización</h3>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setIsInviteModalOpen(true)}
            style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: '36px' }}
          >
            <Plus size={14} style={{ marginRight: '4px' }} /> Invitar
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(club?.coaches || []).map((coach, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px',
                background: 'var(--bg-card)' 
              }}>
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem', margin: 0 }}>
                    {coach.email}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      background: coach.role === 'owner' ? 'rgba(76,175,125,0.15)' : 'rgba(33,150,243,0.15)',
                      color: coach.role === 'owner' ? '#4CAF7D' : '#2196F3'
                    }}>
                      {coach.role === 'owner' ? 'Propietario' : 'Entrenador'}
                    </span>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      background: coach.status === 'active' ? 'rgba(76,175,125,0.15)' : 'rgba(255,165,0,0.15)',
                      color: coach.status === 'active' ? '#4CAF7D' : '#FFA500'
                    }}>
                      {coach.status === 'active' ? 'Activo' : 'Pendiente'}
                    </span>
                  </div>
                  {coach.role !== 'owner' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', margin: 0 }}>
                      Equipos asignados: {coach.assignedTeams?.length || 0}
                    </p>
                  )}
                </div>

                {coach.role !== 'owner' && (
                  <button 
                    className="btn-primary outline" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '36px' }}
                    onClick={() => {
                      setSelectedCoachForTeams(coach);
                      setCoachSelectedTeams(coach.assignedTeams || []);
                    }}
                  >
                    Asignar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN EQUIPOS DEL CLUB */}
      <div className="settings-card" style={{ flex: 1, minWidth: '320px' }}>
        <div className="card-header-icon" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-gold)" />
            <h3 style={{ color: 'var(--text-primary)' }}>Equipos de la Organización</h3>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleCreateClubTeam}
            style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: '36px' }}
          >
            <Plus size={14} style={{ marginRight: '4px' }} /> Nuevo Equipo
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {clubTeams.map((team, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px 12px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px',
                background: 'var(--bg-card)'
              }}>
                <div>
                  <p style={{ fontWeight: '600', margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{team.nombre}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {team.categoria} · {team.temporada}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#2196F3', fontWeight: 'bold' }}>
                  ID: {team.id}
                </span>
              </div>
            ))}
            {clubTeams.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '10px 0' }}>
                No hay equipos creados en la organización todavía.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ASIGNACIÓN DE EQUIPOS */}
      {selectedCoachForTeams && (
        <div className="modal-overlay" onClick={() => setSelectedCoachForTeams(null)}>
          <div className="modal-content" style={{ maxWidth: '450px', borderRadius: '12px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={22} style={{ color: 'var(--primary-color)' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Asignar Equipos</h3>
              </div>
              <button onClick={() => setSelectedCoachForTeams(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' }}>
                <X size={20} color="var(--text-secondary)" />
              </button>
            </header>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Selecciona los equipos de la organización que podrá gestionar <strong>{selectedCoachForTeams.email}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
              {clubTeams.map(team => {
                const isChecked = coachSelectedTeams.includes(team.id);
                return (
                  <label key={team.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    background: isChecked ? 'rgba(76,175,125,0.06)' : 'var(--bg-card)',
                    transition: 'all 0.15s ease'
                  }}>
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCoachSelectedTeams(prev => [...prev, team.id]);
                        } else {
                          setCoachSelectedTeams(prev => prev.filter(id => id !== team.id));
                        }
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>{team.nombre}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{team.categoria} · {team.temporada}</span>
                    </div>
                  </label>
                );
              })}
              {clubTeams.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Crea al menos un equipo de la organización primero.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-primary outline" 
                onClick={() => setSelectedCoachForTeams(null)}
                style={{ minHeight: '44px', padding: '0 16px' }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleSaveTeams}
                disabled={savingTeams || clubTeams.length === 0}
                style={{ minHeight: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {savingTeams ? 'Guardando...' : <><Check size={16} /> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INVITAR ENTRENADOR */}
      <InviteCoachModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        clubId={clubId}
        clubName={club?.name}
        currentCoaches={club?.coaches}
        onInviteSuccess={(updated) => {
          // El listener en tiempo real de AuthContext actualizará el estado club
        }}
      />
    </div>
  );
};

export default ClubManagement;
