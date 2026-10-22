import { it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readdirSync, existsSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
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
    assert.deepEqual(repo.migration.applied, [1, 2, 3, 4, 5]);
    assert.equal(repo.migration.backupPath, null);
    assert.deepEqual(migrateSqlite(repo.db).applied, []);
    assert.equal(repo.db.prepare('SELECT COUNT(*) AS total FROM _tatame_migrations').get()?.total, 5);
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

it('evolui versão 1 para turmas, preserva as quatro tabelas e persiste grade e vínculos após reabrir', async () => {
  const temp = temporaryDatabase();
  let repo: SqliteRepository | undefined;
  const originalTables = ['Aluno', 'Mensalidade', 'Presenca', 'Analise'];
  try {
    const old = new DatabaseSync(temp.file);
    migrateSqlite(old, temp.file, sqliteMigrations.slice(0, 1));
    old.prepare('INSERT INTO Aluno VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(...originalStudent);
    old.prepare('INSERT INTO Mensalidade VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), originalStudent[0], '2026-10', 20000, '2026-10-10', null, originalStudent[8]);
    old.prepare('INSERT INTO Presenca VALUES (?, ?, ?, ?, ?)').run(randomUUID(), originalStudent[0], '2026-10-01', 'Com kimono', 1);
    old.prepare('INSERT INTO Analise VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), 'Pergunta preservada', 'Resposta preservada', 'modelo-de-teste', 'Teste', '{}', originalStudent[8]);
    const before = originalTables.map(table => old.prepare(`SELECT * FROM "${table}" ORDER BY id`).all());
    old.close();
    repo = new SqliteRepository(temp.file);
    assert.deepEqual(repo.migration.applied, [2, 3, 4, 5]); assert.equal(repo.migration.version, 5);
    assert.deepEqual(originalTables.map(table => repo!.db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()), before);
    assert.ok(repo.migration.backupPath);
    const backup = new DatabaseSync(repo.migration.backupPath, { readOnly: true });
    try {
      assert.equal(backup.prepare('SELECT MAX(version) AS version FROM _tatame_migrations').get()?.version, 1);
      assert.equal(backup.prepare("SELECT name FROM sqlite_master WHERE name='Turma'").get(), undefined);
    } finally { backup.close(); }
    const turma = { id: randomUUID(), nome: 'Turma persistida', professor: 'Mestre', situacao: 'ativo' as const, criadoEm: '2026-10-19T00:00:00Z', atualizadoEm: '2026-10-19T00:00:00Z' };
    const horario = { id: randomUUID(), turmaId: turma.id, diaSemana: 1, horaInicio: '12:00', horaFim: '13:00' };
    const vinculo = { id: randomUUID(), turmaId: turma.id, alunoId: originalStudent[0], criadoEm: turma.criadoEm };
    await repo.saveTurma(turma, [horario], [vinculo], true);
    await repo.close(); repo = new SqliteRepository(temp.file);
    assert.deepEqual(repo.migration.applied, []);
    assert.deepEqual(await repo.get('Turma', turma.id), turma);
    assert.deepEqual(await repo.list('HorarioTurma'), [horario]); assert.deepEqual(await repo.list('AlunoTurma'), [vinculo]);
    assert.deepEqual(originalTables.map(table => repo!.db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()), before);
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { if (repo) await repo.close(); temp.cleanup(); }
});

it('evolui v2 para aulas/chamada sem alterar as sete tabelas, cria backup v2 e persiste o novo histórico', async () => {
  const temp = temporaryDatabase(); let repo: SqliteRepository | undefined;
  const tables = ['Aluno', 'Mensalidade', 'Presenca', 'Analise', 'Turma', 'HorarioTurma', 'AlunoTurma'];
  try {
    const old = new DatabaseSync(temp.file);
    migrateSqlite(old, temp.file, sqliteMigrations.slice(0, 2));
    old.prepare('INSERT INTO Aluno VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(...originalStudent);
    old.prepare('INSERT INTO Mensalidade VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), originalStudent[0], '2026-10', 20000, '2026-10-10', null, originalStudent[8]);
    old.prepare('INSERT INTO Presenca VALUES (?, ?, ?, ?, ?)').run(randomUUID(), originalStudent[0], '2026-10-01', 'Com kimono', 1);
    old.prepare('INSERT INTO Analise VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), 'Pergunta original', 'Resposta original', 'modelo-teste', 'Teste', '{}', originalStudent[8]);
    const turmaId = randomUUID(); const horarioId = randomUUID();
    old.prepare('INSERT INTO Turma VALUES (?, ?, ?, ?, ?, ?)').run(turmaId, 'Grupo original', 'Mestre', 'ativo', originalStudent[8], originalStudent[8]);
    old.prepare('INSERT INTO HorarioTurma VALUES (?, ?, ?, ?, ?)').run(horarioId, turmaId, 1, '12:00', '13:00');
    old.prepare('INSERT INTO AlunoTurma VALUES (?, ?, ?, ?)').run(randomUUID(), turmaId, originalStudent[0], originalStudent[8]);
    const before = tables.map(table => old.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()); old.close();
    repo = new SqliteRepository(temp.file);
    assert.deepEqual(repo.migration.applied, [3, 4, 5]); assert.ok(repo.migration.backupPath);
    assert.deepEqual(tables.map(table => repo!.db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()), before);
    const backup = new DatabaseSync(repo.migration.backupPath, { readOnly: true });
    try { assert.equal(backup.prepare('SELECT MAX(version) AS version FROM _tatame_migrations').get()?.version, 2); assert.equal(backup.prepare("SELECT name FROM sqlite_master WHERE name='Aula'").get(), undefined); }
    finally { backup.close(); }
    const aula = { id: randomUUID(), titulo: 'Grupo original', professor: 'Mestre', dataAula: '2026-10-19', horaInicio: '12:00', horaFim: '13:00', origem: 'grade' as const, origemHorarioId: horarioId, turmaId, turmaNome: 'Grupo original', situacao: 'agendada' as const, motivoCancelamento: null, canceladaEm: null, criadoEm: originalStudent[8] };
    const expected = { id: randomUUID(), aulaId: aula.id, alunoId: originalStudent[0], nome: originalStudent[1] };
    await repo.createAula(aula, [expected]); await repo.cancelAula(aula.id, 'Motivo histórico', '2026-10-19T10:00:00Z');
    await repo.close(); repo = new SqliteRepository(temp.file);
    assert.deepEqual(repo.migration.applied, []);
    assert.deepEqual(await repo.get('Aula', aula.id), { ...aula, situacao: 'cancelada', motivoCancelamento: 'Motivo histórico', canceladaEm: '2026-10-19T10:00:00Z' });
    assert.deepEqual(await repo.list('AulaAlunoPrevisto'), [expected]);
    assert.deepEqual(tables.map(table => repo!.db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()), before);
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { if (repo) await repo.close(); temp.cleanup(); }
});

it('evolui v3 para chamada preservando nove tabelas, backup e registros por modalidade sem fabricar participações', async () => {
  const temp = temporaryDatabase(); let repo: SqliteRepository | undefined;
  const tables = ['Aluno', 'Mensalidade', 'Presenca', 'Analise', 'Turma', 'HorarioTurma', 'AlunoTurma', 'Aula', 'AulaAlunoPrevisto'];
  try {
    const old = new DatabaseSync(temp.file);
    old.exec('PRAGMA foreign_keys=ON');
    migrateSqlite(old, temp.file, sqliteMigrations.slice(0, 3));
    old.prepare('INSERT INTO Aluno VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(...originalStudent);
    old.prepare('INSERT INTO Presenca VALUES (?, ?, ?, ?, ?)').run(randomUUID(), originalStudent[0], '2026-10-01', 'Com kimono', 1);
    const aulaId = randomUUID();
    old.prepare('INSERT INTO Aula VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(aulaId, 'Treino preservado', '2026-10-19', '15:00', '16:00', 'Mestre', 'extra', null, null, null, 'agendada', null, null, originalStudent[8]);
    old.prepare('INSERT INTO AulaAlunoPrevisto VALUES (?, ?, ?, ?)').run(randomUUID(), aulaId, originalStudent[0], originalStudent[1]);
    const before = tables.map(table => old.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()); old.close();
    repo = new SqliteRepository(temp.file);
    assert.deepEqual(repo.migration.applied, [4, 5]); assert.equal(repo.migration.version, 5); assert.ok(repo.migration.backupPath);
    assert.deepEqual(tables.map(table => repo!.db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()), before);
    assert.deepEqual(await repo.list('PresencaAula'), []);
    const backup = new DatabaseSync(repo.migration.backupPath, { readOnly: true });
    try {
      assert.equal(backup.prepare('SELECT MAX(version) AS version FROM _tatame_migrations').get()?.version, 3);
      assert.equal(backup.prepare("SELECT name FROM sqlite_master WHERE name='PresencaAula'").get(), undefined);
      assert.deepEqual(tables.map(table => backup.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()), before);
    } finally { backup.close(); }
    const marked = await repo.savePresencaAula(aulaId, originalStudent[0], true, '2026-10-21T12:00:00Z');
    await repo.close(); repo = new SqliteRepository(temp.file);
    assert.deepEqual(repo.migration.applied, []); assert.equal(repo.migration.backupPath, null);
    assert.deepEqual(await repo.list('PresencaAula'), [marked.registro]);
    assert.deepEqual(tables.map(table => repo!.db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all()), before);
    assert.deepEqual(repo.db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { if (repo) await repo.close(); temp.cleanup(); }
});
