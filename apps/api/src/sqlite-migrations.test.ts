import { it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readdirSync, existsSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { migrateSqlite, sqliteMigrations, type SqliteMigration } from './database/sqlite/migrate.js';
import { SqliteRepository } from './repository.js';

function temporaryDatabase() {
  const directory = mkdtempSync(join(tmpdir(), 'tatame-migration-'));
  return {
    file: join(directory, 'banco.sqlite'),
    cleanup() {
      const removeFile = (path: string) => {
        assert.ok(resolve(path).startsWith(resolve(directory) + sep));
        if (existsSync(path)) unlinkSync(path);
      };
      const backups = join(directory, 'backups');
      if (existsSync(backups)) {
        for (const name of readdirSync(backups)) removeFile(join(backups, name));
        rmdirSync(backups);
      }
      for (const suffix of ['', '-wal', '-shm', '-journal']) removeFile(join(directory, 'banco.sqlite' + suffix));
      rmdirSync(directory);
    },
  };
}

const originalStudent = [
  '09c312d0-187a-4d58-ae50-4a921a9dd8d4', 'Aluno preservado', '11999991234',
  'preservado@example.com', '2000-01-01', 'Azul', '2026-01-01', 'ativo', '2026-01-01T12:00:00Z',
];

it('registra a versão inicial de um banco novo e não reaplica a migração', async () => {
  const repo = new SqliteRepository(':memory:');
  try {
    assert.deepEqual(repo.migration.applied, [1]);
    assert.equal(repo.migration.backupPath, null);
    assert.deepEqual(migrateSqlite(repo.db).applied, []);
    assert.equal(repo.db.prepare('SELECT COUNT(*) AS total FROM _tatame_migrations').get()?.total, 1);
  } finally { await repo.close(); }
});

it('adota o banco 1.0 existente, conserva aluno e cobrança e cria uma cópia anterior', async () => {
  const temp = temporaryDatabase();
  let repo: SqliteRepository | undefined;
  try {
    const legacy = new DatabaseSync(temp.file);
    legacy.exec(sqliteMigrations[0].sql);
    legacy.prepare('INSERT INTO Aluno VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(...originalStudent);
    legacy.prepare('INSERT INTO Mensalidade VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('cf66927c-d8c3-4029-8d7c-f907602202a1', originalStudent[0], '2026-10', 20000, '2026-10-10', null, originalStudent[8]);
    const before = legacy.prepare('SELECT * FROM Aluno').all();
    legacy.close();

    repo = new SqliteRepository(temp.file);
    assert.deepEqual(repo.db.prepare('SELECT * FROM Aluno').all(), before);
    assert.equal((await repo.list('Mensalidade'))[0].valorCentavos, 20000);
    assert.ok(repo.migration.backupPath);
    const backup = new DatabaseSync(repo.migration.backupPath, { readOnly: true });
    try {
      assert.deepEqual(backup.prepare('SELECT * FROM Aluno').all(), before);
      assert.equal(backup.prepare('SELECT COUNT(*) AS total FROM Mensalidade').get()?.total, 1);
      assert.equal(backup.prepare("SELECT name FROM sqlite_master WHERE name='_tatame_migrations'").get(), undefined);
    } finally { backup.close(); }
    await repo.close();
    repo = new SqliteRepository(temp.file);
    assert.deepEqual(repo.migration.applied, []);
    assert.equal(repo.migration.backupPath, null);
    assert.deepEqual(repo.db.prepare('SELECT * FROM Aluno').all(), before);
  } finally { if (repo) await repo.close(); temp.cleanup(); }
});

const first: SqliteMigration = { version: 1, name: '001_exemplo', sql: 'CREATE TABLE Aluno (id TEXT PRIMARY KEY, nome TEXT NOT NULL)' };
const second: SqliteMigration = { version: 2, name: '002_endereco', sql: 'ALTER TABLE Aluno ADD COLUMN endereco TEXT' };

it('aplica uma segunda migração de estrutura sem perder registros existentes', () => {
  const db = new DatabaseSync(':memory:');
  try {
    migrateSqlite(db, undefined, [first]);
    db.prepare('INSERT INTO Aluno VALUES (?, ?)').run('aluno-1', 'Nome original');
    const result = migrateSqlite(db, undefined, [first, second]);
    assert.deepEqual(result.applied, [2]);
    assert.equal(db.prepare('SELECT nome, endereco FROM Aluno').get()?.nome, 'Nome original');
    assert.equal(db.prepare('SELECT endereco FROM Aluno').get()?.endereco, null);
    db.prepare('UPDATE Aluno SET endereco=? WHERE id=?').run('Endereço informado', 'aluno-1');
    assert.equal(db.prepare('SELECT endereco FROM Aluno').get()?.endereco, 'Endereço informado');
    assert.deepEqual(migrateSqlite(db, undefined, [first, second]).applied, []);
  } finally { db.close(); }
});

it('reverte todos os passos de uma migração com falha e não avança a versão', () => {
  const db = new DatabaseSync(':memory:');
  try {
    migrateSqlite(db, undefined, [first]);
    db.prepare('INSERT INTO Aluno VALUES (?, ?)').run('aluno-1', 'Nome original');
    const broken = { ...second, sql: second.sql + '; INSERT INTO tabela_inexistente VALUES (1)' };
    assert.throws(() => migrateSqlite(db, undefined, [first, broken]), /interrompida/);
    assert.equal(db.prepare('PRAGMA table_info(Aluno)').all().some(row => row.name === 'endereco'), false);
    assert.equal(db.prepare('SELECT MAX(version) AS version FROM _tatame_migrations').get()?.version, 1);
    assert.equal(db.prepare('SELECT nome FROM Aluno').get()?.nome, 'Nome original');
  } finally { db.close(); }
});

it('recusa um arquivo de migração alterado após aplicação', () => {
  const db = new DatabaseSync(':memory:');
  try {
    migrateSqlite(db, undefined, [first]);
    assert.throws(() => migrateSqlite(db, undefined, [{ ...first, sql: first.sql + '; -- modificado' }]), /histórico SQLite diverge/);
    assert.equal(db.prepare('SELECT COUNT(*) AS total FROM _tatame_migrations').get()?.total, 1);
  } finally { db.close(); }
});

it('aceita a mesma migração com finais de linha diferentes entre Windows e Linux', () => {
  const db = new DatabaseSync(':memory:');
  try {
    migrateSqlite(db, undefined, sqliteMigrations);
    assert.deepEqual(migrateSqlite(db, undefined, sqliteMigrations.map(item => ({ ...item, sql: item.sql.replace(/\r?\n/g, '\r\n') }))).applied, []);
  } finally { db.close(); }
});

it('recusa abrir uma versão de banco mais nova com uma lista antiga de migrações', () => {
  const db = new DatabaseSync(':memory:');
  try {
    migrateSqlite(db, undefined, [first, second]);
    assert.throws(() => migrateSqlite(db, undefined, [first]), /histórico SQLite diverge/);
  } finally { db.close(); }
});

it('interrompe estrutura legada desconhecida, faz backup e não inventa a faixa do aluno', () => {
  const temp = temporaryDatabase();
  try {
    const legacy = new DatabaseSync(temp.file);
    legacy.exec(sqliteMigrations[0].sql.replace('faixa TEXT NOT NULL, ', ''));
    legacy.prepare('INSERT INTO Aluno VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(...originalStudent.filter((_value, index) => index !== 5));
    legacy.close();
    assert.throws(() => new SqliteRepository(temp.file), /migração explícita/);
    const unchanged = new DatabaseSync(temp.file, { readOnly: true });
    try {
      assert.equal(unchanged.prepare('SELECT nome FROM Aluno').get()?.nome, 'Aluno preservado');
      assert.equal(unchanged.prepare('PRAGMA table_info(Aluno)').all().some(row => row.name === 'faixa'), false);
      assert.equal(unchanged.prepare("SELECT name FROM sqlite_master WHERE name='_tatame_migrations'").get(), undefined);
    } finally { unchanged.close(); }
    assert.equal(readdirSync(join(resolve(temp.file, '..'), 'backups')).length, 1);
  } finally { temp.cleanup(); }
});
