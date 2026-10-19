import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe um horário válido no formato HH:mm.');
export const turmaSituacaoSchema = z.object({ situacao: z.enum(['ativo', 'inativo']) }).strict();
export const turmaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da turma.').max(120),
  professor: z.string().trim().min(2, 'Informe o professor responsável.').max(120),
  situacao: z.enum(['ativo', 'inativo']),
  horarios: z.array(z.object({
    diaSemana: z.number().int().min(0).max(6), horaInicio: time, horaFim: time,
  }).strict()).min(1, 'Adicione pelo menos um horário à grade.').max(100),
  alunoIds: z.array(z.string().uuid('Selecione alunos cadastrados.')).max(500),
}).strict().superRefine((value, context) => {
  if (new Set(value.alunoIds).size !== value.alunoIds.length) {
    context.addIssue({ code: 'custom', path: ['alunoIds'], message: 'O mesmo aluno não pode ser vinculado duas vezes à turma.' });
  }
  for (const [index, horario] of value.horarios.entries()) {
    if (horario.horaFim <= horario.horaInicio) context.addIssue({ code: 'custom', path: ['horarios', index, 'horaFim'], message: 'O término deve ser depois do início, no mesmo dia.' });
    if (value.horarios.slice(0, index).some(other => other.diaSemana === horario.diaSemana && horario.horaInicio < other.horaFim && horario.horaFim > other.horaInicio)) {
      context.addIssue({ code: 'custom', path: ['horarios', index], message: 'Os horários da mesma turma não podem se repetir ou se sobrepor.' });
    }
  }
});
