/**
 * retosConfig.js — Catálogo de 8 Retos en Casa Independientes
 * Portado fielmente del Apéndice A de Míster11.
 * Modos: 'timer' (segundos fijos con confirmación de éxito),
 *        'count' (repeticiones objetivo acumulativas),
 *        'streak' (mejor racha sin fallo/caída del balón).
 */

export const RETOS_CATALOG = [
  {
    id: 'eq',
    em: '⚖️',
    t: 'Reto Equilibrio',
    sk: 'Propiocepción',
    mode: 'timer',
    sets: 3,
    seg: 20,
    metric: 'Sets superados',
    what: 'Equilibrio y estabilidad de tobillo.',
    steps: [
      'Apoya un solo pie y aguanta el tiempo sin apoyar el otro.',
      'Cambia de pierna en cada set.',
      'Confirma al terminar si lograste mantener el equilibrio.'
    ],
    why: 'Reduce hasta un 40% el riesgo de esguinces y mejora la solidez en apoyos.',
    safetyNote: 'Realiza el ejercicio cerca de una pared o sofá para apoyarte si pierdes el equilibrio.',
    rounds: [
      { e: '🦵', d: 'Pata coja, ojos abiertos' },
      { e: '🙈', d: 'Pata coja, ojos cerrados (cerca de una pared)' },
      { e: '🛏️', d: 'Pata coja sobre un cojín' }
    ]
  },
  {
    id: 'cuerda',
    em: '🪢',
    t: 'Salta la Cuerda',
    sk: 'Coordinación y resistencia',
    mode: 'count',
    sets: 3,
    target: 30,
    metric: 'Saltos totales',
    what: 'Coordinación de pies y resistencia.',
    steps: [
      'Cuenta tus saltos seguidos.',
      'Pulsa +1 por cada salto o anota el total.',
      '3 sets de hasta 30 saltos.'
    ],
    why: 'El juego de pies del saltador es el del regateador en velocidad.',
    safetyNote: 'Usa zapatillas con buena amortiguación y salta en un suelo despejado.'
  },
  {
    id: 'dom',
    em: '⚽',
    t: 'Dominadas de Balón',
    sk: 'Toque y control',
    mode: 'streak',
    sets: 3,
    metric: 'Mejor racha',
    what: 'Toque y control del balón.',
    steps: [
      'Haz toques sin que caiga el balón al suelo.',
      'Pulsa +1 por cada toque conseguido.',
      'Si cae, pulsa "Se cayó" y anota tu mejor racha.'
    ],
    why: 'Cada toque es un control orientado perfecto en el partido oficial.',
    safetyNote: 'Ten cuidado con objetos frágiles en casa; si es posible, entrena en un patio o jardín.'
  },
  {
    id: 'pared',
    em: '🧱',
    t: 'Pared de Pases',
    sk: 'Pase y pie malo',
    mode: 'count',
    sets: 3,
    target: 20,
    metric: 'Pases totales',
    what: 'Pase preciso y pie no dominante.',
    steps: [
      'Pases continuos contra la pared a 2 metros.',
      'Set 1: pie dominante. Set 2: alternando. Set 3: pie no dominante.',
      '+1 por pase controlado.'
    ],
    why: 'La pared es el mejor compañero de entrenamiento para ganar precisión.',
    safetyNote: 'Usa un balón blando o de entrenamiento y una pared sólida sin enchufes ni cuadros.'
  },
  {
    id: 'punt',
    em: '🎯',
    t: 'Puntería al Cono',
    sk: 'Precisión de pase',
    mode: 'count',
    sets: 2,
    target: 10,
    metric: 'Aciertos totales',
    what: 'Precisión de pase a distancia.',
    steps: [
      'Coloca 3 conos o botellas a 3-5 pasos de distancia.',
      '10 pases por set intentando derribar o tocar el objetivo.',
      'Pulsa +1 por cada acierto directo.'
    ],
    why: 'Un pase medido al espacio vale un gol en situaciones de partido.',
    safetyNote: 'Usa botellas de plástico vacías o conos blandos para no romper nada.'
  },
  {
    id: 'crp',
    em: '🤹',
    t: 'Cabeza-Rodilla-Pie',
    sk: 'Coordinación',
    mode: 'streak',
    sets: 3,
    metric: 'Mejor racha',
    what: 'Coordinación cabeza-rodilla-pie.',
    steps: [
      'Toca con cabeza, luego rodilla y luego pie sin que el balón caiga.',
      'Cada ciclo completo de 3 partes suma +1.',
      'Anota tu racha máxima de ciclos continuos.'
    ],
    why: 'La coordinación segmentaria es la base de la técnica depurada.',
    safetyNote: 'Espacio despejado con techo alto o al aire libre.'
  },
  {
    id: 'esc',
    em: '🏃',
    t: 'Escalera de Coordinación',
    sk: 'Frecuencia de pies',
    mode: 'timer',
    sets: 3,
    seg: 30,
    metric: 'Sets superados',
    what: 'Apoyos rápidos y frecuencia motriz.',
    steps: [
      'Usa las líneas de baldosas, cinta de carrocero o una escalera en el suelo.',
      'Realiza el patrón de apoyos durante el tiempo establecido.',
      'Confirma al terminar cada set.'
    ],
    why: 'Los apoyos rápidos y precisos permiten anticiparse y ganar todos los duelos.',
    safetyNote: 'Asegúrate de que la superficie no sea resbaladiza.'
  },
  {
    id: 'reg',
    em: '🥅',
    t: 'Slalom de Regates',
    sk: 'Conducción',
    mode: 'timer',
    sets: 3,
    seg: 40,
    metric: 'Sets superados',
    what: 'Conducción con obstáculos y cambio de ritmo.',
    steps: [
      'Coloca 5 objetos o conos en línea recta separados 1 metro.',
      'Conduce en slalom ida y vuelta durante el tiempo.',
      'Confirma al terminar el set.'
    ],
    why: 'El regate en espacios reducidos abre defensas cerradas.',
    safetyNote: 'Retira cualquier obstáculo alrededor del recorrido.'
  }
];

export default RETOS_CATALOG;
