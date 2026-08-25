import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Dumbbell, 
  TrendingUp, 
  Sparkles, 
  Award, 
  Clock, 
  Flame, 
  MessageSquare,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import './PlayerPlansPortalTab.css';

// Catálogo enriquecido de Ejercicios Preventivos y de Preparación Física de Míster11
const CANONICAL_EXERCISE_GUIDES = {
  // Tren Inferior & Isquiotibiales
  'nordico': {
    name: 'Curl Nórdico de Isquiotibiales',
    category: 'Isquiotibiales / Prevención Lesiones',
    sets: '3 series',
    reps: '6-8 repeticiones',
    steps: [
      'De rodillas con los tobillos firmemente sujetos en el suelo.',
      'Mantén el tronco y las caderas completamente alineados en línea recta.',
      'Desciende el cuerpo hacia adelante de manera muy lenta y controlada (fase excéntrica).',
      'Frena la caída con las manos sobre el suelo y empuja suavemente para volver a la posición inicial.'
    ],
    postureTips: 'No flexiones la cadera hacia atrás. El movimiento debe ser desde la articulación de la rodilla.',
    preventionValue: 'Reduce hasta un 51% el riesgo de rotura de fibras en isquiotibiales según estudios FIFA 11+.'
  },
  'puente_gluteo': {
    name: 'Puente de Glúteos Unilateral Isométrico',
    category: 'Glúteos y Cadera',
    sets: '3 series',
    reps: '10 reps por pierna (mantener 3s arriba)',
    steps: [
      'Tumbado boca arriba con rodillas flexionadas a 90 grados y pies apoyados.',
      'Eleva una pierna extendida hacia el techo.',
      'Empuja con el talón de la pierna apoyada elevando la cadera hasta formar una línea recta desde el hombro a la rodilla.',
      'Aprieta el glúteo en el punto más alto durante 3 segundos antes de bajar lentamente.'
    ],
    postureTips: 'Evita arquear excesivamente la zona lumbar; la fuerza proviene del glúteo y la cadera.',
    preventionValue: 'Mejora la estabilidad de la pelvis y previene sobrecargas en pubis y aductores.'
  },
  'sentadilla_bulgara': {
    name: 'Sentadilla Búlgara Unilateral',
    category: 'Fuerza Unilateral / Cuádriceps',
    sets: '3 series',
    reps: '8-10 reps por pierna',
    steps: [
      'Coloca un pie apoyado atrás sobre un banco o cajón bajo.',
      'Da un paso adelante con la pierna delantera y desciende verticalmente la cadera.',
      'La rodilla delantera debe alinearse con la punta del pie sin sobrepasarla excesivamente.',
      'Empuja con el mediopié para regresar arriba manteniendo el pecho erguido.'
    ],
    postureTips: 'Mantén el abdomen firme y la mirada al frente para evitar que el tronco se incline en exceso.',
    preventionValue: 'Corrige asimetrías de fuerza entre ambas piernas y estabiliza el ligamento cruzado anterior (LCA).'
  },
  'plancha_frontal': {
    name: 'Plancha Frontal Isométrica con Elevación',
    category: 'Core / Estabilidad Lumbo-Pélvica',
    sets: '3-4 series',
    reps: '40-45 segundos',
    steps: [
      'Apoya los antebrazos y las puntas de los pies en el suelo, codos bajo los hombros.',
      'Contrae fuertemente glúteos y abdomen para mantener la columna en posición neutra.',
      'Opcional: realiza pequeñas elevaciones alternas de pierna (3 segundos cada una) sin rotar la pelvis.',
      'Respira de forma fluida y constante sin contener el aire.'
    ],
    postureTips: 'Evita que la cadera caiga hacia el suelo o se eleve en forma de pirámide.',
    preventionValue: 'Base fundamental de transferencia de fuerza en carrera, salto y golpeo de balón.'
  },
  'deadbug': {
    name: 'Dead Bug (Bicho Muerto) Anti-Extensión',
    category: 'Core y Coordinación Lumbar',
    sets: '3 series',
    reps: '12 repeticiones alternas',
    steps: [
      'Tumbado boca arriba con brazos apuntando al techo y rodillas flexionadas a 90 grados.',
      'Pega firmemente la zona lumbar contra el suelo.',
      'Extiende el brazo derecho hacia atrás y la pierna izquierda hacia adelante de forma simultánea.',
      'Vuelve al centro de forma controlada y repite con el brazo y pierna contrarios.'
    ],
    postureTips: 'La zona lumbar NUNCA debe despegarse del suelo durante el movimiento.',
    preventionValue: 'Protege contra pubalgias y lumbalgias provocadas por aceleraciones y golpeos potentes.'
  },
  'movilidad_tobillo': {
    name: 'Movilidad de Dorsiflexión de Tobillo en Pared',
    category: 'Movilidad Articular y Prevención',
    sets: '2 series',
    reps: '15 oscilaciones por pie',
    steps: [
      'Colócate de pie a 10 cm de una pared con una rodilla adelantada.',
      'Lleva la rodilla hacia la pared sin que el talón se levante del suelo.',
      'Mantén la tensión 2 segundos al llegar al rango máximo y regresa suavemente.',
      'Aumenta la distancia a la pared gradualmente a medida que ganes rango.'
    ],
    postureTips: 'La rodilla debe proyectarse recta hacia el segundo dedo del pie, sin colapsar hacia adentro.',
    preventionValue: 'Fundamental para prevenir esguinces de tobillo y tendinopatías rotulianas en giros y frenadas.'
  }
};

