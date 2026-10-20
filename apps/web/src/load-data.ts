import { resources, type Data, type Resource } from './data';

export type ReadApi = <T>(path: string) => Promise<T>;
interface LoadHandlers {
  onSuccess: <K extends Resource>(resource: K, value: Data[K]) => void;
  onFailure: (resource: Resource, message: string) => void;
}

/** Publica cada resultado assim que chega; uma falha não descarta as outras consultas. */
export async function loadResources(month: string, read: ReadApi, handlers: LoadHandlers): Promise<void> {
  const paths: Record<Resource, string> = {
    alunos: '/alunos', mensalidades: '/mensalidades', presencas: '/presencas',
    dashboard: '/dashboard?mes=' + month, health: '/health', analises: '/analises',
    turmas: '/turmas',
    aulas: '/aulas',
  };
  await Promise.allSettled(resources.map(async resource => {
    try {
      const value = await read<Data[typeof resource]>(paths[resource]);
      handlers.onSuccess(resource, value);
    } catch (error) {
      handlers.onFailure(resource, error instanceof Error ? error.message : 'Não foi possível carregar estes dados.');
    }
  }));
}
