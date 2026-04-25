import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;
let initialized = false;

if (SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.VERCEL_ENV || 'development',
    });
    initialized = true;
  } catch (e) {
    console.warn('Sentry init failed:', e.message);
  }
}

/**
 * Wrapper para capturar erros automaticamente em handlers Vercel
 */
export function withSentry(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      if (initialized && SENTRY_DSN) {
        Sentry.captureException(error);
        try { await Sentry.flush(2000); } catch (e) {}
      }
      throw error;
    }
  };
}

export { Sentry };
