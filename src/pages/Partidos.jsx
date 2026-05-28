import React, { useState, useRef, useEffect } from 'react';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import './Partidos.css';

const FORMATIONS = {
  '4-3-3': [
    { pos: 'POR', top: '50%', left: '15%' },
    { pos: 'LTD', top: '85%', left: '35%' },
    { pos: 'DEF', top: '65%', left: '30%' },
    { pos: 'DEF', top: '35%', left: '30%' },
    { pos: 'LTI', top: '15%', left: '35%' },
    { pos: 'MCD', top: '50%', left: '55%' },
    { pos: 'MC', top: '75%', left: '65%' },
    { pos: 'MC', top: '25%', left: '65%' },
    { pos: 'EXT', top: '85%', left: '85%' },
    { pos: 'DEL', top: '50%', left: '90%' },
    { pos: 'EXT', top: '15%', left: '85%' }
  ],
  '4-4-2': [
    { pos: 'POR', top: '50%', left: '15%' },
    { pos: 'LTD', top: '85%', left: '35%' },
    { pos: 'DEF', top: '65%', left: '30%' },
    { pos: 'DEF', top: '35%', left: '30%' },
    { pos: 'LTI', top: '15%', left: '35%' },
    { pos: 'MD', top: '85%', left: '60%' },
    { pos: 'MC', top: '60%', left: '55%' },
    { pos: 'MC', top: '40%', left: '55%' },
    { pos: 'MI', top: '15%', left: '60%' },
    { pos: 'DEL', top: '65%', left: '85%' },
    { pos: 'DEL', top: '35%', left: '85%' }
  ],
  '3-5-2': [
    { pos: 'POR', top: '50%', left: '15%' },
    { pos: 'DEF', top: '70%', left: '30%' },
    { pos: 'DEF', top: '50%', left: '28%' },
    { pos: 'DEF', top: '30%', left: '30%' },
    { pos: 'MD', top: '85%', left: '50%' },
    { pos: 'MC', top: '65%', left: '55%' },
    { pos: 'MC', top: '50%', left: '58%' },
    { pos: 'MC', top: '35%', left: '55%' },
    { pos: 'MI', top: '15%', left: '50%' },
    { pos: 'DEL', top: '65%', left: '85%' },
    { pos: 'DEL', top: '35%', left: '85%' }
  ],
  '5-3-2': [
    { pos: 'POR', top: '50%', left: '15%' },
    { pos: 'LTD', top: '90%', left: '35%' },
    { pos: 'DEF', top: '70%', left: '30%' },
    { pos: 'DEF', top: '50%', left: '28%' },
    { pos: 'DEF', top: '30%', left: '30%' },
    { pos: 'LTI', top: '10%', left: '35%' },
    { pos: 'MC', top: '70%', left: '58%' },
    { pos: 'MC', top: '50%', left: '60%' },
    { pos: 'MC', top: '30%', left: '58%' },
    { pos: 'DEL', top: '65%', left: '85%' },
    { pos: 'DEL', top: '35%', left: '85%' }
  ],
  '4-1-4-1': [
    { pos: 'POR', top: '50%', left: '15%' },
    { pos: 'LTD', top: '85%', left: '35%' },
    { pos: 'DEF', top: '65%', left: '30%' },
    { pos: 'DEF', top: '35%', left: '30%' },
    { pos: 'LTI', top: '15%', left: '35%' },
    { pos: 'MCD', top: '50%', left: '48%' },
    { pos: 'MD', top: '80%', left: '65%' },
    { pos: 'MC', top: '60%', left: '63%' },
    { pos: 'MC', top: '40%', left: '63%' },
    { pos: 'MI', top: '20%', left: '65%' },
    { pos: 'DEL', top: '50%', left: '88%' }
  ],
  '3-4-3': [
    { pos: 'POR', top: '50%', left: '15%' },
    { pos: 'DEF', top: '70%', left: '30%' },
    { pos: 'DEF', top: '50%', left: '28%' },
    { pos: 'DEF', top: '30%', left: '30%' },
    { pos: 'MD', top: '80%', left: '55%' },
    { pos: 'MC', top: '60%', left: '53%' },
    { pos: 'MC', top: '40%', left: '53%' },
    { pos: 'MI', top: '20%', left: '55%' },
    { pos: 'EXT', top: '80%', left: '85%' },
    { pos: 'DEL', top: '50%', left: '88%' },
    { pos: 'EXT', top: '20%', left: '85%' }
  ],
  '4-3-2-1': [
    { pos: 'POR', top: '50%', left: '15%' },
    { pos: 'LTD', top: '85%', left: '35%' },
    { pos: 'DEF', top: '65%', left: '30%' },
    { pos: 'DEF', top: '35%', left: '30%' },
    { pos: 'LTI', top: '15%', left: '35%' },
    { pos: 'MC', top: '65%', left: '52%' },
    { pos: 'MCD', top: '50%', left: '50%' },
    { pos: 'MC', top: '35%', left: '52%' },
    { pos: 'MCO', top: '60%', left: '70%' },
    { pos: 'MCO', top: '40%', left: '70%' },
    { pos: 'DEL', top: '50%', left: '88%' }
  ]
};

