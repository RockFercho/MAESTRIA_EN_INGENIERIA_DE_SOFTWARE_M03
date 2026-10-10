import { loadConfig } from './config/env.js';
import { createPool, ping } from './shared/db/pool.js';
import { createApp } from './app.js';
import { ahoraUtcMysql } from './shared/time/utc.js';
import { crearUowMysql } from './shared/db/transaccional.js';

import { MysqlServicioRepository } from './modules/catalogo/adapters/persistence/servicio-repository-mysql.js';
import { crearListarServicios } from './modules/catalogo/application/listar-servicios.js';
import {
  crearObtenerServicio,
  crearCrearServicio,
  crearActualizarServicio,
  crearDesactivarServicio,
} from './modules/catalogo/application/servicio-casos-de-uso.js';
import { crearServiciosRouter } from './modules/catalogo/adapters/http/servicios-router.js';

import { MysqlUsuarioRepository } from './modules/identidad/adapters/persistence/usuario-repository-mysql.js';
import { MysqlUsuarioAdminRepository, MysqlProfesionalRepository, MysqlAsociacionRepository } from './modules/identidad/adapters/persistence/admin-repository-mysql.js';
import { SesionStoreEnMemoria, LoginRateLimiterEnMemoria } from './modules/identidad/adapters/security/sesiones-y-limite.js';
import { crearLogin, crearLogout, crearObtenerSesion, crearRegistro } from './modules/identidad/application/auth-casos-de-uso.js';
import { crearCasosAdminUsuarios, crearCasosAsociaciones } from './modules/identidad/application/admin-casos-de-uso.js';
import { crearAuthRouter } from './modules/identidad/adapters/http/auth-router.js';
import { crearUsuariosRouter } from './modules/identidad/adapters/http/usuarios-router.js';
import { crearProfesionalesRouter, crearAgendaRouter } from './modules/identidad/adapters/http/profesionales-router.js';
import { crearRequireAuth, requerirRol } from './modules/identidad/adapters/http/auth-middleware.js';

import { MysqlHorarioRepository, MysqlExcepcionRepository } from './modules/agenda/adapters/persistence/agenda-repository-mysql.js';
import { crearCasosAgenda } from './modules/agenda/application/agenda-casos-de-uso.js';
import { crearDisponibilidadRouter } from './modules/agenda/adapters/http/disponibilidad-router.js';

import { MysqlCitaRepository, MysqlHistorialRepository, MysqlAuditoriaRepository, MysqlClaveIdempotenciaRepository } from './modules/reservas/adapters/persistence/reservas-repository-mysql.js';
import {
  crearCrearReserva,
  crearReprogramarCita,
  crearCancelarCita,
  crearCambiarEstadoCita,
  crearConsultarCitas,
} from './modules/reservas/application/cita-casos-de-uso.js';
import { crearConsultarAuditoria } from './modules/reservas/application/auditoria-casos-de-uso.js';
import { crearCitasRouter } from './modules/reservas/adapters/http/citas-router.js';

import { MysqlOutboxRepository, MysqlNotificacionRepository } from './modules/notificaciones/adapters/persistence/notificaciones-repository-mysql.js';
import { crearProcesarOutbox, crearConsultarNotificaciones } from './modules/notificaciones/application/outbox-casos-de-uso.js';
import { crearNotificacionesRouter } from './modules/notificaciones/adapters/http/notificaciones-router.js';

import { MysqlParametroRepository } from './modules/parametros/adapters/persistence/parametro-repository-mysql.js';
import { crearCasosParametros } from './modules/parametros/application/parametros-casos-de-uso.js';
import { crearParametrosRouter, crearAuditoriaRouter } from './modules/parametros/adapters/http/parametros-router.js';

const config = loadConfig();
const pool = createPool(config.db);

function construirRepos(executor) {
  return {
    servicios: new MysqlServicioRepository(executor),
    usuarioAdmin: new MysqlUsuarioAdminRepository(executor),
    profesionales: new MysqlProfesionalRepository(executor),
    asociaciones: new MysqlAsociacionRepository(executor),
    horarios: new MysqlHorarioRepository(executor),
    excepciones: new MysqlExcepcionRepository(executor),
    citas: new MysqlCitaRepository(executor),
    historial: new MysqlHistorialRepository(executor),
    auditoria: new MysqlAuditoriaRepository(executor),
    claves: new MysqlClaveIdempotenciaRepository(executor),
    outbox: new MysqlOutboxRepository(executor),
    notificaciones: new MysqlNotificacionRepository(executor),
    parametros: new MysqlParametroRepository(executor),
  };
}

