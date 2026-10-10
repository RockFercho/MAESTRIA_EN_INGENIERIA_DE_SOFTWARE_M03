import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarServicios, obtenerServicios, ApiError } from '../src/api/servicios.js';

test('normalizarServicios devuelve lista vacía para arreglo vacío', () => {
  assert.deepEqual(normalizarServicios([]), []);
});

test('normalizarServicios normaliza los campos del contrato CP-API-01', () => {
  const salida = normalizarServicios([
    { id: 1, nombre: '  Consulta general ', descripcion: 'Atención primaria', duracion_minutos: '30', estado: 'activo' },
    { id: 2, nombre: 'Teleconsulta', descripcion: null, duracion_minutos: 45, estado: 'activo' },
  ]);
  assert.equal(salida.length, 2);
  assert.equal(salida[0].nombre, 'Consulta general');
  assert.equal(salida[0].duracion_minutos, 30);
  assert.equal(salida[1].descripcion, '');
  assert.equal(salida[1].duracion_minutos, 45);
});

test('normalizarServicios descarta entradas que no sean objetos', () => {
  const salida = normalizarServicios([null, 'texto', { id: 3, nombre: 'Servicio', duracion_minutos: 20 }]);
  assert.equal(salida.length, 1);
  assert.equal(salida[0].id, 3);
});

test('normalizarServicios lanza ApiError si la respuesta no es una lista', () => {
  assert.throws(() => normalizarServicios({ error: 'boom' }), (err) => err instanceof ApiError);
  assert.throws(() => normalizarServicios('lista'), (err) => err instanceof ApiError);
});

test('obtenerServicios devuelve la lista en una respuesta 200 válida', async () => {
  const fetchImpl = async (url) => {
    assert.match(url, /\/api\/v1\/servicios\?estado=activo$/);
    return { ok: true, status: 200, json: async () => [{ id: 9, nombre: 'Radiografía', duracion_minutos: 20, estado: 'activo' }] };
  };
  const salida = await obtenerServicios({ fetchImpl });
  assert.equal(salida.length, 1);
  assert.equal(salida[0].nombre, 'Radiografía');
});

test('obtenerServicios lanza ApiError ante un estado HTTP de error', async () => {
  const fetchImpl = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(obtenerServicios({ fetchImpl }), (err) => err instanceof ApiError && err.status === 503);
});

test('obtenerServicios convierte la falta de conexión en ApiError de red', async () => {
  const fetchImpl = async () => {
    throw new TypeError('fetch failed');
  };
  await assert.rejects(obtenerServicios({ fetchImpl }), (err) => err instanceof ApiError && err.status === 0);
});

test('obtenerServicios lanza ApiError si la respuesta no es JSON válido', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError('Unexpected token');
    },
  });
  await assert.rejects(obtenerServicios({ fetchImpl }), (err) => err instanceof ApiError);
});
