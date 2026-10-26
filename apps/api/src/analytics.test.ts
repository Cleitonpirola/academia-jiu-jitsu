import { criarAulaDeTeste } from './test-aula-helper.js';
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import type { Analytics } from '@tatame/shared';
import { createApp, request } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';
import { currentMonth, monthAt, today } from './domain.js';
import { calculateAnalytics } from './modules/analytics/service.js';
import { randomUUID } from 'node:crypto';

const validMetrics = (): Analytics => ({
  mes: currentMonth(), dataReferencia: today(), alunosAtivos: 0, alunosInadimplentes: 0,
  receitaCentavos: 0, inadimplenciaCentavos: 0, frequenciaMedia: 0, alunosEmRisco: 0,
  presencasNoMes: 0, riscos: [], receitaMensal: [],
});

async function withService(body: unknown, run: (url: string, received: unknown[]) => Promise<void>, status = 200, raw = false) {
  const received: unknown[] = [];
  const server = createServer((req, res) => {
    let input = '';
    req.on('data', chunk => { input += chunk; });
    req.on('end', () => {
      received.push(JSON.parse(input || '{}'));
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(raw ? String(body) : JSON.stringify(body));
    });
  });
  await new Promise<void>((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept); });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try { await run(`http://127.0.0.1:${address.port}`, received); }
  finally { await new Promise<void>((accept, reject) => server.close(error => error ? reject(error) : accept())); }
}

it('aceita métricas válidas e mantém compatibilidade com campos adicionais', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    await withService({ ...validMetrics(), novoIndicador: 123 }, async url => {
      const response = await request(createApp(repo, { apiKey: '', analyticsUrl: url })).get('/api/analytics?mes=' + currentMonth()).expect(200);
      assert.deepEqual(response.body.riscos, []);
      assert.equal(response.body.novoIndicador, undefined);
    });
  } finally { await repo.close(); }
});

it('recusa riscos em formato incompatível antes de enviar dados para a tela', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    await withService({ ...validMetrics(), riscos: 'contrato alterado' }, async url => {
      const response = await request(createApp(repo, { apiKey: '', analyticsUrl: url })).get('/api/analytics?mes=' + currentMonth()).expect(503);
      assert.match(response.body.message, /incompatíveis/);
      assert.equal(response.body.riscos, undefined);
    });
  } finally { await repo.close(); }
});

it('recusa valores monetários inválidos e indicadores de outro período', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    for (const invalid of [{ ...validMetrics(), receitaCentavos: -1 }, { ...validMetrics(), mes: monthAt(-1) }]) {
      await withService(invalid, async url => {
        await request(createApp(repo, { apiKey: '', analyticsUrl: url })).get('/api/analytics?mes=' + currentMonth()).expect(503);
      });
    }
  } finally { await repo.close(); }
});

it('transforma JSON inválido e falha HTTP do Python em erro controlado', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    await withService('{', async url => {
      const response = await request(createApp(repo, { apiKey: '', analyticsUrl: url })).get('/api/analytics?mes=' + currentMonth()).expect(503);
      assert.match(response.body.message, /resposta inválida/);
    }, 200, true);
    await withService({ detail: 'Falha simulada' }, async url => {
      await request(createApp(repo, { apiKey: '', analyticsUrl: url })).get('/api/analytics?mes=' + currentMonth()).expect(503);
    }, 500);
  } finally { await repo.close(); }
});

it('rejeita mês futuro sem consultar o serviço de analytics', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    await withService(validMetrics(), async (url, received) => {
      await request(createApp(repo, { apiKey: '', analyticsUrl: url })).get('/api/analytics?mes=' + monthAt(1)).expect(400);
      assert.equal(received.length, 0);
    });
  } finally { await repo.close(); }
});

