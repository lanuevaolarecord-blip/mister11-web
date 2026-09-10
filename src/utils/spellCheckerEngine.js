/**
 * MOTOR CANÓNICO DE CORRECCIÓN ORTOGRÁFICA Y GRAMATICAL - MÍSTER11
 *
 * Estrategia profesional multicapa:
 * 1. Diccionario personalizado del usuario + palabras ignoradas en sesión.
 * 2. Lista de errores tipográficos comunes con corrección directa.
 * 3. Mapa de faltas de tilde frecuentes en español.
 * 4. Vocabulario base masivo (>2000 palabras) ES e EN.
 * 5. Análisis morfológico: reconoce sufijos/prefijos del español → NO marca formas válidas.
 * 6. Filtro de nombres propios: palabras con mayúscula se omiten si no son error evidente.
 * 7. Umbral conservador: solo reporta cuando hay evidencia sólida de error.
 * 8. Algoritmo Damerau-Levenshtein para sugerencias de alta calidad.
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

export const getCustomDictionaryWords = () => Array.from(memoryCustomDict);

export const isWordInUserDictionary = (word) => {
  if (!word) return false;
  const clean = String(word).toLowerCase().trim();
  return memoryCustomDict.has(clean) || sessionIgnoredWords.has(clean);
};

// ── NORMALIZACIÓN ──
export const stripAccents = (str) =>
  String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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
  'balon': 'balón',
  'corner': 'córner', 'corners': 'córners',
  'porteria': 'portería', 'porterias': 'porterías',
  'posicion': 'posición', 'posiciones': 'posiciones',
  'posesion': 'posesión', 'posesiones': 'posesiones',
  'presion': 'presión', 'presiones': 'presiones',
  'basculacion': 'basculación',
  'circulacion': 'circulación',
  'conduccion': 'conducción',
  'finalizacion': 'finalización',
  'recuperacion': 'recuperación',
  'anticipacion': 'anticipación',
  'transicion': 'transición', 'transiciones': 'transiciones',
  'orientacion': 'orientación',
  'coordinacion': 'coordinación',
  'organizacion': 'organización',
  'comunicacion': 'comunicación',
  'motivacion': 'motivación',
  'concentracion': 'concentración',
  'atencion': 'atención', 'atenciones': 'atenciones',
  'sesion': 'sesión', 'sesiones': 'sesiones',
  'alineacion': 'alineación',
  'sustitucion': 'sustitución',
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
  // Adjetivos y adverbios
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
  'algun': 'algún', 'algunos': 'algunos',
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
  'reaccion': 'reacción',
  'condicion': 'condición', 'condiciones': 'condiciones',
  'situacion': 'situación', 'situaciones': 'situaciones',
  'evolucion': 'evolución',
  'evaluacion': 'evaluación',
  'participacion': 'participación',
  'intencion': 'intención',
  'observacion': 'observación',
  'competencia': 'competencia', // CORRECTO: no necesita tilde
  'competencias': 'competencias',
  'asistencia': 'asistencia',
  'evidencia': 'evidencia',
  'experiencia': 'experiencia',
  'importancia': 'importancia',
  'presencia': 'presencia',
  'diferencia': 'diferencia',
  'deficiencia': 'deficiencia',
  'eficiencia': 'eficiencia',
};

// ── MAPA DE ERRORES TIPOGRÁFICOS Y FONÉTICOS DIRECTOS (ESPAÑOL) ──
export const COMMON_TYPOS_MAP_ES = {
  'entreador': 'entrenador',
  'entreadores': 'entrenadores',
  'entrenamieto': 'entrenamiento',
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
  'conducsion': 'conducción',
  'defenza': 'defensa',
  'defenzas': 'defensas',
  'defensibo': 'defensivo',
  'ofensibo': 'ofensivo',
  'correcion': 'corrección',
  'desicion': 'decisión',
  'inico': 'inicio',
  'inisiar': 'iniciar',
  'partisipacion': 'participación',
  'procceso': 'proceso',
  'fubtol': 'fútbol',
  'futvol': 'fútbol',
  'volon': 'balón',
  'autocorector': 'autocorrector',
  'outocorrector': 'autocorrector',
  'reval': 'rival',
  'movilidat': 'movilidad',
};

// ── MAPA DE ERRORES TIPOGRÁFICOS (INGLÉS) ──
export const COMMON_TYPOS_MAP_EN = {
  'coch': 'coach',
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
  'coner': 'corner',
};

// ── SUFIJOS MORFOLÓGICOS DEL ESPAÑOL ──
// Si una palabra termina en alguno de estos sufijos comunes y su raíz
// pertenece al diccionario, se acepta como válida.
const SPANISH_SUFFIXES = [
  // Verbos: infinitivos, participios, gerundios, conjugaciones
  'ar', 'er', 'ir',
  'aba', 'abas', 'ábamos', 'abais', 'aban',
  'ía', 'ías', 'íamos', 'íais', 'ían',
  'ando', 'endo', 'iendo',
  'ado', 'ada', 'ados', 'adas',
  'ido', 'ida', 'idos', 'idas',
  'aré', 'arás', 'ará', 'aremos', 'aréis', 'arán',
  'eré', 'erás', 'erá', 'eremos', 'eréis', 'erán',
  'iré', 'irás', 'irá', 'iremos', 'iréis', 'irán',
  'aría', 'arías', 'aríamos', 'aríais', 'arían',
  'ería', 'erías', 'eríamos', 'eríais', 'erían',
  'iría', 'irías', 'iríamos', 'iríais', 'irían',
  'ase', 'ases', 'ásemos', 'aseis', 'asen',
  'iese', 'ieses', 'iésemos', 'ieseis', 'iesen',
  'ó', 'aste', 'ó', 'amos', 'asteis', 'aron',
  'iste', 'ió', 'imos', 'isteis', 'ieron',
  // Sustantivos y adjetivos
  'ción', 'ciones', 'sión', 'siones',
  'mente', // adverbios: rápidamente, claramente
  'ismo', 'ista', 'istas',
  'idad', 'idades',
  'eza', 'ezas',
  'ura', 'uras',
  'aje', 'ajes',
  'ería', 'erías',
  'ería', 'erío',
  'ero', 'era', 'eros', 'eras',
  'ador', 'adora', 'adores', 'adoras',
  'edor', 'edora', 'edores', 'edoras',
  'idor', 'idora', 'idores', 'idoras',
  'ante', 'antes',
  'iente', 'ientes',
  'oso', 'osa', 'osos', 'osas',
  'al', 'ales',
  'il', 'iles',
  'ble', 'bles',
  'ivo', 'iva', 'ivos', 'ivas',
  'ico', 'ica', 'icos', 'icas',
  'ito', 'ita', 'itos', 'itas',
  'illo', 'illa', 'illos', 'illas',
  'ón', 'ona', 'ones', 'onas',
  'ín', 'ina', 'ines', 'inas',
];

// ── VOCABULARIO BASE MASIVO ESPAÑOL ──
const SPANISH_BASE_WORDS = new Set([
  // ── ARTÍCULOS, DETERMINANTES Y PRONOMBRES ──
  'el','la','los','las','lo','un','una','unos','unas',
  'este','esta','estos','estas','ese','esa','esos','esas',
  'aquel','aquella','aquellos','aquellas',
  'mi','mis','tu','tus','su','sus','nuestro','nuestra','nuestros','nuestras',
  'vuestro','vuestra','vuestros','vuestras',
  'yo','tú','él','ella','nosotros','nosotras','vosotros','vosotras','ellos','ellas',
  'me','te','se','nos','os','le','les',
  'que','cual','cuales','quien','quienes','cuyo','cuya','cuyos','cuyas',

  // ── PREPOSICIONES Y CONJUNCIONES ──
  'a','ante','bajo','con','contra','de','desde','durante','en','entre',
  'hacia','hasta','mediante','para','por','según','sin','sobre','tras',
  'y','e','o','u','ni','pero','sino','aunque','porque','pues','si','ya',
  'cuando','donde','como','mientras','después','antes','hasta','desde',
  'que','si','no','sí','tan','tanto','tal','cual','donde',

  // ── ADVERBIOS FRECUENTES ──
  'muy','más','menos','también','tampoco','además','sin','embargo','así',
  'aquí','ahí','allí','allá','acá','ya','todavía','aún','siempre','nunca',
  'jamás','hoy','ayer','mañana','tarde','temprano','pronto','luego','entonces',
  'después','antes','ahora','bien','mal','casi','solo','sólo','bastante',
  'demasiado','quizás','quizá','acaso','tal','vez',

  // ── ADJETIVOS FRECUENTES ──
  'bueno','buena','buenos','buenas','malo','mala','malos','malas',
  'mejor','mejores','peor','peores','grande','grandes','pequeño','pequeña',
  'pequeños','pequeñas','nuevo','nueva','nuevos','nuevas','viejo','vieja',
  'viejos','viejas','alto','alta','altos','altas','bajo','baja','bajos','bajas',
  'largo','larga','largos','largas','corto','corta','cortos','cortas',
  'fuerte','fuertes','débil','débiles','rápido','rápida','rápidos','rápidas',
  'lento','lenta','lentos','lentas','fácil','fáciles','difícil','difíciles',
  'claro','clara','claros','claras','oscuro','oscura','oscuros','oscuras',
  'primero','primera','primeros','primeras','segundo','segunda','segundos',
  'tercero','tercera','terceros','terceras','último','última','últimos','últimas',
  'siguiente','siguiente','siguientes','anterior','anteriores',
  'todo','toda','todos','todas','mucho','mucha','muchos','muchas',
  'poco','poca','pocos','pocas','varios','varias','algunos','algunas','ninguno',
  'ninguna','ningunos','ningunas','cualquier','cualquiera','otro','otra',
  'otros','otras','mismo','misma','mismos','mismas','propio','propia',
  'propios','propias','cada','ambos','ambas',
  'importante','importantes','necesario','necesaria','necesarios','necesarias',
  'posible','posibles','probable','probables','general','generales',
  'especial','especiales','principal','principales','real','reales',
  'total','totales','completo','completa','completos','completas',
  'diferente','diferentes','igual','iguales','similar','similares',
  'correcto','correcta','correctos','correctas','incorrecto','incorrecta',

  // ── VERBOS SER/ESTAR/HABER ──
  'ser','soy','eres','es','somos','sois','son',
  'era','eras','éramos','erais','eran','fui','fuiste','fue','fuimos','fuisteis','fueron',
  'seré','serás','será','seremos','seréis','serán',
  'sería','serías','seríamos','seríais','serían','sido','siendo',
  'estar','estoy','estás','está','estamos','estáis','están',
  'estaba','estabas','estábamos','estabais','estaban',
  'estuve','estuviste','estuvo','estuvimos','estuvisteis','estuvieron',
  'estaré','estarás','estará','estaremos','estaréis','estarán',
  'estado','estando',
  'haber','he','has','ha','hemos','habéis','han',
  'había','habías','habíamos','habíais','habían',
  'hubo','hubiste','hubo','hubimos','hubisteis','hubieron',
  'habré','habrás','habrá','habremos','habréis','habrán','habido',

  // ── VERBOS MODALES Y AUXILIARES ──
  'poder','puedo','puedes','puede','podemos','podéis','pueden',
  'podía','podías','podíamos','podíais','podían','pude','pudiste','pudo',
  'pudimos','pudisteis','pudieron','podrá','podrás','podremos','podrán',
  'podría','podrías','podríamos','podrían','podido',
  'querer','quiero','quieres','quiere','queremos','queréis','quieren',
  'quería','querías','queríamos','querían','quise','quisiste','quiso',
  'quisimos','quisisteis','quisieron','querido',
  'deber','debo','debes','debe','debemos','debéis','deben',
  'debía','debías','debíamos','debían','debido','debiendo',
  'tener','tengo','tienes','tiene','tenemos','tenéis','tienen',
  'tenía','tenías','teníamos','tenían','tuve','tuviste','tuvo',
  'tuvimos','tuvisteis','tuvieron','tenido','teniendo',

  // ── VERBOS COMUNES DE USO FRECUENTE ──
  'hacer','hago','haces','hace','hacemos','hacéis','hacen',
  'hacía','hacías','hacíamos','hacían','hice','hiciste','hizo',
  'hicimos','hicisteis','hicieron','hecho','haciendo',
  'decir','digo','dices','dice','decimos','decís','dicen',
  'decía','decías','decíamos','decían','dije','dijiste','dijo',
  'dijimos','dijisteis','dijeron','dicho','diciendo',
  'ir','voy','vas','va','vamos','vais','van',
  'iba','ibas','íbamos','ibais','iban','fui','fuiste','fue',
  'fuimos','fuisteis','fueron','ido','yendo',
  'ver','veo','ves','ve','vemos','veis','ven',
  'veía','veías','veíamos','veían','vi','viste','vio','vimos','visteis','vieron',
  'visto','viendo',
  'dar','doy','das','da','damos','dais','dan',
  'daba','dabas','dábamos','daban','di','diste','dio','dimos','disteis','dieron',
  'dado','dando',
  'saber','sé','sabes','sabe','sabemos','sabéis','saben',
  'sabía','sabías','sabíamos','sabían','supe','supiste','supo',
  'supimos','supisteis','supieron','sabido','sabiendo',
  'venir','vengo','vienes','viene','venimos','venís','vienen',
  'venía','venías','veníamos','venían','vine','viniste','vino',
  'vinimos','vinisteis','vinieron','venido','viniendo',
  'poner','pongo','pones','pone','ponemos','ponéis','ponen',
  'ponía','ponías','poníamos','ponían','puse','pusiste','puso',
  'pusimos','pusisteis','pusieron','puesto','poniendo',
  'llevar','llevo','llevas','lleva','llevamos','lleváis','llevan',
  'llevaba','llevabas','llevábamos','llevaban','llevé','llevaste','llevó',
  'llevamos','llevasteis','llevaron','llevado','llevando',
  'pasar','pasa','pasan','pasó','pasaron','pasado','pasando',
  'llamar','llama','llaman','llamó','llamaron','llamado','llamando',
  'seguir','sigue','siguen','siguió','siguieron','seguido','siguiendo',
  'encontrar','encuentra','encuentran','encontró','encontraron','encontrado',
  'quedar','queda','quedan','quedó','quedaron','quedado','quedando',
  'conocer','conozco','conoce','conocen','conoció','conocieron','conocido',
  'salir','salgo','sale','salen','salió','salieron','salido','saliendo',
  'entrar','entro','entra','entran','entró','entraron','entrado','entrando',
  'llegar','llego','llega','llegan','llegó','llegaron','llegado','llegando',
  'comenzar','comienzo','comienza','comienzan','comenzó','comenzaron','comenzado',
  'empezar','empiezo','empieza','empiezan','empezó','empezaron','empezado',
  'terminar','termino','termina','terminan','terminó','terminaron','terminado',
  'acabar','acabo','acaba','acaban','acabó','acabaron','acabado',
  'continuar','continúo','continúa','continúan','continuó','continuaron','continuado',
  'obtener','obtengo','obtiene','obtienen','obtuvo','obtuvieron','obtenido',
  'recibir','recibo','recibe','reciben','recibió','recibieron','recibido',
  'mostrar','muestro','muestra','muestran','mostró','mostraron','mostrado',
  'crear','creo','crea','crean','creó','crearon','creado','creando',
  'usar','uso','usa','usan','usó','usaron','usado','usando',
  'cambiar','cambio','cambia','cambian','cambió','cambiaron','cambiado',
  'mejorar','mejoro','mejora','mejoran','mejoró','mejoraron','mejorado',
  'aumentar','aumenta','aumentan','aumentó','aumentaron','aumentado',
  'reducir','reduzco','reduce','reducen','redujo','redujeron','reducido',
  'desarrollar','desarrolla','desarrollan','desarrolló','desarrollaron','desarrollado',
  'establecer','establezco','establece','establecen','estableció','establecieron','establecido',
  'realizar','realizo','realiza','realizan','realizó','realizaron','realizado',
  'aplicar','aplico','aplica','aplican','aplicó','aplicaron','aplicado',
  'permitir','permito','permite','permiten','permitió','permitieron','permitido',
  'conseguir','consigo','consigue','consiguen','consiguió','consiguieron','conseguido',
  'lograr','logro','logra','logran','logró','lograron','logrado',
  'intentar','intento','intenta','intentan','intentó','intentaron','intentado',
  'tratar','trato','trata','tratan','trató','trataron','tratado',

  // ── FÚTBOL / CONCEPTOS TÁCTICOS & TÉCNICOS ──
  'fútbol','balompié','míster','entrenador','entrenadores','entrenamiento','entrenamientos',
  'equipo','equipos','plantilla','plantillas','vestuario','vestuarios',
  'jugador','jugadores','futbolista','futbolistas',
  'portero','porteros','guardameta','guardametas','arquero','arqueros',
  'defensa','defensas','defensivo','defensivos','defensiva','defensivas',
  'central','centrales','lateral','laterales','carrilero','carrileros',
  'zaguero','zagueros','líbero',
  'medio','medios','mediocentro','mediocentros','centrocampista','centrocampistas',
  'mediapunta','mediapuntas','pivote','pivotes','interior','interiores',
  'extremo','extremos','delantero','delanteros','punta','puntas','ariete','arietes',
  'ataque','ataques','ofensivo','ofensivos','ofensiva','ofensivas',
  'posesión','posesiones','circulación','ritmo','ritmos','velocidad','velocidades',
  'amplitud','profundidad','espacio','espacios','zona','zonas',
  'línea','líneas','banda','bandas',
  'desmarque','desmarques','apoyo','apoyos','ruptura','rupturas',
  'cobertura','coberturas','desdoblamiento','desdoblamientos',
  'pared','paredes','repliegue','repliegues',
  'presión','presiones','basculación','basculaciones',
  'saque','saques','esquina','esquinas','falta','faltas','barrera','barreras',
  'transición','transiciones','contragolpe','contragolpes','contraataque','contraataques',
  'bloque','bloques','remate','remates','tiro','tiros','disparo','disparos',
  'chut','chuts','volea','voleas','cabezazo','cabezazos',
  'centro','centros','córner','córners',
  'penalti','penaltis','penal','penales','parada','paradas',
  'despeje','despejes','interceptación','interceptaciones',
  'gol','goles','marcador','marcadores','resultado','resultados',
  'victoria','victorias','derrota','derrotas','empate','empates',
  'rival','rivales','árbitro','árbitros','linier','liniers',
  'tarjeta','tarjetas','amarilla','amarillas','roja','rojas',
  'alineación','alineaciones','convocatoria','convocatorias',
  'titular','titulares','suplente','suplentes','banquillo','banquillos',
  'sustitución','sustituciones','cambio','cambios','minuto','minutos',
  'campo','campos','terreno','terrenos','césped','porterías','portería',
  'balón','balones','pelota','pelotas','estrategia','estrategias',
  'ejercicio','ejercicios','tarea','tareas','sesión','sesiones',
  'rondo','rondos','partidillo','partidillos','práctica','prácticas',
  'calentamiento','calentamientos','estiramiento','estiramientos',
  'recuperación','recuperaciones','física','físicas','físico','físicos',
  'técnico','técnica','técnicos','técnicas','táctico','táctica','tácticos','tácticas',
  'intensidad','intensidades','volumen','carga','cargas','fatiga',
  'descanso','resistencia','fuerza','agilidad','potencia','coordinación','flexibilidad',
  'duelo','duelos','aéreo','aéreos','aérea','aéreas','terrestre','terrestres',
  'marca','marcas','marcaje','marcajes','colectivo','colectivos','individual','individuales',
  'charla','charlas','análisis','objetivo','objetivos','consigna','consignas',
  'variante','variantes','rendimiento','rendimientos','progreso','progresos',
  'compromiso','actitud','disciplina','esfuerzo','compañerismo','liderazgo',
  'competencia','competencias','habilidad','habilidades','destreza','destrezas',
  'asistencia','asistencias','evidencia','experiencia','presencia',
  'formación','formaciones','sistema','sistemas','método','métodos',
  'trabajo','trabajos','equipo','coordinación','planificación','planificaciones',
  'preparación','preparaciones','concentración','concentraciones',
  'motivación','motivaciones','comunicación','comunicaciones',

  // ── VERBOS ESPECÍFICOS DE FÚTBOL ──
  'iniciar','inicia','inician','inició','iniciamos','iniciaron','iniciando','iniciado',
  'controlar','controla','controlan','controló','controlamos','controlaron','controlando','controlado',
  'jugar','juega','juegan','jugó','jugamos','jugaron','jugando','jugado',
  'pasar','pasa','pasan','pasó','pasamos','pasaron','pasando','pasado',
  'mover','mueve','mueven','movió','movemos','movieron','moviendo','movido',
  'ganar','gana','ganan','ganó','ganamos','ganaron','ganando','ganado',
  'perder','pierde','pierden','perdió','perdimos','perdieron','perdiendo','perdido',
  'empatar','empata','empatan','empató','empatamos','empataron','empatando','empatado',
  'marcar','marca','marcan','marcó','marcamos','marcaron','marcando','marcado',
  'defender','defiende','defienden','defendió','defendimos','defendieron','defendiendo','defendido',
  'atacar','ataca','atacan','atacó','atacamos','atacaron','atacando','atacado',
  'correr','corre','corren','corrió','corrimos','corrieron','corriendo','corrido',
  'presionar','presiona','presionan','presionó','presionamos','presionaron','presionando','presionado',
  'replegar','repliega','repliegan','replegó','replegamos','replegaron','replegando','replegado',
  'bascular','bascula','basculan','basculó','basculamos','bascularon','basculando','basculado',
  'centrar','centra','centran','centró','centramos','centraron','centrando','centrado',
  'rematar','remata','rematan','remató','rematamos','remataron','rematando','rematado',
  'parar','para','paran','paró','paramos','pararon','parando','parado',
  'despejar','despeja','despejan','despejó','despejamos','despejaron','despejando','despejado',
  'recuperar','recupera','recuperan','recuperó','recuperamos','recuperaron','recuperando','recuperado',
  'anticipar','anticipa','anticipan','anticipó','anticipamos','anticiparon','anticipando','anticipado',
  'combinar','combina','combinan','combinó','combinamos','combinaron','combinando','combinado',
  'conducir','conduce','conducen','condujo','condujimos','condujeron','conduciendo','conducido',
  'filtrar','filtra','filtran','filtró','filtramos','filtraron','filtrando','filtrado',
  'apoyar','apoya','apoyan','apoyó','apoyamos','apoyaron','apoyando','apoyado',
  'generar','genera','generan','generó','generamos','generaron','generando','generado',
  'mantener','mantiene','mantienen','mantuvo','mantuvimos','mantuvieron','manteniendo','mantenido',
  'buscar','busca','buscan','buscó','buscamos','buscaron','buscando','buscado',
  'evitar','evita','evitan','evitó','evitamos','evitaron','evitando','evitado',
  'trabajar','trabaja','trabajan','trabajó','trabajamos','trabajaron','trabajando','trabajado',
  'competir','compite','compiten','compitió','competimos','compitieron','compitiendo','competido',
  'entrenar','entrena','entrenan','entrenó','entrenamos','entrenaron','entrenando','entrenado',
  'superar','supera','superan','superó','superamos','superaron','superando','superado',
  'alcanzar','alcanza','alcanzan','alcanzó','alcanzamos','alcanzaron','alcanzando','alcanzado',

  // ── SUSTANTIVOS GENERALES COMUNES ──
  'tiempo','tiempos','momento','momentos','lugar','lugares','parte','partes',
  'grupo','grupos','persona','personas','gente','caso','casos','forma','formas',
  'tipo','tipos','punto','puntos','nivel','niveles','número','números',
  'proceso','procesos','sistema','sistemas','problema','problemas','solución','soluciones',
  'resultado','resultados','información','datos','análisis','estadísticas','estadística',
  'plan','planes','meta','metas','objetivo','objetivos','acción','acciones',
  'inicio','inicios','final','finales','principio','principios','fase','fases',
  'etapa','etapas','período','períodos','semana','semanas','mes','meses','año','años',
  'día','días','hora','horas','temporada','temporadas',
  'nota','notas','informe','informes','reporte','reportes',
  'nombre','nombres','apellido','apellidos','correo','teléfono',
  'ciudad','ciudades','país','países','club','clubes','liga','ligas',
  'copa','copas','torneo','torneos','competición','competiciones',
  'partido','partidos','jornada','jornadas','fecha','fechas',

  // ── TÉRMINOS MÉDICOS/FÍSICOS DEPORTIVOS ──
  'lesión','lesiones','lesionado','lesionada','lesionados','lesionadas',
  'muscular','musculares','articular','articulares','tendón','tendones',
  'ligamento','ligamentos','rodilla','rodillas','tobillo','tobillos',
  'columna','cadera','hombro','hombros','codo','codos','muñeca','muñecas',
  'fisioterapia','fisioterapeuta','rehabilitación','tratamiento','tratamientos',
  'dolor','dolores','inflamación','contusión','contusiones','esguince','esguinces',
  'rotura','roturas','fractura','fracturas','distensión','distensiones',

  // ── TÉRMINOS PSICOLÓGICOS/MENTALES ──
  'confianza','motivación','motivaciones','autoconfianza','autoestima',
  'concentración','estrés','ansiedad','presión','liderazgo',
  'disciplina','compromiso','actitud','determinación','mentalidad',
  'foco','enfoque','gestión','gestiones',

  // ── NÚMEROS Y CANTIDADES ──
  'uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez',
  'once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho',
  'diecinueve','veinte','treinta','cuarenta','cincuenta','sesenta','setenta',
  'ochenta','noventa','cien','ciento','mil',
  'primer','primero','primera','segundo','segunda','tercero','tercera',
  'cuarto','cuarta','quinto','quinta','sexto','séptima','octavo','noveno','décimo',

  // ── EXPRESIONES TEMPORALES ──
  'lunes','martes','miércoles','jueves','viernes','sábado','domingo',
  'enero','febrero','marzo','abril','mayo','junio','julio',
  'agosto','septiembre','octubre','noviembre','diciembre',
  'mañana','tarde','noche','madrugada',

  // ── CONECTORES Y EXPRESIONES FRECUENTES ──
  'sin','embargo','por','tanto','lo','cual','es','decir',
  'es','decir','por','ejemplo','en','cambio','además','asimismo',
  'por','otro','lado','en','primer','lugar','en','conclusión',
  'no','obstante','a','pesar','de','gracias','a','con','respecto',
]);

// ── VOCABULARIO BASE INGLÉS (FOOTBALL & GENERAL) ──
const ENGLISH_BASE_WORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and',
  'any','are','as','at','be','because','been','before','being','below',
  'between','both','but','by','can','could','did','do','does','doing',
  'down','during','each','few','for','from','further','had','has','have',
  'having','he','her','here','hers','herself','him','himself','his','how',
  'i','if','in','into','is','it','its','itself','just','me','more',
  'most','my','myself','no','nor','not','now','of','off','on','once',
  'only','or','other','ought','our','ours','ourselves','out','over','own',
  'same','she','should','so','some','such','than','that','the','their',
  'theirs','them','themselves','then','there','these','they','this','those',
  'through','to','too','under','until','up','very','was','we','were',
  'what','when','where','which','while','who','whom','why','with','would',
  'you','your','yours','yourself','yourselves',
  // Football & Coaching
  'coach','coaches','manager','football','soccer','tactics','tactical',
  'technique','technical','physical','fitness','mental','psychological',
  'ball','balls','possession','control','controlling','controlled',
  'game','games','match','matches','play','plays','played','playing','player','players',
  'pass','passes','passing','passed','movement','movements','mobility',
  'corner','corners','penalty','penalties','goal','goals','goalkeeper','goalkeepers',
  'shot','shots','strike','strikes','striker','strikers','finish','finishing',
  'defense','defenders','defensive','attack','attackers','attacking','offensive',
  'counterattack','transition','transitions','press','pressing','high','mid','low',
  'lineup','lineups','squad','squads','substitute','substitutes','starter','starters',
  'bench','callup','warmup','training','session','sessions','exercise','exercises',
  'drill','drills','speed','intensity','load','workload','fatigue','recovery',
  'half','halves','first','second','time','minutes','attendance','whistle','referee',
  'card','cards','yellow','red','foul','fouls','offside','win','draw','defeat','loss',
  'performance','strategy','instruction','instructions','objective','objectives',
  'pitch','field','zone','zones','space','spaces','width','depth','line','lines',
  'formation','formations','keeper','cleansheet','save','saves',
  'competition','league','cup','tournament','season','week','month','year',
  'team','teams','club','clubs','player','players','captain','captains',
]);

// ── CONJUNTO COMPLETO ESPAÑOL ──
export const COMMON_WORDS_ES = new Set([
  ...SPANISH_BASE_WORDS,
  ...Object.values(ACCENTED_WORDS_MAP_ES).map(w => w.toLowerCase().trim()),
  ...Object.values(COMMON_TYPOS_MAP_ES).map(w => w.toLowerCase().trim()),
]);

// ── CONJUNTO COMPLETO INGLÉS ──
export const COMMON_WORDS_EN = new Set([
  ...ENGLISH_BASE_WORDS,
  ...Object.values(COMMON_TYPOS_MAP_EN).map(w => w.toLowerCase().trim()),
]);

// ── ANÁLISIS MORFOLÓGICO ESPAÑOL ──
/**
 * Verifica si una palabra es morfológicamente válida en español
 * comprobando si su raíz (al quitar sufijos comunes) existe en el diccionario.
 * Esto permite aceptar conjugaciones y derivaciones sin listarlas todas.
 */
