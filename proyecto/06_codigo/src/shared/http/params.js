import { ValidationError } from './errors.js';

export function parseIdParam(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError("El identificador debe ser un entero positivo", { campo: 'id' });
  return n;
}

export function parseIdempotencyKey(headers) {
  const clave = headers['idempotency-key'];
  return clave ?? null;
}
