import { toServicio } from '../domain/servicio.js';

export function crearListarServicios({ servicioRepository }) {
  return async function listarServicios({ estado } = {}) {
    const filas = await servicioRepository.findAll({ estado });
    return filas.map(toServicio);
  };
}
