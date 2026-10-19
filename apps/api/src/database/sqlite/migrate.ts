import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

export interface SqliteMigration { version: number; name: string; sql: string }
export interface MigrationResult { version: number; applied: number[]; backupPath: string | null }

export const sqliteMigrations: readonly SqliteMigration[] = [
  { version: 1, name: '001_initial', sql: readFileSync(new URL('./migrations/001_initial.sql', import.meta.url), 'utf8') },
];

const checksum = (sql: string) => createHash('sha256').update(sql.replace(/\r\n/g, '\n').trim()).digest('hex');
const quote = (identifier: string) => '"' + identifier.replaceAll('"', '""') + '"';

function structure(db: DatabaseSync, table: string) {
  const columns = db.prepare(`PRAGMA table_info(${quote(table)})`).all().map(row => ({
    name: row.name, type: row.type, notnull: row.notnull, default: row.dflt_value, pk: row.pk,
  }));
  const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${quote(table)})`).all().map(row =>
    JSON.stringify([row.table, row.from, row.to, row.on_update, row.on_delete]),
  ).sort();
  const uniqueKeys = db.prepare(`PRAGMA index_list(${quote(table)})`).all()
    .filter(row => row.unique === 1)
    .map(row => JSON.stringify(db.prepare(`PRAGMA index_info(${quote(String(row.name))})`).all().map(column => column.name)))
    .sort();
  return JSON.stringify({ columns, foreignKeys, uniqueKeys });
}

function assertKnownStructure(db: DatabaseSync, migrations: readonly SqliteMigration[]) {
  const expected = new DatabaseSync(':memory:');
  try {
    expected.exec('PRAGMA foreign_keys = ON');
    for (const migration of migrations) expected.exec(migration.sql);
    const tables = expected.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    for (const { name } of tables) {
      if (structure(db, String(name)) !== structure(expected, String(name))) {
        throw new Error(`A tabela ${name} não corresponde às migrações conhecidas. É necessária uma migração explícita para essa estrutura; nenhum cadastro foi preenchido ou apagado automaticamente.`);
      }
    }
    if (db.prepare('PRAGMA foreign_key_check').all().length) {
      throw new Error('Existem vínculos inválidos no banco. Corrija-os antes de aplicar a migração.');
    }
  } finally { expected.close(); }
}

/** Aplica somente versões pendentes, em uma transação. Uma falha não marca a versão como aplicada. */
export function migrateSqlite(
  db: DatabaseSync,
  databasePath?: string,
  migrations: readonly SqliteMigration[] = sqliteMigrations,
): MigrationResult {
  if (!migrations.length || migrations.some((migration, index) => migration.version !== index + 1)) {
    throw new Error('As migrações SQLite devem ter versões consecutivas, iniciando em 1.');
  }
  const hasHistory = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='_tatame_migrations'").get());
  const history = hasHistory ? db.prepare('SELECT version, name, checksum FROM _tatame_migrations ORDER BY version').all() : [];
  for (let index = 0; index < history.length; index++) {
    const row = history[index];
    const migration = migrations[index];
    if (!migration || row.version !== migration.version || row.name !== migration.name || row.checksum !== checksum(migration.sql)) {
      throw new Error('O histórico SQLite diverge dos arquivos de migração. Preserve os arquivos já aplicados e use uma nova migração.');
    }
  }

  const pending = migrations.slice(history.length);
  let backupPath: string | null = null;
  if (pending.length && databasePath && databasePath !== ':memory:' && db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' LIMIT 1").get()) {
    const directory = join(dirname(resolve(databasePath)), 'backups');
    mkdirSync(directory, { recursive: true });
    backupPath = join(directory, `${basename(databasePath)}.antes-v${pending[0].version}-${randomUUID()}.sqlite`);
    // O próprio SQLite inclui dados ainda presentes no WAL em uma cópia consistente.
    db.prepare('VACUUM INTO ?').run(backupPath);
  }

  if (!pending.length) {
    assertKnownStructure(db, migrations);
    return { version: migrations.length, applied: [], backupPath };
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('CREATE TABLE IF NOT EXISTS _tatame_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, appliedAt TEXT NOT NULL)');
    for (const migration of pending) {
      db.exec(migration.sql);
      db.prepare('INSERT INTO _tatame_migrations (version, name, checksum, appliedAt) VALUES (?, ?, ?, ?)')
        .run(migration.version, migration.name, checksum(migration.sql), new Date().toISOString());
    }
    assertKnownStructure(db, migrations);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    const message = error instanceof Error ? error.message : 'Falha desconhecida.';
    throw new Error(`Migração SQLite interrompida: ${message}${backupPath ? ` Cópia anterior preservada em: ${backupPath}` : ''}`, { cause: error });
  }
  return { version: migrations.length, applied: pending.map(migration => migration.version), backupPath };
}
