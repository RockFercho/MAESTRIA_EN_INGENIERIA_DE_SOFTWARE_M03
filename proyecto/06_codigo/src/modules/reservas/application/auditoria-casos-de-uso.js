export function crearConsultarAuditoria({ ejecutarTransaccion }) {
  return async function consultarAuditoria({ tipo = null, citaId = null, limite = 100 }) {
    const n = Number(limite);
    const limitado = Number.isInteger(n) && n > 0 && n <= 500 ? n : 100;
    return ejecutarTransaccion({}, (r) => r.auditoria.findAll({ tipo, citaId, limite: limitado }));
  };
}
