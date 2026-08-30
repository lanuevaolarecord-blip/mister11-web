/**
 * MOTOR DE CORRECCIÓN ORTOGRÁFICA MULTILINGÜE - MÍSTER11
 * 
 * Proporciona detección en tiempo real de faltas ortográficas y errores tipográficos
 * adaptados al idioma del usuario (Español / Inglés), con soporte de léxico deportivo,
 * fútbol, táctica, entrenamiento y notas del entrenador.
 */

// ── LÉXICO ESPECIALIZADO DE FÚTBOL Y GESTIÓN DEPORTIVA (ESPAÑOL) ──
const FOOTBALL_LEXICON_ES = [
  'míster', 'mister', 'fútbol', 'futbol', 'táctica', 'táctico', 'tácticos', 'tácticas',
  'técnica', 'técnico', 'técnicos', 'técnicas', 'físico', 'física', 'físicos', 'físicas',
  'psicológico', 'psicológica', 'psicodeportivo', 'mental', 'balón', 'pelota', 'córner',
  'penalti', 'penal', 'portería', 'portero', 'guardameta', 'arquero', 'remate', 'disparo',
  'tiro', 'desmarque', 'repliegue', 'presión', 'basculación', 'posesión', 'conducción',
  'pase', 'pases', 'centro', 'centros', 'volea', 'regate', 'regateador', 'zaguero',
  'mediocentro', 'mediapunta', 'extremo', 'carrilero', 'delantero', 'lateral', 'pivote',
  'defensa', 'defensas', 'defensivo', 'defensiva', 'ataque', 'ofensivo', 'ofensiva',
  'contragolpe', 'contraataque', 'transición', 'transiciones', 'fuera de juego',
  'fuera de banda', 'tarjeta', 'amarilla', 'roja', 'árbitro', 'árbitros', 'alineación',
  'alineaciones', 'convocatoria', 'convocatorias', 'calentamiento', 'estiramiento',
  'recuperación', 'sesión', 'sesiones', 'entrenamiento', 'entrenamientos', 'entrenador',
  'entrenadores', 'ejercicio', 'ejercicios', 'consigna', 'consignas', 'objetivo',
  'objetivos', 'variante', 'variantes', 'intervalo', 'intensidad', 'carga', 'fatiga',
  'asistencia', 'asistencias', 'minuto', 'minutos', 'sustitución', 'sustituciones',
  'suplente', 'suplentes', 'titular', 'titulares', 'vestuario', 'charla', 'estrategia',
  'estrategias', 'rendimiento', 'partido', 'partidos', 'rival', 'rivales', 'campeonato',
  'liga', 'torneo', 'plantilla', 'jugador', 'jugadores', 'futbolista', 'futbolistas',
  'capitán', 'brazalete', 'lesión', 'lesionado', 'recuperado', 'rehabilitación',
  'fisioterapeuta', 'fisio', 'asistente', 'cuerpo técnico', 'staff', 'victoria',
  'derrota', 'empate', 'goles', 'gol', 'marcador', 'resultado', 'duelo', 'duelos',
  'aéreo', 'terrestre', 'bloque', 'alto', 'medio', 'bajo', 'amplitud', 'profundidad',
  'línea', 'líneas', 'zona', 'zonas', 'interlineal', 'marca', 'marcaje', 'individual',
  'mixto', 'colectivo', 'espacio', 'espacios', 'balón parado', 'estrategia a balón parado',
  'saque', 'saques', 'esquina', 'falta', 'faltas', 'barrera', 'directo', 'indirecto'
];

