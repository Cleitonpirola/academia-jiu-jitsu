import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { HttpError } from '../../http-error.js';

const config = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
let hashing = 0;
async function derive(password: string, salt: string) {
  if (hashing >= 2) throw new HttpError(429, 'Aguarde um momento antes de tentar novamente.');
  hashing++;
  try {
    return await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, config, (error, key) => error ? reject(error) : resolve(key)));
  } finally { hashing--; }
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$32768$8$3$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string | null) {
  const parts = encoded?.split('$');
  const valid = parts?.length === 6 && parts.slice(0, 4).join('$') === 'scrypt$32768$8$3' && /^[a-f0-9]{32}$/.test(parts[4]) && /^[a-f0-9]{128}$/.test(parts[5]);
  // Mesmo trabalho para identidade inexistente, sem revelar se o e-mail está cadastrado.
  const key = await derive(password, valid ? parts![4] : '00000000000000000000000000000000');
  return Boolean(valid && timingSafeEqual(key, Buffer.from(parts![5], 'hex')));
}
export const newToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
