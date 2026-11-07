import {it} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import supertest from 'supertest';
import {SupabaseArquivos,configurarArquivos,FOTO_BUCKET,VIDEO_BUCKET,MAX_VIDEO_BYTES,referenciaArquivo,type Arquivos} from './modules/arquivos/storage.js';
import {SqliteRepository} from './repository.js';
import {createApp,request} from './test-auth-helper.js';
import {tokenHash} from './modules/auth/password.js';
import {today} from './domain.js';

const origin='https://storagefixture.supabase.co',secret='sb_secret_apenas_fixture_sem_acesso_real';
const imagem='data:image/jpeg;base64,'+readFileSync(new URL('./fixtures/avatar-teste.jpg',import.meta.url)).toString('base64');
function storageFixture(){
 const buckets=new Map<string,{id:string;public:boolean;file_size_limit:number;allowed_mime_types:string[]}>();
 const objetos=new Map<string,{bytes:Buffer;mime:string}>(),assinaturas:number[]=[];
 let failUpload=false;
 const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
 const fetcher:typeof fetch=async(input,options)=>{
  const url=new URL(String(input)),path=url.pathname.slice('/storage/v1/'.length),method=options?.method??'GET';
  const headers=new Headers(options?.headers),publicSigned=path.startsWith('object/sign/')&&method==='GET';
  if(!publicSigned&&headers.get('apikey')!==secret)return json({message:'Unauthorized'},403);
  if(path==='bucket'&&method==='POST'){
   const b=JSON.parse(String(options?.body));buckets.set(b.id,{id:b.id,public:b.public,file_size_limit:b.file_size_limit,allowed_mime_types:b.allowed_mime_types});return json({name:b.id});
  }
  if(path.startsWith('bucket/')&&method==='GET'){const b=buckets.get(path.slice(7));return b?json(b):json({message:'Bucket not found',statusCode:'404'},404);}
  if(path.startsWith('object/upload/sign/'))return json({url:'/'+path+'?token=fixture-upload'});
  if(path.startsWith('object/info/')){const f=objetos.get(path.slice(12));return f?json({id:randomUUID(),name:path.slice(12),size:f.bytes.length,content_type:f.mime,metadata:{}}):json({message:'not found'},404);}
  if(path.startsWith('object/sign/')&&method==='POST'){assinaturas.push(JSON.parse(String(options?.body)).expiresIn);return json({signedURL:'/'+path+'?token=fixture-download'});}
  if(publicSigned){const f=objetos.get(path.slice(12));return f?new Response(new Uint8Array(f.bytes.subarray(0,32)),{status:206}):json({},404);}
  if(path.startsWith('object/')){
   const key=path.slice(7);
   if(method==='POST'){if(failUpload)return json({message:'private credential should not leak'},503);objetos.set(key,{bytes:Buffer.from(options?.body as Uint8Array),mime:headers.get('content-type')??''});return json({Key:key});}
   if(method==='GET'){const f=objetos.get(key);return f?new Response(new Uint8Array(f.bytes),{headers:{'Content-Type':f.mime}}):json({},404);}
   if(method==='DELETE'){for(const prefix of JSON.parse(String(options?.body)).prefixes)objetos.delete(key+'/'+prefix);return json([]);}
  }
  throw new Error('Unexpected storage fixture request: '+method+' '+path);
 };
 const arquivos=new SupabaseArquivos(origin,secret,fetcher);
 return {arquivos,buckets,objetos,assinaturas,setFailUpload:(value:boolean)=>{failUpload=value;}};
}

