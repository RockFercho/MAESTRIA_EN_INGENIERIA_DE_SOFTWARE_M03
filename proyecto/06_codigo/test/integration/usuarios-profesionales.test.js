import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearServidorEnMemoria, PASS_ADMIN } from '../helpers/app-completa.js';

async function api(base, method, path, { token, body, headers } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const txt = await r.text();
  let json = null;
  try { json = txt ? JSON.parse(txt) : null; } catch { json = { _raw: txt }; }
  return { status: r.status, body: json };
}

test('CRUD de usuarios y profesionales por administrador (RF-004/RF-005) con control de acceso 401/403', async () => {
  const ctx = await crearServidorEnMemoria();
  const { base } = ctx;
  try {
    // --- 401 sin token en todos los endpoints protegidos ---
    for (const [method, path] of [
      ['GET', '/api/v1/usuarios'],
      ['POST', '/api/v1/usuarios'],
      ['GET', '/api/v1/profesionales'],
      ['POST', '/api/v1/profesionales'],
    ]) {
      const r = await api(base, method, path, method === 'POST' ? { body: {} } : {});
      assert.equal(r.status, 401, `${method} ${path} sin token debe dar 401`);
    }

    // --- login admin ---
    const login = await api(base, 'POST', '/api/v1/auth/login', {
      body: { correo: 'admin@citas.demo', contrasena: PASS_ADMIN },
    });
    assert.equal(login.status, 200, 'login admin');
    const token = login.body.token;
    const H = { token };

    // --- 403 para rol no autorizado (solicitante) sobre rutas de administración ---
    const loginSoli = await api(base, 'POST', '/api/v1/auth/login', {
      body: { correo: 'soli@citas.demo', contrasena: 'SolicitanteDemo.26!' },
    });
    assert.equal(loginSoli.status, 200, 'login solicitante');
    const soliH = { token: loginSoli.body.token };
    for (const [method, path] of [
      ['GET', '/api/v1/usuarios'],
      ['POST', '/api/v1/usuarios'],
      ['GET', '/api/v1/profesionales'],
      ['POST', '/api/v1/profesionales'],
    ]) {
      const r = await api(base, method, path, method === 'POST' ? { ...soliH, body: {} } : soliH);
      assert.equal(r.status, 403, `${method} ${path} con rol solicitante debe dar 403`);
    }

    // --- GET lista de usuarios: incluye los demo, sin hash de contraseña ---
    const lista = await api(base, 'GET', '/api/v1/usuarios', H);
    assert.equal(lista.status, 200, 'listar usuarios');
    assert.ok(Array.isArray(lista.body) && lista.body.length >= 3);
    for (const u of lista.body) {
      assert.ok(!('hash_contrasena' in u), 'nunca exponer hash_contrasena');
      assert.ok(!('contrasena' in u), 'nunca exponer contraseña');
      assert.ok('nombre_completo' in u && 'correo' in u && 'rol' in u);
    }

    // --- POST crear usuario solicitante ---
    const creado = await api(base, 'POST', '/api/v1/usuarios', {
      ...H,
      body: { nombre_completo: 'Nuevo Solicitante', correo: 'nuevo.soli@citas.demo', contrasena: 'NuevaClave.2026!!', rol: 'solicitante' },
    });
    assert.equal(creado.status, 201, 'crear usuario 201');
    assert.equal(creado.body.rol, 'solicitante');
    assert.equal(creado.body.correo, 'nuevo.soli@citas.demo');
    assert.ok(!('hash_contrasena' in creado.body));

    // --- 409 por correo duplicado ---
    const dup = await api(base, 'POST', '/api/v1/usuarios', {
      ...H,
      body: { nombre_completo: 'Duplicado', correo: 'nuevo.soli@citas.demo', contrasena: 'OtraClave.2026!!', rol: 'solicitante' },
    });
    assert.equal(dup.status, 409, 'correo duplicado 409');

    // --- 400 por rol inválido ---
    const rolMalo = await api(base, 'POST', '/api/v1/usuarios', {
      ...H,
      body: { nombre_completo: 'Rol Malo', correo: 'rol.malo@citas.demo', contrasena: 'ClaveValida.2026!!', rol: 'superadmin' },
    });
    assert.equal(rolMalo.status, 400, 'rol inválido 400');

    // --- GET usuario por id ---
    const obtenido = await api(base, 'GET', `/api/v1/usuarios/${creado.body.id}`, H);
    assert.equal(obtenido.status, 200, 'obtener usuario por id');
    assert.equal(obtenido.body.correo, 'nuevo.soli@citas.demo');

    // --- PUT actualizar nombre ---
    const actualizado = await api(base, 'PUT', `/api/v1/usuarios/${creado.body.id}`, {
      ...H,
      body: { nombre_completo: 'Solicitante Renombrado' },
    });
    assert.equal(actualizado.status, 200, 'actualizar usuario 200');
    assert.equal(actualizado.body.nombre_completo, 'Solicitante Renombrado');

    // --- POST crear profesional ---
    const profeCreado = await api(base, 'POST', '/api/v1/profesionales', {
      ...H,
      body: { nombre_completo: 'Dra. Integracion', correo: 'dra.integra@citas.demo', contrasena: 'ProfeIntegra.26!', datos_exhibicion: 'Dra. Integracion — Pediatría' },
    });
    assert.equal(profeCreado.status, 201, 'crear profesional 201');
    assert.equal(profeCreado.body.nombre_completo, 'Dra. Integracion');
    assert.ok(Number.isInteger(profeCreado.body.id), 'retorna id de perfil profesional');
    const profeId = profeCreado.body.id;

    // el profesional debe poder iniciar sesión (cuenta creada con rol profesional)
    const loginProfe = await api(base, 'POST', '/api/v1/auth/login', {
      body: { correo: 'dra.integra@citas.demo', contrasena: 'ProfeIntegra.26!' },
    });
    assert.equal(loginProfe.status, 200, 'el profesional creado puede iniciar sesión');

    // --- 409 profesional con correo duplicado ---
    const profeDup = await api(base, 'POST', '/api/v1/profesionales', {
      ...H,
      body: { nombre_completo: 'Otra', correo: 'dra.integra@citas.demo', contrasena: 'OtraClave.26!!!!' },
    });
    assert.equal(profeDup.status, 409, 'correo profesional duplicado 409');

    // --- GET lista de profesionales incluye al nuevo ---
    const listaProfe = await api(base, 'GET', '/api/v1/profesionales', H);
    assert.equal(listaProfe.status, 200, 'listar profesionales');
    assert.ok(listaProfe.body.some((p) => p.id === profeId && p.nombre_completo === 'Dra. Integracion'));

    // --- asociar profesional al servicio existente (id 1) ---
    const asociada = await api(base, 'POST', `/api/v1/profesionales/${profeId}/servicios`, {
      ...H,
      body: { servicio_id: 1 },
    });
    assert.equal(asociada.status, 201, 'asociar servicio 201');
    assert.equal(asociada.body.profesional_id, profeId);
    assert.equal(asociada.body.servicio_id, 1);

    // --- 409 asociación duplicada ---
    const asocDup = await api(base, 'POST', `/api/v1/profesionales/${profeId}/servicios`, {
      ...H,
      body: { servicio_id: 1 },
    });
    assert.equal(asocDup.status, 409, 'asociación duplicada 409');

    // --- PUT actualizar profesional (datos de exhibición) ---
    const profeAct = await api(base, 'PUT', `/api/v1/profesionales/${profeId}`, {
      ...H,
      body: { datos_exhibicion: 'Dra. Integracion — Pediatría y neonatología' },
    });
    assert.equal(profeAct.status, 200, 'actualizar profesional 200');
    assert.equal(profeAct.body.datos_exhibicion, 'Dra. Integracion — Pediatría y neonatología');

    // --- 404 id inexistente ---
    const noExiste = await api(base, 'GET', '/api/v1/usuarios/999999', H);
    assert.equal(noExiste.status, 404, 'usuario inexistente 404');
    const profeNoExiste = await api(base, 'GET', '/api/v1/profesionales/999999', H);
    assert.equal(profeNoExiste.status, 404, 'profesional inexistente 404');
  } finally {
    await ctx.cerrar();
  }
});
