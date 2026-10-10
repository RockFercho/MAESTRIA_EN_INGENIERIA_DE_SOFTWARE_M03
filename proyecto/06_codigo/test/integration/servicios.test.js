import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../../src/app.js';
import { InMemoryServicioRepository } from '../../src/modules/catalogo/adapters/persistence/servicio-repository-in-memory.js';
import { crearListarServicios } from '../../src/modules/catalogo/application/listar-servicios.js';
import {
  crearObtenerServicio,
  crearCrearServicio,
  crearActualizarServicio,
  crearDesactivarServicio,
} from '../../src/modules/catalogo/application/servicio-casos-de-uso.js';
import { crearServiciosRouter } from '../../src/modules/catalogo/adapters/http/servicios-router.js';
import { AppError } from '../../src/shared/http/errors.js';

const config = { version: 'test' };
const fixtures = [
  { id: 1, nombre: 'Consulta general', descripcion: null, duracion_minutos: 30, estado: 'activo' },
  { id: 2, nombre: 'Control pediátrico', descripcion: 'Control de niño sano', duracion_minutos: 45, estado: 'activo' },
  { id: 3, nombre: 'Vacunación (retirado)', descripcion: null, duracion_minutos: 15, estado: 'inactivo' },
];

function startApp(servicioRepository) {
  const app = createApp({
    config,
    pingDb: async () => {},
    serviciosRouter: crearServiciosRouter({
      listarServicios: crearListarServicios({ servicioRepository }),
      obtenerServicio: crearObtenerServicio({ servicioRepository }),
      crearServicio: crearCrearServicio({ servicioRepository }),
      actualizarServicio: crearActualizarServicio({ servicioRepository }),
      desactivarServicio: crearDesactivarServicio({ servicioRepository }),
    }),
  });
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

const nuevoRepo = () => new InMemoryServicioRepository(fixtures);

// ---------- CP-API-03 (coleción) ----------

test('GET /api/v1/servicios devuelve 200 con la lista completa', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.length, 3);
    assert.deepEqual(Object.keys(body[0]), ['id', 'nombre', 'descripcion', 'duracion_minutos', 'estado']);
  } finally {
    server.close();
  }
});

test('GET /api/v1/servicios?estado=activo filtra correctamente', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios?estado=activo`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.length, 2);
    assert.ok(body.every((s) => s.estado === 'activo'));
  } finally {
    server.close();
  }
});

test('GET /api/v1/servicios devuelve [] con repositorio vacío', async () => {
  const { server, base } = await startApp(new InMemoryServicioRepository([]));
  try {
    const res = await fetch(`${base}/api/v1/servicios`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  } finally {
    server.close();
  }
});

test('GET /api/v1/servicios?estado=invalido responde 400 VALIDATION_ERROR', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios?estado=malo`);
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  } finally {
    server.close();
  }
});

test('error de repositorio DB responde 500 DB_ERROR sin filtrar SQL', async () => {
  const repo = { findAll: async () => { throw new AppError('Error al consultar servicios', { status: 500, code: 'DB_ERROR' }); } };
  const { server, base } = await startApp(repo);
  try {
    const res = await fetch(`${base}/api/v1/servicios`);
    const body = await res.json();
    assert.equal(res.status, 500);
    assert.equal(body.error.code, 'DB_ERROR');
    assert.ok(!body.error.message.includes('SELECT'));
  } finally {
    server.close();
  }
});

test('error inesperado responde 500 INTERNAL_ERROR genérico', async () => {
  const repo = { findAll: async () => { throw new Error('SELECT * FROM secreto'); } };
  const { server, base } = await startApp(repo);
  try {
    const res = await fetch(`${base}/api/v1/servicios`);
    const body = await res.json();
    assert.equal(res.status, 500);
    assert.equal(body.error.code, 'INTERNAL_ERROR');
    assert.ok(!JSON.stringify(body).includes('secreto'));
  } finally {
    server.close();
  }
});

// ---------- CP-API-04 (por id) ----------

test('GET /api/v1/servicios/:id devuelve 200 con el servicio existente', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios/1`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.nombre, 'Consulta general');
  } finally {
    server.close();
  }
});

test('GET /api/v1/servicios/:id responde 404 si no existe', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios/999999`);
    assert.equal(res.status, 404);
  } finally {
    server.close();
  }
});

