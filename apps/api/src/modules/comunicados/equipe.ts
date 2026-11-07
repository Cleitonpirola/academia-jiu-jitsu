import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {Aluno,ResponsavelAluno,LoteComunicado,ComunicadoAluno,EntregaComunicado} from '@tatame/shared';
import type {Usuario} from '../auth/models.js';
import {menorDeIdade} from '../auth/familia.js';
import {HttpError} from '../../http-error.js';

export const envioEquipeSchema=z.object({id:z.string().uuid(),tipo:z.enum(['aviso','autorizacao']),titulo:z.string().trim().min(2).max(120),mensagem:z.string().trim().min(2).max(3000)}).strict();
export type EnvioEquipe=z.infer<typeof envioEquipeSchema>;
export interface ContextoEquipe{alunos:Aluno[];usuarios:Usuario[];vinculos:ResponsavelAluno[]}
export function destinatariosEquipe(ctx:ContextoEquipe){
 const destinatarios:{alunoId:string;nome:string;destinatarioId:string}[]=[],naoEnviados:{alunoId:string;nome:string;motivo:string}[]=[];
 const ativos=ctx.alunos.filter(a=>a.situacao==='ativo').sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
 for(const aluno of ativos){
  let usuario:Usuario|undefined;
  if(aluno.acessoPrincipal==='responsavel'){
   if(!menorDeIdade(aluno)){naoEnviados.push({alunoId:aluno.id,nome:aluno.nome,motivo:'Atualize o acesso principal após a maioridade.'});continue;}
   const vinculo=ctx.vinculos.find(v=>v.alunoId===aluno.id&&v.tipoVinculo==='responsavel');
   usuario=ctx.usuarios.find(u=>u.id===vinculo?.usuarioId&&u.perfil==='responsavel');
  }else usuario=ctx.usuarios.find(u=>u.alunoId===aluno.id&&u.perfil==='aluno');
  if(usuario)destinatarios.push({alunoId:aluno.id,nome:aluno.nome,destinatarioId:usuario.id});
  else naoEnviados.push({alunoId:aluno.id,nome:aluno.nome,motivo:'Prepare o acesso do aluno ou responsável na ficha.'});
 }
 return {alunosAtivos:ativos.length,destinatarios,naoEnviados};
}
export function planejarEnvioEquipe(ctx:ContextoEquipe,input:EnvioEquipe,autorId:string,timestamp:string,anterior?:LoteComunicado|null){
 if(anterior){
  if(anterior.autorId!==autorId||anterior.tipo!==input.tipo||anterior.titulo!==input.titulo||anterior.mensagem!==input.mensagem)throw new HttpError(409,'Este envio já foi registrado com outro conteúdo.');
  return {lote:anterior,comunicados:[] as ComunicadoAluno[],entregas:[] as EntregaComunicado[],novo:false};
 }
 const preview=destinatariosEquipe(ctx);
 if(!preview.destinatarios.length)throw new HttpError(409,'Nenhum aluno ativo possui acesso cadastrado para receber este aviso.');
 const lote:LoteComunicado={...input,autorId,criadoEm:timestamp,pendencias:JSON.stringify(preview.naoEnviados)};
 const comunicados=preview.destinatarios.map(d=>({id:randomUUID(),alunoId:d.alunoId,destinatarioId:d.destinatarioId,autorId,tipo:input.tipo,titulo:input.titulo,mensagem:input.mensagem,resposta:null,respondidoEm:null,criadoEm:timestamp}));
 const entregas=comunicados.map((c,i)=>({id:randomUUID(),loteId:lote.id,comunicadoId:c.id,nome:preview.destinatarios[i].nome}));
 return {lote,comunicados,entregas,novo:true};
}
