import { it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { migrateSqlite, sqliteMigrations } from './database/sqlite/migrate.js';

function bancoAnterior(){
  const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');migrateSqlite(db,undefined,sqliteMigrations.slice(0,8));
  const aluno=randomUUID(),admin=randomUUID(),user=randomUUID(),turma=randomUUID(),horario=randomUUID(),aula=randomUUID(),now=new Date().toISOString();
  const insert=(table:string,row:Record<string,unknown>)=>db.prepare('INSERT INTO "'+table+'" ('+Object.keys(row).map(c=>'"'+c+'"').join(',')+') VALUES('+Object.keys(row).map(()=>'?').join(',')+')').run(...Object.values(row) as (string|number|null)[]);
  insert('Aluno',{id:aluno,nome:'Histórico preservado',telefone:'11900000000',email:'historico@teste.invalid',dataNascimento:'2010-01-01',faixa:'Branca',dataMatricula:'2020-01-01',situacao:'ativo',criadoEm:now,limiteAulasMensal:8,aulasRestantesMes:7,mesSaldoAulas:'2026-10'});
  for(const [id,perfil,alunoId] of [[admin,'admin',null],[user,'aluno',aluno]])insert('Usuario',{id,nome:'Conta preservada',email:id+'@teste.invalid',perfil,alunoId,senhaHash:'hash-preservado',conviteHash:id,conviteExpiraEm:'2099-01-01',criadoEm:now});
  insert('Sessao',{id:randomUUID(),usuarioId:user,tokenHash:'sessao-preservada',credencialHash:'credencial-preservada',expiraEm:'2099-01-01',criadoEm:now});
  insert('Turma',{id:turma,nome:'Turma',professor:'Professor',situacao:'ativo',criadoEm:now,atualizadoEm:now});
  insert('HorarioTurma',{id:horario,turmaId:turma,diaSemana:1,horaInicio:'12:00',horaFim:'13:00'});
  insert('AlunoTurma',{id:randomUUID(),turmaId:turma,alunoId:aluno,criadoEm:now});
  insert('Aula',{id:aula,titulo:'Aula',dataAula:'2026-10-20',horaInicio:'12:00',horaFim:'13:00',professor:'Professor',origem:'grade',origemHorarioId:horario,turmaId:turma,turmaNome:'Turma',situacao:'agendada',motivoCancelamento:null,canceladaEm:null,criadoEm:now});
  insert('AulaAlunoPrevisto',{id:randomUUID(),aulaId:aula,alunoId:aluno,nome:'Histórico preservado'});
  insert('PresencaAula',{id:randomUUID(),aulaId:aula,alunoId:aluno,nome:'Histórico preservado',presente:1,criadoEm:now,atualizadoEm:now});
  insert('CheckinAula',{id:randomUUID(),aulaId:aula,alunoId:aluno,nome:'Histórico preservado',criadoEm:now});
  insert('Mensalidade',{id:randomUUID(),alunoId:aluno,competencia:'2026-10',valorCentavos:15000,dataVencimento:'2026-10-10',dataPagamento:'2026-10-10',criadoEm:now});
  insert('Presenca',{id:randomUUID(),alunoId:aluno,dataTreino:'2026-10-19',tipoTreino:'Com kimono',presente:1});
  insert('Analise',{id:randomUUID(),pergunta:'Pergunta',resposta:'Resposta',modelo:'fixture',usuario:'Admin',metricas:'{}',criadoEm:now});
  insert('PlanoAluno',{id:randomUUID(),alunoId:aluno,nome:'Plano',limiteSemanal:3,criadoEm:now,atualizadoEm:now});
  insert('LiberacaoAula',{id:randomUUID(),aulaId:aula,alunoId:aluno,motivo:'Autorização preservada',usuarioId:admin,criadoEm:now});
  insert('ConfiguracaoAcademia',{id:'principal',valorAulaAdicionalCentavos:2500,prazoPagamentoDias:3,atualizadoEm:now,atualizadoPorId:admin});
  insert('DebitoAula',{id:randomUUID(),alunoId:aluno,aulaId:aula,motivo:'Débito preservado',aulaTitulo:'Aula',dataAula:'2026-10-20',horaInicio:'12:00',valorCentavos:2500,prazoPagamentoDias:3,criadoEm:now,dataVencimento:'2026-10-23',statusPagamento:'pago',dataPagamento:'2026-10-20',baixadoPorId:admin,canceladoEm:null,motivoCancelamento:null});
  return {db,aluno};
}
function snapshot(db:DatabaseSync){
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name<>'_tatame_migrations' ORDER BY name").all().map(r=>String(r.name));
  const columns=Object.fromEntries(tables.map(t=>[t,db.prepare(`PRAGMA table_info("${t}")`).all().map(c=>'"'+c.name+'"').join(',')]));
  return (target:DatabaseSync)=>tables.map(t=>target.prepare(`SELECT ${columns[t]} FROM "${t}" ORDER BY id`).all());
}
it('migração 9 preserva todas as 17 tabelas, inclusive sessões, convites, configurações e baixas',()=>{
  const {db,aluno}=bancoAnterior();try{
    const read=snapshot(db),before=read(db);assert.equal(before.length,17);
    assert.deepEqual(migrateSqlite(db).applied,[9,10,11]);assert.deepEqual(read(db),before);
    assert.deepEqual({...db.prepare('SELECT possuiCelular,acessoPrincipal,responsabilidadeTransferidaEm FROM Aluno WHERE id=?').get(aluno)},{possuiCelular:1,acessoPrincipal:'aluno',responsabilidadeTransferidaEm:null});
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.equal(db.prepare('PRAGMA foreign_keys').get()!.foreign_keys,1);
    assert.throws(()=>db.prepare('DELETE FROM Usuario WHERE perfil=?').run('admin'),/FOREIGN KEY/);
    assert.deepEqual(migrateSqlite(db).applied,[]);
  }finally{db.close();}
});
it('falha na reconstrução do usuário desfaz a migração inteira e restaura as chaves estrangeiras',()=>{
  const {db}=bancoAnterior();try{
    const read=snapshot(db),before=read(db);
    const broken=[...sqliteMigrations.slice(0,8),{...sqliteMigrations[8],sql:sqliteMigrations[8].sql+'\nINSERT INTO TabelaInexistente VALUES (1);'},sqliteMigrations[9]];
    assert.throws(()=>migrateSqlite(db,undefined,broken),/Migração SQLite interrompida/);
    assert.deepEqual(read(db),before);assert.equal(db.prepare('SELECT MAX(version) v FROM _tatame_migrations').get()!.v,8);
    assert.equal(db.prepare('PRAGMA foreign_keys').get()!.foreign_keys,1);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
    assert.deepEqual(migrateSqlite(db).applied,[9,10,11]);
  }finally{db.close();}
});
