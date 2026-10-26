import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import type { Aluno, Aula, ControleParental } from '@tatame/shared';
import { createApp as fixtureApp } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';
import { COOKIE, ADMIN_INICIAL_ID } from './modules/auth/routes.js';
import { tokenHash } from './modules/auth/password.js';
import { menorDeIdade } from './modules/auth/familia.js';
import { today } from './domain.js';

const responsavel={nome:'Responsável de teste',email:'familia@teste.invalid',telefone:'11900000000',parentesco:'Mãe'};
const senha='uma frase ficticia para testes';
describe('Acesso familiar e transferência de responsabilidade',()=>{
  let repo:SqliteRepository,app:ReturnType<typeof fixtureApp>;
  const call=(token:string,method:'get'|'post'|'put'|'patch'|'delete',path:string)=>request(app)[method](path).set('Cookie',COOKIE+'='+token).set('X-Tatame-Request','1');
  const admin=(method:'get'|'post'|'put'|'patch'|'delete',path:string)=>call('t'.repeat(43),method,path);
  const cadastrar=async(nome='Dependente',celular=false,email=responsavel.email)=>{
    const r=await admin('post','/api/alunos').send({nome,telefone:celular?'11911111111':'',email:celular?nome.toLowerCase()+'@teste.invalid':'',dataNascimento:'2014-01-01',dataMatricula:'2020-01-01',faixa:'Branca',situacao:'ativo',possuiCelular:celular,responsavel:{...responsavel,email}}).expect(201);
    return r.body as Aluno;
  };
  const sessao=async(usuarioId:string,token='r'.repeat(43))=>{
    await repo.update('Usuario',usuarioId,{senhaHash:'fixture-apenas-para-cookie'});
    await repo.insert('Sessao',{id:randomUUID(),usuarioId,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture-apenas-para-cookie'),expiraEm:'2099-01-01T00:00:00.000Z',criadoEm:new Date().toISOString()});return token;
  };
  const pai=async(aluno:Aluno,token='r'.repeat(43))=>sessao((await repo.list('ResponsavelAluno')).find(v=>v.alunoId===aluno.id&&v.tipoVinculo==='responsavel')!.usuarioId,token);
  const aula=async(hora='12:00')=>{
    const a:Aula={id:randomUUID(),titulo:'Aula de teste',dataAula:today(),horaInicio:hora,horaFim:'23:00',professor:'Professor de teste',origem:'grade',origemHorarioId:randomUUID(),turmaId:null,turmaNome:null,situacao:'agendada',canceladaEm:null,motivoCancelamento:null,criadoEm:new Date().toISOString()};await repo.createAula(a,[]);return a;
  };
  beforeEach(()=>{repo=new SqliteRepository(':memory:');app=fixtureApp(repo);});
  afterEach(()=>repo.close());
  it('cadastra menor sem telefone/e-mail próprios e vincula conta sem poderes administrativos',async()=>{
    const aluno=await cadastrar();assert.equal(aluno.acessoPrincipal,'responsavel');assert.equal(aluno.possuiCelular,false);assert.match(aluno.email,/@cadastro.invalid$/);
    const usuarios=await repo.list('Usuario');assert.equal(usuarios.filter(u=>u.perfil==='admin').length,1);assert.equal(usuarios.find(u=>u.email===responsavel.email)!.perfil,'responsavel');
    const data=await admin('get',`/api/alunos/${aluno.id}/familia`).expect(200);assert.equal(data.body.eventos[0].tipo,'vinculo_atualizado');assert.equal(data.body.eventos[0].usuarioId,ADMIN_INICIAL_ID);
    await admin('post',`/api/auth/alunos/${aluno.id}/convite`).expect(409);
  });
  it('não grava cadastro parcial quando responsável falta ou seu e-mail pertence a administrador',async()=>{
    const base={nome:'Menor inválido',telefone:'',email:'',dataNascimento:'2014-01-01',dataMatricula:'2020-01-01',faixa:'Branca',situacao:'ativo',possuiCelular:false};
    await admin('post','/api/alunos').send(base).expect(400);
    await admin('post','/api/alunos').send({...base,responsavel:{...responsavel,email:'admin@teste.invalid'}}).expect(409);
    assert.equal((await repo.list('Aluno')).length,0);assert.equal((await repo.list('ResponsavelAluno')).length,0);
  });
  it('um responsável acompanha irmãos sem duplicar conta e sem acessar outro aluno ou administração',async()=>{
    const a=await cadastrar('Ana'),b=await cadastrar('Bia'),outro=await cadastrar('Outro',false,'outra-familia@teste.invalid'),token=await pai(a);
    const r=await call(token,'get','/api/responsavel/dependentes').expect(200);assert.deepEqual(r.body.map((v:Aluno)=>v.id).sort(),[a.id,b.id].sort());
    assert.equal((await repo.list('Usuario')).filter(u=>u.email===responsavel.email).length,1);
    for(const path of ['/api/alunos','/api/debitos','/api/portal',`/api/responsavel/${outro.id}/portal`,`/api/responsavel/${outro.id}/portal/debitos`])await call(token,'get',path).expect(403);
    await call(token,'patch','/api/debitos/'+randomUUID()+'/pagamento').send({dataPagamento:today()}).expect(403);
  });
  it('responsável faz check-in, usa saldo uma vez, pode contratar adicional e não pode dar baixa',async()=>{
    const aluno=await cadastrar(),token=await pai(aluno),a=await aula(),b=await aula('18:00');
    await repo.saveSaldoMensalAluno(aluno.id,1);
    const path=`/api/responsavel/${aluno.id}/portal`;
    const first=await call(token,'put',path+`/aulas/${a.id}/checkin`).send({}).expect(200);
    const repeat=await call(token,'put',path+`/aulas/${a.id}/checkin`).send({}).expect(200);assert.equal(first.body.id,repeat.body.id);
    assert.equal((await repo.get('Aluno',aluno.id))!.aulasRestantesMes,0);
    await call(token,'put',path+`/aulas/${b.id}/checkin`).send({}).expect(403);
    await repo.saveConfiguracaoAdicionais({valorAulaAdicionalCentavos:2500,prazoPagamentoDias:3},ADMIN_INICIAL_ID,new Date().toISOString());
    const extra=await call(token,'post',path+`/aulas/${b.id}/adicional`).send({confirmo:true,valorEsperadoCentavos:2500,prazoEsperadoDias:3}).expect(201);
    const d=await call(token,'get',path+'/debitos').expect(200);assert.equal(d.body[0].id,extra.body.id);
    await call(token,'put',path+`/aulas/${b.id}/checkin`).send({}).expect(200);assert.equal((await repo.get('Aluno',aluno.id))!.aulasRestantesMes,0);
    await call(token,'patch',`/api/debitos/${extra.body.id}/pagamento`).send({dataPagamento:today()}).expect(403);
  });
  it('menor com celular faz o próprio check-in; responsável apenas acompanha e autoriza',async()=>{
    const aluno=await cadastrar('Comcelular',true),token=await pai(aluno),a=await aula();
    await call(token,'get',`/api/responsavel/${aluno.id}/portal`).expect(200);
    await call(token,'put',`/api/responsavel/${aluno.id}/portal/aulas/${a.id}/checkin`).send({}).expect(403);
    const convite=await admin('post',`/api/auth/alunos/${aluno.id}/convite`).expect(201);
    const ativacao=await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({token:convite.body.token,senha}).expect(200);
    assert.equal(ativacao.body.usuario.perfil,'aluno');
    await request(app).put(`/api/portal/aulas/${a.id}/checkin`).set('Cookie',ativacao.headers['set-cookie']).set('X-Tatame-Request','1').send({}).expect(200);
  });
  it('ativa convite real do responsável uma única vez e permite entrar pela senha escolhida',async()=>{
    const aluno=await cadastrar(),convite=await admin('post',`/api/alunos/${aluno.id}/familia/convidar`).send({}).expect(201);
    const ativacao=await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({token:convite.body.token,senha}).expect(200);assert.equal(ativacao.body.usuario.perfil,'responsavel');
    await request(app).get('/api/responsavel/dependentes').set('Cookie',ativacao.headers['set-cookie']).expect(200);
    await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({token:convite.body.token,senha}).expect(400);
    await request(app).post('/api/auth/entrar').set('X-Tatame-Request','1').send({email:responsavel.email,senha}).expect(200);
  });
  it('transfere acesso próprio sem apagar histórico e mantém acompanhamento até maioridade',async()=>{
    const aluno=await cadastrar(),token=await pai(aluno),a=await aula();await repo.saveCheckin(a.id,aluno.id,new Date().toISOString());
    const before=(await repo.list('CheckinAula'))[0];
    const r=await admin('post',`/api/alunos/${aluno.id}/familia/transferir`).send({email:'proprio@teste.invalid',telefone:'11900000001',maioridade:false,manterContato:true}).expect(201);
    const after=await repo.get('Aluno',aluno.id);assert.equal(after!.acessoPrincipal??'aluno','aluno');assert.equal(after!.email,'proprio@teste.invalid');assert.deepEqual((await repo.list('CheckinAula'))[0],before);
    await call(token,'get',`/api/responsavel/${aluno.id}/portal`).expect(200);
    await call(token,'put',`/api/responsavel/${aluno.id}/portal/aulas/${a.id}/checkin`).send({}).expect(403);
    await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({token:r.body.token,senha}).expect(200);
    await admin('post',`/api/alunos/${aluno.id}/familia/transferir`).send({email:'proprio@teste.invalid',telefone:'11900000001',maioridade:true,manterContato:true}).expect(409);
  });
  it('ao voltar ao acesso pelo responsável revoga sessão e convite antigos do aluno',async()=>{
    const aluno=await cadastrar('Celular',true);await pai(aluno);
    await admin('post',`/api/auth/alunos/${aluno.id}/convite`).expect(201);
    const usuario=(await repo.list('Usuario')).find(u=>u.alunoId===aluno.id)!;const token=await sessao(usuario.id,'s'.repeat(43));
    await admin('put',`/api/alunos/${aluno.id}/familia`).send({possuiCelular:false,responsavel}).expect(200);
    assert.equal((await repo.list('Sessao')).some(s=>s.usuarioId===usuario.id),false);assert.equal((await repo.get('Usuario',usuario.id))!.conviteHash,null);
    await call(token,'get','/api/portal').expect(401);
  });
  it('trocar responsável revoga acesso ao dependente anterior preservando os demais filhos',async()=>{
    const a=await cadastrar('Ana'),b=await cadastrar('Bia'),token=await pai(a);
    await admin('put',`/api/alunos/${a.id}/familia`).send({possuiCelular:false,responsavel:{...responsavel,email:'novo@teste.invalid'}}).expect(200);
    await call(token,'get',`/api/responsavel/${a.id}/portal`).expect(403);
    await call(token,'get',`/api/responsavel/${b.id}/portal`).expect(200);
    assert.equal((await repo.list('ResponsavelAluno')).filter(v=>v.alunoId===a.id).length,2);
  });
  it('bloqueia acesso parental aos 18, transfere responsabilidade e guarda contato ou arquiva',async()=>{
    const aluno=await cadastrar(),irma=await cadastrar('Irmã'),token=await pai(aluno);
    const [ano,mes,dia]=today().split('-');await repo.update('Aluno',aluno.id,{dataNascimento:`${Number(ano)-18}-${mes}-${dia}`});
    await call(token,'get',`/api/responsavel/${aluno.id}/portal`).expect(403);
    const r=await admin('post',`/api/alunos/${aluno.id}/familia/transferir`).send({email:'adulto@teste.invalid',telefone:'11900000002',maioridade:true,manterContato:true}).expect(201);
    const ficha=await admin('get',`/api/alunos/${aluno.id}/familia`).expect(200);const dados=ficha.body as ControleParental;
    assert.equal(dados.responsaveis[0].tipoVinculo,'contato');assert.ok(dados.aluno.responsabilidadeTransferidaEm);assert.equal(dados.eventos[0].tipo,'transferencia_maioridade');
    await call(token,'get',`/api/responsavel/${irma.id}/portal`).expect(200);
    await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({token:r.body.token,senha}).expect(200);
    await admin('post',`/api/alunos/${aluno.id}/familia/transferir`).send({email:'adulto@teste.invalid',telefone:'11900000002',maioridade:true,manterContato:false}).expect(201);
    assert.equal((await repo.list('ResponsavelAluno')).find(v=>v.alunoId===aluno.id)!.tipoVinculo,'arquivado');
  });
  it('aviso e autorização chegam apenas ao destinatário e resposta fica registrada uma única vez',async()=>{
    const aluno=await cadastrar(),outro=await cadastrar('Outro',false,'outro@teste.invalid'),token=await pai(aluno),outroToken=await pai(outro,'o'.repeat(43));
    const c=await admin('post',`/api/alunos/${aluno.id}/comunicados`).send({destino:'principal',tipo:'autorizacao',titulo:'Participação',mensagem:'Autoriza participar do evento da academia?'}).expect(201);
    const path=`/api/responsavel/${aluno.id}/portal`;
    const inbox=await call(token,'get',path+'/comunicados').expect(200);assert.equal(inbox.body[0].id,c.body.id);
    const outra=await call(outroToken,'get',`/api/responsavel/${outro.id}/portal/comunicados`).expect(200);assert.equal(outra.body.length,0);
    await call(outroToken,'put',`/api/responsavel/${outro.id}/portal/comunicados/${c.body.id}/resposta`).send({resposta:'aceito'}).expect(404);
    await call(token,'put',path+`/comunicados/${c.body.id}/resposta`).send({resposta:'ciente'}).expect(400);
    const resposta=await call(token,'put',path+`/comunicados/${c.body.id}/resposta`).send({resposta:'aceito'}).expect(200);
    const repetida=await call(token,'put',path+`/comunicados/${c.body.id}/resposta`).send({resposta:'aceito'}).expect(200);assert.equal(resposta.body.respondidoEm,repetida.body.respondidoEm);
    await call(token,'put',path+`/comunicados/${c.body.id}/resposta`).send({resposta:'recusado'}).expect(409);
    const historico=await admin('get',`/api/alunos/${aluno.id}/comunicados`).expect(200);assert.equal(historico.body[0].resposta,'aceito');
    const aviso=await admin('post',`/api/alunos/${aluno.id}/comunicados`).send({destino:'responsavel',tipo:'aviso',titulo:'Recesso',mensagem:'Não haverá aula no feriado.'}).expect(201);
    await call(token,'put',path+`/comunicados/${aviso.body.id}/resposta`).send({resposta:'ciente'}).expect(200);
  });
  it('mantém débitos acessíveis mas bloqueia novos check-ins por atraso do dependente',async()=>{
    const aluno=await cadastrar(),token=await pai(aluno),a=await aula();
    await repo.insert('Mensalidade',{id:randomUUID(),alunoId:aluno.id,competencia:'2020-01',valorCentavos:10000,dataVencimento:'2020-01-10',dataPagamento:null,criadoEm:new Date().toISOString()});
    const path=`/api/responsavel/${aluno.id}/portal`;
    assert.equal((await call(token,'get',path).expect(200)).body.bloqueado,true);
    await call(token,'get',path+'/debitos').expect(200);await call(token,'get',path+'/comunicados').expect(200);
    await call(token,'put',path+`/aulas/${a.id}/checkin`).send({}).expect(403);
  });
  it('valida maioridade no aniversário e no dia anterior sem depender de hora UTC',()=>{
    assert.equal(menorDeIdade({dataNascimento:'2008-10-26'},'2026-10-25'),true);
    assert.equal(menorDeIdade({dataNascimento:'2008-10-26'},'2026-10-26'),false);
  });
  it('a gravação de resposta revalida vínculo e maioridade dentro da transação',async()=>{
    const aluno=await cadastrar();await pai(aluno);const vinculo=(await repo.list('ResponsavelAluno'))[0];
    const c=await repo.insert('ComunicadoAluno',{id:randomUUID(),alunoId:aluno.id,destinatarioId:vinculo.usuarioId,autorId:ADMIN_INICIAL_ID,tipo:'autorizacao',titulo:'Teste de acesso',mensagem:'Confirmação de teste',resposta:null,respondidoEm:null,criadoEm:new Date().toISOString()});
    await repo.update('ResponsavelAluno',vinculo.id,{tipoVinculo:'arquivado'});
    await assert.rejects(repo.responderComunicado(c.id,vinculo.usuarioId,'aceito',new Date().toISOString()),/dependente não está disponível/);
    await repo.update('ResponsavelAluno',vinculo.id,{tipoVinculo:'responsavel'});await repo.update('Aluno',aluno.id,{dataNascimento:'2000-01-01'});
    await assert.rejects(repo.responderComunicado(c.id,vinculo.usuarioId,'aceito',new Date().toISOString()),/dependente não está disponível/);
    assert.equal((await repo.get('ComunicadoAluno',c.id))!.resposta,null);
  });
  it('uma falha ao registrar auditoria desfaz aluno, usuário e vínculo criados juntos',async()=>{
    const id=randomUUID(),novoAluno:Aluno={id,nome:'Cadastro revertido',email:`sem-email-${id}@cadastro.invalid`,telefone:'',dataNascimento:'2014-01-01',dataMatricula:'2020-01-01',faixa:'Branca',situacao:'ativo',criadoEm:new Date().toISOString()};
    await assert.rejects(repo.saveFamilia({tipo:'vincular',alunoId:id,autorId:randomUUID(),timestamp:new Date().toISOString(),novoAluno,input:{possuiCelular:false,responsavel}}),/FOREIGN KEY/);
    assert.equal(await repo.get('Aluno',id),null);assert.equal((await repo.list('Usuario')).some(u=>u.email===responsavel.email),false);assert.equal((await repo.list('ResponsavelAluno')).length,0);
    assert.equal(repo.db.prepare('PRAGMA foreign_keys').get()!.foreign_keys,1);
  });
});
