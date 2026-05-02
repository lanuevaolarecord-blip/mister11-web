import React, { useState, useEffect, useMemo } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { generateTestsReport } from '../utils/pdfGenerator';
import './Tests.css';

// --- MOCK DATA ---
const PREDEFINED_TESTS = [
  { id: 1, category: 'Resistencia', name: 'Test de Cooper', unit: 'm', desc: 'Distancia recorrida en 12 minutos.', protocol: 'Los jugadores deben correr la mayor distancia posible en 12 minutos alrededor de una pista o campo marcado. Se anota la distancia total en metros.', image: 'https://via.placeholder.com/600x300/1B3A2D/D4A843?text=Grafico+Test+Cooper' },
  { id: 2, category: 'Resistencia', name: 'Course Navette', unit: 'nivel', desc: 'Carrera de ida y vuelta de 20m con pitidos.', protocol: 'Carreras de 20 metros al ritmo de un pitido de audio que se acelera cada minuto. Se anota el último palier completado.', image: 'https://via.placeholder.com/600x300/1B3A2D/D4A843?text=Course+Navette+20m' },
  { id: 3, category: 'Velocidad', name: 'Sprint 10m', unit: 'seg', desc: 'Aceleración en distancia corta.', protocol: 'Desde posición estática, sprint al máximo esfuerzo hasta rebasar la línea de 10 metros. Se usa cronómetro o fotocélulas.', image: 'https://via.placeholder.com/600x300/1B3A2D/D4A843?text=Sprint+10m' },
  { id: 4, category: 'Velocidad', name: 'Sprint 30m', unit: 'seg', desc: 'Velocidad máxima lanzada.', protocol: 'Igual que 10m, pero se mide el tiempo total a los 30 metros.', image: 'https://via.placeholder.com/600x300/1B3A2D/D4A843?text=Sprint+30m' },
  { id: 5, category: 'Agilidad', name: 'T-Test', unit: 'seg', desc: 'Desplazamientos frontales, laterales y de espaldas.', protocol: 'Sprint 10m al frente, desplazamiento lateral 5m a la izquierda, 10m a la derecha, 5m al centro y 10m de espaldas al inicio.', image: 'https://via.placeholder.com/600x300/1B3A2D/D4A843?text=T-Test+Agility' },
  { id: 6, category: 'Fuerza', name: 'Salto CMJ', unit: 'cm', desc: 'Salto vertical con contramovimiento.', protocol: 'Las manos en las caderas. Bajar el centro de gravedad (flexión de rodillas) e inmediatamente saltar lo más alto posible.', image: 'https://via.placeholder.com/600x300/1B3A2D/D4A843?text=Salto+CMJ' },
  { id: 7, category: 'Técnica', name: 'Conducción conos', unit: 'seg', desc: 'Slalom entre conos con finalización.', protocol: 'Conducir el balón haciendo slalom entre 5 conos separados por 2 metros y dar un pase a un objetivo.', image: 'https://via.placeholder.com/600x300/1B3A2D/D4A843?text=Conduccion+Slalom' },
  { id: 8, category: 'Técnica', name: 'Pase a portería', unit: 'pts', desc: 'Precisión de pase a zonas objetivo (10 pases).', protocol: '10 pases desde la frontal del área hacia pequeñas porterías o zonas marcadas. 1 punto por acierto.', image: 'https://via.placeholder.com/600x300/1B3A2D/D4A843?text=Precision+de+Pase' }
];

// MOCK_PLAYERS removed, using usePlayers hook

// Generate mock historical data based on current players
const generateMockHistory = (playersList) => {
  const data = {};
  playersList.forEach(p => {
    data[p.id] = {};
    PREDEFINED_TESTS.forEach(t => {
      let base = 0;
      let betterIsLower = t.unit === 'seg';
      
      if (t.name === 'Test de Cooper') base = 2000 + Math.random() * 800;
      else if (t.name === 'Course Navette') base = 6 + Math.random() * 6;
      else if (t.unit === 'seg') base = 15 - Math.random() * 5;
      else if (t.unit === 'cm') base = 30 + Math.random() * 20;
      else if (t.unit === 'pts') base = 5 + Math.random() * 4;
      else base = 10 + Math.random() * 10;

      data[p.id][t.id] = [
        { date: '2025-09-10', val: Number((base * (betterIsLower ? 1.05 : 0.95)).toFixed(2)) },
        { date: '2025-12-15', val: Number((base).toFixed(2)) },
        { date: '2026-03-20', val: Number((base * (betterIsLower ? 0.95 : 1.05)).toFixed(2)) }
      ];
    });
  });
  return data;
};

