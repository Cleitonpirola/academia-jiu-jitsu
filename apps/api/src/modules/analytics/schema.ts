import { z } from 'zod';
import { FAIXAS, type Analytics } from '@tatame/shared';
import { isDate, monthSchema } from '../../domain.js';

const count = z.number().int().nonnegative();
const calendarDate = z.string().refine(isDate);

// Campos adicionais podem ser introduzidos sem quebrar leitores antigos; campos usados são obrigatórios.
export const analyticsResponseSchema = z.object({
  mes: monthSchema,
  dataReferencia: calendarDate,
  alunosAtivos: count,
  alunosInadimplentes: count,
  receitaCentavos: count,
  inadimplenciaCentavos: count,
  frequenciaMedia: z.number().nonnegative(),
  alunosEmRisco: count,
  presencasNoMes: count,
  riscos: z.array(z.object({
    alunoId: z.string().min(1), nome: z.string().min(1), faixa: z.enum(FAIXAS),
    frequenciaAtual: count, frequenciaAnterior: count, diasSemTreinar: count,
    pontos: count.max(100), nivel: z.enum(['baixo', 'medio', 'alto']), sinais: z.array(z.string()),
  })),
  receitaMensal: z.array(z.object({ mes: monthSchema, receitaCentavos: count })),
}) satisfies z.ZodType<Analytics>;
