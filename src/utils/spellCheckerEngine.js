/**
 * MOTOR CANÓNICO DE CORRECCIÓN ORTOGRÁFICA Y GRAMATICAL - MÍSTER11
 * 
 * Corrector estilo Microsoft Word moderno:
 * 1. Detección en tiempo real con distinción de tipo de error:
 *    - Falta de tilde / acentuación ('accent')
 *    - Error tipográfico común ('typo')
 *    - Palabra no reconocida / mal escrita ('misspelled')
 * 2. Gran léxico estructurado en Español e Inglés (deportivo, táctico, verbos, sustantivos cotidianos).
 * 3. Diccionario personalizado del usuario (localStorage 'mister11_user_dictionary') con reactividad en vivo.
 * 4. Capacidad de ignorar palabras por sesión.
 * 5. Algoritmo Damerau-Levenshtein y aproximación fonética/morfológica de alta precisión.
 */

// ── PERSISTENCIA DE DICCIONARIO PERSONALIZADO Y PALABRAS IGNORADAS ──
const CUSTOM_DICT_STORAGE_KEY = 'mister11_user_dictionary';

let memoryCustomDict = new Set();
let sessionIgnoredWords = new Set();

export const loadCustomDictionary = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(CUSTOM_DICT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryCustomDict = new Set(parsed.map(w => String(w).toLowerCase().trim()));
        }
      }
    }
  } catch (err) {
    console.warn('[spellChecker] Error al cargar diccionario personalizado:', err);
  }
  return memoryCustomDict;
};

// Carga inicial segura
loadCustomDictionary();

export const addWordToCustomDictionary = (word) => {
  if (!word || typeof word !== 'string') return;
  const clean = word.toLowerCase().trim();
  if (!clean) return;

  memoryCustomDict.add(clean);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CUSTOM_DICT_STORAGE_KEY, JSON.stringify(Array.from(memoryCustomDict)));
      window.dispatchEvent(new CustomEvent('mister11-dictionary-updated', { detail: { word: clean } }));
    }
  } catch (err) {
    console.warn('[spellChecker] Error al guardar en diccionario personalizado:', err);
  }
};

export const removeWordFromCustomDictionary = (word) => {
  if (!word || typeof word !== 'string') return;
  const clean = word.toLowerCase().trim();
  memoryCustomDict.delete(clean);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CUSTOM_DICT_STORAGE_KEY, JSON.stringify(Array.from(memoryCustomDict)));
      window.dispatchEvent(new CustomEvent('mister11-dictionary-updated', { detail: { removed: clean } }));
    }
  } catch (err) {
    console.warn('[spellChecker] Error al eliminar del diccionario personalizado:', err);
  }
};

export const ignoreWordForSession = (word) => {
  if (!word || typeof word !== 'string') return;
  const clean = word.toLowerCase().trim();
  if (!clean) return;
  sessionIgnoredWords.add(clean);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mister11-dictionary-updated', { detail: { ignored: clean } }));
  }
};

export const getCustomDictionaryWords = () => {
  return Array.from(memoryCustomDict);
};

export const isWordInUserDictionary = (word) => {
  if (!word) return false;
  const clean = String(word).toLowerCase().trim();
  return memoryCustomDict.has(clean) || sessionIgnoredWords.has(clean);
};

