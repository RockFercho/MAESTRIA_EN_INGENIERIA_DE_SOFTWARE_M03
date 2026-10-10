import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, passwordSeguraValida } from '../../../src/shared/security/passwords.js';
import { ahoraUtcMysql } from '../../../src/shared/time/utc.js';

test('hashPassword genera formato scrypt con sal (sin texto plano)', () => {
  const h = hashPassword('Frase larga de prueba 2026');
  assert.match(h, /^scrypt\$16384\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(!h.includes('Frase'));
  const h2 = hashPassword('Frase larga de prueba 2026');
  assert.notEqual(h, h2, 'la sal debe diferir entre hashes');
});

test('verifyPassword valida la contraseña correcta y rechaza la incorrecta', () => {
  const h = hashPassword('Otra frase larga!! 123');
  assert.equal(verifyPassword('Otra frase larga!! 123', h), true);
  assert.equal(verifyPassword('otra frase larga!! 123', h), false);
  assert.equal(verifyPassword('', h), false);
  assert.equal(verifyPassword('x', 'hash-corrupto'), false);
  assert.equal(verifyPassword('x', null), false);
});

test('passwordSeguraValida exige 12–200 caracteres (RNF-029)', () => {
  assert.equal(passwordSeguraValida('corta'), false);
  assert.equal(passwordSeguraValida('123456789012'), true);
  assert.equal(passwordSeguraValida('x'.repeat(201)), false);
  assert.equal(passwordSeguraValida(null), false);
});

test('ahoraUtcMysql produce marca UTC con milisegundos', () => {
  const marca = ahoraUtcMysql(new Date('2026-10-09T15:30:45.123Z'));
  assert.equal(marca, '2026-10-09 15:30:45.123');
});
