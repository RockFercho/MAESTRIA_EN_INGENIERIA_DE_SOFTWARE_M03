/**
 * @typedef {Object} Servicio
 * @property {number} id
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {number} duracion_minutos
 * @property {'activo'|'inactivo'} estado
 */

/**
 * Puerto (hexagonal): repositorio de servicios.
 * @typedef {Object} ServicioRepository
 * @property {(filtro: {estado?: 'activo'|'inactivo'|undefined}) => Promise<Servicio[]>} findAll
 * @property {(id: number) => Promise<Servicio|null>} findById
 * @property {(datos: {nombre: string, descripcion: string|null, duracion_minutos: number, estado: 'activo'|'inactivo'}) => Promise<Servicio>} create
 * @property {(id: number, datos: {nombre: string, descripcion: string|null, duracion_minutos: number, estado: 'activo'|'inactivo'}) => Promise<Servicio|null>} update
 * @property {(id: number, estado: 'activo'|'inactivo') => Promise<Servicio|null>} setState
 */
export {};
