/**
 * @typedef {Object} Usuario
 * @property {number} id
 * @property {string} nombre_completo
 * @property {string} correo
 * @property {string} hash_contrasena
 * @property {'solicitante'|'profesional'|'administrador'} rol
 * @property {'activo'|'inactivo'} estado
 */

/**
 * Puerto: repositorio de usuarios.
 * @typedef {Object} UsuarioRepository
 * @property {(correo: string) => Promise<Usuario|null>} findByCorreo
 * @property {(id: number) => Promise<Usuario|null>} findById
 */

/**
 * Puerto: almacén de sesiones en proceso.
 * @typedef {Object} SesionStore
 * @property {(datos: {usuarioId:number, nombre_completo:string, correo:string, rol:string}) => string} crear
 * @property {(token: string) => (Object|null)} obtener
 * @property {(token: string) => void} revocar
 */
export {};
