import {it} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {FAIXAS_CATEGORIA,faixaCategoria,fundoFaixa,limiteGrausPadrao} from '@tatame/shared';
import {migrateSqlite,sqliteMigrations} from './database/sqlite/migrate.js';
import {SqliteRepository} from './repository.js';
import {createApp,request} from './test-auth-helper.js';

it('catálogo das imagens tem 13 infantis, 2 juvenis e 5 adultas, somente até preta',()=>{
 assert.equal(FAIXAS_CATEGORIA.length,20);
 for(const [categoria,total] of [['Infantil',13],['Juvenil',2],['Adulto',5]] as const)assert.equal(FAIXAS_CATEGORIA.filter(f=>f.categoria===categoria).length,total);
 assert.deepEqual(FAIXAS_CATEGORIA.filter(f=>f.categoria==='Juvenil').map(f=>f.base),['Branca','Azul']);
 assert.deepEqual(FAIXAS_CATEGORIA.filter(f=>f.categoria==='Adulto').map(f=>f.base),['Branca','Azul','Roxa','Marrom','Preta']);
 assert.ok(FAIXAS_CATEGORIA.every(f=>!f.base.startsWith('Vermelha')));
 assert.match(fundoFaixa('Infantil Faixa Cinza / Branca')!,/linear-gradient/);
 assert.equal(limiteGrausPadrao('Juvenil Faixa Azul'),4);assert.equal(limiteGrausPadrao('Adulto Faixa Preta'),null);
});

it('migração 14 acrescenta categorias sem mudar qualquer cadastro, regra ou graduação anterior',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec('PRAGMA foreign_keys=ON');migrateSqlite(db,undefined,sqliteMigrations.slice(0,13));
  const antiga='00000000-0000-4000-8100-000000000001',zero=randomUUID(),aluno=randomUUID(),especial=randomUUID(),now='2026-10-27T00:00:00.000Z';
  db.prepare('INSERT INTO GrauFaixa VALUES(?,?,?,?,?,?)').run(zero,antiga,0,'ativo',now,now);
  db.prepare('INSERT INTO Aluno(id,nome,email,telefone,dataNascimento,faixa,faixaId,grauId,dataMatricula,situacao,criadoEm) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(aluno,'Preservado','preservado@teste.invalid','11900000000','2014-01-01','Branca',antiga,zero,'2020-01-01','ativo',now);
  db.prepare('INSERT INTO RegraGraduacao VALUES(?,?,?,?,?,?,?,?)').run(randomUUID(),antiga,30,null,4,0,null,now);
  db.prepare('INSERT INTO FaixaGraduacao VALUES(?,?,?,?,?,?,?,?)').run(especial,'Infantil Faixa Branca','legada:infantil faixa branca','#F3F4F6',99,'ativo',now,now);
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_tatame_migrations','FaixaGraduacao') ORDER BY name").all().map(r=>String(r.name));
  const snapshot=()=>tables.map(t=>db.prepare(`SELECT * FROM "${t}" ORDER BY id`).all()),before=snapshot(),belts=db.prepare('SELECT * FROM FaixaGraduacao ORDER BY id').all();
  assert.deepEqual(migrateSqlite(db,undefined,sqliteMigrations.slice(0,14)).applied,[14]);assert.deepEqual(snapshot(),before);
  for(const f of belts)assert.deepEqual(db.prepare('SELECT * FROM FaixaGraduacao WHERE id=?').get(f.id),f);
  assert.equal(db.prepare("SELECT id FROM FaixaGraduacao WHERE nome='Infantil Faixa Branca'").get()!.id,especial);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM FaixaGraduacao').get()!.n,40);
  for(const f of FAIXAS_CATEGORIA)assert.ok(db.prepare('SELECT id FROM FaixaGraduacao WHERE nome=?').get(f.nome));
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.deepEqual(migrateSqlite(db,undefined,sqliteMigrations.slice(0,14)).applied,[]);
 }finally{db.close();}
});

it('metas de branca/azul são independentes por categoria e continuam editáveis',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const app=createApp(repo),faixas=(await request(app).get('/api/graduacoes').expect(200)).body as {id:string;nome:string}[];
  const nomes=['Infantil Faixa Branca','Juvenil Faixa Branca','Adulto Faixa Branca','Juvenil Faixa Azul','Adulto Faixa Azul'];
  const ids=nomes.map(nome=>faixas.find(f=>f.nome===nome)!.id);assert.equal(new Set(ids).size,5);
  for(const [i,id] of ids.entries())await request(app).put(`/api/graduacoes/faixas/${id}/regra`).send({aulasPorGrau:20+i*5}).expect(200);
  await request(app).put(`/api/graduacoes/faixas/${ids[0]}/regra`).send({aulasPorGrau:17}).expect(200);
  const regras=await repo.list('RegraGraduacao');assert.deepEqual(ids.map(id=>regras.find(r=>r.faixaId===id)!.aulasPorGrau),[17,25,30,35,40]);
  for(const id of ids)assert.deepEqual((await repo.list('GrauFaixa')).filter(g=>g.faixaId===id).map(g=>g.numero),[0,1,2,3,4]);
  const aluno=(await request(app).post('/api/alunos').send({nome:'Menor fictício',telefone:'11900000000',email:'menor@teste.invalid',dataNascimento:'2014-01-01',dataMatricula:'2020-01-01',situacao:'ativo'}).expect(201)).body;
  assert.equal(aluno.faixa,'Branca','idade não muda a categoria silenciosamente');
  const zero=(await repo.list('GrauFaixa')).find(g=>g.faixaId===ids[0]&&g.numero===0)!;
  const p=(await request(app).post(`/api/alunos/${aluno.id}/graduacao`).send({tipo:'ajuste',versao:0,faixaId:ids[0],grauId:zero.id,dataInicioFaixa:'2020-01-01',aulasAnteriores:0}).expect(200)).body;
  assert.equal(p.faixa,'Infantil Faixa Branca');assert.equal(p.regra.aulasPorGrau,17);
  assert.equal((await repo.list('RegraGraduacao')).find(r=>r.faixaId===ids[2])!.aulasPorGrau,30);
  assert.ok(faixas.some(f=>f.nome==='Branca'));assert.equal(faixas.filter(f=>faixaCategoria(f.nome)).length,20);
 }finally{await repo.close();}
});
