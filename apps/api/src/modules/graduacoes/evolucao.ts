import { limiteGrausPadrao, limiteGrausRegistro } from '@tatame/shared';
import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import type { Aluno, Aula, PresencaAula, FaixaGraduacao, GrauFaixa, RegraGraduacao, EstadoGraduacao, EventoGraduacao, ProgressoGraduacao, MetaGraduacao, ResponsavelAluno } from '@tatame/shared';
import type { Usuario } from '../auth/models.js';
import type { Repository } from '../../repository.js';
import { isDate, today } from '../../domain.js';
import { HttpError } from '../../http-error.js';
import { graduacaoValida } from './rules.js';
import { assertAcessoPortal } from '../auth/familia.js';

export const regraEvolucaoSchema = z.object({ aulasPorGrau:z.number().int().min(1).max(100000).nullable(), mesesPorGrau:z.null().default(null), grausParaFaixa:z.number().int().min(0).max(99).optional(), mesesMinimosFaixa:z.literal(0).default(0), proximaFaixaId:z.string().uuid().nullable().optional() }).strict();
const versao = z.number().int().min(0);
export const evolucaoSchema = z.discriminatedUnion('tipo', [
  z.object({tipo:z.literal('ajuste'),versao,faixaId:z.string().uuid(),grauId:z.string().uuid().nullable(),grauNumero:z.number().int().min(0).max(6).optional(),dataInicioFaixa:z.string().refine(isDate).refine(v=>v<=today(),'A data não pode estar no futuro.'),aulasAnteriores:z.number().int().min(0).max(100000),motivo:z.string().trim().min(5).max(500).default('Graduação ajustada pelo professor.')}).strict().refine(v=>v.grauNumero===undefined||v.grauId===null,'Informe o código ou o número do grau.'),
  z.object({tipo:z.literal('grau'),versao,regraAssinatura:z.string().length(64)}).strict(), z.object({tipo:z.literal('faixa'),versao,regraAssinatura:z.string().length(64)}).strict(),
]);
export type EntradaEvolucao = z.infer<typeof evolucaoSchema> | {tipo:'solicitacao';versao:number};
export interface ContextoEvolucao { alunos:Aluno[];faixas:FaixaGraduacao[];graus:GrauFaixa[];regras:RegraGraduacao[];estados:EstadoGraduacao[];eventos:EventoGraduacao[];aulas:Aula[];chamada:PresencaAula[];usuarios:Usuario[];vinculos:ResponsavelAluno[] }
export async function contextoEvolucao(repo:Pick<Repository,'list'>):Promise<ContextoEvolucao> {
  const [alunos,faixas,graus,regras,estados,eventos,aulas,chamada,usuarios,vinculos] = await Promise.all([repo.list('Aluno'),repo.list('FaixaGraduacao'),repo.list('GrauFaixa'),repo.list('RegraGraduacao'),repo.list('EstadoGraduacao'),repo.list('EventoGraduacao'),repo.list('Aula'),repo.list('PresencaAula'),repo.list('Usuario'),repo.list('ResponsavelAluno')]);
  return {alunos,faixas,graus,regras,estados,eventos,aulas,chamada,usuarios,vinculos};
}
export const assinaturaRegra=(regra:RegraGraduacao|null)=>regra?createHash('sha256').update(JSON.stringify(['aulas-graus4-v1',regra.faixaId,regra.aulasPorGrau,regra.grausParaFaixa,regra.proximaFaixaId,regra.atualizadoEm])).digest('hex'):null;
export function progressoGraduacao(ctx:ContextoEvolucao,alunoId:string,referencia=today()):ProgressoGraduacao {
  const aluno=ctx.alunos.find(a=>a.id===alunoId);if(!aluno)throw new HttpError(404,'Aluno não encontrado.');
  const faixa=ctx.faixas.find(f=>f.id===aluno.faixaId||!aluno.faixaId&&f.nome===aluno.faixa);
  const estado=ctx.estados.find(e=>e.alunoId===alunoId&&e.faixaId===faixa?.id)??null,original=ctx.regras.find(r=>r.faixaId===faixa?.id)??null;
  const nomeFaixa=faixa?.nome??'',limiteRegistro=limiteGrausRegistro(nomeFaixa);
  const regra=original?{...original,grausParaFaixa:limiteGrausPadrao(nomeFaixa)??Math.min(original.grausParaFaixa,limiteRegistro??99)}:null;
  const grauAtual=ctx.graus.find(g=>g.id===aluno.grauId)?.numero??null;
  const marco=new Set<string>(estado?JSON.parse(estado.marcoAulas):[]);
  const aulas=new Set(ctx.aulas.filter(a=>a.situacao==='agendada'&&a.dataAula<=referencia&&estado&&a.dataAula>=estado.dataInicioFaixa).map(a=>a.id));
  const aulasConfirmadas=new Set(ctx.chamada.filter(p=>p.alunoId===alunoId&&Boolean(p.presente)&&aulas.has(p.aulaId)&&!marco.has(p.aulaId)).map(p=>p.aulaId)).size;
  const aulasAnteriores=estado?.aulasAnteriores??0,aulasTotal=aulasConfirmadas+aulasAnteriores;
  const meta=(alvo:number):MetaGraduacao=>{
    const aulasNecessarias=regra?.aulasPorGrau==null?null:regra.aulasPorGrau*alvo;
    // Campos temporais antigos permanecem no histórico, sem bloquear a evolução atual.
    const dataMinima='';
    return {aulasNecessarias,aulasRestantes:Math.max(0,(aulasNecessarias??0)-aulasTotal),dataMinima,apto:Boolean(estado&&regra&&faixa?.situacao==='ativo'&&aluno.situacao==='ativo'&&aulasTotal>=(aulasNecessarias??0))};
  };
  const proximoGrau=regra&&(grauAtual??0)<regra.grausParaFaixa?(grauAtual??0)+1:null;
  const metaGrau=proximoGrau===null?null:meta(proximoGrau);
  if(metaGrau&&(grauAtual===null||!ctx.graus.some(g=>g.faixaId===faixa?.id&&g.numero===proximoGrau&&g.situacao==='ativo')))metaGrau.apto=false;
  const destino=ctx.faixas.find(f=>f.id===regra?.proximaFaixaId&&f.situacao==='ativo'),metaFaixa=destino&&regra?meta(regra.grausParaFaixa):null;
  if(metaFaixa&&((grauAtual??0)<regra!.grausParaFaixa||grauAtual===null&&regra!.grausParaFaixa>0))metaFaixa.apto=false;
  const historico=ctx.eventos.filter(e=>e.alunoId===alunoId).sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm)||b.id.localeCompare(a.id));
  return {alunoId,nome:aluno.nome,faixa:aluno.faixa,grauAtual,estado,regra,regraAssinatura:assinaturaRegra(regra),aulasConfirmadas,aulasAnteriores,aulasTotal,proximoGrau,metaGrau,proximaFaixa:destino?.nome??null,metaFaixa,solicitacaoPendente:historico.some(e=>e.tipo==='solicitacao'&&e.versaoEstado===estado?.versao),historico};
}
export function planejarRegra(ctx:ContextoEvolucao,faixaId:string,body:unknown,timestamp:string) {
  const input=regraEvolucaoSchema.parse(body),faixa=ctx.faixas.find(f=>f.id===faixaId);
  if(!faixa)throw new HttpError(404,'Faixa não encontrada.');
  if(faixa.situacao!=='ativo')throw new HttpError(409,'Ative a faixa para configurar a evolução.');
  const anterior=ctx.regras.find(r=>r.faixaId===faixaId),limite=limiteGrausPadrao(faixa.nome);
  if(limite!==null&&input.grausParaFaixa!==undefined&&input.grausParaFaixa!==limite)throw new HttpError(400,'Esta faixa possui quatro graus definidos automaticamente.');
  const grausParaFaixa=limite??anterior?.grausParaFaixa??input.grausParaFaixa??0;
  const proximaFaixaId=input.proximaFaixaId===undefined?anterior?.proximaFaixaId??null:input.proximaFaixaId;
  if(input.proximaFaixaId!==undefined&&(proximaFaixaId===faixaId||proximaFaixaId&&!ctx.faixas.some(f=>f.id===proximaFaixaId&&f.situacao==='ativo')))throw new HttpError(400,'Escolha outra faixa ativa como destino.');
  const graus:GrauFaixa[]=[];
  for(let numero=0;numero<=grausParaFaixa;numero++)if(!ctx.graus.some(g=>g.faixaId===faixaId&&g.numero===numero))graus.push({id:randomUUID(),faixaId,numero,situacao:'ativo',criadoEm:timestamp,atualizadoEm:timestamp});
  const row:RegraGraduacao={aulasPorGrau:input.aulasPorGrau,mesesPorGrau:null,mesesMinimosFaixa:0,grausParaFaixa,proximaFaixaId,id:anterior?.id??randomUUID(),faixaId,atualizadoEm:timestamp};
  return {row,graus};
}
export function planejarEvolucao(ctx:ContextoEvolucao,alunoId:string,autorId:string,input:EntradaEvolucao,timestamp:string) {
  const autor=ctx.usuarios.find(u=>u.id===autorId),aluno=ctx.alunos.find(a=>a.id===alunoId);
  if(!autor)throw new HttpError(403,'Acesso indisponível.');
  if(!aluno)throw new HttpError(404,'Aluno não encontrado.');
  if(aluno.situacao!=='ativo')throw new HttpError(409,'Ative o aluno antes de registrar a evolução.');
  if(input.tipo!=='solicitacao'&&autor.perfil!=='admin')throw new HttpError(403,'Somente o mestre/administrador pode alterar a graduação.');
  if(input.tipo==='solicitacao'){if(autor.perfil==='aluno'&&autor.alunoId!==alunoId)throw new HttpError(403,'Esta trajetória pertence a outro aluno.');if(!['aluno','responsavel'].includes(autor.perfil))throw new HttpError(403,'Use o perfil do aluno para sinalizar.');assertAcessoPortal(aluno,ctx.vinculos,autor);}
  const antes=progressoGraduacao(ctx,alunoId),old=antes.estado;
  if(input.versao!==(old?.versao??0))throw new HttpError(409,'A graduação foi atualizada. Recarregue a ficha antes de continuar.');
  let novo={...aluno},estado=old,motivo='',novoGrau:GrauFaixa|null=null;
  if(input.tipo==='solicitacao'){
    if(antes.solicitacaoPendente)return {aluno:null,estado:null,evento:null,novoGrau:null};
    if(!antes.metaGrau?.apto&&!antes.metaFaixa?.apto)throw new HttpError(409,'Os requisitos ainda não foram atingidos.');
    motivo='Aluno solicitou revisão da graduação após atingir os critérios.';
  }else if(input.tipo==='ajuste'){
    const faixa=ctx.faixas.find(f=>f.id===input.faixaId);if(!faixa)throw new HttpError(404,'Faixa não encontrada.');
    let grauId=input.grauId;
    if(input.grauNumero!==undefined){
      const limite=limiteGrausRegistro(faixa.nome);
      if(limite===null||input.grauNumero>limite)throw new HttpError(400,'O grau escolhido está fora do padrão desta faixa.');
      const existente=ctx.graus.find(g=>g.faixaId===faixa.id&&g.numero===input.grauNumero);
      if(!existente)novoGrau={id:randomUUID(),faixaId:faixa.id,numero:input.grauNumero,situacao:'ativo',criadoEm:timestamp,atualizadoEm:timestamp};
      grauId=existente?.id??novoGrau!.id;
    }
    const graus=novoGrau?[...ctx.graus,novoGrau]:ctx.graus;
    novo={...aluno,...graduacaoValida({faixa:faixa.nome,faixaId:faixa.id,grauId},ctx.faixas,graus,aluno)};
    estado={id:old?.id??randomUUID(),alunoId,faixaId:faixa.id,dataInicioFaixa:input.dataInicioFaixa,aulasAnteriores:input.aulasAnteriores,marcoAulas:old?.faixaId===faixa.id?old.marcoAulas:'[]',versao:(old?.versao??0)+1,atualizadoEm:timestamp};motivo=input.motivo;
  }else{
    if(!old||!antes.regra)throw new HttpError(409,'Configure as regras e o ponto de partida do aluno.');
    if(input.regraAssinatura!==assinaturaRegra(antes.regra))throw new HttpError(409,'As regras da academia mudaram. Recarregue antes de confirmar a promoção.');
    if(input.tipo==='grau'){
      if(!antes.metaGrau?.apto)throw new HttpError(409,'Os critérios para o próximo grau ainda não foram atingidos.');
      const grau=ctx.graus.find(g=>g.faixaId===old.faixaId&&g.numero===antes.proximoGrau&&g.situacao==='ativo')!;
      novo={...aluno,grauId:grau.id};estado={...old,versao:old.versao+1,atualizadoEm:timestamp};motivo='Próximo grau confirmado pelo mestre após cumprir os critérios.';
    }else{
      if(!antes.metaFaixa?.apto)throw new HttpError(409,'Os critérios para a próxima faixa ainda não foram atingidos.');
      const destino=ctx.faixas.find(f=>f.id===antes.regra!.proximaFaixaId)!;
      novo={...aluno,...graduacaoValida({faixa:destino.nome,faixaId:destino.id,grauId:ctx.graus.find(g=>g.faixaId===destino.id&&g.numero===0&&g.situacao==='ativo')?.id??null},ctx.faixas,ctx.graus,aluno)};
      // Presenças já utilizadas não contam novamente na faixa recém-concedida.
      estado={...old,faixaId:destino.id,dataInicioFaixa:today(),aulasAnteriores:0,marcoAulas:JSON.stringify(ctx.chamada.filter(p=>p.alunoId===alunoId&&Boolean(p.presente)).map(p=>p.aulaId)),versao:old.versao+1,atualizadoEm:timestamp};motivo='Nova faixa confirmada pelo mestre após cumprir os critérios.';
    }
  }
  const evento:EventoGraduacao={id:randomUUID(),alunoId,tipo:input.tipo,faixaAnterior:aluno.faixa,faixaNova:novo.faixa,grauAnterior:antes.grauAtual,grauNovo:novoGrau?.numero??ctx.graus.find(g=>g.id===novo.grauId)?.numero??null,aulasConsideradas:antes.aulasTotal,motivo,autorId,versaoEstado:input.tipo==='solicitacao'?old!.versao:estado!.versao,regraSnapshot:antes.regra?JSON.stringify(antes.regra):null,criadoEm:timestamp};
  return {aluno:input.tipo==='solicitacao'?null:novo,estado:input.tipo==='solicitacao'?null:estado,evento,novoGrau};
}
