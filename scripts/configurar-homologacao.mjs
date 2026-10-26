import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { spawn } from 'node:child_process';

export function connectionWithPassword(connection, password) {
  let url;
  try { url = new URL(connection); } catch { throw new Error('Cole primeiro a URI do Session pooler em DATABASE_URL no arquivo .env.homologacao.'); }
  if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname.endsWith('.pooler.supabase.com') || url.port !== '5432' || url.pathname !== '/postgres' || !/^[a-zA-Z0-9_]+\.[a-z0-9]+$/.test(decodeURIComponent(url.username))) {
    throw new Error('A conexão deve ser do Session pooler do Supabase, porta 5432 e banco postgres.');
  }
  if (!password || /[\r\n\0]/.test(password) || password.length > 512) throw new Error('Informe uma senha válida, sem quebra de linha.');
  url.password = encodeURIComponent(password);
  url.searchParams.delete('uselibpqcompat');
  url.searchParams.delete('ssl');
  url.searchParams.set('sslmode', 'verify-full');
  return url.toString();
}

export function updatedEnvironment(source, password) {
  const env = parse(source);
  const connection = connectionWithPassword(env.DATABASE_URL, password);
  if ((source.match(/^DATABASE_URL=.*$/gm) ?? []).length !== 1) throw new Error('O arquivo deve conter exatamente uma linha DATABASE_URL=.');
  return source.replace(/^DATABASE_URL=.*$/m, () => 'DATABASE_URL=' + JSON.stringify(connection));
}

function hiddenPassword() {
  return new Promise((resolvePassword, reject) => {
    const input = process.stdin;
    if (!input.isTTY) { reject(new Error('Abra um terminal interativo do projeto para informar a senha.')); return; }
    const muted = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
    const rl = createInterface({ input, output: muted, terminal: true });
    let answered = false;
    rl.once('SIGINT', () => { rl.close(); });
    rl.once('close', () => { input.pause(); input.unref(); if (!answered) reject(new Error('Cancelado. Nenhuma senha foi gravada.')); });
    process.stdout.write('Senha do banco Supabase (a digitação ficará oculta): ');
    rl.question('', password => { answered = true; rl.close(); process.stdout.write('\n'); resolvePassword(password); });
  });
}

async function main() {
  const file = resolve('.env.homologacao');
  const source = readFileSync(file, 'utf8');
  // Valida o destino antes de pedir a senha. Este utilitário não acessa a rede.
  connectionWithPassword(parse(source).DATABASE_URL, 'validacao-temporaria');
  if (process.platform === 'win32' && !process.argv.includes('--password-stdin')) {
    // Read-Host usa a entrada protegida nativa do Windows; a senha segue por pipe,
    // nunca por argumento, variável de ambiente ou saída visível.
    const command = `
$ErrorActionPreference = 'Stop'
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$taskSenha = Read-Host 'Senha do banco Supabase (digitacao oculta)' -AsSecureString
$taskBuffer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSenha)
try {
  $taskTexto = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskBuffer)
  $taskTexto | & $env:TATAME_NODE $env:TATAME_CONFIGURADOR --password-stdin
  $taskResultado = $LASTEXITCODE
} finally {
  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskBuffer)
  $taskTexto = $null
  $taskSenha.Dispose()
}
exit $taskResultado
`;
    await new Promise((resolveChild, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-Command', command], { stdio: 'inherit', windowsHide: true,
        env: { ...process.env, TATAME_NODE: process.execPath, TATAME_CONFIGURADOR: fileURLToPath(import.meta.url) } });
      child.once('error', () => reject(new Error('Não foi possível abrir a entrada protegida do Windows.')));
      child.once('exit', code => code === 0 ? resolveChild() : reject(new Error('Configuração não concluída. Nenhuma conexão externa foi realizada.')));
    });
    return;
  }
  const password = process.argv.includes('--password-stdin') ? readFileSync(0, 'utf8').replace(/\r?\n$/, '') : await hiddenPassword();
  const result = updatedEnvironment(source, password);
  if (readFileSync(file, 'utf8') !== source) throw new Error('O arquivo mudou durante a configuração. Repita para preservar a alteração.');
  writeFileSync(file, result, { encoding: 'utf8', mode: 0o600 });
  console.log('Senha configurada em .env.homologacao. Símbolos codificados e verificação TLS habilitada. Nenhuma conexão externa realizada.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(() => process.exit(0)).catch(error => {
    console.error(error?.code === 'ENOENT' ? 'Arquivo .env.homologacao não encontrado.' : error.message);
    process.exit(1);
  });
}
