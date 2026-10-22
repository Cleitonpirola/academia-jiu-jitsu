/// <reference types="node" />
import { it } from 'node:test';
import assert from 'node:assert/strict';
import type { Aluno } from '@tatame/shared';
import { aniversariantesDoDia, mensagemAniversario } from './aniversarios';
const aluno = (id: string, nascimento: string, situacao: Aluno['situacao'] = 'ativo'): Aluno => ({ id, nome: id, dataNascimento: nascimento, situacao, telefone: '', email: '', faixa: 'Branca', dataMatricula: '2026-01-01', criadoEm: '' });
it('aniversário de 22/10 aparece no dia 22 e não no dia 21', () => {
  const rows = [aluno('Ana', '2000-10-22'), aluno('Bruno', '1990-10-21')];
  assert.deepEqual(aniversariantesDoDia(rows, '2026-10-21').map(item => item.id), ['Bruno']);
  assert.deepEqual(aniversariantesDoDia(rows, '2026-10-22').map(item => item.id), ['Ana']);
});
it('considera alunos ativos, ordena vários aniversariantes e preserva os cadastros', () => {
  const rows = Object.freeze([aluno('Zeca', '1985-10-22'), aluno('Ana', '2000-10-22'), aluno('Inativo', '1980-10-22', 'inativo')]);
  assert.deepEqual(aniversariantesDoDia(rows, '2026-10-22').map(item => item.id), ['Ana', 'Zeca']);
  assert.equal(rows[0].id, 'Zeca');
});
it('não antecipa aniversário de 29/02 em um ano sem essa data nem confunde meses', () => {
  const rows = [aluno('Ana', '2000-02-29'), aluno('Bruno', '2000-11-22')];
  assert.equal(aniversariantesDoDia(rows, '2027-02-28').length, 0);
  assert.equal(aniversariantesDoDia(rows, '2028-02-29').length, 1);
  assert.equal(aniversariantesDoDia(rows, '2026-10-22').length, 0);
});
it('a homenagem usa o primeiro nome, sem chamar provedor de IA', () => {
  assert.equal(mensagemAniversario('  Ana   Alves  '), 'Parabéns pelo seu aniversário, Ana! Que este novo ciclo traga saúde, alegria e muitas conquistas dentro e fora do tatame. Oss!');
});
