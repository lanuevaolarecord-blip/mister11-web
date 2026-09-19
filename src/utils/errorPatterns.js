/**
 * src/utils/errorPatterns.js
 * MÍSTER11 — Catálogo Estructurado de Patrones de Error y Anti-patrones
 * Sistema de Aprendizaje Continuo para Prevención de Fallos
 */

export const ERROR_PATTERNS = {
  LOADING_STATE_NOT_RESET: {
    id: "ERR-001",
    name: "LOADING_STATE_NOT_RESET",
    description: "Estado de carga no se resetea tras un error en una operación asíncrona",
    symptom: "Botón queda deshabilitado indefinidamente o con spinner infinito",
    solution: "Usar try/catch/finally garantizando setIsLoading(false) en el bloque finally",
    example: "TeamAttendanceTab.jsx - handleSaveCurrentAttendance",
    prevention: "Envolver siempre toda llamada asíncrona en try/catch/finally sin excepciones"
  },
  HARDCODED_COLOR: {
    id: "ERR-002",
    name: "HARDCODED_COLOR",
    description: "Color hexadecimal o azul genérico hardcodeado en lugar de usar tokens de paleta",
    symptom: "check-chart-palette.mjs falla; interfaz rompe la identidad institucional Tierra y Campo",
    solution: "Usar variables CSS (--verde-selva, --verde-campo, --oro, --arena) o tokens canónicos",
    example: "Botones con #3B82F6 en lugar de #1B3A2D o #4CAF7D",
    prevention: "Consultar tokens oficiales; linter de paleta obligatorio en CI"
  },
  MISSING_DEBOUNCE: {
    id: "ERR-003",
    name: "MISSING_DEBOUNCE",
    description: "Búsqueda en tiempo real ejecutada en cada pulsación sin debounce",
    symptom: "Múltiples lecturas redundantes a Firestore por segundo; saturación de cuota",
    solution: "Implementar debounce de 300 ms con setTimeout y clearTimeout en useEffect",
    example: "JoinTeam.jsx - búsqueda reactiva de equipo por código",
    prevention: "Toda búsqueda conectada a backend o Firestore requiere debounce mínimo de 300ms"
  },
  EMOJI_INSTEAD_OF_ICON: {
    id: "ERR-004",
    name: "EMOJI_INSTEAD_OF_ICON",
    description: "Uso de emojis de texto en lugar de iconos vectoriales en botones y componentes",
    symptom: "Inconsistencias de renderizado y tamaño entre Android, iOS y navegadores web",
    solution: "Reemplazar emojis por componentes vectoriales de lucide-react",
    example: "Botones con emojis en lugar de <UserCheck />, <Users />, <Shield />",
    prevention: "Prohibido el uso de emojis como iconos de interfaz de usuario"
  },
  FULLSCREEN_RESETS_STATE: {
    id: "ERR-005",
    name: "FULLSCREEN_RESETS_STATE",
    description: "Modo pantalla completa resetea o sobreescribe el estado de datos de la sesión",
    symptom: "La vista de medio campo vuelve a campo entero al maximizar",
    solution: "Separar estrictamente el estado visual (isFullscreen) del estado de datos (fieldType)",
    example: "WhiteboardCanvas.jsx / PizarraTactica.jsx - toggleFullscreen",
    prevention: "El modo pantalla completa solo debe alterar dimensiones de visualización, jamás datos"
  },
  MISSING_IMAGE_FALLBACK: {
    id: "ERR-006",
    name: "MISSING_IMAGE_FALLBACK",
    description: "Imagen de jugador o escudo sin fallback cuando no existe URL o falla la carga",
    symptom: "Huecos en blanco o iconos rotos en exportaciones PDF, PNG o tarjetas de plantilla",
    solution: "Renderizar avatar circular con inicial del nombre sobre fondo institucional cuando falle",
    example: "PlayerCard.jsx, matchPdfReport.js, convocationPNGGenerator.js",
    prevention: "Toda etiqueta <img> dinámica debe contar con prop onError y componente de fallback"
  },
  HARDCODED_STRING_NO_I18N: {
    id: "ERR-007",
    name: "HARDCODED_STRING_NO_I18N",
    description: "Texto visible al usuario hardcodeado directamente en el JSX sin traducción",
    symptom: "La aplicación muestra idiomas mezclados o falla el ci-i18n-gate",
    solution: "Mover todas las cadenas a translations.js y consumirlas mediante useTranslation()",
    example: "DEF-M12-01 en landing de precios y tablas comparativas",
    prevention: "ci-i18n-gate debe pasar siempre con 0 offenders antes de cada commit"
  },
  FIRESTORE_RULES_MISSING: {
    id: "ERR-008",
    name: "FIRESTORE_RULES_MISSING",
    description: "Reglas de seguridad de Firestore impiden operaciones legítimas del cliente",
    symptom: "Error 'Missing or insufficient permissions' en colecciones de soporte o índices",
    solution: "Configurar reglas de lectura y escritura específicas en firestore.rules para cada colección",
    example: "staff_codes, team_codes, sessionRatings",
    prevention: "Revisar y desplegar siempre firestore.rules junto a cualquier cambio de colección"
  },
  LOW_CONTRAST_THEME_LEAK: {
    id: "ERR-009",
    name: "LOW_CONTRAST_THEME_LEAK",
    description: "Elementos con colores fijos que se vuelven invisibles al alternar entre modo claro y oscuro",
    symptom: "Texto blanco sobre fondos claros o campos de entrada oscuros en tarjetas blancas",
    solution: "Utilizar clases temáticas que conmutan automáticamente con html.dark y html.light",
    example: "JoinTeam.jsx banner de equipo encontrado en modo claro",
    prevention: "Validar obligatoriamente todas las pantallas en ambos temas antes de publicar"
  },
  UNSYNCHRONIZED_ACCUMULATORS: {
    id: "ERR-010",
    name: "UNSYNCHRONIZED_ACCUMULATORS",
    description: "Contadores o resúmenes que acumulan valores sin validar contra la lista física real",
    symptom: "Se reportan más convocados o minutos jugados que los disponibles en la plantilla",
    solution: "Derivar conteos directamente de la longitud de entidades activas y reconciliar límites",
    example: "Contador de 18 convocados en plantillas de 15 jugadores",
    prevention: "Derivar valores calculados siempre de la fuente canónica de verdad"
  }
};

export default ERROR_PATTERNS;
