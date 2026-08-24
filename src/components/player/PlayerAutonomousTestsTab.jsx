import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  Flame, 
  Award, 
  HelpCircle, 
  RotateCcw, 
  Activity, 
  Users, 
  Smile, 
  Target, 
  Lock 
} from 'lucide-react';
import './PlayerAutonomousTestsTab.css';

// Catálogo de Tests Autónomos Validados que el jugador puede realizar individualmente
export const AUTONOMOUS_TESTS = [
  {
    id: 'psi_acsi28_auto',
    category: 'Afrontamiento y Presión',
    name: 'ACSI-28 (Afrontamiento Deportivo)',
    shortName: 'ACSI-28',
    icon: Flame,
    color: '#F59E0B',
    desc: 'Evalúa tu capacidad para mantener la calma ante errores, soportar la presión del rival y concentrarte en momentos clave.',
    timeMinutes: 4,
    questions: [
      { id: 'q1', text: 'Mantengo la calma y una actitud positiva aunque el equipo vaya perdiendo.', dimension: 'Afrontamiento' },
      { id: 'q2', text: 'Si cometo un error o pierdo un balón, lo olvido rápido y me concentro en la siguiente jugada.', dimension: 'Afrontamiento' },
      { id: 'q3', text: 'Me mantengo concentrado en el partido a pesar de los gritos o distracciones externas.', dimension: 'Concentración' },
      { id: 'q4', text: 'Puedo enfocarme al 100% en la tarea táctica que me pide el míster.', dimension: 'Concentración' },
      { id: 'q5', text: 'Siento total seguridad en mis habilidades antes de saltar al campo.', dimension: 'Confianza' },
      { id: 'q6', text: 'En los minutos finales o momentos decisivos juego con la misma soltura sin atenazarme.', dimension: 'Rendimiento bajo presión' },
      { id: 'q7', text: 'Acepto las correcciones del entrenador entendiendo que son para hacerme mejor jugador.', dimension: 'Entrenabilidad' },
      { id: 'q8', text: 'Me adapto rápidamente si el míster me cambia de posición o rol durante el partido.', dimension: 'Entrenabilidad' }
    ],
    options: [
      { label: 'Casi nunca', value: 1 },
      { label: 'A veces', value: 2 },
      { label: 'A menudo', value: 3 },
      { label: 'Casi siempre', value: 4 }
    ],
    maxScore: 32
  },
  {
    id: 'psi_mtq10_auto',
    category: 'Fortaleza Mental',
    name: 'MTQ-10 (Fortaleza y Resiliencia)',
    shortName: 'Fortaleza MTQ',
    icon: Brain,
    color: '#10B981',
    desc: 'Mide tu determinación, perseverancia y cómo transformas los momentos difíciles en oportunidades de crecimiento.',
    timeMinutes: 3,
    questions: [
      { id: 'q1', text: 'Mantengo el control emocional cuando el árbitro o una jugada no sale como esperaba.', dimension: 'Control Emocional' },
      { id: 'q2', text: 'Cumplo con los entrenamientos y el plan físico incluso los días que no tengo motivación.', dimension: 'Compromiso' },
      { id: 'q3', text: 'Veo los rivales difíciles y los desafíos como una oportunidad para demostrar mi nivel.', dimension: 'Desafío' },
      { id: 'q4', text: 'Confío en mi capacidad para superar cualquier bache de juego o suplencia.', dimension: 'Autoconfianza' },
      { id: 'q5', text: 'No me rindo jamás hasta que el árbitro pita el final del encuentro.', dimension: 'Perseverancia' }
    ],
    options: [
      { label: 'Totalmente en desacuerdo', value: 1 },
      { label: 'En desacuerdo', value: 2 },
      { label: 'De acuerdo', value: 3 },
      { label: 'Totalmente de acuerdo', value: 4 }
    ],
    maxScore: 20
  },
  {
    id: 'soc_geq_auto',
    category: 'Cohesión y Vestuario',
    name: 'GEQ (Cohesión de Equipo y Clima)',
    shortName: 'Cohesión GEQ',
    icon: Users,
    color: '#3B82F6',
    desc: 'Evalúa la unión del grupo, la comunicación entre compañeros y el sentido de pertenencia en el equipo.',
    timeMinutes: 2,
    questions: [
      { id: 'q1', text: 'Todos en el vestuario remamos en la misma dirección para alcanzar los objetivos.', dimension: 'Cohesión de Tarea' },
      { id: 'q2', text: 'Nos apoyamos y animamos mutuamente cuando alguien comete un fallo.', dimension: 'Apoyo Grupal' },
      { id: 'q3', text: 'Existe un ambiente sano, divertido y de compañerismo fuera del campo.', dimension: 'Cohesión Social' },
      { id: 'q4', text: 'Me siento 100% valorado e integrado en este equipo.', dimension: 'Pertenencia' }
    ],
    options: [
      { label: 'Nada de acuerdo', value: 1 },
      { label: 'Poco de acuerdo', value: 2 },
      { label: 'Bastante de acuerdo', value: 3 },
      { label: 'Totalmente de acuerdo', value: 4 }
    ],
    maxScore: 16
  },
  {
    id: 'soc_mhc_auto',
    category: 'Bienestar Psicodeportivo',
    name: 'MHC-SF (Bienestar Emocional)',
    shortName: 'Bienestar Mental',
    icon: Smile,
    color: '#EC4899',
    desc: 'Mide tu disfrute por el fútbol, satisfacción personal y sensación de progreso como deportista.',
    timeMinutes: 2,
    questions: [
      { id: 'q1', text: 'Disfruto y me siento feliz cada vez que voy a entrenar o jugar.', dimension: 'Disfrute Deportivo' },
      { id: 'q2', text: 'Siento que el fútbol me ayuda a ser mejor persona y desarrollar disciplina.', dimension: 'Propósito' },
      { id: 'q3', text: 'Tengo una relación de confianza y respeto con el cuerpo técnico.', dimension: 'Confianza Staff' }
    ],
    options: [
      { label: 'Raras veces', value: 1 },
      { label: 'Algunas veces', value: 2 },
      { label: 'La mayoría de veces', value: 3 },
      { label: 'Siempre', value: 4 }
    ],
    maxScore: 12
  },
  {
    id: 'psi_goals_auto',
    category: 'Metas y Enfoque',
    name: 'Escala de Establecimiento de Metas',
    shortName: 'Metas Individuales',
    icon: Target,
    color: '#8B5CF6',
    desc: 'Evalúa cómo planificas tus objetivos técnicos y físicos para superarte semana a semana.',
    timeMinutes: 2,
    questions: [
      { id: 'q1', text: 'Tengo claro qué aspectos técnicos o físicos debo mejorar este mes.', dimension: 'Claridad de Objetivos' },
      { id: 'q2', text: 'Me esfuerzo extra en los ejercicios que me resultan más difíciles.', dimension: 'Superación' },
      { id: 'q3', text: 'Reviso mis partidos y entrenos para ver qué puedo hacer mejor la próxima vez.', dimension: 'Autoanálisis' }
    ],
    options: [
      { label: 'Nunca', value: 1 },
      { label: 'A veces', value: 2 },
      { label: 'Casi siempre', value: 3 },
      { label: 'Siempre', value: 4 }
    ],
    maxScore: 12
  }
];

