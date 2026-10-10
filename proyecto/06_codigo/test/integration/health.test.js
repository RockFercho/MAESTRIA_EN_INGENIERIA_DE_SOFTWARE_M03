import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../../src/app.js';

const config = { version: 'test' };

function startApp(pingDb) {
  const app = createApp({ config, pingDb });
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

test('GET /api/v1/health responde 200 con db=ok cuando el ping funciona', async () => {
  const { server, base } = await startApp(async () => {});
  try {
    const res = await fetch(`${base}/api/v1/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.checks.db, 'ok');
    assert.equal(body.version, 'test');
  } finally {
    server.close();
  }
});

test('GET /api/v1/health responde 503 con db=error cuando el ping falla', async () => {
  const { server, base } = await startApp(async () => {
    throw new Error('db caida');
  });
  try {
    const res = await fetch(`${base}/api/v1/health`);
    const body = await res.json();
    assert.equal(res.status, 503);
    assert.equal(body.status, 'error');
    assert.equal(body.checks.db, 'error');
    assert.equal(body.error, undefined);
  } finally {
    server.close();
  }
});

test('ruta desconocida responde 404 con error normalizado', async () => {
  const { server, base } = await startApp(async () => {});
  try {
    const res = await fetch(`${base}/api/v1/inexistente`);
    const body = await res.json();
    assert.equal(res.status, 404);
    assert.equal(body.error.code, 'NOT_FOUND');
  } finally {
    server.close();
  }
});
