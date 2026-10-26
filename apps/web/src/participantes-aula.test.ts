import { it } from 'node:test';
import assert from 'node:assert/strict';
import type { AulaView } from '@tatame/shared';
import { confirmadosAula } from './participantes-aula';

it('confirmados excluem previsão e ausência e incluem presença manual sem duplicar check-in', () => {
  const aula = { alunosPrevistos: [{ alunoId: 'previsto', nome: 'Só previsto' }],
    checkins: [{ alunoId: 'ana', nome: 'Ana' }, { alunoId: 'bruno', nome: 'Bruno' }, { alunoId: 'ausente', nome: 'Ausente' }],
    chamada: [{ alunoId: 'ana', nome: 'Ana histórica', presente: true }, { alunoId: 'manual', nome: 'Carlos', presente: true }, { alunoId: 'ausente', nome: 'Ausente', presente: false }] } as AulaView;
  assert.deepEqual(confirmadosAula(aula), [
    { alunoId: 'ana', nome: 'Ana histórica', presente: true, temCheckin: true },
    { alunoId: 'bruno', nome: 'Bruno', presente: false, temCheckin: true },
    { alunoId: 'manual', nome: 'Carlos', presente: true, temCheckin: false },
  ]);
});
it('alunos previstos sozinhos não tornam a aula confirmada', () => {
  assert.deepEqual(confirmadosAula({ alunosPrevistos: [{ alunoId: 'a', nome: 'A' }], checkins: [], chamada: [] } as unknown as AulaView), []);
});
