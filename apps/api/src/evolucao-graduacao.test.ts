import { it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import supertest from 'supertest';
import { SqliteRepository } from './repository.js';
import { createApp, request } from './test-auth-helper.js';
import { today } from './domain.js';
import { tokenHash } from './modules/auth/password.js';
import { ADMIN_INICIAL_ID } from './modules/auth/routes.js';
import { contextoEvolucao, progressoGraduacao } from './modules/graduacoes/evolucao.js';
import { migrateSqlite, sqliteMigrations } from './database/sqlite/migrate.js';
import type { ProgressoGraduacao, RegraGraduacaoInput, Aula } from '@tatame/shared';

async function fixture(config:Partial<RegraGraduacaoInput>={},inicio='2020-01-01'){
  const repo=new SqliteRepository(':memory:'),app=createApp(repo),now=new Date().toISOString(),token='e'.repeat(43),usuarioId=randomUUID();
  const faixas=await repo.list('FaixaGraduacao'),branca=faixas.find(f=>f.nome==='Branca')!,azul=faixas.find(f=>f.nome==='Azul')!;
  const regra:RegraGraduacaoInput={aulasPorGrau:30,mesesPorGrau:null,grausParaFaixa:4,mesesMinimosFaixa:0,proximaFaixaId:azul.id,...config};
  await request(app).put(`/api/graduacoes/faixas/${branca.id}/regra`).send(regra).expect(200);
  const cadastro={nome:'Aluno evolução fictício',email:'evolucao@teste.invalid',telefone:'11900000000',dataNascimento:'2000-01-01',dataMatricula:'2020-01-01',situacao:'ativo'};
  const aluno=(await request(app).post('/api/alunos').send(cadastro).expect(201)).body;
  const zero=(await repo.list('GrauFaixa')).find(g=>g.faixaId===branca.id&&g.numero===0)!;
  const path=`/api/alunos/${aluno.id}/graduacao`;
  const setup=(versao:number,changes={})=>request(app).post(path).send({tipo:'ajuste',versao,faixaId:branca.id,grauId:zero.id,dataInicioFaixa:inicio,aulasAnteriores:0,motivo:'Graduação inicial conferida pelo mestre.',...changes});
  await setup(0).expect(200);
  await repo.insert('Usuario',{id:usuarioId,alunoId:aluno.id,nome:aluno.nome,email:aluno.email,perfil:'aluno',senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now});
  await repo.insert('Sessao',{id:randomUUID(),usuarioId,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture'),expiraEm:'2099-01-01T00:00:00.000Z',criadoEm:now});
  const auth={Cookie:'tatame_sessao='+token,'X-Tatame-Request':'1'};
  const get=async()=>(await request(app).get(path).expect(200)).body as ProgressoGraduacao;
  const promover=async(tipo:'grau'|'faixa',status=200)=>{const p=await get();return request(app).post(path).send({tipo,versao:p.estado!.versao,regraAssinatura:p.regraAssinatura}).expect(status);};
  const marcar=async(quantidade:number,presente=true,dataAula=today())=>{const aulas:Aula[]=[];for(let i=0;i<quantidade;i++){const aula:Aula={id:randomUUID(),titulo:'Aula confirmada',professor:'Mestre',dataAula,horaInicio:'12:00',horaFim:'13:00',origem:'grade',origemHorarioId:randomUUID(),turmaId:null,turmaNome:null,situacao:'agendada',motivoCancelamento:null,canceladaEm:null,criadoEm:now};await repo.createAula(aula,[]);await repo.savePresencaAula(aula.id,aluno.id,presente,now);aulas.push(aula);}return aulas;};
  return{repo,app,aluno,cadastro,path,branca,azul,regra,zero,auth,get,promover,marcar,setup,now};
}
it('ajuste manual registra graus padrão sem regra prévia e mantém a contagem de aulas separada',async()=>{
  const repo = new SqliteRepository(':memory:');
  try {
    const app = createApp(repo);
    const aluno = (await request(app).post('/api/alunos').send({
      nome:'Aluno graduação manual',email:'manual@teste.invalid',telefone:'11900000000',
      dataNascimento:'2000-01-01',dataMatricula:'2020-01-01',situacao:'ativo',
    }).expect(201)).body;
    const path = `/api/alunos/${aluno.id}/graduacao`;
    const faixas = await repo.list('FaixaGraduacao');
    const ajustar = (faixaId:string, grauNumero:number, versao:number, grauId:string|null=null) =>
      request(app).post(path).send({tipo:'ajuste',versao,faixaId,grauId,grauNumero,dataInicioFaixa:'2020-01-01',aulasAnteriores:120});

    const branca = faixas.find(f=>f.nome==='Branca')!;
    const preta = faixas.find(f=>f.nome==='Adulto Faixa Preta')!;
    const primeira = await ajustar(branca.id,4,0).expect(200);
    assert.equal(primeira.body.grauAtual,4);
    assert.equal(primeira.body.aulasTotal,120);
    assert.equal(primeira.body.historico[0].grauNovo,4);
    await ajustar(branca.id,5,1).expect(400);
    await ajustar(branca.id,4,1).expect(200);
    assert.equal((await repo.list('GrauFaixa')).filter(g=>g.faixaId===branca.id&&g.numero===4).length,1);

    const avancada = await ajustar(preta.id,6,2).expect(200);
    assert.equal(avancada.body.grauAtual,6);
    assert.equal(avancada.body.metaGrau,null);
    await ajustar(preta.id,7,3).expect(400);
    const historico = (await request(app).get(path).expect(200)).body.historico;
    assert.equal(historico.length,3);
    assert.equal((await repo.list('RegraGraduacao')).length,0);
  } finally { await repo.close(); }
});

it('30 presenças por grau levam a 4 graus em 120 aulas e exigem confirmação do mestre',async()=>{
  const f=await fixture();try{
    await f.marcar(29);assert.equal((await f.get()).metaGrau!.aulasRestantes,1);await f.promover('grau',409);
    for(let grau=1;grau<=4;grau++){
      await f.marcar(grau===1?1:30);const p=await f.get();assert.equal(p.metaGrau!.apto,true);assert.equal(p.grauAtual,grau-1);
      const r=await f.promover('grau');assert.equal(r.body.grauAtual,grau);
    }
    const p=await f.get();assert.equal(p.aulasTotal,120);assert.equal(p.metaGrau,null);assert.equal(p.proximoGrau,null);await f.promover('grau',409);assert.equal(p.metaFaixa!.apto,true);assert.equal((await f.repo.get('Aluno',f.aluno.id))!.faixa,'Branca');
    const r=await f.promover('faixa');assert.equal(r.body.faixa,'Azul');assert.equal(r.body.aulasTotal,0);assert.equal(r.body.historico.filter((e:{tipo:string})=>e.tipo==='grau').length,4);
    const antiga=(await f.repo.list('PresencaAula'))[0];await f.repo.removePresencaAula(antiga.aulaId,f.aluno.id);await f.repo.savePresencaAula(antiga.aulaId,f.aluno.id,true,f.now);assert.equal((await f.get()).aulasTotal,0,'recriar marcação antiga não reutiliza a aula na nova faixa');
    await f.marcar(1);assert.equal((await f.get()).aulasTotal,1,'presença nova do mesmo dia conta sem recontar as 120 usadas');
  }finally{await f.repo.close();}
});
it('check-in, ausência, aula cancelada e registros anteriores ao início não contam como presença de graduação',async()=>{
  const f=await fixture({},today());try{
    const [a]=await f.marcar(1,false);await f.repo.removePresencaAula(a.id,f.aluno.id);await f.repo.saveCheckin(a.id,f.aluno.id,f.now);await f.marcar(1,false);
    await f.marcar(1,true,'2020-01-01');const [cancelada]=await f.marcar(1);
    await f.repo.update('Aula',cancelada.id,{situacao:'cancelada',motivoCancelamento:'Importação histórica cancelada',canceladaEm:f.now});
    await f.repo.insert('Presenca',{id:randomUUID(),alunoId:f.aluno.id,dataTreino:today(),tipoTreino:'Com kimono',presente:true});
    assert.equal((await f.get()).aulasTotal,0);const [valida]=await f.marcar(1);assert.equal((await f.get()).aulasTotal,1);
    await f.repo.savePresencaAula(valida.id,f.aluno.id,true,f.now);assert.equal((await f.get()).aulasTotal,1);
  }finally{await f.repo.close();}
});
it('regra sem campos de tempo usa somente aulas e rejeita reintrodução de espera por meses',async()=>{
  const f=await fixture();try{
    const body={aulasPorGrau:1};
    await request(f.app).put(`/api/graduacoes/faixas/${f.branca.id}/regra`).send(body).expect(200);
    const regra=(await f.repo.list('RegraGraduacao'))[0];assert.equal(regra.mesesPorGrau,null);assert.equal(regra.mesesMinimosFaixa,0);
    for(const change of [{mesesPorGrau:6},{mesesMinimosFaixa:24}])await request(f.app).put(`/api/graduacoes/faixas/${f.branca.id}/regra`).send({...body,...change}).expect(400);
    await f.setup((await f.get()).estado!.versao,{dataInicioFaixa:today()}).expect(200);
    await f.marcar(4);assert.equal((await f.get()).metaGrau!.apto,true);for(let grau=0;grau<4;grau++)await f.promover('grau');
    assert.equal((await f.get()).metaFaixa!.apto,true);await f.promover('faixa');assert.equal((await f.get()).faixa,'Azul');
  }finally{await f.repo.close();}
});
it('tempos antigos não criam bloqueio invisível e histórico permanece preservado',async()=>{
  const f=await fixture({aulasPorGrau:1},today());try{
    const antiga=(await f.repo.list('RegraGraduacao'))[0];await f.repo.update('RegraGraduacao',antiga.id,{mesesPorGrau:6,mesesMinimosFaixa:24,grausParaFaixa:1});
    const historico=await f.repo.list('EventoGraduacao');await f.marcar(4);
    let p=await f.get();assert.equal(p.metaGrau!.apto,true);assert.equal(p.metaGrau!.dataMinima,'');assert.deepEqual(await f.repo.list('EventoGraduacao'),historico);
    for(let grau=0;grau<4;grau++)await f.promover('grau');p=await f.get();assert.equal(p.metaFaixa!.apto,true);await f.promover('faixa');
    assert.equal((await f.repo.get('RegraGraduacao',antiga.id))!.mesesPorGrau,6);assert.equal((await f.get()).faixa,'Azul');
  }finally{await f.repo.close();}
});
it('grau/faixa só mudam na ficha; edição comum preserva graduação e não aceita troca disfarçada',async()=>{
  const f=await fixture();try{
    await request(f.app).put('/api/alunos/'+f.aluno.id).send({...f.cadastro,nome:'Contato atualizado'}).expect(200);
    await request(f.app).put('/api/alunos/'+f.aluno.id).send({...f.cadastro,faixa:'Azul'}).expect(409);
    await f.repo.saveCadastroAluno({...f.aluno,nome:'Outra edição',faixa:'Azul',faixaId:f.azul.id,grauId:null},false);
    assert.equal((await f.repo.get('Aluno',f.aluno.id))!.faixaId,f.branca.id);
  }finally{await f.repo.close();}
});
it('presenças removidas/corrigidas recalculam progresso sem reverter promoções já registradas',async()=>{
  const f=await fixture({aulasPorGrau:1});try{
    const [a]=await f.marcar(1);await f.promover('grau');await f.repo.savePresencaAula(a.id,f.aluno.id,false,f.now);
    const p=await f.get();assert.equal(p.aulasTotal,0);assert.equal(p.grauAtual,1);assert.equal(p.historico.filter(e=>e.tipo==='grau').length,1);
  }finally{await f.repo.close();}
});
it('aluno vê somente a própria trajetória e sinaliza uma vez por graduação sem conseguir se promover',async()=>{
  const f=await fixture({aulasPorGrau:1});try{
    await supertest(f.app).post('/api/portal/graduacao/solicitacao').set(f.auth).send({versao:1}).expect(409);
    await f.marcar(1);const p=(await supertest(f.app).get('/api/portal/graduacao').set(f.auth).expect(200)).body;assert.equal(p.alunoId,f.aluno.id);assert.equal(p.metaGrau.apto,true);
    await Promise.all([1,2,3].map(()=>supertest(f.app).post('/api/portal/graduacao/solicitacao').set(f.auth).send({versao:1}).expect(200)));
    assert.equal((await f.repo.list('EventoGraduacao')).filter(e=>e.tipo==='solicitacao').length,1);
    const lista=(await request(f.app).get('/api/graduacoes/pendencias').expect(200)).body;assert.equal(lista[0].solicitacaoPendente,true);
    await supertest(f.app).post(f.path).set(f.auth).send({tipo:'grau',versao:1,regraAssinatura:p.regraAssinatura}).expect(403);
    await supertest(f.app).get(`/api/alunos/${randomUUID()}/graduacao`).set(f.auth).expect(403);
    await supertest(f.app).get('/api/graduacoes/pendencias').set(f.auth).expect(403);
    await supertest(f.app).post('/api/portal/graduacao/solicitacao').set(f.auth).send({versao:1,alunoId:randomUUID()}).expect(400);
    await f.promover('grau');assert.equal((await f.get()).solicitacaoPendente,false);
  }finally{await f.repo.close();}
});
it('concorrência e formulário desatualizado não duplicam graus; regra alterada exige nova confirmação',async()=>{
  const f=await fixture({aulasPorGrau:1});try{
    await f.marcar(10);const p=await f.get(),body={tipo:'grau',versao:1,regraAssinatura:p.regraAssinatura};
    const respostas=await Promise.all([request(f.app).post(f.path).send(body),request(f.app).post(f.path).send(body)]);assert.deepEqual(respostas.map(r=>r.status).sort(),[200,409]);assert.equal((await f.get()).grauAtual,1);
    const antes=await f.get();await request(f.app).put(`/api/graduacoes/faixas/${f.branca.id}/regra`).send({...f.regra,aulasPorGrau:2}).expect(200);
    await request(f.app).post(f.path).send({tipo:'grau',versao:antes.estado!.versao,regraAssinatura:antes.regraAssinatura}).expect(409);assert.equal((await f.get()).grauAtual,1);
  }finally{await f.repo.close();}
});
it('ajuste valida data real e preserva motivos antigos quando informados; cadastro antigo não ganha data inventada',async()=>{
  const f=await fixture();try{
    const b=(await request(f.app).post('/api/alunos').send({...f.cadastro,email:'outro@teste.invalid'}).expect(201)).body;
    const p=(await request(f.app).get(`/api/alunos/${b.id}/graduacao`).expect(200)).body;assert.equal(p.estado,null);assert.equal(p.aulasTotal,0);
    await f.setup(1,{motivo:'x'}).expect(400);await f.setup(1,{dataInicioFaixa:'2999-01-01'}).expect(400);await f.setup(1,{aulasAnteriores:30,motivo:'Aulas de outra academia conferidas.'}).expect(200);
    assert.equal((await f.get()).aulasTotal,30);assert.equal((await f.get()).historico.length,2);
    await request(f.app).delete('/api/alunos/'+f.aluno.id).expect(409);
  }finally{await f.repo.close();}
});
it('grau não informado não é tratado como confirmação de zero graus para liberar promoção',async()=>{
  const f=await fixture({aulasPorGrau:1});try{
    await f.marcar(4);await f.setup(1,{grauId:null}).expect(200);assert.equal((await f.get()).metaGrau!.apto,false);await f.promover('grau',409);
    await f.setup(2).expect(200);assert.equal((await f.get()).metaGrau!.apto,true);
  }finally{await f.repo.close();}
});
it('falha na auditoria desfaz promoção e estado inteiro',async()=>{
  const f=await fixture({aulasPorGrau:1});try{
    await f.marcar(1);const antes=await f.get();f.repo.db.exec("CREATE TRIGGER FalhaGraduacao BEFORE INSERT ON EventoGraduacao BEGIN SELECT RAISE(ABORT,'Falha simulada'); END;");
    await assert.rejects(f.repo.saveEvolucaoGraduacao(f.aluno.id,ADMIN_INICIAL_ID,{tipo:'grau',versao:1,regraAssinatura:antes.regraAssinatura!},f.now),/Falha simulada/);
    assert.deepEqual(await f.get(),antes);
  }finally{await f.repo.close();}
});
it('revalida o dono do aluno na transação e recusa sinalização por outra conta',async()=>{
  const f=await fixture({aulasPorGrau:1});try{
    await f.marcar(1);const id=randomUUID(),outro=randomUUID();await f.repo.insert('Aluno',{...f.aluno,id:outro,email:'outro-acesso@teste.invalid'});await f.repo.insert('Usuario',{id,nome:'Outro aluno',email:'outro-acesso@teste.invalid',perfil:'aluno',alunoId:outro,senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:f.now});
    await assert.rejects(f.repo.saveEvolucaoGraduacao(f.aluno.id,id,{tipo:'solicitacao',versao:1},f.now),/outro aluno/);
    assert.equal((await f.get()).solicitacaoPendente,false);
  }finally{await f.repo.close();}
});
it('acompanhamento e aviso continuam acessíveis com mensalidade vencida sem liberar check-in',async()=>{
  const f=await fixture({aulasPorGrau:1});try{
    const [a]=await f.marcar(1);await f.repo.insert('Mensalidade',{id:randomUUID(),alunoId:f.aluno.id,competencia:'2020-01',valorCentavos:10000,dataVencimento:'2020-01-10',dataPagamento:null,criadoEm:f.now});
    const portal=await supertest(f.app).get('/api/portal').set(f.auth).expect(200);assert.equal(portal.body.bloqueado,true);
    await supertest(f.app).get('/api/portal/graduacao').set(f.auth).expect(200);await supertest(f.app).post('/api/portal/graduacao/solicitacao').set(f.auth).send({versao:1}).expect(200);
    await supertest(f.app).put(`/api/portal/aulas/${a.id}/checkin`).set(f.auth).send({}).expect(403);
  }finally{await f.repo.close();}
});
it('falha ao atualizar regra desfaz também os graus criados na mesma transação',async()=>{
  const f=await fixture();try{
    await f.repo.remove('GrauFaixa',(await f.repo.list('GrauFaixa')).find(g=>g.faixaId===f.branca.id&&g.numero===4)!.id);
    const antes=await f.repo.list('GrauFaixa');f.repo.db.exec("CREATE TRIGGER FalhaRegra BEFORE UPDATE ON RegraGraduacao BEGIN SELECT RAISE(ABORT,'Falha na regra'); END;");
    await assert.rejects(f.repo.saveRegraGraduacao(f.branca.id,{aulasPorGrau:31},f.now),/Falha na regra/);
    assert.deepEqual(await f.repo.list('GrauFaixa'),antes);assert.equal((await f.get()).regra!.grausParaFaixa,4);
  }finally{await f.repo.close();}
});
it('valida regras livres, preserva graus inativos e impede renumerar grau já atribuído',async()=>{
  const f=await fixture();try{
    for(const input of [{...f.regra,aulasPorGrau:0},{...f.regra,mesesPorGrau:0},{...f.regra,grausParaFaixa:-1},{...f.regra,mesesMinimosFaixa:-1},{...f.regra,proximaFaixaId:f.branca.id}])await request(f.app).put(`/api/graduacoes/faixas/${f.branca.id}/regra`).send(input).expect(400);
    await request(f.app).put(`/api/graduacoes/graus/${f.zero.id}`).send({numero:2,situacao:'ativo'}).expect(409);
    await request(f.app).put(`/api/graduacoes/graus/${f.zero.id}`).send({numero:0,situacao:'inativo'}).expect(200);
    await request(f.app).put(`/api/graduacoes/faixas/${f.branca.id}/regra`).send(f.regra).expect(200);assert.equal((await f.repo.get('GrauFaixa',f.zero.id))!.situacao,'inativo');
  }finally{await f.repo.close();}
});
it('migração 12 é aditiva e preserva todas as tabelas anteriores, sem preencher datas/graduações',()=>{
  const db=new DatabaseSync(':memory:');try{
    migrateSqlite(db,undefined,sqliteMigrations.slice(0,11));const id=randomUUID();db.prepare('INSERT INTO Aluno(id,nome,telefone,email,dataNascimento,faixa,dataMatricula,situacao,criadoEm) VALUES(?,?,?,?,?,?,?,?,?)').run(id,'Legado','11900000000','legado@teste.invalid','2000-01-01','Branca','2020-01-01','ativo','2020-01-01');
    const tabelas=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='_tatame_migrations' ORDER BY name").all().map(r=>String(r.name));const snapshot=()=>tabelas.map(t=>db.prepare(`SELECT * FROM "${t}" ORDER BY id`).all());const antes=snapshot();
    assert.deepEqual(migrateSqlite(db,undefined,sqliteMigrations.slice(0,12)).applied,[12]);assert.deepEqual(snapshot(),antes);assert.equal(db.prepare('SELECT COUNT(*) n FROM EstadoGraduacao').get()!.n,0);assert.deepEqual(migrateSqlite(db,undefined,sqliteMigrations.slice(0,12)).applied,[]);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  }finally{db.close();}
});


it('professor ajusta grau sem escrever justificativa e aluno continua sem permissão',async()=>{
 const f=await fixture();try{
  const antiga=(await f.get()).historico[0];const graus=(await f.repo.list('GrauFaixa')).filter(g=>g.faixaId===f.branca.id);
  const body={tipo:'ajuste',versao:1,faixaId:f.branca.id,grauId:graus.find(g=>g.numero===3)!.id,dataInicioFaixa:'2020-01-01',aulasAnteriores:0};
  await supertest(f.app).post(f.path).set(f.auth).send(body).expect(403);
  const resposta=(await request(f.app).post(f.path).send(body).expect(200)).body as ProgressoGraduacao;assert.equal(resposta.grauAtual,3);
  const evento=resposta.historico.find(e=>e.id!==antiga.id)!;assert.equal(evento.autorId,ADMIN_INICIAL_ID);assert.equal(evento.grauAnterior,0);assert.equal(evento.grauNovo,3);assert.equal(evento.motivo,'Graduação ajustada pelo professor.');assert.ok(evento.criadoEm);assert.deepEqual(resposta.historico.find(e=>e.id===antiga.id),antiga);
  const reducao=(await request(f.app).post(f.path).send({...body,versao:2,grauId:graus.find(g=>g.numero===1)!.id}).expect(200)).body;
  assert.equal(reducao.grauAtual,1);assert.equal(reducao.historico.length,3);
 }finally{await f.repo.close();}
});
