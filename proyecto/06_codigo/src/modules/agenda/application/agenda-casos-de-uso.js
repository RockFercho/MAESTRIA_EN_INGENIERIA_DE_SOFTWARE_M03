import { AppError, NotFoundError } from '../../../shared/http/errors.js';
import { parseHorarioBody, parseExcepcionBody } from '../domain/horario.js';
import { intervalosDisponibles } from '../domain/disponibilidad.js';
import { minutosDesdeMedianoche } from '../../../shared/time/lapaz.js';

function solapes(aIni, aFin, bIni, bFin) {
  return aIni < bFin && bIni < aFin;
}

export function crearCasosAgenda({ ejecutarTransaccion }) {
  return {
    listarHorarios: ({ profesionalId }) => ejecutarTransaccion({}, async (r) => {
      const p = await r.profesionales.findById(profesionalId);
      if (!p) throw new NotFoundError('Profesional no encontrado');
      return r.horarios.findAllByProfesional(profesionalId);
    }),

    agregarHorario: ({ profesionalId, body }) => ejecutarTransaccion({}, async (r) => {
      const p = await r.profesionales.findById(profesionalId);
      if (!p || p.estado !== 'activo') throw new NotFoundError('Profesional inexistente o inactivo');
      const datos = parseHorarioBody(body);
      const ini = minutosDesdeMedianoche(datos.hora_inicio);
      const fin = minutosDesdeMedianoche(datos.hora_fin);
      const existentes = await r.horarios.findAllByProfesional(profesionalId);
      const choque = existentes.some((h) => h.dia_semana === datos.dia_semana
        && solapes(ini, fin, minutosDesdeMedianoche(h.hora_inicio), minutosDesdeMedianoche(h.hora_fin)));
      if (choque) throw new AppError('El horario se solapa con uno existente', { status: 409, code: 'CONFLICTO_NEGOCIO' });
      return r.horarios.create({ profesional_id: profesionalId, ...datos });
    }),

    quitarHorario: ({ horarioId }) => ejecutarTransaccion({}, async (r) => {
      const h = await r.horarios.findById(horarioId);
      if (!h) throw new NotFoundError('Horario no encontrado');
      await r.horarios.delete(horarioId);
      return { eliminado: true };
    }),

    listarExcepciones: ({ profesionalId, fecha }) => ejecutarTransaccion({}, async (r) => {
      const p = await r.profesionales.findById(profesionalId);
      if (!p) throw new NotFoundError('Profesional no encontrado');
      return r.excepciones.findAllByProfesional(profesionalId, fecha ?? null);
    }),

    agregarExcepcion: ({ profesionalId, body }) => ejecutarTransaccion({}, async (r) => {
      const p = await r.profesionales.findById(profesionalId);
      if (!p || p.estado !== 'activo') throw new NotFoundError('Profesional inexistente o inactivo');
      const datos = parseExcepcionBody(body);
      return r.excepciones.create({ profesional_id: profesionalId, ...datos });
    }),

    quitarExcepcion: ({ excepcionId }) => ejecutarTransaccion({}, async (r) => {
      const e = await r.excepciones.findById(excepcionId);
      if (!e) throw new NotFoundError('Excepción no encontrada');
      await r.excepciones.delete(excepcionId);
      return { eliminado: true };
    }),

    consultarDisponibilidad: ({ profesionalId, servicioId, fecha }) => ejecutarTransaccion({}, async (r) => {
      const p = await r.profesionales.findById(profesionalId);
      if (!p || p.estado !== 'activo') throw new NotFoundError('Profesional inexistente o inactivo');
      const s = await r.servicios.findById(servicioId);
      if (!s || s.estado !== 'activo') throw new NotFoundError('Servicio inexistente o inactivo');
      const a = await r.asociaciones.findByClaves(profesionalId, servicioId);
      if (!a || a.estado !== 'activa') {
        throw new AppError('El profesional no tiene una asociación activa con el servicio', { status: 409, code: 'CONFLICTO_NEGOCIO' });
      }
      const duracion = a.duracion_especifica ?? s.duracion_minutos;
      const [horarios, excepciones, citas] = await Promise.all([
        r.horarios.findAllByProfesional(profesionalId),
        r.excepciones.findAllByProfesional(profesionalId, fecha),
        r.citas.findAll({ profesionalId, fecha }),
      ]);
      const intervalos = intervalosDisponibles({ horarios, excepciones, citas, fecha, duracionMin: duracion });
      return { profesional_id: profesionalId, servicio_id: servicioId, fecha, duracion_efectiva_min: duracion, intervalos };
    }),
  };
}
