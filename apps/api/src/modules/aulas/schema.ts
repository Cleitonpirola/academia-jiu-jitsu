import { z } from 'zod';
import { isDate } from '../../domain.js';

const date = z.string().refine(isDate, 'Informe uma data válida a partir de 1900.');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe um horário válido no formato HH:mm.');
export const aulaGradeSchema = z.object({ horarioId: z.string().uuid('Horário inválido.'), dataAula: date }).strict();
export const aulaExtraSchema = z.object({
  titulo: z.string().trim().min(2, 'Informe o título da aula.').max(120),
  dataAula: date, horaInicio: time, horaFim: time,
  professor: z.string().trim().min(2, 'Informe o professor responsável.').max(120),
  turmaId: z.string().uuid('Turma inválida.').nullable(),
}).strict().refine(value => value.horaFim > value.horaInicio, { path: ['horaFim'], message: 'O término deve ser depois do início, no mesmo dia.' });
export const cancelarAulaSchema = z.object({ motivo: z.string().trim().min(3, 'Informe o motivo do cancelamento (pelo menos 3 caracteres).').max(300) }).strict();
export const filtroAulasSchema = z.object({
  dataInicio: date.optional(), dataFim: date.optional(), turmaId: z.string().uuid().optional(),
  situacao: z.enum(['agendada', 'cancelada']).optional(),
}).strict().refine(value => !value.dataInicio || !value.dataFim || value.dataInicio <= value.dataFim, 'A data final deve ser igual ou posterior à inicial.');
