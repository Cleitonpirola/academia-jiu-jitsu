import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from './app.js';
import { SqliteRepository } from './repository.js';
import { today } from './domain.js';
import { ADMIN_INICIAL_ID, COOKIE } from './modules/auth/routes.js';
import { hashPassword, tokenHash, verifyPassword } from './modules/auth/password.js';
import type { Aluno, Aula, MensalidadeInput } from '@tatame/shared';

const password = 'frase ficticia para testes';
const encoded = await hashPassword(password);
const adminToken = 'a'.repeat(43), alunoToken = 'b'.repeat(43);
const write = (app: ReturnType<typeof createApp>) => request(app).post('/api/auth/entrar').set('X-Tatame-Request', '1');

describe('Login, autorização e portal do aluno', () => {
  let repo: SqliteRepository; let app: ReturnType<typeof createApp>; let aluno: Aluno; let outro: Aluno; let aulas: Aula[]; let usuarioId: string;
  const student = (nome: string): Aluno => ({ id: randomUUID(), nome, telefone: '11999991234', email: nome.toLowerCase() + '@teste.invalid', dataNascimento: '2000-01-01', dataMatricula: '2020-01-01', faixa: 'Branca', situacao: 'ativo', criadoEm: new Date().toISOString() });
  const authenticated = (token: string) => {
    const client = request(app);
    return {
      get: (path: string) => client.get(path).set('Cookie', `${COOKIE}=${token}`),
      put: (path: string) => client.put(path).set('Cookie', `${COOKIE}=${token}`).set('X-Tatame-Request', '1').set('Content-Type', 'application/json'),
      post: (path: string) => client.post(path).set('Cookie', `${COOKIE}=${token}`).set('X-Tatame-Request', '1'),
      patch: (path: string) => client.patch(path).set('Cookie', `${COOKIE}=${token}`).set('X-Tatame-Request', '1'),
      delete: (path: string) => client.delete(path).set('Cookie', `${COOKIE}=${token}`).set('X-Tatame-Request', '1'),
    };
  };
  const cobrar = async (fields: Partial<MensalidadeInput> = {}) => {
    const response = await authenticated(adminToken).post('/api/mensalidades').send({ alunoId: aluno.id, competencia: '2025-11', valorCentavos: 18000, dataVencimento: '2025-11-10', dataPagamento: null, ...fields }).expect(201);
    return response.body;
  };
  beforeEach(async () => {
    repo = new SqliteRepository(':memory:'); app = createApp(repo, { apiKey: '', analyticsUrl: 'http://127.0.0.1:1' });
    aluno = student('Ana'); outro = student('Bruno'); usuarioId = randomUUID();
    await repo.insert('Aluno', aluno); await repo.insert('Aluno', outro);
    for (const user of [{ id: ADMIN_INICIAL_ID, nome: 'Admin', email: 'admin@teste.invalid', perfil: 'admin' as const, alunoId: null }, { id: usuarioId, nome: aluno.nome, email: aluno.email, perfil: 'aluno' as const, alunoId: aluno.id }]) {
      await repo.insert('Usuario', { ...user, senhaHash: encoded, conviteHash: null, conviteExpiraEm: null, criadoEm: new Date().toISOString() });
    }
    for (const [token, id] of [[adminToken, ADMIN_INICIAL_ID], [alunoToken, usuarioId]]) await repo.insert('Sessao', { id: randomUUID(), usuarioId: id, tokenHash: tokenHash(token), credencialHash: tokenHash(encoded), criadoEm: new Date().toISOString(), expiraEm: '2099-01-01T00:00:00.000Z' });
    aulas = ['12:00', '15:00'].map((horaInicio, index) => ({ id: randomUUID(), titulo: 'Treino ' + index, dataAula: today(), horaInicio, horaFim: index ? '16:00' : '13:00', professor: 'Mestre', origem: 'extra', origemHorarioId: null, turmaId: null, turmaNome: null, situacao: 'agendada', motivoCancelamento: null, canceladaEm: null, criadoEm: new Date().toISOString() }));
    for (const aula of aulas) await repo.createAula(aula, []);
  });
  afterEach(async () => { await repo.close(); });

  it('permite administrador local existente sem senha apenas quando habilitado, sem gerar sessão', async () => {
    const local = createApp(repo, { localAdmin: true });
    const before = (await repo.list('Sessao')).length;
    const response = await request(local).get('/api/auth/estado').set('Host', '127.0.0.1:3333').expect(200);
    assert.equal(response.body.usuario.perfil, 'admin');
    assert.equal(response.headers['set-cookie'], undefined);
    await request(local).get('/api/alunos').set('Host', 'localhost:3333').expect(200);
    assert.equal((await repo.list('Sessao')).length, before);
    await request(app).get('/api/alunos').set('Host', '127.0.0.1:3333').expect(401);
  });

  it('não libera administrador local por host externo, origem externa, acesso cruzado ou proxy', async () => {
    const local = createApp(repo, { localAdmin: true });
    for (const headers of [
      { Host: 'tatame.example.com' }, { Host: 'localhost', Origin: 'https://example.com' },
      { Host: 'localhost', 'Sec-Fetch-Site': 'cross-site' },
      ...['Forwarded','X-Forwarded-For','X-Forwarded-Host','X-Forwarded-Proto'].map(header => ({ Host: 'localhost', [header]: '127.0.0.1' })),
    ]) await request(local).get('/api/alunos').set(headers).expect(401);
  });

  it('ignora a opção local quando há origem publicada, modo produção ou bind aberto', async () => {
    for (const [key, value] of [['APP_ORIGIN', 'https://tatame.example.com'], ['NODE_ENV', 'production'], ['HOST', '0.0.0.0']]) {
      const before = process.env[key];
      try {
        process.env[key] = value;
        await request(createApp(repo, { localAdmin: true })).get('/api/alunos').set('Host', 'localhost').expect(401);
      } finally { if (before === undefined) delete process.env[key]; else process.env[key] = before; }
    }
  });

  it('preserva perfil de aluno autenticado mesmo com o acesso local habilitado', async () => {
    const local = createApp(repo, { localAdmin: true });
    const cookie = `${COOKIE}=${alunoToken}`;
    await request(local).get('/api/alunos').set('Host', 'localhost').set('Cookie', cookie).expect(403);
    const result = await request(local).get('/api/portal').set('Host', 'localhost').set('Cookie', cookie).expect(200);
    assert.equal(result.body.aluno.id, aluno.id);
  });

  it('não cria administrador automaticamente e permite voltar ao login por senha', async () => {
    const empty = new SqliteRepository(':memory:');
    try {
      const state = await request(createApp(empty, { localAdmin: true })).get('/api/auth/estado').set('Host', 'localhost').expect(200);
      assert.deepEqual(state.body, { configuracaoInicial: true, usuario: null });
    } finally { await empty.close(); }
    const normal = createApp(repo, { localAdmin: false });
    await request(normal).get('/api/alunos').set('Host', 'localhost').expect(401);
    const login = await write(normal).send({ email: 'admin@teste.invalid', senha: password }).expect(200);
    assert.equal(login.body.usuario.perfil, 'admin');
  });

  it('protege todas as APIs administrativas e não expõe cadastros sem sessão', async () => {
    for (const path of ['/alunos','/mensalidades','/dashboard','/aulas','/turmas','/presencas','/analytics','/analises','/health','/portal']) await request(app).get('/api' + path).expect(401);
    await request(app).post('/api/alunos').set('X-Tatame-Request', '1').send(aluno).expect(401);
    const state = await request(app).get('/api/auth/estado').expect(200);
    assert.deepEqual(state.body, { configuracaoInicial: false, usuario: null });
  });
  it('valida a senha, usa cookie HttpOnly/Strict e não devolve hashes ou tokens de sessão no JSON', async () => {
    const result = await write(app).send({ email: ' ADMIN@TESTE.INVALID ', senha: password }).expect(200);
    assert.match(result.headers['set-cookie'][0], /HttpOnly/); assert.match(result.headers['set-cookie'][0], /SameSite=Strict/);
    assert.equal(result.body.usuario.perfil, 'admin'); assert.equal(JSON.stringify(result.body).includes('Hash'), false);
    const token = result.headers['set-cookie'][0].split(';')[0].split('=')[1];
    assert.ok((await repo.list('Sessao')).some(item => item.tokenHash === tokenHash(token)));
    assert.ok(!(await repo.list('Sessao')).some(item => item.tokenHash === token));
    for (const email of ['admin@teste.invalid','desconhecido@teste.invalid']) {
      const failed = await write(app).send({ email, senha: 'incorreta' }).expect(401);
      assert.equal(failed.body.message, 'E-mail ou senha inválidos, ou acesso indisponível.');
    }
  });
  it('hashes usam sais independentes e comparação rejeita senha incorreta', async () => {
    const otherHash = await hashPassword(password);
    assert.notEqual(otherHash, encoded); assert.ok(!encoded.includes(password));
    assert.equal(await verifyPassword(password, otherHash), true);
    assert.equal(await verifyPassword('outra senha', otherHash), false);
  });
  it('rotaciona sessão ao entrar e revoga no logout; token forjado ou expirado não autentica', async () => {
    const result = await authenticated(adminToken).post('/api/auth/entrar').send({ email: 'admin@teste.invalid', senha: password }).expect(200);
    await authenticated(adminToken).get('/api/alunos').expect(401);
    const newCookie = result.headers['set-cookie'][0].split(';')[0];
    await request(app).post('/api/auth/sair').set('Cookie', newCookie).set('X-Tatame-Request','1').expect(204);
    await request(app).get('/api/alunos').set('Cookie', newCookie).expect(401);
    const session = (await repo.list('Sessao')).find(item => item.usuarioId === usuarioId)!;
    await repo.update('Sessao', session.id, { expiraEm: '2000-01-01T00:00:00.000Z' });
    await authenticated(alunoToken).get('/api/portal').expect(401);
    await authenticated('z'.repeat(43)).get('/api/alunos').expect(401);
  });
  it('bloqueia aluno nas áreas administrativas e limita o portal aos próprios dados', async () => {
    for (const path of ['/alunos','/mensalidades','/dashboard','/aulas','/turmas','/presencas','/analytics','/analises','/health']) await authenticated(alunoToken).get('/api' + path).expect(403);
    for (const item of [aluno, outro]) await repo.insert('Mensalidade', { id: randomUUID(), alunoId: item.id, competencia: today().slice(0,7), valorCentavos: 20000, dataVencimento: today(), dataPagamento: null, criadoEm: new Date().toISOString() });
    await repo.insert('CheckinAula', { id: randomUUID(), alunoId: outro.id, aulaId: aulas[0].id, nome: outro.nome, criadoEm: new Date().toISOString() });
    const result = await authenticated(alunoToken).get('/api/portal?alunoId=' + outro.id).expect(200);
    assert.equal(result.body.aluno.id, aluno.id); assert.equal(result.body.mensalidades.length, 1);
    assert.equal(result.body.aulas[0].checkin, null);
    assert.ok(!JSON.stringify(result.body).includes(outro.email)); assert.ok(!JSON.stringify(result.body).includes(outro.id));
    await authenticated(adminToken).get('/api/portal').expect(403);
  });
  it('não aceita alunoId do navegador nem permite ao aluno confirmar a própria presença', async () => {
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({ alunoId: outro.id }).expect(400);
    await authenticated(alunoToken).put(`/api/aulas/${aulas[0].id}/chamada/${aluno.id}`).send({ presente: true }).expect(403);
    assert.equal((await repo.list('CheckinAula')).length, 0); assert.equal((await repo.list('PresencaAula')).length, 0);
  });
  it('permite vários treinos no dia, evita check-in duplicado e aguarda confirmação na chamada', async () => {
    const first = await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(200);
    const repeated = await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(200);
    assert.equal(first.body.id, repeated.body.id);
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[1].id}/checkin`).send({}).expect(200);
    assert.equal((await repo.list('CheckinAula')).length, 2);
    for (const table of ['PresencaAula','Presenca','Mensalidade','AulaAlunoPrevisto'] as const) assert.equal((await repo.list(table)).length, 0);
    const detail = await authenticated(adminToken).get(`/api/aulas/${aulas[0].id}`).expect(200);
    assert.equal(detail.body.checkins.length, 1); assert.equal(detail.body.chamada.length, 0);
    await authenticated(adminToken).put(`/api/aulas/${aulas[0].id}/chamada/${aluno.id}`).send({ presente: true }).expect(201);
    const portal = await authenticated(alunoToken).get('/api/portal').expect(200);
    assert.equal(portal.body.aulas.find((item: Aula) => item.id === aulas[0].id).presenca.presente, true);
    assert.equal(portal.body.aulas.find((item: Aula) => item.id === aulas[1].id).presenca, null);
  });
  it('recusa futuro, passado, cancelamento, aula inexistente e data anterior à matrícula', async () => {
    for (const dataAula of ['2099-01-01','2020-01-01']) {
      await repo.update('Aula', aulas[0].id, { dataAula });
      await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(400);
    }
    await repo.update('Aula', aulas[0].id, { dataAula: today(), situacao: 'cancelada', motivoCancelamento: 'Teste', canceladaEm: new Date().toISOString() });
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(409);
    await authenticated(alunoToken).put(`/api/portal/aulas/${randomUUID()}/checkin`).send({}).expect(404);
    await repo.update('Aula', aulas[0].id, { situacao: 'agendada', motivoCancelamento: null, canceladaEm: null });
    await repo.update('Aluno', aluno.id, { dataMatricula: '2099-01-01' });
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(400);
  });
  it('inativação bloqueia sessão existente e novos logins do aluno', async () => {
    await repo.update('Aluno', aluno.id, { situacao: 'inativo' });
    await authenticated(alunoToken).get('/api/portal').expect(401);
    await write(app).send({ email: aluno.email, senha: password }).expect(401);
  });
  it('aluno com débito pode entrar, mas recebe somente mensagem e os próprios vencidos no portal', async () => {
    const debt = await cobrar();
    await cobrar({ alunoId: outro.id });
    await write(app).send({ email: aluno.email, senha: password }).expect(200);
    const result = await authenticated(alunoToken).get('/api/portal').expect(200);
    assert.equal(result.body.bloqueado, true);
    assert.match(result.body.mensagem, /Consulte seu professor/);
    assert.deepEqual(Object.keys(result.body).sort(), ['bloqueado','mensagem','pendencias']);
    assert.deepEqual(result.body.pendencias.map((item: { id: string }) => item.id), [debt.id]);
    assert.equal(JSON.stringify(result.body).includes(outro.id), false);
    assert.equal(JSON.stringify(result.body).includes(aluno.telefone), false);
    assert.equal((await authenticated(alunoToken).get('/api/auth/estado')).body.usuario.alunoId, aluno.id);
  });
  it('vencer hoje, vencer no futuro e dívida de outro aluno não bloqueiam', async () => {
    await cobrar({ dataVencimento: today() });
    await cobrar({ competencia: '2025-12', dataVencimento: '2099-01-01' });
    await cobrar({ alunoId: outro.id });
    const result = await authenticated(alunoToken).get('/api/portal').expect(200);
    assert.equal(result.body.bloqueado, false); assert.equal(result.body.aluno.id, aluno.id);
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(200);
  });
  it('uma dívida criada após abrir a agenda impede check-in também dentro do repositório', async () => {
    assert.equal((await authenticated(alunoToken).get('/api/portal')).body.bloqueado, false);
    await cobrar();
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(403);
    await assert.rejects(repo.saveCheckin(aulas[0].id, aluno.id, new Date().toISOString()), /Débito em aberto/);
    assert.equal((await repo.list('CheckinAula')).length, 0);
    assert.equal((await authenticated(alunoToken).get('/api/portal')).body.bloqueado, true);
    await authenticated(adminToken).get('/api/alunos').expect(200);
    await authenticated(adminToken).put(`/api/aulas/${aulas[0].id}/chamada/${aluno.id}`).send({ presente: true }).expect(201);
  });
  it('pagamento de todos os vencidos libera a mesma sessão; estorno volta a restringir', async () => {
    const first = await cobrar();
    const second = await cobrar({ competencia: '2025-12', dataVencimento: '2025-12-10' });
    await cobrar({ alunoId: outro.id });
    await authenticated(adminToken).patch(`/api/mensalidades/${first.id}/pagamento`).send({ dataPagamento: today() }).expect(200);
    assert.equal((await authenticated(alunoToken).get('/api/portal')).body.pendencias.length, 1);
    await authenticated(adminToken).patch(`/api/mensalidades/${second.id}/pagamento`).send({ dataPagamento: today() }).expect(200);
    const result = await authenticated(alunoToken).get('/api/portal').expect(200);
    assert.equal(result.body.bloqueado, false); assert.equal(result.body.aluno.situacao, 'ativo');
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(200);
    await authenticated(adminToken).put(`/api/mensalidades/${first.id}`).send({ alunoId: first.alunoId, competencia: first.competencia, valorCentavos: first.valorCentavos, dataVencimento: first.dataVencimento, dataPagamento: null }).expect(200);
    assert.equal((await authenticated(alunoToken).get('/api/portal')).body.bloqueado, true);
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[1].id}/checkin`).send({}).expect(403);
    assert.equal((await repo.list('CheckinAula')).length, 1);
  });
  it('restrição financeira preserva avisos e chamada anteriores e não troca senha ou cadastro', async () => {
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(200);
    await authenticated(adminToken).put(`/api/aulas/${aulas[0].id}/chamada/${aluno.id}`).send({ presente: true }).expect(201);
    const previousCheckins = await repo.list('CheckinAula'), previousCalls = await repo.list('PresencaAula');
    await cobrar();
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(403);
    assert.deepEqual(await repo.list('CheckinAula'), previousCheckins); assert.deepEqual(await repo.list('PresencaAula'), previousCalls);
    assert.equal((await repo.get('Aluno', aluno.id))?.situacao, 'ativo');
    assert.equal((await repo.get('Usuario', usuarioId))?.senhaHash, encoded);
  });
  it('check-ins simultâneos são idempotentes; marcação prévia do responsável não aceita novo aviso', async () => {
    const results = await Promise.all([1,2].map(() => authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(200)));
    assert.equal(results[0].body.id,results[1].body.id); assert.equal((await repo.list('CheckinAula')).length,1);
    await authenticated(adminToken).put(`/api/aulas/${aulas[1].id}/chamada/${aluno.id}`).send({presente:false}).expect(201);
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[1].id}/checkin`).send({}).expect(409);
  });
  it('uma sessão ligada à senha anterior continua inválida mesmo se sua gravação ocorrer após a troca', async () => {
    const previous = (await repo.list('Sessao')).find(item=>item.usuarioId===usuarioId)!;
    await repo.update('Usuario',usuarioId,{senhaHash:await hashPassword('outra frase ficticia de teste')});
    await repo.remove('Sessao',previous.id); await repo.insert('Sessao',previous);
    await authenticated(alunoToken).get('/api/portal').expect(401);
  });
  it('origem externa exige HTTPS, cookie Secure e configuração inicial previamente local', async () => {
    const previous=process.env.APP_ORIGIN;
    try {
      process.env.APP_ORIGIN='http://externo.invalid'; assert.throws(()=>createApp(repo),/HTTPS/);
      process.env.APP_ORIGIN='https://tatame.teste.invalid';
      const external=createApp(repo,{apiKey:''});
      const result=await request(external).post('/api/auth/entrar').set('X-Tatame-Request','1').set('Origin',process.env.APP_ORIGIN).send({email:aluno.email,senha:password}).expect(200);
      assert.match(result.headers['set-cookie'][0],/; Secure/);
      await request(external).post('/api/auth/configurar').set('X-Tatame-Request','1').set('Origin',process.env.APP_ORIGIN).send({}).expect(403);
    } finally { if(previous===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=previous; }
  });
  it('preserva check-ins na exclusão de aula e exibe cancelamento sem transformar aviso em presença', async () => {
    await authenticated(alunoToken).put(`/api/portal/aulas/${aulas[0].id}/checkin`).send({}).expect(200);
    await authenticated(adminToken).delete(`/api/aulas/${aulas[0].id}`).expect(404);
    await authenticated(adminToken).patch(`/api/aulas/${aulas[0].id}/cancelamento`).send({ motivo: 'Mudança de agenda' }).expect(200);
    const portal = await authenticated(alunoToken).get('/api/portal').expect(200);
    assert.equal(portal.body.aulas.find((item: Aula) => item.id === aulas[0].id).situacao, 'cancelada');
    assert.equal((await repo.list('PresencaAula')).length, 0); assert.equal((await repo.list('CheckinAula')).length, 1);
  });
  it('convite é temporário e de uso único, não expõe hash e redefinição revoga sessões', async () => {
    const previous = await authenticated(adminToken).post(`/api/auth/alunos/${aluno.id}/convite`).expect(201);
    const invite = await authenticated(adminToken).post(`/api/auth/alunos/${aluno.id}/convite`).expect(201);
    assert.notEqual(previous.body.token, invite.body.token);
    const user = await repo.get('Usuario', usuarioId);
    assert.equal(user?.conviteHash, tokenHash(invite.body.token)); assert.notEqual(user?.conviteHash, invite.body.token);
    await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({ token: previous.body.token, senha: password }).expect(400);
    const activation = await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({ token: invite.body.token, senha: password }).expect(200);
    assert.equal(activation.body.usuario.alunoId, aluno.id);
    await authenticated(alunoToken).get('/api/portal').expect(401);
    await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({ token: invite.body.token, senha: password }).expect(400);
    const fresh = await authenticated(adminToken).post(`/api/auth/alunos/${aluno.id}/convite`).expect(201);
    await repo.update('Usuario', usuarioId, { conviteExpiraEm: '2000-01-01T00:00:00.000Z' });
    await request(app).post('/api/auth/ativar').set('X-Tatame-Request','1').send({ token: fresh.body.token, senha: password }).expect(400);
  });
  it('cria acesso apenas para aluno ativo; aluno não pode emitir convites ou configurar administrador', async () => {
    await authenticated(alunoToken).post(`/api/auth/alunos/${outro.id}/convite`).expect(403);
    await authenticated(alunoToken).post('/api/auth/configurar').send({}).expect(409);
    await repo.update('Aluno', outro.id, { situacao: 'inativo' });
    await authenticated(adminToken).post(`/api/auth/alunos/${outro.id}/convite`).expect(400);
    await repo.update('Aluno', outro.id, { situacao: 'ativo' });
    await authenticated(adminToken).post(`/api/auth/alunos/${outro.id}/convite`).expect(201);
    const user = (await repo.list('Usuario')).find(item => item.alunoId === outro.id)!;
    assert.equal(user.senhaHash, null);
    await authenticated(adminToken).delete(`/api/alunos/${outro.id}`).expect(409);
  });
  it('rejeita falsificação de origem e falta do cabeçalho de proteção, inclusive login', async () => {
    await request(app).post('/api/auth/entrar').send({ email: aluno.email, senha: password }).expect(403);
    await write(app).set('Origin','https://site-estranho.invalid').send({ email: aluno.email, senha: password }).expect(403);
    await write(app).set('Sec-Fetch-Site','cross-site').send({ email: aluno.email, senha: password }).expect(403);
    await authenticated(adminToken).delete(`/api/alunos/${outro.id}`).set('Origin','https://site-estranho.invalid').expect(403);
  });
  it('limita tentativas sem abrir acesso indevido', async () => {
    for (let index=0; index<20; index++) await write(app).send({}).expect(400);
    await write(app).send({ email: aluno.email, senha: password }).expect(429);
  });
});

it('configuração inicial cria um único administrador, exige senha longa e fecha após criação', async () => {
  const repo = new SqliteRepository(':memory:'); const app = createApp(repo, { apiKey: '' });
  try {
    assert.equal((await request(app).get('/api/auth/estado')).body.configuracaoInicial, true);
    await request(app).post('/api/auth/configurar').set('X-Tatame-Request','1').send({ nome: 'Admin', email: 'admin@teste.invalid', senha: 'curta' }).expect(400);
    const body = { nome: 'Admin', email: 'admin@teste.invalid', senha: password };
    const results = await Promise.all([1,2].map(() => request(app).post('/api/auth/configurar').set('X-Tatame-Request','1').send(body)));
    assert.deepEqual(results.map(item => item.status).sort(), [201,409]);
    assert.equal((await repo.list('Usuario')).length, 1);
    assert.equal((await request(app).get('/api/auth/estado')).body.configuracaoInicial, false);
    await request(app).post('/api/auth/configurar').set('X-Tatame-Request','1').send(body).expect(409);
  } finally { await repo.close(); }
});
