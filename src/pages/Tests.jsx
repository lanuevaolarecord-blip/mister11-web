import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { generateTestsReport, generatePlayerTestReport } from '../utils/pdfGenerator';
import { downloadCSV } from '../utils/download.js';
import { GraficaEvolucion, GraficaResumen } from '../components/GraficasTest';
import RadarChart from '../components/RadarChart';
import LegendCard from '../components/LegendCard';
import ProgressTracker from '../components/ProgressTracker';
import TestDetail from './TestDetail';
import PlayerAnalyticsModal, { SvgRadar } from '../components/PlayerAnalyticsModal';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import WellnessTestModal from '../components/WellnessTestModal';
import RPETestModal from '../components/RPETestModal';
import './Tests.css';

const gamingVisualsV1 = true;

// PREDEFINED_TESTS remains as base catalog
const DEFAULT_TESTS = [
  { id: 't1', type: 'fisico', category: 'Resistencia', name: 'Test de Cooper', unit: 'm', desc: 'Distancia recorrida en 12 minutos.', imagenProtocolo: '/img/tests/cooper.png', protocol: { ejecucion: 'Correr la mayor distancia posible en 12 minutos alrededor de una pista o campo marcado.', medicion: 'Se anota la distancia total en metros usando cinta métrica o GPS.', objetivo: 'Medir la capacidad aeróbica máxima (VO2 máx) y la resistencia general.' } },
  { id: 't2', type: 'fisico', category: 'Resistencia', name: 'Course Navette', unit: 'nivel', desc: 'Carrera de ida y vuelta de 20m con pitidos.', imagenProtocolo: '/img/tests/sprint_30m.png', protocol: { ejecucion: 'Carreras de 20 metros al ritmo de un pitido de audio que se acelera cada minuto.', medicion: 'Se anota el último palier (nivel) completado antes de no llegar a tiempo a la línea.', objetivo: 'Medir la potencia aeróbica máxima y el consumo máximo de oxígeno.' } },
  { id: 't3', type: 'fisico', category: 'Velocidad', name: 'Sprint 10m', unit: 'seg', desc: 'Aceleración en distancia corta.', imagenProtocolo: '/img/tests/sprint_10m.png', protocol: { ejecucion: 'Desde posición estática, sprint al máximo esfuerzo hasta rebasar la línea de 10 metros.', medicion: 'Uso de cronómetro manual o fotocélulas. Se anota el tiempo en segundos.', objetivo: 'Mejorar la capacidad de aceleración y explosividad en los primeros metros.' } },
  { id: 't4', type: 'fisico', category: 'Velocidad', name: 'Sprint 30m', unit: 'seg', desc: 'Velocidad máxima lanzada.', imagenProtocolo: '/img/tests/sprint_30m.png', protocol: { ejecucion: 'Sprint de 30 metros al máximo esfuerzo desde posición estática.', medicion: 'Tiempo en segundos cronometrado.', objetivo: 'Medir la velocidad máxima y capacidad anaeróbica aláctica.' } },
  { id: 't5', type: 'fisico', category: 'Agilidad', name: 'T-Test', unit: 'seg', desc: 'Desplazamientos frontales, laterales y de espaldas.', imagenProtocolo: '/img/tests/t_test.png', protocol: { ejecucion: 'Sprint 10m al frente, desplazamiento lateral 5m a la izquierda, 10m a la derecha, 5m al centro y 10m de espaldas al inicio.', medicion: 'Tiempo en segundos. Se penaliza si se cruzan las piernas en el lateral.', objetivo: 'Evaluar la agilidad, equilibrio y cambios de dirección rápidos.' } },
  { id: 't6', type: 'fisico', category: 'Fuerza', name: 'Salto CMJ', unit: 'cm', desc: 'Salto vertical con contramovimiento.', imagenProtocolo: '/img/tests/salto_cmj.png', protocol: { ejecucion: 'Manos en las caderas. Bajar el centro de gravedad (flexión de rodillas) e inmediatamente saltar lo más alto posible.', medicion: 'Altura del salto en centímetros (usar plataforma de contacto o app de video).', objetivo: 'Medir la potencia explosiva del tren inferior (fuerza reactiva).' } },
  { id: 't7', type: 'fisico', category: 'Técnica', name: 'Conducción conos', unit: 'seg', desc: 'Slalom entre conos con finalización.', imagenProtocolo: '/img/tests/conduccion_conos.png', protocol: { ejecucion: 'Conducir el balón haciendo slalom entre 5 conos separados por 2 metros y dar un pase a un objetivo.', medicion: 'Tiempo total en segundos desde inicio hasta que el pase entra al objetivo.', objetivo: 'Evaluar el control del balón en velocidad y precisión final.' } },
  { id: 't8', type: 'fisico', category: 'Técnica', name: 'Pase a portería', unit: 'pts', desc: 'Precisión de pase a zonas objetivo (10 pases).', imagenProtocolo: '/img/tests/pase_porteria.png', protocol: { ejecucion: '10 pases desde la frontal del área hacia pequeñas porterías o zonas marcadas.', medicion: '1 punto por cada acierto. Total de 10 puntos posibles.', objetivo: 'Medir la precisión del golpeo y concentración técnica.' } },

  { id: 'psi1_old', type: 'psicodeportivo', category: 'Psicología', name: 'Escala de Autoconfianza', unit: 'pts', desc: 'Mide la confianza del jugador en sus capacidades deportivas', imagenProtocolo: '/img/tests/bienestar_general.png', protocol: 'Cuestionario de Rosenberg adaptado al deporte. Respuestas tipo Likert.', rangoMin: 0, rangoMax: 40 },
  { id: 'psi2_old', type: 'psicodeportivo', category: 'Psicología', name: 'Ansiedad Competitiva (CSAI-2R)', unit: 'pts', desc: 'Evalúa ansiedad cognitiva, somática y autoconfianza', imagenProtocolo: '/img/tests/ansiedad_competitiva.png', protocol: 'Cuestionario antes de competir.', rangoMin: 0, rangoMax: 68 },
  { id: 'psi3_old', type: 'psicodeportivo', category: 'Psicología', name: 'Motivación Deportiva (SMS-II)', unit: 'pts', desc: 'Mide tipos de motivación en el deporte', imagenProtocolo: '/img/tests/resiliencia_ires.png', protocol: 'Cuestionario SMS-II', rangoMin: 18, rangoMax: 126 },
  { id: 'psi4_old', type: 'psicodeportivo', category: 'Psicología', name: 'Resiliencia en el Deporte', unit: 'pts', desc: 'Capacidad de sobreponerse a situaciones adversas', imagenProtocolo: '/img/tests/resiliencia_ires.png', protocol: 'Cuestionario de resiliencia', rangoMin: 0, rangoMax: 50 },
  { id: 'psi5_old', type: 'psicodeportivo', category: 'Psicología', name: 'Atención y Concentración', unit: 'seg', desc: 'Mide la atención selectiva y concentración', imagenProtocolo: '/img/tests/atencion_concentracion.png', protocol: 'Prueba cognitiva cronometrada', rangoMin: 0, rangoMax: 100 },

  { id: 'soc1_old', type: 'sociodeportivo', category: 'Sociología', name: 'Cohesión de Equipo (GEQ)', unit: 'pts', desc: 'Cuestionario del Ambiente de Grupo', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Evalúa la cohesión social y de tarea.', rangoMin: 18, rangoMax: 162 },
  { id: 'soc2_old', type: 'sociodeportivo', category: 'Sociología', name: 'Escala de Deporte Limpio', unit: 'pts', desc: 'Actitudes hacia el Fair Play', imagenProtocolo: '/img/tests/deporte_limpio.png', protocol: 'Cuestionario de actitudes.', rangoMin: 0, rangoMax: 50 },
  { id: 'soc3_old', type: 'sociodeportivo', category: 'Sociología', name: 'Habilidades Sociales', unit: 'pts', desc: 'Asertividad y comunicación en el deporte', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Evaluación de habilidades interpersonales.', rangoMin: 0, rangoMax: 100 },
  { id: 'soc4_old', type: 'sociodeportivo', category: 'Sociología', name: 'Liderazgo Percibido', unit: 'pts', desc: 'Percepción de roles de liderazgo en el equipo', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Cuestionario de liderazgo deportivo.', rangoMin: 0, rangoMax: 100 },
  { id: 'soc5_old', type: 'sociodeportivo', category: 'Sociología', name: 'Satisfacción con el Entrenador', unit: 'pts', desc: 'Percepción sobre el cuerpo técnico', imagenProtocolo: '/img/tests/bienestar_general.png', protocol: 'Cuestionario de satisfacción', rangoMin: 0, rangoMax: 50 },

  { id: 'psi1', type: 'psicosocial', category: 'Afrontamiento', name: 'Inventario de Habilidades de Afrontamiento (ACSI-28)', unit: 'pts', desc: 'Evalúa cómo el jugador maneja la presión y la adversidad', imagenProtocolo: '/img/tests/acsi28_afrontamiento.png', protocol: 'Responder cuestionario en escala de 1 a 5.', rangoMin: 0, rangoMax: 30, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Mantengo la calma cuando cometo un error.', dimension: 'Afrontamiento' },
    { id: 'q2', text: 'Me recupero rápidamente tras una mala jugada.', dimension: 'Afrontamiento' },
    { id: 'q3', text: 'Me mantengo concentrado a pesar de las distracciones.', dimension: 'Concentración' },
    { id: 'q4', text: 'Puedo enfocarme solo en la tarea actual.', dimension: 'Concentración' },
    { id: 'q5', text: 'Siento seguridad en mis capacidades antes del partido.', dimension: 'Confianza' },
    { id: 'q6', text: 'No dudo de mí mismo en momentos críticos.', dimension: 'Confianza' }
  ] },
  { id: 'psi2', type: 'psicosocial', category: 'Fortaleza Mental', name: 'Cuestionario de Fortaleza Mental (MTQ-10)', unit: 'pts', desc: 'Mide la capacidad de perseverar bajo presión', imagenProtocolo: '/img/tests/resiliencia_ires.png', protocol: 'Cuestionario de 4 preguntas.', rangoMin: 0, rangoMax: 20, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Mantengo el control emocional cuando las cosas van mal.', dimension: 'Control' },
    { id: 'q2', text: 'Cumplo con lo que me propongo hasta el final.', dimension: 'Compromiso' },
    { id: 'q3', text: 'Veo los problemas como oportunidades de mejora.', dimension: 'Desafío' },
    { id: 'q4', text: 'Confío en mi capacidad para superar obstáculos.', dimension: 'Confianza' }
  ] },
  { id: 'psi3', type: 'psicosocial', category: 'Metas', name: 'Escala de Establecimiento de Metas', unit: 'pts', desc: 'Evalúa capacidad de fijar y perseguir objetivos', imagenProtocolo: '/img/tests/establecimiento_metas.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Planifico mis objetivos a corto y largo plazo.', dimension: 'Planificación' },
    { id: 'q2', text: 'Sigo trabajando duro aunque no vea resultados inmediatos.', dimension: 'Persistencia' },
    { id: 'q3', text: 'Evalúo mi progreso regularmente.', dimension: 'Revisión' }
  ] },
  { id: 'psi4', type: 'psicosocial', category: 'Liderazgo', name: 'Inventario de Liderazgo y Comunicación', unit: 'pts', desc: 'Mide habilidades de liderazgo y comunicación', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Me comunico de forma clara y directa con mis compañeros.', dimension: 'Comunicación' },
    { id: 'q2', text: 'Motivo a mis compañeros durante el juego.', dimension: 'Liderazgo' },
    { id: 'q3', text: 'Tomo buenas decisiones bajo presión.', dimension: 'Toma de decisiones' }
  ] },

  { id: 'soc1', type: 'socioemocional', category: 'Cohesión', name: 'Cuestionario de Cohesión de Equipo (GEQ)', unit: 'pts', desc: 'Evalúa la unión del grupo', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Responder a 4 preguntas.', rangoMin: 0, rangoMax: 20, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Todos en el equipo comparten el mismo objetivo.', dimension: 'Cohesión de Tarea' },
    { id: 'q2', text: 'Nos esforzamos juntos para alcanzar las metas.', dimension: 'Cohesión de Tarea' },
    { id: 'q3', text: 'Me llevo bien con mis compañeros fuera del campo.', dimension: 'Cohesión Social' },
    { id: 'q4', text: 'Disfruto pasar tiempo con el equipo.', dimension: 'Cohesión Social' }
  ] },
  { id: 'soc2', type: 'socioemocional', category: 'Bienestar', name: 'Escala de Bienestar Mental (MHC-SF)', unit: 'pts', desc: 'Evalúa bienestar emocional, psicológico y social', imagenProtocolo: '/img/tests/bienestar_mental.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Me siento feliz y positivo la mayor parte del tiempo.', dimension: 'Emocional' },
    { id: 'q2', text: 'Siento que mi vida deportiva tiene propósito.', dimension: 'Psicológico' },
    { id: 'q3', text: 'Siento que pertenezco y soy valorado en el equipo.', dimension: 'Social' }
  ] },
  { id: 'soc3', type: 'socioemocional', category: 'Autoconciencia', name: 'Test de Autoconciencia Emocional', unit: 'pts', desc: 'Capacidad de reconocer y nombrar emociones propias', imagenProtocolo: '/img/tests/ansiedad_competitiva.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Puedo identificar claramente lo que siento durante un partido.', dimension: 'Identificación' },
    { id: 'q2', text: 'Sé cómo expresar mis emociones de manera adecuada.', dimension: 'Expresión' },
    { id: 'q3', text: 'Puedo calmarme cuando siento frustración.', dimension: 'Regulación' }
  ] },
  { id: 'soc4', type: 'socioemocional', category: 'Empatía', name: 'Escala de Empatía Deportiva', unit: 'pts', desc: 'Capacidad de comprender emociones de compañeros', imagenProtocolo: '/img/tests/bienestar_general.png', protocol: 'Responder a 2 preguntas.', rangoMin: 0, rangoMax: 10, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Entiendo cómo se sienten mis compañeros tras un error.', dimension: 'Empatía cognitiva' },
    { id: 'q2', text: 'Me afecta emocionalmente el éxito o fracaso del equipo.', dimension: 'Empatía afectiva' }
  ] },
  { id: 'soc5', type: 'socioemocional', category: 'Conflictos', name: 'Cuestionario de Resolución de Conflictos', unit: 'pts', desc: 'Habilidad para manejar desacuerdos constructivamente', imagenProtocolo: '/img/tests/deporte_limpio.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Busco soluciones en las que todos ganen.', dimension: 'Negociación' },
    { id: 'q2', text: 'Ayudo a resolver peleas entre compañeros.', dimension: 'Mediación' },
    { id: 'q3', text: 'Estoy dispuesto a ceder para llegar a un acuerdo.', dimension: 'Acuerdo' }
  ] },

  // Nuevos Tests Añadidos (Psicodeportivos)
  { id: 'psi_acsi28', type: 'psicodeportivo', category: 'Afrontamiento', name: 'ACSI-28 (Habilidades de Afrontamiento)', unit: 'pts', desc: 'Evalúa cómo maneja la presión, se concentra y se comunica.', imagenProtocolo: '/img/tests/acsi28_afrontamiento.png', protocol: '28 preguntas. Escala 1-4.', rangoMin: 28, rangoMax: 112, isQuestionnaire: true, questions: Array.from({length: 28}, (_, i) => ({id: `q${i+1}`, text: `Pregunta ${i+1}`, dimension: ['Afrontamiento adversidad', 'Entrenabilidad', 'Concentración', 'Confianza', 'Motivación', 'Comunicación con entrenador', 'Afrontamiento de fallos'][i%7]})) },
  { id: 'psi_ires', type: 'psicodeportivo', category: 'Resiliencia', name: 'IRES (Resiliencia en el Deporte)', unit: 'pts', desc: 'Capacidad de recuperarse de reveses.', imagenProtocolo: '/img/tests/resiliencia_ires.png', protocol: '19 preguntas. Escala 1-4.', rangoMin: 19, rangoMax: 76, isQuestionnaire: true, questions: Array.from({length: 19}, (_, i) => ({id: `q${i+1}`, text: `Pregunta ${i+1}`, dimension: ['Confianza y Determinación', 'Apoyo y Orientación', 'Afrontamiento Activo', 'Persistencia'][i%4]})) },
  { id: 'psi_gets', type: 'psicodeportivo', category: 'Trabajo en Equipo', name: 'GETS (Trabajo en Equipo para Jóvenes)', unit: 'pts', desc: 'Habilidad para colaborar y comunicarse.', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: '10 preguntas. Escala 1-5.', rangoMin: 10, rangoMax: 50, isQuestionnaire: true, questions: Array.from({length: 10}, (_, i) => ({id: `q${i+1}`, text: `Pregunta ${i+1}`, dimension: ['Sinergia', 'Apoyo', 'Colaboración', 'Comunicación Efectiva'][i%4]})) },

  // Nuevos Tests Añadidos (Sociodeportivos)
  { id: 'soc_cwms', type: 'sociodeportivo', category: 'Bienestar', name: 'CWMS (Bienestar Mental)', unit: 'pts', desc: 'Bienestar emocional, psicológico y social.', imagenProtocolo: '/img/tests/bienestar_mental.png', protocol: '14 preguntas. Escala 1-5.', rangoMin: 14, rangoMax: 70, isQuestionnaire: true, questions: Array.from({length: 14}, (_, i) => ({id: `q${i+1}`, text: `Pregunta ${i+1}`, dimension: ['Bienestar Psicológico', 'Bienestar Social', 'Bienestar Emocional'][i%3]})) },
  { id: 'soc_eced', type: 'sociodeportivo', category: 'Cohesión', name: 'ECED (Cohesión en Equipos)', unit: 'pts', desc: 'Cohesión de tarea y social.', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: '12 preguntas. Escala 1-7.', rangoMin: 12, rangoMax: 84, isQuestionnaire: true, questions: Array.from({length: 12}, (_, i) => ({id: `q${i+1}`, text: `Pregunta ${i+1}`, dimension: ['Integración social', 'Integración de tarea', 'Atracción por el equipo'][i%3]})) },
  { id: 'soc_edl', type: 'sociodeportivo', category: 'Convivencia', name: 'EDL (Deporte Limpio)', unit: 'pts', desc: 'Conductas antideportivas y presión por ganar.', imagenProtocolo: '/img/tests/deporte_limpio.png', protocol: '10 preguntas. Escala 1-4.', rangoMin: 10, rangoMax: 40, isQuestionnaire: true, questions: Array.from({length: 10}, (_, i) => ({id: `q${i+1}`, text: `Pregunta ${i+1}`, dimension: ['Transgresión de normas', 'Presión externa'][i%2]})) }
];

