import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { paymentSchema } from '../../domain.js';
import { usuarioAtual } from '../auth/routes.js';
import { condicoesPadrao } from './debitos.js';

export function debitosRouter(repo: Repository) {
  const router=Router();
  router.get('/configuracao',async(_req,res)=>res.json(await repo.get('ConfiguracaoAcademia','principal') ?? condicoesPadrao));
  router.put('/configuracao',async(req,res)=>{
    const input=z.object({valorAulaAdicionalCentavos:z.number().int().min(1).max(1000000).nullable(),prazoPagamentoDias:z.number().int().min(1).max(90)}).strict().parse(req.body);
    res.json(await repo.saveConfiguracaoAdicionais(input,usuarioAtual(res).id,new Date().toISOString()));
  });
  router.get('/',async(_req,res)=>{
    const [debitos,alunos]=await Promise.all([repo.list('DebitoAula'),repo.list('Aluno')]);const nomes=new Map(alunos.map(a=>[a.id,a.nome]));
    res.json(debitos.map(item=>({...item,alunoNome:nomes.get(item.alunoId)??'Aluno'})).sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm)));
  });
  router.patch('/:id/pagamento',async(req,res)=>{
    const id=z.string().uuid().parse(req.params.id),{dataPagamento}=paymentSchema.parse(req.body);
    res.json(await repo.baixarDebito(id,usuarioAtual(res).id,dataPagamento));
  });
  return router;
}
