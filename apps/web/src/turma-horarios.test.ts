/// <reference types="node" />
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { agruparHorarios, expandirHorarios } from './turma-horarios';
const noon = { horaInicio: '12:00', horaFim: '13:00' };
const evening = { horaInicio: '18:00', horaFim: '19:00' };
const ordered = <T extends { diaSemana: number; horaInicio: string }>(rows: T[]) => [...rows].sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));

it('combina três dias com dois horários e gera seis itens no contrato existente', () => {
  const result = expandirHorarios([{ diasSemana: [5, 1, 3], intervalos: [noon, evening] }]);
  assert.deepEqual(result, [1, 3, 5].flatMap(diaSemana => [{ diaSemana, ...noon }, { diaSemana, ...evening }]));
});
it('uma segunda-feira pode reunir três horários na mesma combinação', () => {
  const afternoon = { horaInicio: '15:00', horaFim: '16:00' };
  assert.deepEqual(expandirHorarios([{ diasSemana: [1], intervalos: [noon, afternoon, evening] }]), [noon, afternoon, evening].map(intervalo => ({ diaSemana: 1, ...intervalo })));
});
it('agrupa dias que possuem o mesmo conjunto completo, independentemente da ordem original', () => {
  const original = [{ diaSemana: 3, ...evening }, { diaSemana: 1, ...noon }, { diaSemana: 5, ...evening }, { diaSemana: 3, ...noon }, { diaSemana: 1, ...evening }, { diaSemana: 5, ...noon }];
  const groups = agruparHorarios(original);
  assert.deepEqual(groups, [{ diasSemana: [1, 3, 5], intervalos: [noon, evening] }]);
  assert.deepEqual(ordered(expandirHorarios(groups)), ordered(original));
});
it('não inventa horários em dias com grades diferentes nem envia IDs extras', () => {
  const original = [{ id: 'seg12', diaSemana: 1, ...noon }, { id: 'seg18', diaSemana: 1, ...evening }, { id: 'qua12', diaSemana: 3, ...noon }, { id: 'sex12', diaSemana: 5, ...noon }];
  const groups = agruparHorarios(original);
  assert.deepEqual(groups.map(group => group.diasSemana), [[1], [3, 5]]);
  const result = expandirHorarios(groups);
  assert.deepEqual(ordered(result), ordered(original.map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim }))));
  assert.equal(result.some(item => item.diaSemana === 3 && item.horaInicio === '18:00'), false);
});
it('editar uma combinação não modifica os registros de origem nem outra combinação', () => {
  const original = Object.freeze([Object.freeze({ diaSemana: 1, ...noon }), Object.freeze({ diaSemana: 1, ...evening }), Object.freeze({ diaSemana: 3, ...noon })]);
  const groups = agruparHorarios(original);
  groups[0].diasSemana.push(5); groups[0].intervalos[0].horaFim = '13:30';
  assert.equal(original[0].horaFim, '13:00'); assert.equal(groups[1].intervalos[0].horaFim, '13:00');
  assert.equal(expandirHorarios(groups).length, 5);
});
it('exige ao menos uma combinação, um dia e um horário por combinação', () => {
  assert.throws(() => expandirHorarios([]), /pelo menos um horário/);
  assert.throws(() => expandirHorarios([{ diasSemana: [], intervalos: [noon] }]), /pelo menos um dia na combinação 1/);
  assert.throws(() => expandirHorarios([{ diasSemana: [1], intervalos: [] }]), /pelo menos um horário na combinação 1/);
});
it('o limite de 100 considera o produto dos dias pelos horários em todas as combinações', () => {
  const time = (minute: number) => `00:${String(minute).padStart(2, '0')}`;
  const intervalos = Array.from({ length: 50 }, (_, index) => ({ horaInicio: time(index), horaFim: time(index + 1) }));
  assert.equal(expandirHorarios([{ diasSemana: [1, 3], intervalos }]).length, 100);
  assert.throws(() => expandirHorarios([{ diasSemana: [1, 3, 5], intervalos }]), /até 100 horários/);
});
it('recusa dias inválidos/repetidos, ordena domingo no fim e não muda o formulário', () => {
  for (const diasSemana of [[-1], [7], [1.5], [1, 1]]) assert.throws(() => expandirHorarios([{ diasSemana, intervalos: [noon] }]), /Confira os dias/);
  const group = { diasSemana: [0, 5, 1], intervalos: [noon] };
  assert.deepEqual(expandirHorarios([group]).map(row => row.diaSemana), [1, 5, 0]);
  assert.deepEqual(group.diasSemana, [0, 5, 1]);
});
