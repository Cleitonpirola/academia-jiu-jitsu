import type { Aluno, Aula, CheckinAula, DebitoAula, SaldoMensal } from '@tatame/shared';
import { today } from '../../domain.js';
import { HttpError } from '../../http-error.js';

export function saldoMensal(aluno: Aluno, aulas: Aula[], checkins: CheckinAula[], referencia = today(), debitos: DebitoAula[] = []): SaldoMensal {
  const competencia = referencia.slice(0, 7);
  const validas = new Set(aulas.filter(aula => aula.situacao === 'agendada' && aula.dataAula.startsWith(competencia + '-')).map(aula => aula.id));
  const adicionais = new Set(debitos.filter(item => item.alunoId === aluno.id && !item.canceladoEm && item.statusPagamento !== 'cancelado').map(item => item.aulaId));
  const usados = [...new Set(checkins.filter(item => item.alunoId === aluno.id && validas.has(item.aulaId)).map(item => item.aulaId))];
  const utilizadas = usados.filter(id => !adicionais.has(id)).length, adicionaisUtilizadas = usados.filter(id => adicionais.has(id)).length;
  const limiteMensal = aluno.limiteAulasMensal ?? null;
  return { competencia, limiteMensal, utilizadas, adicionaisUtilizadas, restantes: limiteMensal === null ? null : Math.max(0, limiteMensal - utilizadas), limiteAtingido: limiteMensal !== null && utilizadas >= limiteMensal };
}
export function assertSaldoMensal(saldo: SaldoMensal) {
  if (saldo.limiteAtingido) throw new HttpError(403, 'O limite de aulas do mês já foi atingido.');
}
export function camposSaldo(saldo: SaldoMensal) {
  return { limiteAulasMensal: saldo.limiteMensal, aulasRestantesMes: saldo.restantes, mesSaldoAulas: saldo.limiteMensal === null ? null : saldo.competencia };
}
/** Mantém o formato de cadastros antigos sem configuração mensal. */
export function limparSaldoNulo<T>(row: T): T {
  if (!row || typeof row !== 'object' || !('dataNascimento' in row)) return row;
  const record = row as Record<string, unknown>;
  const copy = { ...record };
  if(record.faixaId==null)delete copy.faixaId;
  if(record.grauId==null)delete copy.grauId;
  if(record.limiteAulasMensal == null && record.aulasRestantesMes == null && record.mesSaldoAulas == null){delete copy.limiteAulasMensal; delete copy.aulasRestantesMes; delete copy.mesSaldoAulas;}
  if(Boolean(record.possuiCelular) && record.acessoPrincipal==='aluno' && record.responsabilidadeTransferidaEm == null){delete copy.possuiCelular;delete copy.acessoPrincipal;delete copy.responsabilidadeTransferidaEm;}
  return copy as T;
}
