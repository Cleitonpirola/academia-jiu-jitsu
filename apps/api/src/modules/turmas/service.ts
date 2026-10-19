import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Turma, TurmaView, HorarioTurma, AlunoTurma } from '@tatame/shared';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';
import { turmaSchema } from './schema.js';

export function createTurmasService(repo: Repository) {
  const find = async (id: string): Promise<Turma> => {
    if (!z.string().uuid().safeParse(id).success) throw new HttpError(404, 'Turma não encontrada.');
    const turma = await repo.get('Turma', id);
    if (!turma) throw new HttpError(404, 'Turma não encontrada.');
    return turma;
  };
  const view = (turma: Turma, horarios: HorarioTurma[], alunos: AlunoTurma[]): TurmaView => ({
    ...turma,
    horarios: horarios.filter(item => item.turmaId === turma.id).sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio)),
    alunoIds: alunos.filter(item => item.turmaId === turma.id).map(item => item.alunoId).sort(),
  });
  const detail = async (id: string) => {
    const [turma, horarios, alunos] = await Promise.all([find(id), repo.list('HorarioTurma'), repo.list('AlunoTurma')]);
    return view(turma, horarios, alunos);
  };
  return {
    detail,
    async list() {
      const [turmas, horarios, alunos] = await Promise.all([repo.list('Turma'), repo.list('HorarioTurma'), repo.list('AlunoTurma')]);
      return turmas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(turma => view(turma, horarios, alunos));
    },
    async save(body: unknown, id?: string) {
      const input = turmaSchema.parse(body);
      const previous = id ? await find(id) : null;
      const [students, previousLinks, previousTimes] = await Promise.all([repo.list('Aluno'), repo.list('AlunoTurma'), repo.list('HorarioTurma')]);
      const byId = new Map(students.map(student => [student.id, student]));
      const existingLinks = previousLinks.filter(link => link.turmaId === id);
      for (const alunoId of input.alunoIds) {
        const student = byId.get(alunoId);
        if (!student) throw new HttpError(400, 'Um dos alunos selecionados não está cadastrado. Atualize a lista.');
        if (student.situacao !== 'ativo' && !existingLinks.some(link => link.alunoId === alunoId)) {
          throw new HttpError(400, 'Novos vínculos exigem alunos ativos. Ative o aluno antes de vinculá-lo.');
        }
      }
      const timestamp = new Date().toISOString();
      const turma: Turma = {
        id: previous?.id ?? randomUUID(), nome: input.nome, professor: input.professor, situacao: input.situacao,
        criadoEm: previous?.criadoEm ?? timestamp, atualizadoEm: timestamp,
      };
      const horarios = input.horarios.map(horario => ({ ...horario, turmaId: turma.id,
        id: previousTimes.find(old => old.turmaId === turma.id && old.diaSemana === horario.diaSemana && old.horaInicio === horario.horaInicio)?.id ?? randomUUID(),
      }));
      const alunos = input.alunoIds.map(alunoId => {
        const old = existingLinks.find(link => link.alunoId === alunoId);
        return { id: old?.id ?? randomUUID(), turmaId: turma.id, alunoId, criadoEm: old?.criadoEm ?? timestamp };
      });
      await repo.saveTurma(turma, horarios, alunos, !previous);
      return view(turma, horarios, alunos);
    },
    async setSituation(id: string, situacao: Turma['situacao']) {
      await find(id);
      await repo.update('Turma', id, { situacao, atualizadoEm: new Date().toISOString() });
      return detail(id);
    },
    async remove(id: string) {
      await find(id);
      await repo.removeTurma(id);
    },
  };
}
