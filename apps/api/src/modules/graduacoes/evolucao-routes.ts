import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { usuarioAtual } from '../auth/routes.js';
import { contextoEvolucao, evolucaoSchema, progressoGraduacao } from './evolucao.js';
export function evolucaoRouter(repo:Repository){
  const router=Router({mergeParams:true});
  router.get<{alunoId:string}>('/',async(req,res)=>res.json(progressoGraduacao(await contextoEvolucao(repo),z.string().uuid().parse(req.params.alunoId))));
  router.post<{alunoId:string}>('/',async(req,res)=>{
    const alunoId=z.string().uuid().parse(req.params.alunoId),input=evolucaoSchema.parse(req.body);
    await repo.saveEvolucaoGraduacao(alunoId,usuarioAtual(res).id,input,new Date().toISOString());
    res.json(progressoGraduacao(await contextoEvolucao(repo),alunoId));
  });
  return router;
}
