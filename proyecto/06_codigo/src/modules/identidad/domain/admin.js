import { ValidationError } from '../../../shared/http/errors.js';
import { passwordSeguraValida } from '../../../shared/security/passwords.js';

const ROLES = ['solicitante', 'profesional', 'administrador'];
const ESTADOS = ['activo', 'inactivo'];

function cuerpo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('El cuerpo debe ser un objeto JSON');
  return body;
}

function validarCorreo(correo) {
  const c = typeof correo === 'string' ? correo.trim().toLowerCase() : '';
  if (!c || !c.includes('@') || c.length > 254) throw new ValidationError("'correo' debe ser un correo electrónico válido", { campo: 'correo' });
  return c;
}

function validarNombre(nombre) {
  const n = typeof nombre === 'string' ? nombre.trim() : '';
  if (!n || n.length > 150) throw new ValidationError("'nombre_completo' debe ser un texto de 1 a 150 caracteres", { campo: 'nombre_completo' });
  return n;
}

function validarPassword(p) {
  if (!passwordSeguraValida(p)) throw new ValidationError("'contrasena' debe tener entre 12 y 200 caracteres (RNF-029)", { campo: 'contrasena' });
  return p;
}

export function parseCrearUsuarioBody(body) {
  const b = cuerpo(body);
  if (!ROLES.includes(b.rol)) throw new ValidationError("'rol' debe ser solicitante, profesional o administrador", { campo: 'rol' });
  return {
    nombre_completo: validarNombre(b.nombre_completo),
    correo: validarCorreo(b.correo),
    contrasena: validarPassword(b.contrasena),
    rol: b.rol,
  };
}

export function parseActualizarUsuarioBody(body) {
  const b = cuerpo(body);
  if (b.nombre_completo === undefined && b.estado === undefined) throw new ValidationError('Debe indicar nombre_completo y/o estado');
  if (b.estado !== undefined && !ESTADOS.includes(b.estado)) throw new ValidationError("'estado' debe ser activo o inactivo", { campo: 'estado' });
  return { nombre_completo: b.nombre_completo !== undefined ? validarNombre(b.nombre_completo) : undefined, estado: b.estado };
}

export function parseCrearProfesionalBody(body) {
  const b = cuerpo(body);
  if (b.datos_exhibicion !== undefined && b.datos_exhibicion !== null && (typeof b.datos_exhibicion !== 'string' || b.datos_exhibicion.length > 255)) {
    throw new ValidationError("'datos_exhibicion' debe ser texto de máximo 255 caracteres", { campo: 'datos_exhibicion' });
  }
  return {
    nombre_completo: validarNombre(b.nombre_completo),
    correo: validarCorreo(b.correo),
    contrasena: validarPassword(b.contrasena),
    datos_exhibicion: b.datos_exhibicion ?? null,
  };
}

export function parseActualizarProfesionalBody(body) {
  const b = cuerpo(body);
  if (b.datos_exhibicion === undefined && b.estado === undefined) throw new ValidationError('Debe indicar datos_exhibicion y/o estado');
  if (b.estado !== undefined && !ESTADOS.includes(b.estado)) throw new ValidationError("'estado' debe ser activo o inactivo", { campo: 'estado' });
  if (b.datos_exhibicion !== undefined && b.datos_exhibicion !== null && (typeof b.datos_exhibicion !== 'string' || b.datos_exhibicion.length > 255)) {
    throw new ValidationError("'datos_exhibicion' debe ser texto de máximo 255 caracteres", { campo: 'datos_exhibicion' });
  }
  return { datos_exhibicion: b.datos_exhibicion, estado: b.estado };
}

export function parseCrearAsociacionBody(body) {
  const b = cuerpo(body);
  const servicioId = Number(b.servicio_id);
  if (!Number.isInteger(servicioId) || servicioId <= 0) throw new ValidationError("'servicio_id' debe ser un entero positivo", { campo: 'servicio_id' });
  let duracion = null;
  if (b.duracion_especifica !== undefined && b.duracion_especifica !== null) {
    duracion = Number(b.duracion_especifica);
    if (!Number.isInteger(duracion) || duracion < 1 || duracion > 1440) {
      throw new ValidationError("'duracion_especifica' debe ser un entero entre 1 y 1440", { campo: 'duracion_especifica' });
    }
  }
  return { servicioId, duracion };
}

export function parseActualizarAsociacionBody(body) {
  const b = cuerpo(body);
  if (b.duracion_especifica === undefined && b.estado === undefined) throw new ValidationError('Debe indicar duracion_especifica y/o estado');
  if (b.estado !== undefined && !['activa', 'inactiva'].includes(b.estado)) {
    throw new ValidationError("'estado' debe ser activa o inactiva", { campo: 'estado' });
  }
  let duracion;
  if (b.duracion_especifica !== undefined && b.duracion_especifica !== null) {
    duracion = Number(b.duracion_especifica);
    if (!Number.isInteger(duracion) || duracion < 1 || duracion > 1440) {
      throw new ValidationError("'duracion_especifica' debe ser un entero entre 1 y 1440", { campo: 'duracion_especifica' });
    }
  }
  return { duracion, estado: b.estado };
}