const isSpanishMorphologyValid = (word) => {
  const lower = word.toLowerCase();
  // Sufijos ordenados de más largo a más corto para máxima precisión
  const sortedSuffixes = [...SPANISH_SUFFIXES].sort((a, b) => b.length - a.length);

  for (const suffix of sortedSuffixes) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
      const root = lower.slice(0, lower.length - suffix.length);
      // Verificar si la raíz existe en el diccionario (directa o con variaciones simples)
      if (
        COMMON_WORDS_ES.has(root) ||
        COMMON_WORDS_ES.has(root + 'a') ||
        COMMON_WORDS_ES.has(root + 'e') ||
        COMMON_WORDS_ES.has(root + 'o') ||
        COMMON_WORDS_ES.has(root + 'ar') ||
        COMMON_WORDS_ES.has(root + 'er') ||
        COMMON_WORDS_ES.has(root + 'ir') ||
        COMMON_WORDS_ES.has(root + 'r') ||
        COMMON_WORDS_ES.has(root + 'ción') ||
        COMMON_WORDS_ES.has(root + 'ción')
      ) {
        return true;
      }
    }
  }

  // Verificar prefijos comunes: des-, re-, in-, pre-, sub-, super-, ante-, con-
  const prefixes = ['des','re','in','im','pre','sub','super','ante','con','co','pro','inter','multi','semi','bi','tri'];
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix) && lower.length > prefix.length + 2) {
      const withoutPrefix = lower.slice(prefix.length);
      if (COMMON_WORDS_ES.has(withoutPrefix)) {
        return true;
      }
    }
  }

  return false;
};

