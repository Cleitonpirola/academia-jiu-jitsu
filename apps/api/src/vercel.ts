import {vercelRuntimeConfig} from './vercel-config.js';
import {createApp} from './app.js';
import {createRepository} from './repository.js';

// Sem listen, seeds ou migrações na inicialização da função hospedada.
Object.assign(process.env,vercelRuntimeConfig(process.env));
const repo=createRepository();
export default createApp(repo,{localAdmin:false,serveFrontend:false});
