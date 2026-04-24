import * as Sentry from '@sentry/node';
import type { VercelRequest, VercelResponse } from '@vercel/node';
/**
 * Wrapper para capturar erros automaticamente em handlers Vercel
 */
export declare function withSentry(handler: (req: VercelRequest, res: VercelResponse) => Promise<any>): (req: VercelRequest, res: VercelResponse) => Promise<any>;
export { Sentry };
