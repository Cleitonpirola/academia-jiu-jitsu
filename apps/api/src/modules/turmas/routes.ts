import { Router } from 'express';
import type { Repository } from '../../repository.js';
import { turmaSituacaoSchema } from './schema.js';
import { createTurmasService } from './service.js';

export function turmasRouter(repo: Repository) {
  const router = Router();
  const service = createTurmasService(repo);
  router.get('/', async (_req, res) => res.json(await service.list()));
  router.get('/:id', async (req, res) => res.json(await service.detail(req.params.id)));
  router.post('/', async (req, res) => res.status(201).json(await service.save(req.body)));
  router.put('/:id', async (req, res) => res.json(await service.save(req.body, req.params.id)));
  router.patch('/:id/situacao', async (req, res) => {
    const { situacao } = turmaSituacaoSchema.parse(req.body);
    res.json(await service.setSituation(req.params.id, situacao));
  });
  router.delete('/:id', async (req, res) => {
    await service.remove(req.params.id);
    res.status(204).end();
  });
  return router;
}
