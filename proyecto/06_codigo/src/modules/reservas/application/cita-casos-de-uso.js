import { AppError, ValidationError, NotFoundError } from '../../../shared/http/errors.js';
import {
  parseReservaBody,
  parseReprogramarBody,
  parseCancelarBody,
  transicionPermitida,
  puedeModificarCita,
  aSeguroCita,
} from '../domain/cita.js';
import { slotDisponible } from '../../agenda/domain/disponibilidad.js';
import { aUtc, aLocal, minutosEntreUtc } from '../../../shared/time/lapaz.js';
import { ahoraUtcMysql } from '../../../shared/time/utc.js';
import { valorMinutosParametro, MINUTOS_REPROGRAMAR_CANCELAR_APROBADOS } from '../../parametros/application/parametros-casos-de-uso.js';

const TTL_HORAS = 24;
const EVENTOS = { cita_confirmada: 'confirmada', cita_reprogramada: 'reprogramada', cita_cancelada: 'cancelada' };

function validarClaveIdempotencia(clave) {
  if (typeof clave !== 'string' || clave.length < 8 || clave.length > 128 || !/^[\x21-\x7e]+$/.test(clave)) {
    throw new ValidationError("'Idempotency-Key' debe ser un texto de 8 a 128 caracteres imprimibles", { campo: 'Idempotency-Key' });
  }
  return clave;
}

function normalizarClave(f) {
  return {
    tipo_operacion: f.tipo_operacion ?? f.tipoOperacion,
    solicitud: f.solicitud_original ?? f.solicitud,
    resultado: f.resultado,
  };
}

async function resolverRepliqueClave(repos, { clave, tipoOperacion, datosSolicitud }) {
  const previa = await repos.claves.findByClave(clave);
  if (!previa) return null;
  const norm = normalizarClave(previa);
  if (norm.tipo_operacion !== tipoOperacion) {
    throw new AppError('La clave Idempotency-Key ya fue utilizada para otra operación', { status: 409, code: 'CONFLICTO_IDEMPOTENCIA' });
  }
  const solicitudPrevia = JSON.parse(norm.solicitud);
  const misma = Object.entries(datosSolicitud).every(([k, v]) => solicitudPrevia[k] === v);
  if (!misma) {
    throw new AppError('La clave Idempotency-Key ya fue utilizada con una solicitud distinta', { status: 409, code: 'CONFLICTO_IDEMPOTENCIA' });
  }
  return JSON.parse(norm.resultado);
}

async function registrarClave(repos, { clave, actorId, tipoOperacion, datos, resultado, ahora }) {
  await repos.claves.create({
    clave,
    usuarioId: actorId,
    tipoOperacion,
    solicitud: JSON.stringify(datos),
    resultado: JSON.stringify(resultado),
    creadaUtc: ahora,
    caducaUtc: new Date(ahora.getTime() + TTL_HORAS * 3600000),
  });
}

function instantaneaCita(cita) {
  const inicio = aLocal(new Date(cita.inicio_utc));
  return JSON.stringify({
    ...aSeguroCita(cita),
    inicio_local: `${inicio.fecha} ${inicio.hora}`,
  });
}

async function encolarEvento(repos, { tipo, citaId, ahora, carga }) {
  await repos.outbox.insert({
    correlacion_id: `cita-${citaId}-${tipo}-${ahora.getTime()}`,
    tipo_evento: tipo,
    cita_id: citaId,
    carga: JSON.stringify({ evento: EVENTOS[tipo], destinatario_id: carga.destinatario_id, instantanea_datos: carga.instantanea_datos }),
    ahora: ahoraUtcMysql(ahora),
  });
}

function exigirAsociacionActiva(asociacion) {
  if (!asociacion || asociacion.estado !== 'activa') {
    throw new AppError('El profesional no tiene una asociación activa con el servicio', { status: 409, code: 'CONFLICTO_ASOCIACION' });
  }
}

async function validarSlotServicio(repos, { profesionalId, fecha, hora_inicio, duracion }) {
  const [horarios, excepciones] = await Promise.all([
    repos.horarios.findAllByProfesional(profesionalId),
    repos.excepciones.findAllByProfesional(profesionalId, fecha),
  ]);
  if (!slotDisponible({ horarios, excepciones, citas: [], fecha, duracionMin: duracion }, hora_inicio)) {
    throw new AppError('El intervalo solicitado está fuera del horario permitido o afectado por una excepción', { status: 409, code: 'INTERVALO_NO_DISPONIBLE' });
  }
}

