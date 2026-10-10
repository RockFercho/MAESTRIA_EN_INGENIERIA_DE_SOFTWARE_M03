import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '../../../..');
dotenv.config({ path: path.join(rootDir, '.env') });

const pkg = JSON.parse(readFileSync(path.join(rootDir, 'proyecto/06_codigo/package.json'), 'utf8'));

export function loadConfig() {
  const password = process.env.DB_PASSWORD_APP_RW || null;
  if (!password) {
    console.warn('[config] Falta DB_PASSWORD_APP_RW en .env: /health reportara db=error (cuenta app_rw requerida; sin fallback a devcode)');
  }
  return {
    version: pkg.version,
    port: Number(process.env.PORT || 3001),
    sesion: {
      ttlMinutos: Number(process.env.SESSION_TTL_MINUTES || 480),
    },
    login: {
      maxIntentos: Number(process.env.LOGIN_MAX_INTENTOS || 5),
      ventanaMinutos: Number(process.env.LOGIN_VENTANA_MINUTOS || 15),
    },
    db: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || 'gestion_citas_db',
      user: process.env.APP_RW_USER || 'app_rw',
      password,
      timezone: process.env.DB_TIMEZONE || '+00:00',
    },
  };
}
