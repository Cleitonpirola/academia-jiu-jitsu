import { Router } from 'express';
import type { Repository } from '../../repository.js';
import { createAulasService } from './service.js';

export function aulasRouter(repo: Repository) {
  const router = Router();
  const service = createAulasService(repo);
  router.get('/', async (req, res) => res.json(await service.list(req.query)));
  router.get('/:id', async (req, res) => res.json(await service.detail(req.params.id)));
  router.post('/da-grade', async (req, res) => {
    const result = await service.createFromGrade(req.body);
    res.status(result.created ? 201 : 200).json(result.aula);
  });
  router.post('/extras', async (req, res) => res.status(201).json(await service.createExtra(req.body)));
  router.patch('/:id/cancelamento', async (req, res) => res.json(await service.cancel(req.params.id, req.body)));
  router.delete('/:id', async (req, res) => {
    await service.removeExtra(req.params.id);
    res.status(204).end();
  });
  return router;
}
