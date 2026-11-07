import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parse} from 'dotenv';

export function prepararConexaoVercel(value,expectedRef){
 let url;try{url=new URL(value);}catch{throw new Error('Conexão privada inválida. Configure primeiro .env.homologacao.');}
 const pooler=url.hostname.endsWith('.pooler.supabase.com');
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.username||!url.password||url.searchParams.get('sslmode')!=='verify-full')throw new Error('A conexão precisa usar PostgreSQL, senha e sslmode=verify-full.');
 const ref=pooler?decodeURIComponent(url.username).split('.').at(-1):url.hostname.replace(/^db\./,'').replace(/\.supabase\.co$/,'');
 if(ref!==expectedRef||(!pooler&&url.hostname!==`db.${expectedRef}.supabase.co`))throw new Error('O destino não corresponde ao Supabase de homologação do Tatame. Nada foi copiado.');
 if(!pooler)throw new Error('Use a conexão do Session pooler em .env.homologacao para preparar a hospedagem.');
 // O backend hospedado usa Transaction pooler; migrações continuam no Session pooler original.
 url.port='6543';
 return url.toString();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.platform!=='win32')throw new Error('Este atalho de área de transferência é exclusivo do Windows. Configure a variável no painel da Vercel.');
  const config=parse(readFileSync('.env.homologacao','utf8'));
  const connection=prepararConexaoVercel(config.DATABASE_URL,'fnjcfpztsvnbvrkdbdsj');
  execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-Command','$tatameConnection = [Console]::In.ReadToEnd(); Set-Clipboard -Value $tatameConnection'],{input:connection,encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']});
  console.log('Conexão de homologação copiada. Cole somente em DATABASE_URL no projeto tatame-homologacao da Vercel, ambiente Preview. A conexão contém senha: não cole no chat. Nenhum arquivo ou banco foi alterado.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