export function crearCrearReserva({ ejecutarTransaccion, reloj = () => new Date() }) {
  return async function crearReserva({ solicitanteId, datos, idempotencyKey }) {
    const clave = validarClaveIdempotencia(idempotencyKey);
    return ejecutarTransaccion({ lock: `cita-prof-${datos.profesional_id}` }, async (repos) => {
      const replique = await resolverRepliqueClave(repos, {
        clave,
        tipoOperacion: 'reserva',
        datosSolicitud: {
          solicitante_id: solicitanteId,
          profesional_id: datos.profesional_id,
          servicio_id: datos.servicio_id,
          fecha: datos.fecha,
          hora_inicio: datos.hora_inicio,
        },
      });
      if (replique) return { replique: true, cita: replique };

      const ahora = reloj();
      const profesional = await repos.profesionales.findById(datos.profesional_id);
      if (!profesional || profesional.estado !== 'activo') throw new NotFoundError('Profesional inexistente o inactivo');
      const servicio = await repos.servicios.findById(datos.servicio_id);
      if (!servicio || servicio.estado !== 'activo') throw new NotFoundError('Servicio inexistente o inactivo');
      const asociacion = await repos.asociaciones.findByClaves(datos.profesional_id, datos.servicio_id);
      exigirAsociacionActiva(asociacion);
      const duracion = asociacion.duracion_especifica ?? servicio.duracion_minutos;

      const minAnticipacion = await valorMinutosParametro(repos.parametros, 'anticipacion_reservar', null);
      if (minAnticipacion === null) {
        throw new AppError('Política de anticipación para reservar no configurada (RF-025/RN-12: requiere aprobación del responsable); no se aceptan reservas en línea', { status: 409, code: 'POLITICA_NO_CONFIGURADA' });
      }
      const inicio = aUtc(datos.fecha, datos.hora_inicio);
      const fin = new Date(inicio.getTime() + duracion * 60000);
      if (minutosEntreUtc(ahora, inicio) < minAnticipacion) {
        throw new ValidationError(`La reserva requiere al menos ${minAnticipacion} minutos de anticipación`, { campo: 'fecha' });
      }

      await validarSlotServicio(repos, { profesionalId: datos.profesional_id, fecha: datos.fecha, hora_inicio: datos.hora_inicio, duracion });
      if ((await repos.citas.findSolapadas(datos.profesional_id, inicio, fin)).length) {
        throw new AppError('El intervalo solicitado se encuentra ocupado por otra cita', { status: 409, code: 'INTERVALO_OCUPADO' });
      }

      const cita = await repos.citas.create({
        solicitante_id: solicitanteId,
        profesional_id: datos.profesional_id,
        servicio_id: datos.servicio_id,
        inicio_utc: inicio,
        fin_utc: fin,
        duracion_efectiva_min: duracion,
        ahora,
      });
      await repos.auditoria.insert({
        usuario_id: solicitanteId,
        cita_id: cita.id,
        tipo_operacion: 'reserva',
        fecha_hora_utc: ahora,
        resultado: 'exito',
        contexto: JSON.stringify({ idempotencia: clave, servicio: servicio.nombre }),
      });
      await encolarEvento(repos, {
        tipo: 'cita_confirmada',
        citaId: cita.id,
        ahora,
        carga: { destinatario_id: solicitanteId, instantanea_datos: instantaneaCita(cita) },
      });
      const seguro = aSeguroCita(cita);
      await registrarClave(repos, {
        clave,
        actorId: solicitanteId,
        tipoOperacion: 'reserva',
        datos: {
          solicitante_id: solicitanteId,
          profesional_id: datos.profesional_id,
          servicio_id: datos.servicio_id,
          fecha: datos.fecha,
          hora_inicio: datos.hora_inicio,
        },
        resultado: seguro,
        ahora,
      });
      return { replique: false, cita: seguro };
    });
  };
}

