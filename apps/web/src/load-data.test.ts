/// <reference types="node" />
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { loadResources, type ReadApi } from './load-data';
import { initialData, initialResourceStatus, startLoading, resources, type Resource } from './data';

it('ao trocar o mês exige novo dashboard e conserva os cadastros já carregados', () => {
  const previous = initialResourceStatus();
  for (const resource of resources) previous[resource] = { loading: false, loaded: true, error: null };
  const samePeriod = startLoading(previous);
  assert.equal(samePeriod.dashboard.loaded, true);
  const changedPeriod = startLoading(previous, ['dashboard']);
  assert.equal(changedPeriod.dashboard.loaded, false);
  assert.equal(changedPeriod.dashboard.loading, true);
  assert.equal(changedPeriod.alunos.loaded, true);
  assert.equal(previous.dashboard.loaded, true);
});

it('mantém os resultados dos outros módulos quando o histórico falha', async () => {
  const success = new Set<Resource>();
  const errors = new Map<Resource, string>();
  const data = initialData();
  const read: ReadApi = async <T>(path: string) => {
    if (path === '/analises') throw new Error('Histórico indisponível');
    const resource = path.slice(1).split('?')[0] as Resource;
    return data[resource] as T;
  };
  await loadResources('2026-10', read, {
    onSuccess: resource => { success.add(resource); },
    onFailure: (resource, message) => { errors.set(resource, message); },
  });
  assert.deepEqual([...success].sort(), ['alunos', 'aulas', 'dashboard', 'health', 'mensalidades', 'presencas', 'turmas']);
  assert.equal(errors.get('analises'), 'Histórico indisponível');
  assert.equal(errors.size, 1);
});

it('disponibiliza alunos antes que uma consulta de histórico lenta termine', { timeout: 3000 }, async () => {
  let finishHistory!: (value: unknown[]) => void;
  const history = new Promise<unknown[]>(accept => { finishHistory = accept; });
  let studentAvailable!: () => void;
  const available = new Promise<void>(accept => { studentAvailable = accept; });
  let finished = false;
  const read: ReadApi = async <T>(path: string) => (path === '/analises' ? await history : []) as T;
  const loading = loadResources('2026-10', read, {
    onSuccess: resource => { if (resource === 'alunos') studentAvailable(); },
    onFailure: () => { assert.fail('Nenhum módulo deveria falhar neste cenário.'); },
  }).then(() => { finished = true; });
  await available;
  assert.equal(finished, false);
  finishHistory([]);
  await loading;
  assert.equal(finished, true);
});

it('separa erro do dashboard e solicita o mês escolhido sem bloquear os demais dados', async () => {
  const paths: string[] = [];
  const succeeded: Resource[] = [];
  const errors: Resource[] = [];
  const read: ReadApi = async <T>(path: string) => {
    paths.push(path);
    if (path.startsWith('/dashboard')) throw new Error('Resumo indisponível');
    return [] as T;
  };
  await loadResources('2026-09', read, {
    onSuccess: resource => { succeeded.push(resource); }, onFailure: resource => { errors.push(resource); },
  });
  assert.ok(paths.includes('/dashboard?mes=2026-09'));
  assert.deepEqual(errors, ['dashboard']);
  assert.ok(succeeded.includes('alunos'));
  assert.ok(succeeded.includes('mensalidades'));
});

it('falha das turmas não bloqueia cadastros ou cobranças e não é apresentada como lista vazia válida', async () => {
  const succeeded: Resource[] = []; const errors: Resource[] = [];
  const read: ReadApi = async <T>(path: string) => {
    if (path === '/turmas') throw new Error('Turmas indisponíveis');
    return [] as T;
  };
  await loadResources('2026-10', read, { onSuccess: resource => { succeeded.push(resource); }, onFailure: resource => { errors.push(resource); } });
  assert.deepEqual(errors, ['turmas']); assert.ok(!succeeded.includes('turmas'));
  assert.ok(succeeded.includes('alunos')); assert.ok(succeeded.includes('mensalidades'));
});

it('falha das aulas fica isolada, sem representar agenda vazia válida nem bloquear turmas', async () => {
  const succeeded: Resource[] = []; const errors: Resource[] = [];
  const read: ReadApi = async <T>(path: string) => { if (path === '/aulas') throw new Error('Agenda indisponível'); return [] as T; };
  await loadResources('2026-10', read, { onSuccess: resource => { succeeded.push(resource); }, onFailure: resource => { errors.push(resource); } });
  assert.deepEqual(errors, ['aulas']); assert.ok(!succeeded.includes('aulas')); assert.ok(succeeded.includes('turmas')); assert.ok(succeeded.includes('alunos'));
});
