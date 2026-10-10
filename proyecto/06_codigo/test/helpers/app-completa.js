import http from 'node:http';
import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/shared/security/passwords.js';
import { crearUowMemoria } from '../../src/shared/db/transaccional.js';
import { aLocal } from '../../src/shared/time/lapaz.js';

import { InMemoryServicioRepository } from '../../src/modules/catalogo/adapters/persistence/servicio-repository-in-memory.js';
import { InMemoryUsuarioAdminRepository, InMemoryProfesionalRepository, InMemoryAsociacionRepository } from '../../src/modules/identidad/adapters/persistence/admin-repository-in-memory.js';
import { InMemoryHorarioRepository, InMemoryExcepcionRepository } from '../../src/modules/agenda/adapters/persistence/agenda-repository-in-memory.js';
import {
  InMemoryCitaRepository,
  InMemoryHistorialRepository,
  InMemoryAuditoriaRepository,
  InMemoryClaveIdempotenciaRepository,
} from '../../src/modules/reservas/adapters/persistence/reservas-repository-in-memory.js';
import {
  InMemoryOutboxRepository,
  InMemoryNotificacionRepository,
} from '../../src/modules/notificaciones/adapters/persistence/notificaciones-repository-in-memory.js';
import { InMemoryParametroRepository } from '../../src/modules/parametros/adapters/persistence/parametro-repository-in-memory.js';

import { SesionStoreEnMemoria, LoginRateLimiterEnMemoria } from '../../src/modules/identidad/adapters/security/sesiones-y-limite.js';
import { crearLogin, crearLogout, crearObtenerSesion, crearRegistro } from '../../src/modules/identidad/application/auth-casos-de-uso.js';
import { crearAuthRouter } from '../../src/modules/identidad/adapters/http/auth-router.js';
import { crearRequireAuth, requerirRol } from '../../src/modules/identidad/adapters/http/auth-middleware.js';
import { crearServiciosRouter } from '../../src/modules/catalogo/adapters/http/servicios-router.js';
import { crearListarServicios } from '../../src/modules/catalogo/application/listar-servicios.js';
import {
  crearObtenerServicio,
  crearCrearServicio,
  crearActualizarServicio,
  crearDesactivarServicio,
} from '../../src/modules/catalogo/application/servicio-casos-de-uso.js';
import { crearCasosAdminUsuarios, crearCasosAsociaciones } from '../../src/modules/identidad/application/admin-casos-de-uso.js';
import { crearUsuariosRouter } from '../../src/modules/identidad/adapters/http/usuarios-router.js';
import { crearProfesionalesRouter, crearAgendaRouter } from '../../src/modules/identidad/adapters/http/profesionales-router.js';
import { crearCasosAgenda } from '../../src/modules/agenda/application/agenda-casos-de-uso.js';
import { crearDisponibilidadRouter } from '../../src/modules/agenda/adapters/http/disponibilidad-router.js';
import {
  crearCrearReserva,
  crearReprogramarCita,
  crearCancelarCita,
  crearCambiarEstadoCita,
  crearConsultarCitas,
} from '../../src/modules/reservas/application/cita-casos-de-uso.js';
import { crearConsultarAuditoria } from '../../src/modules/reservas/application/auditoria-casos-de-uso.js';
import { crearCitasRouter } from '../../src/modules/reservas/adapters/http/citas-router.js';
import { crearProcesarOutbox, crearConsultarNotificaciones } from '../../src/modules/notificaciones/application/outbox-casos-de-uso.js';
import { crearNotificacionesRouter } from '../../src/modules/notificaciones/adapters/http/notificaciones-router.js';
import { crearCasosParametros } from '../../src/modules/parametros/application/parametros-casos-de-uso.js';
import { crearParametrosRouter, crearAuditoriaRouter } from '../../src/modules/parametros/adapters/http/parametros-router.js';

export const PASS_ADMIN = 'AdminDemo.2026!!';
export const PASS_SOLI = 'SolicitanteDemo.26!';
export const PASS_PROFE = 'ProfesionalDemo.26!';

export function proximaFechaDia(dia, diasMin = 3) {
  const base = Date.now() + diasMin * 86400000;
  for (let i = 0; i < 14; i++) {
    const local = aLocal(new Date(base + i * 86400000));
    if (local.dia === dia) return local.fecha;
  }
  throw new Error(`No se encontró próxima ocurrencia de ${dia}`);
}

