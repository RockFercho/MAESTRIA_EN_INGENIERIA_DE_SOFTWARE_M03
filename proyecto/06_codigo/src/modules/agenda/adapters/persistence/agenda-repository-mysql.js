import { AppError } from '../../../../shared/http/errors.js';

function envolver(sql) {
  return sql;
}

export class MysqlHorarioRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async #q(sql, params) {
    try { const [rows] = await this.#e.execute(sql, params); return rows; }
    catch (err) { console.error('[agenda] error SQL horario:', err.message); throw new AppError('Error al consultar horarios', { status: 500, code: 'DB_ERROR' }); }
  }
  async findAllByProfesional(profesionalId) {
    return this.#q(envolver(`SELECT id, profesional_id, dia_semana, hora_inicio, hora_fin FROM horario_habitual WHERE profesional_id = :p ORDER BY dia_semana, hora_inicio`), { p: profesionalId });
  }
  async existeSolape(profesionalId, dia, inicio, fin, excluyendoId = null) {
    const filas = await this.#q(`SELECT id FROM horario_habitual WHERE profesional_id = :p AND dia_semana = :d AND id <> COALESCE(:x, 0)`, { p: profesionalId, d: dia, x: excluyendoId });
    return filas.some(() => true);
  }
  async create({ profesional_id, dia_semana, hora_inicio, hora_fin }) {
    const [r] = await this.#e.execute(
      `INSERT INTO horario_habitual (profesional_id, dia_semana, hora_inicio, hora_fin) VALUES (:p, :d, :hi, :hf)`,
      { p: profesional_id, d: dia_semana, hi: hora_inicio, hf: hora_fin },
    ).catch((err) => { console.error('[agenda] error SQL horario insert:', err.message); throw new AppError('Error al crear horario (verifique solapes)', { status: 500, code: 'DB_ERROR' }); });
    return { id: r.insertId, profesional_id, dia_semana, hora_inicio, hora_fin };
  }
  async delete(id) {
    const [r] = await this.#e.execute(`DELETE FROM horario_habitual WHERE id = :id`, { id }).catch((err) => { console.error('[agenda] error SQL horario delete:', err.message); throw new AppError('Error al eliminar horario', { status: 500, code: 'DB_ERROR' }); });
    return r.affectedRows > 0;
  }
  async findById(id) {
    const filas = await this.#q(`SELECT * FROM horario_habitual WHERE id = :id`, { id });
    return filas[0] ?? null;
  }
}

export class MysqlExcepcionRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async #q(sql, params) {
    try { const [rows] = await this.#e.execute(sql, params); return rows; }
    catch (err) { console.error('[agenda] error SQL excepción:', err.message); throw new AppError('Error al consultar excepciones', { status: 500, code: 'DB_ERROR' }); }
  }
  async findAllByProfesional(profesionalId, fecha = null) {
    return this.#q(`SELECT id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo FROM excepcion_disponibilidad WHERE profesional_id = :p AND (:f IS NULL OR fecha = :f) ORDER BY fecha`, { p: profesionalId, f: fecha });
  }
  async create(datos) {
    const [r] = await this.#e.execute(
      `INSERT INTO excepcion_disponibilidad (profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo) VALUES (:p, :f, :hi, :hf, :t, :m)`,
      { p: datos.profesional_id, f: datos.fecha, hi: datos.hora_inicio, hf: datos.hora_fin, t: datos.tipo, m: datos.motivo },
    ).catch((err) => { console.error('[agenda] error SQL excepción insert:', err.message); throw new AppError('Error al crear excepción', { status: 500, code: 'DB_ERROR' }); });
    return { id: r.insertId, ...datos };
  }
  async delete(id) {
    const [r] = await this.#e.execute(`DELETE FROM excepcion_disponibilidad WHERE id = :id`, { id }).catch((err) => { console.error('[agenda] error SQL excepción delete:', err.message); throw new AppError('Error al eliminar excepción', { status: 500, code: 'DB_ERROR' }); });
    return r.affectedRows > 0;
  }
  async findById(id) {
    const filas = await this.#q(`SELECT * FROM excepcion_disponibilidad WHERE id = :id`, { id });
    return filas[0] ?? null;
  }
}
