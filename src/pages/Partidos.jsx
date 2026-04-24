import React, { useState } from 'react';
import './Partidos.css';

// --- MOCK DATA ---
const MOCK_PLAYERS = [
  { id: 1, name: 'Hugo García', number: 1, position: 'POR' },
  { id: 2, name: 'Leo Messi', number: 10, position: 'DEL' },
  { id: 3, name: 'Sergio Ramos', number: 4, position: 'DEF' },
  { id: 4, name: 'Andrés Iniesta', number: 8, position: 'MC' },
  { id: 5, name: 'Dani Carvajal', number: 2, position: 'LTD' },
  { id: 6, name: 'Jordi Alba', number: 3, position: 'LTI' },
  { id: 7, name: 'Busquets', number: 5, position: 'MCD' },
  { id: 8, name: 'Xavi', number: 6, position: 'MC' },
  { id: 9, name: 'Pedri', number: 16, position: 'MCO' },
  { id: 10, name: 'Lamine Yamal', number: 19, position: 'EXT' },
  { id: 11, name: 'Gavi', number: 9, position: 'MC' },
  { id: 12, name: 'Casillas', number: 13, position: 'POR' },
  { id: 13, name: 'Puyol', number: 5, position: 'DEF' },
  { id: 14, name: 'Piqué', number: 3, position: 'DEF' },
  { id: 15, name: 'Villa', number: 7, position: 'DEL' },
  { id: 16, name: 'Ferran Torres', number: 11, position: 'EXT' }
];

const MOCK_MATCHES = [
  { id: 1, rival: 'Real Madrid Alevín', date: '2026-04-10', time: '10:00', location: 'Ciudad Deportiva', type: 'Local', status: 'Terminado', goalsFor: 3, goalsAgainst: 1, lineup: '4-3-3' },
  { id: 2, rival: 'Atlético de Madrid', date: '2026-04-17', time: '12:30', location: 'Cerro del Espino', type: 'Visitante', status: 'Terminado', goalsFor: 2, goalsAgainst: 2, lineup: '4-4-2' },
  { id: 3, rival: 'Sevilla FC', date: '2026-04-24', time: '11:00', location: 'Estadio Principal', type: 'Local', status: 'Pendiente', goalsFor: 0, goalsAgainst: 0, lineup: '4-3-3' }
];

const FORMATIONS = {
  '4-3-3': [
    { pos: 'POR', top: '85%', left: '50%' },
    { pos: 'LTD', top: '65%', left: '85%' },
    { pos: 'DEF', top: '70%', left: '65%' },
    { pos: 'DEF', top: '70%', left: '35%' },
    { pos: 'LTI', top: '65%', left: '15%' },
    { pos: 'MCD', top: '45%', left: '50%' },
    { pos: 'MC', top: '35%', left: '75%' },
    { pos: 'MC', top: '35%', left: '25%' },
    { pos: 'EXT', top: '15%', left: '85%' },
    { pos: 'DEL', top: '10%', left: '50%' },
    { pos: 'EXT', top: '15%', left: '15%' }
  ],
  '4-4-2': [
    { pos: 'POR', top: '85%', left: '50%' },
    { pos: 'LTD', top: '65%', left: '85%' },
    { pos: 'DEF', top: '70%', left: '65%' },
    { pos: 'DEF', top: '70%', left: '35%' },
    { pos: 'LTI', top: '65%', left: '15%' },
    { pos: 'MD', top: '40%', left: '85%' },
    { pos: 'MC', top: '45%', left: '60%' },
    { pos: 'MC', top: '45%', left: '40%' },
    { pos: 'MI', top: '40%', left: '15%' },
    { pos: 'DEL', top: '15%', left: '65%' },
    { pos: 'DEL', top: '15%', left: '35%' }
  ]
};

