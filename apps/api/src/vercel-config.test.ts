import {it} from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import {vercelRuntimeConfig} from './vercel-config.js';
import {SqliteRepository} from './repository.js';
import {createApp,request} from './test-auth-helper.js';
const valid={VERCEL:'1',VERCEL_URL:'tatame-preview-exemplo.vercel.app',DATABASE_URL:'postgresql://usuario:senha@db.exemplo.supabase.co:5432/postgres?sslmode=verify-full',ANALYTICS_URL:'https://analytics.exemplo.internal/'};
it('entrada hospedada exige PostgreSQL e vínculo do Python, sem fallback local nem senha em mensagens',()=>{
 for(const overrides of [{VERCEL:undefined},{DATABASE_URL:undefined},{DATABASE_URL:'file:local.sqlite'},{DATABASE_URL:'postgresql://usuario:segredo@servidor/banco?sslmode=disable'},{ANALYTICS_URL:undefined},{ANALYTICS_URL:'http://127.0.0.1:8000'}]){
  assert.throws(()=>vercelRuntimeConfig({...valid,...overrides}),e=>{assert.ok(e instanceof Error);assert.ok(!e.message.includes('segredo'));assert.ok(!e.message.includes('postgresql://'));return true;});
 }
});
it('origem HTTPS é explícita ou vem da URL da implantação, nunca do Host enviado pelo visitante',()=>{
 const config=vercelRuntimeConfig({...valid,TATAME_ADMIN_LOCAL:'true',SEED_LOCAL:'true'});
 assert.equal(config.APP_ORIGIN,'https://tatame-preview-exemplo.vercel.app');assert.equal(config.ANALYTICS_URL,'https://analytics.exemplo.internal');assert.equal(config.TATAME_ADMIN_LOCAL,'false');assert.equal(config.SEED_LOCAL,'false');
 assert.equal(vercelRuntimeConfig({...valid,APP_ORIGIN:'https://tatame.exemplo.com'}).APP_ORIGIN,'https://tatame.exemplo.com');
 for(const APP_ORIGIN of ['http://tatame.exemplo.com','https://tatame.exemplo.com/rota','https://usuario:senha@tatame.exemplo.com','https://localhost'])assert.throws(()=>vercelRuntimeConfig({...valid,APP_ORIGIN}));
 for(const VERCEL_URL of ['site.externo.com','site.vercel.app/rota','site.vercel.app?x=1','usuario@site.vercel.app'])assert.throws(()=>vercelRuntimeConfig({...valid,VERCEL_URL}));
});
it('hospedagem substitui o caminho de certificado local pelo certificado público incluído e preserva TLS',()=>{
 const source=valid.DATABASE_URL+'&sslrootcert=C%3A%2Farquivo-local.crt',config=vercelRuntimeConfig({...valid,DATABASE_URL:source}),url=new URL(config.DATABASE_URL);
 assert.equal(url.searchParams.get('sslmode'),'verify-full');assert.match(url.searchParams.get('sslrootcert')!,/certs[\\/]supabase-root\.crt$/);assert.ok(!config.DATABASE_URL.includes('arquivo-local'));assert.equal(url.password,'senha');assert.ok(source.includes('arquivo-local'));
});
it('links de recuperação podem usar a origem verificada somente em Preview',()=>{
 const env={...valid,PASSWORD_RESET_ORIGIN:'preview'};
 const preview=vercelRuntimeConfig({...env,VERCEL_ENV:'preview'});
 assert.equal(preview.PASSWORD_RESET_ORIGIN,preview.APP_ORIGIN);
 assert.equal(vercelRuntimeConfig({...env,VERCEL_ENV:'production'}).PASSWORD_RESET_ORIGIN,undefined);
});
it('ambiente hospedado mantém login, cookie seguro e recusa escrita de outra origem e configuração pública',async()=>{
 const antes={...process.env},repo=new SqliteRepository(':memory:');try{
  Object.assign(process.env,vercelRuntimeConfig(valid));
  const app=createApp(repo,{localAdmin:false,serveFrontend:false}),client=supertest(app);
  const estado=await client.get('/api/auth/estado').expect(200);assert.equal(estado.body.usuario,null);
  await client.get('/api/alunos').expect(401);
  const sessoes=await repo.list('Sessao');
  await client.post('/api/auth/sair').set('X-Tatame-Request','1').set('Origin','https://outro.exemplo.com').send({}).expect(403);assert.deepEqual(await repo.list('Sessao'),sessoes);
  await client.post('/api/auth/configurar').set('X-Tatame-Request','1').set('Origin','https://'+valid.VERCEL_URL).send({nome:'Teste',email:'teste@exemplo.com',senha:'senha de teste longa'}).expect(403);
  const logout=await request(app).post('/api/auth/sair').set('Origin','https://'+valid.VERCEL_URL).send({}).expect(204);
  const cookie=logout.headers['set-cookie'][0];assert.match(cookie,/Secure/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
  await client.get('/').expect(404);
 }finally{for(const key of Object.keys(process.env))if(!(key in antes))delete process.env[key];Object.assign(process.env,antes);await repo.close();}
});
