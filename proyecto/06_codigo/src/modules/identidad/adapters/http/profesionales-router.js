import { Router } from 'express';
import { parseIdParam } from '../../../../shared/http/params.js';
import { parseCrearProfesionalBody, parseActualizarProfesionalBody, parseCrearAsociacionBody, parseActualizarAsociacionBody } from '../../domain/admin.js';
import { NotFoundError } from '../../../../shared/http/errors.js';

export function crearProfesionalesRouter({ casos, casosAsociaciones, proteger }) {
  const router = Router();
  const guard = Array.isArray(proteger) ? proteger : [proteger];

  router.get('/', ...guard, async (req, res, next) => {
    try {
      res.json(await casos.listarProfesionales({ estado: req.query.estado ?? null }));
    } catch (err) { next(err); }
  });

  router.get('/:id', ...guard, async (req, res, next) => {
    try {
      res.json(await casos.obtenerProfesional({ id: parseIdParam(req.params.id) }));
    } catch (err) { next(err); }
  });

  router.post('/', ...guard, async (req, res, next) => {
    try {
      const datos = parseCrearProfesionalBody(req.body);
      res.status(201).json(await casos.crearProfesional({ datos }));
    } catch (err) { next(err); }
  });

  router.put('/:id', ...guard, async (req, res, next) => {
    try {
      const datos = parseActualizarProfesionalBody(req.body);
      res.json(await casos.actualizarProfesional({ id: parseIdParam(req.params.id), datos }));
    } catch (err) { next(err); }
  });

  router.get('/:id/servicios', ...guard, async (req, res, next) => {
    try {
      res.json(await casosAsociaciones.listarAsociaciones({ profesionalId: parseIdParam(req.params.id) }));
    } catch (err) { next(err); }
  });

  router.post('/:id/servicios', ...guard, async (req, res, next) => {
    try {
      const datos = parseCrearAsociacionBody(req.body);
      const creada = await casosAsociaciones.crearAsociacion({ profesionalId: parseIdParam(req.params.id), datos });
      res.status(201).json(creada);
    } catch (err) { next(err); }
  });

  router.put('/:id/servicios/:servicioId', ...guard, async (req, res, next) => {
    try {
      const datos = parseActualizarAsociacionBody(req.body);
      const actualizada = await casosAsociaciones.actualizarAsociacion({
        profesionalId: parseIdParam(req.params.id),
        servicioId: parseIdParam(req.params.servicioId),
        datos,
      });
      if (!actualizada) throw new NotFoundError('Asociación no encontrada');
      res.json(actualizada);
    } catch (err) { next(err); }
  });

  return router;
}

export function crearAgendaRouter({ casos, proteger }) {
  const router = Router();
  const guard = Array.isArray(proteger) ? proteger : [proteger];

  router.get('/:id/horarios', ...guard, async (req, res, next) => {
    try {
      res.json(await casos.listarHorarios({ profesionalId: parseIdParam(req.params.id) }));
    } catch (err) { next(err); }
  });

  router.post('/:id/horarios', ...guard, async (req, res, next) => {
    try {
      const creado = await casos.agregarHorario({ profesionalId: parseIdParam(req.params.id), body: req.body });
      res.status(201).json(creado);
    } catch (err) { next(err); }
  });

  router.delete('/:id/horarios/:horarioId', ...guard, async (req, res, next) => {
    try {
      res.json(await casos.quitarHorario({ horarioId: parseIdParam(req.params.horarioId) }));
    } catch (err) { next(err); }
  });

  router.get('/:id/excepciones', ...guard, async (req, res, next) => {
    try {
      res.json(await casos.listarExcepciones({ profesionalId: parseIdParam(req.params.id), fecha: req.query.fecha ?? null }));
    } catch (err) { next(err); }
  });

  router.post('/:id/excepciones', ...guard, async (req, res, next) => {
    try {
      const creada = await casos.agregarExcepcion({ profesionalId: parseIdParam(req.params.id), body: req.body });
      res.status(201).json(creada);
    } catch (err) { next(err); }
  });

  router.delete('/:id/excepciones/:excepcionId', ...guard, async (req, res, next) => {
    try {
      res.json(await casos.quitarExcepcion({ excepcionId: parseIdParam(req.params.excepcionId) }));
    } catch (err) { next(err); }
  });

  return router;
}
