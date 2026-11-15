import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';

const marking = z.object({ presente: z.boolean() }).strict();
const marcacaoEmLote = z.object({ checkinIds: z.array(z.string().uuid()).min(1) }).strict();
const ids = (aulaId: string, alunoId: string) => {
  if (!z.string().uuid().safeParse(aulaId).success || !z.string().uuid().safeParse(alunoId).success) {
    throw new HttpError(404, 'Aula ou aluno não encontrado.');
  }
};

export function createChamadaService(repo: Repository) {
  return {
    async confirmarEmLote(aulaId: string, body: unknown) {
      if (!z.string().uuid().safeParse(aulaId).success) throw new HttpError(404, 'Aula não encontrada.');
      const { checkinIds } = marcacaoEmLote.parse(body);
      const unicos = [...new Set(checkinIds)];
      const confirmados = await repo.confirmarCheckins(aulaId, unicos, new Date().toISOString());
      return { confirmados, ignorados: unicos.length - confirmados };
    },
    async removeCheckin(aulaId: string, alunoId: string) {
      ids(aulaId, alunoId);
      await repo.removeCheckin(aulaId, alunoId, new Date().toISOString());
    },
    async mark(aulaId: string, alunoId: string, body: unknown) {
      ids(aulaId, alunoId);
      const { presente } = marking.parse(body);
      return repo.savePresencaAula(aulaId, alunoId, presente, new Date().toISOString());
    },
    async clear(aulaId: string, alunoId: string) {
      ids(aulaId, alunoId);
      await repo.removePresencaAula(aulaId, alunoId);
    },
  };
}
