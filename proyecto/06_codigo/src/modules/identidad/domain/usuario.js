import { ValidationError } from '../../../shared/http/errors.js';

const ROLES = new Set(['solicitante', 'profesional', 'administrador']);

export function parseLoginBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('El cuerpo debe ser un objeto JSON');
  }
  const correo = typeof body.correo === 'string' ? body.correo.trim().toLowerCase() : '';
  if (!correo || correo.length > 254 || !correo.includes('@')) {
    throw new ValidationError("'correo' debe ser un correo electrónico válido", { campo: 'correo' });
  }
  const contrasena = body.contrasena;
  if (typeof contrasena !== 'string' || contrasena.length === 0 || contrasena.length > 1024) {
    throw new ValidationError("'contrasena' es obligatoria", { campo: 'contrasena' });
  }
  return { correo, contrasena };
}

export function toUsuarioSeguro(row) {
  return {
    id: row.id,
    nombre_completo: row.nombre_completo,
    correo: row.correo,
    rol: row.rol,
  };
}

export function esRolValido(rol) {
  return ROLES.has(rol);
}

export function parseRegistroBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('El cuerpo debe ser un objeto JSON');
  }
  if (body.rol !== undefined) {
    throw new ValidationError('En el registro público el rol siempre es solicitante', { campo: 'rol' });
  }
  const nombre = typeof body.nombre_completo === 'string' ? body.nombre_completo.trim() : '';
  if (!nombre || nombre.length > 150) {
    throw new ValidationError("'nombre_completo' debe ser un texto de 1 a 150 caracteres", { campo: 'nombre_completo' });
  }
  const correo = typeof body.correo === 'string' ? body.correo.trim().toLowerCase() : '';
  if (!correo || !correo.includes('@') || correo.length > 254) {
    throw new ValidationError("'correo' debe ser un correo electrónico válido", { campo: 'correo' });
  }
  if (typeof body.contrasena !== 'string' || body.contrasena.length < 12 || body.contrasena.length > 200) {
    throw new ValidationError("'contrasena' debe tener entre 12 y 200 caracteres (RNF-029)", { campo: 'contrasena' });
  }
  return { nombre_completo: nombre, correo, contrasena: body.contrasena };
}
