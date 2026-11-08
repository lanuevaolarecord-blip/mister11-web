/**
 * src/data/vectorIllustrations.js
 * Míster11 — B5-A: Piloto de Ilustraciones Vectoriales de Bajo Riesgo (Sin Fisio)
 *
 * Características:
 * - 100% Vectorial (SVG limpio, sin fotos, estética profesional Android First).
 * - Generado programáticamente con coordenadas biomecánicas deterministas.
 * - Paleta institucional: Azul Marino (#0A2540), Verde Campo (#00D4B2 / #059669), Blanco y Grises neutros (#F3F4F6, #9CA3AF).
 * - Cero IA generativa alucinada: puntos anatómicos precisos y datos clínicos derivados del catálogo.
 * - Estado inicial: pilot_pending_review con reviewed_by_human = false (requiere confirmación del dueño).
 */

export const PILOT_VECTOR_ILLUSTRATIONS = {
  'sys-1': {
    id: 'sys-1',
    nameEs: 'Plancha Frontal',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'pilot_pending_review',
    author: 'agent',
    clinicalData: {
      targetZones: ['core', 'abdomen', 'estabilizadores_lumbopelvicos'],
      coachingPoints: [
        'Apoyo firme sobre antebrazos (codos alineados bajo los hombros).',
        'Línea recta continua desde la coronilla hasta los talones.',
        'Activación glútea y abdominal constante; pelvis en posición neutra.',
        'Respiración diafragmática fluida sin contener el aire.'
      ],
      mistakesToAvoid: [
        'Evitar que la pelvis caiga (hiperextensión lumbar).',
        'Evitar elevar los glúteos en forma de triángulo (pérdida de tensión en core).',
        'No descolgar la cabeza ni arquear el cuello.'
      ]
    },
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="pMat" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
  </defs>
  <!-- Colchoneta / Suelo -->
  <rect x="20" y="155" width="280" height="8" rx="4" fill="url(#pMat)"/>
  <!-- Línea de alineación neutra (verde campo) -->
  <line x1="55" y1="120" x2="265" y2="70" stroke="#00D4B2" stroke-width="2" stroke-dasharray="4,4"/>
  <!-- Silueta biomecánica -->
  <!-- Pies / Puntas -->
  <circle cx="55" cy="150" r="6" fill="#0A2540"/>
  <!-- Piernas extendidas -->
  <line x1="55" y1="150" x2="145" y2="120" stroke="#0A2540" stroke-width="8" stroke-linecap="round"/>
  <!-- Pelvis / Core -->
  <circle cx="145" cy="120" r="8" fill="#00D4B2"/>
  <!-- Tronco alineado -->
  <line x1="145" y1="120" x2="235" y2="90" stroke="#0A2540" stroke-width="9" stroke-linecap="round"/>
  <!-- Hombro -->
  <circle cx="235" cy="90" r="7" fill="#0A2540"/>
  <!-- Cabeza en línea neutra -->
  <circle cx="265" cy="78" r="9" fill="#0A2540"/>
  <!-- Brazo / Antebrazo vertical de soporte -->
  <line x1="235" y1="90" x2="235" y2="150" stroke="#0A2540" stroke-width="6" stroke-linecap="round"/>
  <line x1="235" y1="150" x2="260" y2="150" stroke="#0A2540" stroke-width="6" stroke-linecap="round"/>
  <!-- Indicador biomecánico Core -->
  <text x="145" y="105" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#059669" text-anchor="middle">CORE ACTIVO</text>
</svg>`
  },

  'sys-2': {
    id: 'sys-2',
    nameEs: 'Puente de Glúteos',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'pilot_pending_review',
    author: 'agent',
    clinicalData: {
      targetZones: ['cadera', 'glúteos', 'isquiosurales', 'core'],
      coachingPoints: [
        'Tumbado supino con plantas de los pies apoyadas en el suelo al ancho de caderas.',
        'Extender la cadera hasta formar una rampa recta hombros-cadera-rodillas.',
        'Contracción voluntaria de glúteos en el punto de máxima altura (1-2s).',
        'Descenso controlado vértebra por vértebra.'
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
  <!-- Vector de alineación hombro-cadera-rodilla -->
  <line x1="65" y1="155" x2="215" y2="105" stroke="#00D4B2" stroke-width="2" stroke-dasharray="4,4"/>
  <!-- Cabeza y hombros en suelo -->
  <circle cx="45" cy="155" r="9" fill="#0A2540"/>
  <circle cx="65" cy="155" r="7" fill="#0A2540"/>
  <line x1="65" y1="155" x2="140" y2="115" stroke="#0A2540" stroke-width="9" stroke-linecap="round"/>
  <!-- Pelvis elevada / Glúteo activo -->
  <circle cx="140" cy="115" r="8" fill="#00D4B2"/>
  <!-- Muslos hacia rodillas -->
  <line x1="140" y1="115" x2="215" y2="105" stroke="#0A2540" stroke-width="8" stroke-linecap="round"/>
  <!-- Rodilla flexionada 90° -->
  <circle cx="215" cy="105" r="7" fill="#0A2540"/>
  <!-- Pierna inferior / tibia vertical -->
  <line x1="215" y1="105" x2="225" y2="158" stroke="#0A2540" stroke-width="7" stroke-linecap="round"/>
  <!-- Pie firme en suelo -->
  <line x1="215" y1="158" x2="245" y2="158" stroke="#0A2540" stroke-width="6" stroke-linecap="round"/>
  <!-- Flecha de empuje vertical -->
  <path d="M 140 145 L 140 128 M 136 133 L 140 126 L 144 133" stroke="#00D4B2" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <text x="140" y="98" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#059669" text-anchor="middle">EMPUJE GLÚTEO</text>
</svg>`
  },

  'sys-3': {
    id: 'sys-3',
    nameEs: 'Movilidad de Tobillo',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'pilot_pending_review',
    author: 'agent',
    clinicalData: {
      targetZones: ['tobillo', 'dorsiflexion', 'soleo', 'tendon_aquiles'],
      coachingPoints: [
        'Posición de caballero frente a una pared de referencia (10 cm de distancia).',
        'Avanzar la rodilla en línea recta sobre el 2º-3º dedo del pie.',
        'Mantener el talón estrictamente pegado al suelo durante todo el recorrido.',
        'Alcanzar el punto de flexión máxima sin dolor y regresar controladamente.'
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
  <!-- Pierna retrasada (apoyo en rodilla) -->
  <circle cx="70" cy="162" r="6" fill="#0A2540"/>
  <line x1="70" y1="162" x2="115" y2="110" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
  <!-- Tronco erguido -->
  <line x1="115" y1="110" x2="125" y2="55" stroke="#0A2540" stroke-width="8" stroke-linecap="round"/>
  <circle cx="127" cy="42" r="8" fill="#0A2540"/>
  <!-- Muslo adelantado horizontal -->
  <line x1="115" y1="110" x2="195" y2="108" stroke="#0A2540" stroke-width="8" stroke-linecap="round"/>
  <!-- Rodilla adelantándose hacia la pared -->
  <circle cx="195" cy="108" r="7" fill="#00D4B2"/>
  <!-- Tibia en ángulo de dorsiflexión -->
  <line x1="195" y1="108" x2="170" y2="163" stroke="#0A2540" stroke-width="7" stroke-linecap="round"/>
  <!-- Talón pegado al suelo (clave clínica) -->
  <circle cx="170" cy="163" r="5" fill="#059669"/>
  <!-- Pie firme adelantado -->
  <line x1="165" y1="163" x2="205" y2="163" stroke="#0A2540" stroke-width="6" stroke-linecap="round"/>
  <!-- Vector flecha dorsiflexión hacia pared -->
  <path d="M 205 108 L 245 108 M 238 103 L 246 108 L 238 113" stroke="#00D4B2" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <text x="170" y="180" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#059669" text-anchor="middle">TALÓN FIJO (0 DESPEGUE)</text>
</svg>`
  },

  'sys-8': {
    id: 'sys-8',
    nameEs: 'Estiramiento Isquiosural',
    tier_riesgo: 'bajo',
    edadMin: 10,
    reviewed_by_human: false,
    status: 'pilot_pending_review',
    author: 'agent',
    clinicalData: {
      targetZones: ['isquiosurales', 'fosa_poplitea', 'cadera_posterior'],
      coachingPoints: [
        'Talón apoyado sobre una superficie baja/firme o en el suelo con rodilla extendida.',
        'Flexión de tronco desde las caderas (bisagra de cadera), manteniendo la columna neutra.',
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
  <line x1="110" y1="165" x2="110" y2="110" stroke="#0A2540" stroke-width="7" stroke-linecap="round"/>
  <!-- Pelvis (eje de flexión / bisagra) -->
  <circle cx="110" cy="110" r="7" fill="#00D4B2"/>
  <!-- Pierna estirada sobre el soporte -->
  <line x1="110" y1="110" x2="215" y2="135" stroke="#0A2540" stroke-width="7" stroke-linecap="round"/>
  <circle cx="215" cy="135" r="5" fill="#0A2540"/>
  <!-- Zona de estiramiento activa (isquiosural) -->
  <line x1="130" y1="120" x2="195" y2="132" stroke="#00D4B2" stroke-width="3" stroke-dasharray="3,3"/>
  <!-- Tronco con flexión neutra de cadera -->
  <line x1="110" y1="110" x2="155" y2="70" stroke="#0A2540" stroke-width="8" stroke-linecap="round"/>
  <circle cx="165" cy="60" r="8" fill="#0A2540"/>
  <!-- Brazos extendidos hacia la pierna sin forzar -->
  <line x1="145" y1="80" x2="185" y2="105" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
  <!-- Indicador biomecánico -->
  <text x="160" y="150" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#059669" text-anchor="middle">TENSIÓN SUAVE ISQUIO</text>
</svg>`
  }
};

/**
 * Retorna la ilustración vectorial del piloto para un ID, si existe.
 */
export const getPilotIllustration = (id) => {
  return PILOT_VECTOR_ILLUSTRATIONS[id] || null;
};
