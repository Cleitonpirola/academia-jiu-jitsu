import { it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { SqliteRepository } from './repository.js';
import { migrateSqlite, sqliteMigrations } from './database/sqlite/migrate.js';
import { ADMIN_INICIAL_ID } from './modules/auth/routes.js';

it('migração 8 faz backup v7, preserva saldo/cadastros e persiste débito e baixa ao reabrir',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'tatame-debitos-')),file=join(dir,'teste.sqlite'),id=randomUUID(),base=randomUUID(),extra=randomUUID();let old:DatabaseSync|undefined,repo:SqliteRepository|undefined;
  const dia=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date()),now=new Date().toISOString();
  try{
    old=new DatabaseSync(file);migrateSqlite(old,file,sqliteMigrations.slice(0,7));
    old.prepare('INSERT INTO Aluno VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id,'Aluno preservado','11900000000','preservado@teste.invalid','2000-01-01','Branca','2020-01-01','ativo',now,1,0,dia.slice(0,7));
    old.prepare('INSERT INTO Usuario VALUES (?,?,?,?,?,?,?,?,?)').run(ADMIN_INICIAL_ID,'Admin','admin@teste.invalid','admin',null,'fixture',null,null,now);
    for(const aulaId of [base,extra])old.prepare('INSERT INTO Aula VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(aulaId,'Aula preservada',dia,'12:00','13:00','Mestre','grade',randomUUID(),null,null,'agendada',null,null,now);
    old.prepare('INSERT INTO CheckinAula VALUES(?,?,?,?,?)').run(randomUUID(),base,id,'Aluno preservado',now);
    const tables=old.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name<>'_tatame_migrations' ORDER BY name").all().map(row=>String(row.name));
    const projections=Object.fromEntries(tables.map(table=>[table,old!.prepare('PRAGMA table_info("'+table+'")').all().map(c=>'"'+c.name+'"').join(',')]));const snapshot=(db:DatabaseSync)=>tables.map(table=>db.prepare('SELECT '+projections[table]+' FROM "'+table+'" ORDER BY id').all());const before=snapshot(old);old.close();old=undefined;
    repo=new SqliteRepository(file);assert.deepEqual(repo.migration.applied,[8,9,10]);assert.ok(repo.migration.backupPath);assert.deepEqual(snapshot(repo.db),before);assert.equal((await repo.list('DebitoAula')).length,0);
    const backup=new DatabaseSync(repo.migration.backupPath!,{readOnly:true});try{assert.equal(backup.prepare('SELECT MAX(version) v FROM _tatame_migrations').get()!.v,7);assert.deepEqual(snapshot(backup),before);}finally{backup.close();}
    await repo.saveConfiguracaoAdicionais({valorAulaAdicionalCentavos:2500,prazoPagamentoDias:3},ADMIN_INICIAL_ID,now);
    const d=await repo.confirmarAulaAdicional(id,extra,{valorEsperadoCentavos:2500,prazoEsperadoDias:3},now);await repo.baixarDebito(d.id,ADMIN_INICIAL_ID,dia);
    await repo.close();repo=new SqliteRepository(file);assert.deepEqual(repo.migration.applied,[]);assert.equal((await repo.get('DebitoAula',d.id))!.statusPagamento,'pago');assert.equal((await repo.get('ConfiguracaoAcademia','principal'))!.prazoPagamentoDias,3);assert.deepEqual(snapshot(repo.db),before);
    await assert.rejects(repo.remove('Aula',extra),/FOREIGN KEY/);assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(),[]);
  }finally{old?.close();if(repo)await repo.close();assert.equal(dirname(resolve(dir)),resolve(tmpdir()));assert.match(basename(dir),/^tatame-debitos-/);rmSync(dir,{recursive:true,force:true});}
});
