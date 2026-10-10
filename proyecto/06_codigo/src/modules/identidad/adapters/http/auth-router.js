import { Router } from 'express';
import { parseLoginBody, parseRegistroBody } from '../../domain/usuario.js';
import { AppError } from '../../../../shared/http/errors.js';

export function crearAuthRouter({ login, logout, obtenerSesion, registro, requireAuth }) {
  const router = Router();

  router.post('/login', async (req, res, next) => {
    try {
      const credenciales = parseLoginBody(req.body);
      res.json(await login(credenciales));
    } catch (err) {
      next(err);
    }
  });

  router.post('/registro', async (req, res, next) => {
    try {
      const datos = parseRegistroBody(req.body);
      res.status(201).json(await registro({ datos }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', requireAuth, async (req, res, next) => {
    try {
      await logout({ token: req.sesion.token });
      res.json({ mensaje: 'Sesión finalizada' });
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', requireAuth, async (req, res, next) => {
    try {
      const usuario = await obtenerSesion({ usuarioId: req.sesion.usuarioId });
      if (!usuario) {
        return next(new AppError('Sesión inválida o expirada', { status: 401, code: 'UNAUTHORIZED' }));
      }
      res.json(usuario);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
