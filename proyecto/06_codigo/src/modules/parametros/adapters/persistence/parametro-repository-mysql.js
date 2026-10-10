import { AppError } from '../../../../shared/http/errors.js';

export class MysqlParametroRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async findByClave(clave) {
    try {
      const [rows] = await this.#e.execute(`SELECT clave, valor, descripcion FROM parametro_operativo WHERE clave = :k`, { k: clave });
      return rows[0] ?? null;
    } catch (err) { console.error('[parametros] error SQL:', err.message); throw new AppError('Error al consultar parámetros', { status: 500, code: 'DB_ERROR' }); }
  }
  async findAll() {
    const [rows] = await this.#e.execute(`SELECT clave, valor, descripcion FROM parametro_operativo ORDER BY clave`);
    return rows;
  }
  async upsert({ clave, valor, descripcion, modificadoPor, modificadoUtc }) {
    await this.#e.execute(
      `INSERT INTO parametro_operativo (clave, valor, descripcion, modificado_por, modificado_utc) VALUES (:k, :v, :d, :u, :a)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), descripcion = VALUES(descripcion), modificado_por = VALUES(modificado_por), modificado_utc = VALUES(modificado_utc)`,
      { k: clave, v: valor, d: descripcion ?? null, u: modificadoPor, a: modificadoUtc },
    ).catch((err) => { console.error('[parametros] error SQL upsert:', err.message); throw new AppError('Error al guardar parámetro', { status: 500, code: 'DB_ERROR' }); });
    return this.findByClave(clave);
  }
}