// ── CORRECCIONES DIRECTAS DE ERRORES FRECUENTES (ESPAÑOL) ──
const COMMON_TYPOS_MAP_ES = {
  // Errores tipográficos / fonéticos frecuentes
  'entreador': 'entrenador',
  'entreadores': 'entrenadores',
  'entrenamieto': 'entrenamiento',
  'entrenamietos': 'entrenamientos',
  'ejersicio': 'ejercicio',
  'ejersicios': 'ejercicios',
  'huviera': 'hubiera',
  'ubiera': 'hubiera',
  'huviese': 'hubiese',
  'ablar': 'hablar',
  'acia': 'hacia',
  'haci': 'hacia',
  'asi': 'así',
  'aqui': 'aquí',
  'ahi': 'ahí',
  'tambien': 'también',
  'ademas': 'además',
  'despues': 'después',
  'mas': 'más',
  'ningun': 'ningún',
  'algun': 'algún',
  'segun': 'según',
  'echos': 'hechos',
  'echo': 'hecho',
  'atravez': 'a través',
  'nesesario': 'necesario',
  'nesesita': 'necesita',
  'nesesitan': 'necesitan',
  'posision': 'posición',
  'posesion': 'posesión',
  'conducsion': 'conducción',
  'defenza': 'defensa',
  'defensas': 'defensas',
  'defensibo': 'defensivo',
  'ofensibo': 'ofensivo',
  'correcion': 'corrección',
  'correciones': 'correcciones',
  'outocorrector': 'autocorrector',
  'autocorector': 'autocorrector',
  'manualmenete': 'manualmente',
  'manuallmente': 'manualmente',
  'verda': 'verde',
  'desicion': 'decisión',
  'desisiones': 'decisiones',
  'linea': 'línea',
  'lineas': 'líneas',
  'balon': 'balón',
  'balones': 'balones',
  'corner': 'córner',
  'tactica': 'táctica',
  'tacticas': 'tácticas',
  'tactico': 'táctico',
  'tacticos': 'tácticos',
  'tecnica': 'técnica',
  'tecnicas': 'técnicas',
  'tecnico': 'técnico',
  'tecnicos': 'técnicos',
  'fisico': 'físico',
  'fisica': 'física',
  'porteria': 'portería',
  'presion': 'presión',
  'recuperacion': 'recuperación',
  'sesion': 'sesión',
  'sesiones': 'sesiones',
  'alineacion': 'alineación',
  'alineaciones': 'alineaciones',
  'sustitucion': 'sustitución',
  'lesion': 'lesión',
  'lesiones': 'lesiones',
  'capitan': 'capitán',
  'arbitro': 'árbitro',
  'arbitros': 'árbitros',
  'area': 'área',
  'areas': 'áreas',
  'partisipacion': 'participación',
  'procceso': 'proceso',
  'acsentuar': 'acentuar',
  'jugador': 'jugador',
  'jugadores': 'jugadores',
  'conforma': 'confirma',
  'conforme': 'confirme'
};

// ── LÉXICO ESPECIALIZADO DE FÚTBOL Y GESTIÓN (INGLÉS) ──
const FOOTBALL_LEXICON_EN = [
  'coach', 'mister', 'manager', 'football', 'soccer', 'tactics', 'tactical',
  'technique', 'technical', 'physical', 'fitness', 'mental', 'psychological',
  'ball', 'possession', 'corner', 'penalty', 'goal', 'goalkeeper', 'keeper',
  'shot', 'strike', 'striker', 'finish', 'finishing', 'unmarking', 'retreat',
  'press', 'pressing', 'shift', 'shifting', 'dribble', 'dribbling', 'pass',
  'passes', 'passing', 'cross', 'crosses', 'crossing', 'volley', 'defender',
  'defenders', 'defense', 'defensive', 'attack', 'attacking', 'offensive',
  'counterattack', 'transition', 'transitions', 'offside', 'throw-in', 'card',
  'yellow', 'red', 'referee', 'lineup', 'lineups', 'squad', 'callup', 'warmup',
  'stretching', 'cooldown', 'recovery', 'session', 'sessions', 'training',
  'drill', 'drills', 'exercise', 'exercises', 'instruction', 'instructions',
  'objective', 'objectives', 'variant', 'variants', 'interval', 'intensity',
  'load', 'workload', 'fatigue', 'attendance', 'minute', 'minutes', 'substitution',
  'substitute', 'starter', 'locker room', 'dressing room', 'talk', 'speech',
  'strategy', 'performance', 'match', 'matches', 'game', 'games', 'rival',
  'opponent', 'opponents', 'championship', 'league', 'tournament', 'player',
  'players', 'captain', 'armband', 'injury', 'injured', 'recovery', 'physio',
  'staff', 'win', 'defeat', 'draw', 'tie', 'score', 'scoreline', 'result',
  'aerial', 'ground', 'block', 'high', 'mid', 'low', 'width', 'depth', 'line',
  'lines', 'zone', 'zones', 'marking', 'man-to-man', 'zonal', 'space', 'spaces',
  'set piece', 'free kick', 'wall', 'direct', 'indirect'
];

