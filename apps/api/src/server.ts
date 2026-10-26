import 'dotenv/config';
import { createApp } from './app.js';
import { createRepository, SqliteRepository } from './repository.js';
import { seed } from './seed.js';
const repo=createRepository();
if(repo instanceof SqliteRepository && repo.migration.applied.length) {
  console.log(`SQLite atualizado para a versão ${repo.migration.version}.${repo.migration.backupPath ? ` Backup anterior: ${repo.migration.backupPath}` : ''}`);
}
if(repo instanceof SqliteRepository && repo.fresh && process.env.SEED_LOCAL!=='false') await seed(repo);
const app=createApp(repo, { localAdmin: process.env.TATAME_ADMIN_LOCAL === 'true' });
const server=app.listen(Number(process.env.PORT||3333),process.env.HOST||'127.0.0.1',()=>console.log(`API pronta: http://127.0.0.1:${process.env.PORT||3333} · ${repo.kind}`));
let closing=false;
const close=()=>{ if(closing) return; closing=true; server.close(async()=>{ await repo.close(); process.exit(0); }); };
process.on('SIGTERM',close);process.on('SIGINT',close);
