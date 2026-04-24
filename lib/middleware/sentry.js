import * as Sentry from '@sentry/node';
const SENTRY_DSN = process.env.SENTRY_DSN || 'https://47dd507b5b3bf02c2cd8b13d0dd7ff9d@o4511243234312192.ingest.us.sentry.io/4511275137892352';
Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.VERCEL_ENV || 'development',
});
/**
 * Wrapper para capturar erros automaticamente em handlers Vercel
 */
export function withSentry(handler) {
    return async (req, res) => {
        try {
            return await handler(req, res);
        }
        catch (error) {
            Sentry.captureException(error);
            await Sentry.flush(2000);
            throw error;
        }
    };
}
export { Sentry };