// ── CORRECCIONES DIRECTAS DE ERRORES FRECUENTES (INGLÉS) ──
const COMMON_TYPOS_MAP_EN = {
  'coch': 'coach',
  'coaches': 'coaches',
  'traing': 'training',
  'trainning': 'training',
  'exersise': 'exercise',
  'exersices': 'exercises',
  'taktics': 'tactics',
  'tactiks': 'tactics',
  'oppenent': 'opponent',
  'oponent': 'opponent',
  'goalkeepr': 'goalkeeper',
  'stryker': 'striker',
  'defencive': 'defensive',
  'offencive': 'offensive',
  'possesion': 'possession',
  'refeere': 'referee',
  'subtitution': 'substitution',
  'linup': 'lineup',
  'atendance': 'attendance',
  'intesity': 'intensity',
  'injuried': 'injured',
  'penality': 'penalty',
  'coner': 'corner'
};

// ── PALABRAS COMUNES / CONECTORES EN ESPAÑOL ──
const COMMON_WORDS_ES = new Set([
  'a', 'al', 'algo', 'algunos', 'algunas', 'ante', 'antes', 'aquel', 'aquella',
  'aquello', 'aquí', 'arriba', 'así', 'atrás', 'aún', 'bajo', 'bien', 'buen',
  'bueno', 'buena', 'cada', 'campo', 'casi', 'cerca', 'claro', 'como', 'con',
  'contra', 'cual', 'cuándo', 'cuanto', 'de', 'del', 'desde', 'donde', 'dónde',
  'dos', 'durante', 'e', 'el', 'ella', 'ellas', 'ellos', 'en', 'encima', 'entonces',
  'entre', 'era', 'eran', 'es', 'esa', 'ese', 'eso', 'está', 'estaba', 'estado',
  'están', 'estar', 'estas', 'este', 'estos', 'fin', 'fue', 'fueron', 'ha', 'había',
  'hacer', 'hacia', 'hasta', 'hay', 'haya', 'hoy', 'la', 'las', 'le', 'les', 'lo',
  'los', 'luego', 'más', 'me', 'medio', 'mejor', 'menos', 'mi', 'mientras', 'mis',
  'mismo', 'muy', 'nada', 'ni', 'no', 'nos', 'nuestro', 'nuestra', 'o', 'otra',
  'otro', 'para', 'parte', 'pero', 'por', 'porque', 'por qué', 'primer', 'primero',
  'primera', 'que', 'qué', 'quien', 'quién', 'se', 'según', 'ser', 'si', 'sí',
  'siempre', 'sin', 'sino', 'sobre', 'solo', 'sólo', 'somos', 'son', 'su', 'sus',
  'tal', 'también', 'tampoco', 'tan', 'tanto', 'tarde', 'te', 'tiempo', 'tiene',
  'tienen', 'todo', 'todos', 'toda', 'todas', 'tras', 'tres', 'tu', 'tus', 'un',
  'una', 'unas', 'uno', 'unos', 'va', 'vamos', 'van', 'vez', 'veces', 'ya', 'yo',
  // Palabras futbolísticas
  ...FOOTBALL_LEXICON_ES,
  ...Object.values(COMMON_TYPOS_MAP_ES)
]);

// ── PALABRAS COMUNES / CONECTORES EN INGLÉS ──
const COMMON_WORDS_EN = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  // Football words
  ...FOOTBALL_LEXICON_EN,
  ...Object.values(COMMON_TYPOS_MAP_EN)
]);

/**
 * Calcula la distancia de Levenshtein entre dos cadenas
 */
export const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j] + 1      // eliminación
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Normaliza una palabra para comparación básica (sin acentos, minúsculas)
 */
export const stripAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/**
 * Obtiene hasta N sugerencias ortográficas para una palabra errónea
 */
