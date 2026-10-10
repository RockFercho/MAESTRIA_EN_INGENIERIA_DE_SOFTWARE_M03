import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/shared/security/passwords.js';
import { InMemoryServicioRepository } from '../../src/modules/catalogo/adapters/persistence/servicio-repository-in-memory.js';
import { InMemoryUsuarioRepository } from '../../src/modules/identidad/adapters/persistence/usuario-repository-in-memory.js';
import { SesionStoreEnMemoria, LoginRateLimiterEnMemoria } from '../../src/modules/identidad/adapters/security/sesiones-y-limite.js';
import { crearListarServicios } from '../../src/modules/catalogo/application/listar-servicios.js';
import {
  crearObtenerServicio,
  crearCrearServicio,
  crearActualizarServicio,
  crearDesactivarServicio,
} from '../../src/modules/catalogo/application/servicio-casos-de-uso.js';
import { crearServiciosRouter } from '../../src/modules/catalogo/adapters/http/servicios-router.js';
import { crearLogin, crearLogout, crearObtenerSesion } from '../../src/modules/identidad/application/auth-casos-de-uso.js';
import { crearAuthRouter } from '../../src/modules/identidad/adapters/http/auth-router.js';
import { crearRequireAuth, requerirRol } from '../../src/modules/identidad/adapters/http/auth-middleware.js';

const config = { version: 'test', sesion: { ttlMinutos: 60 }, login: { maxIntentos: 5, ventanaMinutos: 15 } };
const PASS_ADMIN = 'AdminDemo.2026!!';
const PASS_SOLI = 'SolicitanteDemo.26!';

function crearBase() {
  const usuarios = new InMemoryUsuarioRepository([
    { id: 1, nombre_completo: 'Ada Admin', correo: 'admin@citas.demo', hash_contrasena: hashPassword(PASS_ADMIN), rol: 'administrador', estado: 'activo' },
    { id: 2, nombre_completo: 'Sol Solicitante', correo: 'soli@citas.demo', hash_contrasena: hashPassword(PASS_SOLI), rol: 'solicitante', estado: 'activo' },
    { id: 3, nombre_completo: 'Ina Inactiva', correo: 'ina@citas.demo', hash_contrasena: hashPassword(PASS_ADMIN), rol: 'solicitante', estado: 'inactivo' },
  ]);
  const servicios = new InMemoryServicioRepository([
    { id: 1, nombre: 'Consulta general', descripcion: null, duracion_minutos: 30, estado: 'activo' },
  ]);
  const sesionStore = new SesionStoreEnMemoria({ ttlMinutos: 60 });
  const rateLimiter = new LoginRateLimiterEnMemoria({ maxIntentos: 5, ventanaMinutos: 15 });
  const requireAuth = crearRequireAuth({ sesionStore });
  const app = createApp({
    config,
    pingDb: async () => {},
    authRouter: crearAuthRouter({
      login: crearLogin({ usuarioRepository: usuarios, sesionStore, rateLimiter }),
      logout: crearLogout({ sesionStore }),
      obtenerSesion: crearObtenerSesion({ usuarioRepository: usuarios }),
      requireAuth,
    }),
    serviciosRouter: crearServiciosRouter({
      listarServicios: crearListarServicios({ servicioRepository: servicios }),
      obtenerServicio: crearObtenerServicio({ servicioRepository: servicios }),
      crearServicio: crearCrearServicio({ servicioRepository: servicios }),
      actualizarServicio: crearActualizarServicio({ servicioRepository: servicios }),
      desactivarServicio: crearDesactivarServicio({ servicioRepository: servicios }),
      protegerMutaciones: [requireAuth, requerirRol('administrador')],
    }),
  });
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}`, rateLimiter });
    });
  });
}

async function login(base, correo, contrasena) {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ correo, contrasena }),
  });
  return { res, body: await res.json() };
}

// ---------- CP-BACK-03: login ----------

test('login con credenciales válidas devuelve token y usuario seguro (sin hash)', async () => {
  const { server, base } = await crearBase();
  try {
    const { res, body } = await login(base, 'admin@citas.demo', PASS_ADMIN);
    assert.equal(res.status, 200);
    assert.ok(body.token && body.token.length >= 64);
    assert.equal(body.usuario.rol, 'administrador');
    assert.equal(body.usuario.hash_contrasena, undefined);
    assert.equal(body.contrasena, undefined);
  } finally {
    server.close();
  }
});

test('login con credenciales inválidas responde 401 con mensaje genérico (mismo mensaje para correo inexistente)', async () => {
  const { server, base } = await crearBase();
  try {
    const mala = await login(base, 'admin@citas.demo', 'password-equivocada-1');
    assert.equal(mala.res.status, 401);
    assert.equal(mala.body.error.code, 'UNAUTHORIZED');
    const inexistente = await login(base, 'nadie@citas.demo', 'password-equivocada-1');
    assert.equal(inexistente.res.status, 401);
    assert.equal(inexistente.body.error.message, mala.body.error.message, 'mensaje genérico idéntico (no enumerar usuarios)');
  } finally {
    server.close();
  }
});

test('login rechaza usuario inactivo con el mismo mensaje genérico', async () => {
  const { server, base } = await crearBase();
  try {
    const { res, body } = await login(base, 'ina@citas.demo', PASS_ADMIN);
    assert.equal(res.status, 401);
    assert.equal(body.error.message, 'Credenciales inválidas');
  } finally {
    server.close();
  }
});

test('login con cuerpo inválido responde 400', async () => {
  const { server, base } = await crearBase();
  try {
    const { res } = await login(base, 'no-es-correo', 'x');
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});

test('login limita intentos fallidos consecutivos (429) y se recupera tras el éxito', async () => {
  const { server, base } = await crearBase();
  try {
    for (let i = 0; i < 5; i++) {
      const { res } = await login(base, 'admin@citas.demo', 'mala');
      assert.equal(res.status, 401, `intento ${i + 1}`);
    }
    const bloqueado = await login(base, 'admin@citas.demo', PASS_ADMIN);
    assert.equal(bloqueado.res.status, 429);
    assert.equal(bloqueado.body.error.code, 'RATE_LIMITED');
    const otroUsuario = await login(base, 'soli@citas.demo', PASS_SOLI);
    assert.equal(otroUsuario.res.status, 200, 'el límite es por correo');
  } finally {
    server.close();
  }
});

// ---------- CP-BACK-04: logout + me ----------

test('GET /auth/me devuelve el usuario de la sesión o 401 sin token', async () => {
  const { server, base } = await crearBase();
  try {
    const sin = await fetch(`${base}/api/v1/auth/me`);
    assert.equal(sin.status, 401);
    const { body } = await login(base, 'soli@citas.demo', PASS_SOLI);
    const con = await fetch(`${base}/api/v1/auth/me`, { headers: { authorization: `Bearer ${body.token}` } });
    assert.equal(con.status, 200);
    const datos = await con.json();
    assert.equal(datos.correo, 'soli@citas.demo');
    assert.equal(datos.hash_contrasena, undefined);
  } finally {
    server.close();
  }
});

test('POST /auth/logout revoca la sesión (401 posterior)', async () => {
  const { server, base } = await crearBase();
  try {
    const { body } = await login(base, 'soli@citas.demo', PASS_SOLI);
    const out = await fetch(`${base}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { authorization: `Bearer ${body.token}` },
    });
    assert.equal(out.status, 200);
    const me = await fetch(`${base}/api/v1/auth/me`, { headers: { authorization: `Bearer ${body.token}` } });
    assert.equal(me.status, 401);
  } finally {
    server.close();
  }
});

