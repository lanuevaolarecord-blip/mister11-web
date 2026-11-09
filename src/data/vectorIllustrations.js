/**
 * src/data/vectorIllustrations.js
 * Míster11 — B5-A: Piloto de Ilustraciones Vectoriales de Bajo Riesgo (Sin Fisio)
 *
 * Características:
 * - 100% Vectorial (SVG limpio, sin fotos, estética profesional Android First).
 * - Coordenadas biomecánicas deterministas con silueta de bajo riesgo.
 * - Paleta institucional Tierra y Campo EXCLUSIVA:
 *     * Nodos: Verde Campo (#4CAF7D) con anillo exterior Oro (#D4A843)
 *     * Músculo activo: Verde Campo (#4CAF7D -> #2E7D52) con halo
 *     * Error biomecánico evitado: Marcador X Terracota (#C85A32) en forma primaria (WCAG 1.4.1)
 *     * Línea de alineación axial: Oro (#D4A843) punteada
 *     * Silueta estructural: Verde Bosque (#1B3A2D) y neutros (#E2E8F0, #CBD5E1, #94A3B8)
 * - Cero IA generativa alucinada. Clínica derivada estrictamente del catálogo de datos.
 * - rigVerifiedBy AUSENTE a propósito (bajo riesgo no exige firma de fisioterapeuta).
 * - reviewed_by_human = false (requiere confirmación del dueño para desbloqueo definitivo).
 * - 0 CDN, 100% offline, peso < 50 KB.
 */

/**
 * Lookup determinista de grupos musculares desde targetZones del catálogo
 */
export const resolveToGroups = (targetZones = []) => {
  const ZONE_GROUP_LOOKUP = {
    'core': 'estabilizadores_tronco',
    'abdomen': 'estabilizadores_tronco',
    'estabilizadores_lumbopelvicos': 'estabilizadores_tronco',
    'oblicuos': 'estabilizadores_tronco',
    'cadera': 'complejo_lumbopelvico',
    'glúteos': 'cadera_posterior',
    'isquiosurales': 'cadera_posterior',
    'fosa_poplitea': 'cadera_posterior',
    'cadera_posterior': 'cadera_posterior',
    'tobillo': 'cadena_distal',
    'dorsiflexion': 'cadena_distal',
    'soleo': 'cadena_distal',
    'tendon_aquiles': 'cadena_distal'
  };
  return [...new Set(targetZones.map(z => ZONE_GROUP_LOOKUP[z] || z))];
};

