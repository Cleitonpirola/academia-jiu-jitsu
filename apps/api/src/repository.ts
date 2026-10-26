import { graduacaoValida, validarCatalogo, type AcaoGraduacao } from './modules/graduacoes/rules.js';
import type { FaixaGraduacao,GrauFaixa } from '@tatame/shared';
import { planejarPerfilAluno } from './modules/auth/perfil.js';
import type { PerfilBasicoAluno } from '@tatame/shared';
import type { ResponsavelAluno, EventoAcessoAluno, ComunicadoAluno, UsuarioView } from '@tatame/shared';
import { planejarFamilia, assertAcessoPortal, usuarioHabilitado, type AcaoFamiliar } from './modules/auth/familia.js';
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
import { assertSaldoMensal, camposSaldo, limparSaldoNulo, saldoMensal } from './modules/planos/saldo-mensal.js';
import type { AceiteAulaAdicional, CondicoesAulaAdicional, ConfiguracaoAcademia, DebitoAula } from '@tatame/shared';
import { adicionalAtivo, assertDebitosEmDia, condicoesPadrao, novoDebito, validarDataBaixa } from './modules/planos/debitos.js';

export type Tables = { FaixaGraduacao:FaixaGraduacao; GrauFaixa:GrauFaixa; ResponsavelAluno: ResponsavelAluno; EventoAcessoAluno: EventoAcessoAluno; ComunicadoAluno: ComunicadoAluno; ConfiguracaoAcademia: ConfiguracaoAcademia; DebitoAula: DebitoAula; Aluno: Aluno; Mensalidade: Mensalidade; Presenca: Presenca; Analise: Analise; Turma: Turma; HorarioTurma: HorarioTurma; AlunoTurma: AlunoTurma; Aula: Aula; AulaAlunoPrevisto: AulaAlunoPrevisto; PresencaAula: PresencaAula; Usuario: Usuario; Sessao: Sessao; CheckinAula: CheckinAula; PlanoAluno: PlanoAluno; LiberacaoAula: LiberacaoAula };
export type Table = keyof Tables;
export interface Repository {
  kind: 'sqlite' | 'supabase';
  saveCatalogoGraduacao(acao: AcaoGraduacao): Promise<void>;
  saveCadastroAluno(aluno: Aluno, create: boolean): Promise<Aluno>;
  savePerfilAluno(usuarioId: string, sessaoId: string, input: PerfilBasicoAluno, senhaHashVerificada?: string): Promise<Aluno>;
  responderComunicado(id: string, usuarioId: string, resposta: NonNullable<ComunicadoAluno['resposta']>, timestamp: string): Promise<ComunicadoAluno>;
  saveFamilia(acao: AcaoFamiliar): Promise<{aluno: Aluno; usuarioId: string}>;
  list<K extends Table>(table: K): Promise<Tables[K][]>;
  get<K extends Table>(table: K, id: string): Promise<Tables[K] | null>;
  insert<K extends Table>(table: K, row: Tables[K]): Promise<Tables[K]>;
  update<K extends Table>(table: K, id: string, row: Partial<Tables[K]>): Promise<Tables[K]>;
  remove(table: Table, id: string): Promise<void>;
  saveTurma(turma: Turma, horarios: HorarioTurma[], alunos: AlunoTurma[], create: boolean): Promise<void>;
  removeTurma(id: string): Promise<void>;
  createAula(aula: Aula, alunos: AulaAlunoPrevisto[]): Promise<void>;
  cancelAula(id: string, motivo: string, timestamp: string): Promise<void>;
  savePresencaAula(aulaId: string, alunoId: string, presente: boolean, timestamp: string): Promise<{ registro: PresencaAula; created: boolean }>;
  removePresencaAula(aulaId: string, alunoId: string): Promise<void>;
  activateUsuario(id: string, conviteHash: string, senhaHash: string, timestamp: string): Promise<boolean>;
  saveCheckin(aulaId: string, alunoId: string, timestamp: string, ator?: Pick<UsuarioView, 'id'|'perfil'>): Promise<CheckinAula>;
  saveSaldoMensalAluno(alunoId: string, limiteMensal: number | null): Promise<ReturnType<typeof saldoMensal>>;
  saveConfiguracaoAdicionais(input: CondicoesAulaAdicional, usuarioId: string, timestamp: string): Promise<ConfiguracaoAcademia>;
  confirmarAulaAdicional(alunoId: string, aulaId: string, aceite: AceiteAulaAdicional, timestamp: string, ator?: Pick<UsuarioView, 'id'|'perfil'>): Promise<DebitoAula>;
  baixarDebito(id: string, usuarioId: string, dataPagamento: string): Promise<DebitoAula>;
  savePlanoAluno(alunoId: string, input: Pick<PlanoAluno, 'nome' | 'limiteSemanal'>, timestamp: string): Promise<PlanoAluno>;
  saveLiberacaoAula(aulaId: string, alunoId: string, usuarioId: string, motivo: string, timestamp: string): Promise<LiberacaoAula>;
  removeLiberacaoAula(aulaId: string, alunoId: string): Promise<void>;
  close(): Promise<void>;
}
const columns: Record<Table, string[]> = {
  FaixaGraduacao:['id','nome','chave','cor','ordem','situacao','criadoEm','atualizadoEm'],
  GrauFaixa:['id','faixaId','numero','situacao','criadoEm','atualizadoEm'],
  ResponsavelAluno: ['id','alunoId','usuarioId','telefone','parentesco','tipoVinculo','criadoEm','atualizadoEm'],
  EventoAcessoAluno: ['id','alunoId','usuarioId','tipo','detalhes','criadoEm'],
  ComunicadoAluno: ['id','alunoId','destinatarioId','autorId','tipo','titulo','mensagem','resposta','respondidoEm','criadoEm'],
  Aluno: ['id','nome','telefone','email','dataNascimento','faixa','dataMatricula','situacao','criadoEm','limiteAulasMensal','aulasRestantesMes','mesSaldoAulas','possuiCelular','acessoPrincipal','responsabilidadeTransferidaEm','faixaId','grauId'],
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
  ConfiguracaoAcademia: ['id','valorAulaAdicionalCentavos','prazoPagamentoDias','atualizadoEm','atualizadoPorId'],
  DebitoAula: ['id','alunoId','aulaId','motivo','aulaTitulo','dataAula','horaInicio','valorCentavos','prazoPagamentoDias','criadoEm','dataVencimento','statusPagamento','dataPagamento','baixadoPorId','canceladoEm','motivoCancelamento'],
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
    return limparSaldoNulo({ ...record, ...(table === 'Aluno' ? {possuiCelular:Boolean(record.possuiCelular)} : {}), ...(['Presenca', 'PresencaAula'].includes(table) ? { presente: Boolean(record.presente) } : {}) }) as unknown as Tables[K];
  }
  async list<K extends Table>(table: K) { return this.db.prepare(`SELECT * FROM "${table}"`).all().map(row => this.decode(table, row)); }
  async get<K extends Table>(table: K, id: string) { const row = this.db.prepare(`SELECT * FROM "${table}" WHERE id=?`).get(id); return row ? this.decode(table, row) : null; }
  private contextoPlano(alunoId: string): ContextoPlano {
    const list = <K extends Table>(table: K) => this.db.prepare(`SELECT * FROM "${table}"${table === 'Aula' ? '' : ' WHERE alunoId=?'}`).all(...(table === 'Aula' ? [] : [alunoId])).map(row => this.decode(table, row));
    return { plano: list('PlanoAluno')[0] ?? null, aulas: list('Aula'), checkins: list('CheckinAula'), chamada: list('PresencaAula'), antigas: list('Presenca'), liberacoes: list('LiberacaoAula'), debitos: list('DebitoAula') };
  }
  private insertRow<K extends Table>(table: K, row: Tables[K]) {
    const fields = columns[table].filter(key => key in row);
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
      this.db.prepare("UPDATE DebitoAula SET statusPagamento=CASE WHEN statusPagamento='pendente' THEN 'cancelado' ELSE statusPagamento END, canceladoEm=?, motivoCancelamento=? WHERE aulaId=? AND canceladoEm IS NULL").run(timestamp, motivo, id);
      for (const row of this.db.prepare('SELECT alunoId FROM CheckinAula WHERE aulaId=? ORDER BY alunoId').all(id)) this.sincronizarSaldoMensal(String(row.alunoId));
      this.db.exec('COMMIT');
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
      const usuario=this.db.prepare('SELECT * FROM Usuario WHERE id=?').get(id) as unknown as Usuario | undefined;
      if(!usuario || !usuarioHabilitado(usuario,this.db.prepare('SELECT * FROM Aluno').all() as unknown as Aluno[],this.db.prepare('SELECT * FROM ResponsavelAluno').all() as unknown as ResponsavelAluno[])){this.db.exec('COMMIT');return false;}
      const result = this.db.prepare('UPDATE Usuario SET senhaHash=?, conviteHash=NULL, conviteExpiraEm=NULL WHERE id=? AND conviteHash=? AND conviteExpiraEm>?').run(senhaHash, id, conviteHash, timestamp);
      if (result.changes) this.db.prepare('DELETE FROM Sessao WHERE usuarioId=?').run(id);
      this.db.exec('COMMIT'); return result.changes === 1;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async saveCheckin(aulaId: string, alunoId: string, timestamp: string, ator?: Pick<UsuarioView,'id'|'perfil'>) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const aula = this.db.prepare('SELECT * FROM Aula WHERE id=?').get(aulaId) as unknown as Aula | undefined;
      const aluno = this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(alunoId) as unknown as Aluno | undefined;
      validateCheckin(aula, aluno);
      assertAcessoPortal(aluno!, this.db.prepare('SELECT * FROM ResponsavelAluno WHERE alunoId=?').all(alunoId) as unknown as ResponsavelAluno[], ator, true);
      const mensalidades = this.db.prepare('SELECT * FROM Mensalidade WHERE alunoId=?').all(alunoId) as unknown as Mensalidade[];
      assertFinanceiroRegular(mensalidades, alunoId);
      let row = this.db.prepare('SELECT * FROM CheckinAula WHERE aulaId=? AND alunoId=?').get(aulaId, alunoId) as unknown as CheckinAula | undefined;
      if (!row) {
        if (this.db.prepare('SELECT id FROM PresencaAula WHERE aulaId=? AND alunoId=?').get(aulaId, alunoId)) throw new HttpError(409, 'Esta aula já foi avaliada pelo responsável.');
        const contexto = this.contextoPlano(alunoId);
        assertDebitosEmDia(contexto.debitos ?? [], alunoId);
        const adicional = contexto.debitos?.some(item => item.aulaId === aulaId && adicionalAtivo(item));
        if (!adicional) { assertSaldoMensal(saldoMensal(aluno!, contexto.aulas, contexto.checkins, undefined, contexto.debitos)); assertCotaCheckin(contexto, alunoId, aulaId); }
        row = { id: randomUUID(), aulaId, alunoId, nome: aluno!.nome, criadoEm: timestamp };
        this.insertRow('CheckinAula', row);
        this.sincronizarSaldoMensal(alunoId);
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
  private sincronizarSaldoMensal(alunoId: string, limiteMensal?: number | null) {
    const aluno = this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(alunoId) as unknown as Aluno | undefined;
    if (!aluno) throw new HttpError(404, 'Aluno não encontrado.');
    if (limiteMensal !== undefined) aluno.limiteAulasMensal = limiteMensal;
    const ctx = this.contextoPlano(alunoId), saldo = saldoMensal(aluno, ctx.aulas, ctx.checkins, undefined, ctx.debitos), fields = camposSaldo(saldo);
    this.db.prepare('UPDATE Aluno SET limiteAulasMensal=?, aulasRestantesMes=?, mesSaldoAulas=? WHERE id=?')
      .run(fields.limiteAulasMensal, fields.aulasRestantesMes, fields.mesSaldoAulas, alunoId);
    return saldo;
  }
  async saveSaldoMensalAluno(alunoId: string, limiteMensal: number | null) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const saldo = this.sincronizarSaldoMensal(alunoId, limiteMensal); this.db.exec('COMMIT'); return saldo; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async saveConfiguracaoAdicionais(input: CondicoesAulaAdicional, usuarioId: string, timestamp: string) {
    const row: ConfiguracaoAcademia = { id: 'principal', ...input, atualizadoPorId: usuarioId, atualizadoEm: timestamp };
    this.db.prepare('INSERT INTO ConfiguracaoAcademia(id,valorAulaAdicionalCentavos,prazoPagamentoDias,atualizadoEm,atualizadoPorId) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET valorAulaAdicionalCentavos=excluded.valorAulaAdicionalCentavos,prazoPagamentoDias=excluded.prazoPagamentoDias,atualizadoEm=excluded.atualizadoEm,atualizadoPorId=excluded.atualizadoPorId')
      .run(row.id,row.valorAulaAdicionalCentavos,row.prazoPagamentoDias,row.atualizadoEm,row.atualizadoPorId);
    return row;
  }
  async confirmarAulaAdicional(alunoId: string, aulaId: string, aceite: AceiteAulaAdicional, timestamp: string, ator?: Pick<UsuarioView,'id'|'perfil'>) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const aluno = this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(alunoId) as unknown as Aluno | undefined;
      if (!aluno || aluno.situacao !== 'ativo') throw new HttpError(403, 'Cadastro indisponível.');
      assertAcessoPortal(aluno, this.db.prepare('SELECT * FROM ResponsavelAluno WHERE alunoId=?').all(alunoId) as unknown as ResponsavelAluno[], ator);
      const existing = this.db.prepare('SELECT * FROM DebitoAula WHERE alunoId=? AND aulaId=?').get(alunoId,aulaId) as unknown as DebitoAula | undefined;
      if (existing) { if (!adicionalAtivo(existing)) throw new HttpError(409, 'A reserva desta aula foi cancelada.'); this.db.exec('COMMIT'); return existing; }
      assertFinanceiroRegular(this.db.prepare('SELECT * FROM Mensalidade WHERE alunoId=?').all(alunoId) as unknown as Mensalidade[],alunoId);
      if (this.db.prepare('SELECT id FROM PresencaAula WHERE alunoId=? AND aulaId=?').get(alunoId,aulaId)) throw new HttpError(409,'Esta aula já foi avaliada pelo responsável.');
      const contexto = this.contextoPlano(alunoId), aula = this.db.prepare('SELECT * FROM Aula WHERE id=?').get(aulaId) as unknown as Aula | undefined;
      const config = this.db.prepare("SELECT * FROM ConfiguracaoAcademia WHERE id='principal'").get() as unknown as ConfiguracaoAcademia | undefined;
      const debito = novoDebito(aluno,aula,contexto.aulas,contexto.checkins,contexto.debitos ?? [],config ?? condicoesPadrao,aceite,timestamp);
      this.insertRow('DebitoAula',debito); this.db.exec('COMMIT'); return debito;
    } catch(error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async baixarDebito(id: string, usuarioId: string, dataPagamento: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare('SELECT * FROM DebitoAula WHERE id=?').get(id) as unknown as DebitoAula | undefined;
      if (!row) throw new HttpError(404,'Débito não encontrado.');
      if (row.statusPagamento === 'pago') { this.db.exec('COMMIT'); return row; }
      if (!adicionalAtivo(row)) throw new HttpError(409,'O débito desta aula foi cancelado.');
      validarDataBaixa(row,dataPagamento);
      this.db.prepare("UPDATE DebitoAula SET statusPagamento='pago', dataPagamento=?, baixadoPorId=? WHERE id=?").run(dataPagamento,usuarioId,id);
      this.db.exec('COMMIT'); return { ...row, statusPagamento:'pago' as const, dataPagamento, baixadoPorId:usuarioId };
    } catch(error) { this.db.exec('ROLLBACK'); throw error; }
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
  async saveFamilia(acao: AcaoFamiliar) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const aluno = this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(acao.alunoId) as unknown as Aluno | undefined;
      const plano = planejarFamilia({aluno:aluno??null, usuarios:this.db.prepare('SELECT * FROM Usuario').all() as unknown as Usuario[], vinculos:this.db.prepare('SELECT * FROM ResponsavelAluno').all() as unknown as ResponsavelAluno[], alunos:this.db.prepare('SELECT * FROM Aluno').all() as unknown as Aluno[],faixas:this.db.prepare('SELECT * FROM FaixaGraduacao').all() as unknown as FaixaGraduacao[],graus:this.db.prepare('SELECT * FROM GrauFaixa').all() as unknown as GrauFaixa[]},acao);
      for(const item of plano.mutacoes){
        if(!item.update)this.insertRow(item.table,item.row);
        else { const keys=columns[item.table].filter(key=>key!=='id'&&key in item.row);const data=item.row as unknown as Record<string,unknown>;this.db.prepare('UPDATE "'+item.table+'" SET '+keys.map(key=>'"'+key+'"=?').join(',')+' WHERE id=?').run(...keys.map(key=>typeof data[key]==='boolean'?Number(data[key]):data[key]) as (string|number|null)[],item.row.id); }
      }
      for(const id of plano.revogarSessoes)this.db.prepare('DELETE FROM Sessao WHERE usuarioId=?').run(id);
      this.db.exec('COMMIT');return {aluno:plano.aluno,usuarioId:plano.usuarioId};
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  async responderComunicado(id: string, usuarioId: string, resposta: NonNullable<ComunicadoAluno['resposta']>, timestamp: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row=this.db.prepare('SELECT * FROM ComunicadoAluno WHERE id=? AND destinatarioId=?').get(id,usuarioId) as unknown as ComunicadoAluno | undefined;
      const usuario=this.db.prepare('SELECT * FROM Usuario WHERE id=?').get(usuarioId) as unknown as Usuario | undefined;
      if(!row||!usuario||usuario.perfil==='admin')throw new HttpError(404,'Comunicado não encontrado.');
      const aluno=this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(row.alunoId) as unknown as Aluno;
      if(aluno.situacao!=='ativo'||(usuario.perfil==='aluno'&&usuario.alunoId!==aluno.id))throw new HttpError(403,'Cadastro indisponível.');
      assertAcessoPortal(aluno,this.db.prepare('SELECT * FROM ResponsavelAluno WHERE alunoId=?').all(aluno.id) as unknown as ResponsavelAluno[],usuario);
      if(row.resposta&&row.resposta!==resposta)throw new HttpError(409,'Este comunicado já recebeu outra resposta.');
      if(!row.resposta){this.db.prepare('UPDATE ComunicadoAluno SET resposta=?,respondidoEm=? WHERE id=?').run(resposta,timestamp,id);row.resposta=resposta;row.respondidoEm=timestamp;}
      this.db.exec('COMMIT');return row;
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  async savePerfilAluno(usuarioId: string, sessaoId: string, input: PerfilBasicoAluno, senhaHashVerificada?: string) {
    if(!sessaoId)throw new HttpError(401,'Sua sessão terminou. Entre novamente.');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const usuario=this.db.prepare('SELECT * FROM Usuario WHERE id=?').get(usuarioId) as unknown as Usuario | undefined;
      const aluno=usuario?.alunoId?this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(usuario.alunoId) as unknown as Aluno | undefined:undefined;
      const sessao=this.db.prepare('SELECT * FROM Sessao WHERE id=?').get(sessaoId) as unknown as Sessao | undefined;
      const plano=planejarPerfilAluno(usuario??null,aluno??null,sessao??null,input,this.db.prepare('SELECT * FROM Usuario').all() as unknown as Usuario[],this.db.prepare('SELECT * FROM Aluno').all() as unknown as Aluno[],senhaHashVerificada);
      this.db.prepare('UPDATE Aluno SET nome=?,telefone=?,email=? WHERE id=?').run(plano.aluno.nome,plano.aluno.telefone,plano.aluno.email,plano.aluno.id);
      this.db.prepare('UPDATE Usuario SET nome=?,email=?,conviteHash=?,conviteExpiraEm=? WHERE id=?').run(plano.usuario.nome,plano.usuario.email,plano.usuario.conviteHash,plano.usuario.conviteExpiraEm,usuarioId);
      if(plano.emailMudou)this.db.prepare('DELETE FROM Sessao WHERE usuarioId=? AND id<>?').run(usuarioId,sessaoId);
      if(plano.evento)this.insertRow('EventoAcessoAluno',plano.evento);
      this.db.exec('COMMIT');return this.decode('Aluno',plano.aluno);
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  async saveCatalogoGraduacao(acao: AcaoGraduacao) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const faixas=this.db.prepare('SELECT * FROM FaixaGraduacao').all() as unknown as FaixaGraduacao[],graus=this.db.prepare('SELECT * FROM GrauFaixa').all() as unknown as GrauFaixa[],alunos=this.db.prepare('SELECT * FROM Aluno').all() as unknown as Aluno[];
      const old=validarCatalogo(acao,faixas,graus,alunos);
      if(acao.tipo==='excluir')this.db.prepare('DELETE FROM "'+acao.tabela+'" WHERE id=?').run(acao.id);
      else {
        const tabela=acao.tipo==='faixa'?'FaixaGraduacao':'GrauFaixa';
        if(acao.create)this.insertRow(tabela,acao.row);
        else {const row=acao.row as unknown as Record<string,string|number>;const keys=columns[tabela].filter(k=>k!=='id');this.db.prepare('UPDATE "'+tabela+'" SET '+keys.map(k=>'"'+k+'"=?').join(',')+' WHERE id=?').run(...keys.map(k=>row[k]),acao.row.id);}
        if(acao.tipo==='faixa'&&old&&old.nome!==acao.row.nome)this.db.prepare('UPDATE Aluno SET faixa=?,faixaId=? WHERE faixaId=? OR (faixaId IS NULL AND faixa=?)').run(acao.row.nome,acao.row.id,acao.row.id,old.nome);
      }
      this.db.exec('COMMIT');
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  async saveCadastroAluno(aluno: Aluno, create: boolean) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const old=this.db.prepare('SELECT * FROM Aluno WHERE id=?').get(aluno.id) as unknown as Aluno | undefined;
      if(!create&&!old)throw new HttpError(404,'Aluno não encontrado.');
      const row={...aluno,...graduacaoValida(aluno,this.db.prepare('SELECT * FROM FaixaGraduacao').all() as unknown as FaixaGraduacao[],this.db.prepare('SELECT * FROM GrauFaixa').all() as unknown as GrauFaixa[],old)};
      if(create)this.insertRow('Aluno',row);
      else {const keys=columns.Aluno.filter(k=>k!=='id'&&k in row),data=row as unknown as Record<string,unknown>;this.db.prepare('UPDATE Aluno SET '+keys.map(k=>'"'+k+'"=?').join(',')+' WHERE id=?').run(...keys.map(k=>typeof data[k]==='boolean'?Number(data[k]):data[k]) as (string|number|null)[],row.id);}
      this.db.exec('COMMIT');return this.decode('Aluno',row);
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  async close() { this.db.close(); }
}

async function contextoPlanoPrisma(client: Prisma.TransactionClient, alunoId: string): Promise<ContextoPlano> {
  const [plano, aulas, checkins, chamada, antigas, liberacoes, debitos] = await Promise.all([
    client.planoAluno.findUnique({ where: { alunoId } }), client.aula.findMany(), client.checkinAula.findMany({ where: { alunoId } }),
    client.presencaAula.findMany({ where: { alunoId } }), client.presenca.findMany({ where: { alunoId } }), client.liberacaoAula.findMany({ where: { alunoId } }),
    client.debitoAula.findMany({ where: { alunoId } }),
  ]);
  return { plano, aulas: aulas as Aula[], checkins, chamada, antigas, liberacoes, debitos:debitos as DebitoAula[] };
}
type Delegate = {
  findMany(args?: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};
async function sincronizarSaldoPrisma(client: Prisma.TransactionClient, alunoId: string, limiteMensal?: number | null) {
  const [aluno] = await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
  if (!aluno) throw new HttpError(404, 'Aluno não encontrado.');
  if (limiteMensal !== undefined) aluno.limiteAulasMensal = limiteMensal;
  const [aulas, checkins, debitos] = await Promise.all([client.aula.findMany(), client.checkinAula.findMany({ where: { alunoId } }), client.debitoAula.findMany({ where: { alunoId } })]);
  const saldo = saldoMensal(aluno, aulas as Aula[], checkins, undefined, debitos as DebitoAula[]);
  await client.aluno.update({ where: { id: alunoId }, data: camposSaldo(saldo) });
  return saldo;
}
export class PrismaRepository implements Repository {
  kind = 'supabase' as const;
  private client: PrismaClient;
  constructor(url: string) { this.client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }); }
  private delegate(table: Table): Delegate { const name = table[0].toLowerCase() + table.slice(1); return (this.client as unknown as Record<string, Delegate>)[name]; }
  async list<K extends Table>(table: K) { return (await this.delegate(table).findMany() as Tables[K][]).map(limparSaldoNulo); }
  async get<K extends Table>(table: K, id: string) { return limparSaldoNulo(await this.delegate(table).findUnique({ where: { id } }) as Tables[K] | null); }
  async insert<K extends Table>(table: K, row: Tables[K]) { return limparSaldoNulo(await this.delegate(table).create({ data: row }) as Tables[K]); }
  async update<K extends Table>(table: K, id: string, row: Partial<Tables[K]>) { return limparSaldoNulo(await this.delegate(table).update({ where: { id }, data: row }) as Tables[K]); }
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
      await client.debitoAula.updateMany({ where: { aulaId:id, statusPagamento:'pendente', canceladoEm:null }, data:{statusPagamento:'cancelado',canceladoEm:timestamp,motivoCancelamento:motivo} });
      await client.debitoAula.updateMany({ where: { aulaId:id,canceladoEm:null }, data:{canceladoEm:timestamp,motivoCancelamento:motivo} });
      const checkins = await client.checkinAula.findMany({ where: { aulaId: id }, orderBy: { alunoId: 'asc' } });
      for (const item of checkins) await sincronizarSaldoPrisma(client, item.alunoId);
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
      const usuario=await client.usuario.findUnique({where:{id}});
      if(!usuario||!usuarioHabilitado(usuario as Usuario,await client.aluno.findMany() as Aluno[],await client.responsavelAluno.findMany() as ResponsavelAluno[]))return false;
      const result = await client.usuario.updateMany({ where: { id, conviteHash, conviteExpiraEm: { gt: timestamp } }, data: { senhaHash, conviteHash: null, conviteExpiraEm: null } });
      if (result.count) await client.sessao.deleteMany({ where: { usuarioId: id } });
      return result.count === 1;
    });
  }
  async saveCheckin(aulaId: string, alunoId: string, timestamp: string, ator?: Pick<UsuarioView,'id'|'perfil'>) {
    return this.client.$transaction(async client => {
      const [aula] = await client.$queryRaw<Aula[]>`SELECT * FROM "Aula" WHERE id=${aulaId}::uuid FOR UPDATE`;
      const [aluno] = await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      validateCheckin(aula, aluno);
      assertAcessoPortal(aluno, await client.responsavelAluno.findMany({where:{alunoId}}) as ResponsavelAluno[], ator, true);
      assertFinanceiroRegular(await client.mensalidade.findMany({ where: { alunoId } }), alunoId);
      const existing = await client.checkinAula.findUnique({ where: { aulaId_alunoId: { aulaId, alunoId } } });
      if (existing) return existing;
      if (await client.presencaAula.findUnique({ where: { aulaId_alunoId: { aulaId, alunoId } } })) throw new HttpError(409, 'Esta aula já foi avaliada pelo responsável.');
      const contexto = await contextoPlanoPrisma(client, alunoId);
      assertDebitosEmDia(contexto.debitos ?? [],alunoId);
      const adicional = contexto.debitos?.some(item => item.aulaId === aulaId && adicionalAtivo(item));
      if (!adicional) { assertSaldoMensal(saldoMensal(aluno, contexto.aulas, contexto.checkins, undefined, contexto.debitos)); assertCotaCheckin(contexto, alunoId, aulaId); }
      const checkin = await client.checkinAula.create({ data: { id: randomUUID(), aulaId, alunoId, nome: aluno.nome, criadoEm: timestamp } });
      await sincronizarSaldoPrisma(client, alunoId);
      return checkin;
    });
  }
  async savePlanoAluno(alunoId: string, input: Pick<PlanoAluno, 'nome' | 'limiteSemanal'>, timestamp: string) {
    return this.client.$transaction(async client => {
      const rows = await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      if (!rows.length) throw new HttpError(404, 'Aluno não encontrado.');
      return client.planoAluno.upsert({ where: { alunoId }, create: { id: randomUUID(), alunoId, ...input, criadoEm: timestamp, atualizadoEm: timestamp }, update: { ...input, atualizadoEm: timestamp } });
    });
  }
  async saveSaldoMensalAluno(alunoId: string, limiteMensal: number | null) {
    return this.client.$transaction(client => sincronizarSaldoPrisma(client, alunoId, limiteMensal));
  }
  async saveConfiguracaoAdicionais(input: CondicoesAulaAdicional, usuarioId: string, timestamp: string) {
    const data = { ...input, atualizadoPorId:usuarioId, atualizadoEm:timestamp };
    return this.client.configuracaoAcademia.upsert({where:{id:'principal'},create:{id:'principal',...data},update:data});
  }
  async confirmarAulaAdicional(alunoId: string, aulaId: string, aceite: AceiteAulaAdicional, timestamp: string, ator?: Pick<UsuarioView,'id'|'perfil'>) {
    return this.client.$transaction(async client => {
      const [aula] = await client.$queryRaw<Aula[]>`SELECT * FROM "Aula" WHERE id=${aulaId}::uuid FOR UPDATE`;
      const [aluno] = await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${alunoId}::uuid FOR UPDATE`;
      if (!aluno || aluno.situacao !== 'ativo') throw new HttpError(403,'Cadastro indisponível.');
      assertAcessoPortal(aluno, await client.responsavelAluno.findMany({where:{alunoId}}) as ResponsavelAluno[], ator);
      const existing = await client.debitoAula.findUnique({where:{alunoId_aulaId:{alunoId,aulaId}}});
      if (existing) {if(!adicionalAtivo(existing as DebitoAula))throw new HttpError(409,'A reserva desta aula foi cancelada.');return existing as DebitoAula;}
      assertFinanceiroRegular(await client.mensalidade.findMany({where:{alunoId}}),alunoId);
      if(await client.presencaAula.findUnique({where:{aulaId_alunoId:{aulaId,alunoId}}}))throw new HttpError(409,'Esta aula já foi avaliada pelo responsável.');
      const contexto = await contextoPlanoPrisma(client,alunoId), config = await client.configuracaoAcademia.findUnique({where:{id:'principal'}});
      const debito = novoDebito(aluno,aula,contexto.aulas,contexto.checkins,contexto.debitos ?? [],config ?? condicoesPadrao,aceite,timestamp);
      return await client.debitoAula.create({data:debito}) as DebitoAula;
    });
  }
  async baixarDebito(id: string, usuarioId: string, dataPagamento: string) {
    return this.client.$transaction(async client => {
      const [row] = await client.$queryRaw<DebitoAula[]>`SELECT * FROM "DebitoAula" WHERE id=${id}::uuid FOR UPDATE`;
      if(!row)throw new HttpError(404,'Débito não encontrado.');
      if(row.statusPagamento==='pago')return row;
      if(!adicionalAtivo(row))throw new HttpError(409,'O débito desta aula foi cancelado.');
      validarDataBaixa(row,dataPagamento);
      return await client.debitoAula.update({where:{id},data:{statusPagamento:'pago',dataPagamento,baixadoPorId:usuarioId}}) as DebitoAula;
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
  async saveFamilia(acao: AcaoFamiliar) {
    return this.client.$transaction(async client=>{
      // Serializa alterações familiares, inclusive quando irmãos compartilham o mesmo e-mail de responsável.
      await client.$executeRaw`SELECT pg_advisory_xact_lock(74192501)`;
      const [aluno]=await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${acao.alunoId}::uuid FOR UPDATE`;
      const [usuarios,vinculos,alunos]=await Promise.all([client.usuario.findMany(),client.responsavelAluno.findMany(),client.aluno.findMany()]);
      const plano=planejarFamilia({aluno:aluno??null,usuarios:usuarios as Usuario[],vinculos:vinculos as ResponsavelAluno[],alunos:alunos as Aluno[],faixas:await client.faixaGraduacao.findMany() as FaixaGraduacao[],graus:await client.grauFaixa.findMany() as GrauFaixa[]},acao);
      for(const item of plano.mutacoes){const delegate=(client as unknown as Record<string,Delegate>)[item.table[0].toLowerCase()+item.table.slice(1)];if(item.update)await delegate.update({where:{id:item.row.id},data:item.row});else await delegate.create({data:item.row});}
      if(plano.revogarSessoes.length)await client.sessao.deleteMany({where:{usuarioId:{in:plano.revogarSessoes}}});
      return {aluno:plano.aluno,usuarioId:plano.usuarioId};
    });
  }
  async responderComunicado(id: string, usuarioId: string, resposta: NonNullable<ComunicadoAluno['resposta']>, timestamp: string) {
    return this.client.$transaction(async client=>{
      const [row]=await client.$queryRaw<ComunicadoAluno[]>`SELECT * FROM "ComunicadoAluno" WHERE id=${id}::uuid AND "destinatarioId"=${usuarioId}::uuid FOR UPDATE`;
      const usuario=await client.usuario.findUnique({where:{id:usuarioId}});
      if(!row||!usuario||usuario.perfil==='admin')throw new HttpError(404,'Comunicado não encontrado.');
      const [aluno]=await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${row.alunoId}::uuid FOR UPDATE`;
      if(aluno.situacao!=='ativo'||(usuario.perfil==='aluno'&&usuario.alunoId!==aluno.id))throw new HttpError(403,'Cadastro indisponível.');
      assertAcessoPortal(aluno,await client.responsavelAluno.findMany({where:{alunoId:aluno.id}}) as ResponsavelAluno[],usuario as Usuario);
      if(row.resposta){if(row.resposta!==resposta)throw new HttpError(409,'Este comunicado já recebeu outra resposta.');return row;}
      return await client.comunicadoAluno.update({where:{id},data:{resposta,respondidoEm:timestamp}}) as ComunicadoAluno;
    });
  }
  async savePerfilAluno(usuarioId: string, sessaoId: string, input: PerfilBasicoAluno, senhaHashVerificada?: string) {
    if(!sessaoId)throw new HttpError(401,'Sua sessão terminou. Entre novamente.');
    return this.client.$transaction(async client=>{
      const inicial=await client.usuario.findUnique({where:{id:usuarioId}});
      const [aluno]=inicial?.alunoId?await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${inicial.alunoId}::uuid FOR UPDATE`:[];
      const [usuario]=await client.$queryRaw<Usuario[]>`SELECT * FROM "Usuario" WHERE id=${usuarioId}::uuid FOR UPDATE`;
      const sessao=await client.sessao.findUnique({where:{id:sessaoId}});
      const [usuarios,alunos]=await Promise.all([client.usuario.findMany(),client.aluno.findMany()]);
      const plano=planejarPerfilAluno(usuario??null,aluno??null,sessao,input,usuarios as Usuario[],alunos as Aluno[],senhaHashVerificada);
      await client.aluno.update({where:{id:plano.aluno.id},data:{nome:plano.aluno.nome,telefone:plano.aluno.telefone,email:plano.aluno.email}});
      await client.usuario.update({where:{id:usuarioId},data:{nome:plano.usuario.nome,email:plano.usuario.email,conviteHash:plano.usuario.conviteHash,conviteExpiraEm:plano.usuario.conviteExpiraEm}});
      if(plano.emailMudou)await client.sessao.deleteMany({where:{usuarioId,id:{not:sessaoId}}});
      if(plano.evento)await client.eventoAcessoAluno.create({data:plano.evento});
      return limparSaldoNulo(plano.aluno);
    });
  }
  async saveCatalogoGraduacao(acao: AcaoGraduacao) {
    await this.client.$transaction(async client=>{
      await client.$executeRaw`SELECT pg_advisory_xact_lock(74192502)`;
      const [faixas,graus,alunos]=await Promise.all([client.faixaGraduacao.findMany(),client.grauFaixa.findMany(),client.aluno.findMany()]);
      const old=validarCatalogo(acao,faixas as FaixaGraduacao[],graus as GrauFaixa[],alunos as Aluno[]);
      if(acao.tipo==='excluir'){const d=(client as unknown as Record<string,Delegate>)[acao.tabela==='FaixaGraduacao'?'faixaGraduacao':'grauFaixa'];await d.delete({where:{id:acao.id}});}
      else {const d=(client as unknown as Record<string,Delegate>)[acao.tipo==='faixa'?'faixaGraduacao':'grauFaixa'];if(acao.create)await d.create({data:acao.row});else await d.update({where:{id:acao.row.id},data:acao.row});
        if(acao.tipo==='faixa'&&old&&old.nome!==acao.row.nome)await client.aluno.updateMany({where:{OR:[{faixaId:acao.row.id},{faixaId:null,faixa:old.nome}]},data:{faixa:acao.row.nome,faixaId:acao.row.id}});
      }
    });
  }
  async saveCadastroAluno(aluno: Aluno, create: boolean) {
    return this.client.$transaction(async client=>{
      const [old]=await client.$queryRaw<Aluno[]>`SELECT * FROM "Aluno" WHERE id=${aluno.id}::uuid FOR UPDATE`;
      if(!create&&!old)throw new HttpError(404,'Aluno não encontrado.');
      const [faixas,graus]=await Promise.all([client.faixaGraduacao.findMany(),client.grauFaixa.findMany()]);
      const row={...aluno,...graduacaoValida(aluno,faixas as FaixaGraduacao[],graus as GrauFaixa[],old)};
      return limparSaldoNulo(await (create?client.aluno.create({data:row}):client.aluno.update({where:{id:row.id},data:row})) as Aluno);
    });
  }
  async close() { await this.client.$disconnect(); }
}
export function createRepository(): Repository { return process.env.DATABASE_URL ? new PrismaRepository(process.env.DATABASE_URL) : new SqliteRepository(); }
