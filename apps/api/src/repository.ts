import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Aluno, Mensalidade, Presenca, Analise, Turma, HorarioTurma, AlunoTurma, Aula, AulaAlunoPrevisto, PresencaAula, CheckinAula, PlanoAluno, LiberacaoAula } from '@tatame/shared';
import type { Usuario, Sessao } from './modules/auth/models.js';
import { validateCheckin } from './modules/auth/checkin-rules.js';
import { assertFinanceiroRegular } from './modules/auth/financial-access.js';
import { migrateSqlite, type MigrationResult } from './database/sqlite/migrate.js';
import { assertSemChamada, validateAlunoChamada, validateAulaChamada } from './modules/chamada/rules.js';
import { HttpError } from './http-error.js';
import { assertCotaCheckin, assertPodeLiberar, type ContextoPlano } from './modules/planos/rules.js';

export type Tables = { Aluno: Aluno; Mensalidade: Mensalidade; Presenca: Presenca; Analise: Analise; Turma: Turma; HorarioTurma: HorarioTurma; AlunoTurma: AlunoTurma; Aula: Aula; AulaAlunoPrevisto: AulaAlunoPrevisto; PresencaAula: PresencaAula; Usuario: Usuario; Sessao: Sessao; CheckinAula: CheckinAula; PlanoAluno: PlanoAluno; LiberacaoAula: LiberacaoAula };
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
  createAula(aula: Aula, alunos: AulaAlunoPrevisto[]): Promise<void>;
  cancelAula(id: string, motivo: string, timestamp: string): Promise<void>;
  removeAulaExtra(id: string): Promise<boolean>;
  savePresencaAula(aulaId: string, alunoId: string, presente: boolean, timestamp: string): Promise<{ registro: PresencaAula; created: boolean }>;
  removePresencaAula(aulaId: string, alunoId: string): Promise<void>;
  activateUsuario(id: string, conviteHash: string, senhaHash: string, timestamp: string): Promise<boolean>;
  saveCheckin(aulaId: string, alunoId: string, timestamp: string): Promise<CheckinAula>;
  savePlanoAluno(alunoId: string, input: Pick<PlanoAluno, 'nome' | 'limiteSemanal'>, timestamp: string): Promise<PlanoAluno>;
  saveLiberacaoAula(aulaId: string, alunoId: string, usuarioId: string, motivo: string, timestamp: string): Promise<LiberacaoAula>;
  removeLiberacaoAula(aulaId: string, alunoId: string): Promise<void>;
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
  Aula: ['id','titulo','dataAula','horaInicio','horaFim','professor','origem','origemHorarioId','turmaId','turmaNome','situacao','motivoCancelamento','canceladaEm','criadoEm'],
  AulaAlunoPrevisto: ['id','aulaId','alunoId','nome'],
  PresencaAula: ['id','aulaId','alunoId','nome','presente','criadoEm','atualizadoEm'],
  Usuario: ['id','nome','email','perfil','alunoId','senhaHash','conviteHash','conviteExpiraEm','criadoEm'],
  Sessao: ['id','usuarioId','tokenHash','credencialHash','expiraEm','criadoEm'],
  CheckinAula: ['id','aulaId','alunoId','nome','criadoEm'],
  PlanoAluno: ['id','alunoId','nome','limiteSemanal','criadoEm','atualizadoEm'],
  LiberacaoAula: ['id','aulaId','alunoId','motivo','usuarioId','criadoEm'],
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
    return { ...record, ...(['Presenca', 'PresencaAula'].includes(table) ? { presente: Boolean(record.presente) } : {}) } as unknown as Tables[K];
  }
  async list<K extends Table>(table: K) { return this.db.prepare(`SELECT * FROM "${table}"`).all().map(row => this.decode(table, row)); }
  async get<K extends Table>(table: K, id: string) { const row = this.db.prepare(`SELECT * FROM "${table}" WHERE id=?`).get(id); return row ? this.decode(table, row) : null; }
  private contextoPlano(alunoId: string): ContextoPlano {
    const list = <K extends Table>(table: K) => this.db.prepare(`SELECT * FROM "${table}"${table === 'Aula' ? '' : ' WHERE alunoId=?'}`).all(...(table === 'Aula' ? [] : [alunoId])).map(row => this.decode(table, row));
    return { plano: list('PlanoAluno')[0] ?? null, aulas: list('Aula'), checkins: list('CheckinAula'), chamada: list('PresencaAula'), antigas: list('Presenca'), liberacoes: list('LiberacaoAula') };
  }
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
  async createAula(aula: Aula, alunos: AulaAlunoPrevisto[]) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.insertRow('Aula', aula);
      for (const aluno of alunos) this.insertRow('AulaAlunoPrevisto', aluno);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async cancelAula(id: string, motivo: string, timestamp: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      assertSemChamada(Boolean(this.db.prepare('SELECT id FROM PresencaAula WHERE aulaId=? LIMIT 1').get(id)));
      this.db.prepare("UPDATE Aula SET situacao='cancelada', motivoCancelamento=?, canceladaEm=? WHERE id=? AND situacao='agendada'").run(motivo, timestamp, id);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async removeAulaExtra(id: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const aula = this.db.prepare("SELECT id FROM Aula WHERE id=? AND origem='extra'").get(id);
      if (!aula) { this.db.exec('COMMIT'); return false; }
      assertSemChamada(Boolean(this.db.prepare('SELECT id FROM PresencaAula WHERE aulaId=? LIMIT 1').get(id)));
      this.db.prepare('DELETE FROM AulaAlunoPrevisto WHERE aulaId=?').run(id);
      if (this.db.prepare('SELECT id FROM CheckinAula WHERE aulaId=? LIMIT 1').get(id)) throw new HttpError(409, 'Esta aula possui check-ins. Cancele-a para preservar os avisos dos alunos.');
      if (this.db.prepare('SELECT id FROM LiberacaoAula WHERE aulaId=? LIMIT 1').get(id)) throw new HttpError(409, 'Esta aula possui liberações extras. Cancele-a para preservar as autorizações.');
      const result = this.db.prepare("DELETE FROM Aula WHERE id=? AND origem='extra'").run(id);
      this.db.exec('COMMIT');
      return result.changes === 1;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async savePresencaAula(aulaId: string, alunoId: string, presente: boolean, timestamp: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const aula = (this.db.prepare('SELECT * FROM Aula WHERE id=?').get(aulaId) as unknown as Aula | undefined) ?? null;
      validateAulaChamada(aula);
      const existing = this.db.prepare('SELECT * FROM PresencaAula WHERE aulaId=? AND alunoId=?').get(aulaId, alunoId);
      const aluno = (this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(alunoId) as unknown as Aluno | undefined) ?? null;
      validateAlunoChamada(aluno, aula.dataAula, Boolean(existing));
      const registro: PresencaAula = existing ? { ...this.decode('PresencaAula', existing), presente, atualizadoEm: timestamp }
        : { id: randomUUID(), aulaId, alunoId, nome: aluno.nome, presente, criadoEm: timestamp, atualizadoEm: timestamp };
      if (existing) this.db.prepare('UPDATE PresencaAula SET presente=?, atualizadoEm=? WHERE id=?').run(Number(presente), timestamp, registro.id);
      else this.insertRow('PresencaAula', registro);
      this.db.exec('COMMIT');
      return { registro, created: !existing };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async removePresencaAula(aulaId: string, alunoId: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const aula = (this.db.prepare('SELECT * FROM Aula WHERE id=?').get(aulaId) as unknown as Aula | undefined) ?? null;
      validateAulaChamada(aula);
      const result = this.db.prepare('DELETE FROM PresencaAula WHERE aulaId=? AND alunoId=?').run(aulaId, alunoId);
      if (!result.changes) throw new HttpError(404, 'Marcação não encontrada. Atualize a chamada.');
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async activateUsuario(id: string, conviteHash: string, senhaHash: string, timestamp: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = this.db.prepare('UPDATE Usuario SET senhaHash=?, conviteHash=NULL, conviteExpiraEm=NULL WHERE id=? AND conviteHash=? AND conviteExpiraEm>? AND alunoId IN (SELECT id FROM Aluno WHERE situacao=\'ativo\')').run(senhaHash, id, conviteHash, timestamp);
      if (result.changes) this.db.prepare('DELETE FROM Sessao WHERE usuarioId=?').run(id);
      this.db.exec('COMMIT'); return result.changes === 1;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async saveCheckin(aulaId: string, alunoId: string, timestamp: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const aula = this.db.prepare('SELECT * FROM Aula WHERE id=?').get(aulaId) as unknown as Aula | undefined;
      const aluno = this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(alunoId) as unknown as Aluno | undefined;
      validateCheckin(aula, aluno);
      const mensalidades = this.db.prepare('SELECT * FROM Mensalidade WHERE alunoId=?').all(alunoId) as unknown as Mensalidade[];
      assertFinanceiroRegular(mensalidades, alunoId);
      let row = this.db.prepare('SELECT * FROM CheckinAula WHERE aulaId=? AND alunoId=?').get(aulaId, alunoId) as unknown as CheckinAula | undefined;
      if (!row) {
        if (this.db.prepare('SELECT id FROM PresencaAula WHERE aulaId=? AND alunoId=?').get(aulaId, alunoId)) throw new HttpError(409, 'Esta aula já foi avaliada pelo responsável.');
        assertCotaCheckin(this.contextoPlano(alunoId), alunoId, aulaId);
        row = { id: randomUUID(), aulaId, alunoId, nome: aluno!.nome, criadoEm: timestamp };
        this.insertRow('CheckinAula', row);
      }
      this.db.exec('COMMIT'); return row;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async savePlanoAluno(alunoId: string, input: Pick<PlanoAluno, 'nome' | 'limiteSemanal'>, timestamp: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (!this.db.prepare('SELECT id FROM Aluno WHERE id=?').get(alunoId)) throw new HttpError(404, 'Aluno não encontrado.');
      const old = this.db.prepare('SELECT * FROM PlanoAluno WHERE alunoId=?').get(alunoId) as unknown as PlanoAluno | undefined;
      const row: PlanoAluno = { id: old?.id ?? randomUUID(), alunoId, ...input, criadoEm: old?.criadoEm ?? timestamp, atualizadoEm: timestamp };
      if (old) this.db.prepare('UPDATE PlanoAluno SET nome=?, limiteSemanal=?, atualizadoEm=? WHERE id=?').run(row.nome, row.limiteSemanal, timestamp, row.id);
      else this.insertRow('PlanoAluno', row);
      this.db.exec('COMMIT'); return row;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async saveLiberacaoAula(aulaId: string, alunoId: string, usuarioId: string, motivo: string, timestamp: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const aula = this.db.prepare('SELECT * FROM Aula WHERE id=?').get(aulaId) as unknown as Aula | undefined;
      const aluno = this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(alunoId) as unknown as Aluno | undefined;
      validateCheckin(aula, aluno);
      const old = this.db.prepare('SELECT * FROM LiberacaoAula WHERE aulaId=? AND alunoId=?').get(aulaId, alunoId) as unknown as LiberacaoAula | undefined;
      if (old) { this.db.exec('COMMIT'); return old; }
      assertPodeLiberar(this.contextoPlano(alunoId), alunoId, aulaId);
      const row = { id: randomUUID(), aulaId, alunoId, usuarioId, motivo, criadoEm: timestamp };
      this.insertRow('LiberacaoAula', row); this.db.exec('COMMIT'); return row;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async removeLiberacaoAula(aulaId: string, alunoId: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (this.db.prepare('SELECT id FROM CheckinAula WHERE aulaId=? AND alunoId=?').get(aulaId, alunoId) || this.db.prepare('SELECT id FROM PresencaAula WHERE aulaId=? AND alunoId=?').get(aulaId, alunoId)) throw new HttpError(409, 'Liberação com check-in ou chamada deve ser preservada.');
      const result = this.db.prepare('DELETE FROM LiberacaoAula WHERE aulaId=? AND alunoId=?').run(aulaId, alunoId);
      if (!result.changes) throw new HttpError(404, 'Liberação não encontrada.');
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async close() { this.db.close(); }
}

async function contextoPlanoPrisma(client: Prisma.TransactionClient, alunoId: string): Promise<ContextoPlano> {
  const [plano, aulas, checkins, chamada, antigas, liberacoes] = await Promise.all([
    client.planoAluno.findUnique({ where: { alunoId } }), client.aula.findMany(), client.checkinAula.findMany({ where: { alunoId } }),
    client.presencaAula.findMany({ where: { alunoId } }), client.presenca.findMany({ where: { alunoId } }), client.liberacaoAula.findMany({ where: { alunoId } }),
  ]);
  return { plano, aulas: aulas as Aula[], checkins, chamada, antigas, liberacoes };
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
  async remove(table: Table, id: string) {
    if (table === 'Sessao') { await this.client.sessao.deleteMany({ where: { id } }); return; }
    await this.delegate(table).delete({ where: { id } });
  }
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
  async createAula(aula: Aula, alunos: AulaAlunoPrevisto[]) {
    await this.client.$transaction(async client => {
      await client.aula.create({ data: aula });
      if (alunos.length) await client.aulaAlunoPrevisto.createMany({ data: alunos });
    });
  }
  async cancelAula(id: string, motivo: string, timestamp: string) {
    await this.client.$transaction(async client => {
      await client.$queryRaw`SELECT id FROM "Aula" WHERE id=${id}::uuid FOR UPDATE`;
      assertSemChamada(Boolean(await client.presencaAula.findFirst({ where: { aulaId: id }, select: { id: true } })));
      await client.aula.updateMany({ where: { id, situacao: 'agendada' }, data: { situacao: 'cancelada', motivoCancelamento: motivo, canceladaEm: timestamp } });
    });
  }
  async removeAulaExtra(id: string) {
    return this.client.$transaction(async client => {
      await client.$queryRaw`SELECT id FROM "Aula" WHERE id=${id}::uuid FOR UPDATE`;
      const aula = await client.aula.findFirst({ where: { id, origem: 'extra' }, select: { id: true } });
      if (!aula) return false;
      assertSemChamada(Boolean(await client.presencaAula.findFirst({ where: { aulaId: id }, select: { id: true } })));
      if (await client.checkinAula.findFirst({ where: { aulaId: id }, select: { id: true } })) throw new HttpError(409, 'Esta aula possui check-ins. Cancele-a para preservar os avisos dos alunos.');
      if (await client.liberacaoAula.findFirst({ where: { aulaId: id }, select: { id: true } })) throw new HttpError(409, 'Esta aula possui liberações extras. Cancele-a para preservar as autorizações.');
      await client.aulaAlunoPrevisto.deleteMany({ where: { aulaId: id } });
      const result = await client.aula.deleteMany({ where: { id, origem: 'extra' } });
      return result.count === 1;
    });
  }
  async savePresencaAula(aulaId: string, alunoId: string, presente: boolean, timestamp: string) {
    return this.client.$transaction(async client => {
      const [aula] = await client.$queryRaw<Aula[]>`SELECT * FROM "Aula" WHERE id=${aulaId}::uuid FOR UPDATE`;
      validateAulaChamada(aula ?? null);
      const [aluno] = await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      const existing = await client.presencaAula.findUnique({ where: { aulaId_alunoId: { aulaId, alunoId } } });
      validateAlunoChamada(aluno ?? null, aula.dataAula, Boolean(existing));
      const registro = existing ? await client.presencaAula.update({ where: { id: existing.id }, data: { presente, atualizadoEm: timestamp } })
        : await client.presencaAula.create({ data: { id: randomUUID(), aulaId, alunoId, nome: aluno.nome, presente, criadoEm: timestamp, atualizadoEm: timestamp } });
      return { registro, created: !existing };
    });
  }
  async removePresencaAula(aulaId: string, alunoId: string) {
    await this.client.$transaction(async client => {
      const [aula] = await client.$queryRaw<Aula[]>`SELECT * FROM "Aula" WHERE id=${aulaId}::uuid FOR UPDATE`;
      validateAulaChamada(aula ?? null);
      await client.$queryRaw`SELECT id FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      const result = await client.presencaAula.deleteMany({ where: { aulaId, alunoId } });
      if (!result.count) throw new HttpError(404, 'Marcação não encontrada. Atualize a chamada.');
    });
  }
  async activateUsuario(id: string, conviteHash: string, senhaHash: string, timestamp: string) {
    return this.client.$transaction(async client => {
      const result = await client.usuario.updateMany({ where: { id, conviteHash, conviteExpiraEm: { gt: timestamp }, aluno: { situacao: 'ativo' } }, data: { senhaHash, conviteHash: null, conviteExpiraEm: null } });
      if (result.count) await client.sessao.deleteMany({ where: { usuarioId: id } });
      return result.count === 1;
    });
  }
  async saveCheckin(aulaId: string, alunoId: string, timestamp: string) {
    return this.client.$transaction(async client => {
      const [aula] = await client.$queryRaw<Aula[]>`SELECT * FROM "Aula" WHERE id=${aulaId}::uuid FOR UPDATE`;
      const [aluno] = await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      validateCheckin(aula, aluno);
      assertFinanceiroRegular(await client.mensalidade.findMany({ where: { alunoId } }), alunoId);
      const existing = await client.checkinAula.findUnique({ where: { aulaId_alunoId: { aulaId, alunoId } } });
      if (existing) return existing;
      if (await client.presencaAula.findUnique({ where: { aulaId_alunoId: { aulaId, alunoId } } })) throw new HttpError(409, 'Esta aula já foi avaliada pelo responsável.');
      assertCotaCheckin(await contextoPlanoPrisma(client, alunoId), alunoId, aulaId);
      return client.checkinAula.create({ data: { id: randomUUID(), aulaId, alunoId, nome: aluno.nome, criadoEm: timestamp } });
    });
  }
  async savePlanoAluno(alunoId: string, input: Pick<PlanoAluno, 'nome' | 'limiteSemanal'>, timestamp: string) {
    return this.client.$transaction(async client => {
      const rows = await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      if (!rows.length) throw new HttpError(404, 'Aluno não encontrado.');
      return client.planoAluno.upsert({ where: { alunoId }, create: { id: randomUUID(), alunoId, ...input, criadoEm: timestamp, atualizadoEm: timestamp }, update: { ...input, atualizadoEm: timestamp } });
    });
  }
  async saveLiberacaoAula(aulaId: string, alunoId: string, usuarioId: string, motivo: string, timestamp: string) {
    return this.client.$transaction(async client => {
      const [aula] = await client.$queryRaw<Aula[]>`SELECT * FROM "Aula" WHERE id=${aulaId}::uuid FOR UPDATE`;
      const [aluno] = await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      validateCheckin(aula, aluno);
      const old = await client.liberacaoAula.findUnique({ where: { aulaId_alunoId: { aulaId, alunoId } } });
      if (old) return old;
      assertPodeLiberar(await contextoPlanoPrisma(client, alunoId), alunoId, aulaId);
      return client.liberacaoAula.create({ data: { id: randomUUID(), aulaId, alunoId, usuarioId, motivo, criadoEm: timestamp } });
    });
  }
  async removeLiberacaoAula(aulaId: string, alunoId: string) {
    await this.client.$transaction(async client => {
      await client.$queryRaw`SELECT id FROM "Aula" WHERE id=${aulaId}::uuid FOR UPDATE`;
      await client.$queryRaw`SELECT id FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      if (await client.checkinAula.findUnique({ where: { aulaId_alunoId: { aulaId, alunoId } } }) || await client.presencaAula.findUnique({ where: { aulaId_alunoId: { aulaId, alunoId } } })) throw new HttpError(409, 'Liberação com check-in ou chamada deve ser preservada.');
      const result = await client.liberacaoAula.deleteMany({ where: { aulaId, alunoId } });
      if (!result.count) throw new HttpError(404, 'Liberação não encontrada.');
    });
  }
  async close() { await this.client.$disconnect(); }
}
export function createRepository(): Repository { return process.env.DATABASE_URL ? new PrismaRepository(process.env.DATABASE_URL) : new SqliteRepository(); }
