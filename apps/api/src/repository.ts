import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Aluno, Mensalidade, Presenca, Analise, Turma, HorarioTurma, AlunoTurma } from '@tatame/shared';
import { migrateSqlite, type MigrationResult } from './database/sqlite/migrate.js';

export type Tables = { Aluno: Aluno; Mensalidade: Mensalidade; Presenca: Presenca; Analise: Analise; Turma: Turma; HorarioTurma: HorarioTurma; AlunoTurma: AlunoTurma };
export type Table = keyof Tables;
export interface Repository {
  kind: 'sqlite' | 'supabase';
  list<K extends Table>(table: K): Promise<Tables[K][]>;
  get<K extends Table>(table: K, id: string): Promise<Tables[K] | null>;
  insert<K extends Table>(table: K, row: Tables[K]): Promise<Tables[K]>;
  update<K extends Table>(table: K, id: string, row: Partial<Tables[K]>): Promise<Tables[K]>;
  remove(table: Table, id: string): Promise<void>;
  saveTurma(turma: Turma, horarios: HorarioTurma[], alunos: AlunoTurma[], create: boolean): Promise<void>;
  removeTurma(id: string): Promise<void>;
  close(): Promise<void>;
}
const columns: Record<Table, string[]> = {
  Aluno: ['id','nome','telefone','email','dataNascimento','faixa','dataMatricula','situacao','criadoEm'],
  Mensalidade: ['id','alunoId','competencia','valorCentavos','dataVencimento','dataPagamento','criadoEm'],
  Presenca: ['id','alunoId','dataTreino','tipoTreino','presente'],
  Analise: ['id','pergunta','resposta','modelo','usuario','metricas','criadoEm'],
  Turma: ['id','nome','professor','situacao','criadoEm','atualizadoEm'],
  HorarioTurma: ['id','turmaId','diaSemana','horaInicio','horaFim'],
  AlunoTurma: ['id','turmaId','alunoId','criadoEm'],
};
export class SqliteRepository implements Repository {
  kind = 'sqlite' as const;
  db: DatabaseSync;
  fresh: boolean;
  migration: MigrationResult;
  constructor(path = resolve(process.env.SQLITE_PATH || 'data/academia.sqlite')) {
    this.fresh = path !== ':memory:' && !existsSync(path);
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    try {
      this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
      this.migration = migrateSqlite(this.db, path);
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  private decode<K extends Table>(table: K, row: unknown): Tables[K] {
    const record = row as Record<string, unknown>;
    return { ...record, ...(table === 'Presenca' ? { presente: Boolean(record.presente) } : {}) } as unknown as Tables[K];
  }
  async list<K extends Table>(table: K) { return this.db.prepare(`SELECT * FROM "${table}"`).all().map(row => this.decode(table, row)); }
  async get<K extends Table>(table: K, id: string) { const row = this.db.prepare(`SELECT * FROM "${table}" WHERE id=?`).get(id); return row ? this.decode(table, row) : null; }
  private insertRow<K extends Table>(table: K, row: Tables[K]) {
    const fields = columns[table];
    const values = fields.map(key => { const v = (row as unknown as Record<string, unknown>)[key]; return typeof v === 'boolean' ? Number(v) : v as string | number | null; });
    this.db.prepare(`INSERT INTO "${table}" (${fields.map(f=>`"${f}"`).join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...values);
    return row;
  }
  async insert<K extends Table>(table: K, row: Tables[K]) { return this.insertRow(table, row); }
  async update<K extends Table>(table: K, id: string, row: Partial<Tables[K]>) {
    const fields = columns[table].filter(key => key !== 'id' && key in row);
    if (fields.length) {
      const values = fields.map(key => { const v = (row as Record<string, unknown>)[key]; return typeof v === 'boolean' ? Number(v) : v as string | number | null; });
      this.db.prepare(`UPDATE "${table}" SET ${fields.map(f=>`"${f}"=?`).join(',')} WHERE id=?`).run(...values, id);
    }
    const updated = await this.get(table, id);
    if (!updated) throw new Error('Registro inexistente.');
    return updated;
  }
  async remove(table: Table, id: string) { this.db.prepare(`DELETE FROM "${table}" WHERE id=?`).run(id); }
  async saveTurma(turma: Turma, horarios: HorarioTurma[], alunos: AlunoTurma[], create: boolean) {
    // Sem awaits dentro desta transação síncrona: outra requisição não pode intercalar gravações.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (create) this.insertRow('Turma', turma);
      else this.db.prepare('UPDATE Turma SET nome=?, professor=?, situacao=?, atualizadoEm=? WHERE id=?')
        .run(turma.nome, turma.professor, turma.situacao, turma.atualizadoEm, turma.id);
      this.db.prepare('DELETE FROM HorarioTurma WHERE turmaId=?').run(turma.id);
      this.db.prepare('DELETE FROM AlunoTurma WHERE turmaId=?').run(turma.id);
      for (const horario of horarios) this.insertRow('HorarioTurma', horario);
      for (const aluno of alunos) this.insertRow('AlunoTurma', aluno);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async removeTurma(id: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM HorarioTurma WHERE turmaId=?').run(id);
      this.db.prepare('DELETE FROM AlunoTurma WHERE turmaId=?').run(id);
      this.db.prepare('DELETE FROM Turma WHERE id=?').run(id);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async close() { this.db.close(); }
}
type Delegate = {
  findMany(args?: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};
export class PrismaRepository implements Repository {
  kind = 'supabase' as const;
  private client: PrismaClient;
  constructor(url: string) { this.client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }); }
  private delegate(table: Table): Delegate { const name = table[0].toLowerCase() + table.slice(1); return (this.client as unknown as Record<string, Delegate>)[name]; }
  async list<K extends Table>(table: K) { return await this.delegate(table).findMany() as Tables[K][]; }
  async get<K extends Table>(table: K, id: string) { return await this.delegate(table).findUnique({ where: { id } }) as Tables[K] | null; }
  async insert<K extends Table>(table: K, row: Tables[K]) { return await this.delegate(table).create({ data: row }) as Tables[K]; }
  async update<K extends Table>(table: K, id: string, row: Partial<Tables[K]>) { return await this.delegate(table).update({ where: { id }, data: row }) as Tables[K]; }
  async remove(table: Table, id: string) { await this.delegate(table).delete({ where: { id } }); }
  async saveTurma(turma: Turma, horarios: HorarioTurma[], alunos: AlunoTurma[], create: boolean) {
    await this.client.$transaction(async client => {
      if (create) await client.turma.create({ data: turma });
      else await client.turma.update({ where: { id: turma.id }, data: turma });
      await client.horarioTurma.deleteMany({ where: { turmaId: turma.id } });
      await client.alunoTurma.deleteMany({ where: { turmaId: turma.id } });
      if (horarios.length) await client.horarioTurma.createMany({ data: horarios });
      if (alunos.length) await client.alunoTurma.createMany({ data: alunos });
    });
  }
  async removeTurma(id: string) {
    await this.client.$transaction(async client => {
      await client.horarioTurma.deleteMany({ where: { turmaId: id } });
      await client.alunoTurma.deleteMany({ where: { turmaId: id } });
      await client.turma.delete({ where: { id } });
    });
  }
  async close() { await this.client.$disconnect(); }
}
export function createRepository(): Repository { return process.env.DATABASE_URL ? new PrismaRepository(process.env.DATABASE_URL) : new SqliteRepository(); }
