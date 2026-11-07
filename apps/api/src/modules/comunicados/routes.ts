import {Router} from 'express';
import {z} from 'zod';
import type {Repository} from '../../repository.js';
import {usuarioAtual} from '../auth/routes.js';
import {destinatariosEquipe,envioEquipeSchema} from './equipe.js';
export function comunicadosEquipeRouter(repo:Repository){
 const router=Router();
 router.get('/destinatarios',async(_req,res)=>res.json(destinatariosEquipe({alunos:await repo.list('Aluno'),usuarios:await repo.list('Usuario'),vinculos:await repo.list('ResponsavelAluno')})));
 router.get('/lotes',async(_req,res)=>{
  const [lotes,entregas,comunicados]=await Promise.all([repo.list('LoteComunicado'),repo.list('EntregaComunicado'),repo.list('ComunicadoAluno')]);
  const byId=new Map(comunicados.map(c=>[c.id,c]));
  res.json(lotes.sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm)).map(l=>({...l,naoEnviados:JSON.parse(l.pendencias),entregas:entregas.filter(e=>e.loteId===l.id).map(e=>({...e,resposta:byId.get(e.comunicadoId)?.resposta??null,respondidoEm:byId.get(e.comunicadoId)?.respondidoEm??null}))})));
 });
 router.post('/lotes',async(req,res)=>res.status(201).json(await repo.saveComunicadoEquipe(envioEquipeSchema.parse(req.body),usuarioAtual(res).id,new Date().toISOString())));
 router.delete('/lotes/:id',async(req,res)=>{
  await repo.excluirComunicadoEquipe(z.string().uuid().parse(req.params.id));
  res.sendStatus(204);
 });
 return router;
}
