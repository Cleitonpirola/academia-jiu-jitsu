import { it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import supertest from 'supertest';
import type { Aluno, Aula } from '@tatame/shared';
import { SqliteRepository } from './repository.js';
import { createApp, request } from './test-auth-helper.js';
import { ADMIN_INICIAL_ID, COOKIE } from './modules/auth/routes.js';
import { tokenHash } from './modules/auth/password.js';
import { saldoMensal } from './modules/planos/saldo-mensal.js';
import { today } from './domain.js';
import { migrateSqlite, sqliteMigrations } from './database/sqlite/migrate.js';

const now = () => new Date().toISOString();
const novoAluno = (): Aluno => ({ id: randomUUID(), nome: 'Aluno mensal fictício', telefone: '11900000000', email: randomUUID() + '@teste.invalid', dataNascimento: '2000-01-01', dataMatricula: '2020-01-01', faixa: 'Branca', situacao: 'ativo', criadoEm: now() });
const novaAula = (dataAula = today()): Aula => ({ id: randomUUID(), titulo: 'Treino mensal fictício', dataAula, horaInicio: '12:00', horaFim: '13:00', professor: 'Mestre', origem: 'extra', origemHorarioId: null, turmaId: null, turmaNome: null, situacao: 'agendada', motivoCancelamento: null, canceladaEm: null, criadoEm: now() });
async function fixture(limite: number | null = 2) {
  const repo = new SqliteRepository(':memory:'), app = createApp(repo), aluno = novoAluno(), userId = randomUUID(), token = 'm'.repeat(43);
  await repo.insert('Aluno', aluno);
  await repo.insert('Usuario', { id: userId, nome: aluno.nome, email: aluno.email, perfil: 'aluno', alunoId: aluno.id, senhaHash: 'fixture-mensal', conviteHash: null, conviteExpiraEm: null, criadoEm: now() });
  await repo.insert('Sessao', { id: randomUUID(), usuarioId: userId, tokenHash: tokenHash(token), credencialHash: tokenHash('fixture-mensal'), expiraEm: '2099-01-01T00:00:00.000Z', criadoEm: now() });
  const aulas = Array.from({ length: 4 }, () => novaAula()); for (const aula of aulas) await repo.insert('Aula', aula);
  await repo.saveSaldoMensalAluno(aluno.id, limite);
  const url = `/api/alunos/${aluno.id}/saldo-mensal`;
  const checkin = (index: number, body = {}) => supertest(app).put(`/api/portal/aulas/${aulas[index].id}/checkin`).set('Cookie', `${COOKIE}=${token}`).set('X-Tatame-Request', '1').send(body);
  const portal = () => supertest(app).get('/api/portal').set('Cookie', `${COOKIE}=${token}`);
  return { repo, app, aluno, aulas, token, url, checkin, portal };
}

it('desconta saldo persistido por novo check-in, não duplica e bloqueia ao esgotar', async () => {
  const f = await fixture(2);
  try {
    assert.equal((await f.repo.get('Aluno', f.aluno.id))!.aulasRestantesMes, 2);
    await f.checkin(0).expect(200); await f.checkin(0).expect(200);
    assert.equal((await f.repo.get('Aluno', f.aluno.id))!.aulasRestantesMes, 1);
    await f.checkin(1).expect(200);
    const denied = await f.checkin(2).expect(403); assert.equal(denied.body.message, 'O limite de aulas do mês já foi atingido.');
    await assert.rejects(f.repo.saveCheckin(f.aulas[2].id, f.aluno.id, now()), /limite de aulas do mês/);
    const aluno = (await f.repo.get('Aluno', f.aluno.id))!; assert.equal(aluno.aulasRestantesMes, 0); assert.equal(aluno.mesSaldoAulas, today().slice(0, 7));
    assert.equal((await f.repo.list('CheckinAula')).length, 2);
    const p = await f.portal().expect(200); assert.equal(p.body.saldoMensal.restantes, 0); assert.equal(p.body.saldoMensal.limiteAtingido, true);
  } finally { await f.repo.close(); }
});
it('duas aulas concorrentes disputam uma única vaga sem deixar saldo negativo', async () => {
  const f = await fixture(1);
  try {
    const results = await Promise.allSettled([f.repo.saveCheckin(f.aulas[0].id, f.aluno.id, now()), f.repo.saveCheckin(f.aulas[1].id, f.aluno.id, now())]);
    assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
    assert.equal((await f.repo.list('CheckinAula')).length, 1); assert.equal((await f.repo.get('Aluno', f.aluno.id))!.aulasRestantesMes, 0);
  } finally { await f.repo.close(); }
});
it('falha ao atualizar saldo reverte também a criação do check-in', async () => {
  const f = await fixture(1);
  try {
    f.repo.db.exec("CREATE TRIGGER falha_saldo BEFORE UPDATE OF aulasRestantesMes ON Aluno BEGIN SELECT RAISE(ABORT,'falha simulada no saldo'); END;");
    await assert.rejects(f.repo.saveCheckin(f.aulas[0].id, f.aluno.id, now()), /falha simulada/);
    assert.equal((await f.repo.list('CheckinAula')).length, 0); assert.equal((await f.repo.get('Aluno', f.aluno.id))!.aulasRestantesMes, 1);
  } finally { await f.repo.close(); }
});
it('cancelar aula devolve crédito uma única vez e mantém o aviso histórico', async () => {
  const f = await fixture(1);
  try {
    await f.checkin(0).expect(200);
    await f.repo.cancelAula(f.aulas[0].id, 'Cancelamento de teste', now()); await f.repo.cancelAula(f.aulas[0].id, 'Mesmo cancelamento', now());
    assert.equal((await f.repo.get('Aluno', f.aluno.id))!.aulasRestantesMes, 1);
    assert.equal((await f.repo.list('CheckinAula')).length, 1);
    await f.checkin(1).expect(200); await f.checkin(2).expect(403);
  } finally { await f.repo.close(); }
});
it('confirmação não desconta outra aula; ausência após check-in não devolve automaticamente', async () => {
  const f = await fixture(2);
  try {
    await f.checkin(0).expect(200); await f.repo.savePresencaAula(f.aulas[0].id, f.aluno.id, true, now());
    assert.equal((await f.repo.get('Aluno', f.aluno.id))!.aulasRestantesMes, 1);
    await f.repo.savePresencaAula(f.aulas[0].id, f.aluno.id, false, now());
    const p = await f.portal().expect(200); assert.equal(p.body.saldoMensal.restantes, 1);
  } finally { await f.repo.close(); }
});
it('ajustar limite preserva consumo; retirar limite mantém histórico e libera participação', async () => {
  const f = await fixture(2);
  try {
    await f.checkin(0).expect(200);
    let r = await request(f.app).put(f.url).send({ limiteMensal: 1 }).expect(200); assert.equal(r.body.restantes, 0);
    r = await request(f.app).put(f.url).send({ limiteMensal: 3 }).expect(200); assert.equal(r.body.restantes, 2);
    await request(f.app).put(f.url).send({ limiteMensal: null }).expect(200);
    await f.checkin(1).expect(200); await f.checkin(2).expect(200);
    const p = await f.portal().expect(200); assert.equal(p.body.saldoMensal.restantes, null); assert.equal(p.body.saldoMensal.utilizadas, 3);
    r = await request(f.app).put(f.url).send({ limiteMensal: 2 }).expect(200); assert.equal(r.body.restantes, 0);
  } finally { await f.repo.close(); }
});
it('aluno não edita saldo ou limite; payloads forjados e limites inválidos são recusados', async () => {
  const f = await fixture();
  try {
    await supertest(f.app).get(f.url).expect(401);
    await supertest(f.app).put(f.url).set('Cookie', `${COOKIE}=${f.token}`).set('X-Tatame-Request', '1').send({ limiteMensal: 1000 }).expect(403);
    await supertest(f.app).get(f.url).set('Cookie', `${COOKIE}=${f.token}`).expect(403);
    for (const limiteMensal of [0, -1, 1.5, 1001, '12']) await request(f.app).put(f.url).send({ limiteMensal }).expect(400);
    await request(f.app).put(f.url).send({ limiteMensal: 12, aulasRestantesMes: 999 }).expect(400);
    await f.checkin(0, { aulasRestantesMes: 999 }).expect(400);
    const { id, criadoEm, ...body } = f.aluno;
    await request(f.app).put(`/api/alunos/${id}`).send({ ...body, aulasRestantesMes: 999 }).expect(400);
    assert.equal((await f.repo.get('Aluno', f.aluno.id))!.aulasRestantesMes, 2);
  } finally { await f.repo.close(); }
});
it('cota semanal e débito continuam valendo; extra semanal não ultrapassa o mensal', async () => {
  const f = await fixture(1);
  try {
    await f.repo.savePlanoAluno(f.aluno.id, { nome: 'Uma por semana', limiteSemanal: 1 }, now());
    await f.checkin(0).expect(200);
    await f.repo.saveLiberacaoAula(f.aulas[1].id, f.aluno.id, ADMIN_INICIAL_ID, 'Extra de teste', now());
    await f.checkin(1).expect(403);
    await f.repo.saveSaldoMensalAluno(f.aluno.id, 3);
    await f.checkin(1).expect(200);
    await f.checkin(2).expect(403);
    await f.repo.savePlanoAluno(f.aluno.id, { nome: 'Sem cota semanal', limiteSemanal: null }, now());
    await f.repo.insert('Mensalidade', { id: randomUUID(), alunoId: f.aluno.id, competencia: '2020-01', valorCentavos: 10000, dataVencimento: '2020-01-10', dataPagamento: null, criadoEm: now() });
    await f.checkin(2).expect(403); assert.equal((await f.repo.get('Aluno', f.aluno.id))!.aulasRestantesMes, 1);
  } finally { await f.repo.close(); }
});
it('renova no dia 1, separa meses/anos e ignora outros alunos e aulas canceladas', () => {
  const aluno = { ...novoAluno(), limiteAulasMensal: 12, aulasRestantesMes: 0, mesSaldoAulas: '2026-10' };
  const a = novaAula('2026-10-31'), b = novaAula('2026-11-01'), c = { ...novaAula('2026-11-01'), situacao: 'cancelada' as const };
  const checks = [a, b, c].map(aula => ({ id: randomUUID(), aulaId: aula.id, alunoId: aluno.id, nome: aluno.nome, criadoEm: now() }));
  checks.push({ ...checks[1], id: randomUUID(), alunoId: randomUUID() });
  assert.equal(saldoMensal(aluno, [a,b,c], checks, '2026-10-31').restantes, 11);
  assert.equal(saldoMensal(aluno, [a,b,c], checks, '2026-11-01').restantes, 11);
  assert.equal(saldoMensal(aluno, [a,b,c], checks, '2027-01-01').restantes, 12);
});
it('primeiro check-in do mês substitui referência antiga e grava saldo do mês atual', async () => {
  const f = await fixture(3);
  try {
    await f.repo.update('Aluno', f.aluno.id, { mesSaldoAulas: '2020-01', aulasRestantesMes: 0 });
    await f.checkin(0).expect(200); const aluno = (await f.repo.get('Aluno', f.aluno.id))!;
    assert.equal(aluno.mesSaldoAulas, today().slice(0,7)); assert.equal(aluno.aulasRestantesMes, 2);
  } finally { await f.repo.close(); }
});
it('migração 7 preserva colunas anteriores e backup; saldo persiste após reabrir', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tatame-saldo-')), file = join(dir, 'teste.sqlite'), aluno = novoAluno();
  let repo: SqliteRepository | undefined; let old: DatabaseSync | undefined;
  try {
    old = new DatabaseSync(file); migrateSqlite(old, file, sqliteMigrations.slice(0,6));
    old.prepare('INSERT INTO Aluno VALUES (?,?,?,?,?,?,?,?,?)').run(aluno.id, aluno.nome, aluno.telefone, aluno.email, aluno.dataNascimento, aluno.faixa, aluno.dataMatricula, aluno.situacao, aluno.criadoEm);old.close();old=undefined;
    repo = new SqliteRepository(file); assert.deepEqual(repo.migration.applied,[7,8,9,10]); assert.ok(repo.migration.backupPath);
    assert.deepEqual(await repo.get('Aluno',aluno.id),{...aluno,faixaId:'00000000-0000-4000-8100-000000000001'});
    const fields = repo.db.prepare('SELECT limiteAulasMensal,aulasRestantesMes,mesSaldoAulas FROM Aluno WHERE id=?').get(aluno.id);
    assert.deepEqual({...fields},{limiteAulasMensal:null,aulasRestantesMes:null,mesSaldoAulas:null});
    const backup = new DatabaseSync(repo.migration.backupPath!,{readOnly:true});try{assert.equal(backup.prepare('SELECT MAX(version) v FROM _tatame_migrations').get()!.v,6);assert.equal(backup.prepare('PRAGMA table_info(Aluno)').all().length,9);}finally{backup.close();}
    await repo.saveSaldoMensalAluno(aluno.id,12);await repo.close();repo=new SqliteRepository(file);
    assert.deepEqual(repo.migration.applied,[]);assert.equal((await repo.get('Aluno',aluno.id))!.aulasRestantesMes,12);
    await assert.rejects(repo.update('Aluno',aluno.id,{aulasRestantesMes:-1}),/CHECK constraint/);
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(),[]);
  }finally{old?.close();if(repo)await repo.close();assert.equal(dirname(resolve(dir)),resolve(tmpdir()));assert.match(basename(dir),/^tatame-saldo-/);rmSync(dir,{recursive:true,force:true});}
});
