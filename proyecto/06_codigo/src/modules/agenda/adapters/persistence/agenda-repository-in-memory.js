export class InMemoryHorarioRepository {
  filas = [];
  sig = 1;
  async findAllByProfesional(p) { return this.filas.filter((f) => f.profesional_id === p).map((f) => ({ ...f })); }
  async findById(id) { const f = this.filas.find((x) => x.id === id); return f ? { ...f } : null; }
  async create(d) { const f = { id: this.sig++, ...d }; this.filas.push(f); return { ...f }; }
  async delete(id) { const i = this.filas.findIndex((x) => x.id === id); if (i < 0) return false; this.filas.splice(i, 1); return true; }
}

export class InMemoryExcepcionRepository {
  filas = [];
  sig = 1;
  async findAllByProfesional(p, fecha = null) {
    return this.filas.filter((f) => f.profesional_id === p && (fecha === null || f.fecha === fecha)).map((f) => ({ ...f }));
  }
  async findById(id) { const f = this.filas.find((x) => x.id === id); return f ? { ...f } : null; }
  async create(d) { const f = { id: this.sig++, ...d }; this.filas.push(f); return { ...f }; }
  async delete(id) { const i = this.filas.findIndex((x) => x.id === id); if (i < 0) return false; this.filas.splice(i, 1); return true; }
}
