import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { it } from 'node:test';
import supertest from 'supertest';
import { createApp } from './app.js';
import { SqliteRepository } from './repository.js';
import { tokenHash } from './modules/auth/password.js';
import { ADMIN_INICIAL_ID } from './modules/auth/routes.js';

const email = 'admin-recuperacao@teste.invalid';
const senhaAntiga = 'estanteazul';
const senhaNova = 'nuvem rio';
const header = 'X-Tatame-Request';

it('recupera por e-mail de uso único, preserva o convite até a troca e encerra a sessão antiga', async () => {
  const repo = new SqliteRepository(':memory:');
  const messages: {email:string;link:string}[] = [];
  const app = createApp(repo,{emailRecuperacao:{origem:'https://tatame.example',async enviar(email,link){messages.push({email,link});}}});
  const admin = supertest.agent(app);
  const request = supertest(app);
  const post = (path:string,body:object) => request.post(`/api/auth/${path}`).set(header,'1').send(body);
  try {
    await post('configurar',{nome:'Admin Fictício',email,senha:'ALUNO123'}).expect(400);
    await admin.post('/api/auth/configurar').set(header,'1').send({nome:'Admin Fictício',email,senha:senhaAntiga}).expect(201);
    const convite = randomUUID().replaceAll('-','').padEnd(43,'a');
    await repo.update('Usuario',ADMIN_INICIAL_ID,{conviteHash:tokenHash(convite),conviteExpiraEm:'2099-01-01'});
    const attempts = await Promise.all([email,email,'desconhecido@teste.invalid'].map(address=>post('recuperar-senha',{email:address}).expect(202)));
    assert.ok(attempts.every(res=>res.text === attempts[0].text));
    assert.equal(messages.length,1);
    assert.equal(messages[0].email,email);
    assert.equal((await repo.get('Usuario',ADMIN_INICIAL_ID))?.conviteHash,tokenHash(convite));
    const link = new URL(messages[0].link);
    const token = new URLSearchParams(link.hash.slice(1)).get('redefinir')!;
    assert.equal(link.origin,'https://tatame.example');
    assert.equal(link.search,'');
    assert.equal(repo.db.prepare('SELECT tokenHash FROM RecuperacaoSenha').get()?.tokenHash,tokenHash(token));
    assert.deepEqual((await post('validar-recuperacao',{token}).expect(200)).body,{valido:true});
    await post('ativar',{token,senha:senhaNova}).expect(400);
    await post('redefinir-senha',{token:convite,senha:senhaNova}).expect(400);
    await post('redefinir-senha',{token,senha:'12345678'}).expect(400);
    for (const senha of [` ${senhaNova}`, `${senhaNova} `]) {
      const resposta = await post('redefinir-senha',{token,senha}).expect(400);
      assert.match(resposta.body.message, /espaços do início e do fim/);
    }
    await admin.get('/api/alunos').expect(200);
    const results = await Promise.all([1,2].map(()=>post('redefinir-senha',{token,senha:senhaNova})));
    assert.deepEqual(results.map(result=>result.status).sort(),[204,400]);
    await admin.get('/api/alunos').expect(401);
    await post('entrar',{email,senha:senhaAntiga}).expect(401);
    await post('entrar',{email,senha:senhaNova}).expect(200);
    assert.equal((await repo.get('Usuario',ADMIN_INICIAL_ID))?.conviteHash,null);
    assert.equal(repo.db.prepare('SELECT COUNT(*) AS n FROM RecuperacaoSenha').get()?.n,0);
    assert.deepEqual((await post('validar-recuperacao',{token}).expect(200)).body,{valido:false});
  } finally { await repo.close(); }
});

it('recusa links expirados, de e-mail anterior e de conta sem provedor configurado', async () => {
  const repo = new SqliteRepository(':memory:');
  const app = createApp(repo);
  const post = (path:string,body:object) => supertest(app).post(`/api/auth/${path}`).set(header,'1').send(body);
  try {
    await post('configurar',{nome:'Admin Fictício',email,senha:senhaAntiga}).expect(201);
    assert.equal(Boolean((await supertest(app).get('/api/auth/estado')).body.recuperacaoDisponivel),false);
    await post('recuperar-senha',{email}).expect(401);
    const past='2000-01-01T00:00:00.000Z', now=new Date().toISOString();
    assert.equal(await repo.reservarRecuperacao(email,'expirado',past),true);
    assert.equal(await repo.validarRecuperacao('expirado','2000-01-01T00:14:59.999Z'),true);
    assert.equal(await repo.validarRecuperacao('expirado','2000-01-01T00:15:00.000Z'),false);
    assert.equal(await repo.redefinirSenha('expirado','hash novo',now),false);
    assert.equal(await repo.reservarRecuperacao(email,'email anterior',now),true);
    await repo.update('Usuario',ADMIN_INICIAL_ID,{email:'outro@teste.invalid'});
    assert.equal(await repo.redefinirSenha('email anterior','hash novo',now),false);
  } finally { await repo.close(); }
});

it('bloqueia a abertura do formulário e a troca quando o link já venceu', async () => {
  const repo = new SqliteRepository(':memory:');
  const app = createApp(repo,{emailRecuperacao:{origem:'https://tatame.example',async enviar(){}}});
  const post = (path:string,body:object) => supertest(app).post(`/api/auth/${path}`).set(header,'1').send(body);
  const token = 'x'.repeat(43);
  try {
    await post('configurar',{nome:'Admin Fictício',email,senha:senhaAntiga}).expect(201);
    assert.equal(await repo.reservarRecuperacao(email,tokenHash(token),'2000-01-01T00:00:00.000Z'),true);
    assert.deepEqual((await post('validar-recuperacao',{token}).expect(200)).body,{valido:false});
    await post('redefinir-senha',{token,senha:senhaNova}).expect(400);
    await post('entrar',{email,senha:senhaAntiga}).expect(200);
  } finally { await repo.close(); }
});
