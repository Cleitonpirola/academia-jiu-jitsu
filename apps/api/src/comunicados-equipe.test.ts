import {it} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import supertest from 'supertest';
import {SqliteRepository} from './repository.js';
import {createApp,request} from './test-auth-helper.js';
import {tokenHash} from './modules/auth/password.js';
import {ADMIN_INICIAL_ID} from './modules/auth/routes.js';
import {destinatariosEquipe} from './modules/comunicados/equipe.js';
import type {Aluno} from '@tatame/shared';
const now=new Date().toISOString();
async function fixture(){
 const repo=new SqliteRepository(':memory:'),app=createApp(repo);
 const alunos:Aluno[]=[];
 for(const nome of ['Ana','Bia','Sem acesso','Inativo']){
  const a=(await request(app).post('/api/alunos').send({nome,telefone:'11900000000',email:nome.replace(' ','')+'@teste.invalid',dataNascimento:'2000-01-01',dataMatricula:'2020-01-01',situacao:nome==='Inativo'?'inativo':'ativo'}).expect(201)).body;alunos.push(a);
  if(nome==='Sem acesso')continue;
  const id=randomUUID();await repo.insert('Usuario',{id,nome,email:a.email,perfil:'aluno',alunoId:a.id,senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now});
  if(nome==='Ana')await repo.insert('Sessao',{id:randomUUID(),usuarioId:id,tokenHash:tokenHash('a'.repeat(43)),credencialHash:tokenHash('fixture'),expiraEm:'2099-01-01',criadoEm:now});
 }
 return {repo,app,alunos};
}
it('exclusão administrativa retira um comunicado individual ou o lote completo sem afetar os demais',async()=>{
 const {repo,app,alunos}=await fixture();try{
  const [ana,bia]=alunos;
  const loteId=randomUUID();
  const loteUrl=`/api/comunicados/lotes/${loteId}`;
  const anaUrl=`/api/alunos/${ana.id}/comunicados`;
  await request(app).post('/api/comunicados/lotes').send({id:loteId,tipo:'aviso',titulo:'Treino coletivo',mensagem:'Mensagem para a equipe.'}).expect(201);
  const coletivo=(await repo.list('ComunicadoAluno')).find(item=>item.alunoId===ana.id)!;
  const individual=(await request(app).post(anaUrl).send({destino:'principal',tipo:'aviso',titulo:'Treino individual',mensagem:'Mensagem para a aluna.'}).expect(201)).body;
  const preservado=(await request(app).post(anaUrl).send({destino:'principal',tipo:'aviso',titulo:'Comunicado mantido',mensagem:'Outra mensagem para a aluna.'}).expect(201)).body;
  const aluno=supertest(app),cookie='tatame_sessao='+'a'.repeat(43);
  for(const path of [loteUrl,`${anaUrl}/${individual.id}`]){
   await aluno.delete(path).set('Cookie',cookie).set('X-Tatame-Request','1').expect(403);
  }
  await request(app).delete(`/api/alunos/${bia.id}/comunicados/${individual.id}`).expect(404);
  await request(app).delete(`${anaUrl}/${individual.id}`).expect(204);
  await request(app).delete(`${anaUrl}/${coletivo.id}`).expect(204);
  const lotes=(await request(app).get('/api/comunicados/lotes').expect(200)).body;
  assert.equal(lotes[0].entregas.length,1);
  assert.equal(lotes[0].entregas[0].nome,bia.nome);

  repo.db.exec(`CREATE TRIGGER bloquear_exclusao_comunicado BEFORE DELETE ON ComunicadoAluno BEGIN SELECT RAISE(ABORT,'falha de teste'); END`);
  await request(app).delete(loteUrl).expect(500);
  assert.equal((await repo.list('EntregaComunicado')).length,1);
  assert.ok(await repo.get('LoteComunicado',loteId));
  repo.db.exec('DROP TRIGGER bloquear_exclusao_comunicado');
  await request(app).delete(loteUrl).expect(204);
  assert.equal((await repo.list('EntregaComunicado')).length,0);
  assert.equal((await repo.list('LoteComunicado')).length,0);
  assert.deepEqual((await repo.list('ComunicadoAluno')).map(item=>item.id),[preservado.id]);
  const inbox=(await aluno.get('/api/portal/comunicados').set('Cookie',cookie).expect(200)).body;
  assert.deepEqual(inbox.map((item:{id:string})=>item.id),[preservado.id]);
 }finally{await repo.close();}
});

