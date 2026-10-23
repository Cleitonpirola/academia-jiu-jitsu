import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';
import { statusOf } from '../../domain.js';
import { usuarioAtual } from './routes.js';
import { bloqueioFinanceiro } from './financial-access.js';
import { usoPlano } from '../planos/rules.js';

export function portalRouter(repo: Repository) {
  const router = Router();
  router.use((_req, res, next) => {
    if (usuarioAtual(res).perfil !== 'aluno') throw new HttpError(403, 'Entre com uma conta de aluno para acessar esta área.');
    next();
  });
  router.get('/', async (_req, res) => {
    const id = usuarioAtual(res).alunoId!;
    const aluno = await repo.get('Aluno', id);
    if (!aluno || aluno.situacao !== 'ativo') throw new HttpError(403, 'Cadastro indisponível.');
    const mensalidades = await repo.list('Mensalidade');
    const bloqueio = bloqueioFinanceiro(mensalidades, id);
    if (bloqueio) { res.json(bloqueio); return; }
    const [aulas, checkins, chamada, antigas, planos, liberacoes] = await Promise.all([repo.list('Aula'), repo.list('CheckinAula'), repo.list('PresencaAula'), repo.list('Presenca'), repo.list('PlanoAluno'), repo.list('LiberacaoAula')]);
    const meusCheckins = new Map(checkins.filter(item => item.alunoId === id).map(item => [item.aulaId, item]));
    const minhasPresencas = new Map(chamada.filter(item => item.alunoId === id).map(item => [item.aulaId, item]));
    res.json({ bloqueado: false, aluno, aulas: aulas.filter(aula => aula.dataAula >= aluno.dataMatricula).map(aula => ({ ...aula, checkin: meusCheckins.get(aula.id) ?? null, presenca: minhasPresencas.get(aula.id) ?? null })).sort((a, b) => (a.dataAula + a.horaInicio).localeCompare(b.dataAula + b.horaInicio)),
      mensalidades: mensalidades.filter(item => item.alunoId === id).map(item => ({ ...item, status: statusOf(item) })).sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento)),
      historicoAntigo: antigas.filter(item => item.alunoId === id).sort((a, b) => b.dataTreino.localeCompare(a.dataTreino)),
      plano: usoPlano({ plano: planos.find(item => item.alunoId === id) ?? null, aulas, checkins, chamada, antigas, liberacoes }, id),
    });
  });
  router.put('/aulas/:id/checkin', async (req, res) => {
    z.object({}).strict().parse(req.body ?? {});
    const id = z.string().uuid().parse(req.params.id);
    res.json(await repo.saveCheckin(id, usuarioAtual(res).alunoId!, new Date().toISOString()));
  });
  return router;
}