export async function crearServidorEnMemoria({ conAnticipacionReservar = true, reloj = () => new Date() } = {}) {
  const usuarioAdmin = new InMemoryUsuarioAdminRepository([
    { id: 1, nombre_completo: 'Ada Admin', correo: 'admin@citas.demo', hash_contrasena: hashPassword(PASS_ADMIN), rol: 'administrador', estado: 'activo' },
    { id: 2, nombre_completo: 'Sol Solicitante', correo: 'soli@citas.demo', hash_contrasena: hashPassword(PASS_SOLI), rol: 'solicitante', estado: 'activo' },
    { id: 3, nombre_completo: 'Profe Demo', correo: 'profe@citas.demo', hash_contrasena: hashPassword(PASS_PROFE), rol: 'profesional', estado: 'activo' },
  ]);
  const servicios = new InMemoryServicioRepository([
    { id: 1, nombre: 'Consulta general', descripcion: null, duracion_minutos: 30, estado: 'activo' },
  ]);
  const profesionales = new InMemoryProfesionalRepository(usuarioAdmin);
  const asociaciones = new InMemoryAsociacionRepository();
  const horarios = new InMemoryHorarioRepository();
  const excepciones = new InMemoryExcepcionRepository();
  const citas = new InMemoryCitaRepository();
  const historial = new InMemoryHistorialRepository();
  const auditoria = new InMemoryAuditoriaRepository();
  const claves = new InMemoryClaveIdempotenciaRepository();
  const outbox = new InMemoryOutboxRepository();
  const notificaciones = new InMemoryNotificacionRepository();
  const parametros = new InMemoryParametroRepository();

  await profesionales.create({ usuario_id: 3, datos_exhibicion: 'Dr. Demo — Medicina general' });
  await asociaciones.create({ profesional_id: 1, servicio_id: 1, duracion_especifica: null });
  for (const dia of ['lun', 'mar', 'mie', 'jue', 'vie']) {
    await horarios.create({ profesional_id: 1, dia_semana: dia, hora_inicio: '09:00', hora_fin: '12:00' });
    await horarios.create({ profesional_id: 1, dia_semana: dia, hora_inicio: '14:00', hora_fin: '17:00' });
  }
  await parametros.upsert({ clave: 'anticipacion_reprogramar', valor: '120', descripcion: '2 h aprobadas (RN-13)' });
  await parametros.upsert({ clave: 'anticipacion_cancelar', valor: '120', descripcion: '2 h aprobadas (RN-13)' });
  if (conAnticipacionReservar) {
    await parametros.upsert({ clave: 'anticipacion_reservar', valor: '60', descripcion: '1 h (pruebas; pendiente aprobación definitiva)' });
  }

  const repos = {
    servicios, usuarioAdmin, profesionales, asociaciones, horarios, excepciones,
    citas, historial, auditoria, claves, outbox, notificaciones, parametros,
  };
  const ejecutarTransaccion = crearUowMemoria(repos);
  const procesarOutbox = crearProcesarOutbox({ ejecutarTransaccion, reloj });

  const sesionStore = new SesionStoreEnMemoria({ ttlMinutos: 60 });
  const rateLimiter = new LoginRateLimiterEnMemoria({ maxIntentos: 5, ventanaMinutos: 15 });
  const requireAuth = crearRequireAuth({ sesionStore });
  const protegerAdmin = [requireAuth, requerirRol('administrador')];

  const casosCitas = crearConsultarCitas({ ejecutarTransaccion });
  const casosReservas = {
    crearReserva: crearCrearReserva({ ejecutarTransaccion, reloj }),
    reprogramarCita: crearReprogramarCita({ ejecutarTransaccion, reloj }),
    cancelarCita: crearCancelarCita({ ejecutarTransaccion, reloj }),
    misCitas: casosCitas.misCitas,
    listarCitas: casosCitas.listarCitas,
  };
  const casosAgenda = crearCasosAgenda({ ejecutarTransaccion });
  const casosAdminUsuarios = crearCasosAdminUsuarios({ ejecutarTransaccion });
  const casosAsociaciones = crearCasosAsociaciones({ ejecutarTransaccion });
  const casosParametros = crearCasosParametros({ ejecutarTransaccion, reloj });

  const app = createApp({
    config: { version: 'test', sesion: { ttlMinutos: 60 }, login: { maxIntentos: 5, ventanaMinutos: 15 } },
    pingDb: async () => {},
    routers: {
      auth: crearAuthRouter({
        login: crearLogin({ usuarioRepository: usuarioAdmin, sesionStore, rateLimiter }),
        logout: crearLogout({ sesionStore }),
        obtenerSesion: crearObtenerSesion({ usuarioRepository: usuarioAdmin }),
        registro: crearRegistro({ ejecutarTransaccion }),
        requireAuth,
      }),
      servicios: crearServiciosRouter({
        listarServicios: crearListarServicios({ servicioRepository: servicios }),
        obtenerServicio: crearObtenerServicio({ servicioRepository: servicios }),
        crearServicio: crearCrearServicio({ servicioRepository: servicios }),
        actualizarServicio: crearActualizarServicio({ servicioRepository: servicios }),
        desactivarServicio: crearDesactivarServicio({ servicioRepository: servicios }),
        protegerMutaciones: protegerAdmin,
      }),
      usuarios: crearUsuariosRouter({ casos: casosAdminUsuarios, proteger: protegerAdmin }),
      profesionales: crearProfesionalesRouter({ casos: casosAdminUsuarios, casosAsociaciones, proteger: protegerAdmin }),
      agenda: crearAgendaRouter({ casos: casosAgenda, proteger: protegerAdmin }),
      disponibilidad: crearDisponibilidadRouter({ consultarDisponibilidad: casosAgenda.consultarDisponibilidad, proteger: [requireAuth] }),
      citas: crearCitasRouter({
        casos: casosReservas,
        casosEstado: { cambiarEstado: crearCambiarEstadoCita({ ejecutarTransaccion, reloj }) },
        protegerReserva: [requireAuth, requerirRol('solicitante')],
        protegerConsulta: [requireAuth],
        protegerGestion: [requireAuth, requerirRol('administrador', 'profesional')],
        dispararNotificaciones: procesarOutbox,
      }),
      notificaciones: crearNotificacionesRouter({ consultar: crearConsultarNotificaciones({ ejecutarTransaccion }), proteger: [requireAuth] }),
      parametros: crearParametrosRouter({ casos: casosParametros, proteger: protegerAdmin }),
      auditoria: crearAuditoriaRouter({ consultar: crearConsultarAuditoria({ ejecutarTransaccion }), proteger: protegerAdmin }),
    },
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  return {
    server,
    base,
    repos,
    datos: { adminId: 1, solicitanteId: 2, profesionalUsuarioId: 3, profesionalId: 1, servicioId: 1 },
    async cerrar() {
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
