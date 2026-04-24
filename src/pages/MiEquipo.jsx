import React, { useState } from 'react';
import './MiEquipo.css';

const POSITIONS = ['TODOS', 'POR', 'DEF', 'LTD', 'LTI', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'];

const INITIAL_PLAYERS = [
  { id: 1, name: 'Hugo García', number: 1, position: 'POR', age: 12, photo: null, category: 'Alevín A', weight: 45, height: 152, foot: 'Derecho', injuries: false },
  { id: 2, name: 'Leo Messi', number: 10, position: 'DEL', age: 12, photo: null, category: 'Alevín A', weight: 42, height: 148, foot: 'Izquierdo', injuries: false },
  { id: 3, name: 'Sergio Ramos', number: 4, position: 'DEF', age: 12, photo: null, category: 'Alevín A', weight: 48, height: 155, foot: 'Derecho', injuries: true, injuryType: 'Esguince tobillo' },
  { id: 4, name: 'Andrés Iniesta', number: 8, position: 'MC', age: 12, photo: null, category: 'Alevín A', weight: 40, height: 145, foot: 'Derecho', injuries: false },
  { id: 5, name: 'Dani Carvajal', number: 2, position: 'LTD', age: 11, photo: null, category: 'Alevín A', weight: 43, height: 150, foot: 'Derecho', injuries: false },
  { id: 6, name: 'Jordi Alba', number: 3, position: 'LTI', age: 12, photo: null, category: 'Alevín A', weight: 39, height: 142, foot: 'Izquierdo', injuries: false },
  { id: 7, name: 'Busquets', number: 5, position: 'MCD', age: 12, photo: null, category: 'Alevín A', weight: 46, height: 160, foot: 'Derecho', injuries: false },
  { id: 8, name: 'Xavi', number: 6, position: 'MC', age: 12, photo: null, category: 'Alevín A', weight: 41, height: 147, foot: 'Derecho', injuries: false },
  { id: 9, name: 'Pedri', number: 16, position: 'MCO', age: 12, photo: null, category: 'Alevín A', weight: 40, height: 150, foot: 'Derecho', injuries: false },
  { id: 10, name: 'Lamine Yamal', number: 19, position: 'EXT', age: 11, photo: null, category: 'Alevín A', weight: 44, height: 158, foot: 'Izquierdo', injuries: false },
  { id: 11, name: 'Gavi', number: 9, position: 'MC', age: 11, photo: null, category: 'Alevín A', weight: 42, height: 149, foot: 'Derecho', injuries: false },
  { id: 12, name: 'Casillas', number: 13, position: 'POR', age: 12, photo: null, category: 'Alevín A', weight: 47, height: 154, foot: 'Derecho', injuries: false },
  { id: 13, name: 'Puyol', number: 5, position: 'DEF', age: 12, photo: null, category: 'Alevín A', weight: 49, height: 152, foot: 'Derecho', injuries: false },
  { id: 14, name: 'Piqué', number: 3, position: 'DEF', age: 12, photo: null, category: 'Alevín A', weight: 50, height: 165, foot: 'Derecho', injuries: false },
  { id: 15, name: 'Villa', number: 7, position: 'DEL', age: 12, photo: null, category: 'Alevín A', weight: 43, height: 148, foot: 'Derecho', injuries: false },
  { id: 16, name: 'Ferran Torres', number: 11, position: 'EXT', age: 12, photo: null, category: 'Alevín A', weight: 45, height: 155, foot: 'Derecho', injuries: false },
];

const emptyPlayer = {
  id: null, name: '', number: '', position: 'MC', age: '', category: 'Alevín A', weight: '', height: '', foot: 'Derecho', injuries: false
};

const MiEquipo = () => {
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [filter, setFilter] = useState('TODOS');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('GENERAL');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState(emptyPlayer);

  const filteredPlayers = filter === 'TODOS' 
    ? players 
    : players.filter(p => p.position === filter);

  const toggleInjuries = (id) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, injuries: !p.injuries } : p
    ));
    if (selectedPlayer?.id === id) {
      setSelectedPlayer(prev => ({ ...prev, injuries: !prev.injuries }));
    }
  };

  const getInitials = (name) => {
    if(!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
  };

  // -- CRUD Actions --
  const handleOpenForm = (player = null) => {
    setEditData(player ? { ...player } : { ...emptyPlayer, id: Date.now() });
    setIsFormOpen(true);
  };

  const handleSavePlayer = () => {
    if(!editData.name || !editData.number) {
      alert("El nombre y el dorsal son obligatorios.");
      return;
    }
    
    setPlayers(prev => {
      const exists = prev.find(p => p.id === editData.id);
      if (exists) {
        return prev.map(p => p.id === editData.id ? editData : p);
      }
      return [...prev, editData];
    });

    if (selectedPlayer?.id === editData.id) {
      setSelectedPlayer(editData);
    }
    
    setIsFormOpen(false);
  };

  const handleDeletePlayer = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar a este jugador?")) {
      setPlayers(prev => prev.filter(p => p.id !== id));
      if (selectedPlayer?.id === id) {
        setSelectedPlayer(null);
      }
      setIsFormOpen(false);
    }
  };

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

      <div className="players-grid">
        {filteredPlayers.map(player => (
          <div key={player.id} className="player-card" onClick={() => setSelectedPlayer(player)}>
            <div className="player-avatar">
              {player.photo ? <img src={player.photo} alt={player.name} /> : <span>{getInitials(player.name)}</span>}
              <div className="player-number">{player.number}</div>
            </div>
            <div className="player-info">
              <h3>{player.name}</h3>
              <div className="player-meta">
                <span className="pos-badge">{player.position}</span>
                <span className="age-info">{player.age} años</span>
              </div>
            </div>
            {player.injuries && <div className="injury-indicator" title="Lesionado">🚑</div>}
          </div>
        ))}
      </div>

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
              <h2>{editData.id && players.find(p=>p.id === editData.id) ? 'Editar Jugador' : 'Nuevo Jugador'}</h2>
              <button className="btn-close" onClick={() => setIsFormOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group-team full">
                <label>Nombre del Jugador *</label>
                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Ej. Lamine Yamal" />
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
                  <label>Edad</label>
                  <input type="number" value={editData.age} onChange={e => setEditData({...editData, age: e.target.value})} />
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
            <div className="modal-footer">
              {editData.id && players.find(p=>p.id === editData.id) && (
                <button className="btn-text-error" onClick={() => handleDeletePlayer(editData.id)}>Eliminar Jugador</button>
              )}
              <div className="footer-actions">
                <button className="btn-outline-team" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                <button className="btn-primary-team" onClick={handleSavePlayer}>Guardar</button>
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
              <button className="btn-edit-icon" onClick={() => handleOpenForm(selectedPlayer)}>✏️</button>
            </div>
            <div className="header-content">
              <div className="large-avatar">
                {selectedPlayer.photo ? <img src={selectedPlayer.photo} alt={selectedPlayer.name} /> : <span>{getInitials(selectedPlayer.name)}</span>}
              </div>
              <h2>{selectedPlayer.name}</h2>
              <p>Dorsal {selectedPlayer.number} · {selectedPlayer.position}</p>
            </div>
          </div>

          <div className="sidebar-tabs">
            {['GENERAL', 'FÍSICO', 'MÉDICO', 'HISTORIAL', 'ESTS.'].map(tab => (
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
                  <span>{selectedPlayer.category}</span>
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
                  <span>{selectedPlayer.age} años</span>
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

            {activeTab === 'MÉDICO' && (
              <div className="tab-pane">
                <div className="medical-toggle">
                  <label>¿Lesión activa?</label>
                  <input 
                    type="checkbox" 
                    checked={selectedPlayer.injuries} 
                    onChange={() => toggleInjuries(selectedPlayer.id)}
                  />
                </div>
                {selectedPlayer.injuries && (
                  <div className="injury-box">
                    <label>Tipo de lesión</label>
                    <p>{selectedPlayer.injuryType || 'No especificada'}</p>
                  </div>
                )}
                <div className="medical-history">
                  <h4>Historial médico</h4>
                  <p className="empty-text">No hay registros previos.</p>
                </div>
              </div>
            )}

            {activeTab === 'HISTORIAL' && (
              <div className="tab-pane">
                <div className="notes-list">
                  <button className="btn-outline-gold">+ Añadir nota</button>
                  <p className="empty-text">Sin notas históricas.</p>
                </div>
              </div>
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
    </div>
  );
};

export default MiEquipo;
