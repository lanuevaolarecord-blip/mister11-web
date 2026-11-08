/**
 * src/utils/logger.js
 * Míster11 — B6: Sistema de Logging Seguro, Sanitización de PII y Protección de Menores
 *
 * Características:
 * - Scrubbing estricto de PII de menores: nombres de jugadores, fechas de nacimiento, emails, teléfonos, DNI/NIE, passwords, tokens.
 * - Modo silencioso en producción (desactiva logs verbosos).
 * - Integrable con Sentry / Crashlytics web mediante beforeSend handler para sanitizar eventos antes del despacho telemétrico.
 */

const PII_PATTERNS = [
  // Emails
  { regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, replacement: '[REDACTED_EMAIL]' },
  // Teléfonos (formatos internacionales y locales)
  { regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: '[REDACTED_PHONE]' },
  // DNI / NIE español
  { regex: /\b[0-9]{8}[A-Z]\b|\b[XYZ][0-9]{7}[A-Z]\b/gi, replacement: '[REDACTED_DNI_NIE]' },
  // Fechas de nacimiento (YYYY-MM-DD o DD/MM/YYYY)
  { regex: /\b(19\d\d|20\d\d)[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/g, replacement: '[REDACTED_DOB]' },
  { regex: /\b(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/](19\d\d|20\d\d)\b/g, replacement: '[REDACTED_DOB]' },
  // Passwords y Tokens
  { regex: /(?:token|password|apiKey|secret|auth)\s*[:=]\s*["']?[^"',\s}]+/gi, replacement: '[REDACTED_SECRET]' }
];

const MINOR_PII_KEYS = new Set([
  'birthdate', 'birth_date', 'fechanacimiento', 'fecha_nacimiento', 'dob',
  'playername', 'player_name', 'nombrejugador', 'nombre_jugador', 'childname', 'child_name',
  'studentname', 'student_name', 'parentname', 'parent_name', 'guardian', 'tutor'
]);

/**
 * Sanitiza cualquier valor (cadena, objeto, array) eliminando información personal identificable (PII),
 * con énfasis estricto en la privacidad de menores de edad.
 */
export const scrubPII = (input) => {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') {
    let result = input;
    for (const { regex, replacement } of PII_PATTERNS) {
      result = result.replace(regex, replacement);
    }
    return result;
  }
  if (Array.isArray(input)) {
    return input.map(scrubPII);
  }
  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
        sanitized[key] = '[REDACTED_SECRET]';
      } else if (MINOR_PII_KEYS.has(lowerKey)) {
        sanitized[key] = lowerKey.includes('birth') || lowerKey.includes('dob') || lowerKey.includes('fecha')
          ? '[REDACTED_DOB]'
          : '[REDACTED_MINOR_PII]';
      } else {
        sanitized[key] = scrubPII(val);
      }
    }
    return sanitized;
  }
  return input;
};

/**
 * Hook de Sentry / Telemetría para sanitizar eventos antes del despacho telemétrico.
 * Garantiza que jamás se envíen nombres ni fechas de nacimiento de menores a proveedores externos.
 */
export const sentryBeforeSendScrubber = (event) => {
  if (!event) return null;
  return scrubPII(event);
};

const isDev = typeof process !== 'undefined'
  ? process.env?.NODE_ENV !== 'production'
  : (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.DEV : true);

export const logger = {
  log: (...args) => {
    if (isDev) {
      console.log(...args.map(scrubPII));
    }
  },
  info: (...args) => {
    if (isDev) {
      console.info(...args.map(scrubPII));
    }
  },
  warn: (...args) => {
    console.warn(...args.map(scrubPII));
  },
  error: (...args) => {
    console.error(...args.map(scrubPII));
  }
};

export default logger;
