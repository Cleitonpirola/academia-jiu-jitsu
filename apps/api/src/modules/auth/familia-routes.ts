import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';
import { menorDeIdade, responsavelPodeAcessar, transferenciaSchema, vinculoSchema } from './familia.js';
import { usuarioAtual } from './routes.js';
import { newToken, tokenHash } from './password.js';
import { portalRouter } from './portal.js';

export function familiaAdminRouter(repo: Repository) {
  const router=Router();
  const alunoAtual=async(id: unknown)=>{const aluno=await repo.get('Aluno',z.string().uuid().parse(id));if(!aluno)throw new HttpError(404,'Aluno não encontrado.');return aluno;};
  router.get('/:id/familia',async(req,res)=>{
    const aluno=await alunoAtual(req.params.id),usuarios=await repo.list('Usuario');
    res.json({aluno,menor:menorDeIdade(aluno),responsaveis:(await repo.list('ResponsavelAluno')).filter(v=>v.alunoId===aluno.id).map(v=>{const u=usuarios.find(u=>u.id===v.usuarioId)!;return {...v,nome:u.nome,email:u.email,ativado:Boolean(u.senhaHash)};}),eventos:(await repo.list('EventoAcessoAluno')).filter(e=>e.alunoId===aluno.id).sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm))});
  });
  router.put('/:id/familia',async(req,res)=>{
    const aluno=await alunoAtual(req.params.id);
    res.json(await repo.saveFamilia({tipo:'vincular',alunoId:aluno.id,autorId:usuarioAtual(res).id,timestamp:new Date().toISOString(),input:vinculoSchema.parse(req.body)}));
  });
  for(const tipo of ['convidar','transferir'] as const)router.post(`/:id/familia/${tipo}`,async(req,res)=>{
    const aluno=await alunoAtual(req.params.id),token=newToken(),expiraEm=new Date(Date.now()+24*3600_000).toISOString();
    const base={alunoId:aluno.id,autorId:usuarioAtual(res).id,timestamp:new Date().toISOString(),conviteHash:tokenHash(token),expiraEm};
    const result=tipo==='transferir'?await repo.saveFamilia({...base,tipo,input:transferenciaSchema.parse(req.body)}):await repo.saveFamilia({...base,tipo});
    const usuario=await repo.get('Usuario',result.usuarioId);
    res.status(201).json({token,expiraEm,email:usuario!.email});
  });
  router.get('/:id/comunicados',async(req,res)=>{const aluno=await alunoAtual(req.params.id);res.json((await repo.list('ComunicadoAluno')).filter(c=>c.alunoId===aluno.id).sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm)));});
  router.post('/:id/comunicados',async(req,res)=>{
    const aluno=await alunoAtual(req.params.id);
    const {destino,...input}=z.object({destino:z.enum(['principal','responsavel']),tipo:z.enum(['aviso','autorizacao']),titulo:z.string().trim().min(2).max(120),mensagem:z.string().trim().min(2).max(3000)}).strict().parse(req.body);
    let destinatarioId:string|undefined;
    if(destino==='responsavel'||aluno.acessoPrincipal==='responsavel'){
      if(!menorDeIdade(aluno))throw new HttpError(409,'O responsável não tem mais acesso administrativo após a maioridade.');
      destinatarioId=(await repo.list('ResponsavelAluno')).find(v=>v.alunoId===aluno.id&&v.tipoVinculo==='responsavel')?.usuarioId;
    }else destinatarioId=(await repo.list('Usuario')).find(u=>u.alunoId===aluno.id)?.id;
    if(!destinatarioId)throw new HttpError(409,'Prepare primeiro o acesso do destinatário na ficha do aluno.');
    res.status(201).json(await repo.insert('ComunicadoAluno',{id:randomUUID(),alunoId:aluno.id,destinatarioId,autorId:usuarioAtual(res).id,...input,resposta:null,respondidoEm:null,criadoEm:new Date().toISOString()}));
  });
  return router;
}
export function responsavelRouter(repo: Repository){
  const router=Router();
  router.use((_req,res,next)=>{if(usuarioAtual(res).perfil!=='responsavel')throw new HttpError(403,'Entre com uma conta de responsável.');next();});
  router.get('/dependentes',async(_req,res)=>{
    const vinculos=await repo.list('ResponsavelAluno'),id=usuarioAtual(res).id;
    res.json((await repo.list('Aluno')).filter(a=>responsavelPodeAcessar(a,vinculos,id)).map(a=>({id:a.id,nome:a.nome,faixa:a.faixa,podeCheckin:a.acessoPrincipal==='responsavel'})));
  });
  router.use('/:alunoId/portal',portalRouter(repo,true));
  return router;
}
