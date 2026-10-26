import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Aula, AulaAlunoPrevisto, AulaView, PresencaAula, Turma, CheckinAula } from '@tatame/shared';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';
import { aulaGradeSchema, cancelarAulaSchema, filtroAulasSchema } from './schema.js';

export function createAulasService(repo: Repository) {
  const find = async (id: string) => {
    if (!z.string().uuid().safeParse(id).success) throw new HttpError(404, 'Aula não encontrada.');
    const aula = await repo.get('Aula', id);
    if (!aula) throw new HttpError(404, 'Aula não encontrada.');
    return aula;
  };
  const view = (aula: Aula, alunos: AulaAlunoPrevisto[], chamada: PresencaAula[] = [], checkins: CheckinAula[] = []): AulaView => ({ ...aula,
    alunosPrevistos: alunos.filter(aluno => aluno.aulaId === aula.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    chamada: chamada.filter(registro => registro.aulaId === aula.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    checkins: checkins.filter(registro => registro.aulaId === aula.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  });
  const detail = async (id: string) => view(await find(id), await repo.list('AulaAlunoPrevisto'), await repo.list('PresencaAula'), await repo.list('CheckinAula'));
  const activeTurma = async (id: string) => {
    const turma = await repo.get('Turma', id);
    if (!turma) throw new HttpError(404, 'Turma não encontrada.');
    if (turma.situacao !== 'ativo') throw new HttpError(400, 'Ative a turma antes de criar uma nova aula vinculada a ela.');
    return turma;
  };
  const create = async (fields: Pick<Aula, 'titulo' | 'dataAula' | 'horaInicio' | 'horaFim' | 'professor' | 'origem' | 'origemHorarioId'>, turma: Turma | null) => {
    const aula: Aula = { ...fields, id: randomUUID(), turmaId: turma?.id ?? null, turmaNome: turma?.nome ?? null,
      situacao: 'agendada', motivoCancelamento: null, canceladaEm: null, criadoEm: new Date().toISOString(),
    };
    const [students, links] = turma ? await Promise.all([repo.list('Aluno'), repo.list('AlunoTurma')]) : [[], []];
    const expectedIds = new Set(links.filter(link => link.turmaId === turma?.id).map(link => link.alunoId));
    const alunos = students.filter(student => student.situacao === 'ativo' && expectedIds.has(student.id))
      .map(student => ({ id: randomUUID(), aulaId: aula.id, alunoId: student.id, nome: student.nome }));
    await repo.createAula(aula, alunos);
    return view(aula, alunos);
  };
  const fromSlot = async (horarioId: string, dataAula: string) => (await repo.list('Aula')).find(aula => aula.origemHorarioId === horarioId && aula.dataAula === dataAula);
  return {
    detail,
    async list(query: unknown = {}) {
      const filter = filtroAulasSchema.parse(query);
      const [aulas, alunos, chamada, checkins] = await Promise.all([repo.list('Aula'), repo.list('AulaAlunoPrevisto'), repo.list('PresencaAula'), repo.list('CheckinAula')]);
      return aulas.filter(aula => (!filter.dataInicio || aula.dataAula >= filter.dataInicio) && (!filter.dataFim || aula.dataAula <= filter.dataFim) &&
        (!filter.turmaId || aula.turmaId === filter.turmaId) && (!filter.situacao || aula.situacao === filter.situacao))
        .sort((a, b) => a.dataAula.localeCompare(b.dataAula) || a.horaInicio.localeCompare(b.horaInicio) || a.titulo.localeCompare(b.titulo, 'pt-BR'))
        .map(aula => view(aula, alunos, chamada, checkins));
    },
    async createFromGrade(body: unknown) {
      const { horarioId, dataAula } = aulaGradeSchema.parse(body);
      const existing = await fromSlot(horarioId, dataAula);
      if (existing) return { aula: await detail(existing.id), created: false };
      const horario = await repo.get('HorarioTurma', horarioId);
      if (!horario) throw new HttpError(404, 'Horário da grade não encontrado. Atualize a lista de turmas.');
      const turma = await activeTurma(horario.turmaId);
      if (new Date(dataAula + 'T12:00:00Z').getUTCDay() !== horario.diaSemana) throw new HttpError(400, 'A data escolhida não corresponde ao dia da semana deste horário.');
      try {
        const aula = await create({ titulo: turma.nome, professor: turma.professor, dataAula, horaInicio: horario.horaInicio, horaFim: horario.horaFim, origem: 'grade', origemHorarioId: horarioId }, turma);
        return { aula, created: true };
      } catch (error) {
        // Duas requisições podem passar pela consulta inicial. A unicidade do banco decide.
        if (String((error as { code?: string }).code) === 'P2002' || /UNIQUE constraint failed/.test(String((error as Error).message))) {
          const concurrent = await fromSlot(horarioId, dataAula);
          if (concurrent) return { aula: await detail(concurrent.id), created: false };
        }
        throw error;
      }
    },
    async cancel(id: string, body: unknown) {
      const { motivo } = cancelarAulaSchema.parse(body);
      await find(id);
      await repo.cancelAula(id, motivo, new Date().toISOString());
      return detail(id);
    },
  };
}
