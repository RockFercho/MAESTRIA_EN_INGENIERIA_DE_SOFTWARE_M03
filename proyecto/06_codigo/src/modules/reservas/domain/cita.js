import { ValidationError } from '../../../shared/http/errors.js';
import { esFechaValida, minutosDesdeMedianoche } from '../../../shared/time/lapaz.js';

export const ESTADOS = ['Confirmada', 'En atención', 'Atendida', 'Cancelada', 'No asistida'];
export const TRANSICIONES = {
  'Confirmada': ['En atención', 'Cancelada', 'No asistida'],
  'En atención': ['Atendida'],
  'Atendida': [],
  'Cancelada': [],
  'No asistida': [],
};
const FINALES = ['Atendida', 'Cancelada', 'No asistida'];

export function esEstadoFinal(estado) {
  return FINALES.includes(estado);
}

export function transicionPermitida(desde, hacia) {
  return (TRANSICIONES[desde] ?? []).includes(hacia);
}

function idPositivo(valor, campo) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError(`'${campo}' debe ser un entero positivo`, { campo });
  return n;
}

export function parseReservaBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('El cuerpo debe ser un objeto JSON');
  if (!esFechaValida(body.fecha)) throw new ValidationError("'fecha' debe ser YYYY-MM-DD válido", { campo: 'fecha' });
  if (minutosDesdeMedianoche(body.hora_inicio) === null) throw new ValidationError("'hora_inicio' debe ser HH:MM válido", { campo: 'hora_inicio' });
  return {
    servicio_id: idPositivo(body.servicio_id, 'servicio_id'),
    profesional_id: idPositivo(body.profesional_id, 'profesional_id'),
    fecha: body.fecha,
    hora_inicio: body.hora_inicio,
  };
}

export function parseReprogramarBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('El cuerpo debe ser un objeto JSON');
  if (!esFechaValida(body.fecha)) throw new ValidationError("'fecha' debe ser YYYY-MM-DD válido", { campo: 'fecha' });
  if (minutosDesdeMedianoche(body.hora_inicio) === null) throw new ValidationError("'hora_inicio' debe ser HH:MM válido", { campo: 'hora_inicio' });
  return { fecha: body.fecha, hora_inicio: body.hora_inicio, justificacion: validarJustificacionOpcional(body.justificacion) };
}

export function parseCancelarBody(body) {
  if (body !== undefined && body !== null && (typeof body !== 'object' || Array.isArray(body))) {
    throw new ValidationError('El cuerpo debe ser un objeto JSON');
  }
  return { justificacion: validarJustificacionOpcional(body?.justificacion) };
}

function validarJustificacionOpcional(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string' || valor.length > 500) {
    throw new ValidationError("'justificacion' debe ser texto de máximo 500 caracteres", { campo: 'justificacion' });
  }
  return valor;
}

export function justificacionRequerida(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('El cuerpo debe ser un objeto JSON');
  const justificacion = validarJustificacionOpcional(body.justificacion);
  if (!justificacion) throw new ValidationError("'justificacion' es obligatoria para cambios fuera de plazo", { campo: 'justificacion' });
  return justificacion;
}

export function puedeModificarCita(rol, usuarioId, cita, profesionalIdAsignado = null) {
  if (rol === 'administrador') return true;
  if (rol === 'solicitante') return cita.solicitante_id === usuarioId;
  if (rol === 'profesional') return profesionalIdAsignado !== null && cita.profesional_id === profesionalIdAsignado;
  return false;
}

export function aSeguroCita(row) {
  return {
    id: row.id,
    solicitante_id: row.solicitante_id,
    profesional_id: row.profesional_id,
    servicio_id: row.servicio_id,
    inicio_utc: row.inicio_utc,
    fin_utc: row.fin_utc,
    duracion_efectiva_min: row.duracion_efectiva_min,
    estado: row.estado,
    justificacion_cambio: row.justificacion_cambio,
  };
}
