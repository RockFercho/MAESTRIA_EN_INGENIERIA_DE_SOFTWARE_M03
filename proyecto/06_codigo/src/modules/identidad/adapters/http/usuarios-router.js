import { Router } from 'express';
import { parseIdParam } from '../../../../shared/http/params.js';
import { parseCrearUsuarioBody, parseActualizarUsuarioBody } from '../../domain/admin.js';

export function crearUsuariosRouter({ casos, proteger }) {
  const router = Router();
  const guard = Array.isArray(proteger) ? proteger : [proteger];

  router.get('/', ...guard, async (req, res, next) => {
    try {
      res.json(await casos.listarUsuarios({ rol: req.query.rol ?? null, estado: req.query.estado ?? null }));
    } catch (err) { next(err); }
  });

  router.get('/:id', ...guard, async (req, res, next) => {
    try {
      res.json(await casos.obtenerUsuario({ id: parseIdParam(req.params.id) }));
    } catch (err) { next(err); }
  });

  router.post('/', ...guard, async (req, res, next) => {
    try {
      const datos = parseCrearUsuarioBody(req.body);
      res.status(201).json(await casos.crearUsuario({ datos }));
    } catch (err) { next(err); }
  });

  router.put('/:id', ...guard, async (req, res, next) => {
    try {
      const datos = parseActualizarUsuarioBody(req.body);
      res.json(await casos.actualizarUsuario({ id: parseIdParam(req.params.id), datos }));
    } catch (err) { next(err); }
  });

  return router;
}
