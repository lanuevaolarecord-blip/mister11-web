import React, { useState, useRef, useEffect } from 'react';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import './Partidos.css';

const FORMATIONS = {
  '4-3-3': [
    { pos: 'POR', top: '50%', left: '10%' },
    { pos: 'LTD', top: '85%', left: '30%' },
    { pos: 'DEF', top: '65%', left: '25%' },
    { pos: 'DEF', top: '35%', left: '25%' },
    { pos: 'LTI', top: '15%', left: '30%' },
    { pos: 'MCD', top: '50%', left: '50%' },
    { pos: 'MC', top: '75%', left: '60%' },
    { pos: 'MC', top: '25%', left: '60%' },
    { pos: 'EXT', top: '85%', left: '85%' },
    { pos: 'DEL', top: '50%', left: '90%' },
    { pos: 'EXT', top: '15%', left: '85%' }
  ],
  '4-4-2': [
    { pos: 'POR', top: '50%', left: '10%' },
    { pos: 'LTD', top: '85%', left: '30%' },
    { pos: 'DEF', top: '65%', left: '25%' },
    { pos: 'DEF', top: '35%', left: '25%' },
    { pos: 'LTI', top: '15%', left: '30%' },
    { pos: 'MD', top: '85%', left: '60%' },
    { pos: 'MC', top: '65%', left: '55%' },
    { pos: 'MC', top: '35%', left: '55%' },
    { pos: 'MI', top: '15%', left: '60%' },
    { pos: 'DEL', top: '65%', left: '85%' },
    { pos: 'DEL', top: '35%', left: '85%' }
  ],
  '3-5-2': [
    { pos: 'POR', top: '50%', left: '10%' },
    { pos: 'DEF', top: '70%', left: '25%' },
    { pos: 'DEF', top: '50%', left: '22%' },
    { pos: 'DEF', top: '30%', left: '25%' },
    { pos: 'MD', top: '85%', left: '50%' },
    { pos: 'MC', top: '65%', left: '55%' },
    { pos: 'MC', top: '50%', left: '58%' },
    { pos: 'MC', top: '35%', left: '55%' },
    { pos: 'MI', top: '15%', left: '50%' },
    { pos: 'DEL', top: '65%', left: '85%' },
    { pos: 'DEL', top: '35%', left: '85%' }
  ]
};

