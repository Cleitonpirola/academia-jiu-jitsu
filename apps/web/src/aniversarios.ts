import type { Aluno } from '@tatame/shared';

export function aniversariantesDoDia(alunos: readonly Aluno[], dia: string): Aluno[] {
  return alunos.filter(aluno => aluno.situacao === 'ativo' && aluno.dataNascimento.slice(5) === dia.slice(5) && aluno.dataNascimento <= dia)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function mensagemAniversario(nome: string): string {
  const primeiroNome = nome.trim().split(/\s+/)[0] || 'aluno';
  return `Parabéns pelo seu aniversário, ${primeiroNome}! Que este novo ciclo traga saúde, alegria e muitas conquistas dentro e fora do tatame. Oss!`;
}
