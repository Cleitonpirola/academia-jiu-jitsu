import { Router, type RequestHandler, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { UsuarioView } from '@tatame/shared';
import type { Repository } from '../../repository.js';
import type { Usuario, Sessao } from './models.js';
import { HttpError } from '../../http-error.js';
import { hashPassword, newToken, tokenHash, verifyPassword } from './password.js';

export const ADMIN_INICIAL_ID = '00000000-0000-4000-8000-000000000001';
export const COOKIE = 'tatame_sessao';
const emailSchema = z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(180);
const senhaSchema = z.string().min(15, 'Use uma frase de senha com pelo menos 15 caracteres.').max(128, 'Use até 128 caracteres.');
const loginSchema = z.object({ email: emailSchema, senha: z.string().min(1).max(128) }).strict();
const setupSchema = z.object({ nome: z.string().trim().min(2).max(120), email: emailSchema, senha: senhaSchema }).strict();
const activationSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/), senha: senhaSchema }).strict();
const publicUser = ({ id, nome, email, perfil, alunoId }: Usuario): UsuarioView => ({ id, nome, email, perfil, alunoId });
export const usuarioAtual = (res: Response): UsuarioView => res.locals.usuario;

export function authModule(repo: Repository) {
  const router = Router();
  if (process.env.APP_ORIGIN) {
    const origin = new URL(process.env.APP_ORIGIN);
    if (origin.origin !== process.env.APP_ORIGIN || (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(origin.hostname)))) throw new Error('APP_ORIGIN deve ser uma origem HTTPS, sem caminho, ou HTTP apenas no computador local.');
  }
  const secure = process.env.APP_ORIGIN?.startsWith('https://') ?? false;
  const cookieOptions = { httpOnly: true, sameSite: 'strict' as const, secure, path: '/' };
  const attempts = new Map<string, { total: number; until: number }>();
  const limit: RequestHandler = (req, _res, next) => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const current = attempts.get(key) ?? { total: 0, until: now + 15 * 60_000 };
    if (current.total >= 20 || attempts.size >= 5000) throw new HttpError(429, 'Muitas tentativas. Tente novamente em 15 minutos.');
    current.total++; attempts.set(key, current); next();
  };
  const isInitial = async () => !(await repo.get('Usuario', ADMIN_INICIAL_ID));
  const identify: RequestHandler = async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const token = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
      const session = (await repo.list('Sessao')).find(item => item.tokenHash === tokenHash(token));
      if (session && session.expiraEm > new Date().toISOString()) {
        const user = await repo.get('Usuario', session.usuarioId);
        const aluno = user?.alunoId ? await repo.get('Aluno', user.alunoId) : null;
        if (user?.senhaHash && session.credencialHash === tokenHash(user.senhaHash) && (user.perfil === 'admin' || aluno?.situacao === 'ativo')) {
          res.locals.usuario = publicUser(user); res.locals.sessao = session;
        }
      }
    }
    next();
  };
  const requireLogin: RequestHandler = (_req, res, next) => {
    if (!res.locals.usuario) throw new HttpError(401, 'Entre na sua conta para continuar.');
    next();
  };
  const requireAdmin: RequestHandler = (_req, res, next) => {
    if (usuarioAtual(res)?.perfil !== 'admin') throw new HttpError(403, 'Esta área é exclusiva da administração.');
    next();
  };
  async function createSession(req: Request, res: Response, user: Usuario) {
    const now = new Date().toISOString();
    // Expiração é verificada em toda requisição; limpeza também evita acumular sessões antigas.
    for (const session of await repo.list('Sessao')) if (session.expiraEm <= now) await repo.remove('Sessao', session.id);
    const old: Sessao | undefined = res.locals.sessao;
    if (old) await repo.remove('Sessao', old.id);
    const token = newToken();
    await repo.insert('Sessao', { id: randomUUID(), usuarioId: user.id, tokenHash: tokenHash(token), credencialHash: tokenHash(user.senhaHash!), criadoEm: now, expiraEm: new Date(Date.now() + 8 * 3600_000).toISOString() });
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: 8 * 3600_000 });
    return { configuracaoInicial: false, usuario: publicUser(user) };
  }
  router.get('/estado', async (_req, res) => res.json({ configuracaoInicial: await isInitial(), usuario: res.locals.usuario ?? null }));
  router.post('/configurar', limit, async (req, res) => {
    const host = req.hostname;
    const remote = req.socket.remoteAddress;
    if (process.env.APP_ORIGIN || !['127.0.0.1', 'localhost', '[::1]', '::1'].includes(host) || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote ?? '')) throw new HttpError(403, 'Configure o primeiro administrador neste computador, antes de publicar a plataforma.');
    if (!await isInitial()) throw new HttpError(409, 'A configuração inicial já foi concluída. Use seu login.');
    const { nome, email, senha } = setupSchema.parse(req.body);
    const user = await repo.insert('Usuario', { id: ADMIN_INICIAL_ID, nome, email, perfil: 'admin', alunoId: null, senhaHash: await hashPassword(senha), conviteHash: null, conviteExpiraEm: null, criadoEm: new Date().toISOString() });
    res.status(201).json(await createSession(req, res, user));
  });
  router.post('/entrar', limit, async (req, res) => {
    const { email, senha } = loginSchema.parse(req.body);
    const user = (await repo.list('Usuario')).find(item => item.email === email);
    const verified = await verifyPassword(senha, user?.senhaHash ?? null);
    const aluno = user?.alunoId ? await repo.get('Aluno', user.alunoId) : null;
    if (!verified || !user || (user.perfil === 'aluno' && aluno?.situacao !== 'ativo')) throw new HttpError(401, 'E-mail ou senha inválidos, ou acesso indisponível.');
    res.json(await createSession(req, res, user));
  });
  router.post('/ativar', limit, async (req, res) => {
    const { token, senha } = activationSchema.parse(req.body);
    const hash = tokenHash(token);
    const user = (await repo.list('Usuario')).find(item => item.conviteHash === hash);
    const now = new Date().toISOString();
    if (!user || !user.conviteExpiraEm || user.conviteExpiraEm <= now) throw new HttpError(400, 'Link inválido ou expirado. Solicite outro à academia.');
    const password = await hashPassword(senha);
    if (!await repo.activateUsuario(user.id, hash, password, new Date().toISOString())) throw new HttpError(400, 'Link inválido ou cadastro inativo. Solicite ajuda à academia.');
    res.json(await createSession(req, res, { ...user, senhaHash: password }));
  });
  router.post('/sair', async (_req, res) => {
    if (res.locals.sessao) await repo.remove('Sessao', res.locals.sessao.id);
    res.clearCookie(COOKIE, cookieOptions); res.status(204).end();
  });
  router.post('/alunos/:id/convite', requireLogin, requireAdmin, async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const aluno = await repo.get('Aluno', id);
    if (!aluno || aluno.situacao !== 'ativo') throw new HttpError(400, 'Selecione um aluno ativo e cadastrado.');
    const token = newToken();
    const conviteExpiraEm = new Date(Date.now() + 24 * 3600_000).toISOString();
    const existing = (await repo.list('Usuario')).find(item => item.alunoId === id);
    const fields = { conviteHash: tokenHash(token), conviteExpiraEm };
    if (existing) await repo.update('Usuario', existing.id, fields);
    else await repo.insert('Usuario', { id: randomUUID(), alunoId: id, nome: aluno.nome, email: aluno.email, perfil: 'aluno', senhaHash: null, ...fields, criadoEm: new Date().toISOString() });
    res.status(201).json({ token, expiraEm: conviteExpiraEm, email: existing?.email ?? aluno.email });
  });
  return { router, identify, requireLogin, requireAdmin };
}

export const protectWrites: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return; }
  if (req.get('X-Tatame-Request') !== '1') throw new HttpError(403, 'Requisição não autorizada. Atualize a página.');
  if (req.body !== undefined && !req.is('application/json')) throw new HttpError(415, 'Envie os dados como JSON.');
  if (req.get('Sec-Fetch-Site') === 'cross-site') throw new HttpError(403, 'Origem da requisição não autorizada.');
  const origin = req.get('Origin');
  const allowed = process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:3333', 'http://localhost:3333'];
  if (origin && !allowed.includes(origin)) throw new HttpError(403, 'Origem da requisição não autorizada.');
  next();
};
