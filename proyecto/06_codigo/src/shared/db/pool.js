import mysql from 'mysql2/promise';

export function createPool(dbConfig) {
  return mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password || undefined,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 5,
    timezone: dbConfig.timezone,
    namedPlaceholders: true,
  });
}

export async function ping(pool) {
  await pool.query('SELECT 1');
}
