import { loadConfig } from '../src/config/env.js';
import { createPool } from '../src/shared/db/pool.js';
import { ahoraUtcMysql } from '../src/shared/time/utc.js';

const SEMILLA = [
  { clave: 'anticipacion_reprogramar', valor: '120', descripcion: 'Minutos mínimos de anticipación para reprogramar (RN-13, 2 h aprobadas)' },
  { clave: 'anticipacion_cancelar', valor: '120', descripcion: 'Minutos mínimos de anticipación para cancelar (RN-13, 2 h aprobadas)' },
];

function arg(nombre) {
  const idx = process.argv.indexOf(nombre);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const config = loadConfig();
const pool = createPool(config.db);

try {
  let usuarioId = Number(arg('--usuario-id') || 0);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    const [admins] = await pool.execute(
      `SELECT id FROM usuario WHERE rol = 'administrador' AND estado = 'activo' ORDER BY id LIMIT 1`,
    );
    if (admins.length === 0) {
      console.error('No existe un administrador activo. Cree uno con tools/create_demo_user.mjs o pase --usuario-id.');
      process.exit(1);
    }
    usuarioId = admins[0].id;
  }
  const ahora = ahoraUtcMysql();
  for (const fila of SEMILLA) {
    await pool.execute(
      `INSERT INTO parametro_operativo (clave, valor, descripcion, modificado_por, modificado_utc)
       VALUES (:clave, :valor, :descripcion, :usuario, :ahora)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), descripcion = VALUES(descripcion), modificado_por = VALUES(modificado_por), modificado_utc = VALUES(modificado_utc)`,
      { clave: fila.clave, valor: fila.valor, descripcion: fila.descripcion, usuario: usuarioId, ahora },
    );
    console.log(`Parametro ${fila.clave} = ${fila.valor} (modificado_por=${usuarioId}).`);
  }
  console.log('Listo. NOTA: anticipacion_reservar NO se siembra (RN-12: requiere aprobación del responsable).');
  process.exit(0);
} catch (err) {
  console.error('Error sembrando parámetros:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
