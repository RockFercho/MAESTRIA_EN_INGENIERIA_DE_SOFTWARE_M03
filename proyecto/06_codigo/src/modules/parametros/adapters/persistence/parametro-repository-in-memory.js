export class InMemoryParametroRepository {
  filas = new Map();
  async findByClave(k) { const f = this.filas.get(k); return f ? { ...f } : null; }
  async findAll() { return [...this.filas.values()].sort((a, b) => a.clave.localeCompare(b.clave)).map((f) => ({ ...f })); }
  async upsert({ clave, valor, descripcion = null }) { this.filas.set(clave, { clave, valor, descripcion }); return this.findByClave(clave); }
}
