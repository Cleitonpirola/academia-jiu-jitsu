import { it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { SqliteRepository } from './repository.js';
import { migrateSqlite, sqliteMigrations } from './database/sqlite/migrate.js';

it('migra v5 para planos com backup, preserva as treze tabelas e reabre plano/liberação', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tatame-planos-')), file = join(dir, 'teste.sqlite');
  const id = randomUUID(), user = randomUUID(), classe = randomUUID(), now = '2026-10-22T12:00:00.000Z';
  let repo: SqliteRepository | undefined;
  let oldDb: DatabaseSync | undefined;
  try {
    const db = oldDb = new DatabaseSync(file); db.exec('PRAGMA foreign_keys=ON'); migrateSqlite(db, file, sqliteMigrations.slice(0, 5));
    db.prepare('INSERT INTO Aluno VALUES (?,?,?,?,?,?,?,?,?)').run(id, 'Aluno preservado', '11999991234', 'preservado@teste.invalid', '2000-01-01', 'Branca', '2020-01-01', 'ativo', now);
    db.prepare('INSERT INTO Mensalidade VALUES (?,?,?,?,?,?,?)').run(randomUUID(), id, '2026-10', 10000, '2026-10-10', null, now);
    db.prepare('INSERT INTO Presenca VALUES (?,?,?,?,?)').run(randomUUID(), id, '2026-10-19', 'Com kimono', 1);
    db.prepare('INSERT INTO Aula VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(classe, 'Aula preservada', '2026-10-22', '12:00', '13:00', 'Mestre', 'extra', null, null, null, 'agendada', null, null, now);
    db.prepare('INSERT INTO PresencaAula VALUES (?,?,?,?,?,?,?)').run(randomUUID(), classe, id, 'Nome histórico', 1, now, now);
    db.prepare('INSERT INTO Usuario VALUES (?,?,?,?,?,?,?,?,?)').run(user, 'Administrador', 'admin@teste.invalid', 'admin', null, 'hash-ficticio', null, null, now);
    db.prepare('INSERT INTO Sessao VALUES (?,?,?,?,?,?)').run(randomUUID(), user, 'token-ficticio', 'credencial-ficticia', '2099-01-01', now);
    db.prepare('INSERT INTO CheckinAula VALUES (?,?,?,?,?)').run(randomUUID(), classe, id, 'Nome check-in', now);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != '_tatame_migrations' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => String(row.name));
    assert.equal(tables.length, 13);
    const snapshot = (source: DatabaseSync) => tables.map(table => source.prepare(`SELECT ${table === 'Aluno' ? 'id,nome,telefone,email,dataNascimento,faixa,dataMatricula,situacao,criadoEm' : '*'} FROM "${table}" ORDER BY id`).all());
    const original = snapshot(db); db.close(); oldDb = undefined;
    repo = new SqliteRepository(file); assert.deepEqual(repo.migration.applied, [6, 7, 8, 9, 10]); assert.equal(repo.migration.version, 10); assert.ok(repo.migration.backupPath);
    assert.deepEqual(snapshot(repo.db), original); assert.equal((await repo.list('PlanoAluno')).length, 0); assert.equal((await repo.list('LiberacaoAula')).length, 0);
    const backup = new DatabaseSync(repo.migration.backupPath, { readOnly: true });
    try { assert.deepEqual(snapshot(backup), original); assert.equal(backup.prepare('SELECT MAX(version) v FROM _tatame_migrations').get()?.v, 5); } finally { backup.close(); }
    const plano = await repo.savePlanoAluno(id, { nome: 'Três aulas', limiteSemanal: 3 }, now);
    const extra = { id: randomUUID(), aulaId: classe, alunoId: id, usuarioId: user, motivo: 'Fixture de persistência', criadoEm: now };
    await repo.insert('LiberacaoAula', extra); await repo.close(); repo = new SqliteRepository(file);
    assert.deepEqual(repo.migration.applied, []); assert.deepEqual(await repo.get('PlanoAluno', plano.id), plano); assert.deepEqual(await repo.get('LiberacaoAula', extra.id), extra); assert.deepEqual(snapshot(repo.db), original);
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []);
    await assert.rejects(repo.update('PlanoAluno', plano.id, { limiteSemanal: 0 }), /CHECK constraint/);
    await assert.rejects(repo.remove('Aula', classe), /FOREIGN KEY constraint/);
  } finally {
    oldDb?.close();
    if (repo) await repo.close();
    assert.equal(dirname(resolve(dir)), resolve(tmpdir())); assert.match(basename(dir), /^tatame-planos-/); rmSync(dir, { recursive: true, force: true });
  }
});
