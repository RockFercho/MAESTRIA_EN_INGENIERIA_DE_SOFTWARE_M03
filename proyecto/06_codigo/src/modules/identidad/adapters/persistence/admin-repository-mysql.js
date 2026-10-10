import { AppError } from '../../../../shared/http/errors.js';
import { ahoraUtcMysql } from '../../../../shared/time/utc.js';

export class MysqlUsuarioAdminRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async findAll({ rol = null, estado = null } = {}) {
    try {
      const [rows] = await this.#e.execute(
        `SELECT id, nombre_completo, correo, rol, estado, creado_utc FROM usuario WHERE (:r IS NULL OR rol = :r) AND (:e IS NULL OR estado = :e) ORDER BY id`,
        { r: rol, e: estado },
      );
      return rows;
    } catch (err) { console.error('[identidad] error SQL usuarios:', err.message); throw new AppError('Error al consultar usuarios', { status: 500, code: 'DB_ERROR' }); }
  }
  async findById(id) {
    const [rows] = await this.#e.execute(`SELECT id, nombre_completo, correo, hash_contrasena, rol, estado FROM usuario WHERE id = :id`, { id });
    return rows[0] ?? null;
  }
  async findByCorreo(correo) {
    const [rows] = await this.#e.execute(`SELECT id FROM usuario WHERE correo = :c`, { c: correo });
    return rows[0] ?? null;
  }
  async create({ nombre_completo, correo, hash_contrasena, rol, estado = 'activo' }) {
    const ahora = ahoraUtcMysql();
    const [r] = await this.#e.execute(
      `INSERT INTO usuario (nombre_completo, correo, hash_contrasena, rol, estado, creado_utc, actualizado_utc) VALUES (:n, :c, :h, :r, :e, :a, :a)`,
      { n: nombre_completo, c: correo, h: hash_contrasena, r: rol, e: estado, a: ahora },
    ).catch((err) => { console.error('[identidad] error SQL usuario insert:', err.message); throw new AppError('Error al crear usuario (¿correo duplicado?)', { status: 500, code: 'DB_ERROR' }); });
    return this.findById(r.insertId);
  }
  async update(id, { nombre_completo, estado }) {
    await this.#e.execute(
      `UPDATE usuario SET nombre_completo = COALESCE(:n, nombre_completo), estado = COALESCE(:e, estado), actualizado_utc = :a WHERE id = :id`,
      { id, n: nombre_completo ?? null, e: estado ?? null, a: ahoraUtcMysql() },
    ).catch((err) => { console.error('[identidad] error SQL usuario update:', err.message); throw new AppError('Error al actualizar usuario', { status: 500, code: 'DB_ERROR' }); });
    return this.findById(id);
  }
}

export class MysqlProfesionalRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async findAll({ estado = null } = {}) {
    const [rows] = await this.#e.execute(
      `SELECT p.id, p.usuario_id, u.nombre_completo, u.correo, p.datos_exhibicion, p.estado FROM profesional p JOIN usuario u ON u.id = p.usuario_id WHERE (:e IS NULL OR p.estado = :e) ORDER BY p.id`,
      { e: estado },
    );
    return rows;
  }
  async findById(id) {
    const [rows] = await this.#e.execute(
      `SELECT p.id, p.usuario_id, u.nombre_completo, u.correo, p.datos_exhibicion, p.estado, p.desactivado_utc FROM profesional p JOIN usuario u ON u.id = p.usuario_id WHERE p.id = :id`,
      { id },
    );
    return rows[0] ?? null;
  }
  async findByUsuarioId(usuarioId) {
    const [rows] = await this.#e.execute(`SELECT id, usuario_id, datos_exhibicion, estado FROM profesional WHERE usuario_id = :u`, { u: usuarioId });
    return rows[0] ?? null;
  }
  async create({ usuario_id, datos_exhibicion = null }) {
    const [r] = await this.#e.execute(
      `INSERT INTO profesional (usuario_id, datos_exhibicion, estado, desactivado_utc) VALUES (:u, :d, 'activo', NULL)`,
      { u: usuario_id, d: datos_exhibicion },
    ).catch((err) => { console.error('[identidad] error SQL profesional insert:', err.message); throw new AppError('Error al crear profesional', { status: 500, code: 'DB_ERROR' }); });
    return this.findById(r.insertId);
  }
  async update(id, { datos_exhibicion, estado }) {
    const desactivado = estado === 'inactivo' ? ahoraUtcMysql() : null;
    await this.#e.execute(
      `UPDATE profesional SET datos_exhibicion = COALESCE(:d, datos_exhibicion), estado = COALESCE(:e, estado), desactivado_utc = CASE WHEN :e = 'inactivo' THEN :dz ELSE NULL END WHERE id = :id`,
      { id, d: datos_exhibicion ?? null, e: estado ?? null, dz: desactivado },
    ).catch((err) => { console.error('[identidad] error SQL profesional update:', err.message); throw new AppError('Error al actualizar profesional', { status: 500, code: 'DB_ERROR' }); });
    return this.findById(id);
  }
}

export class MysqlAsociacionRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async findAllByProfesional(profesionalId) {
    const [rows] = await this.#e.execute(
      `SELECT a.profesional_id, a.servicio_id, s.nombre, a.duracion_especifica, a.estado FROM asociacion_profesional_servicio a JOIN servicio s ON s.id = a.servicio_id WHERE a.profesional_id = :p ORDER BY a.servicio_id`,
      { p: profesionalId },
    );
    return rows;
  }
  async findByClaves(profesionalId, servicioId) {
    const [rows] = await this.#e.execute(
      `SELECT profesional_id, servicio_id, duracion_especifica, estado, registrado_utc, baja_utc FROM asociacion_profesional_servicio WHERE profesional_id = :p AND servicio_id = :s`,
      { p: profesionalId, s: servicioId },
    );
    return rows[0] ?? null;
  }
  async create({ profesional_id, servicio_id, duracion_especifica = null }) {
    const [r] = await this.#e.execute(
      `INSERT INTO asociacion_profesional_servicio (profesional_id, servicio_id, duracion_especifica, estado, registrado_utc, baja_utc) VALUES (:p, :s, :d, 'activa', :a, NULL)`,
      { p: profesional_id, s: servicio_id, d: duracion_especifica, a: ahoraUtcMysql() },
    ).catch((err) => { console.error('[catalogo] error SQL asociación insert:', err.message); throw new AppError('Error al crear asociación (¿duplicada?)', { status: 500, code: 'DB_ERROR' }); });
    return this.findByClaves(r.insertId ? profesional_id : profesional_id, servicio_id);
  }
  async update(profesionalId, servicioId, { duracion_especifica, estado }) {
    await this.#e.execute(
      `UPDATE asociacion_profesional_servicio SET duracion_especifica = COALESCE(:d, duracion_especifica), estado = COALESCE(:e, estado),
        baja_utc = CASE WHEN :e = 'inactiva' THEN COALESCE(baja_utc, :a) ELSE NULL END
       WHERE profesional_id = :p AND servicio_id = :s`,
      { p: profesionalId, s: servicioId, d: duracion_especifica ?? null, e: estado ?? null, a: ahoraUtcMysql() },
    ).catch((err) => { console.error('[catalogo] error SQL asociación update:', err.message); throw new AppError('Error al actualizar asociación', { status: 500, code: 'DB_ERROR' }); });
    return this.findByClaves(profesionalId, servicioId);
  }
}
