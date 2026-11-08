/**
 * src/utils/logger.js
 * Míster11 — B6: Sistema de Logging Seguro y Sanitización de PII (Privacy-Safe Logger)
 *
 * Características:
 * - Scrubbing estricto de PII: emails, teléfonos, DNI/NIE, tokens Bearer, passwords.
 * - Modo silencioso en producción (desactiva logs verbosos).
 * - Integrable con Sentry mediante beforeSend handler para sanitizar eventos antes del envío.
 */

const PII_PATTERNS = [
  // Emails
  { regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, replacement: '[REDACTED_EMAIL]' },
  // Teléfonos (formatos internacionales y locales)
  { regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: '[REDACTED_PHONE]' },
  // DNI / NIE español
  { regex: /\b[0-9]{8}[A-Z]\b|\b[XYZ][0-9]{7}[A-Z]\b/gi, replacement: '[REDACTED_DNI_NIE]' },
  // Passwords y Tokens
  { regex: /(?:token|password|apiKey|secret|auth)\s*[:=]\s*["']?[^"',\s}]+/gi, replacement: '[REDACTED_SECRET]' }
];

/**
 * Sanitiza cualquier valor (cadena, objeto, array) eliminando información personal identificable.
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
      } else {
        sanitized[key] = scrubPII(val);
      }
    }
    return sanitized;
  }
  return input;
};

/**
 * Hook de Sentry para sanitizar eventos antes del despacho telemétrico.
 */
export const sentryBeforeSendScrubber = (event) => {
  if (!event) return null;
  return scrubPII(event);
};

const isDev = typeof process !== 'undefined' ? process.env?.NODE_ENV !== 'production' : true;

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
