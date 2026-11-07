import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
/** Configuração exclusiva da hospedagem: falhar é mais seguro que criar um SQLite vazio. */
export function vercelRuntimeConfig(env:NodeJS.ProcessEnv){
 if(env.VERCEL!=='1')throw new Error('Use a entrada Vercel somente no ambiente da Vercel. Para execução local, use o servidor habitual.');
 if(!env.DATABASE_URL)throw new Error('Configure DATABASE_URL na Vercel antes de publicar.');
 let database:URL;
 try{database=new URL(env.DATABASE_URL);}catch{throw new Error('DATABASE_URL inválida. Confira a configuração privada na Vercel.');}
 if(!['postgres:','postgresql:'].includes(database.protocol)||!database.hostname||!database.username||!database.password||database.searchParams.get('sslmode')!=='verify-full')throw new Error('DATABASE_URL deve usar PostgreSQL com credenciais e sslmode=verify-full.');
 // Incluído no pacote pela referência estática; não depende de caminhos do computador do usuário.
 const certificado=new URL('../certs/supabase-root.crt',import.meta.url);
 readFileSync(certificado);
 database.searchParams.set('sslrootcert',fileURLToPath(certificado));
 let origin=env.APP_ORIGIN;
 if(!origin){
  if(!env.VERCEL_URL||!/^[a-z0-9-]+\.vercel\.app$/i.test(env.VERCEL_URL))throw new Error('Configure APP_ORIGIN ou use uma URL de implantação válida da Vercel.');
  origin='https://'+env.VERCEL_URL;
 }
 let parsed:URL;
 try{parsed=new URL(origin);}catch{throw new Error('APP_ORIGIN inválida. Informe a origem HTTPS da implantação.');}
 if(parsed.protocol!=='https:'||parsed.origin!==origin||parsed.username||parsed.password||['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))throw new Error('APP_ORIGIN deve ser a origem HTTPS exata da implantação, sem caminho ou credenciais.');
 if(!env.ANALYTICS_URL)throw new Error('Configure o vínculo privado ANALYTICS_URL entre a API e o serviço Python.');
 let analytics:URL;
 try{analytics=new URL(env.ANALYTICS_URL);}catch{throw new Error('ANALYTICS_URL inválida. Confira o vínculo privado de serviços.');}
 if(!['https:','http:'].includes(analytics.protocol)||analytics.username||analytics.password||analytics.search||analytics.hash||['localhost','127.0.0.1','[::1]'].includes(analytics.hostname))throw new Error('ANALYTICS_URL deve apontar ao serviço Python hospedado, sem credenciais ou parâmetros.');
 const recuperacaoNaPrevia=env.VERCEL_ENV==='preview'&&env.PASSWORD_RESET_ORIGIN==='preview';
 return {
  DATABASE_URL:database.toString(),
  APP_ORIGIN:origin,
  ...(recuperacaoNaPrevia?{PASSWORD_RESET_ORIGIN:origin}:{}),
  ANALYTICS_URL:env.ANALYTICS_URL.replace(/\/+$/,''),
  TATAME_ADMIN_LOCAL:'false',
  SEED_LOCAL:'false',
 };
}