export const getSpellingSuggestions = (rawWord, lang = 'es', limit = 3) => {
  if (!rawWord || rawWord.length < 2) return [];

  const lowerWord = rawWord.toLowerCase();
  const isEn = lang === 'en';
  const typoMap = isEn ? COMMON_TYPOS_MAP_EN : COMMON_TYPOS_MAP_ES;
  const dictionary = isEn ? COMMON_WORDS_EN : COMMON_WORDS_ES;

  // 1. Coincidencia directa en mapa de errores comunes
  if (typoMap[lowerWord]) {
    return [typoMap[lowerWord]];
  }

  // 2. Comprobar si falta acento ortográfico en español
  if (!isEn) {
    const unaccented = stripAccents(lowerWord);
    const accentedMatch = Array.from(dictionary).find(w => stripAccents(w) === unaccented && w !== lowerWord);
    if (accentedMatch) {
      return [accentedMatch];
    }
  }

  // 3. Búsqueda por distancia Levenshtein
  const scored = [];
  dictionary.forEach(dictWord => {
    // Si la longitud difiere en más de 2 caracteres, omitir para rendimiento
    if (Math.abs(dictWord.length - lowerWord.length) > 2) return;

    const dist = levenshteinDistance(lowerWord, dictWord.toLowerCase());
    if (dist <= 2) {
      scored.push({ word: dictWord, dist });
    }
  });

  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, limit).map(item => item.word);
};

/**
 * Analiza un texto completo y devuelve la lista de errores ortográficos con posición y sugerencias
 * @param {string} text - Texto ingresado por el entrenador
 * @param {string} lang - 'es' o 'en'
 * @returns {Array} Array de { word, start, end, suggestions }
 */
export const checkTextSpelling = (text, lang = 'es') => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return [];

  const isEn = lang === 'en';
  const dictionary = isEn ? COMMON_WORDS_EN : COMMON_WORDS_ES;
  const typoMap = isEn ? COMMON_TYPOS_MAP_EN : COMMON_TYPOS_MAP_ES;

  // Expresión regular para separar palabras (conservando índices)
  // Soporta caracteres en español (á, é, í, ó, ú, ñ, ü)
  const wordRegex = /[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9_'-]+/g;
  const errors = [];
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    const rawWord = match[0];
    const start = match.index;
    const end = start + rawWord.length;

    // Omitir números puros, abreviaturas de 1 letra o IDs técnicos
    if (/^\d+$/.test(rawWord) || rawWord.length < 2 || rawWord.includes('_')) continue;

    const lower = rawWord.toLowerCase();

    // 1. ¿Es un error conocido en el mapa de errores frecuentes?
    if (typoMap[lower]) {
      const suggestions = getSpellingSuggestions(rawWord, lang);
      errors.push({
        word: rawWord,
        start,
        end,
        suggestions: suggestions.length > 0 ? suggestions : [typoMap[lower]],
        reason: 'typo'
      });
      continue;
    }

    // 2. ¿Existe en el diccionario oficial?
    if (dictionary.has(lower)) {
      continue;
    }

    // 3. ¿Falta tilde obligatoria en español?
    if (!isEn) {
      const unaccented = stripAccents(lower);
      const accentedMatch = Array.from(dictionary).find(w => stripAccents(w) === unaccented && w !== lower);
      if (accentedMatch) {
        errors.push({
          word: rawWord,
          start,
          end,
          suggestions: [accentedMatch],
          reason: 'accent'
        });
        continue;
      }
    }

    // 4. Si tiene más de 3 caracteres y no está en el diccionario, buscar sugerencias
    if (rawWord.length >= 3) {
      const suggestions = getSpellingSuggestions(rawWord, lang);
      if (suggestions.length > 0) {
        errors.push({
          word: rawWord,
          start,
          end,
          suggestions,
          reason: 'misspelled'
        });
      }
    }
  }

  return errors;
};

/**
 * Aplica una sugerencia ortográfica reemplazando la palabra errónea en el texto
 */
export const applySpellingCorrection = (text, errorObj, chosenSuggestion) => {
  if (!text || !errorObj || !chosenSuggestion) return text;
  
  // Preservar mayúscula inicial si la palabra original la tenía
  let replacement = chosenSuggestion;
  if (errorObj.word && errorObj.word[0] === errorObj.word[0].toUpperCase() && errorObj.word[0] !== errorObj.word[0].toLowerCase()) {
    replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  const before = text.substring(0, errorObj.start);
  const after = text.substring(errorObj.end);
  return before + replacement + after;
};
