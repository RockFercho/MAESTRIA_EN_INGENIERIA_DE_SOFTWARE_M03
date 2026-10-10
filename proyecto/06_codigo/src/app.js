import express from 'express';
import { notFoundHandler, errorHandler } from './shared/http/errors.js';

export function createApp({ config, pingDb, routers = {}, serviciosRouter, authRouter }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/v1/health', async (_req, res) => {
    try {
      await pingDb();
      res.json({ status: 'ok', version: config.version, checks: { db: 'ok' } });
    } catch {
      res.status(503).json({ status: 'error', version: config.version, checks: { db: 'error' } });
    }
  });

  const r = { ...routers };
  if (authRouter && !r.auth) r.auth = authRouter;
  if (serviciosRouter && !r.servicios) r.servicios = serviciosRouter;

  const montajes = {
    auth: '/api/v1/auth',
    servicios: '/api/v1/servicios',
    usuarios: '/api/v1/usuarios',
    profesionales: '/api/v1/profesionales',
    agenda: '/api/v1/profesionales',
    disponibilidad: '/api/v1/disponibilidad',
    citas: '/api/v1/citas',
    notificaciones: '/api/v1/notificaciones',
    parametros: '/api/v1/parametros',
    auditoria: '/api/v1/auditoria',
  };
  for (const [nombre, ruta] of Object.entries(montajes)) {
    if (r[nombre]) app.use(ruta, r[nombre]);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
