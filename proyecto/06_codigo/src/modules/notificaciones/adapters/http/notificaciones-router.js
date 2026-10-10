import { Router } from 'express';

export function crearNotificacionesRouter({ consultar, proteger }) {
  const router = Router();
  const guard = Array.isArray(proteger) ? proteger : [proteger];

  router.get('/mias', ...guard, async (req, res, next) => {
    try {
      res.json(await consultar({ destinatarioId: req.sesion.usuarioId }));
    } catch (err) { next(err); }
  });

  return router;
}
