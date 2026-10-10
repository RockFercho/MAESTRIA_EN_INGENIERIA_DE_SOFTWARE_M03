import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const LONGITUD_MINIMA = 12;
const LONGITUD_MAXIMA = 200;

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEYLEN, { N, R, P }).toString('hex');
  return `scrypt$${N}$${R}$${P}$${salt}$${hash}`;
}

export function verifyPassword(password, almacenado) {
  try {
    const partes = String(almacenado ?? '').split('$');
    if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
    const [, n, r, p, salt, hashHex] = partes;
    const esperado = Buffer.from(hashHex, 'hex');
    const calculado = scryptSync(String(password), salt, esperado.length, {
      N: Number(n), R: Number(r), P: Number(p),
    });
    return timingSafeEqual(esperado, calculado);
  } catch {
    return false;
  }
}

export function passwordSeguraValida(password) {
  return typeof password === 'string' && password.length >= LONGITUD_MINIMA && password.length <= LONGITUD_MAXIMA;
}

export const HASH_FANTASMA = hashPassword(randomBytes(16).toString('hex'));
