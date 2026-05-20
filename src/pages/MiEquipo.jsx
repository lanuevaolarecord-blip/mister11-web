import React, { useState } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { calcularEdad } from '../utils/calcularEdad';
import { generateExpediente } from '../utils/pdfGenerator';
import imageCompression from 'browser-image-compression';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PlayerHealthTab from '../components/PlayerHealthTab';
import PlayerPlansTab from '../components/PlayerPlansTab';
import './MiEquipo.css';

const POSITIONS = ['TODOS', 'POR', 'DEF', 'LTD', 'LTI', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'];

const stringToColor = (str) => {
  if (!str) return '#1B3A2D';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 40%)`;
};

const emptyPlayer = {
  name: '', 
  number: '', 
  position: 'MC', 
  age: '', 
  category: 'Alevín A', 
  weight: '', 
  height: '', 
  foot: 'Derecho', 
  currentStatus: 'active',
  medicalObservations: '',
  injuryHistory: [],
  fechaNacimiento: '',
  avatarUrl: ''
};

const MiEquipo = () => {
  const { activeTeamId } = useAuth();
  const { activeTeam } = useTeams();
  const { isPro, limits } = usePlan();
  const { players, loading, addPlayer, updatePlayer, removePlayer } = usePlayers(activeTeamId);
  const [filter, setFilter] = useState('TODOS');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState(emptyPlayer);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formError, setFormError] = useState('');


  const filteredPlayers = filter === 'TODOS' 
    ? players 
    : players.filter(p => p.position === filter);

  const toggleInjuries = async (player) => {
    try {
      await updatePlayer(player.id, { injuries: !player.injuries });
    } catch (error) {
      alert("Error al actualizar estado médico.");
    }
  };

  const getInitials = (name) => {
    if(!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const options = {
        maxSizeMB: 0.2,         // 200KB max per requirements
        maxWidthOrHeight: 512,  
        useWebWorker: true,
        fileType: 'image/webp'
      };
      const compressedFile = await imageCompression(file, options);
      
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
      });
      
      setEditData(prev => ({ ...prev, photoFile: compressedFile, photoPreview: base64data }));
    } catch (error) {
      console.error("Error al procesar foto del jugador:", error);
      alert("No se pudo procesar la imagen. Verifica que sea un archivo válido.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // calcularEdad importada desde src/utils/calcularEdad.js

  // -- CRUD Actions --
  const handleOpenForm = (player = null) => {
    if (!player && !isPro && players.length >= limits.PLAYERS) {
      setUpgradeModal({ open: true, message: `Has alcanzado el límite de ${limits.PLAYERS} jugadores del plan gratuito.` });
      return;
    }
    if (player) {
      setEditData({ ...player });
    } else {
      setEditData({ ...emptyPlayer });
    }
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSavePlayer = async () => {
    if(!editData.name || !editData.number) {
      alert("El nombre y el dorsal son obligatorios.");
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const playerDataToSave = { ...editData };
      delete playerDataToSave.photoFile;
      delete playerDataToSave.photoPreview;

      let savedPlayerId = editData.id;

      if (editData.id) {
        await updatePlayer(editData.id, playerDataToSave);
      } else {
        savedPlayerId = await addPlayer(playerDataToSave);
      }

      // If there is a new photo to upload
      if (editData.photoFile && savedPlayerId) {
        const fileRef = ref(storage, `users/${user?.uid}/teams/${activeTeamId}/players/${savedPlayerId}/avatar`);
        await uploadBytes(fileRef, editData.photoFile);
        const avatarUrl = await getDownloadURL(fileRef);
        await updatePlayer(savedPlayerId, { avatarUrl });
      } else if (editData.avatarUrl === '') {
        // If photo was explicitly removed
        await updatePlayer(savedPlayerId, { avatarUrl: '' });
      }

      setIsFormOpen(false);
    } catch (error) {
      console.error('Error al guardar jugador:', error);
      setFormError('No se pudo guardar. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlayer = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar a este jugador?")) {
      try {
        await removePlayer(id);
        if (selectedPlayer?.id === id) {
          setSelectedPlayer(null);
        }
        setIsFormOpen(false);
      } catch (error) {
        alert("Error al eliminar jugador.");
      }
    }
  };

  if (loading) {
    return <div className="loading-state">Cargando plantilla...</div>;
  }

  return (
    <div className="equipo-page">
      <header className="equipo-header">
        <div className="header-info">
          <h1>MI EQUIPO</h1>
          <p>{players.length} jugadores en la plantilla</p>
        </div>
        <div className="filter-chips">
          {POSITIONS.map(pos => (
            <button 
              key={pos} 
              className={`chip ${filter === pos ? 'active' : ''}`}
              onClick={() => setFilter(pos)}
            >
              {pos}
            </button>
          ))}
        </div>
      </header>

      {players.length === 0 ? (
        <div className="empty-team-state">
          <div className="empty-icon">⚽</div>
          <h2>Tu plantilla está vacía</h2>
          <p>Añade a tus primeros jugadores para empezar a gestionar tu equipo.</p>
          <button className="btn-primary" onClick={() => handleOpenForm(null)}>+ Añadir Jugador</button>
        </div>
      ) : (
        <div className="players-grid">
          {filteredPlayers.map(player => (
            <div key={player.id} className="player-card" onClick={() => setSelectedPlayer(player)}>
              <div className="player-avatar" style={!player.avatarUrl ? { backgroundColor: stringToColor(player.id || player.name) } : {}}>
                {player.avatarUrl ? <img src={player.avatarUrl} alt={player.name} /> : <span style={{ color: '#FFF' }}>{getInitials(player.name)}</span>}
                <div className="player-number">{player.number}</div>
              </div>
              <div className="player-info">
                <h3>{player.name}</h3>
                <div className="player-meta">
                  <span className="pos-badge">{player.position}</span>
                  <span className="age-info">{calcularEdad(player.fechaNacimiento || player.birthDate || player.age).text}</span>
                </div>
              </div>
              {(player.currentStatus === 'injured' || player.currentStatus === 'recovery') && <div className="injury-indicator" title={player.currentStatus === 'injured' ? "Lesionado" : "En recuperación"}>🚑</div>}
            </div>
          ))}
        </div>
      )}

      {/* FAB - Añadir Jugador */}
      <button className="fab-add" onClick={() => handleOpenForm(null)}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* MODAL FORMULARIO JUGADOR */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editData.id ? 'Editar Jugador' : 'Nuevo Jugador'}</h2>
              <button className="btn-close" onClick={() => setIsFormOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group-team full">
                <label>Nombre del Jugador *</label>
                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Ej. Lamine Yamal" />
              </div>
              <div className="form-group-team full" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <label>Foto del Jugador</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: (editData.photoPreview || editData.avatarUrl) ? 'transparent' : stringToColor(editData.id || editData.name),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid var(--border-color)',
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: '20px'
                  }}>
                    {(editData.photoPreview || editData.avatarUrl) ? <img src={editData.photoPreview || editData.avatarUrl} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(editData.name)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="player-photo-upload"
                      style={{ display: 'none' }}
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                    />
                    <label htmlFor="player-photo-upload" style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      background: '#22C55E',
                      color: '#FFFFFF',
                      border: 'none',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '16px' }}>📷</span>
                      {isUploadingPhoto ? 'Procesando...' : 'Subir foto'}
                    </label>
                    {(editData.photoPreview || editData.avatarUrl) && (
                      <button
                        type="button"
                        onClick={() => setEditData({ ...editData, avatarUrl: '', photoPreview: null, photoFile: null })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: '0'
                        }}
                      >
                        Eliminar Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-row-team">
                <div className="form-group-team">
                  <label>Dorsal *</label>
                  <input type="number" value={editData.number} onChange={e => setEditData({...editData, number: e.target.value})} />
                </div>
                <div className="form-group-team">
                  <label>Posición</label>
                  <select value={editData.position} onChange={e => setEditData({...editData, position: e.target.value})}>
                    {POSITIONS.filter(p=>p!=='TODOS').map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
                <div className="form-group-team">
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={editData.fechaNacimiento || editData.birthDate || ''}
                    onChange={e => setEditData({ ...editData, fechaNacimiento: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row-team">
                <div className="form-group-team">
                  <label>Altura (cm)</label>
                  <input type="number" value={editData.height} onChange={e => setEditData({...editData, height: e.target.value})} />
                </div>
                <div className="form-group-team">
                  <label>Peso (kg)</label>
                  <input type="number" value={editData.weight} onChange={e => setEditData({...editData, weight: e.target.value})} />
                </div>
                <div className="form-group-team">
                  <label>Pie Dominante</label>
                  <select value={editData.foot} onChange={e => setEditData({...editData, foot: e.target.value})}>
                    <option value="Derecho">Derecho</option>
                    <option value="Izquierdo">Izquierdo</option>
                    <option value="Ambidiestro">Ambidiestro</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
              {formError && (
                <div style={{
                  background: '#FDEDEC', color: '#C0392B', border: '1px solid #E74C3C',
                  borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 13,
                  width: '100%', textAlign: 'left'
                }}>
                  ⚠️ {formError}
                </div>
              )}
              {editData.id && (
                <button className="btn-text-error" onClick={() => handleDeletePlayer(editData.id)}>Eliminar Jugador</button>
              )}
              <div className="footer-actions">
                <button className="btn-secondary" style={{ marginRight: '10px' }} onClick={() => setIsFormOpen(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleSavePlayer} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR DETALLE JUGADOR */}
      {selectedPlayer && (
        <div className={`player-sidebar ${selectedPlayer ? 'open' : ''}`}>
          <div className="sidebar-header">
            <button className="btn-close" onClick={() => setSelectedPlayer(null)}>✕</button>
            <div className="header-actions-right">
              <button className="btn-edit-icon" style={{marginRight: '8px'}} onClick={() => generateExpediente(selectedPlayer, activeTeam)} title="Exportar Expediente">📄</button>
              <button className="btn-edit-icon" onClick={() => handleOpenForm(selectedPlayer)}>✏️</button>
            </div>
            <div className="header-content">
              <div className="large-avatar" style={!selectedPlayer.avatarUrl ? { backgroundColor: stringToColor(selectedPlayer.id || selectedPlayer.name) } : {}}>
                {selectedPlayer.avatarUrl ? <img src={selectedPlayer.avatarUrl} alt={selectedPlayer.name} /> : <span style={{ color: '#FFF' }}>{getInitials(selectedPlayer.name)}</span>}
              </div>
              <h2>{selectedPlayer.name}</h2>
              <p>Dorsal {selectedPlayer.number} · {selectedPlayer.position}</p>
            </div>
          </div>

          <div className="sidebar-tabs">
            {['GENERAL', 'FÍSICO', 'SALUD', 'PLANES', 'ESTS.'].map(tab => (
              <button 
                key={tab} 
                className={activeTab === tab ? 'active' : ''} 
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="sidebar-body">
            {activeTab === 'GENERAL' && (
              <div className="tab-pane">
                <div className="info-row">
                  <label>Categoría</label>
                  <span>{activeTeam?.categoria || selectedPlayer.category}</span>
                </div>
                <div className="info-row">
                  <label>Pie dominante</label>
                  <span>{selectedPlayer.foot}</span>
                </div>
                <div className="info-row">
                  <label>Posición Principal</label>
                  <span className="badge-pos">{selectedPlayer.position}</span>
                </div>
                <div className="info-row">
                  <label>Edad</label>
                  <span>
                    {calcularEdad(selectedPlayer.fechaNacimiento || selectedPlayer.birthDate || selectedPlayer.age).text} 
                    ({calcularEdad(selectedPlayer.fechaNacimiento || selectedPlayer.birthDate || selectedPlayer.age).cat})
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'FÍSICO' && (
              <div className="tab-pane">
                <div className="physical-stats">
                  <div className="stat-item">
                    <div className="stat-val">{selectedPlayer.height || '--'}<span>cm</span></div>
                    <label>Altura</label>
                  </div>
                  <div className="stat-item">
                    <div className="stat-val">{selectedPlayer.weight || '--'}<span>kg</span></div>
                    <label>Peso</label>
                  </div>
                  <div className="stat-item">
                    <div className="stat-val">{(selectedPlayer.weight && selectedPlayer.height) ? (selectedPlayer.weight / Math.pow(selectedPlayer.height/100, 2)).toFixed(1) : '--'}</div>
                    <label>IMC</label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'SALUD' && (
              <PlayerHealthTab player={selectedPlayer} teamId={activeTeamId} />
            )}

            {activeTab === 'PLANES' && (
              <PlayerPlansTab player={selectedPlayer} activeTeamId={activeTeamId} />
            )}

            {activeTab === 'ESTS.' && (
              <div className="tab-pane">
                <div className="stats-grid">
                  <div className="stat-card"><span>Partidos</span> <strong>0</strong></div>
                  <div className="stat-card"><span>Goles</span> <strong>0</strong></div>
                  <div className="stat-card"><span>Asist.</span> <strong>0</strong></div>
                  <div className="stat-card"><span>Minutos</span> <strong>0</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <UpgradeModal 
        isOpen={upgradeModal.open} 
        onClose={() => setUpgradeModal({ ...upgradeModal, open: false })}
        message={upgradeModal.message}
      />
    </div>
  );
};

export default MiEquipo;
