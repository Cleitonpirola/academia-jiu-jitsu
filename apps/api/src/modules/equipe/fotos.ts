import type {Router,Response} from 'express';
import {z} from 'zod';
import type {Repository} from '../../repository.js';
import {HttpError} from '../../http-error.js';
import {exigirArquivos,isArquivo,limparArquivo,type Arquivos} from '../arquivos/storage.js';
// O navegador recorta e normaliza a imagem; o servidor aceita somente JPEG pequeno.
export const fotoSchema=z.object({imagem:z.string().max(180000).refine(v=>{
 if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(v))return false;
 const bytes=Buffer.from(v.split(',')[1],'base64');return bytes.length>=100&&bytes.length<=130000&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes.at(-2)===255&&bytes.at(-1)===217;
},'Escolha uma foto JPEG válida de até 130 KB.')}).strict();
export function rotasFoto(router:Router,repo:Repository,subject:(res:Response)=>{id:string;alunoId:string|null;usuarioId:string|null}){
 router.get('/foto',async(req,res)=>{const id=subject(res).id,f=await repo.get('FotoPerfil',id);const imagem=f&&isArquivo(f.imagem)?await exigirArquivos(req.app.locals.arquivos).lerFoto(f.imagem,id):f?.imagem??null;res.set('Cache-Control','private, no-store').json({imagem});});
 router.put('/foto',async(req,res)=>{
  const {imagem}=fotoSchema.parse(req.body),pessoa=subject(res),arquivos=req.app.locals.arquivos as Arquivos|undefined,anterior=await repo.get('FotoPerfil',pessoa.id);
  const referencia=arquivos?await arquivos.salvarFoto(pessoa.id,imagem):imagem;
  try{await repo.saveFotoPerfil({...pessoa,imagem:referencia,atualizadoEm:new Date().toISOString()});}catch(e){await limparArquivo(arquivos,referencia);throw e;}
  await limparArquivo(arquivos,anterior?.imagem);res.json({imagem});
 });
 router.delete('/foto',async(req,res)=>{const id=subject(res).id,f=await repo.get('FotoPerfil',id);if(f){await repo.remove('FotoPerfil',id);await limparArquivo(req.app.locals.arquivos,f.imagem);}res.status(204).end();});
}
export async function fotoAluno(repo:Repository,id:string,res:Response,arquivos?:Arquivos){
 if(!z.string().uuid().safeParse(id).success)throw new HttpError(404,'Foto indisponível.');
 const aluno=await repo.get('Aluno',id),foto=await repo.get('FotoPerfil',id);
 if(!aluno||aluno.situacao!=='ativo'||!foto?.alunoId)throw new HttpError(404,'Foto indisponível.');
 const imagem=isArquivo(foto.imagem)?await exigirArquivos(arquivos).lerFoto(foto.imagem,id):foto.imagem;
 res.set('Cache-Control','private, no-store').type('image/jpeg').send(Buffer.from(imagem.split(',')[1],'base64'));
}
