import { randomBytes } from 'node:crypto';

export class SesionStoreEnMemoria {
  #sesiones = new Map();
  #ttlMs;
  constructor({ ttlMinutos = 480 } = {}) {
    this.#ttlMs = ttlMinutos * 60000;
  }

  crear(datos) {
    const token = randomBytes(32).toString('hex');
    this.#sesiones.set(token, { ...datos, expiraMs: Date.now() + this.#ttlMs });
    return token;
  }

  obtener(token) {
    const sesion = this.#sesiones.get(token);
    if (!sesion) return null;
    if (sesion.expiraMs <= Date.now()) {
      this.#sesiones.delete(token);
      return null;
    }
    return { ...sesion };
  }

  revocar(token) {
    this.#sesiones.delete(token);
  }
}

export class LoginRateLimiterEnMemoria {
  #intentos = new Map();
  #maxIntentos;
  #ventanaMs;
  constructor({ maxIntentos = 5, ventanaMinutos = 15 } = {}) {
    this.#maxIntentos = maxIntentos;
    this.#ventanaMs = ventanaMinutos * 60000;
  }

  intentar(clave) {
    const estado = this.#intentos.get(clave);
    if (!estado) return { permitido: true };
    if (estado.bloqueadoHasta > Date.now()) return { permitido: false };
    return { permitido: true };
  }

  registrarFallo(clave) {
    const ahora = Date.now();
    const estado = this.#intentos.get(clave) ?? { fallos: 0, ventanaDesde: ahora, bloqueadoHasta: 0 };
    if (ahora - estado.ventanaDesde > this.#ventanaMs) {
      estado.fallos = 0;
      estado.ventanaDesde = ahora;
      estado.bloqueadoHasta = 0;
    }
    estado.fallos += 1;
    if (estado.fallos >= this.#maxIntentos) {
      estado.bloqueadoHasta = ahora + this.#ventanaMs;
    }
    this.#intentos.set(clave, estado);
  }

  registrarExito(clave) {
    this.#intentos.delete(clave);
  }
}
