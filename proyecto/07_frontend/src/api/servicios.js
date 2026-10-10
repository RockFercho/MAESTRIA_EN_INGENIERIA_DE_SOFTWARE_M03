// Cliente del endpoint GET /api/v1/servicios (contrato CP-API-01).
// La URL base es configurable mediante la variable de entorno VITE_API_BASE_URL.

const BASE = ((import.meta.env?.VITE_API_BASE_URL) || '/api/v1').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0 } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function normalizarServicios(datos) {
  if (!Array.isArray(datos)) {
    throw new ApiError('Respuesta inesperada del servidor: se esperaba una lista de servicios.');
  }
  return datos
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      id: s.id,
      nombre: String(s.nombre ?? '').trim(),
      descripcion: s.descripcion == null ? '' : String(s.descripcion).trim(),
      duracion_minutos: Number.isFinite(Number(s.duracion_minutos)) ? Number(s.duracion_minutos) : null,
      estado: s.estado ?? 'activo',
    }));
}

export async function obtenerServicios({ signal, fetchImpl = fetch } = {}) {
  let respuesta;
  try {
    respuesta = await fetchImpl(`${BASE}/servicios?estado=activo`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('No se pudo conectar con el servidor. Compruebe la disponibilidad de la API.', { status: 0 });
  }

  if (!respuesta.ok) {
    throw new ApiError(`El servidor respondió con estado ${respuesta.status}.`, { status: respuesta.status });
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ApiError('El servidor devolvió una respuesta no válida.');
  }

  return normalizarServicios(datos);
}
