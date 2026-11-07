import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';
import { grauSchema } from './rules.js';
import { ordemFaixa } from '@tatame/shared';
import { contextoEvolucao, progressoGraduacao } from './evolucao.js';

export function graduacoesRouter(repo:Repository,requireAdmin:import('express').RequestHandler){
  const router=Router();
  router.get('/',async(_req,res)=>{
    const [faixas,graus]=await Promise.all([repo.list('FaixaGraduacao'),repo.list('GrauFaixa')]);
    res.json(faixas.sort((a,b)=>ordemFaixa(a.nome)-ordemFaixa(b.nome)||a.nome.localeCompare(b.nome,'pt-BR')).map(f=>({...f,graus:graus.filter(g=>g.faixaId===f.id).sort((a,b)=>a.numero-b.numero)})));
  });
  router.use(requireAdmin);
  router.get('/regras',async(_req,res)=>res.json(await repo.list('RegraGraduacao')));
  router.get('/pendencias',async(_req,res)=>{
    const ctx=await contextoEvolucao(repo);
    res.json(ctx.alunos.filter(a=>a.situacao==='ativo').map(a=>progressoGraduacao(ctx,a.id)).filter(p=>p.solicitacaoPendente||p.metaGrau?.apto||p.metaFaixa?.apto).map(p=>({alunoId:p.alunoId,nome:p.nome,faixa:p.faixa,solicitacaoPendente:p.solicitacaoPendente})));
  });
  router.put('/faixas/:id/regra',async(req,res)=>res.json(await repo.saveRegraGraduacao(z.string().uuid().parse(req.params.id),req.body,new Date().toISOString())));
  const catalogoFixo:import('express').RequestHandler=()=>{throw new HttpError(409,'As faixas seguem o catálogo padrão da plataforma. Configure apenas os graus e os critérios de evolução.');};
  router.post('/faixas',catalogoFixo);
  router.put('/faixas/:id',catalogoFixo);
  router.delete('/faixas/:id',catalogoFixo);
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
