export class InMemoryOutboxRepository {
  filas = [];
  sig = 1;
  async insert(d) { this.filas.push({ id: this.sig++, estado: 'pendiente', intentos: 0, ...d }); return this.sig - 1; }
  async findPendientes() { return this.filas.filter((f) => f.estado === 'pendiente').map((f) => ({ ...f })); }
  async markProcesado(id, ahora) { const f = this.filas.find((x) => x.id === id); if (f) { f.estado = 'procesado'; f.intentos += 1; f.procesado_utc = ahora; } }
  async marcarFallo(id) { const f = this.filas.find((x) => x.id === id); if (f) f.intentos += 1; }
}

export class InMemoryNotificacionRepository {
  filas = [];
  sig = 1;
  async insert(d) { this.filas.push({ id: this.sig++, ...d }); return this.sig - 1; }
  async findAllByDestinatario(d) { return this.filas.filter((f) => f.destinatario_id === d).sort((a, b) => b.id - a.id).map((f) => ({ ...f })); }
}
