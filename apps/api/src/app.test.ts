import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from './app.js';
import { SqliteRepository } from './repository.js';
import { currentMonth, today, dateAt } from './domain.js';
const student={nome:'João Silva',telefone:'11999991234',email:'joao@example.com',dataNascimento:'2000-01-10',faixa:'Branca',dataMatricula:'2026-01-01',situacao:'ativo'};
describe('API e banco SQL',()=>{
  let repo:SqliteRepository;let app:ReturnType<typeof createApp>;
  beforeEach(()=>{repo=new SqliteRepository(':memory:');app=createApp(repo,{apiKey:'',analyticsUrl:'http://127.0.0.1:1'});});
  afterEach(async()=>{await repo.close();});
  const createStudent=async()=>{const r=await request(app).post('/api/alunos').send(student).expect(201);return r.body;};
  const createBilling=(alunoId:string,changes:Record<string,unknown>={})=>request(app).post('/api/mensalidades').send({alunoId,competencia:currentMonth(),valorCentavos:15000,dataVencimento:dateAt(-1,10),dataPagamento:null,...changes});
  it('cadastra, pesquisa ignorando acento e edita aluno',async()=>{
    const a=await createStudent();assert.ok(a.id);
    const search=await request(app).get('/api/alunos?q=joao').expect(200);assert.equal(search.body.length,1);
    await request(app).put('/api/alunos/'+a.id).send({...student,nome:'João Atualizado',situacao:'inativo'}).expect(200);
    const result=await request(app).get('/api/alunos?situacao=inativo').expect(200);assert.equal(result.body[0].nome,'João Atualizado');
  });
  it('rejeita data inexistente, nascimento futuro e telefone inválido',async()=>{
    await request(app).post('/api/alunos').send({...student,dataNascimento:'2000-02-30'}).expect(400);
    await request(app).post('/api/alunos').send({...student,dataNascimento:'2099-01-01'}).expect(400);
    await request(app).post('/api/alunos').send({...student,telefone:'123'}).expect(400);
    assert.equal((await repo.list('Aluno')).length,0);
  });
  it('normaliza e-mail e impede duplicidade',async()=>{
    await createStudent();await request(app).post('/api/alunos').send({...student,email:'JOAO@example.com'}).expect(409);
  });
  it('exclui aluno sem cobrança e devolve 404 depois',async()=>{
    const a=await createStudent();await request(app).delete('/api/alunos/'+a.id).expect(204);await request(app).get('/api/alunos/'+a.id).expect(404);
  });
  it('protege histórico financeiro ao excluir aluno',async()=>{
    const a=await createStudent();await createBilling(a.id).expect(201);await request(app).delete('/api/alunos/'+a.id).expect(409);assert.equal((await repo.list('Aluno')).length,1);
  });
  it('rejeita cobrança com vínculo inexistente e valor fracionado em centavos',async()=>{
    await createBilling(randomUUID()).expect(400);const a=await createStudent();await createBilling(a.id,{valorCentavos:15.5}).expect(400);await createBilling(a.id,{valorCentavos:0}).expect(400);
  });
  it('impede cobrança duplicada por aluno e competência',async()=>{
    const a=await createStudent();await createBilling(a.id).expect(201);await createBilling(a.id).expect(409);
  });
  it('vencer hoje é pendente e pagamento transforma atraso em pago',async()=>{
    const a=await createStudent();await createBilling(a.id,{dataVencimento:today()}).expect(201);let list=await request(app).get('/api/mensalidades').expect(200);assert.equal(list.body[0].status,'pendente');
    const id=list.body[0].id;await request(app).put('/api/mensalidades/'+id).send({alunoId:a.id,competencia:currentMonth(),valorCentavos:15000,dataVencimento:dateAt(-1,10),dataPagamento:null}).expect(200);
    list=await request(app).get('/api/mensalidades').expect(200);assert.equal(list.body[0].status,'atrasado');
    await request(app).patch('/api/mensalidades/'+id+'/pagamento').send({dataPagamento:today()}).expect(200);
    list=await request(app).get('/api/mensalidades').expect(200);assert.equal(list.body[0].status,'pago');
    const dash=await request(app).get('/api/dashboard?mes='+currentMonth()).expect(200);assert.equal(dash.body.recebidoCentavos,15000);
  });
  it('atualiza a chamada sem duplicar presença',async()=>{
    const a=await createStudent();const payload={alunoId:a.id,dataTreino:today(),tipoTreino:'Com kimono',presente:true};await request(app).put('/api/presencas').send(payload).expect(201);await request(app).put('/api/presencas').send({...payload,presente:false}).expect(200);const list=await request(app).get('/api/presencas').expect(200);assert.equal(list.body.length,1);assert.equal(list.body[0].presente,false);
  });
  it('não simula IA quando falta uma chave',async()=>{
    await request(app).post('/api/assistente').send({pergunta:'Como está a academia?',mes:currentMonth()}).expect(503);assert.equal((await repo.list('Analise')).length,0);
  });
  it('retorna 404 para identificadores e rotas desconhecidos',async()=>{
    await request(app).get('/api/alunos/nao-e-uuid').expect(404);await request(app).get('/api/inexistente').expect(404);
  });
});
it('mantém dados após fechar e reabrir o banco local',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'tatame-test-'));const file=join(dir,'db.sqlite');let repo=new SqliteRepository(file);
  try {const id=randomUUID();await repo.insert('Aluno',{...student,faixa:'Branca',situacao:'ativo',id,criadoEm:new Date().toISOString()});await repo.close();repo=new SqliteRepository(file);assert.equal((await repo.get('Aluno',id))?.nome,'João Silva');}
  finally{await repo.close();for(const suffix of ['', '-wal','-shm'])if(existsSync(file+suffix))unlinkSync(file+suffix);rmdirSync(dir);}
});
