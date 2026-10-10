import { AppError } from '../../../../shared/http/errors.js';

export class MysqlCitaRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async #q(sql, params) {
    try { const [rows] = await this.#e.execute(sql, params); return rows; }
    catch (err) { console.error('[reservas] error SQL cita:', err.message); throw new AppError('Error al consultar citas', { status: 500, code: 'DB_ERROR' }); }
  }
  async create(datos) {
    const [r] = await this.#e.execute(
      `INSERT INTO cita (solicitante_id, profesional_id, servicio_id, inicio_utc, fin_utc, duracion_efectiva_min, estado, justificacion_cambio, creado_utc, actualizado_utc)
       VALUES (:s, :p, :sv, :i, :f, :d, 'Confirmada', NULL, :ahora, :ahora)`,
      { s: datos.solicitante_id, p: datos.profesional_id, sv: datos.servicio_id, i: datos.inicio_utc, f: datos.fin_utc, d: datos.duracion_efectiva_min, ahora: datos.ahora },
    ).catch((err) => { console.error('[reservas] error SQL cita insert:', err.message); throw new AppError('Error al crear cita', { status: 500, code: 'DB_ERROR' }); });
    return this.findById(r.insertId);
  }
  async findById(id) {
    const filas = await this.#q(`SELECT * FROM cita WHERE id = :id`, { id });
    return filas[0] ?? null;
  }
  async findSolapadas(profesionalId, inicioUtc, finUtc, excluyendoId = null) {
    return this.#q(
      `SELECT id FROM cita WHERE profesional_id = :p AND estado IN ('Confirmada', 'En atención') AND inicio_utc < :fin AND fin_utc > :inicio AND (:x IS NULL OR id <> :x)`,
      { p: profesionalId, inicio: inicioUtc, fin: finUtc, x: excluyendoId },
    );
  }
  async update(id, datos) {
    await this.#e.execute(
      `UPDATE cita SET inicio_utc = :i, fin_utc = :f, estado = :e, justificacion_cambio = :j, actualizado_utc = :ahora WHERE id = :id`,
      { id, i: datos.inicio_utc, f: datos.fin_utc, e: datos.estado, j: datos.justificacion_cambio ?? null, ahora: datos.ahora },
    ).catch((err) => { console.error('[reservas] error SQL cita update:', err.message); throw new AppError('Error al actualizar cita', { status: 500, code: 'DB_ERROR' }); });
    return this.findById(id);
  }
  async findAll({ solicitanteId = null, profesionalId = null, estado = null, fecha = null } = {}) {
    return this.#q(
      `SELECT * FROM cita WHERE (:s IS NULL OR solicitante_id = :s) AND (:p IS NULL OR profesional_id = :p) AND (:e IS NULL OR estado = :e)
         AND (:f IS NULL OR DATE(inicio_utc - INTERVAL 4 HOUR) = :f) ORDER BY inicio_utc`,
      { s: solicitanteId, p: profesionalId, e: estado, f: fecha },
    );
  }
}

export class MysqlHistorialRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async insert(datos) {
    const [r] = await this.#e.execute(
      `INSERT INTO historial_cambio_cita (cita_id, usuario_id, tipo_cambio, estado_anterior, estado_nuevo, fecha_anterior_utc, fecha_nueva_utc, cambiado_utc, justificacion)
       VALUES (:c, :u, :t, :ea, :en, :fa, :fn, :ahora, :j)`,
      { c: datos.cita_id, u: datos.usuario_id, t: datos.tipo_cambio, ea: datos.estado_anterior ?? null, en: datos.estado_nuevo ?? null, fa: datos.fecha_anterior_utc ?? null, fn: datos.fecha_nueva_utc ?? null, ahora: datos.ahora, j: datos.justificacion ?? null },
    ).catch((err) => { console.error('[seguimiento] error SQL historial:', err.message); throw new AppError('Error al registrar historial', { status: 500, code: 'DB_ERROR' }); });
    return r.insertId;
  }
}

export class MysqlAuditoriaRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async insert(datos) {
    const [r] = await this.#e.execute(
      `INSERT INTO auditoria_operacion (usuario_id, cita_id, tipo_operacion, fecha_hora_utc, resultado, contexto)
       VALUES (:u, :c, :t, :ahora, :r, :ctx)`,
      { u: datos.usuario_id, c: datos.cita_id ?? null, t: datos.tipo_operacion, ahora: datos.fecha_hora_utc ?? null, r: datos.resultado, ctx: datos.contexto ?? null },
    ).catch((err) => { console.error('[auditoria] error SQL:', err.message); throw new AppError('Error al registrar auditoría', { status: 500, code: 'DB_ERROR' }); });
    return r.insertId;
  }
  async findAll({ tipo = null, citaId = null, limite = 100 } = {}) {
    const [rows] = await this.#e.execute(
      `SELECT * FROM auditoria_operacion WHERE (:t IS NULL OR tipo_operacion = :t) AND (:c IS NULL OR cita_id = :c) ORDER BY fecha_hora_utc DESC LIMIT ${Number(limite)}`,
      { t: tipo, c: citaId },
    ).catch((err) => { console.error('[auditoria] error SQL select:', err.message); throw new AppError('Error al consultar auditoría', { status: 500, code: 'DB_ERROR' }); });
    return rows;
  }
}

export class MysqlClaveIdempotenciaRepository {
  #e;
  constructor(executor) { this.#e = executor; }
  async findByClave(clave) {
    try {
      const [rows] = await this.#e.execute(`SELECT clave, tipo_operacion, solicitud_original, resultado FROM clave_idempotencia WHERE clave = :k AND caduca_utc > UTC_TIMESTAMP(3)`, { k: clave });
      return rows[0] ?? null;
    } catch (err) { console.error('[reservas] error SQL clave:', err.message); throw new AppError('Error al consultar idempotencia', { status: 500, code: 'DB_ERROR' }); }
  }
  async create({ clave, usuarioId, tipoOperacion, solicitud, resultado, creadaUtc, caducaUtc }) {
    await this.#e.execute(
      `INSERT INTO clave_idempotencia (clave, usuario_sesion, tipo_operacion, solicitud_original, resultado, creada_utc, caduca_utc) VALUES (:k, :u, :t, :s, :r, :c, :cad)`,
      { k: clave, u: usuarioId, t: tipoOperacion, s: solicitud, r: resultado, c: creadaUtc, cad: caducaUtc },
    ).catch((err) => { console.error('[reservas] error SQL clave insert:', err.message); throw new AppError('Error al registrar idempotencia', { status: 500, code: 'DB_ERROR' }); });
  }
}