async function exigirEligibilidad({ repos, cita, actor, ahora, minAnticipacion, justificacion, esReprogramacion }) {
  const perfil = actor.rol === 'profesional' ? await repos.profesionales.findByUsuarioId(actor.id) : null;
  const profesionalIdAsignado = perfil?.id ?? null;
  if (!puedeModificarCita(actor.rol, actor.id, cita, profesionalIdAsignado)) {
    throw new AppError('No autorizado para modificar esta cita', { status: 403, code: 'FORBIDDEN' });
  }
  if (cita.estado !== 'Confirmada') {
    throw new AppError('Solo las citas en estado Confirmada pueden modificarse (RN-08/RN-13)', { status: 409, code: 'ESTADO_NO_MODIFICABLE' });
  }
  const inicioActual = new Date(cita.inicio_utc);
  const fueraPlazo = minutosEntreUtc(ahora, inicioActual) < minAnticipacion;
  const esGestor = actor.rol === 'administrador' || actor.rol === 'profesional';
  if (fueraPlazo) {
    if (!esGestor) {
      const operacion = esReprogramacion ? 'reprogramar' : 'cancelar';
      throw new AppError(`No puede ${operacion} fuera del plazo mínimo de ${minAnticipacion} minutos (RN-13)`, { status: 409, code: 'FUERA_DE_PLAZO' });
    }
    if (!justificacion) {
      throw new ValidationError("'justificacion' es obligatoria para cambios fuera del plazo mínimo (RN-14)", { campo: 'justificacion' });
    }
  }
}

export function crearReprogramarCita({ ejecutarTransaccion, reloj = () => new Date() }) {
  return async function reprogramarCita({ citaId, actor, datos, idempotencyKey }) {
    const clave = validarClaveIdempotencia(idempotencyKey);
    const preliminar = await ejecutarTransaccion({}, (repos) => repos.citas.findById(citaId));
    if (!preliminar) throw new NotFoundError('Cita no encontrada');
    return ejecutarTransaccion({ lock: `cita-prof-${preliminar.profesional_id}` }, async (repos) => {
      const replique = await resolverRepliqueClave(repos, {
        clave,
        tipoOperacion: 'reprogramacion',
        datosSolicitud: { cita_id: citaId, usuario_id: actor.id, fecha: datos.fecha, hora_inicio: datos.hora_inicio },
      });
      if (replique) return { replique: true, cita: replique };

      const ahora = reloj();
      const cita = await repos.citas.findById(citaId);
      if (!cita) throw new NotFoundError('Cita no encontrada');
      const minAnticipacion = await valorMinutosParametro(repos.parametros, 'anticipacion_reprogramar', MINUTOS_REPROGRAMAR_CANCELAR_APROBADOS);
      await exigirEligibilidad({ repos, cita, actor, ahora, minAnticipacion, justificacion: datos.justificacion, esReprogramacion: true });

      const asociacion = await repos.asociaciones.findByClaves(cita.profesional_id, cita.servicio_id);
      exigirAsociacionActiva(asociacion);

      const duracion = cita.duracion_efectiva_min;
      const inicioNuevo = aUtc(datos.fecha, datos.hora_inicio);
      const finNuevo = new Date(inicioNuevo.getTime() + duracion * 60000);
      if (inicioNuevo.getTime() === new Date(cita.inicio_utc).getTime()) {
        throw new ValidationError('El nuevo horario debe ser distinto al horario actual', { campo: 'hora_inicio' });
      }
      await validarSlotServicio(repos, { profesionalId: cita.profesional_id, fecha: datos.fecha, hora_inicio: datos.hora_inicio, duracion });
      if ((await repos.citas.findSolapadas(cita.profesional_id, inicioNuevo, finNuevo, citaId)).length) {
        throw new AppError('El nuevo intervalo se encuentra ocupado por otra cita', { status: 409, code: 'INTERVALO_OCUPADO' });
      }

      const actualizada = await repos.citas.update(citaId, {
        inicio_utc: inicioNuevo,
        fin_utc: finNuevo,
        estado: 'Confirmada',
        justificacion_cambio: datos.justificacion,
        ahora,
      });
      await repos.historial.insert({
        cita_id: citaId,
        usuario_id: actor.id,
        tipo_cambio: 'reprogramacion',
        estado_anterior: 'Confirmada',
        estado_nuevo: 'Confirmada',
        fecha_anterior_utc: new Date(cita.inicio_utc),
        fecha_nueva_utc: inicioNuevo,
        ahora,
        justificacion: datos.justificacion,
      });
      await repos.auditoria.insert({
        usuario_id: actor.id,
        cita_id: citaId,
        tipo_operacion: 'reprogramacion',
        fecha_hora_utc: ahora,
        resultado: 'exito',
        contexto: JSON.stringify({ idempotencia: clave, fuera_plazo: minutosEntreUtc(ahora, new Date(cita.inicio_utc)) < minAnticipacion }),
      });
      await encolarEvento(repos, {
        tipo: 'cita_reprogramada',
        citaId,
        ahora,
        carga: { destinatario_id: cita.solicitante_id, instantanea_datos: instantaneaCita(actualizada) },
      });
      const seguro = aSeguroCita(actualizada);
      await registrarClave(repos, {
        clave,
        actorId: actor.id,
        tipoOperacion: 'reprogramacion',
        datos: { cita_id: citaId, usuario_id: actor.id, fecha: datos.fecha, hora_inicio: datos.hora_inicio },
        resultado: seguro,
        ahora,
      });
      return { replique: false, cita: seguro };
    });
  };
}

