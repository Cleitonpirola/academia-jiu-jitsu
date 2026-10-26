// Fixture: publica aula a partir de uma turma, sem reativar a API removida de avulsas.
import { randomUUID } from 'node:crypto';
import type { Aula } from '@tatame/shared';
import type { Repository } from './repository.js';
import { createAulasService } from './modules/aulas/service.js';
export type AulaDeTesteInput=Pick<Aula,'titulo'|'professor'|'dataAula'|'horaInicio'|'horaFim'|'turmaId'>;
export async function criarAulaDeTeste(repo:Repository,input:AulaDeTesteInput){
  const existente=input.turmaId?await repo.get('Turma',input.turmaId):null;
  const id=existente?.id??randomUUID(),horarioId=randomUUID(),now=new Date().toISOString();
  const horarios=existente?(await repo.list('HorarioTurma')).filter(h=>h.turmaId===id):[],alunos=existente?(await repo.list('AlunoTurma')).filter(a=>a.turmaId===id):[];
  await repo.saveTurma(existente??{id,nome:input.titulo,professor:input.professor,situacao:'ativo',criadoEm:now,atualizadoEm:now},[...horarios,{id:horarioId,turmaId:id,diaSemana:new Date(input.dataAula+'T12:00:00Z').getUTCDay(),horaInicio:input.horaInicio,horaFim:input.horaFim}],alunos,!existente);
  return (await createAulasService(repo).createFromGrade({horarioId,dataAula:input.dataAula})).aula;
}
