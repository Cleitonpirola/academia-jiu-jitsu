import type { BloqueioAluno, Mensalidade } from '@tatame/shared';
import { statusOf, today } from '../../domain.js';
import { HttpError } from '../../http-error.js';

export const MENSAGEM_DEBITO = 'Débito em aberto. Consulte seu professor para regularizar sua mensalidade e liberar o acesso.';

/** O bloqueio é calculado na consulta, sem mudar a situação cadastral do aluno. */
export function bloqueioFinanceiro(mensalidades: Mensalidade[], alunoId: string, reference = today()): BloqueioAluno | null {
  const pendencias = mensalidades.filter(item => item.alunoId === alunoId && statusOf(item, reference) === 'atrasado')
    .map(({ id, competencia, valorCentavos, dataVencimento }) => ({ id, competencia, valorCentavos, dataVencimento }))
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento) || a.id.localeCompare(b.id));
  return pendencias.length ? { bloqueado: true, mensagem: MENSAGEM_DEBITO, pendencias } : null;
}

export function assertFinanceiroRegular(mensalidades: Mensalidade[], alunoId: string, reference = today()) {
  if (bloqueioFinanceiro(mensalidades, alunoId, reference)) throw new HttpError(403, MENSAGEM_DEBITO);
}
