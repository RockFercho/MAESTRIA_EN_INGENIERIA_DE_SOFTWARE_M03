import { AppError } from '../../../../shared/http/errors.js';

const SQL_POR_CORREO = `SELECT id, nombre_completo, correo, hash_contrasena, rol, estado
  FROM usuario
 WHERE correo = :correo`;

const SQL_POR_ID = `SELECT id, nombre_completo, correo, hash_contrasena, rol, estado
  FROM usuario
 WHERE id = :id`;

export class MysqlUsuarioRepository {
  #pool;
  constructor(pool) {
    this.#pool = pool;
  }

  async #ejecutar(sql, params) {
    try {
      const [rows] = await this.#pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('[identidad] error SQL:', err.message);
      throw new AppError('Error al consultar usuario', { status: 500, code: 'DB_ERROR' });
    }
  }

  async findByCorreo(correo) {
    const rows = await this.#ejecutar(SQL_POR_CORREO, { correo });
    return rows[0] ?? null;
  }

  async findById(id) {
    const rows = await this.#ejecutar(SQL_POR_ID, { id });
    return rows[0] ?? null;
  }
}
