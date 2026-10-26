import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';
import { chaveFaixa, faixaSchema, grauSchema } from './rules.js';

export function graduacoesRouter(repo:Repository,requireAdmin:import('express').RequestHandler){
  const router=Router();
  router.get('/',async(_req,res)=>{
    const [faixas,graus]=await Promise.all([repo.list('FaixaGraduacao'),repo.list('GrauFaixa')]);
    res.json(faixas.sort((a,b)=>a.ordem-b.ordem||a.nome.localeCompare(b.nome,'pt-BR')).map(f=>({...f,graus:graus.filter(g=>g.faixaId===f.id).sort((a,b)=>a.numero-b.numero)})));
  });
  router.use(requireAdmin);
  router.post('/faixas',async(req,res)=>{
    const input=faixaSchema.parse(req.body),now=new Date().toISOString(),row={...input,id:randomUUID(),chave:chaveFaixa(input.nome),criadoEm:now,atualizadoEm:now};
    await repo.saveCatalogoGraduacao({tipo:'faixa',row,create:true});res.status(201).json(row);
  });
  router.put('/faixas/:id',async(req,res)=>{
    const id=z.string().uuid().parse(req.params.id),old=await repo.get('FaixaGraduacao',id);if(!old)throw new HttpError(404,'Faixa não encontrada.');
    const input=faixaSchema.parse(req.body),row={...old,...input,chave:chaveFaixa(input.nome),atualizadoEm:new Date().toISOString()};
    await repo.saveCatalogoGraduacao({tipo:'faixa',row,create:false});res.json(row);
  });
  router.delete('/faixas/:id',async(req,res)=>{await repo.saveCatalogoGraduacao({tipo:'excluir',tabela:'FaixaGraduacao',id:z.string().uuid().parse(req.params.id)});res.status(204).end();});
  router.post('/faixas/:id/graus',async(req,res)=>{
    const input=grauSchema.parse(req.body),now=new Date().toISOString(),row={...input,id:randomUUID(),faixaId:z.string().uuid().parse(req.params.id),criadoEm:now,atualizadoEm:now};
    await repo.saveCatalogoGraduacao({tipo:'grau',row,create:true});res.status(201).json(row);
  });
  router.put('/graus/:id',async(req,res)=>{
    const old=await repo.get('GrauFaixa',z.string().uuid().parse(req.params.id));if(!old)throw new HttpError(404,'Grau não encontrado.');
    const row={...old,...grauSchema.parse(req.body),atualizadoEm:new Date().toISOString()};await repo.saveCatalogoGraduacao({tipo:'grau',row,create:false});res.json(row);
  });
  router.delete('/graus/:id',async(req,res)=>{await repo.saveCatalogoGraduacao({tipo:'excluir',tabela:'GrauFaixa',id:z.string().uuid().parse(req.params.id)});res.status(204).end();});
  return router;
}
