import {it} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {FAIXAS_PADRAO,fundoFaixa,ordemFaixa} from '@tatame/shared';
import {migrateSqlite,sqliteMigrations} from './database/sqlite/migrate.js';
import {SqliteRepository} from './repository.js';
import {createApp,request} from './test-auth-helper.js';

it('migração 13 inclui kids e corais sem alterar alunos, graus, regras ou histórico anteriores',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec('PRAGMA foreign_keys=ON');migrateSqlite(db,undefined,sqliteMigrations.slice(0,12));
  const now='2026-10-26T00:00:00.000Z',legacy=randomUUID(),kids=randomUUID(),aluno=randomUUID(),grau=randomUUID();
  const insert=db.prepare('INSERT INTO FaixaGraduacao VALUES(?,?,?,?,?,?,?,?)');
  insert.run(legacy,'Faixa antiga especial','especial','#222222',0,'inativo',now,now);
  insert.run(kids,'Cinza e Branca','legada:cinza e branca','#FF0000',0,'inativo',now,now);
  db.prepare('INSERT INTO GrauFaixa VALUES(?,?,?,?,?,?)').run(grau,kids,2,'ativo',now,now);
  db.prepare('INSERT INTO Aluno(id,nome,email,telefone,dataNascimento,faixa,faixaId,grauId,dataMatricula,situacao,criadoEm) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(aluno,'Aluno preservado','preservado@teste.invalid','11900000000','2014-01-01','Cinza e Branca',kids,grau,'2020-01-01','ativo',now);
  db.prepare('INSERT INTO RegraGraduacao VALUES(?,?,?,?,?,?,?,?)').run(randomUUID(),kids,23,null,4,0,null,now);
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_tatame_migrations','FaixaGraduacao') ORDER BY name").all().map(r=>String(r.name));
  const snapshot=()=>tables.map(t=>db.prepare(`SELECT * FROM "${t}" ORDER BY id`).all());
  const before=snapshot(),oldBelts=db.prepare('SELECT id,nome,chave,criadoEm FROM FaixaGraduacao ORDER BY id').all(),oldLegacy=db.prepare('SELECT * FROM FaixaGraduacao WHERE id=?').get(legacy);
  assert.deepEqual(migrateSqlite(db,undefined,sqliteMigrations.slice(0,13)).applied,[13]);assert.deepEqual(snapshot(),before);
  for(const belt of oldBelts)assert.deepEqual(db.prepare('SELECT id,nome,chave,criadoEm FROM FaixaGraduacao WHERE id=?').get(belt.id),belt);
  assert.deepEqual(db.prepare('SELECT * FROM FaixaGraduacao WHERE id=?').get(legacy),oldLegacy);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM FaixaGraduacao WHERE nome='Cinza e Branca'").get()!.n,1);
  assert.equal(db.prepare('SELECT situacao FROM FaixaGraduacao WHERE id=?').get(kids)!.situacao,'ativo');
  for(const [i,belt] of FAIXAS_PADRAO.entries())assert.deepEqual({...db.prepare('SELECT cor,ordem,situacao FROM FaixaGraduacao WHERE nome=?').get(belt.nome)},{cor:belt.cor,ordem:i+1,situacao:'ativo'});
  assert.deepEqual(migrateSqlite(db,undefined,sqliteMigrations.slice(0,13)).applied,[]);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{db.close();}
});

it('catálogo não permite criar, reordenar, recolorir, inativar ou excluir faixas; regras kids continuam editáveis',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const app=createApp(repo),faixas=(await request(app).get('/api/graduacoes').expect(200)).body,kids=faixas.find((f:{nome:string})=>f.nome==='Cinza e Branca');
  const before=await repo.list('FaixaGraduacao');
  await request(app).post('/api/graduacoes/faixas').send({nome:'Outra',cor:'#000000',ordem:0,situacao:'ativo'}).expect(409);
  for(const change of [{nome:'Outro nome'},{cor:'#FF0000'},{ordem:0},{situacao:'inativo'}])await request(app).put('/api/graduacoes/faixas/'+kids.id).send(change).expect(409);
  await request(app).delete('/api/graduacoes/faixas/'+kids.id).expect(409);assert.deepEqual(await repo.list('FaixaGraduacao'),before);
  const rule={aulasPorGrau:17,mesesPorGrau:null,grausParaFaixa:4,mesesMinimosFaixa:0,proximaFaixaId:null};
  await request(app).put(`/api/graduacoes/faixas/${kids.id}/regra`).send(rule).expect(200);
  assert.equal((await repo.list('RegraGraduacao'))[0].aulasPorGrau,17);assert.equal((await repo.list('GrauFaixa')).filter(g=>g.faixaId===kids.id).length,5);
 }finally{await repo.close();}
});

it('cores fixas representam listras kids, corais e preservam fallback de faixas antigas',()=>{
 assert.equal(FAIXAS_PADRAO.length,20);assert.equal(ordemFaixa('  CINZA  E BRANCA '),10001);assert.equal(ordemFaixa('Antiga'),20000);
 assert.equal(fundoFaixa('Azul'),FAIXAS_PADRAO.find(f=>f.nome==='Azul')!.cor);
 assert.match(fundoFaixa('Cinza e Branca')!,/linear-gradient.*#F3F4F6/);assert.match(fundoFaixa('Verde e Preta')!,/linear-gradient.*#252B31/);
 assert.match(fundoFaixa('Vermelha e Preta')!,/repeating-linear-gradient/);assert.equal(fundoFaixa('Antiga','#111111'),'#111111');
});


it('configuração só de aulas mantém destino anterior e garante quatro graus sem editar alunos',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const app=createApp(repo),faixas=await repo.list('FaixaGraduacao'),branca=faixas.find(f=>f.nome==='Branca')!,azul=faixas.find(f=>f.nome==='Azul')!;
  await repo.saveRegraGraduacao(branca.id,{aulasPorGrau:30,proximaFaixaId:azul.id},new Date().toISOString());
  const antes=await repo.list('Aluno');
  const row=(await request(app).put(`/api/graduacoes/faixas/${branca.id}/regra`).send({aulasPorGrau:25}).expect(200)).body;
  assert.equal(row.aulasPorGrau,25);assert.equal(row.grausParaFaixa,4);assert.equal(row.proximaFaixaId,azul.id);
  assert.deepEqual((await repo.list('GrauFaixa')).filter(g=>g.faixaId===branca.id).map(g=>g.numero),[0,1,2,3,4]);assert.deepEqual(await repo.list('Aluno'),antes);
  for(const total of [1,3,5])await request(app).put(`/api/graduacoes/faixas/${branca.id}/regra`).send({aulasPorGrau:25,grausParaFaixa:total}).expect(400);
  await request(app).post(`/api/graduacoes/faixas/${branca.id}/graus`).send({numero:5,situacao:'ativo'}).expect(400);
  await repo.update('FaixaGraduacao',azul.id,{situacao:'inativo'});
  await request(app).put(`/api/graduacoes/faixas/${branca.id}/regra`).send({aulasPorGrau:22}).expect(200);
 }finally{await repo.close();}
});
it('quatro graus não substituem graduação avançada ou dados legados',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const preta=(await repo.list('FaixaGraduacao')).find(f=>f.nome==='Preta')!;
  await repo.saveRegraGraduacao(preta.id,{aulasPorGrau:50,grausParaFaixa:9},new Date().toISOString());
  await repo.saveRegraGraduacao(preta.id,{aulasPorGrau:60},new Date().toISOString());
  assert.equal((await repo.list('RegraGraduacao'))[0].grausParaFaixa,9);
 }finally{await repo.close();}
});
