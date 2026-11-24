import type { Aluno, Aula } from '@tatame/shared';
import { HttpError } from '../../http-error.js';
import { today } from '../../domain.js';

export function validateCheckin(aula: Aula | undefined, aluno: Aluno | undefined, { somenteNoDia = false } = {}): asserts aula is Aula {
  if (!aula) throw new HttpError(404, 'Aula não encontrada.');
  if (!aluno || aluno.situacao !== 'ativo') throw new HttpError(403, 'Seu cadastro está inativo. Converse com a academia.');
  if (aula.situacao !== 'agendada') throw new HttpError(409, 'Esta aula foi cancelada.');
  const hoje = today();
  if (aula.dataAula < hoje) throw new HttpError(400, 'Esta aula já passou. Procure a academia para ajustar a chamada.');
  if (somenteNoDia && aula.dataAula > hoje) throw new HttpError(400, 'A liberação de aula extra fica disponível no dia da aula.');
  if (aula.dataAula < aluno.dataMatricula) throw new HttpError(400, 'A aula é anterior à sua matrícula.');
}
