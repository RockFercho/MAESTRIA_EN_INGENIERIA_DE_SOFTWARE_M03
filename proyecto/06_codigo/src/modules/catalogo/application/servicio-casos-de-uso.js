import { toServicio } from '../domain/servicio.js';

export function crearObtenerServicio({ servicioRepository }) {
  return async function obtenerServicio({ id }) {
    const fila = await servicioRepository.findById(id);
    return fila ? toServicio(fila) : null;
  };
}

export function crearCrearServicio({ servicioRepository }) {
  return async function crearServicio({ datos }) {
    const fila = await servicioRepository.create(datos);
    return toServicio(fila);
  };
}

export function crearActualizarServicio({ servicioRepository }) {
  return async function actualizarServicio({ id, datos }) {
    const fila = await servicioRepository.update(id, datos);
    return fila ? toServicio(fila) : null;
  };
}

export function crearDesactivarServicio({ servicioRepository }) {
  return async function desactivarServicio({ id }) {
    const fila = await servicioRepository.setState(id, 'inactivo');
    return fila ? toServicio(fila) : null;
  };
}
