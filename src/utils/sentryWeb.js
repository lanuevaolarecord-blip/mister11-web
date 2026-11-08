/**
 * src/utils/sentryWeb.js
 * Míster11 — B6: Integración de Sentry / Observabilidad Web con Scrubbing Estricto de PII de Menores
 *
 * REGLA ESTRICTA DE PRIVACIDAD:
 * Ningún nombre de menor, tutor, fecha de nacimiento, email, DNI ni token
 * puede ser enviado al vendor de observabilidad (Sentry/Crashlytics).
 * Todos los eventos pasan obligatoriamente por sentryBeforeSendScrubber.
 */

import { sentryBeforeSendScrubber, scrubPII, logger } from './logger.js';

export function initObservability(config = {}) {
  const dsn = config.dsn || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SENTRY_DSN) || '';
  const environment = config.environment || (typeof import.meta !== 'undefined' && import.meta.env?.MODE) || 'production';
  const isDev = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.DEV : false;

  // 1. Si window.Sentry está disponible en el entorno global
  if (typeof window !== 'undefined' && window.Sentry && typeof window.Sentry.init === 'function') {
    try {
      window.Sentry.init({
        dsn,
        environment,
        release: 'mister11-web@1.1.77',
        beforeSend: (event, hint) => {
          // Filtrar y sanitizar PII de menores antes de despachar
          return sentryBeforeSendScrubber(event);
        },
        denyUrls: [
          // Evitar ruido de extensiones de navegador
          /extensions\//i,
          /^chrome:\/\//i
        ]
      });
      logger.info('✅ Sentry inicializado con éxito y scrubber de menores activo.');
      return;
    } catch (err) {
      logger.warn('Aviso: no se pudo inicializar window.Sentry:', err.message);
    }
  }

  // 2. Cliente de telemetría / error boundary fallback resiliente (Zero external bloat)
  if (typeof window !== 'undefined') {
    const handleGlobalError = (event) => {
      const errorPayload = {
        type: 'uncaught_error',
        message: event.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      };
      const sanitized = sentryBeforeSendScrubber(errorPayload);
      if (isDev) {
        logger.error('[Observability Fallback Captured]', sanitized);
      }
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason;
      const errorPayload = {
        type: 'unhandled_rejection',
        message: reason?.message || String(reason),
        stack: reason?.stack,
        timestamp: new Date().toISOString()
      };
      const sanitized = sentryBeforeSendScrubber(errorPayload);
      if (isDev) {
        logger.error('[Observability Rejection Captured]', sanitized);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }
}

/**
 * Captura y despacha excepciones manualmente garantizando el scrub de PII de menores.
 */
export function captureException(error, context = {}) {
  const sanitizedContext = scrubPII(context);
  if (typeof window !== 'undefined' && window.Sentry && typeof window.Sentry.captureException === 'function') {
    window.Sentry.captureException(error, { extra: sanitizedContext });
  } else {
    logger.error('[Manual Capture]', error?.message || error, sanitizedContext);
  }
}

export default {
  initObservability,
  captureException
};

