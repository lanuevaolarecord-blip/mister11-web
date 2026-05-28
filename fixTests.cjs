const fs = require('fs');

const path = 'src/pages/Tests.jsx';
let content = fs.readFileSync(path, 'utf-8');

const regex = /const DEFAULT_TESTS = \[[\s\S]*?\];\n/;

const newArray = `const DEFAULT_TESTS = [
  { id: 't1', type: 'fisico', category: 'Resistencia', name: 'Test de Cooper', unit: 'm', desc: 'Distancia recorrida en 12 minutos.', protocol: { 
    ejecucion: 'Los deportistas deben correr a máxima intensidad sostenida durante 12 minutos exactos en una pista de atletismo o circuito cerrado previamente medido.', 
    medicion: 'Al sonar el silbato a los 12 minutos, cada deportista debe detenerse y permanecer en el lugar. Se registra la marca exacta en metros mediante marcas fijas o GPS.', 
    objetivo: 'Test estándar para evaluar la capacidad aeróbica máxima (VO2 máx), determinar el umbral de resistencia general y monitorizar la progresión cardiovascular.' } },
  
  { id: 't2', type: 'fisico', category: 'Resistencia', name: 'Course Navette', unit: 'nivel', desc: 'Carrera de ida y vuelta de 20m con pitidos.', protocol: { 
    ejecucion: 'Carreras de 20 metros de distancia de línea a línea, al ritmo marcado por un pitido sonoro que acelera progresivamente cada minuto (cada palier).', 
    medicion: 'Se anota el último palier (nivel y fracción) completado correctamente antes de que el jugador no logre llegar a la línea al sonar el pitido en dos ocasiones consecutivas.', 
    objetivo: 'Medir la potencia aeróbica máxima y el consumo máximo de oxígeno (VO2 máx) en un formato específico para deportes de equipo con cambios de dirección.' } },
  
  { id: 't3', type: 'fisico', category: 'Velocidad', name: 'Sprint 10m', unit: 'seg', desc: 'Aceleración en distancia corta.', protocol: { 
    ejecucion: 'El jugador inicia desde una posición estática (con un pie adelantado). A la señal o a su propia iniciativa, realiza un sprint a máxima intensidad hasta rebasar la marca de los 10 metros.', 
    medicion: 'El tiempo se registra en segundos y centésimas, preferiblemente utilizando células fotoeléctricas para máxima precisión, o cronómetro manual como alternativa.', 
    objetivo: 'Evaluar de forma específica la capacidad de aceleración pura, el tiempo de reacción inicial y la potencia neuromuscular explosiva en los primeros pasos.' } },
  
  { id: 't4', type: 'fisico', category: 'Velocidad', name: 'Sprint 30m', unit: 'seg', desc: 'Velocidad máxima lanzada.', protocol: { 
    ejecucion: 'Sprint lineal de 30 metros al máximo esfuerzo desde posición estática. Es fundamental mantener la intensidad hasta cruzar por completo la línea de meta.', 
    medicion: 'El tiempo total se cronometra en segundos. Se recomiendan dos o tres intentos por jugador, con descansos completos de 2 a 3 minutos, registrando la mejor marca.', 
    objetivo: 'Medir la velocidad punta máxima, la transición de la fase de aceleración a la de velocidad lanzada y la capacidad anaeróbica aláctica del jugador.' } },
  
  { id: 't5', type: 'fisico', category: 'Agilidad', name: 'T-Test', unit: 'seg', desc: 'Desplazamientos frontales, laterales y de espaldas.', protocol: { 
    ejecucion: 'Sprint de 10m al frente hasta un cono, desplazamiento lateral 5m a la izquierda a otro cono, desplazamiento lateral 10m a la derecha, lateral 5m al centro y 10m corriendo de espaldas al inicio.', 
    medicion: 'El cronómetro se detiene cuando el jugador cruza la línea final. Se penaliza o invalida el intento si el jugador cruza las piernas en el desplazamiento lateral o no toca los conos con la mano.', 
    objetivo: 'Evaluar la agilidad multidireccional, el control corporal, el equilibrio dinámico y la capacidad para realizar cambios rápidos de dirección sin pérdida de velocidad.' } },
  
  { id: 't6', type: 'fisico', category: 'Fuerza', name: 'Salto CMJ', unit: 'cm', desc: 'Salto vertical con contramovimiento.', protocol: { 
    ejecucion: 'El jugador comienza de pie con las manos en las caderas. Realiza una rápida flexión de rodillas (bajar el centro de gravedad) e inmediatamente salta verticalmente lo más alto posible.', 
    medicion: 'Se mide la altura máxima del salto en centímetros. Se recomienda utilizar plataformas de contacto, alfombras de salto o aplicaciones de análisis de video a alta velocidad (como MyJump).', 
    objetivo: 'Medir de forma precisa la potencia explosiva del tren inferior, la fuerza reactiva y la capacidad de utilización del ciclo estiramiento-acortamiento de la musculatura.' } },
  
  { id: 't7', type: 'fisico', category: 'Técnica', name: 'Conducción conos', unit: 'seg', desc: 'Slalom entre conos con finalización.', protocol: { 
    ejecucion: 'Conducir el balón haciendo slalom en zigzag entre 5 conos colocados en línea y separados por 2 metros. Al finalizar, realizar un pase preciso hacia una mini portería u objetivo.', 
    medicion: 'El tiempo comienza al tocar el balón por primera vez y se detiene en el momento exacto en que el balón entra en el objetivo. Se pueden aplicar penalizaciones de tiempo por saltarse conos.', 
    objetivo: 'Evaluar de forma integral el control del balón en velocidad, la coordinación óculo-pédica y la precisión técnica bajo condiciones de fatiga y presión temporal.' } },
  
  { id: 't8', type: 'fisico', category: 'Técnica', name: 'Pase a portería', unit: 'pts', desc: 'Precisión de pase a zonas objetivo (10 pases).', protocol: { 
    ejecucion: 'El jugador debe realizar 10 pases consecutivos desde la frontal del área hacia pequeñas porterías, miniarcos o zonas demarcadas en las esquinas de una portería reglamentaria.', 
    medicion: 'Se suma 1 punto por cada acierto pleno en el objetivo. Total de 10 puntos posibles. No hay límite de tiempo, pero los golpeos deben hacerse a un solo toque o control orientado.', 
    objetivo: 'Medir la precisión milimétrica del golpeo, la concentración técnica y la capacidad de poner el balón en zonas clave que simulan situaciones reales de asistencia o finalización.' } },

  // Tests Psicosociales, Sociodeportivos, etc.
  { id: 'psi1', type: 'psicosocial', category: 'Afrontamiento', name: 'Inventario de Habilidades (ACSI-28)', unit: 'pts', desc: 'Evalúa manejo de presión y adversidad.', 
    protocol: {
      ejecucion: 'El jugador responde a un cuestionario de 28 preguntas sobre diversas situaciones en entrenamientos y partidos usando una escala Likert de 1 a 4.',
      medicion: 'Suma de puntajes de la escala Likert. Resultados más altos indican mejores estrategias.',
      objetivo: 'Identificar el perfil de afrontamiento psicológico del jugador ante el estrés y errores.'
    }, 
    rangoMin: 0, rangoMax: 30, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Mantengo la calma cuando cometo un error.', dimension: 'Afrontamiento' },
    { id: 'q2', text: 'Me recupero rápidamente tras una mala jugada.', dimension: 'Afrontamiento' },
    { id: 'q3', text: 'Me mantengo concentrado a pesar de las distracciones.', dimension: 'Concentración' },
    { id: 'q4', text: 'Puedo enfocarme solo en la tarea actual.', dimension: 'Concentración' },
    { id: 'q5', text: 'Siento seguridad en mis capacidades antes del partido.', dimension: 'Confianza' },
    { id: 'q6', text: 'No dudo de mí mismo en momentos críticos.', dimension: 'Confianza' }
  ] },
  
  { id: 'soc1', type: 'socioemocional', category: 'Cohesión', name: 'Cohesión de Equipo (GEQ)', unit: 'pts', desc: 'Evalúa la unión del grupo y trabajo.', 
    protocol: {
      ejecucion: 'Cuestionario respondido de forma individual y anónima sobre la percepción del jugador sobre el grupo.',
      medicion: 'Puntuación sumada de respuestas de 1 a 5, separada en cohesión social y de tarea.',
      objetivo: 'Detectar problemas de integración en el vestuario y evaluar la sinergia colectiva para objetivos comunes.'
    },
    rangoMin: 0, rangoMax: 20, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Todos en el equipo comparten el mismo objetivo.', dimension: 'Cohesión de Tarea' },
    { id: 'q2', text: 'Nos esforzamos juntos para alcanzar las metas.', dimension: 'Cohesión de Tarea' },
    { id: 'q3', text: 'Me llevo bien con mis compañeros fuera del campo.', dimension: 'Cohesión Social' },
    { id: 'q4', text: 'Disfruto pasar tiempo con el equipo.', dimension: 'Cohesión Social' }
  ] }
];
`;

content = content.replace(regex, newArray);
fs.writeFileSync(path, content);
console.log('Tests updated successfully');
