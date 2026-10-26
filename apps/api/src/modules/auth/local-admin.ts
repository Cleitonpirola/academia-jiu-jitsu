import type { Request } from 'express';

/** Conveniência temporária exclusiva do processo local; nunca aceita acesso por proxy. */
export function allowsLocalAdmin(req: Request, enabled: boolean): boolean {
  if (!enabled || process.env.APP_ORIGIN || process.env.NODE_ENV === 'production'
    || !['127.0.0.1', 'localhost', '::1'].includes(process.env.HOST || '127.0.0.1')) return false;
  if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(req.hostname)
    || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '')) return false;
  if (['Forwarded', 'X-Forwarded-For', 'X-Forwarded-Host', 'X-Forwarded-Proto'].some(header => req.get(header) !== undefined)
    || req.get('Sec-Fetch-Site') === 'cross-site') return false;
  const origin = req.get('Origin');
  return !origin || ['http://127.0.0.1:3333', 'http://localhost:3333', 'http://127.0.0.1:5173', 'http://localhost:5173'].includes(origin);
}
