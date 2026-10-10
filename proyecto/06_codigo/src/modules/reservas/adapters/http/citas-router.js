import { Router } from 'express';
import { parseIdParam } from '../../../../shared/http/params.js';
import { ValidationError } from '../../../../shared/http/errors.js';
import { ESTADOS, parseReservaBody, parseReprogramarBody, parseCancelarBody } from '../../domain/cita.js';

export function crearCitasRouter({ casos, casosEstado, protegerReserva, protegerConsulta, protegerGestion, dispararNotificaciones }) {
  const router = Router();
  const despacho = async (fn) => {
    const r = await fn();
    try { await dispararNotificaciones(); } catch (err) { console.error('[reservas] notificación desacoplada falló (la operación ya está confirmada):', err.message); }
    return r;
  };

  router.post('/', ...protegerReserva, async (req, res, next) => {
    try {
      const datos = parseReservaBody(req.body);
      const idempotencyKey = req.headers['idempotency-key'];
      const r = await despacho(() => casos.crearReserva({ solicitanteId: req.sesion.usuarioId, datos, idempotencyKey }));
      res.status(r.replique ? 200 : 201).json(r);
    } catch (err) { next(err); }
  });

  router.get('/mias', ...protegerConsulta, async (req, res, next) => {
    try {
      res.json(await casos.misCitas({ solicitanteId: req.sesion.usuarioId, estado: req.query.estado, fecha: req.query.fecha }));
    } catch (err) { next(err); }
  });

  router.get('/', ...protegerGestion, async (req, res, next) => {
    try {
      const profesionalId = req.query.profesional_id !== undefined ? Number(req.query.profesional_id) : null;
      if (profesionalId !== null && (!Number.isInteger(profesionalId) || profesionalId <= 0)) {
        throw new ValidationError("'profesional_id' debe ser un entero positivo", { campo: 'profesional_id' });
      }
      res.json(await casos.listarCitas({
        actor: req.sesion,
        estado: req.query.estado,
        fecha: req.query.fecha,
        profesionalId,
      }));
    } catch (err) { next(err); }
  });

  router.put('/:id/reprogramar', ...protegerConsulta, async (req, res, next) => {
    try {
      const datos = parseReprogramarBody(req.body);
      const idempotencyKey = req.headers['idempotency-key'];
      const r = await despacho(() => casos.reprogramarCita({ citaId: parseIdParam(req.params.id), actor: req.sesion, datos, idempotencyKey }));
      res.json(r);
    } catch (err) { next(err); }
  });

  router.put('/:id/cancelar', ...protegerConsulta, async (req, res, next) => {
    try {
      const datos = parseCancelarBody(req.body);
      const idempotencyKey = req.headers['idempotency-key'];
      const r = await despacho(() => casos.cancelarCita({ citaId: parseIdParam(req.params.id), actor: req.sesion, datos, idempotencyKey }));
      res.json(r);
    } catch (err) { next(err); }
  });

  router.put('/:id/estado', ...protegerGestion, async (req, res, next) => {
    try {
      const estadoNuevo = req.body?.estado;
      if (!ESTADOS.includes(estadoNuevo)) {
        throw new ValidationError("'estado' debe ser un estado de cita válido (RF-020)", { campo: 'estado' });
      }
      res.json(await casosEstado.cambiarEstado({ citaId: parseIdParam(req.params.id), actor: req.sesion, estadoNuevo }));
    } catch (err) { next(err); }
  });

  return router;
}
