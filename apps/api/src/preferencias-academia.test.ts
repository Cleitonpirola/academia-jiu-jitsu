import {it} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import supertest from 'supertest';
import {SqliteRepository} from './repository.js';
import {createApp,request} from './test-auth-helper.js';
import {migrateSqlite,sqliteMigrations} from './database/sqlite/migrate.js';
import {tokenHash} from './modules/auth/password.js';
import {today} from './domain.js';

it('preferência começa oculta e alternar não altera planos, saldos, débitos ou check-ins existentes',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const app=createApp(repo),now=new Date().toISOString();
  assert.equal((await request(app).get('/api/configuracoes/academia').expect(200)).body.exibirControlePlanos,false);
  const aluno=(await request(app).post('/api/alunos').send({nome:'Aluno limitado fictício',email:'limitado@teste.invalid',telefone:'11900000000',dataNascimento:'2000-01-01',dataMatricula:'2020-01-01',situacao:'ativo'}).expect(201)).body;
  await repo.savePlanoAluno(aluno.id,{nome:'Uma aula',limiteSemanal:1},now);await repo.saveSaldoMensalAluno(aluno.id,1);
  const aulas=[];for(let i=0;i<2;i++){const a={id:randomUUID(),titulo:'Aula fictícia '+i,dataAula:today(),horaInicio:i?'18:00':'12:00',horaFim:i?'19:00':'13:00',professor:'Professor',origem:'grade' as const,origemHorarioId:randomUUID(),turmaId:null,turmaNome:null,situacao:'agendada' as const,motivoCancelamento:null,canceladaEm:null,criadoEm:now};await repo.createAula(a,[]);aulas.push(a);}
  await repo.saveCheckin(aulas[0].id,aluno.id,now);
  const tables=repo.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_tatame_migrations','PreferenciasAcademia') ORDER BY name").all().map(r=>String(r.name));
  const snapshot=()=>tables.map(t=>repo.db.prepare(`SELECT * FROM "${t}" ORDER BY id`).all()),antes=snapshot();
  for(const exibirControlePlanos of [true,false]){
   const r=await request(app).put('/api/configuracoes/academia').send({exibirControlePlanos}).expect(200);assert.equal(r.body.exibirControlePlanos,exibirControlePlanos);assert.deepEqual(snapshot(),antes);
  }
  await assert.rejects(repo.saveCheckin(aulas[1].id,aluno.id,now),/limite|cota/i);assert.deepEqual(snapshot(),antes);
  assert.equal((await repo.list('PreferenciasAcademia')).length,1);
 }finally{await repo.close();}
});

it('somente administrador altera a preferência e dados de limites não entram nesse contrato',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const app=createApp(repo),aluno=(await request(app).post('/api/alunos').send({nome:'Aluno teste',email:'aluno@teste.invalid',telefone:'11900000000',dataNascimento:'2000-01-01',dataMatricula:'2020-01-01',situacao:'ativo'}).expect(201)).body;
  const usuario=randomUUID(),token='p'.repeat(43),now=new Date().toISOString();
  await repo.insert('Usuario',{id:usuario,nome:aluno.nome,email:aluno.email,perfil:'aluno',alunoId:aluno.id,senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now});
  await repo.insert('Sessao',{id:randomUUID(),usuarioId:usuario,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture'),expiraEm:'2099-01-01',criadoEm:now});
  const auth={Cookie:'tatame_sessao='+token,'X-Tatame-Request':'1'};
  await supertest(app).get('/api/configuracoes/academia').set(auth).expect(403);await supertest(app).put('/api/configuracoes/academia').set(auth).send({exibirControlePlanos:true}).expect(403);
  for(const body of [{},{exibirControlePlanos:'false'},{exibirControlePlanos:true,limiteMensal:0}])await request(app).put('/api/configuracoes/academia').send(body).expect(400);
  assert.deepEqual(await repo.list('PreferenciasAcademia'),[]);
 }finally{await repo.close();}
});

it('migração 15 preserva todas as tabelas anteriores e não suspende nem reconfigura planos',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec('PRAGMA foreign_keys=ON');migrateSqlite(db,undefined,sqliteMigrations.slice(0,14));
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='_tatame_migrations' ORDER BY name").all().map(r=>String(r.name));
  const snapshot=()=>tables.map(t=>db.prepare(`SELECT * FROM "${t}" ORDER BY id`).all()),antes=snapshot();
  assert.deepEqual(migrateSqlite(db,undefined,sqliteMigrations.slice(0,15)).applied,[15]);assert.deepEqual(snapshot(),antes);assert.equal(db.prepare('SELECT COUNT(*) n FROM PreferenciasAcademia').get()!.n,0);
  assert.deepEqual(migrateSqlite(db,undefined,sqliteMigrations.slice(0,15)).applied,[]);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{db.close();}
});
