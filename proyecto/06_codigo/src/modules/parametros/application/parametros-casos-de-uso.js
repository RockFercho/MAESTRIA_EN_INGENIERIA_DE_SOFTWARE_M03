import { CLAVES_CONOCIDAS } from '../domain/parametro.js';

export { CLAVES_CONOCIDAS };
export const MINUTOS_REPROGRAMAR_CANCELAR_APROBADOS = 120;

export async function valorMinutosParametro(parametros, clave, predeterminado = null) {
  const p = await parametros.findByClave(clave);
  if (!p) return predeterminado;
  const n = Number(p.valor);
  return Number.isInteger(n) && n >= 0 ? n : predeterminado;
}

export function crearCasosParametros({ ejecutarTransaccion, reloj = () => new Date() }) {
  return {
    listarParametros: () => ejecutarTransaccion({}, async (r) => {
      const filas = await r.parametros.findAll();
      const porClave = new Map(filas.map((f) => [f.clave, f]));
      return CLAVES_CONOCIDAS.map((clave) => ({
        clave,
        valor: porClave.get(clave)?.valor ?? null,
        descripcion: porClave.get(clave)?.descripcion ?? null,
        configurado: porClave.has(clave),
      }));
    }),

    configurarParametro: ({ clave, datos, usuarioId }) => ejecutarTransaccion({}, (r) => r.parametros.upsert({
      clave: clave ?? datos.clave,
      valor: datos.valor,
      descripcion: datos.descripcion,
      modificadoPor: usuarioId,
      modificadoUtc: (() => { const iso = reloj().toISOString(); return `${iso.slice(0, 19).replace('T', ' ')}${iso.slice(19, 23)}`; })(),
    })),
  };
}
