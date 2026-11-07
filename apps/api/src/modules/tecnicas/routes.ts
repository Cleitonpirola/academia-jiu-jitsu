import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {Repository} from '../../repository.js';
import {isDate,today} from '../../domain.js';
import {HttpError} from '../../http-error.js';
import {usuarioAtual} from '../auth/routes.js';
import {exigirArquivos,isArquivo,referenciaArquivo,VIDEO_BUCKET,MAX_VIDEO_BYTES,limparArquivo} from '../arquivos/storage.js';

export function normalizarVideo(value:string){
 let url:URL;try{url=new URL(value);}catch{throw new Error('Informe um link válido do YouTube ou Vimeo.');}
 if(url.protocol!=='https:'||url.username||url.password||url.port)throw new Error('Use um link HTTPS do YouTube ou Vimeo.');
 const host=url.hostname.replace(/^www\./,'');
 let id:string|null=null;
 if(host==='youtu.be')id=url.pathname.slice(1);
 if(host==='youtube.com'||host==='m.youtube.com')id=url.pathname==='/watch'?url.searchParams.get('v'):/^\/(?:shorts|embed)\/([^/]+)$/.exec(url.pathname)?.[1]??null;
 if(id&&/^[a-zA-Z0-9_-]{11}$/.test(id))return 'https://www.youtube.com/watch?v='+id;
 if(host==='vimeo.com'&&/^\/\d+(?:\/[a-f0-9]+)?$/.test(url.pathname))return 'https://vimeo.com'+url.pathname;
 throw new Error('Informe o link de um vídeo do YouTube ou Vimeo, sem playlists ou outros sites.');
}
const data=z.string().refine(isDate,'Informe uma data válida.');
export const videoSchema=z.object({titulo:z.string().trim().min(2).max(120),descricao:z.string().trim().max(3000),semana:data,tipoTreino:z.enum(['Com kimono','Sem kimono']),url:z.string().trim().max(500).transform((v,ctx)=>{try{if(isArquivo(v)){if(referenciaArquivo(v).bucket!==VIDEO_BUCKET)throw new Error('Arquivo de vídeo inválido.');return v;}return normalizarVideo(v);}catch(e){ctx.addIssue({code:'custom',message:(e as Error).message});return z.NEVER;}}),publicado:z.boolean(),comprovanteUpload:z.string().max(1500).optional()}).strict();
const configSchema=z.object({ativa:z.boolean(),valorMensalCentavos:z.number().int().min(1).max(1000000),instrucoes:z.string().trim().max(2000)}).strict();
const padrao={id:'principal',ativa:false,valorMensalCentavos:1000,instrucoes:'Converse com a academia para contratar o acesso opcional.',atualizadoEm:''};
export function tecnicasAdminRouter(repo:Repository){
 const router=Router();
 router.use((_req,res,next)=>{res.set('Cache-Control','private, no-store');next();});
 router.get('/',async(_req,res)=>{
  const [config,videos,acessos,alunos]=await Promise.all([repo.get('ConfiguracaoTecnicas','principal'),repo.list('VideoTecnica'),repo.list('AcessoTecnicas'),repo.list('Aluno')]);
  res.json({config:config??padrao,videos:videos.sort((a,b)=>b.semana.localeCompare(a.semana)),acessos,alunos:alunos.filter(a=>a.situacao==='ativo').map(a=>({id:a.id,nome:a.nome})),armazenamentoConfigurado:Boolean(res.app.locals.arquivos)});
 });
 router.post('/uploads',async(req,res)=>{
  const {tamanho,tipo}=z.object({tamanho:z.number().int().positive().max(MAX_VIDEO_BYTES),tipo:z.literal('video/mp4')}).strict().parse(req.body);
  void tipo;
  res.status(201).json(await exigirArquivos(req.app.locals.arquivos).prepararVideo(usuarioAtual(res).id,tamanho));
 });
 router.put('/configuracao',async(req,res)=>{const input=configSchema.parse(req.body);res.json(await repo.saveConfiguracaoTecnicas({...input,id:'principal',atualizadoEm:new Date().toISOString()}));});
 router.post('/videos',async(req,res)=>{
  const {comprovanteUpload,...input}=videoSchema.parse(req.body),now=new Date().toISOString();
  if(isArquivo(input.url))await exigirArquivos(req.app.locals.arquivos).confirmarVideo(input.url,comprovanteUpload??'',usuarioAtual(res).id);
  if(isArquivo(input.url)&&(await repo.list('VideoTecnica')).some(v=>v.url===input.url))throw new HttpError(409,'Esse vídeo já foi cadastrado. Atualize a biblioteca.');
  res.status(201).json(await repo.insert('VideoTecnica',{...input,id:randomUUID(),criadoEm:now,atualizadoEm:now}));
 });
 router.put('/videos/:id',async(req,res)=>{
  const id=z.string().uuid().parse(req.params.id),{comprovanteUpload,...input}=videoSchema.parse(req.body),anterior=await repo.get('VideoTecnica',id);if(!anterior)throw new HttpError(404,'Vídeo não encontrado.');
  if(isArquivo(input.url)&&input.url!==anterior.url){
   await exigirArquivos(req.app.locals.arquivos).confirmarVideo(input.url,comprovanteUpload??'',usuarioAtual(res).id);
   if((await repo.list('VideoTecnica')).some(v=>v.id!==id&&v.url===input.url))throw new HttpError(409,'Esse arquivo já pertence a outro vídeo.');
  }
  const salvo=await repo.update('VideoTecnica',id,{...input,atualizadoEm:new Date().toISOString()});
  if(input.url!==anterior.url)await limparArquivo(req.app.locals.arquivos,anterior.url);
  res.json(salvo);
 });
 router.put('/acessos/:id',async(req,res)=>{
  const id=z.string().uuid().parse(req.params.id),{validoAte}=z.object({validoAte:data.refine(v=>v>=today(),'A validade não pode estar no passado.')}).strict().parse(req.body);
  const aluno=await repo.get('Aluno',id);if(!aluno||aluno.situacao!=='ativo')throw new HttpError(404,'Aluno ativo não encontrado.');
  res.json(await repo.saveAcessoTecnicas({id,validoAte,liberadoPorId:usuarioAtual(res).id,atualizadoEm:new Date().toISOString()}));
 });
 router.delete('/acessos/:id',async(req,res)=>{const id=z.string().uuid().parse(req.params.id);if(await repo.get('AcessoTecnicas',id))await repo.remove('AcessoTecnicas',id);res.status(204).end();});
 return router;
}
// Montado depois da autorização do portal: o ID vem da sessão/vínculo familiar, nunca do corpo.
export function tecnicasPortalRouter(repo:Repository){
 const router=Router();
 router.use((_req,res,next)=>{res.set('Cache-Control','private, no-store');next();});
 const estado=async(alunoId:string)=>{const [config,acesso]=await Promise.all([repo.get('ConfiguracaoTecnicas','principal'),repo.get('AcessoTecnicas',alunoId)]);return {config:config??padrao,acesso,liberado:Boolean(config?.ativa&&acesso&&acesso.validoAte>=today())};};
 router.get('/',async(_req,res)=>{
  const {config,acesso,liberado}=await estado(res.locals.portalAlunoId);
  const videos=config.ativa?(await repo.list('VideoTecnica')).filter(v=>v.publicado&&v.semana<=today()).sort((a,b)=>b.semana.localeCompare(a.semana)).map(({url,...v})=>v):[];
  res.json({config,liberado,validoAte:acesso?.validoAte??null,videos});
 });
 router.get('/:id/assistir',async(req,res)=>{
  const {liberado}=await estado(res.locals.portalAlunoId);
  if(!liberado)throw new HttpError(403,'O acesso aos vídeos precisa estar ativo. Converse com a academia.');
  const video=await repo.get('VideoTecnica',z.string().uuid().parse(req.params.id));
  if(!video||!video.publicado||video.semana>today())throw new HttpError(404,'Vídeo indisponível.');
  res.json({url:isArquivo(video.url)?await exigirArquivos(req.app.locals.arquivos).assinarVideo(video.url):normalizarVideo(video.url)});
 });
 return router;
}
