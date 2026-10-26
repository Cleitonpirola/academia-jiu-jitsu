import type { AulaView } from '@tatame/shared';

/** Check-in confirma a intenção; somente a chamada confirma a presença. */
export function confirmadosAula(aula: AulaView) {
  const chamada = new Map(aula.chamada.map(item => [item.alunoId, item]));
  const rows = new Map(aula.checkins.filter(item => chamada.get(item.alunoId)?.presente !== false)
    .map(item => [item.alunoId, { alunoId: item.alunoId, nome: chamada.get(item.alunoId)?.nome ?? item.nome, presente: chamada.get(item.alunoId)?.presente === true, temCheckin: true }]));
  for (const item of aula.chamada) if (item.presente && !rows.has(item.alunoId)) rows.set(item.alunoId, { alunoId: item.alunoId, nome: item.nome, presente: true, temCheckin: false });
  return [...rows.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
