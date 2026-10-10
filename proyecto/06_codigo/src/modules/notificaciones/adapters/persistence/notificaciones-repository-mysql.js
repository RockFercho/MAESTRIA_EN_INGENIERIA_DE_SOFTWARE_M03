import { AppError } from '../../../../shared/http/errors.js';

export class MysqlOutboxRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async insert(datos) {
    const [r] = await this.#e.execute(
      `INSERT INTO evento_outbox (correlacion_id, tipo_evento, cita_id, carga, estado, intentos, creado_utc) VALUES (:corr, :t, :c, :carga, 'pendiente', 0, :ahora)`,
      { corr: datos.correlacion_id, t: datos.tipo_evento, c: datos.cita_id ?? null, carga: datos.carga, ahora: datos.ahora },
    ).catch((err) => { console.error('[notificaciones] error SQL outbox:', err.message); throw new AppError('Error al encolar evento', { status: 500, code: 'DB_ERROR' }); });
    return r.insertId;
  }
  async findPendientes(limite = 50) {
    const [rows] = await this.#e.execute(`SELECT * FROM evento_outbox WHERE estado = 'pendiente' ORDER BY id LIMIT ${Number(limite)}`);
    return rows;
  }
  async markProcesado(id, ahora) {
    await this.#e.execute(`UPDATE evento_outbox SET estado = 'procesado', intentos = intentos + 1, procesado_utc = :a WHERE id = :id`, { id, a: ahora });
  }
  async marcarFallo(id) {
    await this.#e.execute(`UPDATE evento_outbox SET intentos = intentos + 1 WHERE id = :id`, { id });
  }
}

export class MysqlNotificacionRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async insert(datos) {
    const [r] = await this.#e.execute(
      `INSERT INTO notificacion (destinatario_id, cita_id, evento, instantanea_datos, generado_utc) VALUES (:d, :c, :e, :i, :a)`,
      { d: datos.destinatario_id, c: datos.cita_id, e: datos.evento, i: datos.instantanea_datos, a: datos.ahora },
    ).catch((err) => { console.error('[notificaciones] error SQL insert:', err.message); throw new AppError('Error al crear notificación', { status: 500, code: 'DB_ERROR' }); });
    return r.insertId;
  }
  async findAllByDestinatario(destinatarioId) {
    const [rows] = await this.#e.execute(`SELECT id, destinatario_id, cita_id, evento, instantanea_datos, generado_utc FROM notificacion WHERE destinatario_id = :d ORDER BY id DESC`, { d: destinatarioId });
    return rows;
  }
}
