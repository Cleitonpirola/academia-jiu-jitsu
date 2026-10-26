import { graduacaoValida } from '../graduacoes/rules.js';
import type { FaixaGraduacao,GrauFaixa } from '@tatame/shared';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Aluno, ResponsavelAluno, UsuarioView } from '@tatame/shared';
import type { Usuario } from './models.js';
import type { Table, Tables } from '../../repository.js';
import { today } from '../../domain.js';
import { HttpError } from '../../http-error.js';

export function menorDeIdade(aluno: Pick<Aluno, 'dataNascimento'>, data = today()) {
  const [ano, mes, dia] = aluno.dataNascimento.split('-').map(Number);
  const aniversario18 = `${ano + 18}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
  return data < aniversario18;
}
export const emailProprio = (email: string) => !email.endsWith('@cadastro.invalid');
export const responsavelSchema = z.object({
  nome: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().max(180),
  telefone: z.string().trim().max(40).refine(v => /^\d{8,15}$/.test(v.replace(/\D/g,'')), 'Informe o telefone do responsável.'),
  parentesco: z.string().trim().min(2).max(60),
}).strict();
export const vinculoSchema = z.object({ possuiCelular: z.boolean(), responsavel: responsavelSchema }).strict();
export const transferenciaSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(180).refine(emailProprio, 'Informe o e-mail próprio do aluno.'),
  telefone: responsavelSchema.shape.telefone, maioridade: z.boolean(), manterContato: z.boolean(),
}).strict();
export type AcaoFamiliar = {
  alunoId: string; autorId: string; timestamp: string; novoAluno?: Aluno;
} & ({ tipo: 'vincular'; input: z.infer<typeof vinculoSchema> }
  | { tipo: 'transferir'; input: z.infer<typeof transferenciaSchema>; conviteHash: string; expiraEm: string }
  | { tipo: 'convidar'; conviteHash: string; expiraEm: string });
export interface EstadoFamilia { aluno: Aluno | null; usuarios: Usuario[]; vinculos: ResponsavelAluno[]; alunos: Aluno[]; faixas:FaixaGraduacao[];graus:GrauFaixa[] }
export type MutacaoFamilia = { [K in Table]: { table: K; row: Tables[K]; update: boolean } }[Table];
export interface PlanoFamilia { mutacoes: MutacaoFamilia[]; revogarSessoes: string[]; aluno: Aluno; usuarioId: string }

/** Monta a alteração inteira antes de gravar: ambos os bancos aplicam o mesmo plano em uma transação. */
export function planejarFamilia(estado: EstadoFamilia, acao: AcaoFamiliar): PlanoFamilia {
  const original = acao.novoAluno ?? estado.aluno;
  if (!original) throw new HttpError(404, 'Aluno não encontrado.');
  const aluno = { ...original, ...(acao.novoAluno?graduacaoValida(original,estado.faixas,estado.graus):{}) };
  const plano: PlanoFamilia = { mutacoes: [], revogarSessoes: [], aluno, usuarioId: '' };
  const gravar = <K extends Table>(table: K, row: Tables[K], update: boolean) => plano.mutacoes.push({table,row,update} as MutacaoFamilia);
  const evento = (tipo: string, detalhes: object) => gravar('EventoAcessoAluno', { id:randomUUID(), alunoId:aluno.id, usuarioId:acao.autorId, tipo, detalhes:JSON.stringify(detalhes), criadoEm:acao.timestamp },false);
  const meusVinculos = estado.vinculos.filter(v=>v.alunoId===aluno.id);
  const proprio = estado.usuarios.find(u=>u.alunoId===aluno.id);
  const novoUsuario = (nome: string, email: string, perfil: 'aluno'|'responsavel'): Usuario => ({id:randomUUID(),nome,email,perfil,alunoId:perfil==='aluno'?aluno.id:null,senhaHash:null,conviteHash:null,conviteExpiraEm:null,criadoEm:acao.timestamp});
  if (acao.tipo === 'vincular') {
    if (!menorDeIdade(aluno)) throw new HttpError(409,'O aluno já é maior de idade. Use a transferência de responsabilidade.');
    if (aluno.responsabilidadeTransferidaEm) throw new HttpError(409,'A responsabilidade deste cadastro já foi transferida.');
    const {responsavel,possuiCelular}=acao.input;
    if (possuiCelular && (!emailProprio(aluno.email) || !aluno.telefone)) throw new HttpError(400,'Preencha e-mail e telefone próprios na ficha ou use Ativar acesso próprio.');
    const existente=estado.usuarios.find(u=>u.email===responsavel.email);
    if (existente && existente.perfil!=='responsavel') throw new HttpError(409,'Este e-mail já pertence a uma conta de aluno ou administrador. Use um e-mail exclusivo do responsável.');
    const usuario=existente ?? novoUsuario(responsavel.nome,responsavel.email,'responsavel');
    // Uma conta já existente conserva nome, senha e os outros dependentes.
    if(!existente)gravar('Usuario',usuario,false);
    for(const v of meusVinculos)if(v.tipoVinculo==='responsavel'&&v.usuarioId!==usuario.id)gravar('ResponsavelAluno',{...v,tipoVinculo:'arquivado',atualizadoEm:acao.timestamp},true);
    const anterior=meusVinculos.find(v=>v.usuarioId===usuario.id);
    gravar('ResponsavelAluno',{id:anterior?.id??randomUUID(),alunoId:aluno.id,usuarioId:usuario.id,telefone:responsavel.telefone,parentesco:responsavel.parentesco,tipoVinculo:'responsavel',criadoEm:anterior?.criadoEm??acao.timestamp,atualizadoEm:acao.timestamp},Boolean(anterior));
    aluno.possuiCelular=possuiCelular; aluno.acessoPrincipal=possuiCelular?'aluno':'responsavel';
    if(!possuiCelular&&proprio){gravar('Usuario',{...proprio,senhaHash:null,conviteHash:null,conviteExpiraEm:null},true);plano.revogarSessoes.push(proprio.id);}
    plano.usuarioId=usuario.id;
    evento('vinculo_atualizado',{responsavelId:usuario.id,possuiCelular,acessoPrincipal:aluno.acessoPrincipal});
  } else if(acao.tipo==='convidar') {
    if(!menorDeIdade(aluno)||aluno.situacao!=='ativo')throw new HttpError(409,'O convite exige um dependente menor e ativo.');
    const vinculo=meusVinculos.find(v=>v.tipoVinculo==='responsavel');
    const usuario=estado.usuarios.find(u=>u.id===vinculo?.usuarioId&&u.perfil==='responsavel');
    if(!usuario)throw new HttpError(400,'Cadastre o responsável primeiro.');
    gravar('Usuario',{...usuario,conviteHash:acao.conviteHash,conviteExpiraEm:acao.expiraEm},true);
    plano.usuarioId=usuario.id; evento('convite_responsavel',{responsavelId:usuario.id});
  } else {
    const input=acao.input;
    if(input.maioridade&&menorDeIdade(aluno))throw new HttpError(409,'A transferência definitiva só está disponível a partir dos 18 anos.');
    if(!input.maioridade&&!menorDeIdade(aluno))throw new HttpError(409,'Use a transferência por maioridade para este aluno.');
    if(aluno.situacao!=='ativo')throw new HttpError(409,'Ative o cadastro antes de preparar o acesso próprio.');
    if(estado.usuarios.some(u=>u.email===input.email&&u.id!==proprio?.id)||estado.alunos.some(a=>a.email===input.email&&a.id!==aluno.id))throw new HttpError(409,'Este e-mail já pertence a outro cadastro.');
    aluno.email=input.email;aluno.telefone=input.telefone;aluno.possuiCelular=true;aluno.acessoPrincipal='aluno';
    const usuario={...(proprio??novoUsuario(aluno.nome,input.email,'aluno')),nome:aluno.nome,email:input.email,senhaHash:null,conviteHash:acao.conviteHash,conviteExpiraEm:acao.expiraEm};
    gravar('Usuario',usuario,Boolean(proprio));plano.revogarSessoes.push(usuario.id);plano.usuarioId=usuario.id;
    if(input.maioridade){aluno.responsabilidadeTransferidaEm=acao.timestamp;for(const v of meusVinculos)if(v.tipoVinculo!=='arquivado')gravar('ResponsavelAluno',{...v,tipoVinculo:input.manterContato?'contato':'arquivado',atualizadoEm:acao.timestamp},true);}
    evento(input.maioridade?'transferencia_maioridade':'acesso_proprio_ativado',{manterContato:input.maioridade?input.manterContato:true});
  }
  // Cadastro novo vem primeiro por causa das chaves estrangeiras.
  if(acao.novoAluno)plano.mutacoes.unshift({table:'Aluno',row:aluno,update:false});
  else gravar('Aluno',aluno,true);
  return plano;
}
export function responsavelPodeAcessar(aluno: Aluno, vinculos: ResponsavelAluno[], usuarioId: string) {
  return aluno.situacao==='ativo'&&menorDeIdade(aluno)&&vinculos.some(v=>v.alunoId===aluno.id&&v.usuarioId===usuarioId&&v.tipoVinculo==='responsavel');
}
export function usuarioHabilitado(usuario: Usuario, alunos: Aluno[], vinculos: ResponsavelAluno[]) {
  if(usuario.perfil==='admin')return true;
  if(usuario.perfil==='responsavel')return alunos.some(a=>responsavelPodeAcessar(a,vinculos,usuario.id));
  return alunos.some(a=>a.id===usuario.alunoId&&a.situacao==='ativo'&&a.acessoPrincipal!=='responsavel');
}
export function assertAcessoPortal(aluno: Aluno, vinculos: ResponsavelAluno[], ator?: Pick<UsuarioView,'id'|'perfil'>, checkin=false) {
  if(!ator)return;
  if(ator.perfil==='responsavel'){
    if(!responsavelPodeAcessar(aluno,vinculos,ator.id))throw new HttpError(403,'Este dependente não está disponível para seu acesso.');
    if(checkin&&aluno.acessoPrincipal!=='responsavel')throw new HttpError(403,'Este aluno possui acesso próprio e deve fazer o próprio check-in.');
  } else if(ator.perfil==='aluno'&&aluno.acessoPrincipal==='responsavel')throw new HttpError(403,'O acesso principal deste aluno está com o responsável.');
}
