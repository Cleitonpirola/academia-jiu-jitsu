import { z } from 'zod';
import { isDate } from '../../domain.js';

const date = z.string().refine(isDate, 'Informe uma data válida a partir de 1900.');
export const aulaGradeSchema = z.object({ horarioId: z.string().uuid('Horário inválido.'), dataAula: date }).strict();
export const cancelarAulaSchema = z.object({ motivo: z.string().trim().min(3, 'Informe o motivo do cancelamento (pelo menos 3 caracteres).').max(300) }).strict();
export const filtroAulasSchema = z.object({
  dataInicio: date.optional(), dataFim: date.optional(), turmaId: z.string().uuid().optional(),
  situacao: z.enum(['agendada', 'cancelada']).optional(),
}).strict().refine(value => !value.dataInicio || !value.dataFim || value.dataInicio <= value.dataFim, 'A data final deve ser igual ou posterior à inicial.');