export function crearCancelarCita({ ejecutarTransaccion, reloj = () => new Date() }) {
  return async function cancelarCita({ citaId, actor, datos, idempotencyKey }) {
    const clave = validarClaveIdempotencia(idempotencyKey);
    const preliminar = await ejecutarTransaccion({}, (repos) => repos.citas.findById(citaId));
    if (!preliminar) throw new NotFoundError('Cita no encontrada');
    return ejecutarTransaccion({ lock: `cita-prof-${preliminar.profesional_id}` }, async (repos) => {
      const replique = await resolverRepliqueClave(repos, {
        clave,
        tipoOperacion: 'cancelacion',
        datosSolicitud: { cita_id: citaId, usuario_id: actor.id },
      });
      if (replique) return { replique: true, cita: replique };

      const ahora = reloj();
      const cita = await repos.citas.findById(citaId);
      if (!cita) throw new NotFoundError('Cita no encontrada');
      const minAnticipacion = await valorMinutosParametro(repos.parametros, 'anticipacion_cancelar', MINUTOS_REPROGRAMAR_CANCELAR_APROBADOS);
      await exigirEligibilidad({ repos, cita, actor, ahora, minAnticipacion, justificacion: datos.justificacion, esReprogramacion: false });

      const actualizada = await repos.citas.update(citaId, {
        inicio_utc: new Date(cita.inicio_utc),
        fin_utc: new Date(cita.fin_utc),
        estado: 'Cancelada',
        justificacion_cambio: datos.justificacion,
        ahora,
      });
      await repos.historial.insert({
        cita_id: citaId,
        usuario_id: actor.id,
        tipo_cambio: 'cambio_estado',
        estado_anterior: 'Confirmada',
        estado_nuevo: 'Cancelada',
        fecha_anterior_utc: null,
        fecha_nueva_utc: null,
        ahora,
        justificacion: datos.justificacion,
      });
      await repos.auditoria.insert({
        usuario_id: actor.id,
        cita_id: citaId,
        tipo_operacion: 'cancelacion',
        fecha_hora_utc: ahora,
        resultado: 'exito',
        contexto: JSON.stringify({ idempotencia: clave, fuera_plazo: minutosEntreUtc(ahora, new Date(cita.inicio_utc)) < minAnticipacion }),
      });
      await encolarEvento(repos, {
        tipo: 'cita_cancelada',
        citaId,
        ahora,
        carga: { destinatario_id: cita.solicitante_id, instantanea_datos: instantaneaCita(actualizada) },
      });
      const seguro = aSeguroCita(actualizada);
      await registrarClave(repos, {
        clave,
        actorId: actor.id,
        tipoOperacion: 'cancelacion',
        datos: { cita_id: citaId, usuario_id: actor.id },
        resultado: seguro,
        ahora,
      });
      return { replique: false, cita: seguro };
    });
  };
}

export function crearCambiarEstadoCita({ ejecutarTransaccion, reloj = () => new Date() }) {
  return async function cambiarEstado({ citaId, actor, estadoNuevo }) {
    const preliminar = await ejecutarTransaccion({}, (repos) => repos.citas.findById(citaId));
    if (!preliminar) throw new NotFoundError('Cita no encontrada');
    return ejecutarTransaccion({ lock: `cita-prof-${preliminar.profesional_id}` }, async (repos) => {
      const ahora = reloj();
      const cita = await repos.citas.findById(citaId);
      if (!cita) throw new NotFoundError('Cita no encontrada');
      const esAdmin = actor.rol === 'administrador';
      const perfil = actor.rol === 'profesional' ? await repos.profesionales.findByUsuarioId(actor.id) : null;
      const esProfesionalAsignado = actor.rol === 'profesional' && perfil !== null && cita.profesional_id === perfil.id;
      if (!esAdmin && !esProfesionalAsignado) {
        throw new AppError('Solo el administrador o el profesional asignado pueden actualizar el estado (RF-021)', { status: 403, code: 'FORBIDDEN' });
      }
      if (!transicionPermitida(cita.estado, estadoNuevo)) {
        throw new AppError(`Transición de estado no permitida: ${cita.estado} → ${estadoNuevo} (RN-08)`, { status: 409, code: 'TRANSICION_NO_PERMITIDA' });
      }
      const actualizada = await repos.citas.update(citaId, {
        inicio_utc: new Date(cita.inicio_utc),
        fin_utc: new Date(cita.fin_utc),
        estado: estadoNuevo,
        justificacion_cambio: cita.justificacion_cambio,
        ahora,
      });
      await repos.historial.insert({
        cita_id: citaId,
        usuario_id: actor.id,
        tipo_cambio: 'cambio_estado',
        estado_anterior: cita.estado,
        estado_nuevo: estadoNuevo,
        fecha_anterior_utc: null,
        fecha_nueva_utc: null,
        ahora,
        justificacion: null,
      });
      await repos.auditoria.insert({
        usuario_id: actor.id,
        cita_id: citaId,
        tipo_operacion: 'cambio_estado',
        fecha_hora_utc: ahora,
        resultado: 'exito',
        contexto: JSON.stringify({ de: cita.estado, a: estadoNuevo }),
      });
      return aSeguroCita(actualizada);
    });
  };
}

