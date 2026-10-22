// Fixture exclusiva dos testes: não é importada pelo servidor nem desliga autenticação.
import supertest from 'supertest';
import { createApp as realCreateApp } from './app.js';
import { SqliteRepository } from './repository.js';
import { ADMIN_INICIAL_ID, COOKIE } from './modules/auth/routes.js';
import { tokenHash } from './modules/auth/password.js';

const token = 't'.repeat(43);
export const request = ((app: Parameters<typeof supertest>[0]) => {
  const client = supertest(app);
  return new Proxy(client, {
    get(target, property, receiver) {
      const original = Reflect.get(target, property, receiver);
      if (['get','post','put','patch','delete','head','options'].includes(String(property))) {
        return (...args: unknown[]) => (Reflect.apply(original, target, args) as ReturnType<typeof client.get>).set('Cookie', `${COOKIE}=${token}`).set('X-Tatame-Request', '1');
      }
      return original;
    },
  });
}) as typeof supertest;
export function createApp(repo: SqliteRepository, options: Parameters<typeof realCreateApp>[1] = {}) {
  repo.db.prepare('INSERT OR IGNORE INTO Usuario (id,nome,email,perfil,alunoId,senhaHash,conviteHash,conviteExpiraEm,criadoEm) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(ADMIN_INICIAL_ID, 'Administrador de teste', 'admin@teste.invalid', 'admin', null, 'fixture-sem-login-por-senha', null, null, '2026-01-01T00:00:00.000Z');
  repo.db.prepare('INSERT OR IGNORE INTO Sessao (id,usuarioId,tokenHash,credencialHash,expiraEm,criadoEm) VALUES (?,?,?,?,?,?)')
    .run('00000000-0000-4000-8000-000000000002', ADMIN_INICIAL_ID, tokenHash(token), tokenHash('fixture-sem-login-por-senha'), '2099-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
  return realCreateApp(repo, options);
}
