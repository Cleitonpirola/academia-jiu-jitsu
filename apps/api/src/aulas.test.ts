import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { createApp, request } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';
import type { Aula, AulaExtraInput, TurmaInput } from '@tatame/shared';

const grade: TurmaInput = { nome: 'Adulto', professor: 'Mestre de teste', situacao: 'ativo', alunoIds: [],
  horarios: [{ diaSemana: 1, horaInicio: '12:00', horaFim: '13:00' }, { diaSemana: 1, horaInicio: '18:00', horaFim: '19:00' }],
};
const extra: AulaExtraInput = { titulo: 'Treino da tarde', professor: 'Professor de teste', turmaId: null, dataAula: '2026-10-19', horaInicio: '15:00', horaFim: '16:00' };
describe('Aulas datadas, extras e histórico', () => {
  let repo: SqliteRepository; let app: ReturnType<typeof createApp>;
  beforeEach(() => { repo = new SqliteRepository(':memory:'); app = createApp(repo, { apiKey: '', analyticsUrl: 'http://127.0.0.1:1' }); });
  afterEach(async () => { await repo.close(); });
  const turma = async (alunoIds: string[] = []) => (await request(app).post('/api/turmas').send({ ...grade, alunoIds }).expect(201)).body;
  const student = async () => repo.insert('Aluno', { id: randomUUID(), nome: 'Nome original', email: randomUUID() + '@example.com', telefone: '11999991234', faixa: 'Branca', situacao: 'ativo', dataNascimento: '2000-01-01', dataMatricula: '2026-01-01', criadoEm: '2026-01-01T00:00:00Z' });
  const fromGrade = async (horarioId: string, dataAula = '2026-10-19', code = 201) => (await request(app).post('/api/aulas/da-grade').send({ horarioId, dataAula }).expect(code)).body;

  it('cria encontros fixos às 12h/18h e extra às 15h sem mudar grade, finanças ou presenças', async () => {
    const group = await turma();
    const before = await repo.list('HorarioTurma');
    for (const slot of group.horarios) await fromGrade(slot.id);
    await request(app).post('/api/aulas/extras').send(extra).expect(201);
    const list = await request(app).get('/api/aulas?dataInicio=2026-10-19&dataFim=2026-10-19').expect(200);
    assert.deepEqual(list.body.map((a: Aula) => a.horaInicio), ['12:00', '15:00', '18:00']);
    assert.deepEqual(await repo.list('HorarioTurma'), before);
    assert.deepEqual(await repo.list('Presenca'), []); assert.deepEqual(await repo.list('Mensalidade'), []);
  });
  it('repete criação inclusive simultânea sem duplicar o mesmo horário/data', async () => {
    const group = await turma(); const horarioId = group.horarios[0].id;
    const results = await Promise.all(Array.from({ length: 4 }, () => request(app).post('/api/aulas/da-grade').send({ horarioId, dataAula: '2026-10-19' })));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 200, 200, 201]);
    assert.equal(new Set(results.map(r => r.body.id)).size, 1); assert.equal((await repo.list('Aula')).length, 1);
    const nextWeek = await fromGrade(horarioId, '2026-10-26'); assert.notEqual(nextWeek.id, results[0].body.id);
  });
  it('exige dia da semana compatível, horário existente e turma ativa para novas aulas fixas', async () => {
    const group = await turma();
    await request(app).post('/api/aulas/da-grade').send({ horarioId: group.horarios[0].id, dataAula: '2026-10-20' }).expect(400);
    await request(app).post('/api/aulas/da-grade').send({ horarioId: randomUUID(), dataAula: '2026-10-19' }).expect(404);
    await request(app).patch('/api/turmas/' + group.id + '/situacao').send({ situacao: 'inativo' }).expect(200);
    await request(app).post('/api/aulas/da-grade').send({ horarioId: group.horarios[0].id, dataAula: '2026-10-19' }).expect(400);
    assert.deepEqual(await repo.list('Aula'), []);
  });
  it('rejeita datas impossíveis, horários inválidos, campos extras e intervalos que atravessam o dia', async () => {
    for (const changes of [{ dataAula: '2026-02-30' }, { dataAula: '1899-12-31' }, { dataAula: '2026-13-01' }, { horaInicio: '24:00' }, { horaFim: '15:00' }, { horaInicio: '23:00', horaFim: '01:00' }, { titulo: ' ' }, { professor: '' }, { situacao: 'agendada' }, { turmaId: 'invalida' }]) {
      await request(app).post('/api/aulas/extras').send({ ...extra, ...changes }).expect(400);
    }
    assert.deepEqual(await repo.list('Aula'), []);
  });
  it('permite aula futura e data bissexta real sem fabricar presença', async () => {
    const created = await request(app).post('/api/aulas/extras').send({ ...extra, dataAula: '2028-02-29' }).expect(201);
    assert.equal(created.body.situacao, 'agendada'); assert.equal(created.body.turmaId, null);
    assert.deepEqual(created.body.alunosPrevistos, []); assert.deepEqual(await repo.list('Presenca'), []);
  });
  it('guarda apenas alunos habituais ativos na criação e mantém seus nomes originais', async () => {
    const first = await student(); const inactive = await student();
    const group = await turma([first.id, inactive.id]);
    await repo.update('Aluno', inactive.id, { situacao: 'inativo' });
    const aula = await fromGrade(group.horarios[0].id);
    assert.equal(aula.alunosPrevistos.length, 1); assert.equal(aula.alunosPrevistos[0].alunoId, first.id);
    await repo.update('Aluno', first.id, { nome: 'Nome atualizado', situacao: 'inativo' });
    await request(app).put('/api/turmas/' + group.id).send(grade).expect(200);
    const stored = await request(app).get('/api/aulas/' + aula.id).expect(200);
    assert.deepEqual(stored.body.alunosPrevistos, aula.alunosPrevistos);
    assert.equal(stored.body.alunosPrevistos[0].nome, 'Nome original');
  });
  it('aula extra vinculada usa a turma sem exigir horário da grade; turma inativa/inexistente é rejeitada', async () => {
    const aluno = await student(); const group = await turma([aluno.id]);
    const created = await request(app).post('/api/aulas/extras').send({ ...extra, turmaId: group.id }).expect(201);
    assert.equal(created.body.turmaNome, 'Adulto'); assert.equal(created.body.origemHorarioId, null); assert.equal(created.body.alunosPrevistos.length, 1);
    await request(app).post('/api/aulas/extras').send({ ...extra, turmaId: randomUUID() }).expect(404);
    await repo.update('Turma', group.id, { situacao: 'inativo' });
    await request(app).post('/api/aulas/extras').send({ ...extra, turmaId: group.id }).expect(400);
    await request(app).post('/api/aulas/extras').send(extra).expect(201);
  });
  it('editar a grade não altera aulas já criadas; novas datas usam o cadastro atual', async () => {
    const group = await turma(); const aula = await fromGrade(group.horarios[0].id);
    await request(app).put('/api/turmas/' + group.id).send({ ...grade, nome: 'Turma nova', professor: 'Outra professora', horarios: [{ ...grade.horarios[0], horaFim: '14:00' }] }).expect(200);
    const existing = await fromGrade(group.horarios[0].id, '2026-10-19', 200);
    assert.deepEqual(existing, aula);
    const next = await fromGrade(group.horarios[0].id, '2026-10-26');
    assert.equal(next.horaFim, '14:00'); assert.equal(next.titulo, 'Turma nova'); assert.equal(next.professor, 'Outra professora');
  });
  it('excluir turma preserva aula, nomes, horários e alunos previstos, e permite consultar sua origem histórica', async () => {
    const aluno = await student(); const group = await turma([aluno.id]); const aula = await fromGrade(group.horarios[0].id);
    await request(app).delete('/api/turmas/' + group.id).expect(204);
    const stored = await request(app).get('/api/aulas/' + aula.id).expect(200);
    assert.deepEqual(stored.body, { ...aula, turmaId: null });
    const retried = await fromGrade(group.horarios[0].id, '2026-10-19', 200); assert.equal(retried.id, aula.id);
    assert.equal((await repo.list('Aula')).length, 1); assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []);
  });
  it('excluir aluno sem outros impedimentos mantém seu nome na previsão histórica', async () => {
    const aluno = await student(); const group = await turma([aluno.id]); const aula = await fromGrade(group.horarios[0].id);
    await request(app).put('/api/turmas/' + group.id).send(grade).expect(200);
    await request(app).delete('/api/alunos/' + aluno.id).expect(204);
    const stored = await request(app).get('/api/aulas/' + aula.id).expect(200);
    assert.equal(stored.body.alunosPrevistos[0].alunoId, null); assert.equal(stored.body.alunosPrevistos[0].nome, aluno.nome);
  });
  it('falha após excluir a turma reverte também o desvínculo das aulas históricas', async () => {
    const aluno = await student(); const group = await turma([aluno.id]); const aula = await fromGrade(group.horarios[0].id);
    const before = { turma: await repo.list('Turma'), grade: await repo.list('HorarioTurma'), links: await repo.list('AlunoTurma') };
    repo.db.exec("CREATE TRIGGER falha_depois_de_remover AFTER DELETE ON Turma BEGIN SELECT RAISE(ABORT, 'Falha simulada após remoção'); END;");
    await assert.rejects(repo.removeTurma(group.id), /Falha simulada/);
    assert.deepEqual({ turma: await repo.list('Turma'), grade: await repo.list('HorarioTurma'), links: await repo.list('AlunoTurma') }, before);
    const detail = await request(app).get('/api/aulas/' + aula.id).expect(200); assert.deepEqual(detail.body, aula);
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []);
  });
  it('cancelar exige motivo, mantém o primeiro registro e não recria aula cancelada ao repetir criação', async () => {
    const aluno = await student(); const group = await turma([aluno.id]); const aula = await fromGrade(group.horarios[0].id);
    await request(app).patch('/api/aulas/' + aula.id + '/cancelamento').send({ motivo: '' }).expect(400);
    const result = await request(app).patch('/api/aulas/' + aula.id + '/cancelamento').send({ motivo: 'Professor indisponível' }).expect(200);
    assert.equal(result.body.situacao, 'cancelada'); assert.ok(result.body.canceladaEm); assert.deepEqual(result.body.alunosPrevistos, aula.alunosPrevistos);
    const repeat = await request(app).patch('/api/aulas/' + aula.id + '/cancelamento').send({ motivo: 'Outro motivo' }).expect(200);
    assert.deepEqual(repeat.body, result.body);
    assert.deepEqual(await fromGrade(group.horarios[0].id, '2026-10-19', 200), result.body);
    assert.deepEqual(await repo.list('Presenca'), []); assert.deepEqual(await repo.list('Mensalidade'), []);
  });
  it('filtra por datas, turma e situação e rejeita consultas ou IDs inválidos', async () => {
    const group = await turma(); const first = await fromGrade(group.horarios[0].id);
    await request(app).post('/api/aulas/extras').send({ ...extra, dataAula: '2026-10-20' }).expect(201);
    const filtered = await request(app).get('/api/aulas?dataInicio=2026-10-19&dataFim=2026-10-19&turmaId=' + group.id + '&situacao=agendada').expect(200);
    assert.deepEqual(filtered.body.map((a: Aula) => a.id), [first.id]);
    for (const query of ['dataInicio=2026-10-20&dataFim=2026-10-19', 'situacao=realizada', 'dataInicio=2026-02-30', 'turmaId=invalida', 'campo=extra', 'dataInicio=2026-10-19&dataInicio=2026-10-20']) await request(app).get('/api/aulas?' + query).expect(400);
    for (const id of ['invalido', randomUUID()]) {
      await request(app).get('/api/aulas/' + id).expect(404);
      await request(app).patch('/api/aulas/' + id + '/cancelamento').send({ motivo: 'Teste' }).expect(404);
      await request(app).delete('/api/aulas/' + id).expect(404);
    }
    await request(app).delete('/api/aulas/' + first.id).expect(409);
    assert.equal((await repo.list('Aula')).length, 2);
  });
  it('cancelamentos concorrentes preservam um único primeiro motivo e timestamp', async () => {
    const aula = (await request(app).post('/api/aulas/extras').send(extra).expect(201)).body;
    const results = await Promise.all(['Primeiro motivo', 'Segundo motivo'].map(motivo => request(app).patch('/api/aulas/' + aula.id + '/cancelamento').send({ motivo }).expect(200)));
    assert.deepEqual(results[0].body, results[1].body);
    assert.ok(['Primeiro motivo', 'Segundo motivo'].includes(results[0].body.motivoCancelamento));
    assert.equal((await repo.list('Aula')).length, 1);
  });
  it('falha ao gravar previsão reverte também a criação da aula', async () => {
    const result = await request(app).post('/api/aulas/extras').send(extra).expect(201);
    const aula = await repo.get('Aula', result.body.id); assert.ok(aula);
    const badId = randomUUID();
    await assert.rejects(repo.createAula({ ...aula, id: badId }, [{ id: randomUUID(), aulaId: badId, alunoId: randomUUID(), nome: 'Inválido' }]), /FOREIGN KEY/);
    assert.deepEqual(await repo.list('Aula'), [aula]); assert.deepEqual(await repo.list('AulaAlunoPrevisto'), []);
  });
  it('exclui extras avulsas/vinculadas, agendadas/canceladas, preservando outros registros', async () => {
    const aluno = await student(); const group = await turma([aluno.id]);
    const fixed = await fromGrade(group.horarios[0].id);
    await request(app).post('/api/aulas/extras').send({ ...extra, titulo: 'Outra aula preservada', turmaId: group.id }).expect(201);
    await repo.insert('Mensalidade', { id: randomUUID(), alunoId: aluno.id, competencia: '2026-10', valorCentavos: 20000, dataVencimento: '2026-10-10', dataPagamento: null, criadoEm: '2026-10-01T00:00:00Z' });
    await repo.insert('Presenca', { id: randomUUID(), alunoId: aluno.id, dataTreino: '2026-10-01', tipoTreino: 'Com kimono', presente: true });
    const tables = ['Aluno', 'Mensalidade', 'Presenca', 'Analise', 'Turma', 'HorarioTurma', 'AlunoTurma'] as const;
    const original = await Promise.all(tables.map(table => repo.list(table)));
    const removedIds: string[] = [];
    for (const turmaId of [null, group.id]) for (const cancelled of [false, true]) {
      const target = (await request(app).post('/api/aulas/extras').send({ ...extra, turmaId }).expect(201)).body;
      if (cancelled) await request(app).patch('/api/aulas/' + target.id + '/cancelamento').send({ motivo: 'Cancelada antes da exclusão' }).expect(200);
      const remainingAulas = (await repo.list('Aula')).filter(aula => aula.id !== target.id);
      const remainingExpected = (await repo.list('AulaAlunoPrevisto')).filter(row => row.aulaId !== target.id);
      await request(app).delete('/api/aulas/' + target.id).expect(204);
      await request(app).get('/api/aulas/' + target.id).expect(404);
      await request(app).delete('/api/aulas/' + target.id).expect(404);
      assert.deepEqual(await Promise.all(tables.map(table => repo.list(table))), original);
      assert.deepEqual(await repo.list('Aula'), remainingAulas); assert.deepEqual(await repo.list('AulaAlunoPrevisto'), remainingExpected);
      const preserved = await request(app).get('/api/aulas/' + fixed.id).expect(200); assert.deepEqual(preserved.body, fixed);
      assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []); removedIds.push(target.id);
    }
    const recreated = (await request(app).post('/api/aulas/extras').send(extra).expect(201)).body;
    assert.ok(!removedIds.includes(recreated.id));
  });
  it('impede exclusão de aulas da grade agendadas/canceladas também no repositório, sem perder previstos', async () => {
    const aluno = await student(); const group = await turma([aluno.id]);
    for (const [index, slot] of group.horarios.entries()) {
      const aula = await fromGrade(slot.id);
      if (index === 1) await request(app).patch('/api/aulas/' + aula.id + '/cancelamento').send({ motivo: 'Cancelamento preservado' }).expect(200);
      const before = (await request(app).get('/api/aulas/' + aula.id).expect(200)).body;
      const blocked = await request(app).delete('/api/aulas/' + aula.id).expect(409);
      assert.match(blocked.body.message, /Somente aulas extras/);
      assert.equal(await repo.removeAulaExtra(aula.id), false);
      const after = (await request(app).get('/api/aulas/' + aula.id).expect(200)).body; assert.deepEqual(after, before);
    }
  });
  it('falha ao remover a extra desfaz também a remoção da sua lista de previstos', async () => {
    const aluno = await student(); const group = await turma([aluno.id]);
    const target = (await request(app).post('/api/aulas/extras').send({ ...extra, turmaId: group.id }).expect(201)).body;
    const before = { aulas: await repo.list('Aula'), expected: await repo.list('AulaAlunoPrevisto') };
    repo.db.exec("CREATE TRIGGER falha_exclusao_extra AFTER DELETE ON Aula BEGIN SELECT RAISE(ABORT, 'Falha simulada na remoção da extra'); END;");
    await assert.rejects(repo.removeAulaExtra(target.id), /Falha simulada/);
    assert.deepEqual({ aulas: await repo.list('Aula'), expected: await repo.list('AulaAlunoPrevisto') }, before);
    const stored = await request(app).get('/api/aulas/' + target.id).expect(200); assert.deepEqual(stored.body, target);
  });
  it('exclusões concorrentes removem uma única extra e não deixam previstos órfãos', async () => {
    const aluno = await student(); const group = await turma([aluno.id]);
    const target = (await request(app).post('/api/aulas/extras').send({ ...extra, turmaId: group.id }).expect(201)).body;
    const results = await Promise.all([request(app).delete('/api/aulas/' + target.id), request(app).delete('/api/aulas/' + target.id)]);
    assert.deepEqual(results.map(result => result.status).sort(), [204, 404]);
    assert.deepEqual(await repo.list('Aula'), []); assert.deepEqual(await repo.list('AulaAlunoPrevisto'), []);
    assert.equal((await repo.list('Turma')).length, 1); assert.equal((await repo.list('Aluno')).length, 1);
    assert.equal(await repo.removeAulaExtra(randomUUID()), false);
  });
});
