import { it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import supertest from 'supertest';
import type { Aula } from '@tatame/shared';
import { createApp, request } from './test-auth-helper.js';
import { SqliteRepository } from './repository.js';
import { ADMIN_INICIAL_ID, COOKIE } from './modules/auth/routes.js';
import { tokenHash } from './modules/auth/password.js';
import { today } from './domain.js';

const now=()=>new Date().toISOString();
const addDays=(days:number)=>{const d=new Date(today()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
async function fixture(configured=true,exhausted=true){
  const repo=new SqliteRepository(':memory:'),app=createApp(repo),id=randomUUID(),user=randomUUID(),token='d'.repeat(43);
  await repo.insert('Aluno',{id,nome:'Aluno Débito Fictício',telefone:'11900000000',email:'debito@teste.invalid',dataNascimento:'2000-01-01',dataMatricula:'2020-01-01',faixa:'Branca',situacao:'ativo',criadoEm:now()});
  await repo.insert('Usuario',{id:user,nome:'Aluno',email:'debito@teste.invalid',perfil:'aluno',alunoId:id,senhaHash:'fixture-debito',conviteHash:null,conviteExpiraEm:null,criadoEm:now()});
  await repo.insert('Sessao',{id:randomUUID(),usuarioId:user,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture-debito'),expiraEm:'2099-01-01T00:00:00.000Z',criadoEm:now()});
  const future=addDays(1).slice(0,7)===today().slice(0,7)?addDays(1):today();
  const aulas:Array<Aula>=[today(),today(),future,today()].map((dataAula,index)=>({id:randomUUID(),titulo:'Treino de débito '+index,dataAula,horaInicio:'12:00',horaFim:'13:00',professor:'Mestre',origem:'grade',origemHorarioId:randomUUID(),turmaId:null,turmaNome:null,situacao:'agendada',motivoCancelamento:null,canceladaEm:null,criadoEm:now()}));
  for(const aula of aulas)await repo.insert('Aula',aula);await repo.saveSaldoMensalAluno(id,1);
  if(configured)await repo.saveConfiguracaoAdicionais({valorAulaAdicionalCentavos:2500,prazoPagamentoDias:3},ADMIN_INICIAL_ID,now());
  if(exhausted)await repo.saveCheckin(aulas[0].id,id,now());
  const post=(index=1,body:Record<string,unknown>={confirmo:true,valorEsperadoCentavos:2500,prazoEsperadoDias:3})=>supertest(app).post(`/api/portal/aulas/${aulas[index].id}/adicional`).set('Cookie',`${COOKIE}=${token}`).set('X-Tatame-Request','1').send(body);
  const get=(path='/api/portal')=>supertest(app).get(path).set('Cookie',`${COOKIE}=${token}`);
  const check=(index=1)=>supertest(app).put(`/api/portal/aulas/${aulas[index].id}/checkin`).set('Cookie',`${COOKIE}=${token}`).set('X-Tatame-Request','1').send({});
  return{repo,app,id,user,token,aulas,post,get,check};
}
it('nova aula adicional usa somente publicação por turma e não cria débito para avulsa legada',async()=>{
  const f=await fixture();try{await f.repo.update('Aula',f.aulas[1].id,{origem:'extra',origemHorarioId:null});await f.post().expect(409);assert.equal((await f.repo.list('DebitoAula')).length,0);}finally{await f.repo.close();}
});
it('reserva antiga de avulsa permanece idempotente e utilizável sem novo débito',async()=>{
  const f=await fixture();try{const d=(await f.post().expect(201)).body;await f.repo.update('Aula',f.aulas[1].id,{origem:'extra',origemHorarioId:null});assert.equal((await f.post().expect(201)).body.id,d.id);await f.check().expect(200);assert.equal((await f.repo.list('DebitoAula')).length,1);}finally{await f.repo.close();}
});
it('condições começam sem preço e prazo 3; somente administrador configura com valores válidos',async()=>{
  const f=await fixture(false);try{
    const defaults=await request(f.app).get('/api/debitos/configuracao').expect(200);assert.equal(defaults.body.valorAulaAdicionalCentavos,null);assert.equal(defaults.body.prazoPagamentoDias,3);
    await f.post().expect(409);assert.equal((await f.repo.list('DebitoAula')).length,0);
    await supertest(f.app).get('/api/debitos').expect(401);await f.get('/api/debitos').expect(403);
    await supertest(f.app).put('/api/debitos/configuracao').set('Cookie',`${COOKIE}=${f.token}`).set('X-Tatame-Request','1').send({valorAulaAdicionalCentavos:1,prazoPagamentoDias:1}).expect(403);
    for(const input of [{valorAulaAdicionalCentavos:0,prazoPagamentoDias:3},{valorAulaAdicionalCentavos:1.5,prazoPagamentoDias:3},{valorAulaAdicionalCentavos:2500,prazoPagamentoDias:0},{valorAulaAdicionalCentavos:2500,prazoPagamentoDias:91}])await request(f.app).put('/api/debitos/configuracao').send(input).expect(400);
    await request(f.app).put('/api/debitos/configuracao').send({valorAulaAdicionalCentavos:2500,prazoPagamentoDias:3}).expect(200);
    assert.equal((await f.repo.get('ConfiguracaoAcademia','principal'))!.atualizadoPorId,ADMIN_INICIAL_ID);
  }finally{await f.repo.close();}
});
it('confirmar cria débito completo imediatamente e repetição não cobra duas vezes',async()=>{
  const f=await fixture();try{
    const r=await f.post().expect(201),d=r.body;assert.equal(d.alunoId,f.id);assert.equal(d.aulaId,f.aulas[1].id);assert.equal(d.valorCentavos,2500);assert.equal(d.prazoPagamentoDias,3);assert.equal(d.dataVencimento,addDays(3));assert.equal(d.dataAula,f.aulas[1].dataAula);assert.ok(d.motivo);assert.ok(d.criadoEm);assert.equal(d.statusPagamento,'pendente');assert.equal(d.dataPagamento,null);
    assert.equal((await f.post().expect(201)).body.id,d.id);const list=await f.get('/api/portal/debitos').expect(200);assert.equal(list.body.length,1);assert.equal(list.body[0].id,d.id);
    assert.equal((await f.repo.list('CheckinAula')).length,1,'reservar não faz check-in futuro');
  }finally{await f.repo.close();}
});
it('confirmações concorrentes da mesma aula geram um único débito',async()=>{
  const f=await fixture();try{const aceite={valorEsperadoCentavos:2500,prazoEsperadoDias:3};const rows=await Promise.all([f.repo.confirmarAulaAdicional(f.id,f.aulas[1].id,aceite,now()),f.repo.confirmarAulaAdicional(f.id,f.aulas[1].id,aceite,now())]);assert.equal(rows[0].id,rows[1].id);assert.equal((await f.repo.list('DebitoAula')).length,1);}finally{await f.repo.close();}
});
it('aula adicional dispensa cotas daquela aula sem consumir outro crédito e mantém confirmação de presença separada',async()=>{
  const f=await fixture();try{
    await f.repo.savePlanoAluno(f.id,{nome:'Uma semanal',limiteSemanal:1},now());await f.post().expect(201);await f.check().expect(200);await f.check().expect(200);
    const p=await f.get().expect(200);assert.equal(p.body.saldoMensal.utilizadas,1);assert.equal(p.body.saldoMensal.adicionaisUtilizadas,1);assert.equal(p.body.saldoMensal.restantes,0);assert.equal(p.body.plano.utilizadas,1);assert.equal(p.body.plano.extrasUtilizadas,1);assert.equal((await f.repo.list('PresencaAula')).length,0);assert.equal((await f.repo.list('DebitoAula')).length,1);
  }finally{await f.repo.close();}
});
it('reserva futura mantém data escolhida mas não libera check-in antes do dia',async()=>{
  const f=await fixture();try{const r=await f.post(2).expect(201);assert.equal(r.body.dataAula,f.aulas[2].dataAula);if(f.aulas[2].dataAula>today())await f.check(2).expect(400);assert.equal((await f.repo.list('CheckinAula')).length,1);}finally{await f.repo.close();}
});
it('preço e prazo mudados exigem novo aceite e não alteram um débito já confirmado',async()=>{
  const f=await fixture();try{
    const original=(await f.post().expect(201)).body;
    await request(f.app).put('/api/debitos/configuracao').send({valorAulaAdicionalCentavos:3500,prazoPagamentoDias:5}).expect(200);
    await f.post(3).expect(409);assert.equal((await f.repo.list('DebitoAula')).length,1);
    const next=await f.post(3,{confirmo:true,valorEsperadoCentavos:3500,prazoEsperadoDias:5}).expect(201);assert.equal(next.body.dataVencimento,addDays(5));
    const stored=(await f.repo.get('DebitoAula',original.id))!;assert.equal(stored.valorCentavos,2500);assert.equal(stored.dataVencimento,original.dataVencimento);
  }finally{await f.repo.close();}
});
it('não cobra enquanto há aulas incluídas, no próximo mês com cota nova ou em plano ilimitado',async()=>{
  const f=await fixture(true,false);try{
    await f.post().expect(409);await f.repo.saveSaldoMensalAluno(f.id,null);await f.post().expect(409);
    await f.repo.saveSaldoMensalAluno(f.id,1);await f.repo.saveCheckin(f.aulas[0].id,f.id,now());await f.post(0).expect(409);
    await f.repo.update('Aula',f.aulas[1].id,{dataAula:addDays(-1)});await f.post().expect(409);
    await f.repo.update('Aula',f.aulas[1].id,{dataAula:today(),situacao:'cancelada',motivoCancelamento:'Fixture cancelada',canceladaEm:now()});await f.post().expect(409);
    await f.repo.update('Aula',f.aulas[1].id,{situacao:'agendada',motivoCancelamento:null,canceladaEm:null});
    const next=new Date(today()+'T12:00:00Z');next.setUTCMonth(next.getUTCMonth()+1,1);await f.repo.update('Aula',f.aulas[1].id,{dataAula:next.toISOString().slice(0,10)});await f.post().expect(409);assert.equal((await f.repo.list('DebitoAula')).length,0);
  }finally{await f.repo.close();}
});
it('cliente não forja aluno, valor, vencimento, status ou confirmação e aluno não dá baixa',async()=>{
  const f=await fixture();try{
    await f.post(1,{confirmo:false,valorEsperadoCentavos:2500,prazoEsperadoDias:3}).expect(400);
    await f.post(1,{confirmo:true,valorEsperadoCentavos:1,prazoEsperadoDias:3}).expect(409);
    for(const extra of [{alunoId:randomUUID()},{statusPagamento:'pago'},{dataVencimento:'2099-01-01'}])await f.post(1,{confirmo:true,valorEsperadoCentavos:2500,prazoEsperadoDias:3,...extra}).expect(400);
    const d=(await f.post().expect(201)).body;
    await supertest(f.app).patch('/api/debitos/'+d.id+'/pagamento').set('Cookie',`${COOKIE}=${f.token}`).set('X-Tatame-Request','1').send({dataPagamento:today()}).expect(403);
    const another=randomUUID();await f.repo.insert('Aluno',{id:another,nome:'Outro aluno',email:'outro@teste.invalid',telefone:'11900000001',dataNascimento:'2000-01-01',dataMatricula:'2020-01-01',faixa:'Branca',situacao:'ativo',criadoEm:now()});await f.repo.saveSaldoMensalAluno(another,1);await f.repo.saveCheckin(f.aulas[0].id,another,now());await f.repo.confirmarAulaAdicional(another,f.aulas[3].id,{valorEsperadoCentavos:2500,prazoEsperadoDias:3},now());
    const list=await f.get('/api/portal/debitos').expect(200);assert.equal(list.body.length,1);assert.ok(list.body.every((item:{alunoId:string})=>item.alunoId===f.id));assert.equal((await request(f.app).get('/api/debitos').expect(200)).body.length,2);
  }finally{await f.repo.close();}
});
it('débito vencido bloqueia novos check-ins e compras, mantém consulta e baixa manual libera',async()=>{
  const f=await fixture();try{
    const d=(await f.post().expect(201)).body;await f.repo.update('DebitoAula',d.id,{dataVencimento:addDays(-1)});
    await f.check().expect(403);await f.post(3).expect(403);assert.equal((await f.get().expect(200)).body.debitoVencido,true);await f.get('/api/portal/debitos').expect(200);
    const paid=await request(f.app).patch('/api/debitos/'+d.id+'/pagamento').send({dataPagamento:today()}).expect(200);assert.equal(paid.body.statusPagamento,'pago');assert.equal(paid.body.baixadoPorId,ADMIN_INICIAL_ID);assert.equal(paid.body.dataPagamento,today());
    await f.check().expect(200);assert.equal((await f.get().expect(200)).body.debitoVencido,false);
  }finally{await f.repo.close();}
});
it('vence hoje ainda permite check-in e mensalidade vencida não esconde menu Débitos',async()=>{
  const f=await fixture();try{
    const d=(await f.post().expect(201)).body;await f.repo.update('DebitoAula',d.id,{dataVencimento:today()});await f.check().expect(200);
    await f.repo.insert('Mensalidade',{id:randomUUID(),alunoId:f.id,competencia:'2020-01',valorCentavos:10000,dataVencimento:'2020-01-10',dataPagamento:null,criadoEm:now()});
    assert.equal((await f.get().expect(200)).body.bloqueado,true);assert.equal((await f.get('/api/portal/debitos').expect(200)).body.length,1);await f.post(3).expect(403);
  }finally{await f.repo.close();}
});
it('cancelar aula cancela pendências; pagamento já registrado fica preservado para acerto manual',async()=>{
  const f=await fixture();try{
    const a=(await f.post().expect(201)).body;await request(f.app).delete('/api/aulas/'+f.aulas[1].id).expect(404);await f.repo.cancelAula(f.aulas[1].id,'Cancelada pelo professor',now());
    const cancelled=(await f.repo.get('DebitoAula',a.id))!;assert.equal(cancelled.statusPagamento,'cancelado');assert.ok(cancelled.canceladoEm);await request(f.app).patch('/api/debitos/'+a.id+'/pagamento').send({dataPagamento:today()}).expect(409);await f.post().expect(409);
    const b=(await f.post(3).expect(201)).body;await request(f.app).patch('/api/debitos/'+b.id+'/pagamento').send({dataPagamento:today()}).expect(200);await f.repo.cancelAula(f.aulas[3].id,'Cancelamento depois de pago',now());const paid=(await f.repo.get('DebitoAula',b.id))!;assert.equal(paid.statusPagamento,'pago');assert.equal(paid.dataPagamento,today());assert.ok(paid.canceladoEm);assert.equal(paid.valorCentavos,2500);
    await assert.rejects(f.repo.remove('Aluno',f.id),/FOREIGN KEY/);
  }finally{await f.repo.close();}
});
it('baixa valida data e é idempotente, sem sobrescrever primeira data ou autor',async()=>{
  const f=await fixture();try{const d=(await f.post().expect(201)).body;await request(f.app).patch('/api/debitos/'+d.id+'/pagamento').send({dataPagamento:addDays(1)}).expect(400);await request(f.app).patch('/api/debitos/'+d.id+'/pagamento').send({dataPagamento:addDays(-1)}).expect(400);
    const first=await f.repo.baixarDebito(d.id,ADMIN_INICIAL_ID,today());const second=await f.repo.baixarDebito(d.id,f.user,addDays(-1));assert.deepEqual({...second},{...first});
  }finally{await f.repo.close();}
});
it('falha de gravação do débito não deixa reserva nem cobra ou altera saldo',async()=>{
  const f=await fixture();try{f.repo.db.exec("CREATE TRIGGER falha_debito BEFORE INSERT ON DebitoAula BEGIN SELECT RAISE(ABORT,'falha ficticia'); END;");await assert.rejects(f.repo.confirmarAulaAdicional(f.id,f.aulas[1].id,{valorEsperadoCentavos:2500,prazoEsperadoDias:3},now()),/falha ficticia/);assert.equal((await f.repo.list('DebitoAula')).length,0);assert.equal((await f.repo.list('CheckinAula')).length,1);assert.equal((await f.repo.get('Aluno',f.id))!.aulasRestantesMes,0);}finally{await f.repo.close();}
});
