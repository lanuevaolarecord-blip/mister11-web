import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { generateTestsReport, generatePlayerTestReport } from '../utils/pdfGenerator';
import { GraficaEvolucion, GraficaResumen } from '../components/GraficasTest';
import RadarChart from '../components/RadarChart';
import TestDetail from './TestDetail';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import './Tests.css';

// PREDEFINED_TESTS remains as base catalog
const DEFAULT_TESTS = [
  { id: 't1', type: 'fisico', category: 'Resistencia', name: 'Test de Cooper', unit: 'm', desc: 'Distancia recorrida en 12 minutos.', protocol: 'Los jugadores deben correr la mayor distancia posible en 12 minutos alrededor de una pista o campo marcado. Se anota la distancia total en metros.' },
  { id: 't2', type: 'fisico', category: 'Resistencia', name: 'Course Navette', unit: 'nivel', desc: 'Carrera de ida y vuelta de 20m con pitidos.', protocol: 'Carreras de 20 metros al ritmo de un pitido de audio que se acelera cada minuto. Se anota el último palier completado.' },
  { id: 't3', type: 'fisico', category: 'Velocidad', name: 'Sprint 10m', unit: 'seg', desc: 'Aceleración en distancia corta.', protocol: 'Desde posición estática, sprint al máximo esfuerzo hasta rebasar la línea de 10 metros. Se usa cronómetro o fotocélulas.' },
  { id: 't4', type: 'fisico', category: 'Velocidad', name: 'Sprint 30m', unit: 'seg', desc: 'Velocidad máxima lanzada.', protocol: 'Igual que 10m, pero se mide el tiempo total a los 30 metros.' },
  { id: 't5', type: 'fisico', category: 'Agilidad', name: 'T-Test', unit: 'seg', desc: 'Desplazamientos frontales, laterales y de espaldas.', protocol: 'Sprint 10m al frente, desplazamiento lateral 5m a la izquierda, 10m a la derecha, 5m al centro y 10m de espaldas al inicio.' },
  { id: 't6', type: 'fisico', category: 'Fuerza', name: 'Salto CMJ', unit: 'cm', desc: 'Salto vertical con contramovimiento.', protocol: 'Las manos en las caderas. Bajar el centro de gravedad (flexión de rodillas) e inmediatamente saltar lo más alto posible.' },
  { id: 't7', type: 'fisico', category: 'Técnica', name: 'Conducción conos', unit: 'seg', desc: 'Slalom entre conos con finalización.', protocol: 'Conducir el balón haciendo slalom entre 5 conos separados por 2 metros y dar un pase a un objetivo.' },
  { id: 't8', type: 'fisico', category: 'Técnica', name: 'Pase a portería', unit: 'pts', desc: 'Precisión de pase a zonas objetivo (10 pases).', protocol: '10 pases desde la frontal del área hacia pequeñas porterías o zonas marcadas. 1 punto por acierto.' },

  { id: 'psi1', type: 'psicosocial', category: 'Afrontamiento', name: 'Inventario de Habilidades de Afrontamiento (ACSI-28)', unit: 'pts', desc: 'Evalúa cómo el jugador maneja la presión y la adversidad', protocol: 'Responder cuestionario en escala de 1 a 5.', rangoMin: 0, rangoMax: 30, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Mantengo la calma cuando cometo un error.', dimension: 'Afrontamiento' },
    { id: 'q2', text: 'Me recupero rápidamente tras una mala jugada.', dimension: 'Afrontamiento' },
    { id: 'q3', text: 'Me mantengo concentrado a pesar de las distracciones.', dimension: 'Concentración' },
    { id: 'q4', text: 'Puedo enfocarme solo en la tarea actual.', dimension: 'Concentración' },
    { id: 'q5', text: 'Siento seguridad en mis capacidades antes del partido.', dimension: 'Confianza' },
    { id: 'q6', text: 'No dudo de mí mismo en momentos críticos.', dimension: 'Confianza' }
  ] },
  { id: 'psi2', type: 'psicosocial', category: 'Fortaleza Mental', name: 'Cuestionario de Fortaleza Mental (MTQ-10)', unit: 'pts', desc: 'Mide la capacidad de perseverar bajo presión', protocol: 'Cuestionario de 4 preguntas.', rangoMin: 0, rangoMax: 20, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Mantengo el control emocional cuando las cosas van mal.', dimension: 'Control' },
    { id: 'q2', text: 'Cumplo con lo que me propongo hasta el final.', dimension: 'Compromiso' },
    { id: 'q3', text: 'Veo los problemas como oportunidades de mejora.', dimension: 'Desafío' },
    { id: 'q4', text: 'Confío en mi capacidad para superar obstáculos.', dimension: 'Confianza' }
  ] },
  { id: 'psi3', type: 'psicosocial', category: 'Metas', name: 'Escala de Establecimiento de Metas', unit: 'pts', desc: 'Evalúa capacidad de fijar y perseguir objetivos', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Planifico mis objetivos a corto y largo plazo.', dimension: 'Planificación' },
    { id: 'q2', text: 'Sigo trabajando duro aunque no vea resultados inmediatos.', dimension: 'Persistencia' },
    { id: 'q3', text: 'Evalúo mi progreso regularmente.', dimension: 'Revisión' }
  ] },
  { id: 'psi4', type: 'psicosocial', category: 'Liderazgo', name: 'Inventario de Liderazgo y Comunicación', unit: 'pts', desc: 'Mide habilidades de liderazgo y comunicación', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Me comunico de forma clara y directa con mis compañeros.', dimension: 'Comunicación' },
    { id: 'q2', text: 'Motivo a mis compañeros durante el juego.', dimension: 'Liderazgo' },
    { id: 'q3', text: 'Tomo buenas decisiones bajo presión.', dimension: 'Toma de decisiones' }
  ] },

  { id: 'soc1', type: 'socioemocional', category: 'Cohesión', name: 'Cuestionario de Cohesión de Equipo (GEQ)', unit: 'pts', desc: 'Evalúa la unión del grupo', protocol: 'Responder a 4 preguntas.', rangoMin: 0, rangoMax: 20, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Todos en el equipo comparten el mismo objetivo.', dimension: 'Cohesión de Tarea' },
    { id: 'q2', text: 'Nos esforzamos juntos para alcanzar las metas.', dimension: 'Cohesión de Tarea' },
    { id: 'q3', text: 'Me llevo bien con mis compañeros fuera del campo.', dimension: 'Cohesión Social' },
    { id: 'q4', text: 'Disfruto pasar tiempo con el equipo.', dimension: 'Cohesión Social' }
  ] },
  { id: 'soc2', type: 'socioemocional', category: 'Bienestar', name: 'Escala de Bienestar Mental (MHC-SF)', unit: 'pts', desc: 'Evalúa bienestar emocional, psicológico y social', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Me siento feliz y positivo la mayor parte del tiempo.', dimension: 'Emocional' },
    { id: 'q2', text: 'Siento que mi vida deportiva tiene propósito.', dimension: 'Psicológico' },
    { id: 'q3', text: 'Siento que pertenezco y soy valorado en el equipo.', dimension: 'Social' }
  ] },
  { id: 'soc3', type: 'socioemocional', category: 'Autoconciencia', name: 'Test de Autoconciencia Emocional', unit: 'pts', desc: 'Capacidad de reconocer y nombrar emociones propias', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Puedo identificar claramente lo que siento durante un partido.', dimension: 'Identificación' },
    { id: 'q2', text: 'Sé cómo expresar mis emociones de manera adecuada.', dimension: 'Expresión' },
    { id: 'q3', text: 'Puedo calmarme cuando siento frustración.', dimension: 'Regulación' }
  ] },
  { id: 'soc4', type: 'socioemocional', category: 'Empatía', name: 'Escala de Empatía Deportiva', unit: 'pts', desc: 'Capacidad de comprender emociones de compañeros', protocol: 'Responder a 2 preguntas.', rangoMin: 0, rangoMax: 10, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Entiendo cómo se sienten mis compañeros tras un error.', dimension: 'Empatía cognitiva' },
    { id: 'q2', text: 'Me afecta emocionalmente el éxito o fracaso del equipo.', dimension: 'Empatía afectiva' }
  ] },
  { id: 'soc5', type: 'socioemocional', category: 'Conflictos', name: 'Cuestionario de Resolución de Conflictos', unit: 'pts', desc: 'Habilidad para manejar desacuerdos constructivamente', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Busco soluciones en las que todos ganen.', dimension: 'Negociación' },
    { id: 'q2', text: 'Ayudo a resolver peleas entre compañeros.', dimension: 'Mediación' },
    { id: 'q3', text: 'Estoy dispuesto a ceder para llegar a un acuerdo.', dimension: 'Acuerdo' }
  ] }
];

