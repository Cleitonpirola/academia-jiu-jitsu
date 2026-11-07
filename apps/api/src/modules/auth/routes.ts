import { Router, type RequestHandler, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { setTimeout as esperar } from 'node:timers/promises';
import { z } from 'zod';
import { SENHA_MINIMA, type UsuarioView } from '@tatame/shared';
import type { Repository } from '../../repository.js';
import type { Usuario, Sessao } from './models.js';
import { HttpError } from '../../http-error.js';
import { hashPassword, newToken, senhaComum, tokenHash, verifyPassword } from './password.js';
import { allowsLocalAdmin } from './local-admin.js';
import { usuarioHabilitado, emailProprio } from './familia.js';
import { configurarEmailRecuperacao, type EmailRecuperacao } from './recuperacao.js';

export const ADMIN_INICIAL_ID = '00000000-0000-4000-8000-000000000001';
export const COOKIE = 'tatame_sessao';
const emailSchema = z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(180);
const senhaSchema = z.string().min(SENHA_MINIMA, `Use uma senha com pelo menos ${SENHA_MINIMA} caracteres.`).max(128, 'Use até 128 caracteres.')
  .refine(senha => senha === senha.trim(), 'Retire os espaços do início e do fim da senha.')
  .refine(senha => !senhaComum(senha), 'Essa senha é muito comum. Escolha outra.');
const loginSchema = z.object({ email: emailSchema, senha: z.string().min(1).max(128) }).strict();
const setupSchema = z.object({ nome: z.string().trim().min(2).max(120), email: emailSchema, senha: senhaSchema }).strict();
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const activationSchema = z.object({ token: tokenSchema, senha: senhaSchema }).strict();
const publicUser = ({ id, nome, email, perfil, alunoId }: Usuario): UsuarioView => ({ id, nome, email, perfil, alunoId });
export const usuarioAtual = (res: Response): UsuarioView => res.locals.usuario;

export function authModule(repo: Repository, options: { localAdmin?: boolean; emailRecuperacao?: EmailRecuperacao } = {}) {
  const router = Router();
  const emailRecuperacao = options.emailRecuperacao ?? configurarEmailRecuperacao(process.env);
  const capacidadeRecuperacao = emailRecuperacao ? { recuperacaoDisponivel: true } : {};
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
        if (user?.senhaHash && session.credencialHash === tokenHash(user.senhaHash) && usuarioHabilitado(user, await repo.list('Aluno'), await repo.list('ResponsavelAluno'))) {
          res.locals.usuario = publicUser(user); res.locals.sessao = session;
        }
      }
    }
    if (!res.locals.usuario && allowsLocalAdmin(req, options.localAdmin === true)) {
      const admin = await repo.get('Usuario', ADMIN_INICIAL_ID);
      if (admin?.perfil === 'admin' && admin.senhaHash) res.locals.usuario = publicUser(admin);
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
    return { configuracaoInicial: false, usuario: publicUser(user), ...capacidadeRecuperacao };
  }
  router.get('/estado', async (_req, res) => res.json({ configuracaoInicial: await isInitial(), usuario: res.locals.usuario ?? null, ...capacidadeRecuperacao }));
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
    if (!verified || !user || !usuarioHabilitado(user,await repo.list('Aluno'),await repo.list('ResponsavelAluno'))) throw new HttpError(401, 'E-mail ou senha inválidos, ou acesso indisponível.');
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
  if (emailRecuperacao) {
    router.post('/recuperar-senha', limit, async (req, res) => {
      const { email } = z.object({ email: emailSchema }).strict().parse(req.body);
      const inicio = performance.now();
      const token = newToken();
      try {
        if (await repo.reservarRecuperacao(email, tokenHash(token), new Date().toISOString())) {
          const link = new URL('/', emailRecuperacao.origem);
          link.hash = new URLSearchParams({ redefinir: token }).toString();
          await emailRecuperacao.enviar(email, link.href);
        }
      } catch {
        console.error('Falha ao processar solicitação de recuperação de senha.');
      }
      // Uniformiza a resposta para contas existentes, desconhecidas e reenvios.
      await esperar(Math.max(0, 1800 - (performance.now() - inicio)));
      res.sendStatus(202);
    });
    router.post('/validar-recuperacao', limit, async (req, res) => {
      const pedido = activationSchema.pick({ token: true }).safeParse(req.body);
      const valido = pedido.success && await repo.validarRecuperacao(tokenHash(pedido.data.token), new Date().toISOString());
      res.json({ valido });
    });
    router.post('/redefinir-senha', limit, async (req, res) => {
      const { token, senha } = activationSchema.parse(req.body);
      const novaSenha = await hashPassword(senha);
      if (!await repo.redefinirSenha(tokenHash(token), novaSenha, new Date().toISOString())) {
        throw new HttpError(400, 'Link inválido ou expirado. Solicite um novo e-mail.');
      }
      res.clearCookie(COOKIE, cookieOptions);
      res.sendStatus(204);
    });
  }
  router.post('/sair', async (_req, res) => {
    if (res.locals.sessao) await repo.remove('Sessao', res.locals.sessao.id);
    res.clearCookie(COOKIE, cookieOptions); res.status(204).end();
  });
  router.post('/alunos/:id/convite', requireLogin, requireAdmin, async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const aluno = await repo.get('Aluno', id);
    if (!aluno || aluno.situacao !== 'ativo') throw new HttpError(400, 'Selecione um aluno ativo e cadastrado.');
    if(aluno.acessoPrincipal==='responsavel'||!emailProprio(aluno.email))throw new HttpError(409,'O acesso está com o responsável. Use a seção Responsável e acesso na ficha do aluno.');
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
