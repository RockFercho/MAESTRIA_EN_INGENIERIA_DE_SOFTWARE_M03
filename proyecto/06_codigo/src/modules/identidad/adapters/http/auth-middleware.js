import { AppError } from '../../../../shared/http/errors.js';

export function crearRequireAuth({ sesionStore }) {
  return function requireAuth(req, _res, next) {
    const cabecera = req.headers.authorization ?? '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : null;
    if (!token) {
      return next(new AppError('Autenticación requerida', { status: 401, code: 'UNAUTHORIZED' }));
    }
    const sesion = sesionStore.obtener(token);
    if (!sesion) {
      return next(new AppError('Sesión inválida o expirada', { status: 401, code: 'UNAUTHORIZED' }));
    }
    req.sesion = { ...sesion, id: sesion.usuarioId, token };
    next();
  };
}

export function requerirRol(...roles) {
  return function (req, _res, next) {
    if (!req.sesion) {
      return next(new AppError('Autenticación requerida', { status: 401, code: 'UNAUTHORIZED' }));
    }
    if (!roles.includes(req.sesion.rol)) {
      return next(new AppError('No autorizado para esta operación', { status: 403, code: 'FORBIDDEN' }));
    }
    next();
  };
}
