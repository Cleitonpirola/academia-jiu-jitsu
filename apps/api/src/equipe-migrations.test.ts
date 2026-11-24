import {it} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {migrateSqlite,sqliteMigrations} from './database/sqlite/migrate.js';
it('migrações 16 e 17 só acrescentam tabelas, preservam históricos e não criam mensagens ou fotos',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec('PRAGMA foreign_keys=ON');migrateSqlite(db,undefined,sqliteMigrations.slice(0,15));
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='_tatame_migrations' ORDER BY name").all().map(r=>String(r.name));
  const read=()=>tables.map(t=>db.prepare(`SELECT * FROM "${t}" ORDER BY id`).all()),antes=read();
  assert.deepEqual(migrateSqlite(db).applied,[16,17,18,19,20,21]);assert.deepEqual(read(),antes);for(const t of ['FotoPerfil','LoteComunicado','EntregaComunicado'])assert.equal(db.prepare(`SELECT COUNT(*) n FROM "${t}"`).get()!.n,0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.deepEqual(migrateSqlite(db).applied,[]);
 }finally{db.close();}
});
