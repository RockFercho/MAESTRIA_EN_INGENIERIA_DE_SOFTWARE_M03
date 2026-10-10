import { loadConfig } from '../src/config/env.js';
import { createPool } from '../src/shared/db/pool.js';
import { hashPassword, passwordSeguraValida } from '../src/shared/security/passwords.js';
import { ahoraUtcMysql } from '../src/shared/time/utc.js';

function arg(nombre) {
  const idx = process.argv.indexOf(nombre);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const correo = (arg('--correo') || process.env.DEMO_USER_CORREO || '').trim().toLowerCase();
const nombre = arg('--nombre') || process.env.DEMO_USER_NOMBRE || 'Usuario Demo';
const contrasena = arg('--contrasena') || process.env.DEMO_USER_PASSWORD || '';
const rol = arg('--rol') || 'administrador';

if (!correo || !correo.includes('@')) {
  console.error('Uso: node tools/create_demo_user.mjs --correo <correo> [--nombre "<nombre>"] [--contrasena <password>] [--rol administrador|solicitante|profesional]');
  console.error('La contraseña también puede pasarse por DEMO_USER_PASSWORD (nunca se imprime).');
  process.exit(1);
}
if (!passwordSeguraValida(contrasena)) {
  console.error("La contraseña debe tener entre 12 y 200 caracteres (RNF-029). No se imprime ni se codifica en el repo.");
  process.exit(1);
}
if (!['solicitante', 'profesional', 'administrador'].includes(rol)) {
  console.error("Rol inválido: use solicitante, profesional o administrador.");
  process.exit(1);
}

const config = loadConfig();
const pool = createPool(config.db);

try {
  const [existentes] = await pool.execute('SELECT id FROM usuario WHERE correo = :correo', { correo });
  if (existentes.length > 0) {
    console.log(`Usuario ya existente (id=${existentes[0].id}, correo=${correo}); nada que crear.`);
    process.exit(0);
  }
  const ahora = ahoraUtcMysql();
  const [resultado] = await pool.execute(
    `INSERT INTO usuario (nombre_completo, correo, hash_contrasena, rol, estado, creado_utc, actualizado_utc)
     VALUES (:nombre, :correo, :hash, :rol, 'activo', :ahora, :ahora)`,
    { nombre, correo, hash: hashPassword(contrasena), rol, ahora },
  );
  console.log(`Usuario creado (id=${resultado.insertId}, correo=${correo}, rol=${rol}).`);
  process.exit(0);
} catch (err) {
  console.error('Error creando usuario:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