const Tests = () => {
  const { activeTeamId } = useAuth();
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  const historyData = useMemo(() => generateMockHistory(players), [players]);
  const [activeTab, setActiveTab] = useState('BATERÍA');
  const [tests, setTests] = useState(PREDEFINED_TESTS);
  
  // Registration State
  const [regSelectedTest, setRegSelectedTest] = useState(tests[0].id);
  const [regInputs, setRegInputs] = useState({});

  // History State
  const [histSelectedPlayer, setHistSelectedPlayer] = useState(null);

  useEffect(() => {
    if (players.length > 0 && !histSelectedPlayer) {
      setHistSelectedPlayer(players[0].id);
    }
  }, [players]);

  // New Test State
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState(false);
  const [newTest, setNewTest] = useState({ name: '', category: 'Física', unit: '', desc: '', protocol: '' });
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);

  // Heatmap Selected Test
  const [heatSelectedTest, setHeatSelectedTest] = useState(tests[0].id);

  const getTestById = (id) => tests.find(t => t.id === Number(id));
  const getPlayerById = (id) => players.find(p => p.id === id);

  const handleSaveRegistration = () => {
    alert("Resultados guardados exitosamente.");
    setRegInputs({});
  };

  const handleCreateTest = () => {
    if (!newTest.name || !newTest.unit) return alert("Nombre y unidad son obligatorios");
    setTests([...tests, { ...newTest, id: Date.now() }]);
    setIsNewTestModalOpen(false);
  };

  // Heatmap logic
  const getHeatmapColor = (val, min, max, isTime) => {
    // isTime means lower is better (green). Higher is worse (red).
    // if not time, higher is better (green), lower is worse (red).
    const ratio = (val - min) / (max - min || 1);
    const percentage = isTime ? (1 - ratio) : ratio; // 1 is green, 0 is red
    
    // HSL: Red is 0, Green is 120
    const hue = percentage * 120;
    return `hsl(${hue}, 70%, 85%)`;
  };

  return (
    <div className="tests-page">
      <header className="tests-header">
        <div className="header-top">
          <h1>EVALUACIÓN Y TESTS</h1>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => generateTestsReport(tests, players, historyData)}>Exportar Informe</button>
          </div>
        </div>

        <div className="tests-tabs">
          {['BATERÍA', 'REGISTRO', 'HISTORIAL POR JUGADOR', 'COMPARATIVA EQUIPO'].map(tab => (
            <button 
              key={tab} 
              className={`tests-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="tests-content">
        {/* --- BATERÍA --- */}
        {activeTab === 'BATERÍA' && (
          <div className="tab-bateria">
            <div className="bateria-header">
              <h3>Catálogo de Pruebas</h3>
              <button className="btn-primary" onClick={() => setIsNewTestModalOpen(true)}>+ Crear Test</button>
            </div>
            
            <div className="tests-grid">
              {tests.map(t => (
                <div key={t.id} className="test-card clickable" onClick={() => setSelectedTestDetail(t)}>
                  <div className="t-head">
                    <span className="t-cat">{t.category}</span>
                    <span className="t-unit">{t.unit}</span>
                  </div>
                  <h4>{t.name}</h4>
                  <p>{t.desc}</p>
                  <span className="view-detail-hint">Toca para ver detalles y protocolo</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- REGISTRO --- */}
        {activeTab === 'REGISTRO' && (
          <div className="tab-registro">
            <div className="reg-sidebar">
              <h3>Seleccionar Test</h3>
              <div className="test-selector">
                {tests.map(t => (
                  <div 
                    key={t.id} 
                    className={`test-select-item ${regSelectedTest === t.id ? 'active' : ''}`}
                    onClick={() => setRegSelectedTest(t.id)}
                  >
                    <strong>{t.name}</strong>
                    <span>{t.category}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="reg-main">
              <div className="reg-main-header">
                <h3>Registro de Resultados: <span>{getTestById(regSelectedTest)?.name}</span></h3>
                <span className="unit-badge">Unidad: {getTestById(regSelectedTest)?.unit}</span>
              </div>
              <div className="reg-players-grid">
                {players.map(p => (
                  <div key={p.id} className="reg-player-card">
                    <div className="rp-info">
                      <div className="rp-num">{p.number}</div>
                      <div className="rp-name">{p.name}</div>
                    </div>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={regInputs[p.id] || ''}
                      onChange={e => setRegInputs({...regInputs, [p.id]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
              <div className="reg-actions">
                <button className="btn-primary" onClick={handleSaveRegistration}>Guardar Resultados</button>
              </div>
            </div>
          </div>
        )}

        {/* --- HISTORIAL POR JUGADOR --- */}
        {activeTab === 'HISTORIAL POR JUGADOR' && (
          <div className="tab-historial">
            <div className="hist-sidebar">
              <h3>Seleccionar Jugador</h3>
              <div className="player-selector">
                {players.map(p => (
                  <div 
                    key={p.id} 
                    className={`player-select-item ${histSelectedPlayer === p.id ? 'active' : ''}`}
                    onClick={() => setHistSelectedPlayer(p.id)}
                  >
                    <span className="p-num">{p.number}</span>
                    <span className="p-name">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hist-main">
              <div className="hist-main-header">
                <h3>Evolución: {getPlayerById(histSelectedPlayer)?.name}</h3>
                <button className="btn-outline-gold" onClick={() => alert('Generando Informe en PDF para el jugador...')}>📄 Exportar Informe del Jugador</button>
              </div>
              <div className="hist-charts-grid">
                {tests.slice(0, 6).map(t => {
                  const history = historyData[histSelectedPlayer]?.[t.id] || [];
                  if(history.length === 0) return null;
                  
                  // Simple SVG Chart logic
                  const vals = history.map(h => h.val);
                  const min = Math.min(...vals) * 0.9;
                  const max = Math.max(...vals) * 1.1;
                  const range = max - min || 1;
                  
                  // Determine improvement (green arrow) vs worsen (red arrow)
                  const first = vals[0];
                  const last = vals[vals.length - 1];
                  const isTime = t.unit === 'seg';
                  const improved = isTime ? last < first : last > first;

                  return (
                    <div key={t.id} className="hist-chart-card">
                      <div className="hc-header">
                        <h4>{t.name} <span className="unit">({t.unit})</span></h4>
                        <span className={`trend-arrow ${improved ? 'good' : 'bad'}`}>
                          {improved ? '▲' : '▼'} {Math.abs(((last - first)/first)*100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <svg className="svg-chart" viewBox="0 0 200 80" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="3"
                          points={history.map((h, i) => {
                            const x = (i / (history.length - 1)) * 200;
                            const y = 80 - ((h.val - min) / range) * 80;
                            return `${x},${y}`;
                          }).join(' ')}
                        />
                        {history.map((h, i) => {
                           const x = (i / (history.length - 1)) * 200;
                           const y = 80 - ((h.val - min) / range) * 80;
                           return <circle key={i} cx={x} cy={y} r="4" fill="var(--primary)" />
                        })}
                      </svg>
                      
                      <div className="hc-labels">
                        {history.map((h, i) => (
                          <div key={i} className="hc-point">
                            <strong>{h.val}</strong>
                            <span>{h.date.split('-').reverse().slice(0,2).join('/')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- COMPARATIVA EQUIPO --- */}
        {activeTab === 'COMPARATIVA EQUIPO' && (
          <div className="tab-comparativa">
            <div className="comp-header">
              <div className="comp-select">
                <label>Test a analizar:</label>
                <select value={heatSelectedTest} onChange={e => setHeatSelectedTest(Number(e.target.value))}>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>)}
                </select>
              </div>
              <button className="btn-outline-gold" onClick={() => generateTestsReport(tests, players, historyData)}>📄 Exportar Informe Colectivo</button>
            </div>
            
            <div className="heatmap-container">
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th>Dorsal</th>
                    <th>Jugador</th>
                    <th>Eval 1 (Sep)</th>
                    <th>Eval 2 (Dic)</th>
                    <th>Eval 3 (Mar)</th>
                    <th>Evolución</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => {
                    const testInfo = getTestById(heatSelectedTest);
                    const history = historyData[p.id]?.[heatSelectedTest] || [];
                    if(history.length < 3) return null;

                    // Calculate global min/max for color scale across ALL players for THIS test's LATEST eval
                    const allCurrentVals = players.map(mp => historyData[mp.id]?.[heatSelectedTest]?.[2]?.val || 0);
                    const minVal = Math.min(...allCurrentVals);
                    const maxVal = Math.max(...allCurrentVals);
                    const isTime = testInfo?.unit === 'seg';

                    const v1 = history[0].val;
                    const v2 = history[1].val;
                    const v3 = history[2].val;
                    
                    const improved = isTime ? v3 < v1 : v3 > v1;
                    const diffPerc = Math.abs(((v3 - v1)/v1)*100).toFixed(1);

                    return (
                      <tr key={p.id}>
                        <td className="center"><strong>{p.number}</strong></td>
                        <td>{p.name}</td>
                        <td className="center">{v1}</td>
                        <td className="center">{v2}</td>
                        <td className="center heat-cell" style={{backgroundColor: getHeatmapColor(v3, minVal, maxVal, isTime)}}>
                          <strong>{v3}</strong>
                        </td>
                        <td className="center">
                           <span className={`trend-badge ${improved ? 'good' : 'bad'}`}>
                             {improved ? '▲' : '▼'} {diffPerc}%
                           </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR TEST */}
      {isNewTestModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTestModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Test</h2>
              <button className="btn-close" onClick={() => setIsNewTestModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre del Test</label>
                <input type="text" value={newTest.name} onChange={e => setNewTest({...newTest, name: e.target.value})} placeholder="Ej. RM Sentadilla" />
              </div>
              <div className="form-row-team">
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={newTest.category} onChange={e => setNewTest({...newTest, category: e.target.value})}>
                    <option>Resistencia</option>
                    <option>Velocidad</option>
                    <option>Agilidad</option>
                    <option>Fuerza</option>
                    <option>Técnica</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unidad de medida</label>
                  <input type="text" value={newTest.unit} onChange={e => setNewTest({...newTest, unit: e.target.value})} placeholder="Ej. kg, seg, rep" />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción rápida</label>
                <input type="text" value={newTest.desc} onChange={e => setNewTest({...newTest, desc: e.target.value})} placeholder="Resumen del test" />
              </div>
              <div className="form-group">
                <label>Protocolo de Ejecución Completo</label>
                <textarea rows="4" value={newTest.protocol || ''} onChange={e => setNewTest({...newTest, protocol: e.target.value})} placeholder="Pasos exactos de cómo se realiza la prueba en campo..."></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsNewTestModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCreateTest}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DEL TEST */}
      {selectedTestDetail && (
        <div className="modal-overlay" onClick={() => setSelectedTestDetail(null)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <span className="t-cat">{selectedTestDetail.category}</span>
                <h2 style={{margin: 0}}>{selectedTestDetail.name}</h2>
              </div>
              <button className="btn-close" onClick={() => setSelectedTestDetail(null)}>✕</button>
            </div>
            <div className="modal-body test-detail-body">
              <div className="test-image-placeholder">
                <img src={selectedTestDetail.image || 'https://via.placeholder.com/600x300/1B3A2D/4CAF7D?text=Imagen+del+Test'} alt={selectedTestDetail.name} />
              </div>
              <div className="test-info-block">
                <h3>Objetivo y Descripción</h3>
                <p>{selectedTestDetail.desc}</p>
                
                <h3>Protocolo de Ejecución</h3>
                <p>{selectedTestDetail.protocol || 'No se ha especificado un protocolo detallado para esta prueba.'}</p>
                
                <div className="test-meta">
                  <span><strong>Unidad de medida:</strong> {selectedTestDetail.unit}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{justifyContent: 'space-between'}}>
              <button className="btn-outline-gold" onClick={() => alert(`Descargando Plantilla (PDF/Excel) para toma de datos de ${selectedTestDetail.name}...`)}>⬇️ Descargar Plantilla de Toma de Datos</button>
              <div className="footer-actions">
                <button className="btn-primary" onClick={() => {
                  setRegSelectedTest(selectedTestDetail.id);
                  setActiveTab('REGISTRO');
                  setSelectedTestDetail(null);
                }}>Ir a Registrar Resultados</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