test('GET /api/v1/servicios/:id responde 400 si el id no es entero', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    for (const id of ['abc', '-1', '1.5', '%20']) {
      const res = await fetch(`${base}/api/v1/servicios/${id}`);
      const body = await res.json();
      assert.equal(res.status, 400, `id=${id}`);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    }
  } finally {
    server.close();
  }
});

// ---------- CP-API-05 (crear) ----------

test('POST /api/v1/servicios crea un servicio y responde 201', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: 'Ecografía abdominal', descripcion: 'Incluye preparación', duracion_minutos: 60 }),
    });
    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.id, 4);
    assert.equal(body.estado, 'activo');
    assert.equal(body.descripcion, 'Incluye preparación');
  } finally {
    server.close();
  }
});

test('POST /api/v1/servicios acepta payload mínimo (sin descripcion/estado)', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: 'Suturas menores', duracion_minutos: 20 }),
    });
    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.descripcion, null);
    assert.equal(body.estado, 'activo');
  } finally {
    server.close();
  }
});

test('POST /api/v1/servicios valida entradas inválidas (400) sin crear filas', async () => {
  const repo = nuevoRepo();
  const { server, base } = await startApp(repo);
  const invalidos = [
    {},
    { nombre: '', duracion_minutos: 30 },
    { nombre: 'x'.repeat(101), duracion_minutos: 30 },
    { nombre: 'OK', duracion_minutos: 0 },
    { nombre: 'OK', duracion_minutos: 1441 },
    { nombre: 'OK', duracion_minutos: 10.5 },
    { nombre: 'OK', duracion_minutos: 30, estado: 'x' },
    { nombre: 'OK', descripcion: 'x'.repeat(501), duracion_minutos: 30 },
  ];
  try {
    for (const payload of invalidos) {
      const res = await fetch(`${base}/api/v1/servicios`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      assert.equal(res.status, 400, JSON.stringify(payload).slice(0, 60));
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    }
    assert.equal((await repo.findAll()).length, 3);
  } finally {
    server.close();
  }
});

test('POST con JSON malformado responde 400 VALIDATION_ERROR', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{no es json',
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  } finally {
    server.close();
  }
});

// ---------- CP-API-06 (actualizar) ----------

test('PUT /api/v1/servicios/:id actualiza el servicio y responde 200', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: 'Consulta general (25 min)', duracion_minutos: 25, estado: 'activo' }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.nombre, 'Consulta general (25 min)');
    assert.equal(body.duracion_minutos, 25);
    assert.equal(body.descripcion, null);
  } finally {
    server.close();
  }
});

test('PUT /api/v1/servicios/:id responde 404 si no existe', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios/999999`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: 'X', duracion_minutos: 10 }),
    });
    assert.equal(res.status, 404);
  } finally {
    server.close();
  }
});

test('PUT /api/v1/servicios/:id responde 400 con payload inválido', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: '', duracion_minutos: 10 }),
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});

test('PUT /api/v1/servicios/abc responde 400 (id inválido)', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const res = await fetch(`${base}/api/v1/servicios/abc`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: 'X', duracion_minutos: 10 }),
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});

// ---------- CP-API-07 (borrado lógico) ----------

test('DELETE /api/v1/servicios/:id desactiva lógicamente (estado inactivo)', async () => {
  const repo = nuevoRepo();
  const { server, base } = await startApp(repo);
  try {
    const res = await fetch(`${base}/api/v1/servicios/1`, { method: 'DELETE' });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.estado, 'inactivo');
    const fila = await repo.findById(1);
    assert.ok(fila, 'la fila debe seguir existiendo (sin DELETE físico)');
    assert.equal(fila.estado, 'inactivo');
  } finally {
    server.close();
  }
});

test('DELETE dos veces responde 200 (idempotente lógico)', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    const primera = await fetch(`${base}/api/v1/servicios/2`, { method: 'DELETE' });
    assert.equal(primera.status, 200);
    const segunda = await fetch(`${base}/api/v1/servicios/2`, { method: 'DELETE' });
    assert.equal(segunda.status, 200);
    assert.equal((await segunda.json()).estado, 'inactivo');
  } finally {
    server.close();
  }
});

test('DELETE responde 404 si no existe y 400 si el id es inválido', async () => {
  const { server, base } = await startApp(nuevoRepo());
  try {
    assert.equal((await fetch(`${base}/api/v1/servicios/999999`, { method: 'DELETE' })).status, 404);
    assert.equal((await fetch(`${base}/api/v1/servicios/abc`, { method: 'DELETE' })).status, 400);
  } finally {
    server.close();
  }
});
