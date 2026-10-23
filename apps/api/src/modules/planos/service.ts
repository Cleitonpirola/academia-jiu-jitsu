import type { Repository } from '../../repository.js';
import type { ContextoPlano } from './rules.js';

export async function contextoPlano(repo: Repository, alunoId: string): Promise<ContextoPlano> {
  const [planos, aulas, checkins, chamada, antigas, liberacoes] = await Promise.all([
    repo.list('PlanoAluno'), repo.list('Aula'), repo.list('CheckinAula'), repo.list('PresencaAula'), repo.list('Presenca'), repo.list('LiberacaoAula'),
  ]);
  return { plano: planos.find(item => item.alunoId === alunoId) ?? null, aulas,
    checkins: checkins.filter(item => item.alunoId === alunoId), chamada: chamada.filter(item => item.alunoId === alunoId),
    antigas: antigas.filter(item => item.alunoId === alunoId), liberacoes: liberacoes.filter(item => item.alunoId === alunoId) };
}
