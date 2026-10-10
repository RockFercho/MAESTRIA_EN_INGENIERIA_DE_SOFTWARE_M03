import { ValidationError } from '../../../shared/http/errors.js';

const ESTADOS = new Set(['activo', 'inactivo']);
const MAX_NOMBRE = 100;
const MAX_DESCRIPCION = 500;
const MAX_DURACION = 1440;

export function parseEstadoQuery(valor) {
  if (valor === undefined || valor === '') return undefined;
  if (!ESTADOS.has(valor)) {
    throw new ValidationError("Parámetro 'estado' inválido: use 'activo' o 'inactivo'", { parametro: 'estado' });
  }
  return valor;
}

export function parseIdParam(valor) {
  const texto = String(valor ?? '').trim();
  if (!/^\d+$/.test(texto)) {
    throw new ValidationError("Parámetro 'id' inválido: debe ser un entero positivo", { parametro: 'id' });
  }
  const id = Number(texto);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ValidationError("Parámetro 'id' inválido: debe ser un entero positivo", { parametro: 'id' });
  }
  return id;
}

function validarNombre(nombre, requerido) {
  if (nombre === undefined && !requerido) {
    throw new ValidationError("El campo 'nombre' es obligatorio", { campo: 'nombre' });
  }
  if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.trim().length > MAX_NOMBRE) {
    throw new ValidationError(`'nombre' debe ser un texto de 1 a ${MAX_NOMBRE} caracteres`, { campo: 'nombre' });
  }
  return nombre.trim();
}

function validarDescripcion(descripcion) {
  if (descripcion === undefined || descripcion === null) return null;
  if (typeof descripcion !== 'string' || descripcion.length > MAX_DESCRIPCION) {
    throw new ValidationError(`'descripcion' debe ser texto de máximo ${MAX_DESCRIPCION} caracteres o null`, { campo: 'descripcion' });
  }
  return descripcion;
}

function validarDuracion(duracion, requerido) {
  if (duracion === undefined && !requerido) {
    throw new ValidationError("El campo 'duracion_minutos' es obligatorio", { campo: 'duracion_minutos' });
  }
  if (!Number.isInteger(duracion) || duracion < 1 || duracion > MAX_DURACION) {
    throw new ValidationError(`'duracion_minutos' debe ser un entero entre 1 y ${MAX_DURACION}`, { campo: 'duracion_minutos' });
  }
  return duracion;
}

function validarEstado(estado) {
  if (!ESTADOS.has(estado)) {
    throw new ValidationError("'estado' debe ser 'activo' o 'inactivo'", { campo: 'estado' });
  }
  return estado;
}

function cuerpoObjeto(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('El cuerpo debe ser un objeto JSON');
  }
  return body;
}

export function parseCrearServicioBody(body) {
  const b = cuerpoObjeto(body);
  return {
    nombre: validarNombre(b.nombre, true),
    descripcion: validarDescripcion(b.descripcion),
    duracion_minutos: validarDuracion(b.duracion_minutos, true),
    estado: validarEstado(b.estado === undefined ? 'activo' : b.estado),
  };
}

export function parseActualizarServicioBody(body) {
  const b = cuerpoObjeto(body);
  return {
    nombre: validarNombre(b.nombre, true),
    descripcion: validarDescripcion(b.descripcion),
    duracion_minutos: validarDuracion(b.duracion_minutos, true),
    estado: validarEstado(b.estado === undefined ? 'activo' : b.estado),
  };
}

export function toServicio(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    duracion_minutos: row.duracion_minutos,
    estado: row.estado,
  };
}
