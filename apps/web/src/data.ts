import type { Aluno, MensalidadeView, PresencaView, Dashboard, Health, Analise, TurmaView, AulaView } from '@tatame/shared';

export interface Data {
  alunos: Aluno[]; mensalidades: MensalidadeView[]; presencas: PresencaView[];
  dashboard: Dashboard | null; health: Health | null; analises: Analise[];
  turmas: TurmaView[];
  aulas: AulaView[];
}
export type Resource = keyof Data;
export interface ResourceState { loading: boolean; loaded: boolean; error: string | null }
export type ResourceStatus = Record<Resource, ResourceState>;
export const resources: readonly Resource[] = ['alunos', 'mensalidades', 'presencas', 'dashboard', 'health', 'analises', 'turmas', 'aulas'];
export const resourceLabels: Record<Resource, string> = {
  alunos: 'Alunos', mensalidades: 'Mensalidades', presencas: 'Presenças',
  dashboard: 'Visão geral', health: 'Conexão', analises: 'Histórico de análises',
  turmas: 'Turmas',
  aulas: 'Aulas',
};
export function initialData(): Data {
  return { alunos: [], mensalidades: [], presencas: [], dashboard: null, health: null, analises: [], turmas: [], aulas: [] };
}
export function initialResourceStatus(): ResourceStatus {
  const state = (): ResourceState => ({ loading: true, loaded: false, error: null });
  return { alunos: state(), mensalidades: state(), presencas: state(), dashboard: state(), health: state(), analises: state(), turmas: state(), aulas: state() };
}
export function startLoading(previous: ResourceStatus, invalidate: readonly Resource[] = []): ResourceStatus {
  const next = { ...previous };
  for (const resource of resources) next[resource] = { ...previous[resource], loading: true, loaded: previous[resource].loaded && !invalidate.includes(resource), error: null };
  return next;
}
