import type { Aluno, Aula } from '@tatame/shared';
import { today } from '../../domain.js';
import { HttpError } from '../../http-error.js';

export function validateAulaChamada(aula: Aula | null): asserts aula is Aula {
  if (!aula) throw new HttpError(404, 'Aula não encontrada.');
  if (aula.situacao === 'cancelada') throw new HttpError(409, 'Uma aula cancelada não recebe marcações de chamada.');
  if (aula.dataAula > today()) throw new HttpError(400, 'A chamada só pode ser registrada na data da aula ou depois dela.');
}

export function validateAlunoChamada(aluno: Aluno | null, dataAula: string, existing: boolean): asserts aluno is Aluno {
  if (!aluno) throw new HttpError(404, 'Aluno não encontrado.');
  if (!existing && aluno.situacao !== 'ativo') throw new HttpError(409, 'Ative o cadastro do aluno antes de incluí-lo na chamada.');
  if (dataAula < aluno.dataMatricula) throw new HttpError(400, 'O treino não pode ser anterior à matrícula do aluno.');
}

export function assertSemChamada(hasRecords: boolean) {
  if (hasRecords) throw new HttpError(409, 'Esta aula possui marcações de chamada. Para preservar o histórico, ela não pode ser cancelada ou excluída. Se as marcações estiverem erradas, limpe-as primeiro.');
}