export const PILOT_VECTOR_ILLUSTRATIONS = {
  // ── 1. PLANCHA FRONTAL ─────────────────────────────────────────────────────
  'sys-1': {
    id: 'sys-1',
    nameEs: 'Plancha Frontal',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'rejected_by_owner',
    rejection_note: 'Rechazadas por el DUEÑO en Oleada 9.3: silueta demasiado plana, no se visualiza el cuerpo completo y no se muestran los músculos a trabajar. Requiere rediseño biomecánico.',
    author: 'agent',
    source: 'FIFA 11+ Programme Manual, Part 2 (Core stability)',
    clinicalData: {
      targetZones: ['core', 'abdomen', 'estabilizadores_lumbopelvicos'],
      highlightMuscles: ['core', 'abdomen', 'estabilizadores_lumbopelvicos'],
      muscleGroups: resolveToGroups(['core', 'abdomen', 'estabilizadores_lumbopelvicos']),
      cue: {
        joint: 'pelvis',
        alignment: 'horizontal_neutra',
        errorAvoided: 'hiperextension_lumbar',
        markerCoords: { x: 145, y: 135 }
      },
      fases: {
        inicio: '0.0s',
        concentrica: '1.0s',
        excentrica: '2.0s',
        pausaIsometria: '1.0s',
        ratioTiming: '2:1'
      },
      alt: {
        es: 'Ilustración técnica: Plancha frontal con alineación axial neutra y activación de core',
        'es-419': 'Ilustración técnica: Plancha frontal con alineación axial neutra y activación de core',
        en: 'Technical illustration: Front plank with neutral axial alignment and core activation',
        pt: 'Ilustração técnica: Prancha frontal com alinhamento axial neutro e ativação do core',
        fr: 'Illustration technique: Planche faciale avec alignement axial neutre et activation du tronc',
        id: 'Ilustrasi teknis: Front plank dengan penyelarasan aksial netral dan aktivasi core'
      },
      coachingPoints: [
        'Apoyo firme sobre antebrazos (codos alineados bajo los hombros).',
        'Línea recta continua desde la coronilla hasta los talones.',
        'Activación glútea y abdominal constante; pelvis en posición neutra.',
        'Respiración diafragmática fluida sin contener el aire.'
      ],
      mistakesToAvoid: [
        'Evitar que la pelvis caiga (hiperextensión lumbar).',
        'Evitar elevar los glúteos en forma de triángulo.',
        'No descolgar la cabeza ni arquear el cuello.'
      ]
    },
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="pMat" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
    <radialGradient id="haloCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4CAF7D" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#2E7D52" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Suelo de apoyo -->
  <rect x="20" y="155" width="280" height="6" rx="3" fill="url(#pMat)"/>
  <!-- Línea axial canónica punteada (Oro #D4A843) -->
  <line x1="55" y1="120" x2="265" y2="70" stroke="#D4A843" stroke-width="2" stroke-dasharray="4,4"/>
  <!-- Halo de activación muscular (Tierra y Campo #4CAF7D -> #2E7D52) -->
  <circle cx="145" cy="120" r="16" fill="url(#haloCore)"/>
  <!-- Silueta biomecánica -->
  <circle cx="55" cy="150" r="6" fill="#1B3A2D"/>
  <line x1="55" y1="150" x2="145" y2="120" stroke="#1B3A2D" stroke-width="8" stroke-linecap="round"/>
  <!-- Músculo activo / Tronco -->
  <line x1="145" y1="120" x2="235" y2="90" stroke="#2E7D52" stroke-width="10" stroke-linecap="round"/>
  <!-- Nodos con anillo exterior #D4A843 + centro #4CAF7D -->
  <circle cx="145" cy="120" r="8" fill="#4CAF7D" stroke="#D4A843" stroke-width="2.5"/>
  <circle cx="235" cy="90" r="7" fill="#4CAF7D" stroke="#D4A843" stroke-width="2.5"/>
  <circle cx="265" cy="78" r="9" fill="#1B3A2D"/>
  <!-- Soporte antebrazo -->
  <line x1="235" y1="90" x2="235" y2="150" stroke="#1B3A2D" stroke-width="6" stroke-linecap="round"/>
  <line x1="235" y1="150" x2="260" y2="150" stroke="#1B3A2D" stroke-width="6" stroke-linecap="round"/>
  <!-- Marcador X primario para error evitado (pelvis caída) en #C85A32 (WCAG 1.4.1) -->
  <g transform="translate(145, 140)">
    <circle cx="0" cy="0" r="8" fill="#F7F5F0" stroke="#C85A32" stroke-width="1.5"/>
    <path d="M -4 -4 L 4 4 M -4 4 L 4 -4" stroke="#C85A32" stroke-width="2" stroke-linecap="round"/>
  </g>
  <text x="145" y="103" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#1B3A2D" text-anchor="middle">CORE ACTIVO (2:1)</text>
</svg>`
  },

  // ── 2. PUENTE DE GLÚTEOS ───────────────────────────────────────────────────
  'sys-2': {
    id: 'sys-2',
    nameEs: 'Puente de Glúteos',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'rejected_by_owner',
    rejection_note: 'Rechazadas por el DUEÑO en Oleada 9.3: silueta demasiado plana, no se visualiza el cuerpo completo y no se muestran los músculos a trabajar. Requiere rediseño biomecánico.',
    author: 'agent',
    source: 'FIFA 11+ Programme Manual, Part 2 (Hip extensor)',
    clinicalData: {
      targetZones: ['cadera', 'glúteos', 'isquiosurales', 'core'],
      highlightMuscles: ['cadera', 'glúteos', 'isquiosurales', 'core'],
      muscleGroups: resolveToGroups(['cadera', 'glúteos', 'isquiosurales', 'core']),
      cue: {
        joint: 'cadera',
        alignment: 'rampa_recta_hombro_rodilla',
        errorAvoided: 'arqueo_lumbar_excesivo',
        markerCoords: { x: 100, y: 140 }
      },
      fases: {
        inicio: '0.0s',
        concentrica: '1.0s',
        excentrica: '2.0s',
        pausaIsometria: '1.5s',
        ratioTiming: '2:1'
      },
      alt: {
        es: 'Ilustración técnica: Puente de glúteos con empuje de cadera y alineación neutra',
        'es-419': 'Ilustración técnica: Puente de glúteos con empuje de cadera y alineación neutra',
        en: 'Technical illustration: Glute bridge with hip extension and neutral alignment',
        pt: 'Ilustração técnica: Ponte de glúteos com extensão de quadril e alinhamento neutro',
        fr: 'Illustration technique: Pont fessier avec extension de hanche et alignement neutre',
        id: 'Ilustrasi teknis: Glute bridge dengan ekstensi pinggul dan penyelarasan netral'
      },
      coachingPoints: [
        'Tumbado supino con plantas de los pies apoyadas al ancho de caderas.',
        'Extender la cadera hasta formar una rampa recta hombros-cadera-rodillas.',
        'Contracción voluntaria de glúteos en el punto máximo (1-2s).',
        'Descenso excéntrico controlado vértebra por vértebra (2s).'
      ],
      mistakesToAvoid: [
        'No empujar con la zona lumbar ni arquear la espalda baja.',
        'Evitar que las rodillas colapsen hacia adentro (valgo).',
        'No despegar los talones del suelo durante el empuje.'
      ]
    },
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Suelo -->
  <line x1="20" y1="160" x2="300" y2="160" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round"/>
  <!-- Línea axial canónica punteada (Oro #D4A843) -->
  <line x1="65" y1="155" x2="215" y2="105" stroke="#D4A843" stroke-width="2" stroke-dasharray="4,4"/>
  <!-- Cabeza y hombros en suelo -->
  <circle cx="45" cy="155" r="9" fill="#1B3A2D"/>
  <circle cx="65" cy="155" r="7" fill="#4CAF7D" stroke="#D4A843" stroke-width="2"/>
  <line x1="65" y1="155" x2="140" y2="115" stroke="#1B3A2D" stroke-width="9" stroke-linecap="round"/>
  <!-- Pelvis elevada / Glúteo activo con nodo canónico -->
  <circle cx="140" cy="115" r="8" fill="#4CAF7D" stroke="#D4A843" stroke-width="2.5"/>
  <!-- Muslos hacia rodillas con tinte #2E7D52 -->
  <line x1="140" y1="115" x2="215" y2="105" stroke="#2E7D52" stroke-width="9" stroke-linecap="round"/>
  <circle cx="215" cy="105" r="7" fill="#4CAF7D" stroke="#D4A843" stroke-width="2.5"/>
  <line x1="215" y1="105" x2="225" y2="158" stroke="#1B3A2D" stroke-width="7" stroke-linecap="round"/>
  <line x1="215" y1="158" x2="245" y2="158" stroke="#1B3A2D" stroke-width="6" stroke-linecap="round"/>
  <!-- Flecha de empuje vertical en Verde Campo #4CAF7D -->
  <path d="M 140 145 L 140 128 M 136 133 L 140 126 L 144 133" stroke="#4CAF7D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Marcador X evitado en zona lumbar (compensación lumbar) en #C85A32 -->
  <g transform="translate(100, 140)">
    <circle cx="0" cy="0" r="7" fill="#F7F5F0" stroke="#C85A32" stroke-width="1.5"/>
    <path d="M -3 -3 L 3 3 M -3 3 L 3 -3" stroke="#C85A32" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <text x="140" y="98" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#1B3A2D" text-anchor="middle">EMPUJE GLÚTEO (2:1)</text>
</svg>`
  },

  // ── 3. MOVILIDAD DE TOBILLO ───────────────────────────────────────────────
  'sys-3': {
    id: 'sys-3',
    nameEs: 'Movilidad de Tobillo',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'rejected_by_owner',
    rejection_note: 'Rechazadas por el DUEÑO en Oleada 9.3: silueta demasiado plana, no se visualiza el cuerpo completo y no se muestran los músculos a trabajar. Requiere rediseño biomecánico.',
    author: 'agent',
    source: 'FIFA 11+ Programme Manual, Part 1 (Running & mobility)',
    clinicalData: {
      targetZones: ['tobillo', 'dorsiflexion', 'soleo', 'tendon_aquiles'],
      highlightMuscles: ['tobillo', 'dorsiflexion', 'soleo', 'tendon_aquiles'],
      muscleGroups: resolveToGroups(['tobillo', 'dorsiflexion', 'soleo', 'tendon_aquiles']),
      cue: {
        joint: 'tobillo',
        alignment: 'rodilla_sobre_segundo_dedo',
        errorAvoided: 'despegue_del_talon',
        markerCoords: { x: 170, y: 175 }
      },
      fases: {
        inicio: '0.0s',
        concentrica: '1.5s',
        excentrica: '2.0s',
        pausaIsometria: '1.0s',
        ratioTiming: '2:1'
      },
      alt: {
        es: 'Ilustración técnica: Test de dorsiflexión de tobillo con talón fijo y avance de rodilla',
        'es-419': 'Ilustración técnica: Test de dorsiflexión de tobillo con talón fijo y avance de rodilla',
        en: 'Technical illustration: Ankle dorsiflexion mobility drill with heel grounded',
        pt: 'Ilustração técnica: Mobilidade de tornozelo com calcanhar fixo e avanço do joelho',
        fr: 'Illustration technique: Mobilité de la cheville en flexion dorsale avec talon au sol',
        id: 'Ilustrasi teknis: Latihan mobilitas dorsofleksi pergelangan kaki dengan tumit menempel'
      },
      coachingPoints: [
        'Posición de caballero frente a una pared de referencia (10 cm de distancia).',
        'Avanzar la rodilla en línea recta sobre el 2º-3º dedo del pie.',
        'Mantener el talón estrictamente pegado al suelo durante todo el recorrido.',
        'Alcanzar la flexión máxima sin dolor y regresar controladamente (2s).'
      ],
      mistakesToAvoid: [
        'Despegar el talón del suelo para ganar recorrido artificial.',
        'Colapso medial de rodilla hacia el dedo gordo (valgo compensatorio).',
        'Rotar la pelvis para compensar la rigidez articular.'
      ]
    },
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Suelo -->
  <line x1="20" y1="165" x2="300" y2="165" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round"/>
  <!-- Pared de referencia vertical -->
  <line x1="260" y1="30" x2="260" y2="165" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
  <!-- Pierna retrasada (apoyo) -->
  <circle cx="70" cy="162" r="6" fill="#1B3A2D"/>
  <line x1="70" y1="162" x2="115" y2="110" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
  <!-- Tronco erguido -->
  <line x1="115" y1="110" x2="125" y2="55" stroke="#1B3A2D" stroke-width="8" stroke-linecap="round"/>
  <circle cx="127" cy="42" r="8" fill="#1B3A2D"/>
  <!-- Muslo adelantado horizontal -->
  <line x1="115" y1="110" x2="195" y2="108" stroke="#1B3A2D" stroke-width="8" stroke-linecap="round"/>
  <!-- Rodilla adelantándose hacia la pared con nodo canónico -->
  <circle cx="195" cy="108" r="7" fill="#4CAF7D" stroke="#D4A843" stroke-width="2.5"/>
  <!-- Tibia en ángulo de dorsiflexión activa #2E7D52 -->
  <line x1="195" y1="108" x2="170" y2="163" stroke="#2E7D52" stroke-width="7" stroke-linecap="round"/>
  <!-- Talón pegado al suelo con nodo canónico -->
  <circle cx="170" cy="163" r="6" fill="#4CAF7D" stroke="#D4A843" stroke-width="2"/>
  <line x1="165" y1="163" x2="205" y2="163" stroke="#1B3A2D" stroke-width="6" stroke-linecap="round"/>
  <!-- Vector flecha dorsiflexión hacia pared -->
  <path d="M 205 108 L 245 108 M 238 103 L 246 108 L 238 113" stroke="#4CAF7D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Marcador de control en talón (0 despegue) -->
  <g transform="translate(170, 178)">
    <circle cx="0" cy="0" r="6" fill="#F7F5F0" stroke="#4CAF7D" stroke-width="1.5"/>
    <path d="M -2 0 L 0 2 L 3 -2" stroke="#4CAF7D" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </g>
  <text x="170" y="193" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#1B3A2D" text-anchor="middle">TALÓN FIJO (0 DESPEGUE)</text>
</svg>`
  },

  // ── 4. ESTIRAMIENTO ISQUIOSURAL ───────────────────────────────────────────
  'sys-8': {
    id: 'sys-8',
    nameEs: 'Estiramiento Isquiosural',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'rejected_by_owner',
    rejection_note: 'Rechazadas por el DUEÑO en Oleada 9.3: silueta demasiado plana, no se visualiza el cuerpo completo y no se muestran los músculos a trabajar. Requiere rediseño biomecánico.',
    author: 'agent',
    source: 'FIFA 11+ Programme Manual, Part 3 (Cool-down & recovery)',
    clinicalData: {
      targetZones: ['isquiosurales', 'fosa_poplitea', 'cadera_posterior'],
      highlightMuscles: ['isquiosurales', 'fosa_poplitea', 'cadera_posterior'],
      muscleGroups: resolveToGroups(['isquiosurales', 'fosa_poplitea', 'cadera_posterior']),
      cue: {
        joint: 'cadera',
        alignment: 'bisagra_cadera_columna_neutra',
        errorAvoided: 'flexion_lumbar_excesiva',
        markerCoords: { x: 130, y: 85 }
      },
      fases: {
        inicio: '0.0s',
        concentrica: '1.0s',
        excentrica: '2.5s',
        pausaIsometria: '20.0s',
        ratioTiming: '2:1'
      },
      alt: {
        es: 'Ilustración técnica: Estiramiento isquiosural asistido en soporte bajo con columna neutra',
        'es-419': 'Ilustración técnica: Estiramiento isquiosural asistido en soporte bajo con columna neutra',
        en: 'Technical illustration: Hamstring stretch on low support maintaining neutral spine',
        pt: 'Ilustração técnica: Alongamento de isquiotibiais em suporte baixo com coluna neutra',
        fr: 'Illustration technique: Étirement des ischio-jambiers sur support bas et dos droit',
        id: 'Ilustrasi teknis: Peregangan paha belakang (hamstring) dengan tulang belakang netral'
      },
      coachingPoints: [
        'Talón apoyado sobre una superficie baja y firme con rodilla extendida.',
        'Flexión de tronco desde las caderas (bisagra de cadera), manteniendo columna neutra.',
        'Sensación de tensión suave a moderada en el vientre muscular (escala 3-4/10).',
        'Mantener 20-30 segundos respirando calmadamente sin rebotar.'
      ],
      mistakesToAvoid: [
        'Flexionar la columna lumbar en exceso para intentar tocar la punta del pie.',
        'Bloquear la rodilla en hiperextensión dolorosa.',
        'Realizar rebotes balísticos incontrolados.'
      ]
    },
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Suelo -->
  <line x1="20" y1="165" x2="300" y2="165" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round"/>
  <!-- Soporte bajo / escalón -->
  <rect x="210" y="135" width="45" height="30" rx="3" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="2"/>
  <!-- Pierna de apoyo vertical -->
  <line x1="110" y1="165" x2="110" y2="110" stroke="#1B3A2D" stroke-width="7" stroke-linecap="round"/>
  <!-- Pelvis (eje de flexión / bisagra) con nodo canónico -->
  <circle cx="110" cy="110" r="7" fill="#4CAF7D" stroke="#D4A843" stroke-width="2.5"/>
  <!-- Pierna estirada sobre el soporte -->
  <line x1="110" y1="110" x2="215" y2="135" stroke="#1B3A2D" stroke-width="7" stroke-linecap="round"/>
  <circle cx="215" cy="135" r="5" fill="#1B3A2D"/>
  <!-- Zona de estiramiento activa (isquiosural) con línea axial punteada #D4A843 -->
  <line x1="130" y1="120" x2="195" y2="132" stroke="#D4A843" stroke-width="3" stroke-dasharray="3,3"/>
  <!-- Tronco con flexión neutra de cadera en #2E7D52 -->
  <line x1="110" y1="110" x2="155" y2="70" stroke="#2E7D52" stroke-width="8" stroke-linecap="round"/>
  <circle cx="165" cy="60" r="8" fill="#1B3A2D"/>
  <line x1="145" y1="80" x2="185" y2="105" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
  <!-- Marcador X en columna lumbar (error de joroba/flexión lumbar) en #C85A32 -->
  <g transform="translate(130, 85)">
    <circle cx="0" cy="0" r="7" fill="#F7F5F0" stroke="#C85A32" stroke-width="1.5"/>
    <path d="M -3 -3 L 3 3 M -3 3 L 3 -3" stroke="#C85A32" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <text x="160" y="150" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#1B3A2D" text-anchor="middle">TENSIÓN SUAVE ISQUIO</text>
</svg>`
  },

  // ── 5. PLANCHA LATERAL (CORE BÁSICO) ──────────────────────────────────────
  'sys-9': {
    id: 'sys-9',
    nameEs: 'Plancha Lateral',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'rejected_by_owner',
    rejection_note: 'Rechazadas por el DUEÑO en Oleada 9.3: silueta demasiado plana, no se visualiza el cuerpo completo y no se muestran los músculos a trabajar. Requiere rediseño biomecánico.',
    author: 'agent',
    source: 'FIFA 11+ Programme Manual, Part 2 (Core stability)',
    clinicalData: {
      targetZones: ['core', 'oblicuos', 'estabilizadores_lumbopelvicos'],
      highlightMuscles: ['core', 'oblicuos', 'estabilizadores_lumbopelvicos'],
      muscleGroups: resolveToGroups(['core', 'oblicuos', 'estabilizadores_lumbopelvicos']),
      cue: {
        joint: 'hombro_cadera',
        alignment: 'linea_recta_lateral',
        errorAvoided: 'caida_cadera_lateral',
        markerCoords: { x: 140, y: 135 }
      },
      fases: {
        inicio: '0.0s',
        concentrica: '1.0s',
        excentrica: '2.0s',
        pausaIsometria: '1.0s',
        ratioTiming: '2:1'
      },
      alt: {
        es: 'Ilustración técnica: Plancha lateral con apoyo en antebrazo y alineación corporal',
        'es-419': 'Ilustración técnica: Plancha lateral con apoyo en antebrazo y alineación corporal',
        en: 'Technical illustration: Side plank with forearm support and linear body alignment',
        pt: 'Ilustração técnica: Prancha lateral com apoio no antebraço e alinhamento corporal',
        fr: 'Illustration technique: Planche latérale avec appui sur l avant-bras et alignement droit',
        id: 'Ilustrasi teknis: Side plank dengan penyangga lengan bawah dan penyelarasan tubuh'
      },
      coachingPoints: [
        'Apoyo sobre el antebrazo inferior con codo alineado verticalmente bajo el hombro.',
        'Elevar la cadera del suelo hasta alinear tobillos, cadera y cabeza.',
        'Activación constante de los oblicuos y musculatura lateral del core.',
        'Mantener el hombro superior abierto sin rotar el torso hacia el suelo.'
      ],
      mistakesToAvoid: [
        'Dejar caer la cadera hacia el suelo (pérdida de tensión en oblicuos).',
        'Rotar el torso hacia adelante cerrando el pecho.',
        'Colocar el codo demasiado adelantado respecto al hombro de soporte.'
      ]
    },
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Suelo -->
  <line x1="20" y1="160" x2="300" y2="160" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round"/>
  <!-- Línea axial lateral punteada (Oro #D4A843) -->
  <line x1="55" y1="150" x2="250" y2="70" stroke="#D4A843" stroke-width="2" stroke-dasharray="4,4"/>
  <!-- Pies juntos en suelo -->
  <circle cx="55" cy="150" r="6" fill="#1B3A2D"/>
  <line x1="55" y1="150" x2="140" y2="110" stroke="#1B3A2D" stroke-width="8" stroke-linecap="round"/>
  <!-- Cadera lateral elevada con nodo canónico -->
  <circle cx="140" cy="110" r="8" fill="#4CAF7D" stroke="#D4A843" stroke-width="2.5"/>
  <!-- Tronco y oblicuos en #2E7D52 -->
  <line x1="140" y1="110" x2="225" y2="80" stroke="#2E7D52" stroke-width="9" stroke-linecap="round"/>
  <!-- Hombro de soporte con nodo canónico -->
  <circle cx="225" cy="80" r="7" fill="#4CAF7D" stroke="#D4A843" stroke-width="2.5"/>
  <circle cx="250" cy="70" r="9" fill="#1B3A2D"/>
  <!-- Brazo de apoyo vertical -->
  <line x1="225" y1="80" x2="225" y2="155" stroke="#1B3A2D" stroke-width="6" stroke-linecap="round"/>
  <!-- Brazo libre superior -->
  <line x1="225" y1="80" x2="225" y2="35" stroke="#94A3B8" stroke-width="4" stroke-linecap="round"/>
  <!-- Marcador X en cadera caída en #C85A32 (WCAG 1.4.1) -->
  <g transform="translate(140, 135)">
    <circle cx="0" cy="0" r="7" fill="#F7F5F0" stroke="#C85A32" stroke-width="1.5"/>
    <path d="M -3 -3 L 3 3 M -3 3 L 3 -3" stroke="#C85A32" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <text x="140" y="93" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#1B3A2D" text-anchor="middle">OBLICUO ACTIVO (2:1)</text>
</svg>`
  }
};

/**
 * Retorna la ilustración vectorial del piloto para un ID, si existe.
 */
export const getPilotIllustration = (id) => {
  return PILOT_VECTOR_ILLUSTRATIONS[id] || null;
};
