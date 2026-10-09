import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const run = (command, args) => { const r = spawnSync(command, args, { stdio: 'inherit', windowsHide: true }); if (r.error || r.status !== 0) { console.error(r.error?.message || 'Falha ao preparar o Python.'); process.exit(1); } };
run(process.env.PYTHON_EXECUTABLE || 'python', ['-m', 'venv', '.venv']);
const python = resolve(process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python');
run(python, ['-m', 'pip', 'install', '-r', 'services/analytics/requirements.txt']);