it('Storage exige configuração privada completa, rejeita chave pública/URL externa e caminhos arbitrários',()=>{
 assert.equal(configurarArquivos({}),undefined);
 for(const env of [{SUPABASE_URL:origin},{SUPABASE_SECRET_KEY:secret},{SUPABASE_URL:origin,SUPABASE_SECRET_KEY:'sb_publishable_fixture'},{SUPABASE_URL:'https://exemplo.com',SUPABASE_SECRET_KEY:secret}])assert.throws(()=>configurarArquivos(env));
 for(const ref of ['storage://tatame-fotos/../../secret','https://exemplo.com/foto','storage://outro/'+randomUUID()+'/'+randomUUID()+'.jpg','storage://tatame-tecnicas/'+randomUUID()+'/'+randomUUID()+'.jpg'])assert.throws(()=>referenciaArquivo(ref));
});
it('SDK cria apenas buckets privados com limites, aceita repetição e recusa bucket público existente',async()=>{
 const f=storageFixture();await f.arquivos.prepararBuckets();await f.arquivos.prepararBuckets();
 assert.equal(f.buckets.size,2);assert.equal(f.buckets.get(FOTO_BUCKET)?.file_size_limit,130000);assert.equal(f.buckets.get(VIDEO_BUCKET)?.file_size_limit,MAX_VIDEO_BYTES);
 assert.ok([...f.buckets.values()].every(b=>!b.public));
 f.buckets.get(FOTO_BUCKET)!.public=true;await assert.rejects(f.arquivos.prepararBuckets(),/precisa ser privado/);assert.equal(f.buckets.get(FOTO_BUCKET)!.public,true);
});
it('foto sai do banco em base64, conserva compatibilidade e valida o dono antes de ler no Storage',async()=>{
 const f=storageFixture(),id=randomUUID(),ref=await f.arquivos.salvarFoto(id,imagem);
 assert.ok(!ref.includes('base64'));assert.equal(await f.arquivos.lerFoto(ref,id),imagem);
 await assert.rejects(f.arquivos.lerFoto(ref,randomUUID()),/Foto indisponível/);
 await f.arquivos.remover(ref);assert.equal(f.objetos.size,0);
});
it('upload MP4 exige comprovante íntegro do mesmo usuário, tamanho/MIME reais e cabeçalho MP4; URL de leitura expira',async()=>{
 const f=storageFixture(),id=randomUUID(),ticket=await f.arquivos.prepararVideo(id,24),key=ticket.referencia.slice('storage://'.length);
 await assert.rejects(f.arquivos.confirmarVideo(ticket.referencia,ticket.comprovante,id),/ainda não foi enviado/);
 f.objetos.set(key,{bytes:Buffer.alloc(23),mime:'video/mp4'});
 await assert.rejects(f.arquivos.confirmarVideo(ticket.referencia,ticket.comprovante,id),/não corresponde/);
 const bytes=Buffer.alloc(24);bytes.write('ftyp',4);f.objetos.set(key,{bytes,mime:'video/mp4'});
 await assert.rejects(f.arquivos.confirmarVideo(ticket.referencia,ticket.comprovante,randomUUID()),/inválido/);
 await assert.rejects(f.arquivos.confirmarVideo(ticket.referencia,ticket.comprovante+'a',id),/inválido/);
 await f.arquivos.confirmarVideo(ticket.referencia,ticket.comprovante,id);
 assert.ok((await f.arquivos.assinarVideo(ticket.referencia)).startsWith(origin+'/storage/v1/object/sign/'));assert.equal(f.assinaturas.at(-1),600);
 bytes.write('HTML',4);await assert.rejects(f.arquivos.confirmarVideo(ticket.referencia,ticket.comprovante,id),/MP4 válido/);
 await assert.rejects(f.arquivos.prepararVideo(id,MAX_VIDEO_BYTES+1));
});

