import { it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { migrateSqlite, sqliteMigrations } from './database/sqlite/migrate.js';
import { SqliteRepository } from './repository.js';

it('migra v4 para acesso preservando as dez tabelas, backup, autenticação e check-in após reabertura', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tatame-acesso-'));
  const file = join(dir, 'teste.sqlite');
  const tables = ['Aluno','Mensalidade','Presenca','Analise','Turma','HorarioTurma','AlunoTurma','Aula','AulaAlunoPrevisto','PresencaAula'];
  const id = randomUUID(), group = randomUUID(), slot = randomUUID(), aula = randomUUID();
  const now = '2026-10-21T12:00:00.000Z';
  let repo: SqliteRepository | undefined;
  try {
    const old = new DatabaseSync(file); old.exec('PRAGMA foreign_keys=ON');
    migrateSqlite(old, file, sqliteMigrations.slice(0,4));
    old.prepare('INSERT INTO Aluno VALUES (?,?,?,?,?,?,?,?,?)').run(id,'Aluno preservado','11999991234','aluno@teste.invalid','2000-01-01','Branca','2020-01-01','ativo',now);
    old.prepare('INSERT INTO Mensalidade VALUES (?,?,?,?,?,?,?)').run(randomUUID(),id,'2026-10',20000,'2026-10-10',null,now);
    old.prepare('INSERT INTO Presenca VALUES (?,?,?,?,?)').run(randomUUID(),id,'2026-10-01','Com kimono',1);
    old.prepare('INSERT INTO Analise VALUES (?,?,?,?,?,?,?)').run(randomUUID(),'Pergunta','Resposta','modelo-teste','Teste','{}',now);
    old.prepare('INSERT INTO Turma VALUES (?,?,?,?,?,?)').run(group,'Turma','Mestre','ativo',now,now);
    old.prepare('INSERT INTO HorarioTurma VALUES (?,?,?,?,?)').run(slot,group,3,'12:00','13:00');
    old.prepare('INSERT INTO AlunoTurma VALUES (?,?,?,?)').run(randomUUID(),group,id,now);
    old.prepare('INSERT INTO Aula VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(aula,'Aula','2026-10-21','12:00','13:00','Mestre','grade',slot,group,'Turma','agendada',null,null,now);
    old.prepare('INSERT INTO AulaAlunoPrevisto VALUES (?,?,?,?)').run(randomUUID(),aula,id,'Nome previsto');
    old.prepare('INSERT INTO PresencaAula VALUES (?,?,?,?,?,?,?)').run(randomUUID(),aula,id,'Nome histórico',1,now,now);
    const original = tables.map(table => old.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()); old.close();
    repo = new SqliteRepository(file);
    assert.deepEqual(repo.migration.applied,[5,6]); assert.equal(repo.migration.version,6); assert.ok(repo.migration.backupPath);
    assert.deepEqual(tables.map(table => repo!.db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()), original);
    for (const table of ['Usuario','Sessao','CheckinAula'] as const) assert.equal((await repo.list(table)).length,0);
    const backup = new DatabaseSync(repo.migration.backupPath, { readOnly:true });
    try {
      assert.equal(backup.prepare('SELECT MAX(version) version FROM _tatame_migrations').get()?.version,4);
      assert.equal(backup.prepare("SELECT name FROM sqlite_master WHERE name='Usuario'").get(),undefined);
      assert.deepEqual(tables.map(table => backup.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()),original);
    } finally { backup.close(); }
    const userId = randomUUID();
    await repo.insert('Usuario',{id:userId,nome:'Aluno preservado',email:'aluno@teste.invalid',perfil:'aluno',alunoId:id,senhaHash:'hash-ficticio',conviteHash:null,conviteExpiraEm:null,criadoEm:now});
    await repo.insert('Sessao',{id:randomUUID(),usuarioId:userId,tokenHash:'verificador-ficticio',credencialHash:'versao-ficticia',expiraEm:'2099-01-01T00:00:00.000Z',criadoEm:now});
    const checkin={id:randomUUID(),aulaId:aula,alunoId:id,nome:'Nome no check-in',criadoEm:now};
    await repo.insert('CheckinAula',checkin);
    await repo.close(); repo = new SqliteRepository(file);
    assert.deepEqual(repo.migration.applied,[]); assert.equal(repo.migration.backupPath,null);
    assert.deepEqual(await repo.list('CheckinAula'),[checkin]); assert.equal((await repo.list('Sessao')).length,1);
    assert.deepEqual(tables.map(table => repo!.db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()),original);
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(),[]);
  } finally {
    if(repo)await repo.close();
    assert.equal(dirname(resolve(dir)),resolve(tmpdir())); assert.match(basename(dir),/^tatame-acesso-/);
    rmSync(dir,{recursive:true,force:true});
  }
});