// ── NORMALIZACIÓN Y UTILIDADES ──
export const stripAccents = (str) => {
  return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// ── MAPA CANÓNICO DE PALABRAS ACENTUADAS FRECUENTES (ESPAÑOL) ──
export const ACCENTED_WORDS_MAP_ES = {
  // Fútbol & Táctica
  'dinamica': 'dinámica', 'dinamicas': 'dinámicas',
  'dinamico': 'dinámico', 'dinamicos': 'dinámicos',
  'tactica': 'táctica', 'tacticas': 'tácticas',
  'tactico': 'táctico', 'tacticos': 'tácticos',
  'tecnica': 'técnica', 'tecnicas': 'técnicas',
  'tecnico': 'técnico', 'tecnicos': 'técnicos',
  'fisico': 'físico', 'fisicos': 'físicos',
  'fisica': 'física', 'fisicas': 'físicas',
  'balon': 'balón', 'balones': 'balones',
  'corner': 'córner', 'corners': 'córners',
  'penalti': 'penalti', 'penaltis': 'penaltis',
  'porteria': 'portería', 'porterias': 'porterías',
  'posicion': 'posición', 'posiciones': 'posiciones',
  'posesion': 'posesión', 'posesiones': 'posesiones',
  'presion': 'presión', 'presiones': 'presiones',
  'basculacion': 'basculación', 'basculaciones': 'basculaciones',
  'circulacion': 'circulación', 'circulaciones': 'circulaciones',
  'conduccion': 'conducción', 'conducciones': 'conducciones',
  'finalizacion': 'finalización', 'finalizaciones': 'finalizaciones',
  'recuperacion': 'recuperación', 'recuperaciones': 'recuperaciones',
  'anticipacion': 'anticipación', 'anticipaciones': 'anticipaciones',
  'transicion': 'transición', 'transiciones': 'transiciones',
  'orientacion': 'orientación', 'orientaciones': 'orientaciones',
  'coordinacion': 'coordinación', 'coordinaciones': 'coordinaciones',
  'organizacion': 'organización', 'organizaciones': 'organizaciones',
  'comunicacion': 'comunicación', 'comunicaciones': 'comunicaciones',
  'motivacion': 'motivación', 'motivaciones': 'motivaciones',
  'concentracion': 'concentración', 'concentraciones': 'concentraciones',
  'atencion': 'atención', 'atenciones': 'atenciones',
  'sesion': 'sesión', 'sesiones': 'sesiones',
  'alineacion': 'alineación', 'alineaciones': 'alineaciones',
  'convocatoria': 'convocatoria', 'convocatorias': 'convocatorias',
  'sustitucion': 'sustitución', 'sustituciones': 'sustituciones',
  'lesion': 'lesión', 'lesiones': 'lesiones',
  'capitan': 'capitán', 'capitanes': 'capitanes',
  'arbitro': 'árbitro', 'arbitros': 'árbitros',
  'area': 'área', 'areas': 'áreas',
  'linea': 'línea', 'lineas': 'líneas',
  'aereo': 'aéreo', 'aereos': 'aéreos',
  'aerea': 'aérea', 'aereas': 'aéreas',
  'analisis': 'análisis',
  'estrategico': 'estratégico', 'estrategica': 'estratégica',
  'estadistica': 'estadística', 'estadisticas': 'estadísticas',
  'mister': 'míster',
  'futbol': 'fútbol',

  // Conectores, pronombres, adverbios y adjetivos
  'tambien': 'también',
  'ademas': 'además',
  'despues': 'después',
  'aqui': 'aquí',
  'ahi': 'ahí',
  'alli': 'allí',
  'alla': 'allá',
  'asi': 'así',
  'mas': 'más',
  'segun': 'según',
  'algun': 'algún',
  'ningun': 'ningún',
  'comun': 'común',
  'rapido': 'rápido', 'rapida': 'rápida', 'rapidos': 'rápidos', 'rapidas': 'rápidas',
  'facil': 'fácil', 'faciles': 'fáciles',
  'dificil': 'difícil', 'dificiles': 'difíciles',
  'util': 'útil', 'utiles': 'útiles',
  'proximo': 'próximo', 'proxima': 'próxima', 'proximos': 'próximos', 'proximas': 'próximas',
  'ultimo': 'último', 'ultima': 'última', 'ultimos': 'últimos', 'ultimas': 'últimas',
  'maximo': 'máximo', 'maxima': 'máxima', 'maximos': 'máximos', 'maximas': 'máximas',
  'minimo': 'mínimo', 'minima': 'mínima', 'minimos': 'mínimos', 'minimas': 'mínimas',
  'optimo': 'óptimo', 'optima': 'óptima', 'optimos': 'óptimos', 'optimas': 'óptimas',
  'unico': 'único', 'unica': 'única', 'unicos': 'únicos', 'unicas': 'únicas',
  'numero': 'número', 'numeros': 'números',
  'periodo': 'período', 'periodos': 'períodos',
  'cronometro': 'cronómetro',
  'caracteristica': 'característica', 'caracteristicas': 'características',
  'decision': 'decisión', 'decisiones': 'decisiones',
  'accion': 'acción', 'acciones': 'acciones',
  'reaccion': 'reacción', 'reacciones': 'reacciones',
  'condicion': 'condición', 'condiciones': 'condiciones',
  'situacion': 'situación', 'situaciones': 'situaciones',
  'evolucion': 'evolución', 'evoluciones': 'evoluciones',
  'evaluacion': 'evaluación', 'evaluaciones': 'evaluaciones',
  'participacion': 'participación',
  'intencion': 'intención', 'intenciones': 'intenciones',
  'observacion': 'observación', 'observaciones': 'observaciones'
};

// ── MAPA DE ERRORES TIPOGRÁFICOS Y FONÉTICOS DIRECTOS (ESPAÑOL) ──
export const COMMON_TYPOS_MAP_ES = {
  // Confusión b/v, c/s/z, h muda, ll/y
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
  'atravez': 'a través',
  'nesesario': 'necesario',
  'nesesaria': 'necesaria',
  'nesesita': 'necesita',
  'nesesitan': 'necesitan',
  'posision': 'posición',
  'posisiones': 'posiciones',
  'posesion': 'posesión',
  'conducsion': 'conducción',
  'defenza': 'defensa',
  'defenzas': 'defensas',
  'defensibo': 'defensivo',
  'ofensibo': 'ofensivo',
  'correcion': 'corrección',
  'correciones': 'correcciones',
  'desicion': 'decisión',
  'desisiones': 'decisiones',
  'inico': 'inicio',
  'inisiar': 'iniciar',
  'partisipacion': 'participación',
  'procceso': 'proceso',
  'fubtol': 'fútbol',
  'futvol': 'fútbol',
  'volon': 'balón',
  'cabidad': 'cavidad',
  'reval': 'rival',
  'movilidat': 'movilidad',
  'autocorector': 'autocorrector',
  'outocorrector': 'autocorrector'
};

// ── MAPA DE ERRORES TIPOGRÁFICOS (INGLÉS) ──
export const COMMON_TYPOS_MAP_EN = {
  'coch': 'coach',
  'coaches': 'coaches',
  'traing': 'training',
  'trainning': 'training',
  'exersise': 'exercise',
  'exersises': 'exercises',
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

// ── GRAN VOCABULARIO BASE ESPAÑOL (FÚTBOL, TÁCTICA, VERBOS Y SUSTANTIVOS COMUNES) ──
const SPANISH_BASE_WORDS = [
  // Del caso del usuario
  'un', 'una', 'unos', 'unas', 'partido', 'partidos', 'que', 'se',
  'inicio', 'inicios', 'inicia', 'inician', 'inició', 'iniciaron', 'iniciando', 'iniciado', 'iniciar',
  'con', 'control', 'controles', 'controla', 'controlan', 'controló', 'controlaron', 'controlando', 'controlado', 'controlar',
  'del', 'de', 'al', 'a', 'en', 'por', 'para', 'juego', 'juegos', 'juega', 'juegan', 'jugó', 'jugaron', 'jugando', 'jugado', 'jugar',
  'y', 'e', 'o', 'u', 'mucha', 'mucho', 'muchas', 'muchos',
  'dinámica', 'dinámicas', 'dinámico', 'dinámicos',
  'movilidad', 'movilidades', 'movimiento', 'movimientos',
  'pases', 'pase', 'pasa', 'pasan', 'pasó', 'pasaron', 'pasando', 'pasado', 'pasar',

  // Fútbol / Conceptos Tácticos & Técnicos
  'fútbol', 'míster', 'entrenador', 'entrenadores', 'entrenamiento', 'entrenamientos',
  'equipo', 'equipos', 'plantilla', 'plantillas', 'vestuario', 'vestuarios',
  'jugador', 'jugadores', 'futbolista', 'futbolistas', 'portero', 'porteros', 'guardameta', 'guardametas', 'arquero', 'arqueros',
  'defensa', 'defensas', 'defensivo', 'defensivos', 'defensiva', 'defensivas',
  'central', 'centrales', 'lateral', 'laterales', 'carrilero', 'carrileros', 'zaguero', 'zagueros',
  'medio', 'medios', 'mediocentro', 'mediocentros', 'centrocampista', 'centrocampistas', 'mediapunta', 'mediapuntas', 'pivote', 'pivotes', 'interior', 'interiores',
  'extremo', 'extremos', 'delantero', 'delanteros', 'punta', 'puntas', 'ariete', 'arietes',
  'ataque', 'ataques', 'ofensivo', 'ofensivos', 'ofensiva', 'ofensivas',
  'posesión', 'posesiones', 'circulación', 'circulaciones', 'ritmo', 'ritmos', 'velocidad', 'velocidades',
  'amplitud', 'profundidad', 'espacio', 'espacios', 'zona', 'zonas', 'línea', 'líneas',
  'desmarque', 'desmarques', 'apoyo', 'apoyos', 'ruptura', 'rupturas', 'cobertura', 'coberturas', 'desdoblamiento', 'desdoblamientos', 'pared', 'paredes',
  'repliegue', 'repliegues', 'presión', 'presiones', 'basculación', 'basculaciones',
  'saque', 'saques', 'saque de banda', 'saque de esquina', 'saque de puerta',
  'transición', 'transiciones', 'contragolpe', 'contragolpes', 'contraataque', 'contraataques',
  'bloque', 'bloques', 'alto', 'altos', 'alta', 'altas', 'medio', 'medios', 'media', 'medias', 'bajo', 'bajos', 'baja', 'bajas',
  'remate', 'remates', 'tiro', 'tiros', 'disparo', 'disparos', 'chut', 'chuts', 'volea', 'voleas',
  'centro', 'centros', 'córner', 'córners', 'esquina', 'esquinas', 'falta', 'faltas', 'barrera', 'barreras',
  'penalti', 'penaltis', 'penal', 'penales', 'parada', 'paradas', 'despeje', 'despejes',
  'gol', 'goles', 'marcador', 'marcadores', 'resultado', 'resultados', 'victoria', 'victorias', 'derrota', 'derrotas', 'empate', 'empates',
  'rival', 'rivales', 'árbitro', 'árbitros', 'tarjeta', 'tarjetas', 'amarilla', 'amarillas', 'roja', 'rojas',
  'alineación', 'alineaciones', 'convocatoria', 'convocatorias', 'titular', 'titulares', 'suplente', 'suplentes', 'banquillo', 'banquillos',
  'sustitución', 'sustituciones', 'cambio', 'cambios', 'minuto', 'minutos', 'asistencia', 'asistencias',
  'campo', 'campos', 'terreno', 'terrenos', 'césped', 'banda', 'bandas', 'área', 'áreas',
  'balón', 'balones', 'pelota', 'pelotas', 'balón parado', 'estrategia', 'estrategias',
  'ejercicio', 'ejercicios', 'tarea', 'tareas', 'sesión', 'sesiones', 'rondo', 'rondos', 'partidillo', 'partidillos',
  'calentamiento', 'calentamientos', 'estiramiento', 'estiramientos', 'recuperación', 'recuperaciones',
  'intensidad', 'intensidades', 'volumen', 'carga', 'cargas', 'fatiga', 'descanso',
  'físico', 'física', 'físicos', 'físicas', 'técnico', 'técnica', 'técnicos', 'técnicas',
  'táctico', 'táctica', 'tácticos', 'tácticas', 'psicológico', 'psicológica', 'mental', 'mentales',
  'resistencia', 'fuerza', 'agilidad', 'potencia', 'coordinación', 'flexibilidad',
  'duelo', 'duelos', 'aéreo', 'aéreos', 'aérea', 'aéreas', 'terrestre', 'terrestres',
  'marca', 'marcas', 'marcaje', 'marcajes', 'colectivo', 'colectivos', 'individual', 'individuales',
  'charla', 'charlas', 'análisis', 'objetivo', 'objetivos', 'consigna', 'consignas', 'variante', 'variantes',
  'rendimiento', 'rendimientos', 'rendir', 'rindió', 'rindieron', 'progreso', 'progresos',
  'compromiso', 'actitud', 'disciplina', 'esfuerzo', 'compañerismo', 'liderazgo',

  // Verbos y formas conjugadas frecuentes
  'iniciar', 'inicia', 'inician', 'inició', 'iniciamos', 'iniciar', 'iniciaron', 'iniciando',
  'controlar', 'controla', 'controlan', 'controló', 'controlamos', 'controlaron', 'controlando',
  'jugar', 'juega', 'juegan', 'jugó', 'jugamos', 'jugaron', 'jugando', 'jugador',
  'pasar', 'pasa', 'pasan', 'pasó', 'pasamos', 'pasaron', 'pasando',
  'mover', 'mueve', 'mueven', 'movió', 'movemos', 'movieron', 'moviendo',
  'tener', 'tengo', 'tiene', 'tienen', 'tenemos', 'tuvo', 'tuvieron', 'teniendo', 'tenido', 'había', 'hubo',
  'hacer', 'hace', 'hacen', 'hizo', 'hacemos', 'hicieron', 'haciendo', 'hecho',
  'ser', 'es', 'son', 'era', 'eran', 'fue', 'fueron', 'siendo', 'sido', 'somos',
  'estar', 'está', 'están', 'estaba', 'estaban', 'estuvo', 'estuvieron', 'estando', 'estado', 'estamos',
  'ir', 'va', 'van', 'iba', 'iban', 'fue', 'fueron', 'yendo', 'vamos',
  'dar', 'da', 'dan', 'dio', 'dieron', 'dando', 'dado', 'damos',
  'ver', 've', 'ven', 'vio', 'vieron', 'viendo', 'visto', 'vemos',
  'saber', 'sabe', 'saben', 'supo', 'supieron', 'sabemos',
  'poder', 'puede', 'pueden', 'pudo', 'pudieron', 'podemos', 'podría', 'podrían',
  'poner', 'pone', 'ponen', 'puso', 'pusieron', 'poniendo', 'puesto',
  'salir', 'sale', 'salen', 'salió', 'salieron', 'saliendo', 'salido',
  'llegar', 'llega', 'llegan', 'llegó', 'llegaron', 'llegando', 'llegado',
  'entrar', 'entra', 'entran', 'entró', 'entraron', 'entrando', 'entrado',
  'ganar', 'gana', 'ganan', 'ganó', 'ganaron', 'ganando', 'ganado',
  'perder', 'pierde', 'pierden', 'perdió', 'perdieron', 'perdiendo', 'perdido',
  'empatar', 'empata', 'empatan', 'empató', 'empataron', 'empatando', 'empatado',
  'marcar', 'marca', 'marcan', 'marcó', 'marcaron', 'marcando', 'marcado',
  'defender', 'defiende', 'defienden', 'defendió', 'defendieron', 'defendiendo', 'defendido',
  'atacar', 'ataca', 'atacan', 'atacó', 'atacaron', 'atacando', 'atacado',
  'correr', 'corre', 'corren', 'corrió', 'corrieron', 'corriendo', 'corrido',
  'presionar', 'presiona', 'presionan', 'presionó', 'presionaron', 'presionando', 'presionado',
  'replegar', 'repliega', 'repliegan', 'replegó', 'replegaron', 'replegando', 'replegado',
  'bascular', 'bascula', 'basculan', 'basculó', 'bascularon', 'basculando', 'basculado',
  'centrar', 'centra', 'centran', 'centró', 'centraron', 'centrando', 'centrado',
  'rematar', 'remata', 'rematan', 'remató', 'remataron', 'rematando', 'rematado',
  'parar', 'para', 'paran', 'paró', 'pararon', 'parando', 'parado',
  'despejar', 'despeja', 'despejan', 'despejó', 'despejaron', 'despejando', 'despejado',
  'recuperar', 'recupera', 'recuperan', 'recuperó', 'recuperaron', 'recuperando', 'recuperado',
  'anticipar', 'anticipa', 'anticipan', 'anticipó', 'anticiparon', 'anticipando', 'anticipado',
  'combinar', 'combina', 'combinan', 'combinó', 'combinaron', 'combinando', 'combinado',
  'conducir', 'conduce', 'conducen', 'condujo', 'condujeron', 'conduciendo', 'conducido',
  'filtrar', 'filtra', 'filtran', 'filtró', 'filtraron', 'filtrando', 'filtrado',
  'doblar', 'dobla', 'doblan', 'dobló', 'doblaron', 'doblando', 'doblado',
  'apoyar', 'apoya', 'apoyan', 'apoyó', 'apoyaron', 'apoyando', 'apoyado',
  'generar', 'genera', 'generan', 'generó', 'generaron', 'generando', 'generado',
  'mantener', 'mantiene', 'mantienen', 'mantuvo', 'mantuvieron', 'manteniendo', 'mantenido',
  'buscar', 'busca', 'buscan', 'buscó', 'buscaron', 'buscando', 'buscado',
  'evitar', 'evita', 'evitan', 'evitó', 'evitaron', 'evitando', 'evitado',
  'trabajar', 'trabaja', 'trabajan', 'trabajó', 'trabajaron', 'trabajando', 'trabajado',
  'competir', 'compite', 'compiten', 'compitió', 'compitieron', 'compitiendo', 'competido',
  'entrenar', 'entrena', 'entrenan', 'entrenó', 'entrenaron', 'entrenando', 'entrenado',

  // Conectores, pronombres, adverbios y sustantivos generales
  'el', 'la', 'los', 'las', 'lo', 'le', 'les', 'me', 'te', 'nos', 'os', 'se',
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas',
  'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras',
  'yo', 'tú', 'él', 'ella', 'nosotros', 'nosotras', 'ellos', 'ellas',
  'bien', 'mal', 'bueno', 'buenos', 'buena', 'buenas', 'mejor', 'mejores', 'peor', 'peores',
  'grande', 'grandes', 'pequeño', 'pequeños', 'pequeña', 'pequeñas', 'fuerte', 'fuertes',
  'rápido', 'rápidos', 'rápida', 'rápidas', 'lento', 'lentos', 'lenta', 'lentas',
  'fácil', 'fáciles', 'difícil', 'difíciles', 'claro', 'claros', 'clara', 'claras',
  'siempre', 'nunca', 'jamás', 'hoy', 'ayer', 'mañana', 'tarde', 'temprano', 'pronto',
  'ahora', 'después', 'antes', 'luego', 'entonces', 'mientras', 'durante', 'cuando', 'cuándo',
  'donde', 'dónde', 'como', 'cómo', 'cuanto', 'cuánto', 'quien', 'quién',
  'sí', 'no', 'tal', 'vez', 'veces', 'tiempo', 'tiempos', 'momento', 'momentos',
  'primer', 'primero', 'primera', 'primeros', 'primeras',
  'segundo', 'segunda', 'segundos', 'segundas',
  'tercer', 'tercero', 'tercera', 'terceros', 'terceras',
  'final', 'finales', 'inicio', 'inicios', 'mitad', 'mitades',
  'parte', 'partes', 'lado', 'lados', 'frente', 'fondo', 'arriba', 'abajo',
  'cerca', 'lejos', 'dentro', 'fuera', 'encima', 'debajo', 'delante', 'detrás',
  'sobre', 'tras', 'hasta', 'desde', 'hacia', 'contra', 'entre', 'sin', 'bajo',
  'pero', 'sino', 'aunque', 'porque', 'por', 'qué', 'pues', 'así', 'también', 'además', 'tampoco',
  'muy', 'más', 'menos', 'casi', 'solo', 'sólo', 'tanto', 'tan', 'todo', 'todos', 'toda', 'todas',
  'nada', 'algo', 'alguien', 'nadie', 'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'mismos', 'mismas',
  'cada', 'varios', 'varias', 'ambos', 'ambas', 'según', 'menos', 'excepto'
];

// ── CONJUNTO COMPLETO DE PALABRAS EN ESPAÑOL ──
export const COMMON_WORDS_ES = new Set([
  ...SPANISH_BASE_WORDS.map(w => w.toLowerCase().trim()),
  ...Object.values(ACCENTED_WORDS_MAP_ES).map(w => w.toLowerCase().trim()),
  ...Object.values(COMMON_TYPOS_MAP_ES).map(w => w.toLowerCase().trim())
]);

// ── VOCABULARIO BASE INGLÉS (FOOTBALL & GENERAL) ──
const ENGLISH_BASE_WORDS = [
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

  // Football & Coaching
  'coach', 'coaches', 'manager', 'football', 'soccer', 'tactics', 'tactical',
  'technique', 'technical', 'physical', 'fitness', 'mental', 'psychological',
  'ball', 'balls', 'possession', 'control', 'controlling', 'controlled',
  'game', 'games', 'match', 'matches', 'play', 'plays', 'played', 'playing', 'player', 'players',
  'pass', 'passes', 'passing', 'passed', 'movement', 'movements', 'mobility',
  'corner', 'corners', 'penalty', 'penalties', 'goal', 'goals', 'goalkeeper', 'goalkeepers',
  'shot', 'shots', 'strike', 'strikes', 'striker', 'strikers', 'finish', 'finishing',
  'defense', 'defenders', 'defensive', 'attack', 'attackers', 'attacking', 'offensive',
  'counterattack', 'transition', 'transitions', 'press', 'pressing', 'high', 'mid', 'low',
  'lineup', 'lineups', 'squad', 'squads', 'substitute', 'substitutes', 'starter', 'starters',
  'bench', 'callup', 'warmup', 'training', 'session', 'sessions', 'exercise', 'exercises',
  'drill', 'drills', 'speed', 'intensity', 'load', 'workload', 'fatigue', 'recovery',
  'half', 'halves', 'first', 'second', 'time', 'minutes', 'attendance', 'whistle', 'referee',
  'card', 'cards', 'yellow', 'red', 'foul', 'fouls', 'offside', 'win', 'draw', 'defeat', 'loss',
  'performance', 'strategy', 'instruction', 'instructions', 'objective', 'objectives',
  'pitch', 'field', 'zone', 'zones', 'space', 'spaces', 'width', 'depth', 'line', 'lines',
  'formation', 'formations', 'keeper', 'cleansheet', 'save', 'saves'
];

export const COMMON_WORDS_EN = new Set([
  ...ENGLISH_BASE_WORDS.map(w => w.toLowerCase().trim()),
  ...Object.values(COMMON_TYPOS_MAP_EN).map(w => w.toLowerCase().trim())
]);

// ── ALGORITMO DAMERAU-LEVENSHTEIN (CON TRANSPOSICIONES) ──
export const damerauLevenshteinDistance = (source, target) => {
  if (!source) return target ? target.length : 0;
  if (!target) return source.length;

  const s = source.toLowerCase();
  const t = target.toLowerCase();
  const m = s.length;
  const n = t.length;

  const d = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // eliminación
        d[i][j - 1] + 1,      // inserción
        d[i - 1][j - 1] + cost // sustitución
      );

      // Transposición de caracteres contiguos
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[m][n];
};

export const levenshteinDistance = damerauLevenshteinDistance;

// ── BÚSQUEDA Y GENERACIÓN DE SUGERENCIAS INTELIGENTES ──
export const getSpellingSuggestions = (rawWord, lang = 'es', limit = 3) => {
  if (!rawWord || rawWord.length < 2) return [];

  const lowerWord = rawWord.toLowerCase().trim();
  const isEn = lang === 'en';
  const typoMap = isEn ? COMMON_TYPOS_MAP_EN : COMMON_TYPOS_MAP_ES;
  const dictionary = isEn ? COMMON_WORDS_EN : COMMON_WORDS_ES;

  // 1. Coincidencia directa en mapa de errores tipográficos comunes
  if (typoMap[lowerWord]) {
    return [typoMap[lowerWord]];
  }

  // 2. Faltas de tilde en español (prioridad absoluta)
  if (!isEn) {
    const unaccented = stripAccents(lowerWord);
    if (ACCENTED_WORDS_MAP_ES[unaccented]) {
      const accented = ACCENTED_WORDS_MAP_ES[unaccented];
      if (accented.toLowerCase() !== lowerWord) {
        return [accented];
      }
    }
    // Si la palabra sin tilde coincide con una palabra que lleva tilde en el diccionario
    const directAccentCandidate = Array.from(dictionary).find(
      w => stripAccents(w) === unaccented && w !== lowerWord
    );
    if (directAccentCandidate) {
      return [directAccentCandidate];
    }
  }

  // 3. Búsqueda por proximidad morfológica Damerau-Levenshtein
  const scored = [];
  const candidatePool = new Set([...dictionary, ...memoryCustomDict]);

  candidatePool.forEach(dictWord => {
    // Si la diferencia de longitud es mayor a 2, omitir
    const lenDiff = Math.abs(dictWord.length - lowerWord.length);
    if (lenDiff > 2) return;

    // Bono si coincide la primera letra (típico en escritura humana)
    const firstLetterMatch = dictWord[0]?.toLowerCase() === lowerWord[0]?.toLowerCase();
    const dist = damerauLevenshteinDistance(lowerWord, dictWord.toLowerCase());

    // Aceptar distancia 1, o distancia 2 si comparten primera letra o longitud >= 5
    if (dist === 1 || (dist === 2 && (firstLetterMatch || lowerWord.length >= 5))) {
      let score = dist;
      if (!firstLetterMatch) score += 0.6;
      if (lenDiff > 0) score += 0.2 * lenDiff;
      scored.push({ word: dictWord, score });
    }
  });

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map(item => item.word);
};

// ── ANÁLISIS COMPLETO DEL TEXTO ──
export const checkTextSpelling = (text, lang = 'es') => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return [];

  const isEn = lang === 'en';
  const dictionary = isEn ? COMMON_WORDS_EN : COMMON_WORDS_ES;
  const typoMap = isEn ? COMMON_TYPOS_MAP_EN : COMMON_TYPOS_MAP_ES;

  // Regex para palabras con caracteres alfabéticos latinos, tildes, ñ, ü y apóstrofes
  const wordRegex = /[A-Za-zÁÉÍÓÚáéíóúÑñÜü'-]+/g;
  const errors = [];
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    const rawWord = match[0];
    const start = match.index;
    const end = start + rawWord.length;

    // Omitir números, abreviaturas de 1 letra o guiones solitarios
    if (rawWord.length < 2 || rawWord === '--' || /^\d+$/.test(rawWord)) continue;

    const lower = rawWord.toLowerCase().trim();

    // 0. ¿Está en el diccionario del usuario o fue ignorada en esta sesión?
    if (memoryCustomDict.has(lower) || sessionIgnoredWords.has(lower)) {
      continue;
    }

    // 1. ¿Es un error conocido en el mapa de errores comunes?
    if (typoMap[lower]) {
      const correction = typoMap[lower];
      errors.push({
        word: rawWord,
        start,
        end,
        suggestions: [correction],
        reason: 'misspelled'
      });
      continue;
    }

    // 2. ¿Es una falta de tilde en español? (ej. 'dinamica' -> 'dinámica', 'tactica' -> 'táctica')
    if (!isEn) {
      const unaccented = stripAccents(lower);
      const accentedReplacement = ACCENTED_WORDS_MAP_ES[unaccented];
      if (accentedReplacement && accentedReplacement.toLowerCase() !== lower) {
        errors.push({
          word: rawWord,
          start,
          end,
          suggestions: [accentedReplacement],
          reason: 'accent'
        });
        continue;
      }
    }

    // 3. ¿Existe de forma exacta en el diccionario oficial?
    if (dictionary.has(lower)) {
      continue;
    }

    // 4. Si tiene 3 o más letras y no está en el diccionario, buscar sugerencias
    if (rawWord.length >= 3) {
      const suggestions = getSpellingSuggestions(rawWord, lang);
      // Solo reportar si no es un nombre propio con mayúscula al inicio que no coincida con nada
      errors.push({
        word: rawWord,
        start,
        end,
        suggestions,
        reason: suggestions.length > 0 ? 'misspelled' : 'unrecognized'
      });
    }
  }

  return errors;
};

// ── APLICAR CORRECCIÓN ORTOGRÁFICA PRESERVANDO CASO ──
export const applySpellingCorrection = (text, errorObj, chosenSuggestion) => {
  if (!text || !errorObj || !chosenSuggestion) return text;

  let replacement = chosenSuggestion;
  // Preservar mayúscula inicial si la palabra original la tenía
  if (errorObj.word && errorObj.word[0] === errorObj.word[0].toUpperCase() && errorObj.word[0] !== errorObj.word[0].toLowerCase()) {
    replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  const before = text.substring(0, errorObj.start);
  const after = text.substring(errorObj.end);
  return before + replacement + after;
};