// ── DETECCIÓN DE NOMBRE PROPIO ──
/**
 * Devuelve true si la palabra tiene alta probabilidad de ser un nombre propio.
 * - Primera letra en mayúscula y el resto en minúsculas.
 * - Longitud >= 2 y no parece una frase (no contiene espacios).
 */
const looksLikeProperNoun = (rawWord, positionInText, fullText) => {
  if (!rawWord || rawWord.length < 2) return false;
  const firstChar = rawWord[0];
  const isUpperCase = firstChar !== firstChar.toLowerCase() && firstChar === firstChar.toUpperCase();
  if (!isUpperCase) return false;

  // Si está al inicio del texto o después de un punto/signo de exclamación/interrogación, 
  // puede ser inicio de oración → no asumir nombre propio sin más evidencia
  const textBefore = fullText.substring(0, positionInText).trimEnd();
  const lastNonSpace = textBefore[textBefore.length - 1];
  const isAfterSentenceEnd = !lastNonSpace || /[.!?]/.test(lastNonSpace);
  
  // Si es al inicio de oración pero tiene longitud > 7, aún puede ser nombre propio
  if (isAfterSentenceEnd && rawWord.length <= 7) return false;

  // Si la palabra es toda mayúsculas (sigla/acrónimo), omitir siempre
  if (rawWord === rawWord.toUpperCase() && rawWord.length <= 5) return true;

  return true;
};

