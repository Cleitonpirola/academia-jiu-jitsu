import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Aluno } from '@tatame/shared';
import { SqliteRepository } from './repository.js';
import { createApp } from './test-auth-helper.js';
import { hashPassword, tokenHash } from './modules/auth/password.js';
import { today } from './domain.js';

const senha='frase ficticia somente para teste',hash=await hashPassword(senha),token='p'.repeat(43),outroToken='q'.repeat(43);
describe('Edição dos dados básicos pelo próprio aluno',()=>{
  let repo:SqliteRepository,app:ReturnType<typeof createApp>,aluno:Aluno,outro:Aluno,usuarioId:string,sessaoId:string;
  const get=(path='/api/portal/perfil',cookie=token)=>request(app).get(path).set('Cookie','tatame_sessao='+cookie);
  const put=(body:Record<string,unknown>,path='/api/portal/perfil',cookie=token)=>request(app).put(path).set('Cookie','tatame_sessao='+cookie).set('X-Tatame-Request','1').send(body);
  const dados=()=>({nome:aluno.nome,telefone:aluno.telefone,email:aluno.email});
  beforeEach(async()=>{
    repo=new SqliteRepository(':memory:');app=createApp(repo);usuarioId=randomUUID();sessaoId=randomUUID();
    const novo=(nome:string):Aluno=>({id:randomUUID(),nome,telefone:'11900000000',email:nome.toLowerCase()+'@teste.invalid',dataNascimento:'2000-01-01',dataMatricula:'2020-01-01',faixa:'Branca',situacao:'ativo',criadoEm:new Date().toISOString()});
    aluno=novo('Ana');outro=novo('Bia');await repo.insert('Aluno',aluno);await repo.insert('Aluno',outro);
    await repo.insert('Usuario',{id:usuarioId,nome:aluno.nome,email:aluno.email,perfil:'aluno',alunoId:aluno.id,senhaHash:hash,conviteHash:tokenHash('i'.repeat(43)),conviteExpiraEm:'2099-01-01T00:00:00.000Z',criadoEm:new Date().toISOString()});
    for(const [id,t] of [[sessaoId,token],[randomUUID(),outroToken]])await repo.insert('Sessao',{id,usuarioId,tokenHash:tokenHash(t),credencialHash:tokenHash(hash),expiraEm:'2099-01-01T00:00:00.000Z',criadoEm:new Date().toISOString()});
  });
  afterEach(()=>repo.close());
  it('consulta apenas o perfil autenticado sem devolver segredos da conta',async()=>{
    const r=await get().expect(200);assert.equal(r.body.id,aluno.id);assert.equal(r.body.email,aluno.email);assert.equal(r.body.senhaHash,undefined);assert.equal(r.body.conviteHash,undefined);
    await get('/api/portal/perfil/'+outro.id).expect(403);
  });
  it('salva nome e telefone sem senha, sincroniza usuário e preserva histórico e vínculos',async()=>{
    const aulaId=randomUUID(),now=new Date().toISOString();await repo.createAula({id:aulaId,titulo:'Aula preservada',dataAula:today(),horaInicio:'12:00',horaFim:'13:00',professor:'Professor',origem:'extra',origemHorarioId:null,turmaId:null,turmaNome:null,situacao:'agendada',motivoCancelamento:null,canceladaEm:null,criadoEm:now},[]);
    const checkin=await repo.saveCheckin(aulaId,aluno.id,now);await repo.saveSaldoMensalAluno(aluno.id,4);const saldo=(await repo.get('Aluno',aluno.id))!.aulasRestantesMes;
    const r=await put({...dados(),nome:'  Ana Silva  ',telefone:'(11) 98888-7777'}).expect(200);
    assert.equal(r.body.nome,'Ana Silva');assert.equal(r.body.id,aluno.id);assert.equal(r.body.faixa,'Branca');assert.equal(r.body.aulasRestantesMes,saldo);
    const u=await repo.get('Usuario',usuarioId);assert.equal(u!.nome,'Ana Silva');assert.equal(u!.senhaHash,hash);assert.ok(u!.conviteHash);assert.equal((await repo.list('Sessao')).filter(s=>s.usuarioId===usuarioId).length,2);assert.deepEqual(await repo.get('CheckinAula',checkin.id),checkin);
    const audit=(await repo.list('EventoAcessoAluno'))[0];assert.equal(audit.usuarioId,usuarioId);assert.equal(audit.tipo,'perfil_basico_atualizado');assert.deepEqual(JSON.parse(audit.detalhes),{campos:['nome','telefone'],emailAlterado:false});assert.equal((await repo.get('Aluno',outro.id))!.nome,outro.nome);
  });
  it('exige a senha atual para trocar o e-mail e não altera dados em caso de erro',async()=>{
    await put({...dados(),email:'novo@teste.invalid'}).expect(400);
    await put({...dados(),email:'novo@teste.invalid',senhaAtual:'senha incorreta'}).expect(400);
    assert.equal((await repo.get('Aluno',aluno.id))!.email,aluno.email);assert.equal((await repo.get('Usuario',usuarioId))!.email,aluno.email);assert.equal((await repo.list('EventoAcessoAluno')).length,0);
    await get().expect(200);
  });
  it('troca e-mail nas duas entidades, invalida convite e outras sessões, mantendo a sessão atual',async()=>{
    const r=await put({...dados(),email:'  NOVO@teste.invalid  ',senhaAtual:senha}).expect(200);assert.equal(r.body.email,'novo@teste.invalid');
    const user=await repo.get('Usuario',usuarioId);assert.equal(user!.email,'novo@teste.invalid');assert.equal(user!.senhaHash,hash);assert.equal(user!.conviteHash,null);assert.equal(user!.conviteExpiraEm,null);
    assert.deepEqual((await repo.list('Sessao')).filter(s=>s.usuarioId===usuarioId).map(s=>s.id),[sessaoId]);await get().expect(200);await get('/api/portal/perfil',outroToken).expect(401);
    await request(app).post('/api/auth/entrar').set('X-Tatame-Request','1').send({email:aluno.email,senha}).expect(401);
    const login=await request(app).post('/api/auth/entrar').set('X-Tatame-Request','1').send({email:'novo@teste.invalid',senha}).expect(200);assert.equal(login.body.usuario.id,usuarioId);
  });
  it('não exige senha nem revoga sessões por diferenças só de maiúsculas ou espaços no e-mail',async()=>{
    await put({...dados(),email:' ANA@teste.invalid '}).expect(200);assert.equal((await repo.list('Sessao')).filter(s=>s.usuarioId===usuarioId).length,2);assert.equal((await repo.list('EventoAcessoAluno')).length,0);
  });
  it('recusa e-mail de outro aluno ou de uma conta administrativa, sem alteração parcial',async()=>{
    for(const email of [outro.email.toUpperCase(),'admin@teste.invalid'])await put({...dados(),nome:'Nome que não será gravado',email,senhaAtual:senha}).expect(409);
    assert.equal((await repo.get('Aluno',aluno.id))!.nome,aluno.nome);assert.equal((await repo.get('Usuario',usuarioId))!.email,aluno.email);
  });
  it('recusa campos administrativos e dados inválidos',async()=>{
    for(const extra of [{alunoId:outro.id},{perfil:'admin'},{faixa:'Preta'},{situacao:'inativo'},{limiteAulasMensal:100},{senhaHash:'forjada'}])await put({...dados(),...extra}).expect(400);
    for(const extra of [{nome:' '},{telefone:'123'},{email:'invalido'},{email:'qualquer@cadastro.invalid'}])await put({...dados(),...extra}).expect(400);
    assert.equal((await repo.get('Aluno',aluno.id))!.nome,aluno.nome);
  });
  it('recusa visitante, administração e responsável, inclusive pelo portal do dependente',async()=>{
    await request(app).put('/api/portal/perfil').set('X-Tatame-Request','1').send(dados()).expect(401);
    await put(dados(),'/api/portal/perfil','t'.repeat(43)).expect(403);
    await repo.update('Usuario',usuarioId,{perfil:'responsavel',alunoId:null});await repo.update('Aluno',aluno.id,{dataNascimento:'2014-01-01',possuiCelular:false,acessoPrincipal:'responsavel'});
    await repo.insert('ResponsavelAluno',{id:randomUUID(),alunoId:aluno.id,usuarioId,telefone:'11900000000',parentesco:'Pai',tipoVinculo:'responsavel',criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()});
    await put(dados()).expect(403);await put(dados(),`/api/responsavel/${aluno.id}/portal/perfil`).expect(403);
  });
  it('permite consultar e corrigir contato mesmo com bloqueio financeiro',async()=>{
    await repo.insert('Mensalidade',{id:randomUUID(),alunoId:aluno.id,competencia:'2020-01',valorCentavos:10000,dataVencimento:'2020-01-10',dataPagamento:null,criadoEm:new Date().toISOString()});
    assert.equal((await get('/api/portal').expect(200)).body.bloqueado,true);await get().expect(200);await put({...dados(),telefone:'11911111111'}).expect(200);
  });
  it('revalida acesso principal, sessão e prova de senha dentro da transação',async()=>{
    await repo.update('Aluno',aluno.id,{acessoPrincipal:'responsavel'});await assert.rejects(repo.savePerfilAluno(usuarioId,sessaoId,dados()),/não está disponível/);
    await repo.update('Aluno',aluno.id,{acessoPrincipal:'aluno'});await assert.rejects(repo.savePerfilAluno(usuarioId,sessaoId,{...dados(),email:'novo@teste.invalid'},'hash-antigo'),/conta mudou/);
    await repo.update('Sessao',sessaoId,{expiraEm:'2000-01-01T00:00:00.000Z'});await assert.rejects(repo.savePerfilAluno(usuarioId,sessaoId,dados()),/sessão terminou/);
    assert.equal((await repo.get('Aluno',aluno.id))!.email,aluno.email);
  });
  it('desfaz cadastro, usuário, convite e revogação de sessões se a auditoria falhar',async()=>{
    repo.db.exec("CREATE TRIGGER FalhaPerfil BEFORE INSERT ON EventoAcessoAluno BEGIN SELECT RAISE(ABORT,'falha de auditoria simulada'); END;");
    await assert.rejects(repo.savePerfilAluno(usuarioId,sessaoId,{...dados(),nome:'Nome revertido',email:'novo@teste.invalid'},hash),/falha de auditoria/);
    assert.equal((await repo.get('Aluno',aluno.id))!.nome,aluno.nome);const user=await repo.get('Usuario',usuarioId);assert.equal(user!.email,aluno.email);assert.ok(user!.conviteHash);assert.equal((await repo.list('Sessao')).filter(s=>s.usuarioId===usuarioId).length,2);assert.equal((await repo.list('EventoAcessoAluno')).length,0);
  });
  it('limita tentativas de confirmar senha sem bloquear edição de nome e telefone',async()=>{
    for(let i=0;i<10;i++)await put({...dados(),email:'novo@teste.invalid',senhaAtual:'senha incorreta'}).expect(400);
    await put({...dados(),email:'novo@teste.invalid',senhaAtual:senha}).expect(429);
    await put({...dados(),nome:'Ana depois das tentativas'}).expect(200);
  });
});
