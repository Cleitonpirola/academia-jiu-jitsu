import type { AceiteAulaAdicional, Aluno, Aula, CheckinAula, CondicoesAulaAdicional, DebitoAula } from '@tatame/shared';
import { randomUUID } from 'node:crypto';
import { isDate, today } from '../../domain.js';
import { HttpError } from '../../http-error.js';
import { saldoMensal } from './saldo-mensal.js';

export const condicoesPadrao: CondicoesAulaAdicional = { valorAulaAdicionalCentavos: null, prazoPagamentoDias: 3 };
export const adicionalAtivo = (debito: DebitoAula) => !debito.canceladoEm && debito.statusPagamento !== 'cancelado';
export const debitoVencido = (debito: DebitoAula, referencia = today()) => adicionalAtivo(debito) && debito.statusPagamento === 'pendente' && debito.dataVencimento < referencia;
export function assertDebitosEmDia(debitos: DebitoAula[], alunoId: string) {
  if (debitos.some(item => item.alunoId === alunoId && debitoVencido(item))) throw new HttpError(403, 'Você possui débito de aula adicional vencido. Consulte o menu Débitos e procure a academia para regularizar.');
}
export function validarDataBaixa(debito: DebitoAula, dataPagamento: string) {
  const geradoEm = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date(debito.criadoEm));
  if (!isDate(dataPagamento) || dataPagamento > today() || dataPagamento < geradoEm) throw new HttpError(400,'A data do pagamento deve ficar entre a geração do débito e hoje.');
}
export function novoDebito(aluno: Aluno | undefined, aula: Aula | undefined, aulas: Aula[], checkins: CheckinAula[], debitos: DebitoAula[], condicoes: CondicoesAulaAdicional, aceite: AceiteAulaAdicional, timestamp: string): DebitoAula {
  if (!aluno || aluno.situacao !== 'ativo') throw new HttpError(403, 'Cadastro indisponível.');
  if (!aula) throw new HttpError(404, 'Aula não encontrada.');
  if(aula.origem!=='grade')throw new HttpError(409,'Escolha uma aula publicada a partir dos horários de uma turma.');
  if (aula.situacao !== 'agendada' || aula.dataAula < today() || aula.dataAula < aluno.dataMatricula) throw new HttpError(409, 'Escolha uma aula publicada de hoje ou de uma data futura.');
  assertDebitosEmDia(debitos, aluno.id);
  const saldo = saldoMensal(aluno, aulas, checkins, aula.dataAula, debitos);
  if (!saldo.limiteAtingido) throw new HttpError(409, 'O limite do plano ainda não foi atingido no mês da aula escolhida. Não é necessário comprar uma aula adicional.');
  if (checkins.some(item => item.alunoId === aluno.id && item.aulaId === aula.id)) throw new HttpError(409, 'Esta aula já possui seu check-in.');
  if (condicoes.valorAulaAdicionalCentavos === null) throw new HttpError(409, 'A academia ainda não configurou o valor da aula adicional.');
  if (aceite.valorEsperadoCentavos !== condicoes.valorAulaAdicionalCentavos || aceite.prazoEsperadoDias !== condicoes.prazoPagamentoDias) throw new HttpError(409, 'As condições da aula adicional foram atualizadas. Confira o novo valor e prazo antes de confirmar.');
  const vencimento = new Date(today() + 'T12:00:00Z'); vencimento.setUTCDate(vencimento.getUTCDate() + condicoes.prazoPagamentoDias);
  return { id: randomUUID(), alunoId: aluno.id, aulaId: aula.id, motivo: 'Aula adicional · ' + aula.titulo, aulaTitulo: aula.titulo, dataAula: aula.dataAula, horaInicio: aula.horaInicio,
    valorCentavos: condicoes.valorAulaAdicionalCentavos, prazoPagamentoDias: condicoes.prazoPagamentoDias, criadoEm: timestamp, dataVencimento: vencimento.toISOString().slice(0,10),
    statusPagamento: 'pendente', dataPagamento: null, baixadoPorId: null, canceladoEm: null, motivoCancelamento: null };
}
