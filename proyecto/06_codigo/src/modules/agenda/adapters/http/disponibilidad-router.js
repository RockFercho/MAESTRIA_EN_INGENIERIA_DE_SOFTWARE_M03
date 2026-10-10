import { Router } from 'express';
import { ValidationError } from '../../../../shared/http/errors.js';
import { esFechaValida } from '../../../../shared/time/lapaz.js';

export function crearDisponibilidadRouter({ consultarDisponibilidad, proteger }) {
  const router = Router();
  const guard = Array.isArray(proteger) ? proteger : [proteger];

  router.get('/', ...guard, async (req, res, next) => {
    try {
      const profesionalId = Number(req.query.profesional_id);
      const servicioId = Number(req.query.servicio_id);
      const fecha = req.query.fecha;
      if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
        throw new ValidationError("'profesional_id' debe ser un entero positivo", { campo: 'profesional_id' });
      }
      if (!Number.isInteger(servicioId) || servicioId <= 0) {
        throw new ValidationError("'servicio_id' debe ser un entero positivo", { campo: 'servicio_id' });
      }
      if (!esFechaValida(fecha)) throw new ValidationError("'fecha' debe ser YYYY-MM-DD válido", { campo: 'fecha' });
      res.json(await consultarDisponibilidad({ profesionalId, servicioId, fecha }));
    } catch (err) { next(err); }
  });

  return router;
}
