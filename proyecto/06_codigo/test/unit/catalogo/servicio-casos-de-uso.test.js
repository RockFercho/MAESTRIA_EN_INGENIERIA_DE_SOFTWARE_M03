import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryServicioRepository } from '../../../src/modules/catalogo/adapters/persistence/servicio-repository-in-memory.js';
import {
  crearObtenerServicio,
  crearCrearServicio,
  crearActualizarServicio,
  crearDesactivarServicio,
} from '../../../src/modules/catalogo/application/servicio-casos-de-uso.js';

const base = [{ id: 1, nombre: 'Consulta', descripcion: null, duracion_minutos: 30, estado: 'activo' }];
const repo = () => new InMemoryServicioRepository(base);
const datos = { nombre: 'Nuevo', descripcion: 'd', duracion_minutos: 45, estado: 'activo' };

test('obtenerServicio devuelve el servicio o null', async () => {
  const obtener = crearObtenerServicio({ servicioRepository: repo() });
  assert.equal((await obtener({ id: 1 })).nombre, 'Consulta');
  assert.equal(await obtener({ id: 99 }), null);
});

test('crearServicio persiste y devuelve el servicio con id', async () => {
  const crear = crearCrearServicio({ servicioRepository: repo() });
  const creado = await crear({ datos });
  assert.equal(creado.id, 2);
  assert.equal(creado.nombre, 'Nuevo');
});

test('actualizarServicio modifica o devuelve null', async () => {
  const actualizar = crearActualizarServicio({ servicioRepository: repo() });
  const actualizado = await actualizar({ id: 1, datos: { ...datos, nombre: 'Modificado' } });
  assert.equal(actualizado.nombre, 'Modificado');
  assert.equal(await actualizar({ id: 99, datos }), null);
});

test('desactivarServicio cambia estado a inactivo sin eliminar la fila', async () => {
  const r = repo();
  const desactivar = crearDesactivarServicio({ servicioRepository: r });
  const resultado = await desactivar({ id: 1 });
  assert.equal(resultado.estado, 'inactivo');
  assert.ok(await r.findById(1), 'la fila debe persistir');
  assert.equal(await desactivar({ id: 99 }), null);
});
