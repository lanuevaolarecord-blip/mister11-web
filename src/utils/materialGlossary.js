/**
 * src/utils/materialGlossary.js
 * MÍSTER11 — Glosario Cerrado de Material y Equipamiento (Carril A Canónico)
 * 
 * Centraliza la resolución de equipamiento deportivo entre el Portal, Fichas y PDF.
 * Cumple la regla de Carril A: una clave canónica 'mat.*' por pieza de material,
 * idéntica en todas las superficies y traducida una sola vez por lengua.
 */

export const MATERIAL_GLOSSARY_MAP = {
  // Mancuernas / Pesas
  'mancuerna': 'mat.dumbbell',
  'mancuernas': 'mat.dumbbell',
  'dumbbell': 'mat.dumbbell',
  'dumbbells': 'mat.dumbbell',
  'haltere': 'mat.dumbbell',
  'halteres': 'mat.dumbbell',
  'haltère': 'mat.dumbbell',
  'haltères': 'mat.dumbbell',
  'dumbel': 'mat.dumbbell',

  // Banco nórdico
  'banco nórdico': 'mat.nordic_bench',
  'banco nordico': 'mat.nordic_bench',
  'nordic bench': 'mat.nordic_bench',
  'banc nordique': 'mat.nordic_bench',
  'bangku nordik': 'mat.nordic_bench',
  'banco': 'mat.nordic_bench',

  // Correas / Tiras
  'correas': 'mat.straps',
  'correa': 'mat.straps',
  'straps': 'mat.straps',
  'strap': 'mat.straps',
  'tiras': 'mat.straps',
  'tira': 'mat.straps',
  'sangles': 'mat.straps',
  'sangle': 'mat.straps',
  'tali pengikat': 'mat.straps',

  // Conos
  'conos': 'mat.cones',
  'cono': 'mat.cones',
  'cones': 'mat.cones',
  'cone': 'mat.cones',
  'cônes': 'mat.cones',
  'cône': 'mat.cones',
  'kerucut': 'mat.cones',

  // Sofá
  'sofá': 'mat.sofa',
  'sofa': 'mat.sofa',
  'canapé': 'mat.sofa',

  // Cama pesada
  'cama pesada': 'mat.heavy_bed',
  'heavy bed': 'mat.heavy_bed',
  'lit lourd': 'mat.heavy_bed',
  'tempat tidur kokoh': 'mat.heavy_bed',

  // Compañero / Sujeción
  'tobillos sujetos por compañero': 'mat.partner_hold',
  'ankles held by partner': 'mat.partner_hold',
  'tornozelos seguros por parceiro': 'mat.partner_hold',
  'chevilles tenues par un partenaire': 'mat.partner_hold',
  'pergelangan kaki ditahan oleh rekan': 'mat.partner_hold',

  // Peso corporal / Suelo
  'peso corporal': 'mat.bodyweight',
  'peso_corporal': 'mat.bodyweight',
  'bodyweight': 'mat.bodyweight',
  'poids du corps': 'mat.bodyweight',
  'berat badan': 'mat.bodyweight',

  // Colchoneta / Esterilla
  'colchoneta': 'mat.mat',
  'colchonete': 'mat.mat',
  'suelo': 'mat.mat',
  'exercise mat': 'mat.mat',
  'tapis': 'mat.mat',
  'matras': 'mat.mat',

  // Pared
  'pared': 'mat.wall',
  'wall': 'mat.wall',
  'parede': 'mat.wall',
  'mur': 'mat.wall',
  'dinding': 'mat.wall',

  // Silla
  'silla estable': 'mat.chair',
  'silla_estable': 'mat.chair',
  'silla': 'mat.chair',
  'stable chair': 'mat.chair',
  'chair': 'mat.chair',
  'cadeira estável': 'mat.chair',
  'cadeira': 'mat.chair',
  'chaise stable': 'mat.chair',
  'chaise': 'mat.chair',
  'kursi stabil': 'mat.chair',
  'kursi': 'mat.chair',

  // Toalla
  'toalla': 'mat.towel',
  'toalha': 'mat.towel',
  'towel': 'mat.towel',
  'serviette': 'mat.towel',
  'handuk': 'mat.towel',

  // Balones
  'balones': 'mat.balls',
  'balón': 'mat.balls',
  'balon': 'mat.balls',
  'bolas': 'mat.balls',
  'bola': 'mat.balls',
  'balls': 'mat.balls',
  'ball': 'mat.balls',
  'ballons': 'mat.balls',
  'ballon': 'mat.balls',

  // Vallas
  'vallas': 'mat.hurdles',
  'valla': 'mat.hurdles',
  'barreiras': 'mat.hurdles',
  'barreira': 'mat.hurdles',
  'hurdles': 'mat.hurdles',
  'hurdle': 'mat.hurdles',
  'haies': 'mat.hurdles',
  'haie': 'mat.hurdles',
  'rintangan': 'mat.hurdles',

  // Escalera de agilidad
  'escalera de agilidad': 'mat.ladder',
  'escalera': 'mat.ladder',
  'escada de agilidade': 'mat.ladder',
  'escada': 'mat.ladder',
  'agility ladder': 'mat.ladder',
  'ladder': 'mat.ladder',
  'échelle de rythme': 'mat.ladder',
  'tangga ketangkasan': 'mat.ladder',

  // Petos / Chalecos
  'petos': 'mat.bibs',
  'peto': 'mat.bibs',
  'coletes': 'mat.bibs',
  'colete': 'mat.bibs',
  'bibs': 'mat.bibs',
  'bib': 'mat.bibs',
  'chasubles': 'mat.bibs',
  'chasuble': 'mat.bibs',
  'rompi': 'mat.bibs',

  // Porterías / Goles
  'porterías': 'mat.goals',
  'portería': 'mat.goals',
  'gols': 'mat.goals',
  'gol': 'mat.goals',
  'goals': 'mat.goals',
  'goal': 'mat.goals',
  'buts': 'mat.goals',
  'but': 'mat.goals',
  'gawang': 'mat.goals',

  // Aros
  'aros': 'mat.rings',
  'aro': 'mat.rings',
  'rings': 'mat.rings',
  'ring': 'mat.rings',
  'cerceaux': 'mat.rings',
  'cerceau': 'mat.rings',
  'gelang-gelang': 'mat.rings',

  // Sin material
  'sin equipamiento': 'mat.none',
  'sin material': 'mat.none',
  'sem equipamento': 'mat.none',
  'no equipment': 'mat.none',
  'sans équipement': 'mat.none',
  'tanpa peralatan': 'mat.none'
};

/**
 * Traduce una lista o string de equipamiento usando el glosario cerrado 'mat.*'.
 * @param {string|string[]} mat Equipamiento como string ("Banco nórdico, correas") o array.
 * @param {Function} t Función de traducción i18n.
 * @returns {string} String con el equipamiento localizado.
 */
export function localizeMaterial(mat, t) {
  if (!mat) return '';
  if (Array.isArray(mat)) {
    return mat.map(m => localizeMaterial(m, t)).filter(Boolean).join(', ');
  }
  const parts = String(mat).split(',').map(s => s.trim()).filter(Boolean);
  return parts.map(part => {
    const norm = part.toLowerCase().replace(/_/g, ' ');
    const key = MATERIAL_GLOSSARY_MAP[norm];
    if (key && typeof t === 'function') {
      const translated = t(key);
      if (translated && translated !== key) return translated;
    }
    return part;
  }).join(', ');
}
