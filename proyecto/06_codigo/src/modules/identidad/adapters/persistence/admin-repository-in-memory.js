import { ahoraUtcMysql } from '../../../../shared/time/utc.js';

export class InMemoryUsuarioAdminRepository {
  constructor(base = []) { this.filas = base.map((f) => ({ ...f })); this.sig = this.filas.reduce((m, f) => Math.max(m, f.id), 0) + 1; }
  async findAll({ rol = null, estado = null } = {}) {
    return this.filas.filter((u) => (rol === null || u.rol === rol) && (estado === null || u.estado === estado))
      .map(({ hash_contrasena, ...resto }) => resto);
  }
  async findById(id) { const f = this.filas.find((u) => u.id === id); return f ? { ...f } : null; }
  async findByCorreo(c) { const f = this.filas.find((u) => u.correo === c); return f ? { ...f } : null; }
  async create(d) {
    const f = { id: this.sig++, estado: 'activo', creado_utc: ahoraUtcMysql(), ...d };
    this.filas.push(f);
    return { ...f };
  }
  async update(id, { nombre_completo, estado }) {
    const f = this.filas.find((u) => u.id === id);
    if (!f) return null;
    if (nombre_completo) f.nombre_completo = nombre_completo;
    if (estado) f.estado = estado;
    return { ...f };
  }
}

export class InMemoryProfesionalRepository {
  constructor(usuarioRepo = null) { this.filas = []; this.sig = 1; this.usuarios = usuarioRepo; }
  #conUsuario(f) {
    const u = this.usuarios ? this.usuarios.filas.find((x) => x.id === f.usuario_id) : null;
    return { ...f, nombre_completo: u?.nombre_completo ?? null, correo: u?.correo ?? null };
  }
  async findAll({ estado = null } = {}) { return this.filas.filter((p) => estado === null || p.estado === estado).map((f) => this.#conUsuario(f)); }
  async findById(id) { const f = this.filas.find((p) => p.id === id); return f ? this.#conUsuario(f) : null; }
  async findByUsuarioId(u) { const f = this.filas.find((p) => p.usuario_id === u); return f ? this.#conUsuario(f) : null; }
  async create(d) { const f = { id: this.sig++, estado: 'activo', datos_exhibicion: null, ...d }; this.filas.push(f); return this.#conUsuario(f); }
  async update(id, { datos_exhibicion, estado }) {
    const f = this.filas.find((p) => p.id === id);
    if (!f) return null;
    if (datos_exhibicion) f.datos_exhibicion = datos_exhibicion;
    if (estado) { f.estado = estado; f.desactivado_utc = estado === 'inactivo' ? ahoraUtcMysql() : null; }
    return this.#conUsuario(f);
  }
}

export class InMemoryAsociacionRepository {
  constructor() { this.filas = []; }
  async findAllByProfesional(p) { return this.filas.filter((a) => a.profesional_id === p).map((a) => ({ ...a })); }
  async findByClaves(p, s) { const f = this.filas.find((a) => a.profesional_id === p && a.servicio_id === s); return f ? { ...f } : null; }
  async create(d) {
    const f = { estado: 'activa', registrado_utc: ahoraUtcMysql(), baja_utc: null, duracion_especifica: null, ...d };
    this.filas.push(f);
    return { ...f };
  }
  async update(p, s, { duracion_especifica, estado }) {
    const f = this.filas.find((a) => a.profesional_id === p && a.servicio_id === s);
    if (!f) return null;
    if (duracion_especifica !== undefined && duracion_especifica !== null) f.duracion_especifica = duracion_especifica;
    if (estado) { f.estado = estado; f.baja_utc = estado === 'inactiva' ? (f.baja_utc ?? ahoraUtcMysql()) : null; }
    return { ...f };
  }
}
