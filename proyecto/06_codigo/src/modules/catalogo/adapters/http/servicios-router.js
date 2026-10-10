import { Router } from 'express';
import {
  parseEstadoQuery,
  parseIdParam,
  parseCrearServicioBody,
  parseActualizarServicioBody,
} from '../../domain/servicio.js';
import { NotFoundError } from '../../../../shared/http/errors.js';

export function crearServiciosRouter({
  listarServicios,
  obtenerServicio,
  crearServicio,
  actualizarServicio,
  desactivarServicio,
  protegerMutaciones,
}) {
  const router = Router();
  const guard = Array.isArray(protegerMutaciones) ? protegerMutaciones : protegerMutaciones ? [protegerMutaciones] : [];

  router.get('/', async (req, res, next) => {
    try {
      const estado = parseEstadoQuery(req.query.estado);
      res.json(await listarServicios({ estado }));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      const servicio = await obtenerServicio({ id });
      if (!servicio) throw new NotFoundError('Servicio no encontrado');
      res.json(servicio);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', ...guard, async (req, res, next) => {
    try {
      const datos = parseCrearServicioBody(req.body);
      const servicio = await crearServicio({ datos });
      res.status(201).json(servicio);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', ...guard, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      const datos = parseActualizarServicioBody(req.body);
      const servicio = await actualizarServicio({ id, datos });
      if (!servicio) throw new NotFoundError('Servicio no encontrado');
      res.json(servicio);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', ...guard, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      const servicio = await desactivarServicio({ id });
      if (!servicio) throw new NotFoundError('Servicio no encontrado');
      res.json(servicio);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
