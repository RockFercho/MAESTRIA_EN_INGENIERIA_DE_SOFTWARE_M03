import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLoginBody } from '../../../src/modules/identidad/domain/usuario.js';
import { SesionStoreEnMemoria, LoginRateLimiterEnMemoria } from '../../../src/modules/identidad/adapters/security/sesiones-y-limite.js';
import { ValidationError } from '../../../src/shared/http/errors.js';

test('parseLoginBody normaliza correo y valida campos', () => {
  assert.deepEqual(parseLoginBody({ correo: ' Admin@Demo.Org ', contrasena: 'secreta-larga-1' }), {
    correo: 'admin@demo.org',
    contrasena: 'secreta-larga-1',
  });
  for (const cuerpo of [null, [], {}, { correo: 'x', contrasena: 'y' }, { correo: 'a@b.c' }, { correo: 'a@b.c', contrasena: 5 }]) {
    assert.throws(() => parseLoginBody(cuerpo), ValidationError);
  }
});

test('SesionStoreEnMemoria crea, obtiene, expira y revoca', () => {
  const store = new SesionStoreEnMemoria({ ttlMinutos: 60 });
  const token = store.crear({ usuarioId: 1, nombre_completo: 'A', correo: 'a@b.c', rol: 'administrador' });
  assert.equal(store.obtener(token).usuarioId, 1);
  store.revocar(token);
  assert.equal(store.obtener(token), null);
});

test('SesionStoreEnMemoria expira la sesión tras el TTL', async () => {
  const store = new SesionStoreEnMemoria({ ttlMinutos: 0.0001 });
  const token = store.crear({ usuarioId: 1, nombre_completo: 'A', correo: 'a@b.c', rol: 'solicitante' });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(store.obtener(token), null);
});

test('LoginRateLimiterEnMemoria bloquea tras el máximo de fallos y limpia con el éxito', () => {
  const limiter = new LoginRateLimiterEnMemoria({ maxIntentos: 2, ventanaMinutos: 15 });
  assert.equal(limiter.intentar('u@x.y').permitido, true);
  limiter.registrarFallo('u@x.y');
  assert.equal(limiter.intentar('u@x.y').permitido, true);
  limiter.registrarFallo('u@x.y');
  assert.equal(limiter.intentar('u@x.y').permitido, false);
  assert.equal(limiter.intentar('otro@x.y').permitido, true, 'el límite es por correo');
  limiter.registrarExito('u@x.y');
  assert.equal(limiter.intentar('u@x.y').permitido, true);
});
