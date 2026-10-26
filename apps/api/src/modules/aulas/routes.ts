import { Router } from 'express';
import type { Repository } from '../../repository.js';
import { createAulasService } from './service.js';
import { createChamadaService } from '../chamada/service.js';

export function aulasRouter(repo: Repository) {
  const router = Router();
  const service = createAulasService(repo);
  const chamada = createChamadaService(repo);
  router.get('/', async (req, res) => res.json(await service.list(req.query)));
  router.get('/:id', async (req, res) => res.json(await service.detail(req.params.id)));
  router.patch('/:id/nome', async (req, res) => res.json(await service.rename(req.params.id, req.body)));
  router.patch('/:id/professores', async (req, res) => res.json(await service.setProfessores(req.params.id, req.body)));
  router.delete('/:id/checkins/:alunoId', async (req, res) => {
    await chamada.removeCheckin(req.params.id, req.params.alunoId);
    res.status(204).end();
  });
  router.post('/da-grade', async (req, res) => {
    const result = await service.createFromGrade(req.body);
    res.status(result.created ? 201 : 200).json(result.aula);
  });
  router.patch('/:id/cancelamento', async (req, res) => res.json(await service.cancel(req.params.id, req.body)));
  router.put('/:id/chamada/:alunoId', async (req, res) => {
    const result = await chamada.mark(req.params.id, req.params.alunoId, req.body);
    res.status(result.created ? 201 : 200).json(result.registro);
  });
  router.delete('/:id/chamada/:alunoId', async (req, res) => {
    await chamada.clear(req.params.id, req.params.alunoId);
    res.status(204).end();
  });
  return router;
}