test('token basura responde 401 en /me', async () => {
  const { server, base } = await crearBase();
  try {
    const res = await fetch(`${base}/api/v1/auth/me`, { headers: { authorization: 'Bearer f'.repeat(32) } });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

// ---------- CP-BACK-05/06/07/08: catálogo protegido ----------

test('GET listado y detalle siguen públicos (RF-027) sin token', async () => {
  const { server, base } = await crearBase();
  try {
    const lista = await fetch(`${base}/api/v1/servicios`);
    assert.equal(lista.status, 200);
    const detalle = await fetch(`${base}/api/v1/servicios/1`);
    assert.equal(detalle.status, 200);
  } finally {
    server.close();
  }
});

test('mutaciones sin token responden 401 UNAUTHORIZED', async () => {
  const { server, base } = await crearBase();
  try {
    const post = await fetch(`${base}/api/v1/servicios`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: 'X', duracion_minutos: 10 }),
    });
    assert.equal(post.status, 401);
    assert.equal((await post.json()).error.code, 'UNAUTHORIZED');
    assert.equal((await fetch(`${base}/api/v1/servicios/1`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nombre: 'X', duracion_minutos: 10 }) })).status, 401);
    assert.equal((await fetch(`${base}/api/v1/servicios/1`, { method: 'DELETE' })).status, 401);
  } finally {
    server.close();
  }
});

test('mutaciones con rol solicitante responden 403 FORBIDDEN (RF-003)', async () => {
  const { server, base } = await crearBase();
  try {
    const { body } = await login(base, 'soli@citas.demo', PASS_SOLI);
    const headers = { authorization: `Bearer ${body.token}`, 'content-type': 'application/json' };
    const post = await fetch(`${base}/api/v1/servicios`, {
      method: 'POST', headers, body: JSON.stringify({ nombre: 'X', duracion_minutos: 10 }),
    });
    assert.equal(post.status, 403);
    assert.equal((await post.json()).error.code, 'FORBIDDEN');
    assert.equal((await fetch(`${base}/api/v1/servicios/1`, { method: 'DELETE', headers })).status, 403);
  } finally {
    server.close();
  }
});

test('administrador puede crear, actualizar y desactivar servicios (RF-005)', async () => {
  const { server, base } = await crearBase();
  try {
    const { body } = await login(base, 'admin@citas.demo', PASS_ADMIN);
    const headers = { authorization: `Bearer ${body.token}`, 'content-type': 'application/json' };
    const creado = await fetch(`${base}/api/v1/servicios`, {
      method: 'POST', headers, body: JSON.stringify({ nombre: 'Ecografía', duracion_minutos: 40 }),
    });
    assert.equal(creado.status, 201);
    const id = (await creado.json()).id;
    const put = await fetch(`${base}/api/v1/servicios/${id}`, {
      method: 'PUT', headers, body: JSON.stringify({ nombre: 'Ecografía abdominal', duracion_minutos: 45 }),
    });
    assert.equal(put.status, 200);
    assert.equal((await put.json()).nombre, 'Ecografía abdominal');
    const del = await fetch(`${base}/api/v1/servicios/${id}`, { method: 'DELETE', headers });
    assert.equal(del.status, 200);
    assert.equal((await del.json()).estado, 'inactivo');
  } finally {
    server.close();
  }
});