export const PlayerAutonomousTestsTab = ({ player, team, teamPath }) => {
  const { user } = useAuth();

  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Cargar historial de tests completados por este jugador
  useEffect(() => {
    if (!teamPath || !player?.id) {
      setLoadingHistory(false);
      return;
    }

    const loadTestHistory = async () => {
      try {
        const testsColRef = collection(db, `${teamPath}/test_results`);
        const q = query(testsColRef, where('playerId', '==', player.id), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        
        const historyMap = {};
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.testId && !historyMap[data.testId]) {
            historyMap[data.testId] = {
              id: docSnap.id,
              ...data
            };
          }
        });
        setHistory(historyMap);
      } catch (err) {
        console.warn('[PlayerAutonomousTestsTab] Error cargando historial de tests:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadTestHistory();
  }, [teamPath, player?.id]);

  const handleStartTest = (test) => {
    setSelectedTest(test);
    setCurrentQuestionIdx(0);
    setAnswers({});
  };

  const handleSelectOption = (value) => {
    if (!selectedTest) return;
    const currentQ = selectedTest.questions[currentQuestionIdx];
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));

    if (currentQuestionIdx < selectedTest.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const handleSaveTest = async () => {
    if (!selectedTest || !teamPath || !player?.id) return;
    
    // Verificar que todas las preguntas tengan respuesta
    const allAnswered = selectedTest.questions.every(q => answers[q.id] !== undefined);
    if (!allAnswered) {
      showToast('Por favor responde todas las preguntas del test.', 'error');
      return;
    }

    setSaving(true);
    try {
      // 1. Calcular puntuación total y por dimensiones
      let totalScore = 0;
      const dimensionScores = {};

      selectedTest.questions.forEach(q => {
        const val = answers[q.id] || 0;
        totalScore += val;
        dimensionScores[q.dimension] = (dimensionScores[q.dimension] || 0) + val;
      });

      const percentage = Math.round((totalScore / selectedTest.maxScore) * 100);
      const todayStr = new Date().toISOString().split('T')[0];

      const testPayload = {
        testId: selectedTest.id,
        testName: selectedTest.name,
        category: selectedTest.category,
        type: 'psicosocial',
        playerId: player.id,
        playerName: player.name || user?.displayName || 'Jugador',
        playerNumber: player.number || '',
        score: totalScore,
        maxScore: selectedTest.maxScore,
        percentage,
        dimensionScores,
        answers,
        completedBy: 'player',
        requesterUid: user?.uid || '',
        date: todayStr,
        createdAt: serverTimestamp()
      };

      // 1. Guardar en subcolección test_results del equipo
      await addDoc(collection(db, `${teamPath}/test_results`), testPayload);

      // 2. Guardar en la colección CANÓNICA de evaluaciones de Míster11 (para que el módulo Tests del entrenador y las gráficas lo lean)
      try {
        await addDoc(collection(db, `${teamPath}/evaluaciones`), {
          testId: selectedTest.id,
          testName: selectedTest.name,
          playerId: player.id,
          playerName: player.name || user?.displayName || 'Jugador',
          playerNumber: player.number || '',
          val: totalScore,
          percentage,
          score: totalScore,
          date: todayStr,
          type: 'psicosocial',
          category: selectedTest.category,
          unit: 'pts',
          completedBy: 'player',
          createdAt: serverTimestamp()
        });

        // Asegurar que el test esté registrado en el catálogo del equipo si no existía
        await setDoc(doc(db, `${teamPath}/tests`, selectedTest.id), {
          id: selectedTest.id,
          name: selectedTest.name,
          category: 'psicosocial',
          unit: 'pts',
          maxScore: selectedTest.maxScore,
          description: selectedTest.desc,
          isAutonomous: true
        }, { merge: true });
      } catch (evalErr) {
        console.warn('Advertencia guardando en evaluaciones:', evalErr);
      }

      // 3. Guardar en subcolección directa del jugador
      try {
        await addDoc(collection(db, `${teamPath}/players/${player.id}/test_results`), testPayload);
      } catch (_) {}

      // Actualizar estado local
      setHistory(prev => ({
        ...prev,
        [selectedTest.id]: testPayload
      }));

      showToast(`¡Test ${selectedTest.shortName} completado con éxito! (${percentage}%)`, 'success');
      setSelectedTest(null);
    } catch (err) {
      console.error('[PlayerAutonomousTestsTab] Error guardando test:', err);
      showToast('Error al guardar el test. Inténtalo de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── VISTA DEL CUESTIONARIO EN CURSO ───────────────────────────────────────
  if (selectedTest) {
    const currentQ = selectedTest.questions[currentQuestionIdx];
    const progressPct = Math.round(((currentQuestionIdx + 1) / selectedTest.questions.length) * 100);
    const isCompleted = selectedTest.questions.every(q => answers[q.id] !== undefined);

    return (
      <div className="player-tab-content player-active-test-view">
        <button 
          className="test-back-btn" 
          onClick={() => setSelectedTest(null)}
          type="button"
        >
          <ArrowLeft size={16} /> Volver al catálogo de tests
        </button>

        <div className="test-runner-card">
          <div className="test-runner-header">
            <span className="test-runner-cat" style={{ color: selectedTest.color }}>
              {selectedTest.category}
            </span>
            <span className="test-runner-step">
              Pregunta {currentQuestionIdx + 1} de {selectedTest.questions.length}
            </span>
          </div>

          <div className="test-progress-bar-wrap">
            <div 
              className="test-progress-bar-fill" 
              style={{ width: `${progressPct}%`, backgroundColor: selectedTest.color }}
            />
          </div>

          <div className="test-question-box">
            <span className="test-question-dimension">Dimensión: {currentQ.dimension}</span>
            <h3 className="test-question-text">{currentQ.text}</h3>
          </div>

          <div className="test-options-list">
            {selectedTest.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`test-option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(opt.value)}
                >
                  <span className="opt-indicator">{opt.value}</span>
                  <span className="opt-label">{opt.label}</span>
                  {isSelected && <CheckCircle2 size={18} className="opt-check" />}
                </button>
              );
            })}
          </div>

          <div className="test-nav-controls">
            <button
              type="button"
              className="btn-prev-question"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIdx === 0}
            >
              Anterior
            </button>

            {isCompleted && (
              <button
                type="button"
                className="btn-finish-test"
                onClick={handleSaveTest}
                disabled={saving}
                style={{ backgroundColor: selectedTest.color }}
              >
                {saving ? 'Guardando...' : 'FINALIZAR Y ENVIAR AL MÍSTER'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA DEL CATÁLOGO DE TESTS AUTÓNOMOS ──────────────────────────────────
  return (
    <div className="player-tab-content player-tests-catalog-tab">
      <div className="tab-header-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Brain size={22} color="#10B981" />
          <h2 className="tab-title">Tests & Autoevaluaciones</h2>
        </div>
        <p className="tab-subtitle">
          Completa estos cuestionarios desde tu móvil para potenciar tu mentalidad, concentración y cohesión con el equipo.
        </p>
      </div>

      <div className="autonomous-tests-grid">
        {AUTONOMOUS_TESTS.map((test) => {
          const Icon = test.icon;
          const lastResult = history[test.id];

          return (
            <div key={test.id} className="autonomous-test-card">
              <div className="auto-test-top">
                <div className="auto-test-icon-badge" style={{ background: `${test.color}20`, color: test.color }}>
                  <Icon size={22} />
                </div>
                <div className="auto-test-meta-badge">
                  <span>⏱️ {test.timeMinutes} min</span>
                  <span>{test.questions.length} preguntas</span>
                </div>
              </div>

              <h3 className="auto-test-title">{test.name}</h3>
              <p className="auto-test-desc">{test.desc}</p>

              {lastResult ? (
                <div className="auto-test-last-result">
                  <div className="result-score-chip">
                    <Award size={14} color="#10B981" />
                    <span>Último resultado: <strong>{lastResult.percentage}%</strong></span>
                    <span className="result-date">({lastResult.date})</span>
                  </div>
                  <button
                    type="button"
                    className="btn-retake-test"
                    onClick={() => handleStartTest(test)}
                  >
                    <RotateCcw size={14} /> Repetir Test
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-start-test"
                  onClick={() => handleStartTest(test)}
                  style={{ borderColor: test.color, color: test.color }}
                >
                  <span>Comenzar Test</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
