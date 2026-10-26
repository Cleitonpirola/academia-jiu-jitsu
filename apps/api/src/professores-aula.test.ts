import { it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import supertest from 'supertest';
import { createApp, request } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';
import { migrateSqlite, sqliteMigrations } from './database/sqlite/migrate.js';
import { today } from './domain.js';
import { COOKIE } from './modules/auth/routes.js';
import { tokenHash } from './modules/auth/password.js';

async function fixture() {
  const repo = new SqliteRepository(':memory:'), app = createApp(repo), alunoId = randomUUID(), userId = randomUUID(), token = 'p'.repeat(43), now = new Date().toISOString();
  await repo.insert('Aluno', { id: alunoId, nome: 'Aluno fictício', telefone: '11900000000', email: 'professores@teste.invalid', faixa: 'Branca', situacao: 'ativo', dataNascimento: '2000-01-01', dataMatricula: '2020-01-01', criadoEm: now });
  await repo.insert('Usuario', { id: userId, nome: 'Aluno', email: 'professores@teste.invalid', perfil: 'aluno', alunoId, senhaHash: 'fixture', conviteHash: null, conviteExpiraEm: null, criadoEm: now });
  await repo.insert('Sessao', { id: randomUUID(), usuarioId: userId, tokenHash: tokenHash(token), credencialHash: tokenHash('fixture'), expiraEm: '2099-01-01T00:00:00.000Z', criadoEm: now });
  const turma = (await request(app).post('/api/turmas').send({ nome: 'Turma fictícia', professor: 'Professor original', situacao: 'ativo', alunoIds: [alunoId], horarios: ['12:00','15:00'].map(horaInicio => ({ diaSemana: new Date(today() + 'T12:00:00Z').getUTCDay(), horaInicio, horaFim: String(Number(horaInicio.slice(0,2))+1).padStart(2,'0')+':00' })) }).expect(201)).body;
  const aulas = []; for (const horario of turma.horarios) aulas.push((await request(app).post('/api/aulas/da-grade').send({ horarioId: horario.id, dataAula: today() }).expect(201)).body);
  return { repo, app, alunoId, turma, aulas, token, now, path: `/api/aulas/${aulas[0].id}/professores` };
}
it('aula herda professor e aceita vários nomes somente no encontro escolhido, sem alterar a chamada ou check-in', async () => {
  const f = await fixture(); try {
    assert.deepEqual(f.aulas[0].professores, ['Professor original']);
    await f.repo.saveCheckin(f.aulas[0].id, f.alunoId, f.now); await f.repo.savePresencaAula(f.aulas[0].id, f.alunoId, true, f.now);
    const antes = (await request(f.app).get('/api/aulas/' + f.aulas[0].id).expect(200)).body;
    const r = await request(f.app).patch(f.path).send({ professores: ['  Mestre Ana  ', 'Professor Bruno'] }).expect(200);
    assert.deepEqual(r.body, { ...antes, professor: 'Mestre Ana · Professor Bruno', professores: ['Mestre Ana', 'Professor Bruno'] });
    assert.equal((await f.repo.get('Turma', f.turma.id))!.professor, 'Professor original');
    assert.deepEqual((await request(f.app).get('/api/aulas/' + f.aulas[1].id).expect(200)).body, f.aulas[1]);
    const portal = await supertest(f.app).get('/api/portal').set('Cookie', `${COOKIE}=${f.token}`).expect(200);
    assert.equal(portal.body.aulas.find((a: { id: string }) => a.id === f.aulas[0].id).professor, 'Mestre Ana · Professor Bruno');
    assert.deepEqual((await request(f.app).patch(f.path).send({ professores: ['Mestre Ana'] }).expect(200)).body.professores, ['Mestre Ana']);
  } finally { await f.repo.close(); }
});
it('rejeita lista vazia, duplicados normalizados, excesso, nomes inválidos e campos indevidos', async () => {
  const f = await fixture(); try {
    for (const professores of [[], ['A'], [' '], ['A'.repeat(121)], ['Mestre Ána', 'mestre ana'], ['Ana Silva', 'ana  silva'], Array.from({ length: 9 }, (_, i) => 'Professor ' + i), 'Professor']) await request(f.app).patch(f.path).send({ professores }).expect(400);
    await request(f.app).patch(f.path).send({ professores: ['Professor'], situacao: 'cancelada' }).expect(400);
    assert.deepEqual((await request(f.app).get('/api/aulas/' + f.aulas[0].id).expect(200)).body, f.aulas[0]);
  } finally { await f.repo.close(); }
});
it('somente administrador edita professores e IDs desconhecidos não gravam dados', async () => {
  const f = await fixture(); try {
    await supertest(f.app).patch(f.path).set('X-Tatame-Request', '1').send({ professores: ['Novo professor'] }).expect(401);
    await supertest(f.app).patch(f.path).set('X-Tatame-Request', '1').set('Cookie', `${COOKIE}=${f.token}`).send({ professores: ['Novo professor'] }).expect(403);
    for (const id of ['invalido', randomUUID()]) await request(f.app).patch(`/api/aulas/${id}/professores`).send({ professores: ['Professor'] }).expect(404);
    assert.equal((await f.repo.list('AulaProfessor')).length, 2);
  } finally { await f.repo.close(); }
});
it('falha ao salvar resumo reverte lista e concorrência mantém uma lista completa', async () => {
  const f = await fixture(); try {
    const antes = await f.repo.list('AulaProfessor');
    f.repo.db.exec("CREATE TRIGGER FalhaProf BEFORE UPDATE OF professor ON Aula BEGIN SELECT RAISE(ABORT,'Falha simulada'); END;");
    await assert.rejects(f.repo.saveProfessoresAula(f.aulas[0].id, ['Ana', 'Bruno']), /Falha simulada/);
    assert.deepEqual(await f.repo.list('AulaProfessor'), antes); f.repo.db.exec('DROP TRIGGER FalhaProf');
    await Promise.all([['Ana', 'Bruno'], ['Carlos', 'Dora']].map(professores => request(f.app).patch(f.path).send({ professores }).expect(200)));
    const final = (await request(f.app).get('/api/aulas/' + f.aulas[0].id).expect(200)).body;
    assert.ok(['Ana · Bruno', 'Carlos · Dora'].includes(final.professor)); assert.equal(final.professor, final.professores.join(' · '));
  } finally { await f.repo.close(); }
});
it('migração 11 preserva todas as tabelas anteriores e mantém nome histórico sem separar por vírgula', () => {
  const db = new DatabaseSync(':memory:'); try {
    db.exec('PRAGMA foreign_keys=ON'); migrateSqlite(db, undefined, sqliteMigrations.slice(0,10));
    const id = randomUUID(); db.prepare('INSERT INTO Aula VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, 'Histórica', today(), '12:00', '13:00', 'Professor antigo, sem separar', 'extra', null, null, null, 'agendada', null, null, '2026-01-01');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='_tatame_migrations' ORDER BY name").all().map(r => String(r.name));
    const snapshot = () => tables.map(table => db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()); const antes = snapshot();
    assert.deepEqual(migrateSqlite(db).applied, [11]); assert.deepEqual(snapshot(), antes);
    assert.deepEqual({...db.prepare('SELECT * FROM AulaProfessor').get()}, { id, aulaId: id, nome: 'Professor antigo, sem separar', ordem: 0 });
    assert.deepEqual(migrateSqlite(db).applied, []); assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { db.close(); }
});
