import { it } from 'node:test';
import assert from 'node:assert/strict';
import { cursorAposDigitos, mascaraTelefone, telefoneLabel } from './telefone';
it('formata celular/fixo com DDD e mantém colagem já formatada', () => {
  for (const [input, expected] of [['11999991234', '(11) 99999-1234'], ['1133331234', '(11) 3333-1234'], ['(11) 99999-1234', '(11) 99999-1234'], ['abc11999991234', '(11) 99999-1234']]) assert.equal(mascaraTelefone(input), expected);
});
it('permite digitação parcial, apagar tudo e limita número nacional a 11 dígitos', () => {
  assert.equal(mascaraTelefone(''), ''); assert.equal(mascaraTelefone('1'), '(1'); assert.equal(mascaraTelefone('119'), '(11) 9');
  assert.equal(mascaraTelefone('999999999999'), '(99) 99999-9999');
});
it('reconhece código 55 na colagem e preserva números internacionais explícitos e legados', () => {
  assert.equal(mascaraTelefone('+55 11 99999-1234'), '+55 (11) 99999-1234');
  assert.equal(mascaraTelefone('5511999991234'), '+55 (11) 99999-1234');
  assert.equal(mascaraTelefone('+1 212 555 1234'), '+12125551234');
  assert.equal(telefoneLabel('12345678901234'), '12345678901234');
});
it('reposiciona cursor pelos dígitos ao editar o meio do telefone', () => {
  assert.equal(cursorAposDigitos('(11) 99999-1234', 3), 6); assert.equal(cursorAposDigitos('(11) 99999-1234', 0), 0);
});
