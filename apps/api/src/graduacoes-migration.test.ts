import {it} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {migrateSqlite,sqliteMigrations} from './database/sqlite/migrate.js';

it('migração 10 preserva vinte tabelas, liga faixas anteriores e conserva grau não informado',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec('PRAGMA foreign_keys=ON');migrateSqlite(db,undefined,sqliteMigrations.slice(0,9));
  const alunos=[randomUUID(),randomUUID()];for(const [i,faixa] of ['Branca','Faixa particular antiga'].entries())db.prepare('INSERT INTO Aluno(id,nome,email,telefone,dataNascimento,faixa,dataMatricula,situacao,criadoEm) VALUES(?,?,?,?,?,?,?,?,?)').run(alunos[i],'Aluno preservado '+i,i+'@teste.invalid','11900000000','2000-01-01',faixa,'2020-01-01','ativo','2026-01-01T00:00:00Z');
  const usuario=randomUUID();db.prepare('INSERT INTO Usuario VALUES(?,?,?,?,?,?,?,?,?)').run(usuario,'Aluno preservado','login@teste.invalid','aluno',alunos[0],'hash-preservado',null,null,'2026-01-01');db.prepare('INSERT INTO Sessao VALUES(?,?,?,?,?,?)').run(randomUUID(),usuario,'token-preservado','credencial-preservada','2099-01-01','2026-01-01');
  const tabelas=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name<>'_tatame_migrations' ORDER BY name").all().map(t=>String(t.name));assert.equal(tabelas.length,20);
  const cols=Object.fromEntries(tabelas.map(t=>[t,db.prepare('PRAGMA table_info("'+t+'")').all().map(c=>'"'+c.name+'"').join(',')]));const snapshot=()=>tabelas.map(t=>db.prepare('SELECT '+cols[t]+' FROM "'+t+'" ORDER BY id').all());const before=snapshot();
  assert.deepEqual(migrateSqlite(db).applied,[10]);assert.deepEqual(snapshot(),before);
  const rows=db.prepare('SELECT a.faixa,a.grauId,f.nome FROM Aluno a JOIN FaixaGraduacao f ON f.id=a.faixaId ORDER BY a.email').all();assert.equal(rows.length,2);assert.ok(rows.every(r=>r.faixa===r.nome&&r.grauId===null));assert.equal(db.prepare('SELECT COUNT(*) n FROM GrauFaixa').get()!.n,0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.deepEqual(migrateSqlite(db).applied,[]);
 }finally{db.close();}
});
it('falha na migração de graduação desfaz tabelas/colunas novas sem alterar cadastro anterior',()=>{
 const db=new DatabaseSync(':memory:');try{db.exec('PRAGMA foreign_keys=ON');migrateSqlite(db,undefined,sqliteMigrations.slice(0,9));const id=randomUUID();db.prepare('INSERT INTO Aluno(id,nome,email,telefone,dataNascimento,faixa,dataMatricula,situacao,criadoEm) VALUES(?,?,?,?,?,?,?,?,?)').run(id,'Aluno preservado','teste@teste.invalid','11900000000','2000-01-01','Azul','2020-01-01','ativo','2026-01-01');const before=db.prepare('SELECT * FROM Aluno').all();const quebrada=[...sqliteMigrations.slice(0,9),{...sqliteMigrations[9],sql:sqliteMigrations[9].sql+'\nINSERT INTO Inexistente VALUES(1);'}];assert.throws(()=>migrateSqlite(db,undefined,quebrada),/Migração SQLite interrompida/);assert.deepEqual(db.prepare('SELECT * FROM Aluno').all(),before);assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='FaixaGraduacao'").get(),undefined);assert.equal(db.prepare('SELECT MAX(version) v FROM _tatame_migrations').get()!.v,9);assert.equal(db.prepare('PRAGMA foreign_keys').get()!.foreign_keys,1);}finally{db.close();}
});
