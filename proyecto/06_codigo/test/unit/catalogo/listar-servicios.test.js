import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEstadoQuery, toServicio } from '../../../src/modules/catalogo/domain/servicio.js';
import { crearListarServicios } from '../../../src/modules/catalogo/application/listar-servicios.js';
import { InMemoryServicioRepository } from '../../../src/modules/catalogo/adapters/persistence/servicio-repository-in-memory.js';
import { ValidationError } from '../../../src/shared/http/errors.js';

const fixtures = [
  { id: 1, nombre: 'Consulta general', descripcion: null, duracion_minutos: 30, estado: 'activo' },
  { id: 2, nombre: 'Control pediátrico', descripcion: 'Control de niño sano', duracion_minutos: 45, estado: 'activo' },
  { id: 3, nombre: 'Vacunación (retirado)', descripcion: null, duracion_minutos: 15, estado: 'inactivo' },
];

test('parseEstadoQuery acepta undefined y vacío', () => {
  assert.equal(parseEstadoQuery(undefined), undefined);
  assert.equal(parseEstadoQuery(''), undefined);
});

test('parseEstadoQuery acepta activo e inactivo', () => {
  assert.equal(parseEstadoQuery('activo'), 'activo');
  assert.equal(parseEstadoQuery('inactivo'), 'inactivo');
});

test('parseEstadoQuery rechaza valores inválidos con ValidationError 400', () => {
  for (const valor of ['otro', 'ACTIVO', 'x']) {
    assert.throws(() => parseEstadoQuery(valor), (err) => err instanceof ValidationError && err.status === 400);
  }
});

test('toServicio mapea sólo las 5 columnas de servicio', () => {
  assert.deepEqual(toServicio(fixtures[0]), fixtures[0]);
});

test('listarServicios devuelve la lista completa sin filtro', async () => {
  const useCase = crearListarServicios({ servicioRepository: new InMemoryServicioRepository(fixtures) });
  assert.equal((await useCase()).length, 3);
});

test('listarServicios filtra por estado', async () => {
  const useCase = crearListarServicios({ servicioRepository: new InMemoryServicioRepository(fixtures) });
  const activos = await useCase({ estado: 'activo' });
  assert.equal(activos.length, 2);
  assert.ok(activos.every((s) => s.estado === 'activo'));
  const inactivos = await useCase({ estado: 'inactivo' });
  assert.equal(inactivos.length, 1);
});

test('listarServicios devuelve [] en repositorio vacío', async () => {
  const useCase = crearListarServicios({ servicioRepository: new InMemoryServicioRepository([]) });
  assert.deepEqual(await useCase(), []);
});

test('listarServicios propaga el error del repositorio (sin enmascarar)', async () => {
  const useCase = crearListarServicios({
    servicioRepository: { findAll: async () => { throw new Error('db caida'); } },
  });
  await assert.rejects(useCase(), /db caida/);
});