it('envia ao Python somente os campos de aluno necessários ao cálculo', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    await repo.insert('Aluno', { id: '09c312d0-187a-4d58-ae50-4a921a9dd8d4', nome: 'Aluno exemplo', telefone: '11999991234', email: 'exemplo@example.com', dataNascimento: '2000-01-01', faixa: 'Branca', dataMatricula: '2026-01-01', situacao: 'ativo', criadoEm: today() });
    await withService(validMetrics(), async (url, received) => {
      await calculateAnalytics(repo, currentMonth(), url);
      const payload = received[0] as { alunos: Record<string, unknown>[] };
      assert.equal(payload.alunos[0].nome, 'Aluno exemplo');
      assert.equal(payload.alunos[0].email, undefined);
      assert.equal(payload.alunos[0].telefone, undefined);
      assert.equal(payload.alunos[0].dataNascimento, undefined);
    });
  } finally { await repo.close(); }
});

it('projeta chamadas de duas aulas no mesmo dia junto ao legado sem incluir nomes ou inventar faltas', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    const alunoId = randomUUID();
    await repo.insert('Aluno', { id: alunoId, nome: 'Aluno teste', telefone: '11999991234', email: 'teste@example.com', dataNascimento: '2000-01-01', faixa: 'Branca', dataMatricula: '2026-01-01', situacao: 'ativo', criadoEm: today() });
    const app = createApp(repo, { apiKey: '' });
    await repo.insert('Presenca', { id: randomUUID(), alunoId, dataTreino: '2026-10-01', tipoTreino: 'Com kimono', presente: true });
    for (const [horaInicio, horaFim, presente] of [['12:00', '13:00', true], ['15:00', '16:00', false], ['18:00', '19:00', true]] as const) {
      const aula = await criarAulaDeTeste(repo,{ titulo: 'Aula teste', professor: 'Mestre', turmaId: null, dataAula: '2026-10-19', horaInicio, horaFim });
      await request(app).put(`/api/aulas/${aula.id}/chamada/${alunoId}`).send({ presente }).expect(201);
    }
    await withService(validMetrics(), async (url, received) => {
      await calculateAnalytics(repo, currentMonth(), url);
      const rows = (received[0] as { presencas: { alunoId: string; dataTreino: string; presente: boolean }[] }).presencas;
      assert.equal(rows.length, 4);
      assert.equal(rows.filter(row => row.dataTreino === '2026-10-19' && row.presente).length, 2);
      assert.equal(rows.filter(row => !row.presente).length, 1);
      assert.ok(rows.every(row => Object.keys(row).sort().join(',') === 'alunoId,dataTreino,presente'));
    });
  } finally { await repo.close(); }
});

it('interrompe indicadores com erro controlado se consultas concorrentes observarem aula e chamada em instantes diferentes', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    const alunoId = randomUUID();
    await repo.insert('Aluno', { id: alunoId, nome: 'Aluno teste', telefone: '11999991234', email: 'teste@example.com', dataNascimento: '2000-01-01', faixa: 'Branca', dataMatricula: '2026-01-01', situacao: 'ativo', criadoEm: today() });
    const app = createApp(repo, { apiKey: '' });
    const aula = await criarAulaDeTeste(repo,{ titulo: 'Aula teste', professor: 'Mestre', turmaId: null, dataAula: '2026-10-19', horaInicio: '12:00', horaFim: '13:00' });
    await repo.savePresencaAula(aula.id, alunoId, true, new Date().toISOString());
    const list = repo.list.bind(repo);
    // Simula a limpeza/exclusão entre respostas de consultas distintas, sem violar FKs do SQLite.
    repo.list = async table => table === 'Aula' ? [] : list(table);
    await withService(validMetrics(), async (url, received) => {
      const response = await request(createApp(repo, { apiKey: '', analyticsUrl: url })).get('/api/analytics?mes=' + currentMonth()).expect(503);
      assert.match(response.body.message, /mudaram durante a consulta/);
      assert.equal(received.length, 0);
    });
  } finally { await repo.close(); }
});
