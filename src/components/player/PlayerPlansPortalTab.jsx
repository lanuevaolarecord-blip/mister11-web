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
  Shield,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { HOME_EXERCISES_107 } from '../../data/homeExercisesCatalog';
import ExerciseIllustrationBlock from '../ExerciseIllustrationBlock';
import { assertAgeSafe } from '../../utils/exerciseSafety';
import { calcularEdad } from '../../utils/calcularEdad';
import './PlayerPlansPortalTab.css';

// Catálogo enriquecido de Ejercicios Preventivos y de Preparación Física de Mister11
const CANONICAL_EXERCISE_GUIDES = {
  // Tren Inferior & Isquiotibiales
  'nordico': {
    name: 'Curl Nórdico de Isquiotibiales',
    nameEn: 'Nordic Hamstring Curl',
    category: 'Isquiotibiales / Prevención Lesiones',
    categoryEn: 'Hamstrings / Injury Prevention',
    sets: '3 series',
    setsEn: '3 sets',
    reps: '6-8 repeticiones',
    repsEn: '6-8 repetitions',
    steps: [
      'De rodillas con los tobillos firmemente sujetos en el suelo.',
      'Mantén el tronco y las caderas completamente alineados en línea recta.',
      'Desciende el cuerpo hacia adelante de manera muy lenta y controlada (fase excéntrica).',
      'Frena la caída con las manos sobre el suelo y empuja suavemente para volver a la posición inicial.'
    ],
    stepsEn: [
      'Kneel with ankles securely anchored to the floor.',
      'Keep torso and hips in a straight line.',
      'Lower body forward slowly and controlled (eccentric phase).',
      'Catch yourself with hands on the floor and push back up gently.'
    ],
    postureTips: 'No flexiones la cadera hacia atrás. El movimiento debe ser desde la articulación de la rodilla.',
    postureTipsEn: 'Do not bend at the hips. The movement must come from the knee joint.',
    preventionValue: 'Reduce hasta un 51% el riesgo de rotura de fibras en isquiotibiales según estudios FIFA 11+.'
  },
  'puente_gluteo': {
    name: 'Puente de Glúteos Unilateral Isométrico',
    nameEn: 'Single-Leg Isometric Glute Bridge',
    category: 'Glúteos y Cadera',
    categoryEn: 'Glutes and Hips',
    sets: '3 series',
    setsEn: '3 sets',
    reps: '10 reps por pierna (mantener 3s arriba)',
    repsEn: '10 reps per leg (hold 3s at top)',
    steps: [
      'Tumbado boca arriba con rodillas flexionadas a 90 grados y pies apoyados.',
      'Eleva una pierna extendida hacia el techo.',
      'Empuja con el talón de la pierna apoyada elevando la cadera hasta formar una línea recta desde el hombro a la rodilla.',
      'Aprieta el glúteo en el punto más alto durante 3 segundos antes de bajar lentamente.'
    ],
    stepsEn: [
      'Lie on back with knees bent at 90 degrees and feet flat.',
      'Extend one leg toward the ceiling.',
      'Drive through planted heel to raise hips in a straight line.',
      'Squeeze glute at highest point for 3 seconds before lowering slowly.'
    ],
    postureTips: 'Evita arquear excesivamente la zona lumbar; la fuerza proviene del glúteo y la cadera.',
    postureTipsEn: 'Avoid hyperextending lumbar spine; drive power from glute and hip.',
    preventionValue: 'Mejora la estabilidad de la pelvis y previene sobrecargas en pubis y aductores.'
  },
  'sentadilla_bulgara': {
    name: 'Sentadilla Búlgara Unilateral',
    nameEn: 'Bulgarian Split Squat',
    category: 'Fuerza Unilateral / Cuádriceps',
    categoryEn: 'Unilateral Strength / Quadriceps',
    sets: '3 series',
    setsEn: '3 sets',
    reps: '8-10 reps por pierna',
    repsEn: '8-10 reps per leg',
    steps: [
      'Coloca un pie apoyado atrás sobre un banco o cajón bajo.',
      'Da un paso adelante con la pierna delantera y desciende verticalmente la cadera.',
      'La rodilla delantera debe alinearse con la punta del pie sin sobrepasarla excesivamente.',
      'Empuja con el mediopié para regresar arriba manteniendo el pecho erguido.'
    ],
    stepsEn: [
      'Place rear foot on a low bench or box behind you.',
      'Step forward with front leg and descend hips vertically.',
      'Front knee aligns with toes without collapsing inward.',
      'Drive through midfoot to return to top with chest tall.'
    ],
    postureTips: 'Mantén el abdomen firme y la mirada al frente para evitar que el tronco se incline en exceso.',
    postureTipsEn: 'Keep core engaged and eyes forward to avoid excessive forward lean.',
    preventionValue: 'Corrige asimetrías de fuerza entre ambas piernas y estabiliza el ligamento cruzado anterior (LCA).'
  },
  'plancha_frontal': {
    name: 'Plancha Frontal Isométrica con Elevación',
    nameEn: 'Isometric Front Plank with Leg Lift',
    category: 'Core / Estabilidad Lumbo-Pélvica',
    categoryEn: 'Core / Lumbo-Pelvic Stability',
    sets: '3-4 series',
    setsEn: '3-4 sets',
    reps: '40-45 segundos',
    repsEn: '40-45 seconds',
    steps: [
      'Apoya los antebrazos y las puntas de los pies en el suelo, codos bajo los hombros.',
      'Contrae fuertemente glúteos y abdomen para mantener la columna en posición neutra.',
      'Opcional: realiza pequeñas elevaciones alternas de pierna (3 segundos cada una) sin rotar la pelvis.',
      'Respira de forma fluida y constante sin contener el aire.'
    ],
    stepsEn: [
      'Rest forearms and toes on floor with elbows beneath shoulders.',
      'Squeeze glutes and core to keep spine in neutral alignment.',
      'Optional: perform small alternating leg lifts (3s each) without pelvic rotation.',
      'Breathe smoothly and continuously without holding breath.'
    ],
    postureTips: 'Evita que la cadera caiga hacia el suelo o se eleve en forma de pirámide.',
    postureTipsEn: 'Avoid sagging hips or piking up into a pyramid position.',
    preventionValue: 'Base fundamental de transferencia de fuerza en carrera, salto y golpeo de balón.'
  },
  'deadbug': {
    name: 'Dead Bug (Bicho Muerto) Anti-Extensión',
    nameEn: 'Dead Bug Anti-Extension',
    category: 'Core y Coordinación Lumbar',
    categoryEn: 'Core and Lumbar Coordination',
    sets: '3 series',
    setsEn: '3 sets',
    reps: '12 repeticiones alternas',
    repsEn: '12 alternating reps',
    steps: [
      'Tumbado boca arriba con brazos apuntando al techo y rodillas flexionadas a 90 grados.',
      'Pega firmemente la zona lumbar contra el suelo.',
      'Extiende el brazo derecho hacia atrás y la pierna izquierda hacia adelante de forma simultánea.',
      'Vuelve al centro de forma controlada y repite con el brazo y pierna contrarios.'
    ],
    stepsEn: [
      'Lie on back with arms pointing to ceiling and knees bent at 90 degrees.',
      'Press lower back flat against floor.',
      'Extend right arm back and left leg forward simultaneously.',
      'Return to center under control and repeat with opposite limbs.'
    ],
    postureTips: 'La zona lumbar NUNCA debe despegarse del suelo durante el movimiento.',
    postureTipsEn: 'Lower back must NEVER lose contact with the floor during movement.',
    preventionValue: 'Protege contra pubalgias y lumbalgias provocadas por aceleraciones y golpeos potentes.'
  },
  'movilidad_tobillo': {
    name: 'Movilidad de Dorsiflexión de Tobillo en Pared',
    nameEn: 'Wall Ankle Dorsiflexion Mobility',
    category: 'Movilidad Articular y Prevención',
    categoryEn: 'Joint Mobility and Injury Prevention',
    sets: '2 series',
    setsEn: '2 sets',
    reps: '15 oscilaciones por pie',
    repsEn: '15 oscillations per foot',
    steps: [
      'Colócate de pie a 10 cm de una pared con una rodilla adelantada.',
      'Lleva la rodilla hacia la pared sin que el talón se levante del suelo.',
      'Mantén la tensión 2 segundos al llegar al rango máximo y regresa suavemente.',
      'Aumenta la distancia a la pared gradualmente a medida que ganes rango.'
    ],
    stepsEn: [
      'Stand 10 cm away from wall with front knee forward.',
      'Drive knee toward wall keeping heel planted on floor.',
      'Hold tension for 2 seconds at end range and return smoothly.',
      'Gradually increase distance from wall as range improves.'
    ],
    postureTips: 'La rodilla debe proyectarse recta hacia el segundo dedo del pie, sin colapsar hacia adentro.',
    postureTipsEn: 'Knee must track straight toward second toe without collapsing inward.',
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
  const { t, language, formatDate } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [teamExercises, setTeamExercises] = useState([]);
  const [expandedGuides, setExpandedGuides] = useState({});
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);
  const playerAge = calcularEdad(player?.fechaNacimiento || player?.birthDate || player?.edad || player?.age)?.years;

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
      const ageCheck = assertAgeSafe(playerAge, exercise);
      if (!ageCheck.safe) {
        showToast(t('player.plans.notAgeSafe'), 'warning');
        return;
      }
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
      showToast(t('player.plans.error'), 'error');
    }
  };

  // Resolución de detalles de un ejercicio con slot de ilustración y catálogo canónico
  const resolveExerciseDetails = (ex, idx) => {
    // Si el ejercicio ya trae nombre y detalles explícitos
    const directName = ex.name || ex.exerciseName || ex.titulo;
    const directDesc = ex.description || ex.descripcion;
    const directSets = ex.sets;
    const directReps = ex.reps || ex.duration;

    // Buscar en ejercicios del equipo por id
    const foundInTeam = teamExercises.find(te => te.id === ex.exerciseId || te.name === directName);

    // Buscar en catálogo de 108 ejercicios
    const catMatch = HOME_EXERCISES_107.find(he => 
      he.id === ex.exerciseId || 
      he.id === ex.id || 
      (he.nameEs && he.nameEs.toLowerCase() === (directName || '').toLowerCase()) || 
      (he.nameEn && he.nameEn.toLowerCase() === (directName || '').toLowerCase())
    );

    // Buscar en catálogo canónico de Mister11
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

    const loc = (language || 'es').toLowerCase();
    const isEnglishLocale = loc.startsWith('en');
    const isNonSpanish = ['pt', 'fr', 'id'].includes(loc.slice(0, 2));

    const name = (isEnglishLocale 
      ? (catMatch?.nameEn || foundInTeam?.nameEn || canonical?.nameEn || defaultCanonical.nameEn) 
      : (catMatch?.nameEs || foundInTeam?.nameEs || canonical?.name || defaultCanonical.name)) || directName || defaultCanonical.name;
    const category = (isEnglishLocale
      ? (canonical?.categoryEn || defaultCanonical.categoryEn)
      : (ex.category || catMatch?.category || foundInTeam?.category || canonical?.category || defaultCanonical.category)) || defaultCanonical.category;
    const sets = directSets || (isEnglishLocale ? (canonical?.setsEn || defaultCanonical.setsEn) : (canonical?.sets || defaultCanonical.sets));
    const reps = directReps || (isEnglishLocale ? (canonical?.repsEn || defaultCanonical.repsEn) : (canonical?.reps || defaultCanonical.reps));
    const cue = (isEnglishLocale ? (catMatch?.descriptionEn || foundInTeam?.descriptionEn) : (catMatch?.descriptionEs || foundInTeam?.descriptionEs)) || directDesc || '';
    const coachingPoints = (isEnglishLocale ? (catMatch?.coachingPointsEn || catMatch?.coachingPoints) : (catMatch?.coachingPointsEs || catMatch?.coachingPoints)) || [];
    const steps = ex.steps || foundInTeam?.steps || (isEnglishLocale ? (canonical?.stepsEn || defaultCanonical.stepsEn) : (canonical?.steps || defaultCanonical.steps));
    const postureTips = ex.postureTips || foundInTeam?.postureTips || (isEnglishLocale ? (canonical?.postureTipsEn || defaultCanonical.postureTipsEn) : (canonical?.postureTips || defaultCanonical.postureTips));
    
    // Carril B: Cues clínicos de prevención (solo en ES/EN directo; en PT/FR/ID con chip de fallback clínico traducido)
    const rawPrevention = canonical?.preventionValue || defaultCanonical.preventionValue;
    const isClinical = category === 'prevencion' || String(category).toLowerCase().includes('prevenci') || !!canonical;
    const isClinicalFallback = isNonSpanish && isClinical;
    const preventionValue = (isClinicalFallback && rawPrevention)
      ? `[${t('clinical.fallbackChip')}: ${rawPrevention}]`
      : rawPrevention;

    const illustration = ex.illustration || catMatch?.illustration || foundInTeam?.illustration || {
      type: 'pendiente',
      url: null,
      reviewed_by_human: false
    };

    return {
      name,
      category,
      sets,
      reps,
      cue,
      coachingPoints,
      steps,
      postureTips,
      preventionValue,
      rawPrevention,
      isClinicalFallback,
      illustration
    };
  };

  const formatSafeDate = (d) => {
    if (!d) return t('player.plans.active', {}, 'Activo');
    try {
      if (d.toDate) return formatDate(d.toDate());
      if (d.seconds) return formatDate(new Date(d.seconds * 1000));
      return formatDate(d);
    } catch (_) {
      return t('player.plans.active', {}, 'Activo');
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
            <TrendingUp size={14} /> {t('player.plans.progressionHabit', {}, 'EVOLUCIÓN Y CONSTANCIA')}
          </span>
          <span className="plan-count-badge">
            {plans.length} {plans.length === 1 ? t('player.plans.activePlan', {}, 'Plan Activo') : t('player.plans.activePlans', {}, 'Planes Activos')}
          </span>
        </div>

        <div className="plan-stats-row">
          <div className="plan-stat-item">
            <span className="stat-value">{player?.position || player?.posicion || 'MC'}</span>
            <span className="stat-label">{t('player.profile.position')}</span>
          </div>
          <div className="plan-stat-item">
            <span className="stat-value">{player?.category || team?.categoria || t('player.plans.youth', {}, 'Juvenil')}</span>
            <span className="stat-label">{t('player.profile.category')}</span>
          </div>
          <div className="plan-stat-item">
            <span className="stat-value" style={{ color: '#4CAF7D' }}>{t('player.plans.active', {}, 'Activo')}</span>
            <span className="stat-label">{t('player.plans.monitoring', {}, 'Seguimiento')}</span>
          </div>
        </div>
      </div>

      {/* LISTADO DE PLANES Y RUTINAS */}
      {loading ? (
        <div className="plans-loading">{t('player.plans.loading', {}, 'Cargando tus planes de entrenamiento...')}</div>
      ) : plans.length === 0 ? (
        <div className="hud-card empty-plans-card">
          <div className="empty-icon-wrap">
            <Award size={32} color="#C9A84C" />
          </div>
          <h3>{t('player.plans.upToDate', {}, '¡Todo al día con tu preparación!')}</h3>
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
                    <Dumbbell size={14} /> {plan.type || plan.reason || t('player.plans.techRoutine', {}, 'Rutina Técnica y Preventiva')}
                  </div>
                  <span className="plan-date-tag">
                    <Calendar size={12} /> {formattedDate}
                  </span>
                </div>

                <h3 className="plan-item-title">{plan.title || plan.name || t('player.plans.defaultPlanTitle', {}, 'Plan de Desarrollo Individual')}</h3>
                
                {plan.description && (
                  <p className="plan-item-desc">{plan.description}</p>
                )}

                {/* MENSAJE DIRECTO DEL MÍSTER */}
                {plan.coachNotes && (
                  <div className="coach-feedback-box">
                    <div className="feedback-title">
                      <MessageSquare size={14} color="#4CAF7D" />
                      <span>{t('player.plans.coachInstructions', {}, 'Instrucciones del Mister:')}</span>
                    </div>
                    <p className="feedback-text">"{plan.coachNotes}"</p>
                  </div>
                )}

                {/* LISTA DE EJERCICIOS CON GUÍA TÉCNICA DIGITAL */}
                {exercises.length > 0 && (
                  <div className="plan-exercises-section">
                    <div className="exercises-header-row">
                      <span className="exercises-title">{t('player.plans.todayExercises', {}, "Ejercicios para Hoy:")}</span>
                      <span className="exercises-counter">
                        {completedCount} / {exercises.length} {t('player.plans.doneCount', {}, 'hechos')}
                      </span>
                    </div>

                    <div className="exercises-checklist">
                      {exercises.map((ex, idx) => {
                        const isDone = (ex.completedDates || []).includes(todayStr);
                        const guideKey = `${plan.id}-${idx}`;
                        const isGuideOpen = !!expandedGuides[guideKey];
                        const details = resolveExerciseDetails(ex, idx);
                        const ageCheck = assertAgeSafe(playerAge, ex);
                        const isAgeBlocked = !ageCheck.safe;

                        return (
                          <div key={idx} className="exercise-card-wrapper">
                            
                            {/* Fila principal interactiva */}
                            <div className={`exercise-check-row ${isDone ? 'done' : ''}`}>
                              <button 
                                type="button" 
                                className={`check-btn ${isAgeBlocked ? 'blocked' : ''}`}
                                onClick={() => !isAgeBlocked && toggleExerciseDay(plan.id, idx)}
                                disabled={isAgeBlocked}
                                title={isAgeBlocked ? t('player.plans.notAgeSafe') : isDone ? t('player.plans.markPending', {}, 'Marcar como pendiente') : t('player.plans.completeExercise', {}, 'Completar')}
                                style={isAgeBlocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                              >
                                {isAgeBlocked ? (
                                  <Ban size={22} color="#C85A32" />
                                ) : isDone ? (
                                  <CheckCircle2 size={22} color="#4CAF7D" />
                                ) : (
                                  <Circle size={22} color="rgba(128,128,128,0.4)" />
                                )}
                              </button>

                              <div className="exercise-info-block" onClick={() => !isAgeBlocked && toggleExerciseDay(plan.id, idx)} style={isAgeBlocked ? { cursor: 'default' } : {}}>
                                <span className="exercise-name-txt" style={isAgeBlocked ? { color: '#94a3b8' } : {}}>{details.name}</span>
                                <div className="exercise-badges-row">
                                  <span className="exercise-dos-pill">{details.sets} · {details.reps}</span>
                                  <span className="exercise-cat-pill">{details.category}</span>
                                  {isAgeBlocked && (
                                    <span 
                                      className="not-age-safe-badge"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        backgroundColor: 'rgba(200, 90, 50, 0.12)',
                                        color: '#C85A32',
                                        border: '1px solid rgba(200, 90, 50, 0.3)',
                                        marginLeft: '4px'
                                      }}
                                    >
                                      <Ban size={12} /> {t('player.plans.notAgeSafe')}
                                    </span>
                                  )}
                                  {details.isClinicalFallback && (
                                    <span 
                                      className="clinical-fallback-chip"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        backgroundColor: 'rgba(212, 168, 67, 0.15)',
                                        color: 'var(--m11-oro, #D4A843)',
                                        border: '1px solid rgba(212, 168, 67, 0.4)',
                                        marginLeft: '4px'
                                      }}
                                    >
                                      <Shield size={12} /> {t('clinical.fallbackChip')}
                                    </span>
                                  )}
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
                                title={t('player.plans.viewGuide', {}, 'Ver guía de ejecución técnica')}
                              >
                                <BookOpen size={15} />
                                <span>{t('player.plans.guide', {}, 'Guía')}</span>
                                {isGuideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>

                            {/* ILUSTRACIÓN O PLACEHOLDER HONESTO */}
                            <div style={{ padding: '0 12px' }}>
                              <ExerciseIllustrationBlock 
                                illustration={details.illustration} 
                                exerciseName={details.name} 
                                compact={true} 
                              />

                              {/* CUE / DESCRIPCIÓN TÉCNICA */}
                              {details.cue && (
                                <p style={{ fontSize: '0.82rem', color: '#475569', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                                  {details.cue}
                                </p>
                              )}

                              {/* COACHING POINTS */}
                              {details.coachingPoints && details.coachingPoints.length > 0 && (
                                <div style={{ marginBottom: '8px', padding: '6px 10px', background: 'rgba(27, 58, 45, 0.04)', borderRadius: '6px', fontSize: '0.78rem' }}>
                                  <span style={{ fontWeight: 700, color: '#1B3A2D', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                    <CheckCircle2 size={13} color="#4CAF7D" /> {t('exercise.coachingPoints', 'Puntos clave')}:
                                  </span>
                                  <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155', lineHeight: 1.4 }}>
                                    {details.coachingPoints.map((cp, cIdx) => (
                                      <li key={cIdx}>{cp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
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

                                  <div className="guide-verification-chip${details.isClinicalFallback ? ' clinical-fallback-chip' : ''}">
                                    {details.isClinicalFallback ? (
                                      <Shield size={13} color="var(--m11-oro, #D4A843)" />
                                    ) : (
                                      <span className="guide-verification-dot" />
                                    )}
                                    <span>
                                      {details.isClinicalFallback
                                        ? `[${t('clinical.fallbackChip')}: ${details.rawPrevention || details.preventionValue}]`
                                        : t('exerciseCatalog.clinicalFallbackNotice')}
                                    </span>
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

