import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { generateTestsReport, generatePlayerTestReport } from '../utils/pdfGenerator';
import { GraficaEvolucion, GraficaResumen } from '../components/GraficasTest';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import './Tests.css';

// PREDEFINED_TESTS remains as base catalog
const DEFAULT_TESTS = [
  { id: 't1', category: 'Resistencia', name: 'Test de Cooper', unit: 'm', desc: 'Distancia recorrida en 12 minutos.', protocol: 'Los jugadores deben correr la mayor distancia posible en 12 minutos alrededor de una pista o campo marcado. Se anota la distancia total en metros.' },
  { id: 't2', category: 'Resistencia', name: 'Course Navette', unit: 'nivel', desc: 'Carrera de ida y vuelta de 20m con pitidos.', protocol: 'Carreras de 20 metros al ritmo de un pitido de audio que se acelera cada minuto. Se anota el último palier completado.' },
  { id: 't3', category: 'Velocidad', name: 'Sprint 10m', unit: 'seg', desc: 'Aceleración en distancia corta.', protocol: 'Desde posición estática, sprint al máximo esfuerzo hasta rebasar la línea de 10 metros. Se usa cronómetro o fotocélulas.' },
  { id: 't4', category: 'Velocidad', name: 'Sprint 30m', unit: 'seg', desc: 'Velocidad máxima lanzada.', protocol: 'Igual que 10m, pero se mide el tiempo total a los 30 metros.' },
  { id: 't5', category: 'Agilidad', name: 'T-Test', unit: 'seg', desc: 'Desplazamientos frontales, laterales y de espaldas.', protocol: 'Sprint 10m al frente, desplazamiento lateral 5m a la izquierda, 10m a la derecha, 5m al centro y 10m de espaldas al inicio.' },
  { id: 't6', category: 'Fuerza', name: 'Salto CMJ', unit: 'cm', desc: 'Salto vertical con contramovimiento.', protocol: 'Las manos en las caderas. Bajar el centro de gravedad (flexión de rodillas) e inmediatamente saltar lo más alto posible.' },
  { id: 't7', category: 'Técnica', name: 'Conducción conos', unit: 'seg', desc: 'Slalom entre conos con finalización.', protocol: 'Conducir el balón haciendo slalom entre 5 conos separados por 2 metros y dar un pase a un objetivo.' },
  { id: 't8', category: 'Técnica', name: 'Pase a portería', unit: 'pts', desc: 'Precisión de pase a zonas objetivo (10 pases).', protocol: '10 pases desde la frontal del área hacia pequeñas porterías o zonas marcadas. 1 punto por acierto.' }
];

const Tests = () => {
  const { user, activeTeamId } = useAuth();
  const { activeTeam } = useTeams();
  const { isPro } = usePlan();
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  const [historyData, setHistoryData] = useState({});
  const [activeTab, setActiveTab] = useState('BATERÍA');
  const [tests, setTests] = useState(DEFAULT_TESTS);
  const [loading, setLoading] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  
  // Registration State
  const [regSelectedTest, setRegSelectedTest] = useState(DEFAULT_TESTS[0].id);
  const [regInputs, setRegInputs] = useState({});

  // History State
  const [histSelectedPlayer, setHistSelectedPlayer] = useState(null);

  // Carga de evaluaciones reales desde Firestore
  const loadEvaluations = useCallback(async () => {
    if (!user || !activeTeamId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const newHistory = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const { jugadorId, testId, val, date } = data;
        
        if (!newHistory[jugadorId]) newHistory[jugadorId] = {};
        if (!newHistory[jugadorId][testId]) newHistory[jugadorId][testId] = [];
        
        newHistory[jugadorId][testId].push({ date, val: Number(val) });
      });
      
      setHistoryData(newHistory);
    } catch (error) {
      console.error("Error loading evaluations:", error);
    } finally {
      setLoading(false);
    }
  }, [user, activeTeamId]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

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

  const handleSaveRegistration = async () => {
    if (!user || !activeTeamId) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const today = new Date().toISOString().split('T')[0];
      
      Object.entries(regInputs).forEach(([jugadorId, val]) => {
        if (!val) return;
        const evalRef = doc(collection(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`));
        batch.set(evalRef, {
          jugadorId,
          testId: regSelectedTest,
          val: Number(val),
          date: today,
          timestamp: serverTimestamp()
        });
      });
      
      await batch.commit();
      alert("Resultados guardados exitosamente en la nube.");
      setRegInputs({});
      loadEvaluations();
    } catch (error) {
      console.error("Error saving evaluations:", error);
      alert("Error al guardar los resultados.");
    } finally {
      setLoading(false);
    }
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
            <button 
              className="btn-outline" 
              onClick={() => {
                if (!isPro) {
                  setUpgradeModal({ open: true, message: 'La exportación de informes completos es una función PRO.' });
                  return;
                }
                generateTestsReport(tests, players, historyData, activeTeam);
              }}
            >
              Exportar Informe
            </button>
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
                <button className="btn-outline-gold" onClick={async () => {
                  if (!isPro) {
                    setUpgradeModal({ open: true, message: 'La exportación de informes individuales es una función PRO.' });
                    return;
                  }
                  try {
                    let graficaUrl = null;
                    const element = document.getElementById('grafica-rendimiento-jugador');
                    if (element) {
                      const canvas = await html2canvas(element, { scale: 2, backgroundColor: null });
                      graficaUrl = canvas.toDataURL('image/png');
                    }
                    await generatePlayerTestReport(getPlayerById(histSelectedPlayer), tests, historyData, activeTeam, graficaUrl);
                  } catch (e) {
                    console.error(e);
                    alert("Error al generar el PDF.");
                  }
                }}>
                  📄 Exportar Informe del Jugador
                </button>
              </div>
              
              <div id="grafica-rendimiento-jugador" style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Perfil de Rendimiento Actual</h4>
                <GraficaResumen 
                  playerStats={tests.map(t => {
                    const h = historyData[histSelectedPlayer]?.[t.id] || [];
                    let val = h.length > 0 ? h[h.length - 1].val : 0;
                    // Normalizamos un poco para el radar (simulación simple)
                    const isTime = t.unit === 'seg';
                    let radarVal = val;
                    if (isTime) radarVal = Math.max(0, 100 - (val * 5)); // Invertir y escalar
                    else if (t.unit === 'cm') radarVal = Math.min(100, val * 2);
                    else if (t.unit === 'nivel') radarVal = Math.min(100, val * 8);
                    else radarVal = Math.min(100, val);
                    
                    return { subject: t.category, A: radarVal, fullMark: 100 };
                  })} 
                />
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
                      
                      <GraficaEvolucion data={history} isTime={isTime} />
                      
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
              <button className="btn-outline-gold" onClick={() => generateTestsReport(tests, players, historyData, activeTeam)}>📄 Exportar Informe Colectivo</button>
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
                <div className="vector-icon-large">📊</div>
              </div>
              <div className="test-info-block">
                <div className="protocolo-card">
                  <h3>Objetivo y Descripción</h3>
                  <p>{selectedTestDetail.desc}</p>
                </div>
                
                <div className="protocolo-card">
                  <h3>Protocolo de Ejecución</h3>
                  <p>{selectedTestDetail.protocol || 'No se ha especificado un protocolo detallado para esta prueba.'}</p>
                </div>
                
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

      <UpgradeModal 
        isOpen={upgradeModal.open} 
        onClose={() => setUpgradeModal({ ...upgradeModal, open: false })}
        message={upgradeModal.message}
      />
    </div>
  );
};

export default Tests;