const Partidos = () => {
  const { activeTeamId } = useAuth();
  const { matches, loading: loadingMatches, addMatch, updateMatch, removeMatch } = useMatches(activeTeamId);
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'EDIT'
  const [filterMode, setFilterMode] = useState('Todos'); // 'Todos', 'Pendientes', 'Terminados'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State Tabs
  const [editTab, setEditTab] = useState('PRE-PARTIDO');
  const [matchData, setMatchData] = useState({});
  const [calledPlayers, setCalledPlayers] = useState([]); // Array of IDs
  const [draggingIdx, setDraggingIdx] = useState(null);
  const pitchRef = useRef(null);

  useEffect(() => {
    const handlePointerUpWindow = () => {
      setDraggingIdx(null);
    };
    window.addEventListener('pointerup', handlePointerUpWindow);
    window.addEventListener('touchend', handlePointerUpWindow);
    return () => {
      window.removeEventListener('pointerup', handlePointerUpWindow);
      window.removeEventListener('touchend', handlePointerUpWindow);
    };
  }, []);

  const handlePitchPointerMove = (e) => {
    if (draggingIdx === null || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    const xRel = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yRel = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    setMatchData(prev => ({
      ...prev,
      customPositions: {
        ...(prev.customPositions || {}),
        [draggingIdx]: { top: `${yRel}%`, left: `${xRel}%` }
      }
    }));
  };
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

  const handleDeleteMatch = async () => {
    if (!matchData.id) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar este partido?")) return;
    setIsSaving(true);
    try {
      await removeMatch(matchData.id);
      setViewMode('LIST');
    } catch (error) {
      alert("Error al eliminar el partido.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filterMode === 'Pendientes') return m.status === 'Pendiente';
    if (filterMode === 'Terminados') return m.status === 'Terminado';
    return true; // 'Todos'
  }).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
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
              {matchData.id && (
                <button className="btn-outline" style={{ borderColor: '#EF4444', color: '#EF4444' }} onClick={handleDeleteMatch} disabled={isSaving}>
                  🗑️ Eliminar
                </button>
              )}
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
                      <span className={`status-badge ${m.status?.toLowerCase()}`}>{m.status}</span>
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
                    <option value="3-5-2">3-5-2 Mediocampo Amplio</option>
                    <option value="5-3-2">5-3-2 Bloque Defensivo</option>
                    <option value="4-1-4-1">4-1-4-1 Doble Pivote</option>
                    <option value="3-4-3">3-4-3 Ataque Total</option>
                    <option value="4-3-2-1">4-3-2-1 Árbol de Navidad</option>
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
                  <div className="mini-pitch-container" ref={pitchRef} onPointerMove={handlePitchPointerMove} onTouchMove={handlePitchPointerMove} style={{ touchAction: 'none' }}>
                    <div className="mini-pitch">
                      <div className="pitch-line center-line"></div>
                      <div className="pitch-circle center-circle"></div>
                      <div className="pitch-box penalty-box left"></div>
                      <div className="pitch-box penalty-box right"></div>
                      
                      {(FORMATIONS[matchData.lineup] || FORMATIONS['4-3-3']).map((pos, idx) => {
                        const pid = calledPlayers[idx];
                        const player = pid ? players.find(p => p.id === pid) : null;
                        
                        const customPos = matchData.customPositions && matchData.customPositions[idx];
                        const topPos = customPos ? customPos.top : pos.top;
                        const leftPos = customPos ? customPos.left : pos.left;
                        
                        return (
                          <div 
                            key={idx} 
                            className="pitch-player" 
                            style={{ 
                              top: topPos, 
                              left: leftPos, 
                              transform: 'translate(-50%, -50%)', 
                              cursor: 'grab', 
                              zIndex: draggingIdx === idx ? 10 : 1 
                            }}
                            title={pos.pos}
                            onPointerDown={(e) => { e.preventDefault(); setDraggingIdx(idx); }}
                            onTouchStart={(e) => { e.stopPropagation(); setDraggingIdx(idx); }}
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
