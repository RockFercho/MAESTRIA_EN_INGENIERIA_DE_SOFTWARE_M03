export class InMemoryServicioRepository {
  #filas;
  #siguienteId;
  constructor(filas = []) {
    this.#filas = filas.map((f) => ({ ...f }));
    this.#siguienteId = this.#filas.reduce((max, f) => Math.max(max, f.id), 0) + 1;
  }

  async findAll({ estado } = {}) {
    const filas = estado === undefined ? this.#filas : this.#filas.filter((f) => f.estado === estado);
    return filas.map((f) => ({ ...f }));
  }

  async findById(id) {
    const fila = this.#filas.find((f) => f.id === id);
    return fila ? { ...fila } : null;
  }

  async create(datos) {
    const fila = { id: this.#siguienteId++, ...datos };
    this.#filas.push(fila);
    return { ...fila };
  }

  async update(id, datos) {
    const fila = this.#filas.find((f) => f.id === id);
    if (!fila) return null;
    Object.assign(fila, datos);
    return { ...fila };
  }

  async setState(id, estado) {
    const fila = this.#filas.find((f) => f.id === id);
    if (!fila) return null;
    fila.estado = estado;
    return { ...fila };
  }
}