it('envio coletivo é atômico, idempotente e mantém confirmação independente em cada perfil',async()=>{
 const {repo,app}=await fixture();try{
  const input={id:randomUUID(),tipo:'aviso',titulo:'Aviso fictício',mensagem:'Treino da equipe de teste.'};
  const preview=(await request(app).get('/api/comunicados/destinatarios').expect(200)).body;
  assert.equal(preview.destinatarios.length,2);assert.equal(preview.naoEnviados.length,1);
  const enviados=await Promise.all([request(app).post('/api/comunicados/lotes').send(input).expect(201),request(app).post('/api/comunicados/lotes').send(input).expect(201)]);
  assert.equal(enviados[0].body.id,enviados[1].body.id);assert.equal((await repo.list('LoteComunicado')).length,1);assert.equal((await repo.list('ComunicadoAluno')).length,2);
  await request(app).post('/api/comunicados/lotes').send({...input,mensagem:'Mudou a mensagem'}).expect(409);
  const aluno=supertest(app),cookie='tatame_sessao='+'a'.repeat(43);
  const mensagens=(await aluno.get('/api/portal/comunicados').set('Cookie',cookie).expect(200)).body;assert.equal(mensagens.length,1);
  await aluno.put('/api/portal/comunicados/'+mensagens[0].id+'/resposta').set('Cookie',cookie).set('X-Tatame-Request','1').send({resposta:'ciente'}).expect(200);
  const lote=(await request(app).get('/api/comunicados/lotes').expect(200)).body[0];assert.equal(lote.entregas.filter((e:{resposta:string})=>e.resposta==='ciente').length,1);assert.equal(lote.entregas.filter((e:{resposta:string})=>!e.resposta).length,1);
  for(const path of ['/api/comunicados/lotes','/api/comunicados/destinatarios'])await aluno.get(path).set('Cookie',cookie).expect(403);
  await aluno.post('/api/comunicados/lotes').set('Cookie',cookie).set('X-Tatame-Request','1').send({...input,id:randomUUID()}).expect(403);
 }finally{await repo.close();}
});
it('falha na segunda entrega desfaz lote e todas as mensagens, permitindo tentar de novo',async()=>{
 const {repo,app}=await fixture();try{
  repo.db.exec(`CREATE TRIGGER falha_entrega BEFORE INSERT ON EntregaComunicado WHEN NEW.nome='Bia' BEGIN SELECT RAISE(ABORT,'falha controlada'); END;`);
  const input={id:randomUUID(),tipo:'autorizacao' as const,titulo:'Autorização de teste',mensagem:'Mensagem de teste'};
  await assert.rejects(repo.saveComunicadoEquipe(input,ADMIN_INICIAL_ID,now),/falha controlada/);
  assert.equal((await repo.list('ComunicadoAluno')).length,0);assert.equal((await repo.list('LoteComunicado')).length,0);assert.equal((await repo.list('EntregaComunicado')).length,0);
  repo.db.exec('DROP TRIGGER falha_entrega');await request(app).post('/api/comunicados/lotes').send(input).expect(201);assert.equal((await repo.list('EntregaComunicado')).length,2);
 }finally{await repo.close();}
});
it('menor sem celular recebe no responsável; maioridade e ausência de vínculo não são entregas falsas',async()=>{
 const {repo,alunos}=await fixture();try{
  const pai={id:randomUUID(),nome:'Responsável',email:'pai@teste.invalid',perfil:'responsavel' as const,alunoId:null,senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now};
  const a={...alunos[0],dataNascimento:'2015-01-01',acessoPrincipal:'responsavel' as const};
  const vinculo={id:randomUUID(),alunoId:a.id,usuarioId:pai.id,telefone:'11900000000',parentesco:'pai',tipoVinculo:'responsavel' as const,criadoEm:now,atualizadoEm:now};
  let p=destinatariosEquipe({alunos:[a],usuarios:[pai],vinculos:[vinculo]});assert.equal(p.destinatarios[0].destinatarioId,pai.id);
  p=destinatariosEquipe({alunos:[a],usuarios:[pai],vinculos:[]});assert.equal(p.destinatarios.length,0);assert.equal(p.naoEnviados.length,1);
  p=destinatariosEquipe({alunos:[{...a,dataNascimento:'2000-01-01'}],usuarios:[pai],vinculos:[vinculo]});assert.equal(p.destinatarios.length,0);
 }finally{await repo.close();}
});
