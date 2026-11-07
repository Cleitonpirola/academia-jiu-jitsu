import {it} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import supertest from 'supertest';
import type {Aluno,Aula,PresencaAula} from '@tatame/shared';
import {calcularRanking} from './modules/equipe/ranking.js';
import {fotoSchema} from './modules/equipe/fotos.js';
import {SqliteRepository} from './repository.js';
import {createApp,request} from './test-auth-helper.js';
import {tokenHash} from './modules/auth/password.js';
const now=new Date().toISOString();
const imagem='data:image/jpeg;base64,'+readFileSync(new URL('./fixtures/avatar-teste.jpg',import.meta.url)).toString('base64');
const aluno=(nome:string):Aluno=>({id:randomUUID(),nome,email:nome+'@teste.invalid',telefone:'11900000000',dataNascimento:'2000-01-01',faixa:'Branca',dataMatricula:'2020-01-01',situacao:'ativo',criadoEm:now});
const aula=(dataAula:string,situacao:'agendada'|'cancelada'='agendada'):Aula=>({id:randomUUID(),titulo:'Aula teste',dataAula,horaInicio:'12:00',horaFim:'13:00',professor:'Professor',origem:'grade',origemHorarioId:randomUUID(),turmaId:null,turmaNome:null,situacao,motivoCancelamento:null,canceladaEm:null,criadoEm:now});
const presenca=(a:Aluno,l:Aula,presente=true):PresencaAula=>({id:randomUUID(),alunoId:a.id,aulaId:l.id,nome:a.nome,presente,criadoEm:now,atualizadoEm:now});
it('ranking geral e mensal contam aulas confirmadas únicas, excluindo futuras, canceladas e ausências',()=>{
 const ana=aluno('Ana'),bia=aluno('Bia'),inativo={...aluno('Inativo'),situacao:'inativo' as const};
 const aulas=[aula('2026-09-30'),aula('2026-10-01'),aula('2026-10-01'),aula('2026-10-02','cancelada'),aula('2026-11-01')];
 const registros=[presenca(ana,aulas[0]),presenca(ana,aulas[1]),presenca(ana,aulas[1]),presenca(ana,aulas[2],false),presenca(ana,aulas[3]),presenca(ana,aulas[4]),presenca(bia,aulas[1]),presenca(inativo,aulas[1])];
 const fotos=[{id:ana.id,alunoId:ana.id,usuarioId:null,imagem,atualizadoEm:now}];
 const geral=calcularRanking([ana,bia,inativo],aulas,registros,fotos,undefined,'2026-10-27');assert.deepEqual(geral.map(p=>[p.nome,p.aulas,p.posicao]),[['Ana',2,1],['Bia',1,2]]);assert.ok(geral[0].fotoUrl);assert.equal(geral[1].fotoUrl,null);assert.ok(!JSON.stringify(geral).includes('@teste.invalid'));
 const mensal=calcularRanking([ana,bia],aulas,registros,[],'2026-10','2026-10-27');assert.deepEqual(mensal.map(p=>[p.nome,p.aulas]),[['Ana',1],['Bia',1]]);
 assert.deepEqual(calcularRanking([ana,bia],aulas,registros,[],'2026-08','2026-10-27'),[]);
 // Duas aulas reais no mesmo dia contam duas vezes; matrícula posterior não aceita passado.
 assert.equal(calcularRanking([ana],aulas,[presenca(ana,aulas[1]),presenca(ana,aulas[2])],[],undefined,'2026-10-27')[0].aulas,2);
 assert.deepEqual(calcularRanking([{...ana,dataMatricula:'2026-10-02'}],aulas,registros,[],undefined,'2026-10-27'),[]);
});
it('fotos rejeitam SVG, formatos falsos, corpo extra e arquivos grandes',()=>{
 assert.equal(fotoSchema.safeParse({imagem}).success,true);
 for(const body of [{imagem:'data:image/svg+xml;base64,PHN2Zz4='},{imagem:'data:image/jpeg;base64,YWJj'},{imagem,alunoId:randomUUID()},{imagem:'data:image/jpeg;base64,'+'A'.repeat(180000)}])assert.equal(fotoSchema.safeParse(body).success,false);
});
it('foto própria persiste, aparece no ranking e na chamada; aluno não altera outra pessoa',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const app=createApp(repo),a=aluno('Ana');await repo.saveCadastroAluno(a,true);
  const id=randomUUID(),token='f'.repeat(43);await repo.insert('Usuario',{id,nome:a.nome,email:a.email,perfil:'aluno',alunoId:a.id,senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now});await repo.insert('Sessao',{id:randomUUID(),usuarioId:id,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture'),expiraEm:'2099-01-01',criadoEm:now});
  const client=supertest(app),headers={Cookie:'tatame_sessao='+token,'X-Tatame-Request':'1'};
  await client.get('/api/portal/foto').set(headers).expect(200,{imagem:null});
  await client.put('/api/portal/foto').set(headers).send({imagem}).expect(200);
  assert.equal((await repo.get('FotoPerfil',a.id))!.imagem,imagem);
  await client.put('/api/portal/foto').set(headers).send({imagem,alunoId:randomUUID()}).expect(400);
  await request(app).get('/api/equipe/alunos/'+a.id+'/foto').expect('Content-Type',/image\/jpeg/).expect(200);
  await supertest(app).get('/api/equipe/ranking').expect(401);await supertest(app).get('/api/equipe/alunos/'+a.id+'/foto').expect(401);
  await client.get('/api/equipe/ranking?mes=2026-13').set(headers).expect(400);
  await client.get('/api/responsavel/'+randomUUID()+'/portal/foto').set(headers).expect(403);
  const l=aula('2026-10-01');await repo.createAula(l,[]);await repo.savePresencaAula(l.id,a.id,true,now);
  const ranking=(await client.get('/api/equipe/ranking?mes=2026-10').set(headers).expect(200)).body;assert.equal(ranking[0].alunoId,a.id);assert.ok(ranking[0].fotoUrl);assert.deepEqual(Object.keys(ranking[0]).sort(),['alunoId','aulas','fotoUrl','nome','posicao']);
  await client.delete('/api/portal/foto').set(headers).expect(204);assert.equal(await repo.get('FotoPerfil',a.id),null);
  await request(app).put('/api/perfil/foto').send({imagem}).expect(200);assert.equal((await repo.list('FotoPerfil')).length,1);
 }finally{await repo.close();}
});
it('responsável pode cuidar da foto de seu dependente, sem acesso a outro cadastro',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const app=createApp(repo),a=aluno('Menor'),b=aluno('Outro');a.dataNascimento='2015-01-01';a.possuiCelular=false;a.acessoPrincipal='responsavel';
  await repo.saveCadastroAluno(a,true);await repo.saveCadastroAluno(b,true);
  const id=randomUUID(),token='g'.repeat(43);await repo.insert('Usuario',{id,nome:'Responsável',email:'pai@teste.invalid',perfil:'responsavel',alunoId:null,senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now});await repo.insert('ResponsavelAluno',{id:randomUUID(),alunoId:a.id,usuarioId:id,telefone:'11900000000',parentesco:'Pai',tipoVinculo:'responsavel',criadoEm:now,atualizadoEm:now});await repo.insert('Sessao',{id:randomUUID(),usuarioId:id,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture'),expiraEm:'2099-01-01',criadoEm:now});
  const headers={Cookie:'tatame_sessao='+token,'X-Tatame-Request':'1'},client=supertest(app);
  await client.put(`/api/responsavel/${a.id}/portal/foto`).set(headers).send({imagem}).expect(200);
  await client.put(`/api/responsavel/${b.id}/portal/foto`).set(headers).send({imagem}).expect(403);
  await client.put('/api/perfil/foto').set(headers).send({imagem}).expect(200);assert.equal((await repo.list('FotoPerfil')).length,2);
 }finally{await repo.close();}
});

