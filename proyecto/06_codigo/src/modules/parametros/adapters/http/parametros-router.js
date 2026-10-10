import { Router } from 'express';
import { parseParametroBody } from '../../domain/parametro.js';

export function crearParametrosRouter({ casos, proteger }) {
  const router = Router();
  const guard = Array.isArray(proteger) ? proteger : [proteger];

  router.get('/', ...guard, async (_req, res, next) => {
    try {
      res.json(await casos.listarParametros());
    } catch (err) { next(err); }
  });

  router.put('/:clave', ...guard, async (req, res, next) => {
    try {
      const datos = parseParametroBody({ ...req.body, clave: req.params.clave });
      res.json(await casos.configurarParametro({ clave: datos.clave, datos, usuarioId: req.sesion.usuarioId }));
    } catch (err) { next(err); }
  });

  return router;
}

export function crearAuditoriaRouter({ consultar, proteger }) {
  const router = Router();
  const guard = Array.isArray(proteger) ? proteger : [proteger];

  router.get('/', ...guard, async (req, res, next) => {
    try {
      const tipo = req.query.tipo ?? null;
      const citaId = req.query.cita_id !== undefined ? Number(req.query.cita_id) : null;
      const limite = req.query.limite !== undefined ? Number(req.query.limite) : 100;
      res.json(await consultar({ tipo, citaId, limite }));
    } catch (err) { next(err); }
  });

  return router;
}
