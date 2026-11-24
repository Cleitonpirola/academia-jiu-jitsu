import { afterEach, beforeEach, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import supertest from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { createApp, request } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';
import { migrateSqlite, sqliteMigrations } from './database/sqlite/migrate.js';
import { COOKIE } from './modules/auth/routes.js';
import { tokenHash } from './modules/auth/password.js';

let repo: SqliteRepository, app: ReturnType<typeof createApp>;
beforeEach(() => { repo = new SqliteRepository(':memory:'); app = createApp(repo, { apiKey: '' }); });
afterEach(() => repo.close());
const horario = { diaSemana: 1, horaInicio: '12:00', horaFim: '13:00' };
const turmaInput = { nome: 'Treino com local opcional', professor: 'Mestre de teste', situacao: 'ativo', alunoIds: [], horarios: [horario] };

it('salva, altera e remove a cidade opcional sem reescrever a aula já publicada', async () => {
  const turma = (await request(app).post('/api/turmas').send({ ...turmaInput, horarios: [{ ...horario, cidade: '  São João  ' }] }).expect(201)).body;
  const horarioId = turma.horarios[0].id;
  assert.equal(turma.horarios[0].cidade, 'São João');
  const aula = (await request(app).post('/api/aulas/da-grade').send({ horarioId, dataAula: '2026-10-19' }).expect(201)).body;
  assert.equal(aula.cidade, 'São João');
  const alterada = (await request(app).put('/api/turmas/' + turma.id).send({ ...turmaInput, horarios: [{ ...horario, cidade: 'Aguaí' }] }).expect(200)).body;
  assert.equal(alterada.horarios[0].id, horarioId);
  assert.equal((await request(app).post('/api/aulas/da-grade').send({ horarioId, dataAula: '2026-10-19' }).expect(200)).body.cidade, 'São João');
  assert.equal((await request(app).post('/api/aulas/da-grade').send({ horarioId, dataAula: '2026-10-26' }).expect(201)).body.cidade, 'Aguaí');
  for (const cidade of ['', '   ', null, undefined]) {
    const resposta = await request(app).put('/api/turmas/' + turma.id).send({ ...turmaInput, horarios: [{ ...horario, ...(cidade === undefined ? {} : { cidade }) }] }).expect(200);
    assert.equal(resposta.body.horarios[0].cidade, null);
  }
  assert.equal((await request(app).get('/api/aulas/' + aula.id).expect(200)).body.cidade, 'São João');
  await request(app).post('/api/turmas').send({ ...turmaInput, horarios: [{ ...horario, cidade: 'X'.repeat(81) }] }).expect(400);
  await request(app).post('/api/turmas').send({ ...turmaInput, horarios: [{ ...horario, cidade: 42 }] }).expect(400);
});

it('aceita horários extras com ou sem cidade e protege o reenvio com local diferente', async () => {
  const turma = (await request(app).post('/api/turmas').send(turmaInput).expect(201)).body;
  const input = { id: randomUUID(), turmaId: turma.id, titulo: 'Encontro extra', dataAula: '2026-10-22', horaInicio: '17:00', horaFim: '18:00' };
  const extra = (await request(app).post('/api/aulas/personalizadas').send({ ...input, cidade: 'Aguaí' }).expect(201)).body;
  assert.equal(extra.cidade, 'Aguaí');
  await request(app).post('/api/aulas/personalizadas').send({ ...input, cidade: '  Aguaí ' }).expect(200);
  await request(app).post('/api/aulas/personalizadas').send({ ...input, cidade: 'São João' }).expect(409);
  assert.equal((await request(app).post('/api/aulas/personalizadas').send({ ...input, id: randomUUID() }).expect(201)).body.cidade, null);
  await request(app).post('/api/aulas/personalizadas').send({ ...input, id: randomUUID(), cidade: 'X'.repeat(81) }).expect(400);
});

it('o portal do aluno recebe a cidade da aula e não a cidade atual da grade', async () => {
  const alunoId = randomUUID(), usuarioId = randomUUID(), token = 'cidade-portal-'.padEnd(43, 'x');
  await repo.insert('Aluno', { id: alunoId, nome: 'Aluno do local', telefone: '', email: 'cidade@teste.invalid', faixa: 'Branca', dataNascimento: '2000-01-01', dataMatricula: '2026-01-01', situacao: 'ativo', criadoEm: new Date().toISOString() });
  await repo.insert('Usuario', { id: usuarioId, alunoId, nome: 'Aluno do local', email: 'cidade@teste.invalid', perfil: 'aluno', senhaHash: 'hash-de-fixture', conviteHash: null, conviteExpiraEm: null, criadoEm: new Date().toISOString() });
  await repo.insert('Sessao', { id: randomUUID(), usuarioId, tokenHash: tokenHash(token), credencialHash: tokenHash('hash-de-fixture'), criadoEm: new Date().toISOString(), expiraEm: new Date(Date.now() + 3600000).toISOString() });
  const turma = (await request(app).post('/api/turmas').send({ ...turmaInput, horarios: [{ ...horario, cidade: 'São João' }] }).expect(201)).body;
  await request(app).post('/api/aulas/da-grade').send({ horarioId: turma.horarios[0].id, dataAula: '2026-10-19' }).expect(201);
  await request(app).put('/api/turmas/' + turma.id).send({ ...turmaInput, horarios: [{ ...horario, cidade: 'Aguaí' }] }).expect(200);
  const portal = (await supertest(app).get('/api/portal').set('Cookie', `${COOKIE}=${token}`).expect(200)).body;
  assert.equal(portal.aulas[0].cidade, 'São João');
  await supertest(app).post('/api/turmas').set('Cookie', `${COOKIE}=${token}`).set('X-Tatame-Request', '1').send(turmaInput).expect(403);
});

it('migra a grade e a aula antigas com cidade vazia e conserva todos os dados anteriores', () => {
  const db = new DatabaseSync(':memory:');
  try {
    migrateSqlite(db, undefined, sqliteMigrations.slice(0, 20));
    const turmaId = randomUUID(), horarioId = randomUUID();
    db.prepare('INSERT INTO Turma VALUES(?,?,?,?,?,?)').run(turmaId, 'Turma antiga', 'Mestre', 'ativo', '2026-01-01', '2026-01-01');
    db.prepare('INSERT INTO HorarioTurma VALUES(?,?,?,?,?)').run(horarioId, turmaId, 1, '12:00', '13:00');
    db.prepare('INSERT INTO Aula(id,titulo,dataAula,horaInicio,horaFim,professor,origem,origemHorarioId,turmaId,turmaNome,situacao,criadoEm) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(), 'Aula antiga', '2026-10-19', '12:00', '13:00', 'Mestre', 'grade', horarioId, turmaId, 'Turma antiga', 'agendada', '2026-01-01');
    const anteriorHorario = db.prepare('SELECT * FROM HorarioTurma').get();
    const anteriorAula = db.prepare('SELECT * FROM Aula').get();
    assert.deepEqual(migrateSqlite(db).applied, [21]);
    assert.deepEqual({ ...db.prepare('SELECT * FROM HorarioTurma').get() }, { ...anteriorHorario, cidade: null });
    assert.deepEqual({ ...db.prepare('SELECT * FROM Aula').get() }, { ...anteriorAula, cidade: null });
    assert.deepEqual(migrateSqlite(db).applied, []);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { db.close(); }
});
