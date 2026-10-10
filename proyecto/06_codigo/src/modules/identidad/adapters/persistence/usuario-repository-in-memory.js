export class InMemoryUsuarioRepository {
  #filas;
  #siguienteId;
  constructor(filas = []) {
    this.#filas = filas.map((f) => ({ ...f }));
    this.#siguienteId = this.#filas.reduce((max, f) => Math.max(max, f.id), 0) + 1;
  }

  async findByCorreo(correo) {
    const fila = this.#filas.find((f) => f.correo === correo);
    return fila ? { ...fila } : null;
  }

  async findById(id) {
    const fila = this.#filas.find((f) => f.id === id);
    return fila ? { ...fila } : null;
  }

  async create(datos) {
    const fila = { id: this.#siguienteId++, estado: 'activo', ...datos };
    this.#filas.push(fila);
    return { ...fila };
  }
}