const Tests = () => {
  const { user, activeTeamId } = useAuth();
  const { activeTeam } = useTeams();
  const { isPro } = usePlan();
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  const [historyData, setHistoryData] = useState({});
  const [activeTab, setActiveTab] = useState('FÍSICOS');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  
  // Registration State
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regSelectedTest, setRegSelectedTest] = useState('t1');
  const [regInputs, setRegInputs] = useState({});
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);

  // History State
  const [histSelectedPlayer, setHistSelectedPlayer] = useState(null);

  // Firestore Tests Loading
  const loadTests = useCallback(async () => {
    if (!user || !activeTeamId) return;
    try {
      const testsRef = collection(db, `users/${user.uid}/teams/${activeTeamId}/tests`);
      const q = query(testsRef);
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Migration: create predefined tests
        const batch = writeBatch(db);
        DEFAULT_TESTS.forEach(t => {
          const newDocRef = doc(testsRef, t.id);
          batch.set(newDocRef, t);
        });
        await batch.commit();
        setTests(DEFAULT_TESTS);
        if (DEFAULT_TESTS.length > 0) {
          setHeatSelectedTest(DEFAULT_TESTS[0].id);
        }
      } else {
        const loadedTests = [];
        snapshot.forEach(doc => {
          loadedTests.push({ ...doc.data(), id: doc.id });
        });
        setTests(loadedTests);
        if (loadedTests.length > 0) {
          setHeatSelectedTest(loadedTests[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading tests:", error);
    }
  }, [user, activeTeamId]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

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
  const [newTest, setNewTest] = useState({ name: '', type: 'fisico', category: 'Física', unit: '', desc: '', protocol: '' });
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);

  // Heatmap Selected Test
  const [heatSelectedTest, setHeatSelectedTest] = useState('t1');

  const getTestById = (id) => tests.find(t => String(t.id) === String(id));
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

  const handleCreateTest = async () => {
    if (!newTest.name || !newTest.unit) return alert("Nombre y unidad son obligatorios");
    if (!user || !activeTeamId) return;
    setLoading(true);
    try {
      const testsRef = collection(db, `users/${user.uid}/teams/${activeTeamId}/tests`);
      const newTestObj = { ...newTest, id: `custom_${Date.now()}` };
      await addDoc(testsRef, newTestObj);
      setTests([...tests, newTestObj]);
      setIsNewTestModalOpen(false);
      setNewTest({ name: '', type: 'fisico', category: 'Física', unit: '', desc: '', protocol: '' });
    } catch (error) {
      console.error(error);
      alert("Error al crear el test.");
    } finally {
      setLoading(false);
    }
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
          {['FÍSICOS', 'HABILIDADES PSICOSOCIALES', 'BIENESTAR SOCIOEMOCIONAL', 'HISTORIAL POR JUGADOR', 'COMPARATIVA EQUIPO'].map(tab => (
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
        {/* --- CATÁLOGO DE TESTS --- */}
        {['FÍSICOS', 'HABILIDADES PSICOSOCIALES', 'BIENESTAR SOCIOEMOCIONAL'].includes(activeTab) && (
          <div className="tab-bateria">
            <div className="bateria-header">
              <h3>Catálogo de Pruebas: {activeTab}</h3>
              <button className="btn-primary" onClick={() => setIsNewTestModalOpen(true)}>+ Crear Test</button>
            </div>
            
            <div className="tests-grid">
              {tests.filter(t => {
                if (activeTab === 'FÍSICOS') return t.type === 'fisico' || !t.type;
                if (activeTab === 'HABILIDADES PSICOSOCIALES') return t.type === 'psicosocial';
                if (activeTab === 'BIENESTAR SOCIOEMOCIONAL') return t.type === 'socioemocional';
                return false;
              }).map(t => (
                <div key={t.id} className="test-card clickable" onClick={() => setSelectedTestDetail(t)}>
                  <div className="t-head">
                    <span className="t-cat">{t.category}</span>
                    <span className="t-unit">{t.unit}</span>
                  </div>
                  <h4>{t.name}</h4>
                  <p>{t.desc}</p>
                  <button 
                    className="btn-primary" 
                    style={{marginTop: '15px'}} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (t.isQuestionnaire) {
                        setRegSelectedTest(t.id);
                        setIsQuestionnaireOpen(true);
                      } else {
                        setRegSelectedTest(t.id);
                        setIsRegModalOpen(true);
                      }
                    }}
                  >
                    Registrar Resultados
                  </button>
                </div>
              ))}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <GraficaResumen 
                    playerStats={tests.filter(t => !t.isQuestionnaire).map(t => {
                      const h = historyData[histSelectedPlayer]?.[t.id] || [];
                      let val = h.length > 0 ? h[h.length - 1].val : 0;
                      const isTime = t.unit === 'seg';
                      let radarVal = val;
                      if (isTime) radarVal = Math.max(0, 100 - (val * 5));
                      else if (t.unit === 'cm') radarVal = Math.min(100, val * 2);
                      else if (t.unit === 'nivel') radarVal = Math.min(100, val * 8);
                      else radarVal = Math.min(100, val);
                      return { subject: t.category, A: radarVal, fullMark: 100 };
                    })} 
                  />

                  {/* Render dimension radar if player has questionnaire data */}
                  {(() => {
                    const dimensionStats = {};
                    tests.filter(t => t.isQuestionnaire).forEach(t => {
                      const h = historyData[histSelectedPlayer]?.[t.id];
                      if (h && h.length > 0) {
                        const latest = h[h.length - 1];
                        if (latest.dimensiones) {
                          Object.keys(latest.dimensiones).forEach(dim => {
                            dimensionStats[dim] = latest.dimensiones[dim];
                          });
                        }
                      }
                    });

                    const dimData = Object.keys(dimensionStats).map(dim => ({
                      subject: dim,
                      value: dimensionStats[dim]
                    }));

                    if (dimData.length > 0) {
                      return <RadarChart data={dimData} color="#D4A843" />;
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div className="hist-charts-grid">
                {tests.map(t => {
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
                <select value={heatSelectedTest} onChange={e => setHeatSelectedTest(e.target.value)}>
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
                    <th>Eval Inicial</th>
                    <th>Penúltima Eval</th>
                    <th>Última Eval</th>
                    <th>Evolución</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => {
                    const testInfo = getTestById(heatSelectedTest);
                    const history = historyData[p.id]?.[heatSelectedTest] || [];
                    if(history.length === 0) return null;

                    // Calculate global min/max for color scale across ALL players for THIS test's LATEST eval
                    const allCurrentVals = players.map(mp => {
                      const mh = historyData[mp.id]?.[heatSelectedTest] || [];
                      return mh.length > 0 ? mh[mh.length - 1].val : null;
                    }).filter(v => v !== null);
                    
                    const minVal = allCurrentVals.length > 0 ? Math.min(...allCurrentVals) : 0;
                    const maxVal = allCurrentVals.length > 0 ? Math.max(...allCurrentVals) : 100;
                    const isTime = testInfo?.unit === 'seg';

                    let v1 = '-';
                    let v2 = '-';
                    let v3 = '-';
                    
                    if (history.length === 1) {
                      v3 = history[0].val;
                    } else if (history.length === 2) {
                      v1 = history[0].val;
                      v3 = history[1].val;
                    } else if (history.length >= 3) {
                      v1 = history[0].val;
                      v2 = history[history.length - 2].val;
                      v3 = history[history.length - 1].val;
                    }

                    const firstVal = history[0].val;
                    const improved = isTime ? v3 < firstVal : v3 > firstVal;
                    const diffPerc = firstVal && v3 !== '-' ? Math.abs(((v3 - firstVal)/firstVal)*100).toFixed(1) : 0;

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
                          {history.length > 1 ? (
                            <span className={`trend-badge ${improved ? 'good' : 'bad'}`}>
                              {improved ? '▲' : '▼'} {diffPerc}%
                            </span>
                          ) : (
                            <span className="trend-badge" style={{backgroundColor: '#e2e8f0', color: '#64748b'}}>-</span>
                          )}
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
                  <label>Tipo de Test</label>
                  <select value={newTest.type} onChange={e => setNewTest({...newTest, type: e.target.value})}>
                    <option value="fisico">Físico</option>
                    <option value="fisico">Físico</option>
                    <option value="psicosocial">Psicosocial</option>
                    <option value="socioemocional">Socioemocional</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoría Específica</label>
                  <input type="text" value={newTest.category} onChange={e => setNewTest({...newTest, category: e.target.value})} placeholder="Ej. Resistencia, Psicología..." />
                </div>
              </div>
              <div className="form-group">
                <label>Unidad de medida</label>
                <input type="text" value={newTest.unit} onChange={e => setNewTest({...newTest, unit: e.target.value})} placeholder="Ej. kg, seg, pts" />
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
                  if (selectedTestDetail.isQuestionnaire) {
                    setRegSelectedTest(selectedTestDetail.id);
                    setIsQuestionnaireOpen(true);
                  } else {
                    setRegSelectedTest(selectedTestDetail.id);
                    setIsRegModalOpen(true);
                  }
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

      {/* MODAL REGISTRO */}
      {isRegModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRegModalOpen(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registro de Resultados: {getTestById(regSelectedTest)?.name}</h2>
              <button className="btn-close" onClick={() => setIsRegModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="reg-main-header" style={{ marginBottom: '15px' }}>
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
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsRegModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => {
                handleSaveRegistration();
                setIsRegModalOpen(false);
              }}>Guardar Resultados</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CUESTIONARIO LIKERT */}
      {isQuestionnaireOpen && getTestById(regSelectedTest) && (
        <TestDetail 
          test={getTestById(regSelectedTest)} 
          players={players} 
          onClose={() => setIsQuestionnaireOpen(false)}
          onSave={async (playerId, evalData) => {
            if(!user || !activeTeamId) return;
            try {
              await addDoc(collection(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`), {
                testId: regSelectedTest,
                jugadorId: playerId,
                categoria: getTestById(regSelectedTest).type,
                fecha: serverTimestamp(),
                ...evalData
              });
              alert('Resultados del cuestionario guardados.');
              setIsQuestionnaireOpen(false);
              loadEvaluations();
            } catch(e) {
              console.error(e);
              alert("Error al guardar cuestionario");
            }
          }}
        />
      )}
    </div>
  );
};

export default Tests;
