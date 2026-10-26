import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Aluno, EventoAcessoAluno, PerfilBasicoAluno } from '@tatame/shared';
import type { Usuario, Sessao } from './models.js';
import { HttpError } from '../../http-error.js';
import { tokenHash } from './password.js';
import { emailProprio } from './familia.js';

export const perfilBasicoSchema=z.object({
  nome:z.string().trim().min(2,'Informe seu nome com pelo menos 2 caracteres.').max(120),
  telefone:z.string().trim().max(40).refine(v=>/^\d{8,15}$/.test(v.replace(/\D/g,'')),'Informe um telefone válido.'),
  email:z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(180).refine(emailProprio,'Informe seu e-mail próprio.'),
}).strict();
export const editarPerfilSchema=perfilBasicoSchema.extend({senhaAtual:z.string().min(1).max(128).optional()}).strict();

/** Regra comum aos dois bancos; a autorização é conferida novamente sob a trava de gravação. */
export function planejarPerfilAluno(usuario:Usuario|null,aluno:Aluno|null,sessao:Sessao|null,input:PerfilBasicoAluno,usuarios:Usuario[],alunos:Aluno[],senhaHashVerificada?:string){
  const agora=new Date().toISOString();
  if(!usuario||!sessao||sessao.usuarioId!==usuario.id||!usuario.senhaHash||sessao.expiraEm<=agora||sessao.credencialHash!==tokenHash(usuario.senhaHash))throw new HttpError(401,'Sua sessão terminou. Entre novamente.');
  if(usuario.perfil!=='aluno'||!aluno||usuario.alunoId!==aluno.id||aluno.situacao!=='ativo'||aluno.acessoPrincipal==='responsavel')throw new HttpError(403,'Seu cadastro não está disponível para edição por este acesso.');
  const dados=perfilBasicoSchema.parse(input);
  const emailMudou=dados.email!==usuario.email.toLowerCase();
  if(emailMudou&&senhaHashVerificada!==usuario.senhaHash)throw new HttpError(409,'A conta mudou durante a confirmação. Atualize a página e confirme sua senha novamente.');
  if(usuarios.some(u=>u.id!==usuario.id&&u.email.toLowerCase()===dados.email)||alunos.some(a=>a.id!==aluno.id&&a.email.toLowerCase()===dados.email))throw new HttpError(409,'Este e-mail já está em uso. Escolha outro endereço.');
  const campos=(['nome','telefone','email'] as const).filter(c=>dados[c]!==aluno[c]||(c!=='telefone'&&dados[c]!==usuario[c]));
  const evento:EventoAcessoAluno|null=campos.length?{id:randomUUID(),alunoId:aluno.id,usuarioId:usuario.id,tipo:'perfil_basico_atualizado',detalhes:JSON.stringify({campos,emailAlterado:emailMudou}),criadoEm:agora}:null;
  return {aluno:{...aluno,...dados},usuario:{...usuario,nome:dados.nome,email:dados.email,...(emailMudou?{conviteHash:null,conviteExpiraEm:null}:{})},emailMudou,evento};
}
