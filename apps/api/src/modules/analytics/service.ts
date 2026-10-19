import type { Analytics } from '@tatame/shared';
import type { Repository } from '../../repository.js';
import { currentMonth, today } from '../../domain.js';
import { HttpError } from '../../http-error.js';
import { analyticsResponseSchema } from './schema.js';

export async function calculateAnalytics(repo: Repository, mes: string, analyticsUrl: string): Promise<Analytics> {
  if (mes < '1900-01' || mes > currentMonth()) {
    throw new HttpError(400, 'Selecione um mês válido que já começou.');
  }
  const [alunos, mensalidades, presencas] = await Promise.all([
    repo.list('Aluno'), repo.list('Mensalidade'), repo.list('Presenca'),
  ]);
  let response: Response;
  try {
    response = await fetch(`${analyticsUrl}/analytics`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mes, hoje: today(),
        alunos: alunos.map(({ id, nome, faixa, dataMatricula, situacao }) => ({ id, nome, faixa, dataMatricula, situacao })),
        mensalidades, presencas,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new HttpError(503, 'O serviço de análises está indisponível. Reinicie o projeto com npm run dev.');
  }
  if (!response.ok) throw new HttpError(503, 'O serviço de análises não conseguiu calcular os indicadores.');

  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new HttpError(503, 'O serviço de análises retornou uma resposta inválida. Tente novamente.'); }

  const result = analyticsResponseSchema.safeParse(payload);
  if (!result.success || result.data.mes !== mes || !result.data.dataReferencia.startsWith(mes)) {
    throw new HttpError(503, 'O serviço de análises retornou dados incompatíveis. Os indicadores não foram utilizados.');
  }
  return result.data;
}