/**
 * Formateador seguro de fechas contra Firestore Timestamps, Strings o Objetos
 */
const formatSafeDate = (dateVal) => {
  if (!dateVal) return 'Activo';
  try {
    if (typeof dateVal?.toDate === 'function') {
      return dateVal.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    // fallback
  }
  return 'Activo';
};

export const PlayerPlansPortalTab = ({ player, team, teamPath }) => {
  const { user } = useAuth();
  const { t, isEn, formatDate } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [teamExercises, setTeamExercises] = useState([]);
  const [expandedGuides, setExpandedGuides] = useState({});
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Escuchar planes del jugador
  useEffect(() => {
    if (!teamPath || !player?.id) {
      setLoading(false);
      return;
    }

    const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');
    const plansRef = collection(db, `${cleanPath}/playerPlans`);
    const unsub = onSnapshot(plansRef, (snapshot) => {
      const allPlans = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const myPlans = allPlans.filter(p => (p.playerId === player.id || p.assignedToAll) && p.active !== false);
      setPlans(myPlans);
      setLoading(false);
    }, (err) => {
      console.warn('[PlayerPlansPortalTab] Error cargando planes:', err);
      setLoading(false);
    });

    // 2. Escuchar ejercicios del equipo para resolver nombres reales
    const exRef = collection(db, `${cleanPath}/exercises`);
    const unsubEx = onSnapshot(exRef, (snap) => {
      setTeamExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    return () => {
      unsub();
      unsubEx();
    };
  }, [teamPath, player?.id]);

  const toggleGuide = (planId, exIdx) => {
    const key = `${planId}-${exIdx}`;
    setExpandedGuides(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleExerciseDay = async (planId, exIndex) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan || !plan.exercises?.[exIndex]) return;

    try {
      const exercise = plan.exercises[exIndex];
      const completedDates = exercise.completedDates || [];
      const isDoneToday = completedDates.includes(todayStr);

      const newDates = isDoneToday 
        ? completedDates.filter(d => d !== todayStr) 
        : [...completedDates, todayStr];

      const updatedExercises = [...plan.exercises];
      updatedExercises[exIndex] = {
        ...exercise,
        completedDates: newDates
      };

      const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');
      const planDocRef = doc(db, `${cleanPath}/playerPlans`, planId);
      await updateDoc(planDocRef, { exercises: updatedExercises });

      if (!isDoneToday) {
        showToast(t('player.plans.completedExercise') + ' (+10 XP)', 'success');
      }
    } catch (err) {
      console.error('Error actualizando ejercicio:', err);
      showToast('Error', 'error');
    }
  };

  // Resolución de detalles de un ejercicio
  const resolveExerciseDetails = (ex, idx) => {
    // Si el ejercicio ya trae nombre y detalles explícitos
    const directName = ex.name || ex.exerciseName || ex.titulo;
    const directDesc = ex.description || ex.descripcion;
    const directSets = ex.sets;
    const directReps = ex.reps || ex.duration;

    // Buscar en ejercicios del equipo por id
    const foundInTeam = teamExercises.find(te => te.id === ex.exerciseId || te.name === directName);

    // Buscar en catálogo canónico de Míster11
    const exKey = (ex.exerciseId || directName || '').toLowerCase();
    let canonical = null;
    for (const [key, val] of Object.entries(CANONICAL_EXERCISE_GUIDES)) {
      if (exKey.includes(key) || (foundInTeam?.name || '').toLowerCase().includes(key)) {
        canonical = val;
        break;
      }
    }

    // Default dinámico por posición en lista si es genérico
    const fallbackList = Object.values(CANONICAL_EXERCISE_GUIDES);
    const defaultCanonical = fallbackList[idx % fallbackList.length];

    const name = directName || foundInTeam?.name || foundInTeam?.titulo || canonical?.name || defaultCanonical.name;
    const category = ex.category || foundInTeam?.category || canonical?.category || defaultCanonical.category;
    const sets = directSets || canonical?.sets || defaultCanonical.sets;
    const reps = directReps || canonical?.reps || defaultCanonical.reps;
    const steps = ex.steps || foundInTeam?.steps || canonical?.steps || defaultCanonical.steps;
    const postureTips = ex.postureTips || foundInTeam?.postureTips || canonical?.postureTips || defaultCanonical.postureTips;
    const preventionValue = canonical?.preventionValue || defaultCanonical.preventionValue;

    return {
      name,
      category,
      sets,
      reps,
      steps,
      postureTips,
      preventionValue
    };
  };

  const formatSafeDate = (d) => {
    if (!d) return isEn ? 'Active' : 'Activo';
    try {
      if (d.toDate) return formatDate(d.toDate());
      if (d.seconds) return formatDate(new Date(d.seconds * 1000));
      return formatDate(d);
    } catch (_) {
      return isEn ? 'Active' : 'Activo';
    }
  };

  return (
    <div className="player-tab-content player-plans-portal-tab">
      
      {/* CABECERA */}
      <div className="tab-header-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Target size={22} color="#4CAF7D" />
          <h2 className="tab-title">{t('player.plans.title')}</h2>
        </div>
        <p className="tab-subtitle">
          {t('player.plans.subtitle')}
        </p>
      </div>

      {/* TARJETA RESUMEN DE PROGRESO */}
      <div className="hud-card plan-summary-card">
        <div className="hud-header">
          <span className="hud-badge" style={{ color: '#4CAF7D', borderColor: 'rgba(76, 175, 125, 0.3)' }}>
            <TrendingUp size={14} /> {isEn ? 'PROGRESSION & HABIT' : 'EVOLUCIÓN Y CONSTANCIA'}
          </span>
          <span className="plan-count-badge">
            {plans.length} {plans.length === 1 ? (isEn ? 'Active Plan' : 'Plan Activo') : (isEn ? 'Active Plans' : 'Planes Activos')}
          </span>
        </div>

        <div className="plan-stats-row">
          <div className="plan-stat-item">
            <span className="stat-value">{player?.position || player?.posicion || 'MC'}</span>
            <span className="stat-label">{t('player.profile.position')}</span>
          </div>
          <div className="plan-stat-item">
            <span className="stat-value">{player?.category || team?.categoria || (isEn ? 'Youth' : 'Juvenil')}</span>
            <span className="stat-label">{t('player.profile.category')}</span>
          </div>
          <div className="plan-stat-item">
            <span className="stat-value" style={{ color: '#4CAF7D' }}>{isEn ? 'Active' : 'Activo'}</span>
            <span className="stat-label">{isEn ? 'Monitoring' : 'Seguimiento'}</span>
          </div>
        </div>
      </div>

      {/* LISTADO DE PLANES Y RUTINAS */}
      {loading ? (
        <div className="plans-loading">{isEn ? 'Loading training plans...' : 'Cargando tus planes de entrenamiento...'}</div>
      ) : plans.length === 0 ? (
        <div className="hud-card empty-plans-card">
          <div className="empty-icon-wrap">
            <Award size={32} color="#C9A84C" />
          </div>
          <h3>{isEn ? 'Up to date with your preparation!' : '¡Todo al día con tu preparación!'}</h3>
          <p>
            {t('player.plans.noPlans')}
          </p>
        </div>
      ) : (
        <div className="plans-list-container">
          {plans.map((plan) => {
            const exercises = plan.exercises || [];
            const completedCount = exercises.filter(e => (e.completedDates || []).includes(todayStr)).length;
            const formattedDate = formatSafeDate(plan.createdAt || plan.fecha || plan.assignedDate);

            return (
              <div key={plan.id} className="hud-card player-plan-item-card">
                
                {/* Cabecera del Plan */}
                <div className="plan-item-top">
                  <div className="plan-type-pill">
                    <Dumbbell size={14} /> {plan.type || plan.reason || (isEn ? 'Technical Routine' : 'Rutina Técnica y Preventiva')}
                  </div>
                  <span className="plan-date-tag">
                    <Calendar size={12} /> {formattedDate}
                  </span>
                </div>

                <h3 className="plan-item-title">{plan.title || plan.name || (isEn ? 'Individual Training Plan' : 'Plan de Desarrollo Individual')}</h3>
                
                {plan.description && (
                  <p className="plan-item-desc">{plan.description}</p>
                )}

                {/* MENSAJE DIRECTO DEL MÍSTER */}
                {plan.coachNotes && (
                  <div className="coach-feedback-box">
                    <div className="feedback-title">
                      <MessageSquare size={14} color="#4CAF7D" />
                      <span>{isEn ? 'Coach Instructions:' : 'Instrucciones del Míster:'}</span>
                    </div>
                    <p className="feedback-text">"{plan.coachNotes}"</p>
                  </div>
                )}

                {/* LISTA DE EJERCICIOS CON GUÍA TÉCNICA DIGITAL */}
                {exercises.length > 0 && (
                  <div className="plan-exercises-section">
                    <div className="exercises-header-row">
                      <span className="exercises-title">{isEn ? "Today's Exercises:" : "Ejercicios para Hoy:"}</span>
                      <span className="exercises-counter">
                        {completedCount} / {exercises.length} {isEn ? 'done' : 'hechos'}
                      </span>
                    </div>

                    <div className="exercises-checklist">
                      {exercises.map((ex, idx) => {
                        const isDone = (ex.completedDates || []).includes(todayStr);
                        const guideKey = `${plan.id}-${idx}`;
                        const isGuideOpen = !!expandedGuides[guideKey];
                        const details = resolveExerciseDetails(ex, idx);

                        return (
                          <div key={idx} className="exercise-card-wrapper">
                            
                            {/* Fila principal interactiva */}
                            <div className={`exercise-check-row ${isDone ? 'done' : ''}`}>
                              <button 
                                type="button" 
                                className="check-btn"
                                onClick={() => toggleExerciseDay(plan.id, idx)}
                                title={isDone ? (isEn ? "Mark as pending" : "Marcar como pendiente") : t('player.plans.completeExercise')}
                              >
                                {isDone ? (
                                  <CheckCircle2 size={22} color="#4CAF7D" />
                                ) : (
                                  <Circle size={22} color="rgba(128,128,128,0.4)" />
                                )}
                              </button>

                              <div className="exercise-info-block" onClick={() => toggleExerciseDay(plan.id, idx)}>
                                <span className="exercise-name-txt">{details.name}</span>
                                <div className="exercise-badges-row">
                                  <span className="exercise-dos-pill">{details.sets} · {details.reps}</span>
                                  <span className="exercise-cat-pill">{details.category}</span>
                                </div>
                              </div>

                              {/* Botón para desplegar Guía Digital */}
                              <button 
                                type="button" 
                                className={`btn-guide-toggle ${isGuideOpen ? 'open' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleGuide(plan.id, idx);
                                }}
                                title={isEn ? "View technical guide" : "Ver guía de ejecución técnica"}
                              >
                                <BookOpen size={15} />
                                <span>{isEn ? 'Guide' : 'Guía'}</span>
                                {isGuideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>

                            {/* GUÍA TÉCNICA DIGITAL DESPLEGABLE */}
                            {isGuideOpen && (
                              <div className="exercise-digital-guide-panel">
                                
                                <div className="guide-section">
                                  <div className="guide-section-title">
                                    <Zap size={14} color="#4CAF7D" />
                                    <span>{t('player.plans.stepByStep')}:</span>
                                  </div>
                                  <ol className="guide-steps-list">
                                    {details.steps.map((step, sIdx) => (
                                      <li key={sIdx}>{step}</li>
                                    ))}
                                  </ol>
                                </div>

                                <div className="guide-tips-grid">
                                  <div className="guide-tip-box posture">
                                    <div className="tip-box-title">
                                      <Info size={13} color="#C9A84C" />
                                      <span>{t('player.plans.posturalKey')}:</span>
                                    </div>
                                    <p>{details.postureTips}</p>
                                  </div>

                                  <div className="guide-tip-box prevention">
                                    <div className="tip-box-title">
                                      <ShieldCheck size={13} color="#4CAF7D" />
                                      <span>{t('player.plans.prevention')}:</span>
                                    </div>
                                    <p>{details.preventionValue}</p>
                                  </div>
                                </div>

                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PlayerPlansPortalTab;