// ── ALGORITMO DAMERAU-LEVENSHTEIN (CON TRANSPOSICIONES) ──
export const damerauLevenshteinDistance = (source, target) => {
  if (!source) return target ? target.length : 0;
  if (!target) return source.length;

  const s = source.toLowerCase();
  const t = target.toLowerCase();
  const m = s.length;
  const n = t.length;

  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
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

  // 1. Coincidencia directa en mapa de errores tipográficos
  if (typoMap[lowerWord]) {
    return [typoMap[lowerWord]];
  }

  // 2. Faltas de tilde (español)
  if (!isEn) {
    const unaccented = stripAccents(lowerWord);
    if (ACCENTED_WORDS_MAP_ES[unaccented]) {
      const accented = ACCENTED_WORDS_MAP_ES[unaccented];
      if (accented.toLowerCase() !== lowerWord) {
        return [accented];
      }
    }
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
    const lenDiff = Math.abs(dictWord.length - lowerWord.length);
    if (lenDiff > 2) return;

    const firstLetterMatch = dictWord[0]?.toLowerCase() === lowerWord[0]?.toLowerCase();
    const dist = damerauLevenshteinDistance(lowerWord, dictWord.toLowerCase());

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

  const wordRegex = /[A-Za-zÁÉÍÓÚáéíóúÑñÜüÀàÈèÌìÒòÙù'-]+/g;
  const errors = [];
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    const rawWord = match[0];
    const start = match.index;
    const end = start + rawWord.length;

    // Omitir: muy cortas, guiones, puramente numéricas
    if (rawWord.length < 3 || rawWord === '--' || rawWord === "'" || /^\d+$/.test(rawWord)) continue;

    // Omitir siglas/acrónimos (todo mayúsculas, ≤ 6 chars)
    if (rawWord === rawWord.toUpperCase() && rawWord.length <= 6) continue;

    const lower = rawWord.toLowerCase().trim();

    // 0. Diccionario personalizado o ignorado en sesión
    if (memoryCustomDict.has(lower) || sessionIgnoredWords.has(lower)) continue;

    // 1. Error tipográfico conocido
    if (typoMap[lower]) {
      const correction = typoMap[lower];
      errors.push({ word: rawWord, start, end, suggestions: [correction], reason: 'misspelled' });
      continue;
    }

    // 2. Falta de tilde en español
    if (!isEn) {
      const unaccented = stripAccents(lower);
      const accentedReplacement = ACCENTED_WORDS_MAP_ES[unaccented];
      if (accentedReplacement && accentedReplacement.toLowerCase() !== lower) {
        errors.push({ word: rawWord, start, end, suggestions: [accentedReplacement], reason: 'accent' });
        continue;
      }
    }

    // 3. Existe en el diccionario oficial (normalizado)
    if (dictionary.has(lower)) continue;

    // 4. Comprobar sin tilde si existe en diccionario con tilde (evita falsos positivos)
    if (!isEn) {
      const stripped = stripAccents(lower);
      const hasAccentedVersion = Array.from(dictionary).some(w => stripAccents(w) === stripped);
      if (hasAccentedVersion) continue; // La versión con tilde está en el diccionario → acepta la sin tilde como variante
    }

    // 5. Análisis morfológico: si la raíz existe, es válida
    if (!isEn && isSpanishMorphologyValid(rawWord)) continue;

    // 6. Nombre propio: omitir con alta probabilidad de ser nombre/apellido/lugar
    if (looksLikeProperNoun(rawWord, start, text)) continue;

    // 7. Solo reportar si hay sugerencias de calidad (evita falsos positivos de palabras técnicas o raras)
    const suggestions = getSpellingSuggestions(rawWord, lang);
    if (suggestions.length > 0) {
      // Solo reportar si la sugerencia no es morfológicamente similar (para no alarmar con jerga técnica)
      errors.push({
        word: rawWord,
        start,
        end,
        suggestions,
        reason: 'misspelled',
      });
    }
    // Si no hay sugerencias sólidas → no reportar (probablemente nombre técnico o jerga válida)
  }

  return errors;
};

// ── APLICAR CORRECCIÓN ORTOGRÁFICA PRESERVANDO CASO ──
export const applySpellingCorrection = (text, errorObj, chosenSuggestion) => {
  if (!text || !errorObj || !chosenSuggestion) return text;

  let replacement = chosenSuggestion;
  if (errorObj.word && errorObj.word[0] === errorObj.word[0].toUpperCase() && errorObj.word[0] !== errorObj.word[0].toLowerCase()) {
    replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  const before = text.substring(0, errorObj.start);
  const after = text.substring(errorObj.end);
  return before + replacement + after;
};
