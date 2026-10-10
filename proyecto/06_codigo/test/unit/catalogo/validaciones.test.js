import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseIdParam,
  parseCrearServicioBody,
  parseActualizarServicioBody,
} from '../../../src/modules/catalogo/domain/servicio.js';
import { ValidationError } from '../../../src/shared/http/errors.js';

const valido = { nombre: 'Consulta', descripcion: null, duracion_minutos: 30 };

test('parseIdParam acepta enteros positivos', () => {
  assert.equal(parseIdParam('1'), 1);
  assert.equal(parseIdParam(42), 42);
});

test('parseIdParam rechaza no enteros/negativos/cadenas vacías', () => {
  for (const valor of ['abc', '-1', '1.5', '', null, undefined, '01e3']) {
    assert.throws(() => parseIdParam(valor), (err) => err instanceof ValidationError && err.status === 400);
  }
});

test('parseCrearServicioBody acepta payload completo y mínimo', () => {
  assert.deepEqual(parseCrearServicioBody(valido), { ...valido, estado: 'activo' });
  assert.deepEqual(parseCrearServicioBody({ nombre: 'X', duracion_minutos: 1 }), {
    nombre: 'X', descripcion: null, duracion_minutos: 1, estado: 'activo',
  });
  assert.deepEqual(parseCrearServicioBody({ ...valido, estado: 'inactivo' }).estado, 'inactivo');
});

test('parseCrearServicioBody rechaza payloads inválidos', () => {
  const invalidos = [
    null, [], 'texto', {},
    { nombre: '   ', duracion_minutos: 30 },
    { nombre: 'x'.repeat(101), duracion_minutos: 30 },
    { nombre: 'X' },
    { nombre: 'X', duracion_minutos: 0 },
    { nombre: 'X', duracion_minutos: 1441 },
    { nombre: 'X', duracion_minutos: 2.5 },
    { nombre: 'X', duracion_minutos: '30' },
    { nombre: 'X', duracion_minutos: 30, estado: 'ARCHIVADO' },
    { nombre: 5, duracion_minutos: 30 },
    { nombre: 'X', descripcion: 'x'.repeat(501), duracion_minutos: 30 },
    { nombre: 'X', descripcion: 42, duracion_minutos: 30 },
  ];
  for (const payload of invalidos) {
    assert.throws(() => parseCrearServicioBody(payload), ValidationError, JSON.stringify(payload).slice(0, 50));
  }
});

test('parseActualizarServicioBody aplica las mismas reglas (PUT completo)', () => {
  assert.deepEqual(parseActualizarServicioBody(valido), { ...valido, estado: 'activo' });
  assert.throws(() => parseActualizarServicioBody({ duracion_minutos: 30 }), ValidationError);
  assert.throws(() => parseActualizarServicioBody({ nombre: 'X' }), ValidationError);
});

test('parseCrearServicioBody recorta espacios del nombre', () => {
  assert.equal(parseCrearServicioBody({ nombre: '  Consulta  ', duracion_minutos: 30 }).nombre, 'Consulta');
});
