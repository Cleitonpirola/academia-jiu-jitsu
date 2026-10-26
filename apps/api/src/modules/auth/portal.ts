import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../../repository.js';
import { HttpError } from '../../http-error.js';
import { statusOf } from '../../domain.js';
import { usuarioAtual } from './routes.js';
import { bloqueioFinanceiro } from './financial-access.js';
import { usoPlano } from '../planos/rules.js';
import { saldoMensal } from '../planos/saldo-mensal.js';
import { condicoesPadrao, debitoVencido } from '../planos/debitos.js';
import { assertAcessoPortal } from './familia.js';
import { editarPerfilSchema } from './perfil.js';
import { verifyPassword } from './password.js';

export function portalRouter(repo: Repository, responsavel=false) {
  const router = Router({mergeParams:true});
  const tentativasEmail=new Map<string,{total:number;ate:number}>();
  const alunoId=(res: import('express').Response):string=>res.locals.portalAlunoId;
  router.use(async(req, res, next) => {
    const usuario=usuarioAtual(res);
    if (usuario.perfil !== (responsavel?'responsavel':'aluno')) throw new HttpError(403, 'Entre com a conta adequada para acessar esta área.');
    const id=responsavel?z.string().uuid().parse(req.params.alunoId):usuario.alunoId!;
    const aluno=await repo.get('Aluno',id);
    if(!aluno||aluno.situacao!=='ativo')throw new HttpError(403,'Cadastro indisponível.');
    assertAcessoPortal(aluno,await repo.list('ResponsavelAluno'),usuario);
    res.locals.portalAlunoId=id;
    next();
  });
  router.get('/perfil',async(_req,res)=>{
    if(responsavel)throw new HttpError(403,'A edição de perfil é exclusiva do próprio aluno.');
    const aluno=await repo.get('Aluno',alunoId(res));
    res.json({...aluno,email:usuarioAtual(res).email});
  });
  router.put('/perfil',async(req,res)=>{
    if(responsavel)throw new HttpError(403,'A edição de perfil é exclusiva do próprio aluno.');
    const {senhaAtual,...input}=editarPerfilSchema.parse(req.body);
    const usuario=await repo.get('Usuario',usuarioAtual(res).id);
    let senhaHashVerificada:string|undefined;
    if(usuario&&input.email!==usuario.email.toLowerCase()){
      if(!senhaAtual)throw new HttpError(400,'Confirme sua senha atual para trocar o e-mail de acesso.');
      const now=Date.now();for(const [id,v] of tentativasEmail)if(v.ate<=now)tentativasEmail.delete(id);
      const tentativa=tentativasEmail.get(usuario.id)??{total:0,ate:now+15*60_000};
      if(tentativa.total>=10||tentativasEmail.size>=5000)throw new HttpError(429,'Muitas tentativas de confirmar a senha. Tente novamente em 15 minutos.');
      tentativa.total++;tentativasEmail.set(usuario.id,tentativa);
      if(!await verifyPassword(senhaAtual,usuario.senhaHash))throw new HttpError(400,'Senha atual incorreta. Seus dados não foram alterados.');
      senhaHashVerificada=usuario.senhaHash!;
    }
    res.json(await repo.savePerfilAluno(usuarioAtual(res).id,res.locals.sessao?.id??'',input,senhaHashVerificada));
  });
  router.get('/comunicados',async(_req,res)=>res.json((await repo.list('ComunicadoAluno')).filter(c=>c.alunoId===alunoId(res)&&c.destinatarioId===usuarioAtual(res).id).sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm))));
  router.put('/comunicados/:id/resposta',async(req,res)=>{
    const comunicado=await repo.get('ComunicadoAluno',z.string().uuid().parse(req.params.id));
    if(!comunicado||comunicado.alunoId!==alunoId(res)||comunicado.destinatarioId!==usuarioAtual(res).id)throw new HttpError(404,'Comunicado não encontrado.');
    const {resposta}=z.object({resposta:z.enum(['ciente','aceito','recusado'])}).strict().parse(req.body);
    if(comunicado.tipo==='aviso'?resposta!=='ciente':resposta==='ciente')throw new HttpError(400,'Resposta incompatível com o comunicado.');
    res.json(await repo.responderComunicado(comunicado.id,usuarioAtual(res).id,resposta,new Date().toISOString()));
  });
  router.get('/debitos',async(_req,res)=>res.json((await repo.list('DebitoAula')).filter(item=>item.alunoId===alunoId(res)).sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm))));
  router.post('/aulas/:id/adicional',async(req,res)=>{
    const id=z.string().uuid().parse(req.params.id);
    const {confirmo,...aceite}=z.object({confirmo:z.literal(true),valorEsperadoCentavos:z.number().int().positive(),prazoEsperadoDias:z.number().int().min(1).max(90)}).strict().parse(req.body);
    res.status(201).json(await repo.confirmarAulaAdicional(alunoId(res),id,aceite,new Date().toISOString(),usuarioAtual(res)));
  });
  router.get('/', async (_req, res) => {
    const id = alunoId(res);
    const aluno = await repo.get('Aluno', id);
    if (!aluno || aluno.situacao !== 'ativo') throw new HttpError(403, 'Cadastro indisponível.');
    const mensalidades = await repo.list('Mensalidade');
    const bloqueio = bloqueioFinanceiro(mensalidades, id);
    if (bloqueio) { res.json(bloqueio); return; }
    const [aulas, checkins, chamada, antigas, planos, liberacoes, todosDebitos, config] = await Promise.all([repo.list('Aula'), repo.list('CheckinAula'), repo.list('PresencaAula'), repo.list('Presenca'), repo.list('PlanoAluno'), repo.list('LiberacaoAula'),repo.list('DebitoAula'),repo.get('ConfiguracaoAcademia','principal')]);
    const debitos=todosDebitos.filter(item=>item.alunoId===id), condicoes=config ?? condicoesPadrao;
    const meusCheckins = new Map(checkins.filter(item => item.alunoId === id).map(item => [item.aulaId, item]));
    const minhasPresencas = new Map(chamada.filter(item => item.alunoId === id).map(item => [item.aulaId, item]));
    res.json({ bloqueado: false, aluno, aulas: aulas.filter(aula => aula.dataAula >= aluno.dataMatricula).map(aula => ({ ...aula, checkin: meusCheckins.get(aula.id) ?? null, presenca: minhasPresencas.get(aula.id) ?? null })).sort((a, b) => (a.dataAula + a.horaInicio).localeCompare(b.dataAula + b.horaInicio)),
      mensalidades: mensalidades.filter(item => item.alunoId === id).map(item => ({ ...item, status: statusOf(item) })).sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento)),
      historicoAntigo: antigas.filter(item => item.alunoId === id).sort((a, b) => b.dataTreino.localeCompare(a.dataTreino)),
      plano: usoPlano({ plano: planos.find(item => item.alunoId === id) ?? null, aulas, checkins, chamada, antigas, liberacoes, debitos }, id),
      saldoMensal: saldoMensal(aluno, aulas, checkins,undefined,debitos), debitos, debitoVencido:debitos.some(item=>debitoVencido(item)),
      condicoesAdicionais:{valorAulaAdicionalCentavos:condicoes.valorAulaAdicionalCentavos,prazoPagamentoDias:condicoes.prazoPagamentoDias},
    });
  });
  router.put('/aulas/:id/checkin', async (req, res) => {
    z.object({}).strict().parse(req.body ?? {});
    const id = z.string().uuid().parse(req.params.id);
    res.json(await repo.saveCheckin(id, alunoId(res), new Date().toISOString(),usuarioAtual(res)));
  });
  return router;
}
