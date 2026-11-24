import {it} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, randomUUID, verify} from 'node:crypto';
import supertest from 'supertest';
import {DatabaseSync} from 'node:sqlite';
import {SqliteRepository} from './repository.js';
import {createApp,request} from './test-auth-helper.js';
import {tokenHash} from './modules/auth/password.js';
import {normalizarVideo} from './modules/tecnicas/routes.js';
import { configurarVideosDrive, type VideosDrive } from './modules/tecnicas/drive.js';
import {migrateSqlite,sqliteMigrations} from './database/sqlite/migrate.js';
import {today} from './domain.js';
const now=new Date().toISOString();
const video={titulo:'Saída da montada',descricao:'Revisão dos detalhes da aula.',semana:'2026-01-01',tipoTreino:'Com kimono',url:'https://youtu.be/abcdefghijk',publicado:true};
async function fixture(videosDrive?: VideosDrive){
 const repo=new SqliteRepository(':memory:'),app=createApp(repo,{videosDrive}),id=randomUUID(),usuarioId=randomUUID(),token='v'.repeat(43);
 await repo.saveCadastroAluno({id,nome:'Aluno de técnicas',email:'video@teste.invalid',telefone:'11999999999',dataNascimento:'2000-01-01',faixa:'Branca',situacao:'ativo',dataMatricula:'2020-01-01',criadoEm:now},true);
 await repo.insert('Usuario',{id:usuarioId,alunoId:id,nome:'Aluno de técnicas',email:'video@teste.invalid',perfil:'aluno',senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now});
 await repo.insert('Sessao',{id:randomUUID(),usuarioId,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture'),expiraEm:'2099-01-01',criadoEm:now});
 const headers={Cookie:'tatame_sessao='+token,'X-Tatame-Request':'1'},client=supertest(app),admin=request(app);
 return {repo,app,id,usuarioId,client,headers,admin};
}
it('links de técnicas aceitam só vídeos HTTPS e removem rastreamento, nunca playlists ou hosts disfarçados',()=>{
 assert.equal(normalizarVideo('https://youtu.be/abcdefghijk?t=30'),'https://www.youtube.com/watch?v=abcdefghijk');
 assert.equal(normalizarVideo('https://www.youtube.com/shorts/abcdefghijk'),'https://www.youtube.com/watch?v=abcdefghijk');
 assert.equal(normalizarVideo('https://vimeo.com/123456/abcdef12'),'https://vimeo.com/123456/abcdef12');
 for(const value of ['javascript:alert(1)','http://youtu.be/abcdefghijk','https://youtube.com.evil.test/watch?v=abcdefghijk','https://youtube.com@evil.test/watch?v=abcdefghijk','https://youtube.com/playlist?list=123','https://youtu.be/abcdefghijk/extra','https://127.0.0.1/video'])assert.throws(()=>normalizarVideo(value));
});
it('player do Drive só entrega trechos a sessões liberadas e mantém o arquivo privado', async () => {
 const idDrive = 'arquivo-teste-2026';
 const tamanho = 5 * 1024 * 1024;
 const pedidos: string[] = [];
 const f = await fixture({
  async verificarArquivo(id) { assert.equal(id, idDrive); return { tamanho }; },
  async abrirArquivo(id, intervalo) {
   assert.equal(id, idDrive);
   assert.ok(intervalo);
   pedidos.push(intervalo);
   const [inicio, fim] = intervalo.slice(6).split('-').map(Number);
   return new Response(new Uint8Array(fim - inicio + 1).fill(7), { status: 206, headers: { 'Content-Range': `bytes ${inicio}-${fim}/${tamanho}` } });
  },
 });
 try {
  await f.admin.put('/api/tecnicas/configuracao').send({ativa:true,valorMensalCentavos:1500,instrucoes:''}).expect(200);
  const v = (await f.admin.post('/api/tecnicas/videos').send({...video,url:`https://drive.google.com/file/d/${idDrive}/view?usp=sharing`}).expect(201)).body;
  assert.equal(v.url, 'drive://' + idDrive);
  const catalogo = (await f.client.get('/api/portal/tecnicas').set(f.headers).expect(200)).body;
  assert.ok(!JSON.stringify(catalogo).includes(idDrive));
  const base = `/api/portal/tecnicas/${v.id}`;
  await f.client.get(base + '/reproduzir').expect(401);
  await f.client.get(base + '/reproduzir').set(f.headers).expect(403);
  await f.admin.put('/api/tecnicas/acessos/' + f.id).send({validoAte:today()}).expect(200);
  await f.client.get(base + '/assistir').set(f.headers).expect(200,{url:base + '/reproduzir',player:'interno'});
  await f.client.head(base + '/reproduzir').set(f.headers).expect(200).expect('Content-Length', String(tamanho));
  await f.client.get(base + '/reproduzir').set(f.headers).set('Range', 'bytes=3-5').expect(206)
    .expect('Content-Range', `bytes 3-5/${tamanho}`).expect('Content-Length','3').expect('Cache-Control','private, no-store');
  await f.client.get(base + '/reproduzir').set(f.headers).set('Range', 'bytes=0-').expect(206).expect('Content-Length', String(4 * 1024 * 1024));
  await f.client.get(base + '/reproduzir').set(f.headers).set('Range', `bytes=${tamanho}-`).expect(416).expect('Content-Range', `bytes */${tamanho}`);
  await f.admin.delete('/api/tecnicas/acessos/' + f.id).expect(204);
  await f.client.get(base + '/reproduzir').set(f.headers).set('Range','bytes=3-5').expect(403);
  assert.deepEqual(pedidos, ['bytes=3-5', 'bytes=0-4194303']);
 } finally { await f.repo.close(); }
});

it('conta de serviço acessa apenas MP4 autorizado na pasta configurada', async () => {
 const pasta = 'pasta-tatame-2026';
 const {privateKey,publicKey} = generateKeyPairSync('rsa',{modulusLength:2048});
 let trocas = 0;
 const drive = configurarVideosDrive({
  GOOGLE_DRIVE_FOLDER_ID:pasta,
  GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON:JSON.stringify({client_email:'drive@teste.invalid',private_key:privateKey.export({format:'pem',type:'pkcs8'})}),
 }, async (input, options) => {
  const url = new URL(String(input));
  if (url.hostname === 'oauth2.googleapis.com') {
   trocas++;
   const assertion = (options?.body as URLSearchParams).get('assertion')!;
   const [header, payload, assinatura] = assertion.split('.');
   assert.ok(verify('RSA-SHA256',Buffer.from(`${header}.${payload}`),publicKey,Buffer.from(assinatura,'base64url')));
   assert.equal(JSON.parse(Buffer.from(payload,'base64url').toString()).scope,'https://www.googleapis.com/auth/drive.readonly');
   return Response.json({access_token:'token-ficticio',expires_in:3600});
  }
  assert.equal(url.hostname,'www.googleapis.com');
  assert.equal(new Headers(options?.headers).get('authorization'),'Bearer token-ficticio');
  return Response.json({mimeType:'video/mp4',size:'110',parents:[url.pathname.endsWith('/video-permitido')?pasta:'outra-pasta'],trashed:false,capabilities:{canDownload:true}});
 })!;
 assert.deepEqual(await drive.verificarArquivo('video-permitido'),{tamanho:110});
 await assert.rejects(drive.verificarArquivo('video-outra-pasta'), /pasta privada/);
 assert.equal(trocas,1);
});
it('aluno vê catálogo sem URL, recebe link só com acesso vigente; não altera configuração nem se libera',async()=>{
 const f=await fixture();try{
  await supertest(f.app).get('/api/tecnicas').expect(401);
  await f.admin.put('/api/tecnicas/configuracao').send({ativa:true,valorMensalCentavos:1500,instrucoes:'Procure a secretaria.'}).expect(200);
  const v=(await f.admin.post('/api/tecnicas/videos').send(video).expect(201)).body;
  let catalogo=(await f.client.get('/api/portal/tecnicas').set(f.headers).expect(200)).body;
  assert.equal(catalogo.liberado,false);assert.equal(catalogo.videos.length,1);assert.ok(!JSON.stringify(catalogo).includes('youtube'));assert.ok(!('url' in catalogo.videos[0]));
  await f.client.get('/api/portal/tecnicas/'+v.id+'/assistir').set(f.headers).expect(403);
  for(const path of ['/api/tecnicas/configuracao','/api/tecnicas/acessos/'+f.id])await f.client.put(path).set(f.headers).send({}).expect(403);
  await f.admin.put('/api/tecnicas/acessos/'+f.id).send({validoAte:today()}).expect(200);
  catalogo=(await f.client.get('/api/portal/tecnicas').set(f.headers).expect(200)).body;assert.equal(catalogo.liberado,true);
  await f.client.get('/api/portal/tecnicas/'+v.id+'/assistir').set(f.headers).expect(200,{url:'https://www.youtube.com/watch?v=abcdefghijk'});
  await f.admin.delete('/api/tecnicas/acessos/'+f.id).expect(204);
  await f.client.get('/api/portal/tecnicas/'+v.id+'/assistir').set(f.headers).expect(403);
 }finally{await f.repo.close();}
});
it('rascunho, data futura, biblioteca desativada, validade vencida e aluno inativo não permitem assistir',async()=>{
 const f=await fixture();try{
  const config={ativa:true,valorMensalCentavos:1000,instrucoes:''};await f.admin.put('/api/tecnicas/configuracao').send(config).expect(200);
  const publico=(await f.admin.post('/api/tecnicas/videos').send(video).expect(201)).body;
  const rascunho=(await f.admin.post('/api/tecnicas/videos').send({...video,publicado:false}).expect(201)).body;
  const futuro=(await f.admin.post('/api/tecnicas/videos').send({...video,semana:'2099-01-01'}).expect(201)).body;
  await f.admin.put('/api/tecnicas/acessos/'+f.id).send({validoAte:today()}).expect(200);
  assert.equal((await f.client.get('/api/portal/tecnicas').set(f.headers).expect(200)).body.videos.length,1);
  for(const v of [rascunho,futuro])await f.client.get('/api/portal/tecnicas/'+v.id+'/assistir').set(f.headers).expect(404);
  await f.admin.put('/api/tecnicas/configuracao').send({...config,ativa:false}).expect(200);
  await f.client.get('/api/portal/tecnicas/'+publico.id+'/assistir').set(f.headers).expect(403);assert.equal((await f.repo.list('AcessoTecnicas')).length,1);
  await f.admin.put('/api/tecnicas/configuracao').send(config).expect(200);
  await f.repo.update('AcessoTecnicas',f.id,{validoAte:'2020-01-01'});
  await f.client.get('/api/portal/tecnicas/'+publico.id+'/assistir').set(f.headers).expect(403);
  await f.admin.put('/api/tecnicas/acessos/'+f.id).send({validoAte:'2020-01-01'}).expect(400);
  await f.repo.update('Aluno',f.id,{situacao:'inativo'});
  await f.client.get('/api/portal/tecnicas').set(f.headers).expect(401);
 }finally{await f.repo.close();}
});
it('editar publicação preserva identidade, nova liberação renova sem duplicar e entradas inválidas são recusadas',async()=>{
 const f=await fixture();try{
  const v=(await f.admin.post('/api/tecnicas/videos').send(video).expect(201)).body;
  const edit=(await f.admin.put('/api/tecnicas/videos/'+v.id).send({...video,titulo:'Detalhes de saída',publicado:false}).expect(200)).body;assert.equal(edit.id,v.id);assert.equal(edit.criadoEm,v.criadoEm);
  for(const valorMensalCentavos of [0,-1,1.5,1000001])await f.admin.put('/api/tecnicas/configuracao').send({ativa:true,valorMensalCentavos,instrucoes:''}).expect(400);
  await f.admin.post('/api/tecnicas/videos').send({...video,semana:'2026-02-30'}).expect(400);
  await f.admin.post('/api/tecnicas/videos').send({...video,alunoId:f.id}).expect(400);
  for(const validoAte of [today(),'2090-12-31'])await f.admin.put('/api/tecnicas/acessos/'+f.id).send({validoAte}).expect(200);
  assert.equal((await f.repo.list('AcessoTecnicas')).length,1);assert.equal((await f.repo.get('AcessoTecnicas',f.id))?.validoAte,'2090-12-31');
  await f.admin.put('/api/tecnicas/acessos/'+randomUUID()).send({validoAte:today()}).expect(404);
 }finally{await f.repo.close();}
});
it('responsável só consulta vídeos do dependente vinculado e o acesso de um aluno não libera outro',async()=>{
 const f=await fixture();try{
  const outro=randomUUID(),pai=randomUUID(),token='p'.repeat(43);
  await f.repo.saveCadastroAluno({id:outro,nome:'Aluno menor',email:'menor-video@teste.invalid',telefone:'11999999999',dataNascimento:'2016-01-01',faixa:'Branca',situacao:'ativo',dataMatricula:'2020-01-01',criadoEm:now,possuiCelular:false,acessoPrincipal:'responsavel'},true);
  await f.repo.insert('Usuario',{id:pai,alunoId:null,nome:'Pai de teste',email:'pai-video@teste.invalid',perfil:'responsavel',senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now});
  await f.repo.insert('ResponsavelAluno',{id:randomUUID(),alunoId:outro,usuarioId:pai,telefone:'11999999999',parentesco:'Pai',tipoVinculo:'responsavel',criadoEm:now,atualizadoEm:now});
  await f.repo.insert('Sessao',{id:randomUUID(),usuarioId:pai,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture'),expiraEm:'2099-01-01',criadoEm:now});
  const headers={Cookie:'tatame_sessao='+token,'X-Tatame-Request':'1'},base='/api/responsavel/'+outro+'/portal/tecnicas';
  await f.admin.put('/api/tecnicas/configuracao').send({ativa:true,valorMensalCentavos:1000,instrucoes:''}).expect(200);
  const v=(await f.admin.post('/api/tecnicas/videos').send(video).expect(201)).body;
  await f.admin.put('/api/tecnicas/acessos/'+outro).send({validoAte:today()}).expect(200);
  await f.client.get(base+'/'+v.id+'/assistir').set(headers).expect(200);
  await f.client.get('/api/portal/tecnicas/'+v.id+'/assistir?alunoId='+outro).set(f.headers).expect(403);
  await f.client.get('/api/responsavel/'+f.id+'/portal/tecnicas').set(headers).expect(403);
  await f.client.get('/api/portal/tecnicas').set(headers).expect(403);
  assert.equal((await f.repo.list('DebitoAula')).length,0);assert.equal((await f.repo.list('Mensalidade')).length,0);
 }finally{await f.repo.close();}
});
it('migração 18 preserva tabelas e registros anteriores, sem cobrar ou liberar ninguém',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec('PRAGMA foreign_keys=ON');migrateSqlite(db,undefined,sqliteMigrations.slice(0,17));
  const tabelas=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='_tatame_migrations' ORDER BY name").all().map(t=>String(t.name));
  const snapshot=()=>tabelas.map(t=>db.prepare('SELECT * FROM "'+t+'" ORDER BY id').all()),antes=snapshot();
  assert.deepEqual(migrateSqlite(db).applied,[18,19,20,21]);assert.deepEqual(snapshot(),antes);
  for(const t of ['ConfiguracaoTecnicas','VideoTecnica','AcessoTecnicas'])assert.equal(db.prepare('SELECT count(*) n FROM '+t).get()?.n,0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.deepEqual(migrateSqlite(db).applied,[]);
 }finally{db.close();}
});
