import { AppError, ValidationError, NotFoundError } from '../../../shared/http/errors.js';
import { hashPassword } from '../../../shared/security/passwords.js';
import { toUsuarioSeguro } from '../domain/usuario.js';

export function crearCasosAdminUsuarios({ ejecutarTransaccion }) {
  return {
    listarUsuarios: ({ rol, estado } = {}) => ejecutarTransaccion({}, (r) => r.usuarioAdmin.findAll({ rol, estado })),

    obtenerUsuario: ({ id }) => ejecutarTransaccion({}, async (r) => {
      const u = await r.usuarioAdmin.findById(id);
      if (!u) throw new NotFoundError('Usuario no encontrado');
      return toUsuarioSeguro({ ...u, estado: u.estado });
    }),

    crearUsuario: ({ datos }) => ejecutarTransaccion({}, async (r) => {
      const duplicado = await r.usuarioAdmin.findByCorreo(datos.correo);
      if (duplicado) throw new AppError('Ya existe un usuario con ese correo', { status: 409, code: 'CONFLICTO_NEGOCIO' });
      const u = await r.usuarioAdmin.create({
        nombre_completo: datos.nombre_completo,
        correo: datos.correo,
        hash_contrasena: hashPassword(datos.contrasena),
        rol: datos.rol,
      });
      return toUsuarioSeguro(u);
    }),

    actualizarUsuario: ({ id, datos }) => ejecutarTransaccion({}, async (r) => {
      const u = await r.usuarioAdmin.update(id, datos);
      if (!u) throw new NotFoundError('Usuario no encontrado');
      return toUsuarioSeguro(u);
    }),

    listarProfesionales: ({ estado } = {}) => ejecutarTransaccion({}, (r) => r.profesionales.findAll({ estado })),

    crearProfesional: ({ datos }) => ejecutarTransaccion({ lock: 'usuarios-creacion' }, async (r) => {
      const duplicado = await r.usuarioAdmin.findByCorreo(datos.correo);
      if (duplicado) throw new AppError('Ya existe un usuario con ese correo', { status: 409, code: 'CONFLICTO_NEGOCIO' });
      const u = await r.usuarioAdmin.create({
        nombre_completo: datos.nombre_completo,
        correo: datos.correo,
        hash_contrasena: hashPassword(datos.contrasena),
        rol: 'profesional',
      });
      const p = await r.profesionales.create({ usuario_id: u.id, datos_exhibicion: datos.datos_exhibicion });
      return { ...p, nombre_completo: u.nombre_completo, correo: u.correo };
    }),

    actualizarProfesional: ({ id, datos }) => ejecutarTransaccion({}, async (r) => {
      const p = await r.profesionales.update(id, datos);
      if (!p) throw new NotFoundError('Profesional no encontrado');
      return p;
    }),

    obtenerProfesional: ({ id }) => ejecutarTransaccion({}, async (r) => {
      const p = await r.profesionales.findById(id);
      if (!p) throw new NotFoundError('Profesional no encontrado');
      return p;
    }),
  };
}

export function crearCasosAsociaciones({ ejecutarTransaccion }) {
  return {
    listarAsociaciones: ({ profesionalId }) => ejecutarTransaccion({}, (r) => r.asociaciones.findAllByProfesional(profesionalId)),

    crearAsociacion: ({ profesionalId, datos }) => ejecutarTransaccion({}, async (r) => {
      const profesional = await r.profesionales.findById(profesionalId);
      if (!profesional || profesional.estado !== 'activo') throw new NotFoundError('Profesional inexistente o inactivo');
      const servicio = await r.servicios.findById(datos.servicioId);
      if (!servicio || servicio.estado !== 'activo') throw new NotFoundError('Servicio inexistente o inactivo');
      const previa = await r.asociaciones.findByClaves(profesionalId, datos.servicioId);
      if (previa) throw new AppError('La asociación ya existe (use PUT para modificarla)', { status: 409, code: 'CONFLICTO_NEGOCIO' });
      const a = await r.asociaciones.create({ profesional_id: profesionalId, servicio_id: datos.servicioId, duracion_especifica: datos.duracion });
      return a;
    }),

    actualizarAsociacion: ({ profesionalId, servicioId, datos }) => ejecutarTransaccion({}, async (r) => {
      const previa = await r.asociaciones.findByClaves(profesionalId, servicioId);
      if (!previa) throw new NotFoundError('Asociación no encontrada');
      return r.asociaciones.update(profesionalId, servicioId, { duracion_especifica: datos.duracion, estado: datos.estado });
    }),
  };
}
