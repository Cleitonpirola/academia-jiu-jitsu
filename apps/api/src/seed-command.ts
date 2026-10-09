import 'dotenv/config';
import { createRepository } from './repository.js';
import { seed } from './seed.js';
const repo=createRepository();
try { console.log(await seed(repo) ? '20 alunos fictícios e seus históricos criados.' : 'Banco já possui alunos. Nenhum registro foi alterado.'); }
finally { await repo.close(); }
