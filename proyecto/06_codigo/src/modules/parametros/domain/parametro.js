import { ValidationError } from '../../../shared/http/errors.js';

export const CLAVES_CONOCIDAS = ['anticipacion_reservar', 'anticipacion_reprogramar', 'anticipacion_cancelar'];

export function parseParametroBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('El cuerpo debe ser un objeto JSON');
  const clave = typeof body.clave === 'string' ? body.clave.trim() : '';
  if (!CLAVES_CONOCIDAS.includes(clave)) {
    throw new ValidationError(`'clave' debe ser una de: ${CLAVES_CONOCIDAS.join(', ')}`, { campo: 'clave' });
  }
  const n = Number(body.valor);
  if (!Number.isInteger(n) || n < 0 || n > 10080) {
    throw new ValidationError("'valor' debe ser un entero de minutos entre 0 y 10080", { campo: 'valor' });
  }
  if (body.descripcion !== undefined && body.descripcion !== null && (typeof body.descripcion !== 'string' || body.descripcion.length > 200)) {
    throw new ValidationError("'descripcion' debe ser texto de máximo 200 caracteres", { campo: 'descripcion' });
  }
  return { clave, valor: String(n), descripcion: body.descripcion ?? null };
}
