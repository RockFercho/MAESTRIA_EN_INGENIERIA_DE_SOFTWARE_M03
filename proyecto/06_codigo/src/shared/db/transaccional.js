import { AppError } from '../http/errors.js';

export function crearUowMysql(pool) {
  return async function ejecutarTransaccion({ lock } = {}, fn) {
    const conn = await pool.getConnection();
    let bloqueado = false;
    try {
      await conn.beginTransaction();
      if (lock) {
        const [filas] = await conn.query('SELECT GET_LOCK(?, 5) AS l', [lock]);
        if (Number(filas[0].l) !== 1) {
          throw new AppError('Operación en curso para este profesional; reintente', { status: 409, code: 'CONFLICTO_CONCURRENCIA' });
        }
        bloqueado = true;
      }
      const resultado = await fn(conn);
      await conn.commit();
      return resultado;
    } catch (err) {
      try { await conn.rollback(); } catch { /* noop */ }
      throw err;
    } finally {
      if (bloqueado) {
        try { await conn.query('SELECT RELEASE_LOCK(?)', [lock]); } catch { /* noop */ }
      }
      conn.release();
    }
  };
}

export function crearUowMemoria(repositorios) {
  const colas = new Map();
  return async function ejecutarTransaccion({ lock = 'global' } = {}, fn) {
    const anterior = colas.get(lock) ?? Promise.resolve();
    let liberar;
    const turno = new Promise((r) => { liberar = r; });
    colas.set(lock, anterior.then(() => turno));
    await anterior;
    try {
      return await fn(repositorios);
    } finally {
      liberar();
    }
  };
}
