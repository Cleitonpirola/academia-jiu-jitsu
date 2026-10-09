import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const python = resolve(process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python');
const result = spawnSync(python, ['-m', 'unittest', 'discover', '-s', 'services/analytics', '-p', 'test_*.py', '-v'], { stdio: 'inherit', windowsHide: true });
process.exit(result.status ?? 1);