const Partidos = () => {
  const [matches, setMatches] = useState(MOCK_MATCHES);
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'EDIT'
  const [filterMode, setFilterMode] = useState('Todos'); // 'Todos', 'Pendientes', 'Terminados'
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  // Edit State Tabs
  const [editTab, setEditTab] = useState('PRE-PARTIDO');
  const [matchData, setMatchData] = useState({});
  const [calledPlayers, setCalledPlayers] = useState([]); // Array of IDs

  const handleNewMatch = () => {
    const newMatch = {
      id: Date.now(),
      rival: '',
      date: '',
      time: '',
      location: '',
      type: 'Local',
      status: 'Pendiente',
      goalsFor: 0,
      goalsAgainst: 0,
      lineup: '4-3-3',
      events: [] // Goals, cards
    };
    setMatchData(newMatch);
    setCalledPlayers(MOCK_PLAYERS.map(p => p.id).slice(0, 16)); // Auto select 16
    setEditTab('PRE-PARTIDO');
    setViewMode('EDIT');
  };

  const handleEditMatch = (match) => {
    setMatchData({ ...match });
    setCalledPlayers(MOCK_PLAYERS.map(p => p.id).slice(0, 16)); // Mock called
    setEditTab('PRE-PARTIDO');
    setViewMode('EDIT');
  };

  const togglePlayerCall = (id) => {
    if (calledPlayers.includes(id)) {
      setCalledPlayers(calledPlayers.filter(p => p !== id));
    } else {
      if (calledPlayers.length >= 18) return alert("Máximo 18 convocados permitidos.");
      setCalledPlayers([...calledPlayers, id]);
    }
  };

  const handleSaveMatch = () => {
    if (!matchData.rival) return alert("El nombre del rival es obligatorio.");
    
    setMatches(prev => {
      const exists = prev.find(m => m.id === matchData.id);
      if (exists) return prev.map(m => m.id === matchData.id ? matchData : m);
      return [...prev, matchData];
    });
    
    setViewMode('LIST');
  };

  const filteredMatches = matches.filter(m => {
    if (filterMode === 'Pendientes') return m.status === 'Pendiente';
    if (filterMode === 'Terminados') return m.status === 'Terminado';
    return true; // 'Todos'
  });

  return (
    <div className="partidos-page">
      <header className="partidos-header">
        <div className="header-top">
          <h1>GESTIÓN DE PARTIDOS</h1>
          {viewMode === 'LIST' && (
            <button className="btn-primary" onClick={handleNewMatch}>+ Nuevo Partido</button>
          )}
          {viewMode === 'EDIT' && (
            <div className="header-actions">
              <button className="btn-outline" onClick={() => setViewMode('LIST')}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveMatch}>Guardar Partido</button>
            </div>
          )}
        </div>
      </header>

      {viewMode === 'LIST' && (
        <div className="partidos-list-container">
          <div className="list-filters">
            <button 
              className={`filter-tab ${filterMode === 'Todos' ? 'active' : ''}`}
              onClick={() => setFilterMode('Todos')}
            >Todos</button>
            <button 
              className={`filter-tab ${filterMode === 'Pendientes' ? 'active' : ''}`}
              onClick={() => setFilterMode('Pendientes')}
            >Pendientes</button>
            <button 
              className={`filter-tab ${filterMode === 'Terminados' ? 'active' : ''}`}
              onClick={() => setFilterMode('Terminados')}
            >Terminados</button>
          </div>
          
          <div className="matches-grid">
            {filteredMatches.map(m => (
              <div key={m.id} className="match-card" onClick={() => handleEditMatch(m)}>
                <div className="mc-header">
                  <span className={`status-badge ${m.status.toLowerCase()}`}>{m.status}</span>
                  <span className="mc-date">{m.date.split('-').reverse().join('/')} - {m.time}</span>
                </div>
                
                <div className="mc-body">
                  <div className="team-local">
                    <span className="t-name">{m.type === 'Local' ? 'Míster11 FC' : m.rival}</span>
                  </div>
                  <div className="mc-score">
                    {m.status === 'Terminado' ? (
                      <strong>{m.type === 'Local' ? m.goalsFor : m.goalsAgainst} - {m.type === 'Local' ? m.goalsAgainst : m.goalsFor}</strong>
                    ) : (
                      <span className="vs">VS</span>
                    )}
                  </div>
                  <div className="team-visit">
                    <span className="t-name">{m.type === 'Visitante' ? 'Míster11 FC' : m.rival}</span>
                  </div>
                </div>
                
                <div className="mc-footer">
                  <span>📍 {m.location}</span>
                  <span>🛡️ Formación: {m.lineup}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'EDIT' && (
        <div className="partidos-editor-container">
          <div className="editor-tabs">
            {['PRE-PARTIDO', 'CONVOCATORIA', 'ALINEACIÓN', 'POST-PARTIDO'].map(tab => (
              <button 
                key={tab} 
                className={`e-tab ${editTab === tab ? 'active' : ''}`}
                onClick={() => setEditTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="editor-content">
            {/* --- PRE-PARTIDO --- */}
            {editTab === 'PRE-PARTIDO' && (
              <div className="tab-pane pre-partido">
                <h3>Datos Generales del Encuentro</h3>
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Equipo Rival</label>
                    <input type="text" value={matchData.rival} onChange={e => setMatchData({...matchData, rival: e.target.value})} placeholder="Ej. FC Barcelona Alevín" />
                  </div>
                  <div className="form-group">
                    <label>Fecha</label>
                    <input type="date" value={matchData.date} onChange={e => setMatchData({...matchData, date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Hora</label>
                    <input type="time" value={matchData.time} onChange={e => setMatchData({...matchData, time: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Local / Visitante</label>
                    <select value={matchData.type} onChange={e => setMatchData({...matchData, type: e.target.value})}>
                      <option value="Local">Local</option>
                      <option value="Visitante">Visitante</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estadio / Lugar</label>
                    <input type="text" value={matchData.location} onChange={e => setMatchData({...matchData, location: e.target.value})} placeholder="Ej. Ciudad Deportiva" />
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <select value={matchData.status} onChange={e => setMatchData({...matchData, status: e.target.value})}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Terminado">Terminado</option>
                      <option value="Suspendido">Suspendido</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* --- CONVOCATORIA --- */}
            {editTab === 'CONVOCATORIA' && (
              <div className="tab-pane convocatoria">
                <div className="conv-header">
                  <h3>Selección de Jugadores</h3>
                  <span className={`conv-count ${calledPlayers.length > 18 ? 'error' : ''}`}>
                    {calledPlayers.length} / 18 Seleccionados
                  </span>
                </div>
                <div className="players-checklist large">
                  {MOCK_PLAYERS.map(p => {
                    const isSelected = calledPlayers.includes(p.id);
                    return (
                      <div 
                        key={p.id} 
                        className={`player-check-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => togglePlayerCall(p.id)}
                      >
                        <div className="p-num">{p.number}</div>
                        <div className="p-info">
                          <span className="p-name">{p.name}</span>
                          <span className="p-pos">{p.position}</span>
                        </div>
                        <div className="check-indicator">{isSelected ? '✓' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- ALINEACIÓN --- */}
            {editTab === 'ALINEACIÓN' && (
              <div className="tab-pane alineacion">
                <div className="alin-sidebar">
                  <h3>Formación Táctica</h3>
                  <select 
                    className="form-select"
                    value={matchData.lineup} 
                    onChange={e => setMatchData({...matchData, lineup: e.target.value})}
                  >
                    <option value="4-3-3">4-3-3 Ofensivo</option>
                    <option value="4-4-2">4-4-2 Clásico</option>
                  </select>

                  <div className="titulares-list mt-3">
                    <h4>XI Titular</h4>
                    <p className="hint">Arrastra jugadores (Simulado)</p>
                    {calledPlayers.slice(0,11).map(id => {
                      const p = MOCK_PLAYERS.find(pl => pl.id === id);
                      return <div key={id} className="alin-player-list-item"><span>{p.number}</span> {p.name}</div>
                    })}
                    <h4 className="mt-3">Suplentes</h4>
                    {calledPlayers.slice(11).map(id => {
                      const p = MOCK_PLAYERS.find(pl => pl.id === id);
                      return <div key={id} className="alin-player-list-item sub"><span>{p.number}</span> {p.name}</div>
                    })}
                  </div>
                </div>
                <div className="alin-main">
                  <div className="mini-pitch-container">
                    <div className="mini-pitch">
                      {/* Líneas del campo */}
                      <div className="pitch-line center-line"></div>
                      <div className="pitch-circle center-circle"></div>
                      <div className="pitch-box penalty-box bottom"></div>
                      <div className="pitch-box penalty-box top"></div>
                      
                      {/* Jugadores Posicionados según Formación */}
                      {FORMATIONS[matchData.lineup].map((pos, idx) => {
                        const pid = calledPlayers[idx];
                        const player = pid ? MOCK_PLAYERS.find(p => p.id === pid) : null;
                        
                        return (
                          <div 
                            key={idx} 
                            className="pitch-player" 
                            style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                            title={pos.pos}
                          >
                            <div className="pp-circle">{player ? player.number : '+'}</div>
                            <span className="pp-name">{player ? player.name.split(' ')[0] : pos.pos}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- POST-PARTIDO --- */}
            {editTab === 'POST-PARTIDO' && (
              <div className="tab-pane post-partido">
                {matchData.status !== 'Terminado' ? (
                  <div className="empty-state-post">
                    <span className="icon">⚽</span>
                    <h3>El partido aún no ha terminado</h3>
                    <p>Cambia el estado del partido a "Terminado" en la pestaña Pre-Partido para registrar el resultado, goleadores y estadísticas.</p>
                  </div>
                ) : (
                  <div className="post-grid">
                    <div className="resultado-panel">
                      <h3>Resultado Final</h3>
                      <div className="score-inputs">
                        <div className="score-team">
                          <span>{matchData.type === 'Local' ? 'Míster11 FC' : matchData.rival}</span>
                          <input type="number" value={matchData.type === 'Local' ? matchData.goalsFor : matchData.goalsAgainst} 
                            onChange={e => {
                              const val = Number(e.target.value);
                              if(matchData.type === 'Local') setMatchData({...matchData, goalsFor: val});
                              else setMatchData({...matchData, goalsAgainst: val});
                            }} 
                          />
                        </div>
                        <span className="vs"> - </span>
                        <div className="score-team">
                          <input type="number" value={matchData.type === 'Visitante' ? matchData.goalsFor : matchData.goalsAgainst} 
                            onChange={e => {
                              const val = Number(e.target.value);
                              if(matchData.type === 'Visitante') setMatchData({...matchData, goalsFor: val});
                              else setMatchData({...matchData, goalsAgainst: val});
                            }} 
                          />
                          <span>{matchData.type === 'Visitante' ? 'Míster11 FC' : matchData.rival}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="events-panel">
                      <h3>Goleadores y Tarjetas</h3>
                      <div className="events-list">
                        <button className="btn-outline-gold mb-2">+ Añadir Evento</button>
                        <p className="hint">Función de registro rápido de minutos en desarrollo...</p>
                      </div>
                    </div>

                    <div className="analysis-panel full">
                      <h3>Análisis y Observaciones del Entrenador</h3>
                      <textarea rows="4" placeholder="Análisis táctico del rendimiento del equipo, cosas a mejorar, etc."></textarea>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Partidos;