async function nombreProfesionalDe(repos, profesional) {
  if (!profesional) return null;
  if (profesional.nombre_completo) return profesional.nombre_completo;
  if (profesional.usuario_id && repos.usuarioAdmin) {
    const u = await repos.usuarioAdmin.findById(profesional.usuario_id);
    return u?.nombre_completo ?? null;
  }
  return null;
}

async function enriquecerCita(cita, repos) {
  const [profesional, servicio] = await Promise.all([
    repos.profesionales.findById(cita.profesional_id),
    repos.servicios.findById(cita.servicio_id),
  ]);
  const inicio = aLocal(new Date(cita.inicio_utc));
  return {
    ...aSeguroCita(cita),
    fecha_local: inicio.fecha,
    hora_local: inicio.hora,
    profesional_nombre: await nombreProfesionalDe(repos, profesional),
    servicio_nombre: servicio?.nombre ?? null,
  };
}

function validarFiltrosCitaQuery({ estado, fecha }) {
  const ESTADOS = ['Confirmada', 'En atención', 'Atendida', 'Cancelada', 'No asistida'];
  let est = null;
  if (estado !== undefined && estado !== null && estado !== '') {
    if (!ESTADOS.includes(estado)) throw new ValidationError("'estado' debe ser un estado de cita válido", { campo: 'estado' });
    est = estado;
  }
  let fch = null;
  if (fecha !== undefined && fecha !== null && fecha !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new ValidationError("'fecha' debe ser YYYY-MM-DD", { campo: 'fecha' });
    fch = fecha;
  }
  return { estado: est, fecha: fch };
}

export function crearConsultarCitas({ ejecutarTransaccion }) {
  return {
    misCitas: ({ solicitanteId, estado, fecha }) => ejecutarTransaccion({}, async (repos) => {
      const filtros = validarFiltrosCitaQuery({ estado, fecha });
      const citas = await repos.citas.findAll({ solicitanteId, ...filtros });
      return Promise.all(citas.map((c) => enriquecerCita(c, repos)));
    }),

    listarCitas: ({ actor, estado, fecha, profesionalId }) => ejecutarTransaccion({}, async (repos) => {
      const filtros = validarFiltrosCitaQuery({ estado, fecha });
      let filtroProfesional = profesionalId ?? null;
      if (actor.rol === 'administrador') {
        const citas = await repos.citas.findAll({ ...filtros, profesionalId: filtroProfesional });
        return Promise.all(citas.map((c) => enriquecerCita(c, repos)));
      }
      if (actor.rol === 'profesional') {
        const perfil = await repos.profesionales.findByUsuarioId(actor.id);
        if (!perfil) {
          throw new AppError('No autorizado para listar todas las citas; use /citas/mias', { status: 403, code: 'FORBIDDEN' });
        }
        if (filtroProfesional !== null && Number(filtroProfesional) !== perfil.id) {
          throw new AppError('Un profesional solo puede consultar sus propias citas (RF-023)', { status: 403, code: 'FORBIDDEN' });
        }
        const citas = await repos.citas.findAll({ ...filtros, profesionalId: perfil.id });
        return Promise.all(citas.map((c) => enriquecerCita(c, repos)));
      }
      throw new AppError('No autorizado para listar todas las citas; use /citas/mias', { status: 403, code: 'FORBIDDEN' });
    }),
  };
}

export { parseReservaBody, parseReprogramarBody, parseCancelarBody };
