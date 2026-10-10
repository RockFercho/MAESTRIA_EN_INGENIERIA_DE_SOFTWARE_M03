import { AppError } from '../../../../shared/http/errors.js';

const SQL_LISTAR = `SELECT id, nombre, descripcion, duracion_minutos, estado
  FROM servicio
 WHERE (:estado IS NULL OR estado = :estado)
 ORDER BY id`;

const SQL_POR_ID = `SELECT id, nombre, descripcion, duracion_minutos, estado
  FROM servicio
 WHERE id = :id`;

const SQL_CREAR = `INSERT INTO servicio (nombre, descripcion, duracion_minutos, estado)
VALUES (:nombre, :descripcion, :duracion_minutos, :estado)`;

const SQL_ACTUALIZAR = `UPDATE servicio
   SET nombre = :nombre, descripcion = :descripcion, duracion_minutos = :duracion_minutos, estado = :estado
 WHERE id = :id`;

const SQL_CAMBIAR_ESTADO = `UPDATE servicio SET estado = :estado WHERE id = :id`;

export class MysqlServicioRepository {
  #pool;
  constructor(pool) {
    this.#pool = pool;
  }

  async #ejecutar(sql, params) {
    try {
      return await this.#pool.execute(sql, params);
    } catch (err) {
      console.error('[catalogo] error SQL:', err.message);
      throw new AppError('Error al consultar servicios', { status: 500, code: 'DB_ERROR' });
    }
  }

  async findAll({ estado } = {}) {
    const [rows] = await this.#ejecutar(SQL_LISTAR, { estado: estado ?? null });
    return rows;
  }

  async findById(id) {
    const [rows] = await this.#ejecutar(SQL_POR_ID, { id });
    return rows[0] ?? null;
  }

  async create(datos) {
    const [result] = await this.#ejecutar(SQL_CREAR, datos);
    return this.findById(result.insertId);
  }

  async update(id, datos) {
    const existe = await this.findById(id);
    if (!existe) return null;
    await this.#ejecutar(SQL_ACTUALIZAR, { ...datos, id });
    return this.findById(id);
  }

  async setState(id, estado) {
    const existe = await this.findById(id);
    if (!existe) return null;
    await this.#ejecutar(SQL_CAMBIAR_ESTADO, { id, estado });
    return this.findById(id);
  }
}
