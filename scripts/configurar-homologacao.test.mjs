import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'dotenv';
import { connectionWithPassword, updatedEnvironment } from './configurar-homologacao.mjs';

const connection = 'postgresql://postgres.projetoficticio:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
test('senha com símbolos, porcentagem e Unicode chega intacta após decodificar a URI, sem mudar destino', () => {
  const password = 'Exemplo@:#/%40?&é" espaço';
  const url = new URL(connectionWithPassword(connection, password));
  assert.equal(decodeURIComponent(url.password), password);
  assert.equal(url.hostname, new URL(connection).hostname);
  assert.equal(url.username, 'postgres.projetoficticio');
  assert.equal(url.searchParams.get('sslmode'), 'verify-full');
});
test('recusa destinos incompatíveis, senha vazia e quebra de linha, sem revelar entradas no erro', () => {
  for (const bad of ['invalida', connection.replace('5432', '6543'), connection.replace('.pooler.supabase.com', '.exemplo.invalid'), connection.replace(':5432/postgres', ':5432/outro')]) {
    assert.throws(() => connectionWithPassword(bad, 'segredo-ficticio'), error => !error.message.includes('segredo-ficticio') && !error.message.includes(bad));
  }
  for (const bad of ['', 'senha\ninvalida']) assert.throws(() => connectionWithPassword(connection, bad), /senha válida/);
});
test('altera somente DATABASE_URL e impõe TLS verificado mesmo com parâmetros inseguros na entrada', () => {
  const source = `# teste\r\nDATABASE_URL="${connection}?sslmode=disable&uselibpqcompat=true&sslrootcert=C%3A%2Fteste%2Fca.crt"\r\nDIRECT_URL=""\r\nSEED_LOCAL=false\r\n`;
  const result = updatedEnvironment(source, 'ficticia%#@');
  const env = parse(result), url = new URL(env.DATABASE_URL);
  assert.equal(url.searchParams.get('sslmode'), 'verify-full'); assert.equal(url.searchParams.has('uselibpqcompat'), false);
  assert.equal(url.searchParams.get('sslrootcert'), 'C:/teste/ca.crt');
  assert.equal(decodeURIComponent(url.password), 'ficticia%#@');
  assert.equal(result.replace(/^DATABASE_URL=.*$/m, ''), source.replace(/^DATABASE_URL=.*$/m, ''));
  assert.throws(() => updatedEnvironment(source + `DATABASE_URL="${connection}"\n`, 'ficticia'), /exatamente uma linha/);
});
