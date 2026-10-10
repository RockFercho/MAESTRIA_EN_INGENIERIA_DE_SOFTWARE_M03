import { aLocal } from '../../../../shared/time/lapaz.js';

export class InMemoryCitaRepository {
  filas = [];
  sig = 1;
  async create(d) { const f = { id: this.sig++, estado: 'Confirmada', justificacion_cambio: null, ...d }; this.filas.push(f); return { ...f }; }
  async findById(id) { const f = this.filas.find((x) => x.id === id); return f ? { ...f } : null; }
  async findSolapadas(p, ini, fin, excluir = null) {
    const t = (v) => new Date(v).getTime();
    return this.filas
      .filter((c) => c.profesional_id === p && ['Confirmada', 'En atención'].includes(c.estado)
        && t(c.inicio_utc) < t(fin) && t(c.fin_utc) > t(ini) && c.id !== excluir)
      .map((c) => ({ id: c.id }));
  }
  async update(id, d) { const f = this.filas.find((x) => x.id === id); if (!f) return null; Object.assign(f, d); return { ...f }; }
  async findAll({ solicitanteId = null, profesionalId = null, estado = null, fecha = null } = {}) {
    return this.filas
      .filter((c) => (solicitanteId === null || c.solicitante_id === solicitanteId)
        && (profesionalId === null || c.profesional_id === profesionalId)
        && (estado === null || c.estado === estado)
        && (fecha === null || aLocal(new Date(c.inicio_utc)).fecha === fecha))
      .sort((a, b) => new Date(a.inicio_utc) - new Date(b.inicio_utc))
      .map((c) => ({ ...c }));
  }
}

export class InMemoryHistorialRepository {
  filas = [];
  sig = 1;
  async insert(d) { this.filas.push({ id: this.sig++, ...d }); return this.sig - 1; }
}

export class InMemoryAuditoriaRepository {
  filas = [];
  sig = 1;
  async insert(d) { this.filas.push({ operacion_id: this.sig++, ...d }); return this.sig - 1; }
  async findAll({ tipo = null, citaId = null } = {}) {
    return this.filas.filter((a) => (tipo === null || a.tipo_operacion === tipo) && (citaId === null || a.cita_id === citaId)).map((a) => ({ ...a }));
  }
}

export class InMemoryClaveIdempotenciaRepository {
  filas = [];
  async findByClave(k) {
    const f = this.filas.find((x) => x.clave === k && new Date(x.caducaUtc).getTime() > Date.now());
    return f ? { ...f } : null;
  }
  async create(d) { this.filas.push({ ...d }); }
}
