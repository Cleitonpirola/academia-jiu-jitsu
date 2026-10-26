import type { Aula, CheckinAula, DebitoAula, LiberacaoAula, PlanoAluno, Presenca, PresencaAula, UsoPlano } from '@tatame/shared';
import { today } from '../../domain.js';
import { HttpError } from '../../http-error.js';

export interface ContextoPlano { plano: PlanoAluno | null; aulas: Aula[]; checkins: CheckinAula[]; chamada: PresencaAula[]; antigas: Presenca[]; liberacoes: LiberacaoAula[]; debitos?: DebitoAula[] }

export function semana(data: string) {
  const inicio = new Date(data + 'T12:00:00Z');
  inicio.setUTCDate(inicio.getUTCDate() - (inicio.getUTCDay() + 6) % 7);
  const fim = new Date(inicio); fim.setUTCDate(fim.getUTCDate() + 6);
  return { inicioSemana: inicio.toISOString().slice(0, 10), fimSemana: fim.toISOString().slice(0, 10) };
}

export function usoPlano(ctx: ContextoPlano, alunoId: string, referencia = today()): UsoPlano {
  const periodo = semana(referencia);
  const dentro = (data: string) => data >= periodo.inicioSemana && data <= periodo.fimSemana;
  const aulas = ctx.aulas.filter(aula => aula.situacao === 'agendada' && dentro(aula.dataAula));
  const checkins = new Set(ctx.checkins.filter(item => item.alunoId === alunoId).map(item => item.aulaId));
  const chamada = new Map(ctx.chamada.filter(item => item.alunoId === alunoId).map(item => [item.aulaId, item]));
  const liberadas = new Set(ctx.liberacoes.filter(item => item.alunoId === alunoId).map(item => item.aulaId));
  for (const item of ctx.debitos ?? []) if (item.alunoId === alunoId && !item.canceladoEm && item.statusPagamento !== 'cancelado') liberadas.add(item.aulaId);
  const usadas = aulas.filter(aula => chamada.has(aula.id) ? chamada.get(aula.id)!.presente : checkins.has(aula.id));
  const extrasUtilizadas = usadas.filter(aula => liberadas.has(aula.id)).length;
  const utilizadas = usadas.length - extrasUtilizadas + ctx.antigas.filter(item => item.alunoId === alunoId && item.presente && dentro(item.dataTreino)).length;
  const limiteSemanal = ctx.plano?.limiteSemanal ?? null;
  return { ...periodo, nome: ctx.plano?.nome ?? 'Ilimitado', limiteSemanal, utilizadas, extrasUtilizadas,
    restantes: limiteSemanal === null ? null : Math.max(0, limiteSemanal - utilizadas),
    limiteAtingido: limiteSemanal !== null && utilizadas >= limiteSemanal,
    aulasLiberadas: aulas.filter(aula => liberadas.has(aula.id)).map(aula => aula.id),
  };
}

export function assertCotaCheckin(ctx: ContextoPlano, alunoId: string, aulaId: string) {
  const uso = usoPlano(ctx, alunoId);
  if (uso.limiteAtingido && !uso.aulasLiberadas.includes(aulaId)) throw new HttpError(403, 'Seu limite semanal de aulas foi atingido. Converse com a academia para autorizar uma aula extra.');
}

export function assertPodeLiberar(ctx: ContextoPlano, alunoId: string, aulaId: string) {
  const uso = usoPlano(ctx, alunoId);
  if (!uso.limiteAtingido) throw new HttpError(409, 'Este aluno ainda possui aulas disponíveis ou tem plano ilimitado.');
  if (ctx.checkins.some(item => item.alunoId === alunoId && item.aulaId === aulaId) || ctx.chamada.some(item => item.alunoId === alunoId && item.aulaId === aulaId)) throw new HttpError(409, 'Esta aula já possui check-in ou chamada para o aluno.');
}
