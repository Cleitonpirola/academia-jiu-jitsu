import { it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import supertest from 'supertest';
import type { Aula } from '@tatame/shared';
import { createApp, request } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';
import { today } from './domain.js';
import { COOKIE } from './modules/auth/routes.js';
import { tokenHash } from './modules/auth/password.js';

const now = () => new Date().toISOString();
async function fixture() {
  const repo = new SqliteRepository(':memory:'), app = createApp(repo), alunoId = randomUUID(), token = 'r'.repeat(43), userId = randomUUID();
  await repo.insert('Aluno', { id: alunoId, nome: 'Aluno confirmado fictício', telefone: '11900000000', email: 'confirmado@teste.invalid', dataNascimento: '2000-01-01', dataMatricula: '2020-01-01', faixa: 'Branca', situacao: 'ativo', criadoEm: now() });
  await repo.insert('Usuario', { id: userId, nome: 'Aluno', email: 'confirmado@teste.invalid', perfil: 'aluno', alunoId, senhaHash: 'fixture', conviteHash: null, conviteExpiraEm: null, criadoEm: now() });
  await repo.insert('Sessao', { id: randomUUID(), usuarioId: userId, tokenHash: tokenHash(token), credencialHash: tokenHash('fixture'), expiraEm: '2099-01-01T00:00:00.000Z', criadoEm: now() });
  const aulas: Aula[] = ['12:00', '15:00'].map(horaInicio => ({ id: randomUUID(), titulo: 'Treino fictício', dataAula: today(), horaInicio, horaFim: '16:00', professor: 'Professor', origem: 'grade', origemHorarioId: randomUUID(), turmaId: null, turmaNome: null, situacao: 'agendada', motivoCancelamento: null, canceladaEm: null, criadoEm: now() }));
  for (const aula of aulas) await repo.createAula(aula, []);
  await repo.saveSaldoMensalAluno(alunoId, 2); await repo.savePlanoAluno(alunoId, { nome: 'Duas aulas', limiteSemanal: 2 }, now());
  const path = `/api/aulas/${aulas[0].id}/checkins/${alunoId}`;
  return { repo, app, alunoId, aulas, path, token };
}

it('remoção administrativa registra ausência, devolve um crédito e preserva outro encontro', async () => {
  const f = await fixture(); try {
    const primeiro = await f.repo.saveCheckin(f.aulas[0].id, f.alunoId, now()), outro = await f.repo.saveCheckin(f.aulas[1].id, f.alunoId, now());
    assert.equal((await f.repo.get('Aluno', f.alunoId))!.aulasRestantesMes, 0);
    await request(f.app).delete(f.path).expect(204);
    assert.equal(await f.repo.get('CheckinAula', primeiro.id), null); assert.deepEqual(await f.repo.get('CheckinAula', outro.id), outro);
    const chamada = await f.repo.list('PresencaAula'); assert.equal(chamada.length, 1); assert.equal(chamada[0].presente, false); assert.equal(chamada[0].nome, primeiro.nome);
    assert.equal((await f.repo.get('Aluno', f.alunoId))!.aulasRestantesMes, 1);
    const portal = await supertest(f.app).get('/api/portal').set('Cookie', `${COOKIE}=${f.token}`).expect(200);
    assert.equal(portal.body.plano.utilizadas, 1); assert.equal(portal.body.saldoMensal.restantes, 1);
    await assert.rejects(f.repo.saveCheckin(f.aulas[0].id, f.alunoId, now()), /já foi avaliada/);
  } finally { await f.repo.close(); }
});
it('repetições concorrentes não duplicam ausência nem devolvem mais créditos', async () => {
  const f = await fixture(); try {
    await f.repo.saveCheckin(f.aulas[0].id, f.alunoId, now());
    await Promise.all([request(f.app).delete(f.path).expect(204), request(f.app).delete(f.path).expect(204)]);
    assert.equal((await f.repo.get('Aluno', f.alunoId))!.aulasRestantesMes, 2); assert.equal((await f.repo.list('PresencaAula')).length, 1);
    const antes = await f.repo.list('PresencaAula'); await request(f.app).delete(f.path).expect(204); assert.deepEqual(await f.repo.list('PresencaAula'), antes);
  } finally { await f.repo.close(); }
});
it('corrige presença para ausência no mesmo registro e permite correção posterior pelo professor', async () => {
  const f = await fixture(); try {
    await f.repo.saveCheckin(f.aulas[0].id, f.alunoId, now());
    const before = (await f.repo.savePresencaAula(f.aulas[0].id, f.alunoId, true, now())).registro;
    await request(f.app).delete(f.path).expect(204); const after = (await f.repo.list('PresencaAula'))[0];
    assert.equal(after.id, before.id); assert.equal(after.criadoEm, before.criadoEm); assert.equal(after.presente, false);
    await request(f.app).put(`/api/aulas/${f.aulas[0].id}/chamada/${f.alunoId}`).send({ presente: true }).expect(200);
    assert.equal((await f.repo.list('PresencaAula'))[0].presente, true);
  } finally { await f.repo.close(); }
});
it('exige administrador e IDs válidos, preservando o check-in em recusas', async () => {
  const f = await fixture(); try {
    const checkin = await f.repo.saveCheckin(f.aulas[0].id, f.alunoId, now());
    await supertest(f.app).delete(f.path).set('X-Tatame-Request', '1').expect(401);
    await supertest(f.app).delete(f.path).set('X-Tatame-Request', '1').set('Cookie', `${COOKIE}=${f.token}`).expect(403);
    for (const path of [`/api/aulas/invalida/checkins/${f.alunoId}`, `/api/aulas/${f.aulas[0].id}/checkins/invalido`, `/api/aulas/${randomUUID()}/checkins/${f.alunoId}`]) await request(f.app).delete(path).expect(404);
    assert.deepEqual(await f.repo.get('CheckinAula', checkin.id), checkin);
    await f.repo.cancelAula(f.aulas[0].id, 'Cancelada pelo professor', now()); await request(f.app).delete(f.path).expect(409);
    assert.deepEqual(await f.repo.get('CheckinAula', checkin.id), checkin);
  } finally { await f.repo.close(); }
});
it('falha no saldo reverte remoção e ausência integralmente', async () => {
  const f = await fixture(); try {
    const checkin = await f.repo.saveCheckin(f.aulas[0].id, f.alunoId, now());
    f.repo.db.exec("CREATE TRIGGER FalhaSaldoRemocao BEFORE UPDATE ON Aluno BEGIN SELECT RAISE(ABORT,'Falha simulada'); END;");
    await assert.rejects(f.repo.removeCheckin(f.aulas[0].id, f.alunoId, now()), /Falha simulada/);
    assert.deepEqual(await f.repo.get('CheckinAula', checkin.id), checkin); assert.deepEqual(await f.repo.list('PresencaAula'), []);
    assert.equal((await f.repo.get('Aluno', f.alunoId))!.aulasRestantesMes, 1);
  } finally { await f.repo.close(); }
});
