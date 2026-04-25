import React, { useState } from 'react';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import './Partidos.css';

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
  const { matches, loading: loadingMatches, addMatch, updateMatch, removeMatch } = useMatches();
  const { players, loading: loadingPlayers } = usePlayers();
  
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'EDIT'
  const [filterMode, setFilterMode] = useState('Todos'); // 'Todos', 'Pendientes', 'Terminados'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State Tabs
  const [editTab, setEditTab] = useState('PRE-PARTIDO');
  const [matchData, setMatchData] = useState({});
  const [calledPlayers, setCalledPlayers] = useState([]); // Array of IDs

  const handleNewMatch = () => {
    const newMatch = {
      rival: '',
      date: '',
      time: '',
      location: '',
      type: 'Local',
      status: 'Pendiente',
      goalsFor: 0,
      goalsAgainst: 0,
      lineup: '4-3-3',
      events: [],
      titulares: [],
      suplentes: []
    };
    setMatchData(newMatch);
    setCalledPlayers([]); 
    setEditTab('PRE-PARTIDO');
    setViewMode('EDIT');
  };

  const handleEditMatch = (match) => {
    setMatchData({ ...match });
    setCalledPlayers(match.convocados || []);
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

  const handleSaveMatch = async () => {
    if (!matchData.rival) return alert("El nombre del rival es obligatorio.");
    
    setIsSaving(true);
    try {
      const dataToSave = {
        ...matchData,
        convocados: calledPlayers
      };

      if (matchData.id) {
        await updateMatch(matchData.id, dataToSave);
      } else {
        await addMatch(dataToSave);
      }
      setViewMode('LIST');
    } catch (error) {
      alert("Error al guardar el partido.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filterMode === 'Pendientes') return m.status === 'Pendiente';
    if (filterMode === 'Terminados') return m.status === 'Terminado';
    return true; // 'Todos'
  });

  if (loadingMatches || loadingPlayers) {
    return <div className="loading-state">Cargando datos de partidos...</div>;
  }

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
              <button className="btn-primary" onClick={handleSaveMatch} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Partido'}
              </button>
            </div>
          )}
        </div>
      </header>

      {viewMode === 'LIST' && (
        <div className="partidos-list-container">
          {matches.length === 0 ? (
            <div className="empty-state">
              <span className="icon">🏟️</span>
              <h2>No hay partidos registrados</h2>
              <p>Comienza a planificar tu temporada añadiendo tu primer encuentro.</p>
              <button className="btn-primary" onClick={handleNewMatch}>+ Nuevo Partido</button>
            </div>
          ) : (
            <>
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
                      <span className="mc-date">{m.date ? m.date.split('-').reverse().join('/') : '--/--/--'} - {m.time || '--:--'}</span>
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
                      <span>📍 {m.location || 'Sin ubicación'}</span>
                      <span>🛡️ Formación: {m.lineup}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
                  {players.length === 0 ? (
                    <p className="empty-text">No hay jugadores en la plantilla. Añádelos en la sección de Equipo.</p>
                  ) : (
                    players.map(p => {
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
                    })
                  )}
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
                    <p className="hint">Lista de convocados</p>
                    {calledPlayers.length === 0 ? (
                      <p className="empty-text">No hay jugadores convocados.</p>
                    ) : (
                      <>
                        {calledPlayers.slice(0,11).map(id => {
                          const p = players.find(pl => pl.id === id);
                          if (!p) return null;
                          return <div key={id} className="alin-player-list-item"><span>{p.number}</span> {p.name}</div>
                        })}
                        <h4 className="mt-3">Suplentes</h4>
                        {calledPlayers.slice(11).map(id => {
                          const p = players.find(pl => pl.id === id);
                          if (!p) return null;
                          return <div key={id} className="alin-player-list-item sub"><span>{p.number}</span> {p.name}</div>
                        })}
                      </>
                    )}
                  </div>
                </div>
                <div className="alin-main">
                  <div className="mini-pitch-container">
                    <div className="mini-pitch">
                      <div className="pitch-line center-line"></div>
                      <div className="pitch-circle center-circle"></div>
                      <div className="pitch-box penalty-box bottom"></div>
                      <div className="pitch-box penalty-box top"></div>
                      
                      {FORMATIONS[matchData.lineup].map((pos, idx) => {
                        const pid = calledPlayers[idx];
                        const player = pid ? players.find(p => p.id === pid) : null;
                        
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
                    <p>Cambia el estado del partido a "Terminado" en la pestaña Pre-Partido para registrar el resultado.</p>
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
                      <p className="hint">Módulo de estadísticas detalladas en desarrollo...</p>
                    </div>

                    <div className="analysis-panel full">
                      <h3>Análisis del Entrenador</h3>
                      <textarea 
                        rows="4" 
                        placeholder="Análisis táctico..."
                        value={matchData.notas || ''}
                        onChange={e => setMatchData({...matchData, notas: e.target.value})}
                      ></textarea>
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