const uow = crearUowMysql(pool);
const ejecutarTransaccion = (opts, fn) => uow(opts, (conn) => fn(construirRepos(conn)));

const usuarioRepository = new MysqlUsuarioRepository(pool);
const servicioRepository = new MysqlServicioRepository(pool);
const sesionStore = new SesionStoreEnMemoria({ ttlMinutos: config.sesion.ttlMinutos });
const rateLimiter = new LoginRateLimiterEnMemoria({
  maxIntentos: config.login.maxIntentos,
  ventanaMinutos: config.login.ventanaMinutos,
});

const requireAuth = crearRequireAuth({ sesionStore });
const protegerAdmin = [requireAuth, requerirRol('administrador')];

const procesarOutbox = crearProcesarOutbox({ ejecutarTransaccion });

const authRouter = crearAuthRouter({
  login: crearLogin({ usuarioRepository, sesionStore, rateLimiter }),
  logout: crearLogout({ sesionStore }),
  obtenerSesion: crearObtenerSesion({ usuarioRepository }),
  registro: crearRegistro({ ejecutarTransaccion }),
  requireAuth,
});

const serviciosRouter = crearServiciosRouter({
  listarServicios: crearListarServicios({ servicioRepository }),
  obtenerServicio: crearObtenerServicio({ servicioRepository }),
  crearServicio: crearCrearServicio({ servicioRepository }),
  actualizarServicio: crearActualizarServicio({ servicioRepository }),
  desactivarServicio: crearDesactivarServicio({ servicioRepository }),
  protegerMutaciones: protegerAdmin,
});

const casosAdminUsuarios = crearCasosAdminUsuarios({ ejecutarTransaccion });
const casosAsociaciones = crearCasosAsociaciones({ ejecutarTransaccion });
const casosAgenda = crearCasosAgenda({ ejecutarTransaccion });
const casosParametros = crearCasosParametros({ ejecutarTransaccion });

const casosCitas = crearConsultarCitas({ ejecutarTransaccion });
const casosReservas = {
  crearReserva: crearCrearReserva({ ejecutarTransaccion }),
  reprogramarCita: crearReprogramarCita({ ejecutarTransaccion }),
  cancelarCita: crearCancelarCita({ ejecutarTransaccion }),
  misCitas: casosCitas.misCitas,
  listarCitas: casosCitas.listarCitas,
};
const casosEstado = { cambiarEstado: crearCambiarEstadoCita({ ejecutarTransaccion }) };

const routers = {
  auth: authRouter,
  servicios: serviciosRouter,
  usuarios: crearUsuariosRouter({ casos: casosAdminUsuarios, proteger: protegerAdmin }),
  profesionales: crearProfesionalesRouter({ casos: casosAdminUsuarios, casosAsociaciones, proteger: protegerAdmin }),
  agenda: crearAgendaRouter({ casos: casosAgenda, proteger: protegerAdmin }),
  disponibilidad: crearDisponibilidadRouter({ consultarDisponibilidad: casosAgenda.consultarDisponibilidad, proteger: [requireAuth] }),
  citas: crearCitasRouter({
    casos: casosReservas,
    casosEstado,
    protegerReserva: [requireAuth, requerirRol('solicitante')],
    protegerConsulta: [requireAuth],
    protegerGestion: [requireAuth, requerirRol('administrador', 'profesional')],
    dispararNotificaciones: procesarOutbox,
  }),
  notificaciones: crearNotificacionesRouter({
    consultar: crearConsultarNotificaciones({ ejecutarTransaccion }),
    proteger: [requireAuth],
  }),
  parametros: crearParametrosRouter({ casos: casosParametros, proteger: protegerAdmin }),
  auditoria: crearAuditoriaRouter({ consultar: crearConsultarAuditoria({ ejecutarTransaccion }), proteger: protegerAdmin }),
};

const app = createApp({ config, pingDb: () => ping(pool), routers });

if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('test')) {
  const servidor = app.listen(config.port, '127.0.0.1', () => {
    console.log(`[server] escuchando en http://127.0.0.1:${config.port} (modo local)`);
  });
  const temporizadorOutbox = setInterval(() => {
    procesarOutbox().catch((err) => console.error('[notificaciones] ciclo outbox falló:', err.message));
  }, 15000);
  temporizadorOutbox.unref();
  async function shutdown() {
    clearInterval(temporizadorOutbox);
    servidor.close();
    await pool.end();
    process.exit(0);
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export { app, pool, ahoraUtcMysql, procesarOutbox };
