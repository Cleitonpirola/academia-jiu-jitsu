import {Router} from 'express';
import {z} from 'zod';
import type {Repository} from '../../repository.js';
import {monthSchema,currentMonth} from '../../domain.js';
import {usuarioAtual} from '../auth/routes.js';
import {rotasFoto,fotoAluno} from './fotos.js';
import {calcularRanking} from './ranking.js';
const periodoSchema=z.object({mes:monthSchema.optional(),ano:z.string().regex(/^(19|[2-9]\d)\d{2}$/, 'Informe um ano válido.').optional()}).strict().refine(v=>!(v.mes&&v.ano),'Escolha o mês ou o ano, sem combinar os dois.');
export function equipeRouter(repo:Repository){
 const router=Router();
 router.get('/ranking',async(req,res)=>{
  const filtro=periodoSchema.parse(req.query),periodo=filtro.mes??filtro.ano??currentMonth();
  const [alunos,aulas,presencas,fotos]=await Promise.all([repo.list('Aluno'),repo.list('Aula'),repo.list('PresencaAula'),repo.list('FotoPerfil')]);
  res.set('Cache-Control','private, no-store').json(calcularRanking(alunos,aulas,presencas,fotos,periodo));
 });
 router.get('/alunos/:id/foto',async(req,res)=>fotoAluno(repo,req.params.id,res,req.app.locals.arquivos));
 return router;
}
export function fotoPropriaRouter(repo:Repository){
 const router=Router();
 rotasFoto(router,repo,res=>{const u=usuarioAtual(res);return u.alunoId?{id:u.alunoId,alunoId:u.alunoId,usuarioId:null}:{id:u.id,usuarioId:u.id,alunoId:null};});
 return router;
}
