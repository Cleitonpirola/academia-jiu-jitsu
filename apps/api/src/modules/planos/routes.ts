import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';
import { today } from '../../domain.js';
import { usuarioAtual } from '../auth/routes.js';
import { contextoPlano } from './service.js';
import { usoPlano } from './rules.js';
import { saldoMensal } from './saldo-mensal.js';

export const planoSchema = z.object({ nome: z.string().trim().min(2).max(80), limiteSemanal: z.number().int().min(1).max(100).nullable() }).strict();
export function planosRouter(repo: Repository) {
  const router = Router();
  const alunoId = async (value: unknown) => {
    const id = z.string().uuid().parse(value);
    if (!await repo.get('Aluno', id)) throw new HttpError(404, 'Aluno não encontrado.');
    return id;
  };
  router.get('/:id/saldo-mensal', async (req, res) => {
    const id = await alunoId(req.params.id), aluno = await repo.get('Aluno', id);
    const [aulas, checkins, debitos] = await Promise.all([repo.list('Aula'), repo.list('CheckinAula'),repo.list('DebitoAula')]);
    res.json(saldoMensal(aluno!, aulas, checkins,undefined,debitos));
  });
  router.put('/:id/saldo-mensal', async (req, res) => {
    const { limiteMensal } = z.object({ limiteMensal: z.number().int().min(1).max(1000).nullable() }).strict().parse(req.body);
    res.json(await repo.saveSaldoMensalAluno(await alunoId(req.params.id), limiteMensal));
  });
  router.get('/:id/plano', async (req, res) => {
    const id = await alunoId(req.params.id), ctx = await contextoPlano(repo, id);
    const byAula = new Map(ctx.aulas.map(aula => [aula.id, aula]));
    res.json({ plano: ctx.plano, uso: usoPlano(ctx, id),
      aulasHoje: ctx.aulas.filter(aula => aula.dataAula === today() && aula.situacao === 'agendada' && !ctx.checkins.some(item => item.aulaId === aula.id) && !ctx.chamada.some(item => item.aulaId === aula.id)).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
      liberacoes: ctx.liberacoes.map(item => ({ ...item, aula: byAula.get(item.aulaId)!, utilizada: ctx.checkins.some(row => row.aulaId === item.aulaId) || ctx.chamada.some(row => row.aulaId === item.aulaId) })).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    });
  });
  router.put('/:id/plano', async (req, res) => {
    const input = planoSchema.parse(req.body), id = await alunoId(req.params.id);
    res.json(await repo.savePlanoAluno(id, input, new Date().toISOString()));
  });
  router.put('/:id/liberacoes/:aulaId', async (req, res) => {
    const id = await alunoId(req.params.id), aula = z.string().uuid().parse(req.params.aulaId);
    const { motivo } = z.object({ motivo: z.string().trim().min(3).max(240) }).strict().parse(req.body);
    res.json(await repo.saveLiberacaoAula(aula, id, usuarioAtual(res).id, motivo, new Date().toISOString()));
  });
  router.delete('/:id/liberacoes/:aulaId', async (req, res) => {
    const id = await alunoId(req.params.id), aula = z.string().uuid().parse(req.params.aulaId);
    await repo.removeLiberacaoAula(aula, id); res.status(204).end();
  });
  return router;
}