it('viradas de mês e ano renovam a contagem sem perder o total anual anterior',()=>{
 const ana=aluno('Ana'),bia=aluno('Bia');
 const aulas=[aula('2025-12-31'),aula('2026-01-01'),aula('2026-06-10'),aula('2026-12-31'),aula('2027-01-01'),aula('2027-01-02')];
 const presencas=[presenca(ana,aulas[0]),presenca(ana,aulas[1]),presenca(ana,aulas[2]),presenca(bia,aulas[3]),presenca(bia,aulas[4]),presenca(bia,aulas[5])];
 const dadosAntes=JSON.stringify({aulas,presencas}),contar=(periodo:string,hoje='2027-01-01')=>calcularRanking([ana,bia],aulas,presencas,[],periodo,hoje).map(p=>[p.nome,p.aulas]);
 assert.deepEqual(contar('2026-12','2026-12-31'),[['Bia',1]]);
 assert.deepEqual(contar('2027-01'),[['Bia',1]]);
 assert.deepEqual(contar('2027-02','2027-02-01'),[]);
 assert.deepEqual(contar('2026'),[['Ana',2],['Bia',1]]);
 assert.deepEqual(contar('2025'),[['Ana',1]]);
 assert.deepEqual(contar('2027'),[['Bia',1]]);
 assert.deepEqual(contar('2026'),[['Ana',2],['Bia',1]]);
 assert.equal(JSON.stringify({aulas,presencas}),dadosAntes);
});
it('API usa o mês atual por padrão, permite ano civil e rejeita filtros conflitantes',async()=>{
 const repo=new SqliteRepository(':memory:');try{
  const app=createApp(repo),a=aluno('Anual');await repo.saveCadastroAluno(a,true);
  for(const data of ['2024-12-31','2025-01-01','2025-12-31']){const l=aula(data);await repo.createAula(l,[]);await repo.savePresencaAula(l.id,a.id,true,now);}
  const antes=JSON.stringify(await repo.list('PresencaAula'));
  const resumo=async(path:string)=>(await request(app).get(path).expect(200)).body.map((p:{nome:string;aulas:number})=>[p.nome,p.aulas]);
  assert.deepEqual(await resumo('/api/equipe/ranking?ano=2025'),[['Anual',2]]);
  assert.deepEqual(await resumo('/api/equipe/ranking?mes=2025-12'),[['Anual',1]]);
  const atual=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date()).slice(0,7);
  assert.deepEqual(await resumo('/api/equipe/ranking'),await resumo('/api/equipe/ranking?mes='+atual));
  for(const filtro of ['ano=2025&mes=2025-12','ano=25','ano=1899','ano=2025-01','ano=2025&ano=2024'])await request(app).get('/api/equipe/ranking?'+filtro).expect(400);
  assert.equal(JSON.stringify(await repo.list('PresencaAula')),antes);
 }finally{await repo.close();}
});
