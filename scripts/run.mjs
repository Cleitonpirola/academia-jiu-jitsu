import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import 'dotenv/config';
const production = process.argv.includes('--production');
const python = resolve(process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python');
const children = [];
const launch = (command, args, label) => {
  const child = spawn(command, args, { stdio: 'inherit', windowsHide: true, env: process.env });
  children.push(child);
  child.on('error', error => { console.error(`${label}: ${error.message}`); stop(1); });
  child.on('exit', code => { if (code && !stopping) { console.error(`${label} encerrou (${code}).`); stop(code); } });
};
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; children.forEach(c => c.kill()); setTimeout(() => process.exit(code), 250); }
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());
if (existsSync(python)) launch(python, ['-m', 'uvicorn', 'app:app', '--app-dir', 'services/analytics', '--host', '127.0.0.1', '--port', '8000'], 'Analytics');
else console.log('Analytics: execute npm run setup:analytics para ativar o serviço Python.');
launch(process.execPath, ['--import', 'tsx', 'apps/api/src/server.ts'], 'API');
if (!production) launch(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'apps/web/vite.config.ts'], 'Frontend');
console.log(`Tatame: ${production ? 'http://127.0.0.1:3333' : 'http://127.0.0.1:5173'}`);
