import { it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import supertest from 'supertest';
import type { Aula, PlanoAluno } from '@tatame/shared';
import { SqliteRepository } from './repository.js';
import { createApp, request } from './test-auth-helper.js';
import { ADMIN_INICIAL_ID, COOKIE } from './modules/auth/routes.js';
import { tokenHash } from './modules/auth/password.js';
import { today } from './domain.js';
import { semana, usoPlano, type ContextoPlano } from './modules/planos/rules.js';

const now = () => new Date().toISOString();
const aula = (dataAula = '2026-10-22'): Aula => ({ id: randomUUID(), titulo: 'Treino fictício', dataAula, horaInicio: '12:00', horaFim: '13:00', professor: 'Mestre', origem: 'extra', origemHorarioId: null, turmaId: null, turmaNome: null, situacao: 'agendada', motivoCancelamento: null, canceladaEm: null, criadoEm: now() });
const config = (limiteSemanal: number | null): PlanoAluno => ({ id: randomUUID(), alunoId: 'ana', nome: 'Plano teste', limiteSemanal, criadoEm: now(), atualizadoEm: now() });
const empty = (): ContextoPlano => ({ plano: null, aulas: [], checkins: [], chamada: [], antigas: [], liberacoes: [] });
const check = (aulaId: string, alunoId = 'ana') => ({ id: randomUUID(), aulaId, alunoId, nome: 'Ana', criadoEm: now() });
const mark = (aulaId: string, presente = true, alunoId = 'ana') => ({ ...check(aulaId, alunoId), presente, atualizadoEm: now() });

it('a semana vai de segunda a domingo, incluindo troca de mês e ano', () => {
  assert.deepEqual(semana('2026-10-25'), { inicioSemana: '2026-10-19', fimSemana: '2026-10-25' });
  assert.deepEqual(semana('2026-10-26'), { inicioSemana: '2026-10-26', fimSemana: '2026-11-01' });
  assert.deepEqual(semana('2027-01-01'), { inicioSemana: '2026-12-28', fimSemana: '2027-01-03' });
});
it('sem configuração mantém ilimitado e não altera os dados de origem', () => {
  const ctx = empty(), before = structuredClone(ctx), uso = usoPlano(ctx, 'ana', '2026-10-22');
  assert.equal(uso.nome, 'Ilimitado'); assert.equal(uso.restantes, null); assert.equal(uso.limiteAtingido, false); assert.deepEqual(ctx, before);
});
it('check-in e confirmação da mesma aula contam uma vez, e vários horários contam separadamente', () => {
  const a = aula(), b = aula(); const ctx = { ...empty(), plano: config(3), aulas: [a, b], checkins: [check(a.id), check(b.id)], chamada: [mark(a.id)] };
  const uso = usoPlano(ctx, 'ana', '2026-10-22'); assert.equal(uso.utilizadas, 2); assert.equal(uso.restantes, 1);
});
it('ausência e aula cancelada liberam cota; outros alunos e semanas ficam fora', () => {
  const a = aula(), b = { ...aula(), situacao: 'cancelada' as const }, c = aula('2026-10-26'), d = aula();
  const ctx = { ...empty(), plano: config(1), aulas: [a, b, c, d], checkins: [check(a.id), check(b.id), check(c.id), check(d.id, 'bruno')], chamada: [mark(a.id, false)] };
  assert.equal(usoPlano(ctx, 'ana', '2026-10-22').utilizadas, 0);
});
it('presença manual e registros antigos presentes contam; ausências antigas não contam', () => {
  const a = aula(); const ctx = { ...empty(), plano: config(2), aulas: [a], chamada: [mark(a.id)], antigas: [
    { id: 'p1', alunoId: 'ana', dataTreino: '2026-10-19', tipoTreino: 'Com kimono', presente: true },
    { id: 'p2', alunoId: 'ana', dataTreino: '2026-10-20', tipoTreino: 'Sem kimono', presente: false },
  ] };
  const uso = usoPlano(ctx, 'ana', '2026-10-22'); assert.equal(uso.utilizadas, 2); assert.equal(uso.limiteAtingido, true);
});
it('extra usada aparece separada da cota e autorização é nominal e para uma aula', () => {
  const a = aula(), b = aula(), c = aula(); const ctx = { ...empty(), plano: config(1), aulas: [a, b, c], checkins: [check(a.id), check(b.id)], liberacoes: [
    { id: 'l1', aulaId: b.id, alunoId: 'ana', motivo: 'Reposição', usuarioId: 'admin', criadoEm: now() },
    { id: 'l2', aulaId: c.id, alunoId: 'bruno', motivo: 'Reposição', usuarioId: 'admin', criadoEm: now() },
  ] };
  const uso = usoPlano(ctx, 'ana', '2026-10-22'); assert.equal(uso.utilizadas, 1); assert.equal(uso.extrasUtilizadas, 1); assert.deepEqual(uso.aulasLiberadas, [b.id]);
});

async function fixture(limite: number | null = null) {
  const repo = new SqliteRepository(':memory:'), app = createApp(repo), id = randomUUID(), token = 'a'.repeat(43), userId = randomUUID();
  await repo.insert('Aluno', { id, nome: 'Ana Fictícia', email: 'ana@teste.invalid', telefone: '11999991234', dataNascimento: '2000-01-01', dataMatricula: '2020-01-01', faixa: 'Branca', situacao: 'ativo', criadoEm: now() });
  await repo.insert('Usuario', { id: userId, nome: 'Ana', email: 'ana@teste.invalid', perfil: 'aluno', alunoId: id, senhaHash: 'hash-exclusivo-fixture', conviteHash: null, conviteExpiraEm: null, criadoEm: now() });
  await repo.insert('Sessao', { id: randomUUID(), usuarioId: userId, tokenHash: tokenHash(token), credencialHash: tokenHash('hash-exclusivo-fixture'), expiraEm: '2099-01-01T00:00:00.000Z', criadoEm: now() });
  const aulas = Array.from({ length: 5 }, (_, i) => ({ ...aula(today()), titulo: `Treino ${i + 1}`, horaInicio: `${12 + i}:00`, horaFim: `${13 + i}:00` }));
  for (const row of aulas) await repo.insert('Aula', row);
  if (limite !== null) await repo.savePlanoAluno(id, { nome: 'Essencial', limiteSemanal: limite }, now());
  const aluno = () => supertest(app).put(`/api/portal/aulas/${aulas[0].id}/checkin`);
  const checkin = (index: number) => supertest(app).put(`/api/portal/aulas/${aulas[index].id}/checkin`).set('Cookie', `${COOKIE}=${token}`).set('X-Tatame-Request', '1').send({});
  const portal = () => supertest(app).get('/api/portal').set('Cookie', `${COOKIE}=${token}`);
  return { repo, app, id, aulas, token, checkin, portal, aluno };
}

it('somente administração configura plano e libera extras; valida limites e payload estrito', async () => {
  const f = await fixture();
  try {
    const url = `/api/alunos/${f.id}/plano`;
    await supertest(f.app).get(url).expect(401);
    await supertest(f.app).put(url).set('Cookie', `${COOKIE}=${f.token}`).set('X-Tatame-Request', '1').send({ nome: 'Forjado', limiteSemanal: 100 }).expect(403);
    for (const limiteSemanal of [0, -1, 1.5, 101, '3']) await request(f.app).put(url).send({ nome: 'Inválido', limiteSemanal }).expect(400);
    await request(f.app).put(url).send({ nome: 'Plano', limiteSemanal: 3, alunoId: randomUUID() }).expect(400);
    await request(f.app).put(url).send({ nome: '  Essencial  ', limiteSemanal: 3 }).expect(200);
    const response = await request(f.app).get(url).expect(200); assert.equal(response.body.uso.nome, 'Essencial'); assert.equal(response.body.uso.restantes, 3);
    await supertest(f.app).put(`/api/alunos/${f.id}/liberacoes/${f.aulas[0].id}`).set('Cookie', `${COOKIE}=${f.token}`).set('X-Tatame-Request', '1').send({ motivo: 'Forjada' }).expect(403);
  } finally { await f.repo.close(); }
});
it('cota limita check-in, repetição é idempotente e alteração de plano não zera uso', async () => {
  const f = await fixture(1);
  try {
    await f.checkin(0).expect(200); await f.checkin(0).expect(200); await f.checkin(1).expect(403);
    await assert.rejects(f.repo.saveCheckin(f.aulas[1].id, f.id, now()), /limite semanal/);
    let p = await f.portal().expect(200); assert.equal(p.body.plano.utilizadas, 1); assert.equal(p.body.plano.limiteAtingido, true);
    await request(f.app).put(`/api/alunos/${f.id}/plano`).send({ nome: 'Duas aulas', limiteSemanal: 2 }).expect(200);
    p = await f.portal().expect(200); assert.equal(p.body.plano.utilizadas, 1); assert.equal(p.body.plano.restantes, 1);
    await f.checkin(1).expect(200); await f.checkin(2).expect(403);
    await request(f.app).put(`/api/alunos/${f.id}/plano`).send({ nome: 'Ilimitado', limiteSemanal: null }).expect(200);
    await f.checkin(2).expect(200); assert.equal((await f.repo.list('PlanoAluno')).length, 1);
    assert.equal((await f.repo.list('Mensalidade')).length, 0);
  } finally { await f.repo.close(); }
});
it('duas tentativas concorrentes disputam a última vaga sem ultrapassar a cota', async () => {
  const f = await fixture(1);
  try {
    const responses = await Promise.all([f.checkin(0), f.checkin(1)]);
    assert.deepEqual(responses.map(item => item.status).sort(), [200, 403]); assert.equal((await f.repo.list('CheckinAula')).length, 1);
  } finally { await f.repo.close(); }
});
it('ausência explícita e cancelamento liberam vaga; presença confirmada não duplica', async () => {
  const f = await fixture(1);
  try {
    await f.checkin(0).expect(200); await f.repo.savePresencaAula(f.aulas[0].id, f.id, true, now());
    assert.equal((await f.portal()).body.plano.utilizadas, 1);
    await f.repo.savePresencaAula(f.aulas[0].id, f.id, false, now()); await f.checkin(1).expect(200);
    await f.repo.cancelAula(f.aulas[1].id, 'Cancelamento de teste', now()); await f.checkin(2).expect(200);
    assert.equal((await f.portal()).body.plano.utilizadas, 1);
  } finally { await f.repo.close(); }
});
it('liberação vale só para uma aula, pode ser revogada antes de usada e preserva depois', async () => {
  const f = await fixture(1);
  try {
    const url = (index: number) => `/api/alunos/${f.id}/liberacoes/${f.aulas[index].id}`;
    await request(f.app).put(url(1)).send({ motivo: 'Antes da cota' }).expect(409);
    await f.checkin(0).expect(200);
    await request(f.app).put(url(1)).send({ motivo: 'Reposição autorizada' }).expect(200);
    await request(f.app).put(url(1)).send({ motivo: 'Repetição' }).expect(200); assert.equal((await f.repo.list('LiberacaoAula')).length, 1);
    await f.checkin(2).expect(403); await f.checkin(1).expect(200);
    const p = await f.portal(); assert.equal(p.body.plano.utilizadas, 1); assert.equal(p.body.plano.extrasUtilizadas, 1);
    await request(f.app).delete(url(1)).expect(409); await request(f.app).delete(`/api/aulas/${f.aulas[1].id}`).expect(409);
    await request(f.app).put(url(3)).send({ motivo: 'Autorização disponível' }).expect(200);
    await request(f.app).delete(`/api/aulas/${f.aulas[3].id}`).expect(409);
    await request(f.app).delete(url(3)).expect(204); await f.checkin(3).expect(403);
    const gestao = await request(f.app).get(`/api/alunos/${f.id}/plano`); assert.equal(gestao.body.liberacoes[0].utilizada, true);
    assert.equal(gestao.body.liberacoes[0].usuarioId, ADMIN_INICIAL_ID); assert.equal((await f.repo.list('Mensalidade')).length, 0);
  } finally { await f.repo.close(); }
});
it('extra não ignora dívida e portal restrito continua sem expor plano ou agenda', async () => {
  const f = await fixture(1);
  try {
    await f.checkin(0).expect(200); await request(f.app).put(`/api/alunos/${f.id}/liberacoes/${f.aulas[1].id}`).send({ motivo: 'Aula extra' }).expect(200);
    await f.repo.insert('Mensalidade', { id: randomUUID(), alunoId: f.id, competencia: '2025-01', valorCentavos: 15000, dataVencimento: '2025-01-10', dataPagamento: null, criadoEm: now() });
    await f.checkin(1).expect(403); const p = await f.portal().expect(200); assert.equal(p.body.bloqueado, true); assert.equal(p.body.plano, undefined);
  } finally { await f.repo.close(); }
});
it('autorizações recusam futuro, cancelada, aluno inativo e chamada já feita', async () => {
  const f = await fixture(1);
  try {
    await f.checkin(0).expect(200);
    const url = `/api/alunos/${f.id}/liberacoes/${f.aulas[1].id}`;
    await f.repo.update('Aula', f.aulas[1].id, { dataAula: '2099-01-01' }); await request(f.app).put(url).send({ motivo: 'Futura' }).expect(400);
    await f.repo.update('Aula', f.aulas[1].id, { dataAula: today(), situacao: 'cancelada', motivoCancelamento: 'Teste', canceladaEm: now() }); await request(f.app).put(url).send({ motivo: 'Cancelada' }).expect(409);
    await f.repo.update('Aula', f.aulas[1].id, { situacao: 'agendada', motivoCancelamento: null, canceladaEm: null }); await f.repo.update('Aluno', f.id, { situacao: 'inativo' }); await request(f.app).put(url).send({ motivo: 'Inativo' }).expect(403);
    await f.repo.update('Aluno', f.id, { situacao: 'ativo' }); await f.repo.savePresencaAula(f.aulas[1].id, f.id, true, now()); await request(f.app).put(url).send({ motivo: 'Já presente' }).expect(409);
  } finally { await f.repo.close(); }
});
it('portal entrega só o plano e IDs das autorizações do próprio aluno', async () => {
  const f = await fixture();
  try {
    const other = { ...(await f.repo.get('Aluno', f.id))!, id: randomUUID(), email: 'outro@teste.invalid', nome: 'Outro aluno' };
    await f.repo.insert('Aluno', other); await f.repo.savePlanoAluno(other.id, { nome: 'Plano secreto de outro', limiteSemanal: 1 }, now());
    const p = await f.portal().expect(200); assert.equal(p.body.plano.nome, 'Ilimitado'); assert.equal(JSON.stringify(p.body).includes('Plano secreto'), false);
  } finally { await f.repo.close(); }
});
