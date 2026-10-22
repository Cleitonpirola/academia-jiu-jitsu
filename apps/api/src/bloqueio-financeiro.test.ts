import { it } from 'node:test';
import assert from 'node:assert/strict';
import type { Mensalidade } from '@tatame/shared';
import { bloqueioFinanceiro, assertFinanceiroRegular, MENSAGEM_DEBITO } from './modules/auth/financial-access.js';
import { HttpError } from './http-error.js';

const cobranca = (fields: Partial<Mensalidade> = {}): Mensalidade => ({
  id: 'cobranca-1', alunoId: 'aluno-1', competencia: '2026-10', valorCentavos: 18000,
  dataVencimento: '2026-10-10', dataPagamento: null, criadoEm: '2026-10-01T12:00:00.000Z', ...fields,
});

it('vencimento dia 10 permite acesso no dia 10 e bloqueia no dia 11 sem tarefa agendada', () => {
  const rows = [cobranca()];
  assert.equal(bloqueioFinanceiro(rows, 'aluno-1', '2026-10-09'), null);
  assert.equal(bloqueioFinanceiro(rows, 'aluno-1', '2026-10-10'), null);
  assert.equal(bloqueioFinanceiro(rows, 'aluno-1', '2026-10-11')?.bloqueado, true);
  assert.throws(() => assertFinanceiroRegular(rows, 'aluno-1', '2026-10-11'), error => error instanceof HttpError && error.status === 403 && error.message === MENSAGEM_DEBITO);
});

it('considera débitos de meses anteriores e ignora pagos, futuros e de outro aluno', () => {
  const antigo = cobranca({ id: 'antigo', competencia: '2026-07', dataVencimento: '2026-07-10' });
  const rows = [antigo, cobranca({ id: 'pago', dataPagamento: '2026-10-11' }), cobranca({ id: 'outro', alunoId: 'aluno-2' }), cobranca({ id: 'futuro', dataVencimento: '2026-11-10' })];
  assert.deepEqual(bloqueioFinanceiro(rows, 'aluno-1', '2026-10-11')?.pendencias.map(item => item.id), ['antigo']);
  assert.equal(bloqueioFinanceiro(rows.filter(item => item.id !== 'antigo'), 'aluno-1', '2026-10-11'), null);
});

it('devolve apenas dados financeiros próprios necessários, ordenados, sem modificar cobranças', () => {
  const rows = [cobranca(), cobranca({ id: 'primeira', competencia: '2026-09', dataVencimento: '2026-09-10' })];
  const before = structuredClone(rows);
  const result = bloqueioFinanceiro(rows, 'aluno-1', '2026-10-11')!;
  assert.deepEqual(result.pendencias.map(item => item.id), ['primeira', 'cobranca-1']);
  assert.deepEqual(Object.keys(result.pendencias[0]).sort(), ['competencia', 'dataVencimento', 'id', 'valorCentavos']);
  assert.deepEqual(rows, before);
});

it('só libera após quitar todos os vencidos e volta a bloquear se o pagamento for desfeito', () => {
  const rows = [cobranca(), cobranca({ id: 'segunda', competencia: '2026-09', dataVencimento: '2026-09-10' })];
  rows[0].dataPagamento = '2026-10-11';
  assert.equal(bloqueioFinanceiro(rows, 'aluno-1', '2026-10-11')?.pendencias.length, 1);
  rows[1].dataPagamento = '2026-10-11';
  assert.equal(bloqueioFinanceiro(rows, 'aluno-1', '2026-10-11'), null);
  rows[0].dataPagamento = null;
  assert.equal(bloqueioFinanceiro(rows, 'aluno-1', '2026-10-11')?.pendencias.length, 1);
});
