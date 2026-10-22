import type { TurmaInput } from '@tatame/shared';

type Horario = TurmaInput['horarios'][number];
export interface HorarioAgrupado {
  diasSemana: number[];
  intervalos: Pick<Horario, 'horaInicio' | 'horaFim'>[];
}
export const ORDEM_SEMANA: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

/** Agrupa só o formulário. A grade persistida continua com uma linha por dia/intervalo. */
export function agruparHorarios(horarios: readonly Horario[]): HorarioAgrupado[] {
  const porDia = new Map<number, HorarioAgrupado['intervalos']>();
  for (const { diaSemana, horaInicio, horaFim } of horarios) {
    const intervalos = porDia.get(diaSemana) ?? [];
    intervalos.push({ horaInicio, horaFim });
    porDia.set(diaSemana, intervalos);
  }
  const grupos = new Map<string, HorarioAgrupado>();
  for (const dia of ORDEM_SEMANA) {
    const intervalos = porDia.get(dia);
    if (!intervalos) continue;
    intervalos.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio) || a.horaFim.localeCompare(b.horaFim));
    // Agrupar por conjunto completo evita acrescentar à quarta um horário que só existia na segunda.
    const key = JSON.stringify(intervalos);
    let grupo = grupos.get(key);
    if (!grupo) {
      grupo = { diasSemana: [], intervalos };
      grupos.set(key, grupo);
    }
    grupo.diasSemana.push(dia);
  }
  return [...grupos.values()];
}

/** Expande a seleção para o contrato atual da API sem alterar os dados do formulário. */
export function expandirHorarios(grupos: readonly HorarioAgrupado[]): Horario[] {
  if (!grupos.length) throw new Error('Adicione pelo menos um horário à grade.');
  const horarios = grupos.flatMap((grupo, index) => {
    if (!grupo.diasSemana.length) throw new Error(`Selecione pelo menos um dia na combinação ${index + 1}.`);
    if (!grupo.intervalos.length) throw new Error(`Adicione pelo menos um horário na combinação ${index + 1}.`);
    if (grupo.diasSemana.some(dia => !Number.isInteger(dia) || dia < 0 || dia > 6) || new Set(grupo.diasSemana).size !== grupo.diasSemana.length) {
      throw new Error(`Confira os dias selecionados na combinação ${index + 1}.`);
    }
    return ORDEM_SEMANA.filter(dia => grupo.diasSemana.includes(dia)).flatMap(diaSemana => grupo.intervalos.map(({ horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim })));
  });
  if (horarios.length > 100) throw new Error('A grade aceita até 100 horários semanais. Reduza os dias ou remova um horário.');
  return horarios;
}
