import { HASH_FANTASMA, verifyPassword, hashPassword } from '../../../shared/security/passwords.js';
import { AppError } from '../../../shared/http/errors.js';
import { toUsuarioSeguro } from '../domain/usuario.js';

export function crearLogin({ usuarioRepository, sesionStore, rateLimiter }) {
  return async function login({ correo, contrasena }) {
    const acceso = rateLimiter.intentar(correo);
    if (!acceso.permitido) {
      throw new AppError('Demasiados intentos. Intente más tarde.', { status: 429, code: 'RATE_LIMITED' });
    }
    const fila = await usuarioRepository.findByCorreo(correo);
    const hash = fila?.hash_contrasena ?? HASH_FANTASMA;
    const coincide = verifyPassword(contrasena, hash);
    if (!fila || !coincide || fila.estado !== 'activo') {
      rateLimiter.registrarFallo(correo);
      throw new AppError('Credenciales inválidas', { status: 401, code: 'UNAUTHORIZED' });
    }
    rateLimiter.registrarExito(correo);
    const token = sesionStore.crear({
      usuarioId: fila.id,
      nombre_completo: fila.nombre_completo,
      correo: fila.correo,
      rol: fila.rol,
    });
    return { token, usuario: toUsuarioSeguro(fila) };
  };
}

export function crearLogout({ sesionStore }) {
  return async function logout({ token }) {
    sesionStore.revocar(token);
  };
}

export function crearObtenerSesion({ usuarioRepository }) {
  return async function obtenerSesion({ usuarioId }) {
    const fila = await usuarioRepository.findById(usuarioId);
    if (!fila || fila.estado !== 'activo') return null;
    return toUsuarioSeguro(fila);
  };
}

export function crearRegistro({ ejecutarTransaccion }) {
  return async function registro({ datos }) {
    return ejecutarTransaccion({}, async (repos) => {
      const duplicado = await repos.usuarioAdmin.findByCorreo(datos.correo);
      if (duplicado) {
        throw new AppError('No fue posible completar el registro con esos datos', { status: 409, code: 'CONFLICTO_NEGOCIO' });
      }
      const usuario = await repos.usuarioAdmin.create({
        nombre_completo: datos.nombre_completo,
        correo: datos.correo,
        hash_contrasena: hashPassword(datos.contrasena),
        rol: 'solicitante',
        estado: 'activo',
      });
      return toUsuarioSeguro(usuario);
    });
  };
}
