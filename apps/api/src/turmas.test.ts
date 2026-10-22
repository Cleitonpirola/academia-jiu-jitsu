import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import type { TurmaInput } from '@tatame/shared';
import { createApp, request } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';

const input: TurmaInput = {
  nome: 'Adulto · Segunda', professor: 'Mestre Carlos', situacao: 'ativo', alunoIds: [],
  horarios: [{ diaSemana: 1, horaInicio: '18:00', horaFim: '19:00' }, { diaSemana: 1, horaInicio: '12:00', horaFim: '13:00' }],
};

describe('Turmas, grade fixa e vínculos', () => {
  let repo: SqliteRepository;
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { repo = new SqliteRepository(':memory:'); app = createApp(repo, { apiKey: '', analyticsUrl: 'http://127.0.0.1:1' }); });
  afterEach(async () => { await repo.close(); });
  const student = async (situacao: 'ativo' | 'inativo' = 'ativo') => repo.insert('Aluno', {
    id: randomUUID(), nome: 'Aluno de teste', telefone: '11999991234', email: randomUUID() + '@example.com',
    dataNascimento: '2000-01-01', dataMatricula: '2026-01-01', faixa: 'Branca', situacao, criadoEm: '2026-01-01T00:00:00Z',
  });
  it('cadastra, consulta e ordena dois horários da mesma turma no mesmo dia', async () => {
    const aluno = await student();
    const result = await request(app).post('/api/turmas').send({ ...input, alunoIds: [aluno.id] }).expect(201);
    assert.ok(result.body.id); assert.deepEqual(result.body.horarios.map((row: { horaInicio: string }) => row.horaInicio), ['12:00', '18:00']);
    const detail = await request(app).get('/api/turmas/' + result.body.id).expect(200);
    assert.deepEqual(detail.body, result.body);
    const list = await request(app).get('/api/turmas').expect(200);
    assert.equal(list.body.length, 1); assert.deepEqual(list.body[0].alunoIds, [aluno.id]);
    assert.equal((await repo.list('Presenca')).length, 0);
  });
  it('edita a grade e substitui vínculos preservando os identificadores mantidos', async () => {
    const first = await student(); const second = await student();
    const created = await request(app).post('/api/turmas').send({ ...input, alunoIds: [first.id] }).expect(201);
    const oldLink = (await repo.list('AlunoTurma'))[0];
    const newInput = { ...input, nome: 'Adulto atualizado', alunoIds: [first.id, second.id], horarios: [input.horarios[0]] };
    const edited = await request(app).put('/api/turmas/' + created.body.id).send(newInput).expect(200);
    assert.equal(edited.body.nome, 'Adulto atualizado'); assert.equal(edited.body.criadoEm, created.body.criadoEm);
    assert.equal(edited.body.horarios[0].id, created.body.horarios[1].id);
    assert.deepEqual((await repo.list('AlunoTurma')).find(row => row.alunoId === first.id), oldLink);
    await request(app).put('/api/turmas/' + created.body.id).send({ ...newInput, alunoIds: [second.id] }).expect(200);
    assert.equal((await repo.list('AlunoTurma')).length, 1); assert.equal((await repo.list('HorarioTurma')).length, 1);
  });
  it('desativa e reativa sem apagar grade ou vínculos e rejeita payload de situação incorreto', async () => {
    const aluno = await student();
    const created = await request(app).post('/api/turmas').send({ ...input, alunoIds: [aluno.id] }).expect(201);
    await request(app).patch('/api/turmas/' + created.body.id + '/situacao').send({ situacao: 'inativo' }).expect(200);
    const inactive = await request(app).get('/api/turmas/' + created.body.id).expect(200);
    assert.equal(inactive.body.situacao, 'inativo'); assert.deepEqual(inactive.body.horarios, created.body.horarios); assert.deepEqual(inactive.body.alunoIds, [aluno.id]);
    await request(app).patch('/api/turmas/' + created.body.id + '/situacao').send({ situacao: 'ativo', alunoIds: [] }).expect(400);
    await request(app).patch('/api/turmas/' + created.body.id + '/situacao').send({ situacao: 'ativo' }).expect(200);
    assert.equal((await repo.list('AlunoTurma')).length, 1);
  });
  it('rejeita horários impossíveis, vazios, repetidos e sobrepostos sem gravação parcial', async () => {
    const cases = [[], [{ diaSemana: 7, horaInicio: '12:00', horaFim: '13:00' }],
      [{ diaSemana: 1, horaInicio: '24:00', horaFim: '25:00' }], [{ diaSemana: 1, horaInicio: '12:00', horaFim: '11:00' }],
      [input.horarios[0], input.horarios[0]], [input.horarios[0], { diaSemana: 1, horaInicio: '18:30', horaFim: '19:30' }],
    ];
    for (const horarios of cases) await request(app).post('/api/turmas').send({ ...input, horarios }).expect(400);
    assert.equal((await repo.list('Turma')).length, 0); assert.equal((await repo.list('HorarioTurma')).length, 0);
  });
  it('aceita horários adjacentes e o mesmo horário em turmas distintas', async () => {
    const horarios = [{ diaSemana: 1, horaInicio: '12:00', horaFim: '13:00' }, { diaSemana: 1, horaInicio: '13:00', horaFim: '14:00' }];
    await request(app).post('/api/turmas').send({ ...input, horarios }).expect(201);
    await request(app).post('/api/turmas').send({ ...input, nome: 'Outra turma', horarios }).expect(201);
    assert.equal((await repo.list('HorarioTurma')).length, 4);
  });
  it('rejeita vínculos inexistentes, duplicados ou novos alunos inativos', async () => {
    const active = await student(); const inactive = await student('inativo');
    for (const alunoIds of [[randomUUID()], [active.id, active.id], [inactive.id]]) {
      await request(app).post('/api/turmas').send({ ...input, alunoIds }).expect(400);
    }
    assert.equal((await repo.list('Turma')).length, 0); assert.equal((await repo.list('AlunoTurma')).length, 0);
  });
  it('permite editar turma com vínculo de aluno posteriormente inativado, sem criar novo vínculo inativo', async () => {
    const aluno = await student();
    const turma = await request(app).post('/api/turmas').send({ ...input, alunoIds: [aluno.id] }).expect(201);
    await repo.update('Aluno', aluno.id, { situacao: 'inativo' });
    await request(app).put('/api/turmas/' + turma.body.id).send({ ...input, professor: 'Outro mestre', alunoIds: [aluno.id] }).expect(200);
    await request(app).put('/api/turmas/' + turma.body.id).send(input).expect(200);
    await request(app).put('/api/turmas/' + turma.body.id).send({ ...input, alunoIds: [aluno.id] }).expect(400);
    assert.equal((await repo.list('AlunoTurma')).length, 0);
  });
  it('permite aluno em mais de uma turma e protege o vínculo contra exclusão do cadastro', async () => {
    const aluno = await student();
    const first = await request(app).post('/api/turmas').send({ ...input, alunoIds: [aluno.id] }).expect(201);
    const second = await request(app).post('/api/turmas').send({ ...input, nome: 'Outra turma', alunoIds: [aluno.id] }).expect(201);
    assert.equal((await repo.list('AlunoTurma')).length, 2);
    const blocked = await request(app).delete('/api/alunos/' + aluno.id).expect(409);
    assert.match(blocked.body.message, /vinculado/);
    await repo.update('Aluno', aluno.id, { situacao: 'inativo' });
    await request(app).delete('/api/alunos/' + aluno.id).expect(409);
    for (const turma of [first, second]) await request(app).put('/api/turmas/' + turma.body.id).send(input).expect(200);
    await request(app).delete('/api/alunos/' + aluno.id).expect(204);
  });
  it('reverte turma, horários e vínculos se uma gravação falhar dentro da transação', async () => {
    const aluno = await student();
    const response = await request(app).post('/api/turmas').send({ ...input, alunoIds: [aluno.id] }).expect(201);
    const turma = await repo.get('Turma', response.body.id); assert.ok(turma);
    const before = { turma: await repo.list('Turma'), horarios: await repo.list('HorarioTurma'), alunos: await repo.list('AlunoTurma') };
    await assert.rejects(repo.saveTurma({ ...turma, nome: 'Não deve persistir' }, [], [{ id: randomUUID(), turmaId: turma.id, alunoId: randomUUID(), criadoEm: turma.criadoEm }], false), /FOREIGN KEY/);
    assert.deepEqual({ turma: await repo.list('Turma'), horarios: await repo.list('HorarioTurma'), alunos: await repo.list('AlunoTurma') }, before);
  });
  it('retorna 404 para identificadores inválidos ou inexistentes, sem alterar outra turma', async () => {
    await request(app).get('/api/turmas/invalido').expect(404);
    await request(app).get('/api/turmas/' + randomUUID()).expect(404);
    await request(app).put('/api/turmas/' + randomUUID()).send(input).expect(404);
    await request(app).patch('/api/turmas/' + randomUUID() + '/situacao').send({ situacao: 'inativo' }).expect(404);
    await request(app).delete('/api/turmas/invalido').expect(404);
    await request(app).delete('/api/turmas/' + randomUUID()).expect(404);
  });
  it('exclui turmas ativas e inativas com grade e vínculos sem apagar alunos, cobranças ou presenças', async () => {
    const aluno = await student();
    const bill = { id: randomUUID(), alunoId: aluno.id, competencia: '2026-10', valorCentavos: 15000, dataVencimento: '2026-10-05', dataPagamento: null, criadoEm: '2026-10-01T00:00:00Z' };
    const attendance = { id: randomUUID(), alunoId: aluno.id, dataTreino: '2026-10-01', tipoTreino: 'Com kimono', presente: true };
    await repo.insert('Mensalidade', bill); await repo.insert('Presenca', attendance);
    const first = await request(app).post('/api/turmas').send({ ...input, alunoIds: [aluno.id] }).expect(201);
    const second = await request(app).post('/api/turmas').send({ ...input, nome: 'Outra turma', situacao: 'inativo', alunoIds: [aluno.id] }).expect(201);
    await request(app).delete('/api/turmas/' + first.body.id).expect(204);
    await request(app).get('/api/turmas/' + first.body.id).expect(404);
    await request(app).delete('/api/turmas/' + first.body.id).expect(404);
    const remaining = await request(app).get('/api/turmas/' + second.body.id).expect(200);
    assert.deepEqual(remaining.body, second.body);
    await request(app).delete('/api/turmas/' + second.body.id).expect(204);
    assert.equal((await repo.list('Turma')).length, 0); assert.equal((await repo.list('HorarioTurma')).length, 0); assert.equal((await repo.list('AlunoTurma')).length, 0);
    assert.deepEqual(await repo.get('Aluno', aluno.id), aluno); assert.deepEqual(await repo.get('Mensalidade', bill.id), bill); assert.deepEqual(await repo.get('Presenca', attendance.id), attendance);
    const recreated = await request(app).post('/api/turmas').send(input).expect(201);
    assert.notEqual(recreated.body.id, first.body.id); assert.deepEqual(recreated.body.alunoIds, []);
  });
  it('reverte a exclusão dos horários e vínculos se remover a turma falhar', async () => {
    const aluno = await student();
    const created = await request(app).post('/api/turmas').send({ ...input, alunoIds: [aluno.id] }).expect(201);
    const before = { turmas: await repo.list('Turma'), horarios: await repo.list('HorarioTurma'), alunos: await repo.list('AlunoTurma') };
    repo.db.exec("CREATE TRIGGER impedir_exclusao_teste BEFORE DELETE ON Turma BEGIN SELECT RAISE(ABORT, 'Falha simulada na exclusão'); END;");
    await assert.rejects(repo.removeTurma(created.body.id), /Falha simulada/);
    assert.deepEqual({ turmas: await repo.list('Turma'), horarios: await repo.list('HorarioTurma'), alunos: await repo.list('AlunoTurma') }, before);
  });
});
