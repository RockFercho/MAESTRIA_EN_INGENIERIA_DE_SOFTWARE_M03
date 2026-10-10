import { ValidationError } from '../../../shared/http/errors.js';
import { minutosDesdeMedianoche, esFechaValida } from '../../../shared/time/lapaz.js';

export const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
export const TIPOS_EXCEPCION = ['ausencia', 'feriado', 'bloqueo'];

export function parseHorarioBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('El cuerpo debe ser un objeto JSON');
  if (!DIAS.includes(body.dia_semana)) throw new ValidationError("'dia_semana' debe ser lun..dom", { campo: 'dia_semana' });
  const inicio = minutosDesdeMedianoche(body.hora_inicio);
  const fin = minutosDesdeMedianoche(body.hora_fin);
  if (inicio === null) throw new ValidationError("'hora_inicio' debe ser HH:MM válido", { campo: 'hora_inicio' });
  if (fin === null) throw new ValidationError("'hora_fin' debe ser HH:MM válido", { campo: 'hora_fin' });
  if (fin <= inicio) throw new ValidationError("'hora_fin' debe ser mayor que 'hora_inicio'", { campo: 'hora_fin' });
  return { dia_semana: body.dia_semana, hora_inicio: body.hora_inicio, hora_fin: body.hora_fin };
}

export function parseExcepcionBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('El cuerpo debe ser un objeto JSON');
  if (!esFechaValida(body.fecha)) throw new ValidationError("'fecha' debe ser YYYY-MM-DD válido", { campo: 'fecha' });
  if (!TIPOS_EXCEPCION.includes(body.tipo)) throw new ValidationError("'tipo' debe ser ausencia, feriado o bloqueo", { campo: 'tipo' });
  const hi = body.hora_inicio === undefined || body.hora_inicio === null ? null : minutosDesdeMedianoche(body.hora_inicio);
  const hf = body.hora_fin === undefined || body.hora_fin === null ? null : minutosDesdeMedianoche(body.hora_fin);
  if ((hi === null) !== (hf === null)) throw new ValidationError("'hora_inicio' y 'hora_fin' deben ir juntos o ausentes", { campo: 'hora_inicio' });
  if (hi !== null) {
    if (hi === null || hf === null || hf <= hi) throw new ValidationError("'hora_fin' debe ser mayor que 'hora_inicio'", { campo: 'hora_fin' });
  }
  if (body.motivo !== undefined && body.motivo !== null && (typeof body.motivo !== 'string' || body.motivo.length > 200)) {
    throw new ValidationError("'motivo' debe ser texto de máximo 200 caracteres", { campo: 'motivo' });
  }
  return { fecha: body.fecha, tipo: body.tipo, hora_inicio: body.hora_inicio ?? null, hora_fin: body.hora_fin ?? null, motivo: body.motivo ?? null };
}