// SVG Iconos reutilizables
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const Partidos = () => {
  const { activeTeamId } = useAuth();
  const { matches, loading: loadingMatches, addMatch, updateMatch, removeMatch } = useMatches(activeTeamId);
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'EDIT'
  const [filterMode, setFilterMode] = useState('Todos'); // 'Todos', 'Pendientes', 'Terminados'
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [editTab, setEditTab] = useState('PRE-PARTIDO');
  const [matchData, setMatchData] = useState({});
  const [calledPlayers, setCalledPlayers] = useState([]); // Array of IDs
  const [draggingIdx, setDraggingIdx] = useState(null);
  const pitchRef = useRef(null);

  useEffect(() => {
    const handlePointerUpWindow = () => setDraggingIdx(null);
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
      const dataToSave = { ...matchData, convocados: calledPlayers };
      if (matchData.id) await updateMatch(matchData.id, dataToSave);
      else await addMatch(dataToSave);
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
    return true; 
  }).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  if (loadingMatches || loadingPlayers) {
    return <div style={{padding: '24px', color: 'var(--partidos-text-primary)'}}>Cargando datos...</div>;
  }

  return (
    <div className="partidos-page">
      <header className="partidos-header">
        <div className="header-top">
          <h1>GESTIÓN DE PARTIDOS</h1>
          <div className="header-actions">
            {viewMode === 'LIST' ? (
              <button className="btn-primary-dark" onClick={handleNewMatch}>+ NUEVO PARTIDO</button>
            ) : (
              <>
                {matchData.id && (
                  <button className="btn-danger" onClick={handleDeleteMatch} disabled={isSaving}>
                    <TrashIcon /> ELIMINAR
                  </button>
                )}
                <button className="btn-outline-dark" onClick={() => setViewMode('LIST')}>CANCELAR</button>
                <button className="btn-primary-dark" onClick={handleSaveMatch} disabled={isSaving}>
                  {isSaving ? 'GUARDANDO...' : 'GUARDAR PARTIDO'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {viewMode === 'LIST' && (
        <div className="partidos-list-container">
          {matches.length === 0 ? (
            <div style={{textAlign: 'center', marginTop: '40px', color: 'var(--partidos-text-muted)'}}>
              <h2>No hay partidos registrados</h2>
              <p>Comienza añadiendo un nuevo partido.</p>
            </div>
          ) : (
            <>
              <div className="list-filters">
                <button className={`filter-tab ${filterMode === 'Todos' ? 'active' : ''}`} onClick={() => setFilterMode('Todos')}>Todos</button>
                <button className={`filter-tab ${filterMode === 'Pendientes' ? 'active' : ''}`} onClick={() => setFilterMode('Pendientes')}>Pendientes</button>
                <button className={`filter-tab ${filterMode === 'Terminados' ? 'active' : ''}`} onClick={() => setFilterMode('Terminados')}>Terminados</button>
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
                        {/* Dummy Escudo */}
                        <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--partidos-border)'}}></div>
                        <span className="t-name">{m.type === 'Local' ? 'Míster11 FC' : m.rival}</span>
                      </div>
                      <div className="mc-score">
                        {m.status === 'Terminado' ? (
                          <span>{m.type === 'Local' ? m.goalsFor : m.goalsAgainst} - {m.type === 'Local' ? m.goalsAgainst : m.goalsFor}</span>
                        ) : (
                          <span className="vs">VS</span>
                        )}
                      </div>
                      <div className="team-visit">
                        <span className="t-name">{m.type === 'Visitante' ? 'Míster11 FC' : m.rival}</span>
                        <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--partidos-border)'}}></div>
                      </div>
                    </div>
                    
                    <div className="mc-footer">
                      <span>📍 {m.location || 'Sin ubicación'}</span>
                      <span>🛡️ Formación: {m.lineup || '4-3-3'}</span>
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
            {/* PESTAÑA: PRE-PARTIDO */}
            {editTab === 'PRE-PARTIDO' && (
              <div className="tab-pane pre-partido-container">
                <h3 className="section-title">Datos Generales del Encuentro</h3>
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Equipo Rival</label>
                    <input type="text" className="partidos-input" value={matchData.rival} onChange={e => setMatchData({...matchData, rival: e.target.value})} placeholder="Ej. fomento castellon" />
                  </div>
                  <div className="form-group quarter">
                    <label>Fecha</label>
                    <input type="date" className="partidos-input" value={matchData.date} onChange={e => setMatchData({...matchData, date: e.target.value})} />
                  </div>
                  <div className="form-group quarter">
                    <label>Hora</label>
                    <input type="time" className="partidos-input" value={matchData.time} onChange={e => setMatchData({...matchData, time: e.target.value})} />
                  </div>
                  <div className="form-group quarter">
                    <label>Local / Visitante</label>
                    <select className="partidos-input" value={matchData.type} onChange={e => setMatchData({...matchData, type: e.target.value})}>
                      <option value="Local">Local</option>
                      <option value="Visitante">Visitante</option>
                    </select>
                  </div>
                  <div className="form-group quarter">
                    <label>Estado</label>
                    <select className="partidos-input" value={matchData.status} onChange={e => setMatchData({...matchData, status: e.target.value})}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Terminado">Terminado</option>
                    </select>
                  </div>
                  <div className="form-group half">
                    <label>Estadio / Lugar</label>
                    <input type="text" className="partidos-input" value={matchData.location} onChange={e => setMatchData({...matchData, location: e.target.value})} placeholder="Ej. facsa castellon c.d" />
                  </div>
                </div>

                <div className="form-actions-bottom">
                  <div>
                    {matchData.id && (
                      <button className="eliminar-toggle" onClick={handleDeleteMatch} disabled={isSaving}>
                        <TrashIcon />
                        <span>ELIMINAR</span>
                      </button>
                    )}
                  </div>
                  <div className="form-actions-right">
                    <button className="btn-outline-dark" onClick={() => setViewMode('LIST')}>CANCELAR</button>
                    <button className="btn-primary-dark" onClick={handleSaveMatch} disabled={isSaving}>GUARDAR PARTIDO</button>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: CONVOCATORIA */}
            {editTab === 'CONVOCATORIA' && (
              <div className="tab-pane">
                <div className="conv-header">
                  <h3>Selección de Jugadores</h3>
                  <div className="conv-count">{calledPlayers.length} / 18 Seleccionados</div>
                </div>
                <div className="players-checklist">
                  {players.map(p => {
                    const isSelected = calledPlayers.includes(p.id);
                    return (
                      <div key={p.id} className={`player-card ${isSelected ? 'selected' : ''}`} onClick={() => togglePlayerCall(p.id)}>
                        <div className="pc-number">{p.number}</div>
                        <div className="pc-info">
                          <span className="pc-name">{p.name}</span>
                          <span className="pc-pos">{p.position}</span>
                        </div>
                        <div className="pc-check">{isSelected ? '✓' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PESTAÑA: ALINEACIÓN */}
            {editTab === 'ALINEACIÓN' && (
              <div className="tab-pane alineacion-layout">
                <div className="alin-sidebar">
                  <h4>Formación Táctica</h4>
                  <select className="partidos-input" value={matchData.lineup || '4-3-3'} onChange={e => setMatchData({...matchData, lineup: e.target.value})}>
                    <option value="4-3-3">4-3-3</option>
                    <option value="4-4-2">4-4-2</option>
                    <option value="3-5-2">3-5-2</option>
                  </select>

                  <h4 style={{marginTop: '20px'}}>XI Titular</h4>
                  <div className="titulares-list">
                    {calledPlayers.length === 0 ? (
                      <p style={{fontSize: '12px', color: 'var(--partidos-text-muted)'}}>No hay convocados.</p>
                    ) : (
                      calledPlayers.slice(0, 11).map(id => {
                        const p = players.find(pl => pl.id === id);
                        if (!p) return null;
                        return (
                          <div key={id} className="alin-player-item">
                            <span>{p.number}</span> {p.name}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="alin-pitch-container" ref={pitchRef} onPointerMove={handlePitchPointerMove} onTouchMove={handlePitchPointerMove} style={{touchAction: 'none'}}>
                  <div className="pitch-line pitch-center-line"></div>
                  <div className="pitch-circle pitch-center-circle"></div>
                  <div className="pitch-box pitch-penalty-left"></div>
                  <div className="pitch-box pitch-penalty-right"></div>
                  
                  {(FORMATIONS[matchData.lineup || '4-3-3'] || FORMATIONS['4-3-3']).map((pos, idx) => {
                    const pid = calledPlayers[idx];
                    const player = pid ? players.find(p => p.id === pid) : null;
                    const customPos = matchData.customPositions && matchData.customPositions[idx];
                    const topPos = customPos ? customPos.top : pos.top;
                    const leftPos = customPos ? customPos.left : pos.left;
                    
                    return (
                      <div 
                        key={idx} 
                        className="pitch-player" 
                        style={{ top: topPos, left: leftPos, transform: 'translate(-50%, -50%)', cursor: 'grab', zIndex: draggingIdx === idx ? 10 : 1 }}
                        onPointerDown={(e) => { e.preventDefault(); setDraggingIdx(idx); }}
                        onTouchStart={(e) => { e.stopPropagation(); setDraggingIdx(idx); }}
                      >
                        <div className="pp-circle">{player ? player.number : idx + 1}</div>
                        <span className="pp-name">{player ? player.name.split(' ')[0] : pos.pos}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PESTAÑA: POST-PARTIDO */}
            {editTab === 'POST-PARTIDO' && (
              <div className="tab-pane post-partido-container">
                <div className="empty-state-post">
                  <h2>El partido aún no ha terminado</h2>
                  <p>Cambie el estado del partido a "Terminado" en la pestaña Pre-Partido para registrar el resultado.</p>
                  
                  <div className="post-partido-image">
                    {/* Placeholder para la imagen de la bola 3D proporcionada en el diseño */}
                    <svg viewBox="0 0 800 400" width="100%" height="100%">
                      <defs>
                        <linearGradient id="fieldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2E5A3C"/>
                          <stop offset="100%" stopColor="#1B3A2D"/>
                        </linearGradient>
                      </defs>
                      <path d="M 50 350 L 250 150 L 550 150 L 750 350 Z" fill="url(#fieldGrad)" stroke="#D4A843" strokeWidth="8"/>
                      <path d="M 150 350 L 300 200 L 500 200 L 650 350" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
                      <circle cx="400" cy="275" r="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" transform="scale(1, 0.5) translate(0, 275)"/>
                      <g transform="translate(400, 220)">
                        <circle cx="0" cy="0" r="45" fill="#D4A843"/>
                        <circle cx="0" cy="0" r="45" fill="none" stroke="#B88A36" strokeWidth="2"/>
                        <path d="M -15 -20 L 15 -20 L 25 10 L 0 30 L -25 10 Z" fill="#4B3A1A" opacity="0.8"/>
                      </g>
                      <path d="M 400 120 L 410 145 L 435 145 L 415 160 L 420 185 L 400 170 L 380 185 L 385 160 L 365 145 L 390 145 Z" fill="#1B3A2D"/>
                      <path d="M 330 90 L 335 105 L 350 105 L 338 115 L 342 130 L 330 120 L 318 130 L 322 115 L 310 105 L 325 105 Z" fill="#1B3A2D" transform="scale(0.7) translate(150, 0)"/>
                      <path d="M 470 90 L 475 105 L 490 105 L 478 115 L 482 130 L 470 120 L 458 130 L 462 115 L 450 105 L 465 105 Z" fill="#1B3A2D" transform="scale(0.7) translate(-50, 0)"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Partidos;
