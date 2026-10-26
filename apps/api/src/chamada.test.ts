import { criarAulaDeTeste, type AulaDeTesteInput } from './test-aula-helper.js';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import type { Aluno, AulaView } from '@tatame/shared';
import { createApp, request } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';

const extra: AulaDeTesteInput = { titulo: 'Treino da tarde', professor: 'Professor teste', turmaId: null,
  dataAula: '2026-10-19', horaInicio: '15:00', horaFim: '16:00' };

describe('Chamada por aula', () => {
  let repo: SqliteRepository; let app: ReturnType<typeof createApp>;
  beforeEach(() => { repo = new SqliteRepository(':memory:'); app = createApp(repo, { apiKey: '', analyticsUrl: 'http://127.0.0.1:1' }); });
  afterEach(async () => { await repo.close(); });
  const student = async (changes: Partial<Aluno> = {}) => repo.insert('Aluno', { id: randomUUID(), nome: 'Aluno teste',
    telefone: '11999991234', email: randomUUID() + '@example.com', dataNascimento: '2000-01-01', faixa: 'Branca',
    dataMatricula: '2026-01-01', situacao: 'ativo', criadoEm: '2026-01-01T00:00:00Z', ...changes });
  const create = async (changes: Partial<AulaDeTesteInput> = {}): Promise<AulaView> => criarAulaDeTeste(repo,{...extra,...changes});
  const mark = (aulaId: string, alunoId: string, presente = true) => request(app).put(`/api/aulas/${aulaId}/chamada/${alunoId}`).send({ presente });
  const clear = (aulaId: string, alunoId: string) => request(app).delete(`/api/aulas/${aulaId}/chamada/${alunoId}`);

  it('o mesmo aluno participa às 12h, 15h e 18h sem duplicar aula/aluno ou criar cobrança', async () => {
    const aluno = await student();
    const turma = (await request(app).post('/api/turmas').send({ nome: 'Adulto', professor: 'Mestre teste', situacao: 'ativo', alunoIds: [aluno.id],
      horarios: [{ diaSemana: 1, horaInicio: '12:00', horaFim: '13:00' }, { diaSemana: 1, horaInicio: '18:00', horaFim: '19:00' }] }).expect(201)).body;
    const fixed = [];
    for (const slot of turma.horarios) fixed.push((await request(app).post('/api/aulas/da-grade').send({ horarioId: slot.id, dataAula: extra.dataAula }).expect(201)).body);
    const afternoon = await create();
    const before = await repo.list('AlunoTurma');
    for (const aula of [fixed[0], afternoon, fixed[1]]) {
      assert.deepEqual(aula.chamada, []);
      await mark(aula.id, aluno.id).expect(201);
      await mark(aula.id, aluno.id).expect(200);
    }
    const aulas: AulaView[] = (await request(app).get('/api/aulas').expect(200)).body;
    assert.deepEqual(aulas.map(aula => aula.horaInicio), ['12:00', '15:00', '18:00']);
    assert.ok(aulas.every(aula => aula.chamada.length === 1 && aula.chamada[0].presente === true));
    assert.equal((await repo.list('PresencaAula')).length, 3);
    assert.deepEqual(await repo.list('Presenca'), []); assert.deepEqual(await repo.list('Mensalidade'), []);
    assert.deepEqual(await repo.list('AlunoTurma'), before);
  });
  it('previstos não viram faltas e participante de outra turma não muda vínculos habituais', async () => {
    const previsto = await student(); const visitante = await student({ nome: 'Aluno de outra turma' });
    const group = (await request(app).post('/api/turmas').send({ nome: 'Grupo habitual', professor: 'Mestre', situacao: 'ativo', alunoIds: [previsto.id],
      horarios: [{ diaSemana: 1, horaInicio: '12:00', horaFim: '13:00' }] }).expect(201)).body;
    const aula = await create({ turmaId: group.id });
    assert.equal(aula.alunosPrevistos.length, 1); assert.deepEqual(aula.chamada, []);
    const before = await repo.list('AlunoTurma');
    await mark(aula.id, visitante.id).expect(201);
    const result: AulaView = (await request(app).get('/api/aulas/' + aula.id).expect(200)).body;
    assert.equal(result.chamada.length, 1); assert.equal(result.chamada[0].alunoId, visitante.id);
    assert.deepEqual(result.alunosPrevistos, aula.alunosPrevistos); assert.deepEqual(await repo.list('AlunoTurma'), before);
  });
  it('corrige presença/ausência mantendo id, nome histórico e criação, com booleano real', async () => {
    const aluno = await student(); const aula = await create();
    const first = (await mark(aula.id, aluno.id).expect(201)).body;
    await repo.update('Aluno', aluno.id, { nome: 'Nome alterado' });
    const corrected = (await mark(aula.id, aluno.id, false).expect(200)).body;
    assert.equal(corrected.presente, false); assert.equal(corrected.id, first.id); assert.equal(corrected.nome, first.nome);
    assert.equal(corrected.criadoEm, first.criadoEm); assert.ok(corrected.atualizadoEm >= first.criadoEm);
    assert.equal((await repo.list('PresencaAula')).length, 1);
  });
  it('marcações simultâneas criam um único registro e retornam somente uma criação', async () => {
    const aluno = await student(); const aula = await create();
    const results = await Promise.all(Array.from({ length: 6 }, () => mark(aula.id, aluno.id)));
    assert.deepEqual(results.map(item => item.status).sort(), [200, 200, 200, 200, 200, 201]);
    assert.equal(new Set(results.map(item => item.body.id)).size, 1); assert.equal((await repo.list('PresencaAula')).length, 1);
  });
  it('bloqueia aula futura/cancelada, aluno inexistente/inativo e treino anterior à matrícula', async () => {
    const aluno = await student(); const future = await create({ dataAula: '2099-01-01' });
    await mark(future.id, aluno.id).expect(400);
    const cancelled = await create();
    await request(app).patch('/api/aulas/' + cancelled.id + '/cancelamento').send({ motivo: 'Sem professor' }).expect(200);
    await mark(cancelled.id, aluno.id).expect(409); await clear(cancelled.id, aluno.id).expect(409);
    const aula = await create();
    await mark(aula.id, randomUUID()).expect(404); await mark(randomUUID(), aluno.id).expect(404);
    await repo.update('Aluno', aluno.id, { situacao: 'inativo' }); await mark(aula.id, aluno.id).expect(409);
    await repo.update('Aluno', aluno.id, { situacao: 'ativo', dataMatricula: '2026-10-20' }); await mark(aula.id, aluno.id).expect(400);
    assert.deepEqual(await repo.list('PresencaAula'), []);
  });
  it('permite corrigir e limpar uma marcação já existente após inativar o aluno', async () => {
    const aluno = await student(); const aula = await create();
    await mark(aula.id, aluno.id).expect(201); await repo.update('Aluno', aluno.id, { situacao: 'inativo' });
    await mark(aula.id, aluno.id, false).expect(200); await clear(aula.id, aluno.id).expect(204);
    await mark(aula.id, aluno.id).expect(409); assert.deepEqual(await repo.list('PresencaAula'), []);
  });
  it('rejeita corpo/ids inválidos sem aceitar campos extras ou booleanos em texto', async () => {
    const aluno = await student(); const aula = await create();
    for (const body of [{}, { presente: 'true' }, { presente: 1 }, { presente: true, alunoId: aluno.id }, { presente: null }]) {
      await request(app).put(`/api/aulas/${aula.id}/chamada/${aluno.id}`).send(body).expect(400);
    }
    await mark('invalido', aluno.id).expect(404); await mark(aula.id, 'invalido').expect(404);
    await clear('invalido', aluno.id).expect(404); await clear(aula.id, 'invalido').expect(404);
    assert.deepEqual(await repo.list('PresencaAula'), []);
  });
  it('qualquer marcação protege exclusão/cancelamento e a última limpeza libera a aula', async () => {
    const aluno = await student(); const aula = await create();
    await mark(aula.id, aluno.id, false).expect(201);
    await request(app).delete('/api/aulas/' + aula.id).expect(404);
    await request(app).patch('/api/aulas/' + aula.id + '/cancelamento').send({ motivo: 'Correção' }).expect(409);
    await assert.rejects(repo.cancelAula(aula.id, 'Correção', new Date().toISOString()), /possui marcações/);
    assert.equal((await repo.get('Aula', aula.id))?.situacao, 'agendada');
    await clear(aula.id, aluno.id).expect(204); await clear(aula.id, aluno.id).expect(404);
    await request(app).patch('/api/aulas/' + aula.id + '/cancelamento').send({ motivo: 'Correção confirmada' }).expect(200);
    await request(app).delete('/api/aulas/' + aula.id).expect(404);
  });
  it('limpar uma aula preserva marcações de outra aula e registros anteriores por modalidade', async () => {
    const aluno = await student(); const one = await create(); const two = await create({ horaInicio: '18:00', horaFim: '19:00' });
    const legacy = await repo.insert('Presenca', { id: randomUUID(), alunoId: aluno.id, dataTreino: extra.dataAula, tipoTreino: 'Com kimono', presente: true });
    await mark(one.id, aluno.id).expect(201); const other = (await mark(two.id, aluno.id).expect(201)).body;
    await clear(one.id, aluno.id).expect(204);
    assert.deepEqual(await repo.list('Presenca'), [legacy]); assert.deepEqual(await repo.list('PresencaAula'), [other]);
    await request(app).delete('/api/aulas/' + one.id).expect(404);
    assert.ok(await repo.get('Aula', two.id));
  });
  it('preserva chamada ao excluir turma e protege exclusão do aluno também por chave estrangeira', async () => {
    const aluno = await student();
    const group = (await request(app).post('/api/turmas').send({ nome: 'Turma', professor: 'Mestre', situacao: 'ativo', alunoIds: [aluno.id], horarios: [{ diaSemana: 1, horaInicio: '12:00', horaFim: '13:00' }] }).expect(201)).body;
    const aula = await create({ turmaId: group.id }); const record = (await mark(aula.id, aluno.id).expect(201)).body;
    await request(app).delete('/api/turmas/' + group.id).expect(204);
    await request(app).delete('/api/alunos/' + aluno.id).expect(409);
    await assert.rejects(repo.remove('Aluno', aluno.id), /FOREIGN KEY/);
    const stored: AulaView = (await request(app).get('/api/aulas/' + aula.id).expect(200)).body;
    assert.deepEqual(stored.chamada, [record]); assert.equal(stored.turmaId, null); assert.equal(stored.turmaNome, 'Turma');
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []);
  });
  it('falha SQL na gravação ou limpeza reverte a transação sem perder histórico', async () => {
    const aluno = await student(); const aula = await create();
    repo.db.exec("CREATE TRIGGER falha_chamada BEFORE INSERT ON PresencaAula BEGIN SELECT RAISE(ABORT, 'Falha simulada'); END;");
    await assert.rejects(repo.savePresencaAula(aula.id, aluno.id, true, new Date().toISOString()), /Falha simulada/);
    assert.deepEqual(await repo.list('PresencaAula'), []);
    repo.db.exec('DROP TRIGGER falha_chamada');
    const original = (await mark(aula.id, aluno.id).expect(201)).body;
    repo.db.exec("CREATE TRIGGER falha_limpeza AFTER DELETE ON PresencaAula BEGIN SELECT RAISE(ABORT, 'Falha na limpeza'); END;");
    await assert.rejects(repo.removePresencaAula(aula.id, aluno.id), /Falha na limpeza/);
    assert.deepEqual(await repo.list('PresencaAula'), [original]);
    repo.db.exec('DROP TRIGGER falha_limpeza'); await clear(aula.id, aluno.id).expect(204);
  });
  it('concorrência entre chamada e cancelamento nunca deixa presença em aula cancelada', async () => {
    const aluno = await student(); const aula = await create();
    const [marked, cancelled] = await Promise.all([mark(aula.id, aluno.id), request(app).patch('/api/aulas/' + aula.id + '/cancelamento').send({ motivo: 'Cancelamento concorrente' })]);
    assert.ok((marked.status === 201 && cancelled.status === 409) || (marked.status === 409 && cancelled.status === 200));
    const stored = await repo.get('Aula', aula.id); const records = await repo.list('PresencaAula');
    assert.equal(records.length, stored?.situacao === 'cancelada' ? 0 : 1);
  });
  it('chamada concorrente à rota removida de exclusão preserva a aula e sua marcação', async () => {
    const aluno = await student(); const aula = await create();
    const [marked, removed] = await Promise.all([mark(aula.id, aluno.id), request(app).delete('/api/aulas/' + aula.id)]);
    assert.equal(marked.status,201);assert.equal(removed.status,404);
    assert.equal((await repo.list('PresencaAula')).length,1);
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []);
  });
});