async function alunoFixture(arquivos:Arquivos){
 const repo=new SqliteRepository(':memory:'),app=createApp(repo,{arquivos}),id=randomUUID(),uid=randomUUID(),token='s'.repeat(43),now=new Date().toISOString();
 await repo.saveCadastroAluno({id,nome:'Aluno fictício Storage',email:'storage@teste.invalid',telefone:'11999999999',dataNascimento:'2000-01-01',faixa:'Branca',situacao:'ativo',dataMatricula:'2020-01-01',criadoEm:now},true);
 await repo.insert('Usuario',{id:uid,alunoId:id,nome:'Aluno fictício Storage',email:'storage@teste.invalid',perfil:'aluno',senhaHash:'fixture',conviteHash:null,conviteExpiraEm:null,criadoEm:now});
 await repo.insert('Sessao',{id:randomUUID(),usuarioId:uid,tokenHash:tokenHash(token),credencialHash:tokenHash('fixture'),expiraEm:'2099-01-01',criadoEm:now});
 return {repo,app,id,client:supertest(app),admin:request(app),headers:{Cookie:'tatame_sessao='+token,'X-Tatame-Request':'1'}};
}
it('API mantém fotos antigas, grava novas no bucket e preserva a anterior quando o provedor falha',async()=>{
 const s=storageFixture(),f=await alunoFixture(s.arquivos);try{
  await f.repo.saveFotoPerfil({id:f.id,alunoId:f.id,usuarioId:null,imagem,atualizadoEm:new Date().toISOString()});
  await f.client.get('/api/portal/foto').set(f.headers).expect(200,{imagem});
  s.setFailUpload(true);const falhou=await f.client.put('/api/portal/foto').set(f.headers).send({imagem}).expect(503);assert.ok(!JSON.stringify(falhou.body).includes('credential'));assert.equal((await f.repo.get('FotoPerfil',f.id))!.imagem,imagem);
  s.setFailUpload(false);await f.client.put('/api/portal/foto').set(f.headers).send({imagem}).expect(200);assert.match((await f.repo.get('FotoPerfil',f.id))!.imagem,/^storage:\/\/tatame-fotos\//);
  await f.client.get('/api/portal/foto').set(f.headers).expect(200,{imagem});
  const foto=await f.client.get('/api/equipe/alunos/'+f.id+'/foto').set(f.headers).expect(200);assert.deepEqual(foto.body,Buffer.from(imagem.split(',')[1],'base64'));
  await f.client.put('/api/portal/foto').set(f.headers).send({imagem}).expect(200);assert.equal(s.objetos.size,1);
  await f.client.delete('/api/portal/foto').set(f.headers).expect(204);assert.equal(s.objetos.size,0);assert.equal(await f.repo.get('FotoPerfil',f.id),null);
 }finally{await f.repo.close();}
});
it('apenas administração prepara buckets/envia vídeos; aluno liberado recebe URL temporária sem chave nem caminho no catálogo',async()=>{
 const s=storageFixture(),f=await alunoFixture(s.arquivos);try{
  await supertest(f.app).post('/api/armazenamento/preparar').set('X-Tatame-Request','1').send({}).expect(401);
  await f.client.post('/api/armazenamento/preparar').set(f.headers).send({}).expect(403);await f.client.post('/api/tecnicas/uploads').set(f.headers).send({tamanho:24,tipo:'video/mp4'}).expect(403);
  await f.admin.post('/api/armazenamento/preparar').send({}).expect(200);
  const ticket=(await f.admin.post('/api/tecnicas/uploads').send({tamanho:24,tipo:'video/mp4'}).expect(201)).body;
  const bytes=Buffer.alloc(24);bytes.write('ftyp',4);s.objetos.set(ticket.referencia.slice('storage://'.length),{bytes,mime:'video/mp4'});
  const input={titulo:'Técnica fictícia privada',descricao:'Apenas teste.',semana:today(),tipoTreino:'Com kimono',url:ticket.referencia,publicado:true};
  await f.admin.post('/api/tecnicas/videos').send(input).expect(400);
  const v=(await f.admin.post('/api/tecnicas/videos').send({...input,comprovanteUpload:ticket.comprovante}).expect(201)).body;
  assert.ok(!('comprovanteUpload'in v));assert.equal((await f.repo.list('VideoTecnica')).length,1);
  await f.admin.post('/api/tecnicas/videos').send({...input,comprovanteUpload:ticket.comprovante}).expect(409);
  await f.admin.put('/api/tecnicas/videos/'+v.id).send({...input,titulo:'Título ajustado'}).expect(200);
  await f.admin.put('/api/tecnicas/configuracao').send({ativa:true,valorMensalCentavos:1000,instrucoes:''}).expect(200);
  const catalogo=(await f.client.get('/api/portal/tecnicas').set(f.headers).expect(200)).body;assert.ok(!JSON.stringify(catalogo).includes('storage://'));assert.ok(!JSON.stringify(catalogo).includes(secret));
  const path='/api/portal/tecnicas/'+v.id+'/assistir';await f.client.get(path).set(f.headers).expect(403);
  await f.admin.put('/api/tecnicas/acessos/'+f.id).send({validoAte:today()}).expect(200);
  const playback=await f.client.get(path).set(f.headers).expect(200);assert.match(playback.body.url,/\/object\/sign\//);assert.ok(!playback.body.url.includes(secret));
  await f.admin.delete('/api/tecnicas/acessos/'+f.id).expect(204);await f.client.get(path).set(f.headers).expect(403);
  assert.equal((await f.repo.list('DebitoAula')).length,0);
 }finally{await f.repo.close();}
});
