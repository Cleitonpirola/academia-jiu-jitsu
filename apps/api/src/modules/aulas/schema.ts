import { z } from 'zod';
import { isDate } from '../../domain.js';

const date = z.string().refine(isDate, 'Informe uma data válida a partir de 1900.');
export const aulaGradeSchema = z.object({ horarioId: z.string().uuid('Horário inválido.'), dataAula: date }).strict();
export const nomeAulaSchema = z.object({ titulo: z.string().trim().min(2, 'Informe um nome com pelo menos 2 caracteres.').max(120, 'Use até 120 caracteres no nome da aula.') }).strict();
export const professoresAulaSchema = z.object({ professores: z.array(z.string().trim().min(2, 'Informe o nome do professor.').max(120))
  .min(1, 'Mantenha pelo menos um professor na aula.').max(8, 'Use até 8 professores por aula.')
  .refine(nomes => new Set(nomes.map(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLowerCase())).size === nomes.length, 'Não repita o mesmo professor na aula.') }).strict();
export const cancelarAulaSchema = z.object({ motivo: z.string().trim().min(3, 'Informe o motivo do cancelamento (pelo menos 3 caracteres).').max(300) }).strict();
export const filtroAulasSchema = z.object({
  dataInicio: date.optional(), dataFim: date.optional(), turmaId: z.string().uuid().optional(),
  situacao: z.enum(['agendada', 'cancelada']).optional(),
}).strict().refine(value => !value.dataInicio || !value.dataFim || value.dataInicio <= value.dataFim, 'A data final deve ser igual ou posterior à inicial.');
