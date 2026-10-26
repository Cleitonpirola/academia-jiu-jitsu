import { z } from 'zod';
import type { Aluno, FaixaGraduacao, GrauFaixa, Situacao } from '@tatame/shared';
import { HttpError } from '../../http-error.js';

export const chaveFaixa=(nome:string)=>nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
export const faixaSchema=z.object({nome:z.string().trim().min(2).max(80),cor:z.string().regex(/^#[0-9a-fA-F]{6}$/,'Escolha uma cor válida.').transform(v=>v.toUpperCase()),ordem:z.number().int().min(0).max(9999),situacao:z.enum(['ativo','inativo'])}).strict();
export const grauSchema=z.object({numero:z.number().int().min(0).max(99),situacao:z.enum(['ativo','inativo'])}).strict();
export function graduacaoValida(input:Pick<Aluno,'faixa'|'faixaId'|'grauId'>,faixas:FaixaGraduacao[],graus:GrauFaixa[],atual?:Aluno|null){
  const faixa=input.faixaId?faixas.find(f=>f.id===input.faixaId):faixas.find(f=>f.nome===input.faixa);
  if(!faixa||faixa.nome!==input.faixa)throw new HttpError(400,'Selecione uma faixa cadastrada.');
  const manteveFaixa=Boolean(atual&&(atual.faixaId===faixa.id||atual.faixa===faixa.nome));
  if(faixa.situacao!=='ativo'&&!manteveFaixa)throw new HttpError(409,'Esta faixa está inativa para novas atribuições.');
  const grauId=input.grauId===undefined?(manteveFaixa?atual?.grauId??null:null):input.grauId;
  const grau=grauId?graus.find(g=>g.id===grauId):null;
  if(grauId&&(!grau||grau.faixaId!==faixa.id))throw new HttpError(400,'O grau escolhido não pertence a esta faixa.');
  if(grau&&grau.situacao!=='ativo'&&atual?.grauId!==grau.id)throw new HttpError(409,'Este grau está inativo para novas atribuições.');
  return {faixa:faixa.nome,faixaId:faixa.id,grauId};
}
export type AcaoGraduacao={tipo:'faixa';row:FaixaGraduacao;create:boolean}|{tipo:'grau';row:GrauFaixa;create:boolean}|{tipo:'excluir';tabela:'FaixaGraduacao'|'GrauFaixa';id:string};
export function validarCatalogo(acao:AcaoGraduacao,faixas:FaixaGraduacao[],graus:GrauFaixa[],alunos:Aluno[]){
  if(acao.tipo==='faixa'){
    const old=faixas.find(f=>f.id===acao.row.id);if(!acao.create&&!old)throw new HttpError(404,'Faixa não encontrada.');
    if(faixas.some(f=>f.id!==acao.row.id&&chaveFaixa(f.nome)===acao.row.chave))throw new HttpError(409,'Já existe uma faixa com esse nome.');
    return old;
  }
  if(acao.tipo==='grau'){
    const faixa=faixas.find(f=>f.id===acao.row.faixaId),old=graus.find(g=>g.id===acao.row.id);
    if(!faixa)throw new HttpError(404,'Faixa não encontrada.');
    if(acao.create&&faixa.situacao!=='ativo')throw new HttpError(409,'Ative a faixa antes de cadastrar graus.');
    if(!acao.create&&(!old||old.faixaId!==faixa.id))throw new HttpError(404,'Grau não encontrado nesta faixa.');
    if(graus.some(g=>g.id!==acao.row.id&&g.faixaId===faixa.id&&g.numero===acao.row.numero))throw new HttpError(409,'Este grau já está cadastrado nesta faixa.');
    return;
  }
  const old=acao.tabela==='FaixaGraduacao'?faixas.find(f=>f.id===acao.id):graus.find(g=>g.id===acao.id);
  if(!old)throw new HttpError(404,'Cadastro não encontrado.');
  if(acao.tabela==='FaixaGraduacao'){
    if(alunos.some(a=>a.faixaId===old.id||a.faixa===(old as FaixaGraduacao).nome)||graus.some(g=>g.faixaId===old.id))throw new HttpError(409,'Esta faixa possui alunos ou graus vinculados. Inative-a para preservar os vínculos.');
  }else if(alunos.some(a=>a.grauId===old.id))throw new HttpError(409,'Este grau possui alunos vinculados. Inative-o para preservar os vínculos.');
}