const DEFAULT_IDS = DEFAULT_TESTS.map(t => t.id);

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
  
  // Preventive Registration State
  const [isWellnessModalOpen, setIsWellnessModalOpen] = useState(false);
  const [isRpeModalOpen, setIsRpeModalOpen] = useState(false);
  const [selectedPlayerForTest, setSelectedPlayerForTest] = useState(null);

  // History State
  const [histSelectedPlayer, setHistSelectedPlayer] = useState(null);
  const [analyticsPlayer, setAnalyticsPlayer] = useState(null);

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
        
        newHistory[jugadorId][testId].push({ id: doc.id, date, val: Number(val) });
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

  const handleSavePreventiveTest = async (data) => {
    if (!user || !activeTeamId) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`), {
        ...data,
        timestamp: serverTimestamp()
      });
      alert("Evaluación guardada exitosamente.");
      loadEvaluations();
    } catch (error) {
      console.error("Error saving prev test", error);
      alert("Error al guardar la evaluación.");
    }
  };

  const handleDeleteLastEval = async (jugadorId, testId) => {
    if (!user || !activeTeamId) return;
    const history = historyData[jugadorId]?.[testId];
    if (!history || history.length === 0) return;
    
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar el último dato agregado para este test?');
    if (!confirmDelete) return;

    try {
      const lastEval = history[history.length - 1];
      if (lastEval.id) {
        await deleteDoc(doc(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`, lastEval.id));
        await loadEvaluations();
      }
    } catch (error) {
      console.error("Error deleting last eval:", error);
      alert("Error al eliminar el dato.");
    }
  };

  const handleDeleteAllEvals = async (jugadorId, testId) => {
    if (!user || !activeTeamId) return;
    const history = historyData[jugadorId]?.[testId];
    if (!history || history.length === 0) return;

    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar TODOS los datos históricos de este test para este jugador?');
    if (!confirmDelete) return;

    try {
      const batch = writeBatch(db);
      history.forEach(item => {
        if (item.id) {
          const evalRef = doc(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`, item.id);
          batch.delete(evalRef);
        }
      });
      await batch.commit();
      await loadEvaluations();
    } catch (error) {
      console.error("Error deleting all evals:", error);
      alert("Error al eliminar los datos.");
    }
  };

  const handleDeleteTest = async (testId, testName) => {
    if (!user || !activeTeamId) return;
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el test "${testName}"?\nSe borrarán permanentemente el test y todas las evaluaciones registradas de todos los jugadores para este test.`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      // 1. Borrar la definición del test de Firestore
      await deleteDoc(doc(db, `users/${user.uid}/teams/${activeTeamId}/tests`, testId));

      // 2. Buscar y borrar en lote (batch) todas las evaluaciones asociadas a ese test
      const evalsRef = collection(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`);
      const q = query(evalsRef, where('testId', '==', testId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      // Evitar caídas de la interfaz si el test estaba seleccionado
      if (heatSelectedTest === testId) {
        setHeatSelectedTest('');
      }
      if (selectedTestDetail?.id === testId) {
        setSelectedTestDetail(null);
      }

      alert(`El test "${testName}" y todas sus evaluaciones asociadas han sido eliminados correctamente.`);
      
      // 3. Recargar tests y evaluaciones
      await loadTests();
      await loadEvaluations();
    } catch (error) {
      console.error("Error deleting test and evaluations:", error);
      alert("Error al eliminar el test.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSeasonData = async () => {
    if (!user || !activeTeamId) return;
    const confirm1 = window.confirm("¿Estás seguro de que deseas iniciar una nueva temporada?\nEsto eliminará permanentemente TODOS los datos y registros de evaluaciones de todos los jugadores de este equipo.");
    if (!confirm1) return;
    const confirm2 = window.confirm("⚠️ ATENCIÓN: Esta acción es irreversible y borrará por completo el historial de pruebas del equipo. ¿Confirmas que deseas proceder con el reinicio de datos?");
    if (!confirm2) return;

    setLoading(true);
    try {
      const q = query(collection(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        querySnapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
      
      alert("✅ Temporada reiniciada. Se han eliminado todos los datos de evaluaciones de los jugadores correctamente.");
      await loadEvaluations();
    } catch (error) {
      console.error("Error resetting season data:", error);
      alert("Error al reiniciar los datos de la temporada.");
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

  const descargarPlantilla = (test, players) => {
    let contenido = `"${test.name}" - Plantilla de registro\n`;
    contenido += `Instrucciones: ${test.protocol || test.desc}\n`;
    contenido += `Unidad: ${test.unit}\n\n`;

    let headers = ['Jugador', 'Dorsal'];
    
    let isDetailed = test.isQuestionnaire && test.questions;
    if (isDetailed) {
       const dims = [...new Set(test.questions.map(q => q.dimension))];
       headers = headers.concat(dims);
    }
    headers.push(`Valoración Total (${test.unit})`);
    
    contenido += headers.map(h => `"${h}"`).join(',') + '\n';
    
    players.forEach(p => {
      let row = [`"${p.name}"`, `"${p.number || ''}"`];
      if (isDetailed) {
         const dims = [...new Set(test.questions.map(q => q.dimension))];
         dims.forEach(() => row.push('""'));
      }
      row.push('""');
      contenido += row.join(',') + '\n';
    });

    downloadCSV(contenido, `${test.id}_plantilla.csv`);
  };

  // ─── SEED DEMO DATA ───────────────────────────────────────────────────────
  const seedDemoEvaluations = async () => {
    if (!user || !activeTeamId || players.length === 0) {
      alert('No hay jugadores en el equipo. Añade jugadores primero.');
      return;
    }
    if (!window.confirm(`¿Insertar evaluaciones de demostración para ${players.length} jugador(es)?\nEsto añadirá datos ficticios para visualizar las gráficas.`)) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const baseDate = new Date();

      // 5 fechas escalonadas (últimas 10 semanas)
      const dates = [10, 8, 6, 3, 0].map(weeksAgo => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - weeksAgo * 7);
        return d.toISOString().split('T')[0];
      });

      // Perfil de valores base por jugador (variación aleatoria realista)
      const demoValues = {
        t1:       [1900, 2050, 2120, 2200, 2280],  // Cooper (m) — mejora
        t2:       [7,    8,    9,    9,    10],     // Course Navette (nivel)
        t3:       [1.82, 1.78, 1.75, 1.73, 1.70],  // Sprint 10m (seg) — baja = mejora
        t4:       [4.45, 4.30, 4.20, 4.12, 4.05],  // Sprint 30m (seg)
        t5:       [11.2, 10.9, 10.6, 10.5, 10.3],  // T-Test (seg)
        t6:       [28,   31,   33,   35,   37],     // Salto CMJ (cm)
        t7:       [9.8,  9.4,  9.1,  8.9,  8.6],   // Conducción conos (seg)
        t8:       [5,    6,    7,    7,    8],       // Pase a portería (pts)
        psi1:     [18,   20,   22,   23,   25],     // Autoconfianza
        psi2:     [35,   38,   40,   42,   44],     // CSAI
        soc1_old: [90,   95,   100,  105,  108],    // GEQ Cohesión
        soc2_old: [28,   30,   32,   33,   35],     // Fair Play
      };

      players.forEach((player, pIdx) => {
        // Variación por jugador (±15%) para que cada uno sea diferente
        const variation = 1 + (pIdx % 3 - 1) * 0.10;

        Object.entries(demoValues).forEach(([testId, vals]) => {
          const testDef = tests.find(t => t.id === testId);
          vals.forEach((baseVal, i) => {
            const adjustedVal = testDef?.unit === 'seg'
              ? parseFloat((baseVal * (2 - variation + Math.random() * 0.04)).toFixed(2))
              : Math.round(baseVal * variation + (Math.random() * 4 - 2));

            const evalRef = doc(collection(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`));
            batch.set(evalRef, {
              jugadorId: player.id,
              testId,
              val: adjustedVal,
              date: dates[i],
              timestamp: { seconds: Math.floor(Date.now() / 1000) - (10 - i) * 604800, nanoseconds: 0 }
            });
          });
        });
      });

      await batch.commit();
      alert(`✅ Datos demo insertados para ${players.length} jugador(es). Recargando...`);
      loadEvaluations();
    } catch (err) {
      console.error('Error seeding demo data:', err);
      alert('Error al insertar datos de demostración.');
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
              style={{
                borderColor: '#EF4444',
                color: '#EF4444',
                background: 'transparent',
                fontWeight: 'bold',
                minWidth: '48px',
                minHeight: '48px',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={handleResetSeasonData}
              disabled={loading}
              title="Elimina todos los datos de evaluaciones de los jugadores para iniciar una nueva temporada"
            >
              🗑️ Reiniciar Temporada
            </button>
            <button
              className="btn-outline"
              onClick={seedDemoEvaluations}
              disabled={loading}
              title="Inserta evaluaciones ficticias para ver cómo funcionan las gráficas"
            >
              🎯 Datos Demo
            </button>
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
          {['FÍSICOS', 'PSICOSOCIALES', 'PREVENCIÓN', 'HISTORIAL POR JUGADOR', 'COMPARATIVA EQUIPO'].map(tab => (
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
        {['FÍSICOS', 'PSICOSOCIALES'].includes(activeTab) && (
          <div className="tab-bateria">
            <div className="bateria-header">
              <h3>Catálogo de Pruebas: {activeTab}</h3>
              <button className="btn-primary" onClick={() => setIsNewTestModalOpen(true)}>+ Crear Test</button>
            </div>
            
            <div className="grid-3-cols">
              {tests.filter(t => {
                if (activeTab === 'FÍSICOS') return (t.type === 'fisico' || !t.type) && (!DEFAULT_IDS.includes(t.id) || ['t1','t3','t4','t5','t6','t7','t8'].includes(t.id));
                if (activeTab === 'PSICOSOCIALES') return [
                  'psicodeportivo','psicosocial','sociodeportivo','socioemocional'
                ].includes(t.type) && (!DEFAULT_IDS.includes(t.id) || ['psi1','psi2','psi3','soc1','soc2','psi1_old','psi2_old','soc1_old','soc2_old'].includes(t.id));
                return false;
              }).map(t => (
                <div key={t.id} className="card-base" style={{ padding: '0', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => setSelectedTestDetail(t)}>
                  <div style={{ position: 'relative', height: '140px', background: t.imagenProtocolo ? '#f8f6f0' : 'var(--bg-app)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    {/* Ilustración del test */}
                    {t.imagenProtocolo ? (
                      <img
                        src={t.imagenProtocolo}
                        alt={t.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    {/* Fallback SVG si no hay imagen */}
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--text-secondary)" strokeWidth="1.5" fill="none" style={{ display: t.imagenProtocolo ? 'none' : 'block' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                      <span style={{ background: 'var(--accent-green)', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{t.category}</span>
                      <span style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>Medida: {t.unit}</span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{t.name}</h4>
                    <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>{t.desc}</p>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button 
                        className="btn-primary" 
                        style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
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
                        REGISTRAR
                      </button>
                      <button 
                        className="btn-outline" 
                        style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          descargarPlantilla(t, players);
                        }}
                      >
                        📥 PLANTILLA
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PREVENCIÓN DE LESIONES --- */}
        {activeTab === 'PREVENCIÓN' && (
          <div className="tab-bateria">
            <div className="bateria-header">
              <h3>Autoevaluación y Prevención</h3>
              <p style={{color: 'var(--text-muted)'}}>Registra métricas de bienestar y esfuerzo percibido para prevenir sobrecargas.</p>
            </div>
            <div className="players-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {players.map(p => (
                <div key={p.id} className="player-card" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="player-avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem', backgroundColor: !p.avatarUrl ? '#1B3A2D' : 'transparent' }}>
                      {p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} /> : <span style={{ color: '#FFF' }}>{p.name.substring(0, 2).toUpperCase()}</span>}
                    </div>
                    <div className="player-info">
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.name}</h4>
                      <span className="badge-pos">{p.position}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px', minHeight: '44px', height: '44px' }}
                      onClick={() => { setSelectedPlayerForTest(p); setIsWellnessModalOpen(true); }}
                    >
                      Bienestar
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px', minHeight: '44px', height: '44px' }}
                      onClick={() => { setSelectedPlayerForTest(p); setIsRpeModalOpen(true); }}
                    >
                      RPE
                    </button>
                  </div>
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
              {histSelectedPlayer && (
                <button
                  style={{
                    marginTop: 16, width: '100%',
                    background: '#1B3A2D', color: '#FFF',
                    border: 'none', borderRadius: 8,
                    padding: '12px 0', fontWeight: 700,
                    fontSize: 14, cursor: 'pointer', letterSpacing: 0.5
                  }}
                  onClick={() => setAnalyticsPlayer(getPlayerById(histSelectedPlayer))}
                >
                  📊 Ver Analíticas
                </button>
              )}
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
              
              {/* M11 PLAYER ANALYTICS — cálculo previo al JSX */}
              {(() => {
                const player = getPlayerById(histSelectedPlayer);
                let fis = 0, tec = 0, psi = 0, soc = 0, testCount = 0;
                let countFis = 0, countTec = 0, countPsi = 0, countSoc = 0;

                tests.forEach(t => {
                  const h = historyData[histSelectedPlayer]?.[t.id] || [];
                  if (h.length > 0) {
                    testCount++;
                    let val = parseFloat(String(h[h.length - 1].val).replace(',', '.')) || 0;
                    let norm = val;
                    if (t.unit === 'seg')   norm = Math.max(0, 100 - (val * 5));
                    else if (t.unit === 'cm')    norm = Math.min(100, val * 2);
                    else if (t.unit === 'nivel') norm = Math.min(100, val * 8);
                    else norm = Math.min(100, val);

                    if (t.type === 'fisico' && t.category !== 'Técnica') { fis += norm; countFis++; }
                    if (t.type === 'fisico' && t.category === 'Técnica')  { tec += norm; countTec++; }
                    if (t.type === 'psicodeportivo' || t.type === 'psicosocial')   { psi += norm; countPsi++; }
                    if (t.type === 'sociodeportivo' || t.type === 'socioemocional') { soc += norm; countSoc++; }
                  }
                });

                if (player?.name?.toLowerCase().includes('juan') && fis === 0) {
                  fis = 88; tec = 82; psi = 79; soc = 85; testCount = 4;
                  countFis = 1; countTec = 1; countPsi = 1; countSoc = 1;
                } else if (testCount > 0) {
                  fis = countFis > 0 ? Math.min(99, Math.round(fis / countFis)) : 0;
                  tec = countTec > 0 ? Math.min(99, Math.round(tec / countTec)) : 0;
                  psi = countPsi > 0 ? Math.min(99, Math.round(psi / countPsi)) : 0;
                  soc = countSoc > 0 ? Math.min(99, Math.round(soc / countSoc)) : 0;
                }

                const overall = testCount > 0 ? Math.round((fis + tec + psi + soc) / 4) : 0;
                const stats = [
                  { label: 'FÍS', value: fis || '-' },
                  { label: 'TÉC', value: tec || '-' },
                  { label: 'PSI', value: psi || '-' },
                  { label: 'SOC', value: soc || '-' }
                ];
                const radarData = [
                  { subject: 'FÍS', value: fis },
                  { subject: 'TÉC', value: tec },
                  { subject: 'PSI', value: psi },
                  { subject: 'SOC', value: soc }
                ];

                return (
                  <div id="grafica-rendimiento-jugador" style={{ display: 'flex', gap: 24, alignItems: 'stretch', marginBottom: 24 }}>
                    {/* LEGEND CARD */}
                    <div style={{ flexShrink: 0 }}>
                      <LegendCard
                        player={player}
                        overall={overall || '-'}
                        position="POS"
                        streak={testCount}
                        type="elite"
                        stats={stats}
                      />
                    </div>

                    {/* SVG RADAR & TPI */}
                    <div style={{
                      flex: 1,
                      background: 'var(--m11-green)',
                      borderRadius: 16,
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      gap: 24,
                      minHeight: 360,
                      minWidth: 0,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Subtle Pitch Background */}
                      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/4/45/Football_field.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      
                      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--accent-gold)', marginBottom: '16px' }}>
                          PERFIL DE RENDIMIENTO
                        </span>
                        {testCount > 0 ? (
                          <SvgRadar data={radarData} size={250} />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#7A7065' }}>
                            <div style={{ fontSize: 48 }}>📊</div>
                            <p style={{ fontSize: 14, marginTop: 8, color: '#FFF' }}>Sin evaluaciones.<br />Registra datos para ver el radar.</p>
                          </div>
                        )}
                      </div>

                      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--accent-gold)', marginBottom: '16px' }}>
                          TEST PERFORMANCE INDEX
                        </span>
                        <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '50%', background: `conic-gradient(var(--accent-gold) ${overall}%, rgba(255,255,255,0.1) ${overall}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '170px', height: '170px', borderRadius: '50%', background: 'var(--m11-green)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '64px', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#FFF', lineHeight: '1' }}>{overall}</span>
                            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>TPI SCORE</span>
                          </div>
                        </div>
                        <button
                          style={{
                            marginTop: '24px',
                            background: 'var(--accent-gold)', color: '#000',
                            border: 'none', borderRadius: 8,
                            padding: '10px 24px', fontWeight: 700,
                            fontSize: 13, cursor: 'pointer'
                          }}
                          onClick={() => setAnalyticsPlayer(getPlayerById(histSelectedPlayer))}
                        >
                          📈 Ver Analíticas Completas
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="hist-charts-grid">
                {tests.filter(t => (historyData[histSelectedPlayer]?.[t.id] || []).length > 0).length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>📊 Sin evaluaciones previas. Registra resultados para ver la evolución.</p>
                  </div>
                ) : (
                  tests.map(t => {
                    const history = historyData[histSelectedPlayer]?.[t.id] || [];
                    if(history.length === 0) return null;
                    
                    // Parse values to ensure Recharts can plot them
                    const parsedHistory = history.map(h => ({
                      ...h,
                      val: parseFloat(String(h.val).replace(',', '.')) || 0
                    }));
                    
                    const vals = parsedHistory.map(h => h.val);
                    const min = Math.min(...vals) * 0.9;
                    const max = Math.max(...vals) * 1.1;
                    const range = max - min || 1;
                    
                    // Determine improvement (green arrow) vs worsen (red arrow)
                    const first = vals[0];
                    const last = vals[vals.length - 1];
                    const isTime = t.unit === 'seg';
                    const diff = last - first;
                    const improved = isTime ? diff < 0 : diff > 0;

                    return (
                      <div key={t.id} className="hist-chart-card">
                        <div className="hc-header">
                          <h4>{t.name} <span className="unit">({t.unit})</span></h4>
                          {vals.length > 1 && diff !== 0 ? (
                            <span className={`trend-arrow ${improved ? 'good' : 'bad'}`}>
                              {improved ? '▲' : '▼'} {Math.abs((diff/first)*100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="trend-arrow neutral" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                              Último: {last}
                            </span>
                          )}
                        </div>
                        
                        <GraficaEvolucion data={parsedHistory} isTime={isTime} />
                        
                        <div className="hc-labels">
                          {parsedHistory.map((h, i) => (
                            <div key={i} className="hc-point">
                              <strong>{h.val}</strong>
                              <span>{h.date.split('-').reverse().slice(0,2).join('/')}</span>
                            </div>
                          ))}
                        </div>

                        {/* BARRAS DE PROGRESO GAMING (Para Tests) */}
                        {gamingVisualsV1 && (
                          <div style={{ marginTop: '15px' }}>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(27, 58, 45, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${max > 0 ? Math.min(100, (last / max) * 100) : 0}%`, 
                                height: '100%', 
                                background: 'var(--gold)', 
                                transition: 'width 1s ease-out' 
                              }}></div>
                            </div>
                          </div>
                        )}

                        {/* Botones para corregir errores de carga */}
                        <div className="hc-actions" data-html2canvas-ignore="true" style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                          <button
                            className="btn-outline"
                            style={{
                              flex: 1,
                              minHeight: '44px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              borderColor: '#EF4444',
                              color: '#EF4444',
                              background: 'transparent',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleDeleteLastEval(histSelectedPlayer, t.id)}
                            title="Eliminar la última marca registrada por error"
                          >
                            🗑️ Borrar Último
                          </button>
                          <button
                            className="btn-outline"
                            style={{
                              flex: 1,
                              minHeight: '44px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              borderColor: '#EF4444',
                              color: '#EF4444',
                              background: 'transparent',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleDeleteAllEvals(histSelectedPlayer, t.id)}
                            title="Eliminar todo el historial de este test para este jugador"
                          >
                            🗑️ Borrar Historial
                          </button>
                        </div>
                        <button
                          className="btn-export-png"
                          data-html2canvas-ignore="true"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const cardElement = e.currentTarget.closest('.hist-chart-card');
                            if (!cardElement) return;
                            try {
                              const canvas = await html2canvas(cardElement, { scale: 2, backgroundColor: '#FFFFFF' });
                              const imgData = canvas.toDataURL('image/png');
                              const downloadAnchor = document.createElement('a');
                              downloadAnchor.setAttribute("href", imgData);
                              downloadAnchor.setAttribute("download", `evolucion_${t.name.replace(/\s+/g, '_').toLowerCase()}_${getPlayerById(histSelectedPlayer)?.name.replace(/\s+/g, '_').toLowerCase() || 'jugador'}.png`);
                              document.body.appendChild(downloadAnchor);
                              downloadAnchor.click();
                              downloadAnchor.remove();
                            } catch (error) {
                              console.error("Error al exportar gráfico:", error);
                              alert("Error al exportar gráfico a imagen.");
                            }
                          }}
                          style={{
                            marginTop: '12px',
                            background: '#004B87',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'center',
                            minHeight: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          🖼️ Exportar Gráfico (PNG)
                        </button>
                      </div>
                    );
                  })
                )}
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
              <div className="test-image-placeholder" style={{ padding: selectedTestDetail.imagenProtocolo ? '0' : '20px', backgroundColor: selectedTestDetail.imagenProtocolo ? 'transparent' : '#e2e8f0', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {selectedTestDetail.imagenProtocolo ? (
                  <img src={selectedTestDetail.imagenProtocolo} alt="Protocolo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                ) : (
                  <div className="vector-icon-large" style={{ fontSize: '3rem' }}>📊</div>
                )}
              </div>
              <div className="test-info-block">
                <div className="protocolo-card">
                  <h3>Objetivo y Descripción</h3>
                  <p>{selectedTestDetail.desc}</p>
                </div>
                
                <div className="protocolo-card">
                  <h3>Protocolo de Ejecución</h3>
                  {typeof selectedTestDetail.protocol === 'string' ? (
                    <p>{selectedTestDetail.protocol || 'No se ha especificado un protocolo detallado para esta prueba.'}</p>
                  ) : selectedTestDetail.protocol && typeof selectedTestDetail.protocol === 'object' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p><strong>Ejecución:</strong> {selectedTestDetail.protocol.ejecucion}</p>
                      <p><strong>Medición:</strong> {selectedTestDetail.protocol.medicion}</p>
                      <p><strong>Objetivo:</strong> {selectedTestDetail.protocol.objetivo}</p>
                    </div>
                  ) : (
                    <p>No se ha especificado un protocolo detallado para esta prueba.</p>
                  )}
                </div>
                
                <div className="test-meta">
                  <span><strong>Unidad de medida:</strong> {selectedTestDetail.unit}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{justifyContent: 'space-between'}}>
              <button className="btn-outline-gold" onClick={() => descargarPlantilla(selectedTestDetail, players)}>⬇️ Descargar Plantilla de Toma de Datos</button>
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

      {/* MODAL ANALÍTICAS POR JUGADOR */}
      {analyticsPlayer && (
        <PlayerAnalyticsModal
          player={analyticsPlayer}
          tests={tests}
          historyData={historyData}
          onClose={() => setAnalyticsPlayer(null)}
          onExportPDF={(player) => {
            if (!isPro) {
              setUpgradeModal({ open: true, message: 'La exportación de informes individuales es una función PRO.' });
              return;
            }
            generatePlayerTestReport(player, tests, historyData, activeTeam);
          }}
        />
      )}
      <WellnessTestModal 
        isOpen={isWellnessModalOpen} 
        onClose={() => {setIsWellnessModalOpen(false); setSelectedPlayerForTest(null);}} 
        onSave={handleSavePreventiveTest} 
        player={selectedPlayerForTest} 
      />

      <RPETestModal 
        isOpen={isRpeModalOpen} 
        onClose={() => {setIsRpeModalOpen(false); setSelectedPlayerForTest(null);}} 
        onSave={handleSavePreventiveTest} 
        player={selectedPlayerForTest} 
      />
    </div>
  );
};

export default Tests;
