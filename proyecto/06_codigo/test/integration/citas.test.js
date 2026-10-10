import test from 'node:test';
import assert from 'node:assert/strict';
import { crearServidorEnMemoria, PASS_SOLI, PASS_PROFE, PASS_ADMIN, proximaFechaDia } from '../helpers/app-completa.js';

async function login(base, correo, contrasena) {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ correo, contrasena }),
  });
  const body = await res.json();
  return { status: res.status, token: body.token };
}

async function api(base, metodo, ruta, { token, body, headers = {} } = {}) {
  const res = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* sin cuerpo */ }
  return { status: res.status, body: json };
}

const LUNES = proximaFechaDia('lun');
const MARTES = proximaFechaDia('mar');

test('flujo completo CP-FULL-02..09: registro, reserva idempotente, disponibilidad, reprogramar, cancelar, estados, notificaciones y auditoría', async (t) => {
  const ctx = await crearServidorEnMemoria();
  t.after(() => ctx.cerrar());
  const { base, repos } = ctx;

  // --- registro público (RF-001) ---
  const reg = await api(base, 'POST', '/api/v1/auth/registro', {
    body: { nombre_completo: 'Nueva Sol', correo: 'nueva@citas.demo', contrasena: 'NuevaClaveDemo.26!' },
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.rol, 'solicitante');
  assert.equal(reg.body.hash_contrasena, undefined);
  const regDup = await api(base, 'POST', '/api/v1/auth/registro', {
    body: { nombre_completo: 'Otra', correo: 'nueva@citas.demo', contrasena: 'NuevaClaveDemo.26!' },
  });
  assert.equal(regDup.status, 409);
  const regRol = await api(base, 'POST', '/api/v1/auth/registro', {
    body: { nombre_completo: 'X', correo: 'x@citas.demo', contrasena: 'NuevaClaveDemo.26!', rol: 'administrador' },
  });
  assert.equal(regRol.status, 400);
  const regCorta = await api(base, 'POST', '/api/v1/auth/registro', {
    body: { nombre_completo: 'X', correo: 'x@citas.demo', contrasena: 'corta' },
  });
  assert.equal(regCorta.status, 400);

  // --- sesiones ---
  const soli = await login(base, 'soli@citas.demo', PASS_SOLI);
  const profe = await login(base, 'profe@citas.demo', PASS_PROFE);
  const admin = await login(base, 'admin@citas.demo', PASS_ADMIN);
  assert.equal(soli.status, 200);

  // --- disponibilidad (autenticada) (RF-009..011) ---
  const sinToken = await api(base, 'GET', `/api/v1/disponibilidad?profesional_id=1&servicio_id=1&fecha=${LUNES}`);
  assert.equal(sinToken.status, 401);
  const disp = await api(base, 'GET', `/api/v1/disponibilidad?profesional_id=1&servicio_id=1&fecha=${LUNES}`, { token: soli.token });
  assert.equal(disp.status, 200);
  assert.ok(disp.body.intervalos.includes('09:00'), 'debe incluir el inicio del horario');
  assert.ok(!disp.body.intervalos.includes('12:00'), 'no debe incluir slot que excede el horario');
  assert.equal(disp.body.duracion_efectiva_min, 30);

  // --- reserva idempotente (RF-012..015, RNF-012) ---
  const solicitud = { servicio_id: 1, profesional_id: 1, fecha: LUNES, hora_inicio: '09:00' };
  const clave = 'reserva-test-0001';
  const sinClave = await api(base, 'POST', '/api/v1/citas', { token: soli.token, body: solicitud });
  assert.equal(sinClave.status, 400, 'Idempotency-Key es obligatorio');
  const r1 = await api(base, 'POST', '/api/v1/citas', { token: soli.token, body: solicitud, headers: { 'idempotency-key': clave } });
  assert.equal(r1.status, 201);
  assert.equal(r1.body.replique, false);
  assert.equal(r1.body.cita.estado, 'Confirmada');
  assert.equal(r1.body.cita.solicitante_id, ctx.datos.solicitanteId);
  const r2 = await api(base, 'POST', '/api/v1/citas', { token: soli.token, body: solicitud, headers: { 'idempotency-key': clave } });
  assert.equal(r2.status, 200, 'reintento devuelve 200');
  assert.equal(r2.body.replique, true);
  assert.equal(r2.body.cita.id, r1.body.cita.id, 'misma cita en el replique (RNF-012)');
  const claveReusada = await api(base, 'POST', '/api/v1/citas', {
    token: soli.token, body: { ...solicitud, hora_inicio: '10:00' }, headers: { 'idempotency-key': clave },
  });
  assert.equal(claveReusada.status, 409);
  assert.equal(claveReusada.body.error.code, 'CONFLICTO_IDEMPOTENCIA');

  // --- ocupado (RF-014) ---
  const ocupado = await api(base, 'POST', '/api/v1/citas', {
    token: soli.token, body: { ...solicitud, hora_inicio: '09:00' }, headers: { 'idempotency-key': 'otra-clave-0001' },
  });
  assert.equal(ocupado.status, 409);
  assert.equal(ocupado.body.error.code, 'INTERVALO_OCUPADO');

  // --- fuera de horario (RF-014) ---
  const fueraHorario = await api(base, 'POST', '/api/v1/citas', {
    token: soli.token, body: { ...solicitud, hora_inicio: '07:00' }, headers: { 'idempotency-key': 'otra-clave-0002' },
  });
  assert.equal(fueraHorario.status, 409);
  assert.equal(fueraHorario.body.error.code, 'INTERVALO_NO_DISPONIBLE');

  // --- permisos reserva ---
  assert.equal((await api(base, 'POST', '/api/v1/citas', { token: profe.token, body: solicitud, headers: { 'idempotency-key': 'profe-clave-0001' } })).status, 403);
  assert.equal((await api(base, 'POST', '/api/v1/citas', { body: solicitud })).status, 401);

  // --- concurrencia (RNF-010, RN-09) ---
  const slotConcurrente = { ...solicitud, hora_inicio: '09:30' };
  const [c1, c2] = await Promise.all([
    api(base, 'POST', '/api/v1/citas', { token: soli.token, body: slotConcurrente, headers: { 'idempotency-key': 'conc-aaaa-0001' } }),
    api(base, 'POST', '/api/v1/citas', { token: soli.token, body: slotConcurrente, headers: { 'idempotency-key': 'conc-bbbb-0002' } }),
  ]);
  const estados = [c1.status, c2.status].sort();
  assert.deepEqual(estados, [201, 409], `esperaba 1 éxito y 1 conflicto, obtuve ${c1.status}/${c2.status}`);

  // --- consulta por roles (RF-016, RF-023) ---
  const mias = await api(base, 'GET', '/api/v1/citas/mias', { token: soli.token });
  assert.equal(mias.status, 200);
  assert.ok(mias.body.length >= 2);
  assert.ok(mias.body.every((c) => c.profesional_nombre === 'Profe Demo' && c.servicio_nombre === 'Consulta general'));
  assert.equal((await api(base, 'GET', '/api/v1/citas', { token: soli.token })).status, 403);
  const adminLista = await api(base, 'GET', '/api/v1/citas', { token: admin.token, query: undefined });
  assert.equal(adminLista.status, 200);
  const profeLista = await api(base, 'GET', '/api/v1/citas?estado=Confirmada', { token: profe.token });
  assert.equal(profeLista.status, 200);
  assert.ok(profeLista.body.length >= 1, 'el profesional debe ver sus citas (no lista vacía)');
  assert.ok(profeLista.body.every((c) => c.profesional_id === 1));

  // --- reprogramar (RF-017, RN-07) ---
  const citaId = r1.body.cita.id;
  const reprog = await api(base, 'PUT', `/api/v1/citas/${citaId}/reprogramar`, {
    token: soli.token,
    body: { fecha: LUNES, hora_inicio: '10:00' },
    headers: { 'idempotency-key': 'reprog-test-0001' },
  });
  assert.equal(reprog.status, 200);
  assert.equal(reprog.body.cita.estado, 'Confirmada', 'la reprogramación no cambia estado (RN-08)');
  assert.notEqual(reprog.body.cita.inicio_utc, r1.body.cita.inicio_utc, 'el horario cambió');
  const reprogClave = await api(base, 'PUT', `/api/v1/citas/${citaId}/reprogramar`, {
    token: soli.token,
    body: { fecha: LUNES, hora_inicio: '10:00' },
    headers: { 'idempotency-key': 'reprog-test-0001' },
  });
  assert.equal(reprogClave.status, 200);
  assert.equal(reprogClave.body.replique, true);
  const reprogClaveDistinta = await api(base, 'PUT', `/api/v1/citas/${citaId}/reprogramar`, {
    token: soli.token,
    body: { fecha: LUNES, hora_inicio: '10:30' },
    headers: { 'idempotency-key': 'reprog-test-0001' },
  });
  assert.equal(reprogClaveDistinta.status, 409, 'misma clave con cuerpo distinto → 409');
  assert.equal(reprogClaveDistinta.body.error.code, 'CONFLICTO_IDEMPOTENCIA');

  // --- estados (RF-020/021, RN-08) ---
  const invalida = await api(base, 'PUT', `/api/v1/citas/${citaId}/estado`, { token: profe.token, body: { estado: 'Atendida' } });
  assert.equal(invalida.status, 409, 'Confirmada → Atendida no permitida');
  assert.equal((await api(base, 'PUT', `/api/v1/citas/${citaId}/estado`, { token: soli.token, body: { estado: 'Cancelada' } })).status, 403);
  const enAtencion = await api(base, 'PUT', `/api/v1/citas/${citaId}/estado`, { token: profe.token, body: { estado: 'En atención' } });
  assert.equal(enAtencion.status, 200);
  const atendida = await api(base, 'PUT', `/api/v1/citas/${citaId}/estado`, { token: admin.token, body: { estado: 'Atendida' } });
  assert.equal(atendida.status, 200);
  const reabrir = await api(base, 'PUT', `/api/v1/citas/${citaId}/estado`, { token: admin.token, body: { estado: 'Cancelada' } });
  assert.equal(reabrir.status, 409, 'Atendida es estado final (RN-08)');

  // --- cancelar (RF-018) sobre otra cita ---
  const r3 = await api(base, 'POST', '/api/v1/citas', {
    token: soli.token, body: { ...solicitud, hora_inicio: '11:00' }, headers: { 'idempotency-key': 'cancel-test-0001' },
  });
  assert.equal(r3.status, 201);
  const cancel = await api(base, 'PUT', `/api/v1/citas/${r3.body.cita.id}/cancelar`, {
    token: soli.token, body: {}, headers: { 'idempotency-key': 'cancel-test-0002' },
  });
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.cita.estado, 'Cancelada');
  const reprogramarCancelada = await api(base, 'PUT', `/api/v1/citas/${r3.body.cita.id}/reprogramar`, {
    token: soli.token, body: { fecha: LUNES, hora_inicio: '11:30' }, headers: { 'idempotency-key': 'cancel-test-0003' },
  });
  assert.equal(reprogramarCancelada.status, 409, 'estados finales no se modifican (RF-019)');

  // --- historial (RF-022) ---
  const historialReprog = repos.historial.filas.filter((h) => h.cita_id === citaId && h.tipo_cambio === 'reprogramacion');
  assert.equal(historialReprog.length, 1);
  assert.ok(historialReprog[0].fecha_anterior_utc && historialReprog[0].fecha_nueva_utc);
  const historialEstados = repos.historial.filas.filter((h) => h.cita_id === citaId && h.tipo_cambio === 'cambio_estado');
  assert.ok(historialEstados.some((h) => h.estado_anterior === 'Confirmada' && h.estado_nuevo === 'En atención'));
  assert.ok(historialEstados.some((h) => h.estado_anterior === 'En atención' && h.estado_nuevo === 'Atendida'));

  // --- notificaciones (RF-024/028) ---
  const notis = await api(base, 'GET', '/api/v1/notificaciones/mias', { token: soli.token });
  assert.equal(notis.status, 200);
  const eventos = notis.body.map((n) => n.evento);
  assert.ok(eventos.includes('confirmada'));
  assert.ok(eventos.includes('reprogramada'));
  assert.ok(eventos.includes('cancelada'));
  const conf = notis.body.find((n) => n.evento === 'confirmada' && n.cita_id === citaId);
  assert.ok(conf.instantanea, 'instantanea parseada');
  assert.equal(conf.instantanea.estado, 'Confirmada');
  assert.equal(repos.outbox.filas.every((e) => e.estado === 'procesado'), true, 'outbox procesado');
  assert.equal(repos.notificaciones.filas.length, notis.body.length);

  // --- auditoría (RF-026) ---
  const aud = await api(base, 'GET', '/api/v1/auditoria', { token: admin.token });
  assert.equal(aud.status, 200);
  const tipos = aud.body.map((a) => a.tipo_operacion);
  assert.ok(tipos.includes('reserva'));
  assert.ok(tipos.includes('reprogramacion'));
  assert.ok(tipos.includes('cancelacion'));
  assert.ok(aud.body.every((a) => a.resultado === 'exito'));
  assert.equal((await api(base, 'GET', '/api/v1/auditoria', { token: soli.token })).status, 403);

  // --- parámetros (RF-025) ---
  const params = await api(base, 'GET', '/api/v1/parametros', { token: admin.token });
  assert.equal(params.status, 200);
  assert.equal(params.body.find((p) => p.clave === 'anticipacion_reprogramar').valor, '120');
  assert.equal((await api(base, 'GET', '/api/v1/parametros', { token: soli.token })).status, 403);
});

test('política de anticipación para reservar: sin parámetro aprobado no se aceptan reservas en línea (RF-025/RN-12)', async (t) => {
  const ctx = await crearServidorEnMemoria({ conAnticipacionReservar: false });
  t.after(() => ctx.cerrar());
  const soli = await login(ctx.base, 'soli@citas.demo', PASS_SOLI);
  const r = await api(ctx.base, 'POST', '/api/v1/citas', {
    token: soli.token,
    body: { servicio_id: 1, profesional_id: 1, fecha: LUNES, hora_inicio: '09:00' },
    headers: { 'idempotency-key': 'sin-politica-0001' },
  });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'POLITICA_NO_CONFIGURADA');
});

test('plazo de reprogramación/cancelación: solicitante fuera de plazo rechazado; administrador con justificación permitido (RN-13/14)', async (t) => {
  const relojFijo = () => new Date('2026-11-10T14:00:00.000Z');
  const ctx = await crearServidorEnMemoria({ reloj: relojFijo });
  t.after(() => ctx.cerrar());
  const soli = await login(ctx.base, 'soli@citas.demo', PASS_SOLI);
  const admin = await login(ctx.base, 'admin@citas.demo', PASS_ADMIN);

  const creada = await api(ctx.base, 'POST', '/api/v1/citas', {
    token: soli.token,
    body: { servicio_id: 1, profesional_id: 1, fecha: '2026-11-10', hora_inicio: '11:00' },
    headers: { 'idempotency-key': 'plazo-test-00001' },
  });
  assert.equal(creada.status, 201, `reserva dentro de anticipación de 60 min: ${JSON.stringify(creada.body)}`);
  const citaId = creada.body.cita.id;

  const solicitanteFueraPlazo = await api(ctx.base, 'PUT', `/api/v1/citas/${citaId}/reprogramar`, {
    token: soli.token,
    body: { fecha: '2026-11-11', hora_inicio: '09:00' },
    headers: { 'idempotency-key': 'plazo-test-00002' },
  });
  assert.equal(solicitanteFueraPlazo.status, 409);
  assert.equal(solicitanteFueraPlazo.body.error.code, 'FUERA_DE_PLAZO');

  const cancelarFueraPlazo = await api(ctx.base, 'PUT', `/api/v1/citas/${citaId}/cancelar`, {
    token: soli.token,
    body: {},
    headers: { 'idempotency-key': 'plazo-test-00003' },
  });
  assert.equal(cancelarFueraPlazo.status, 409);

  const adminSinJustificacion = await api(ctx.base, 'PUT', `/api/v1/citas/${citaId}/reprogramar`, {
    token: admin.token,
    body: { fecha: '2026-11-11', hora_inicio: '09:00' },
    headers: { 'idempotency-key': 'plazo-test-00004' },
  });
  assert.equal(adminSinJustificacion.status, 400);
  assert.equal(adminSinJustificacion.body.error.code, 'VALIDATION_ERROR');

  const adminJustificada = await api(ctx.base, 'PUT', `/api/v1/citas/${citaId}/reprogramar`, {
    token: admin.token,
    body: { fecha: '2026-11-11', hora_inicio: '09:00', justificacion: 'Reorganización institucional por mantenimiento' },
    headers: { 'idempotency-key': 'plazo-test-00005' },
  });
  assert.equal(adminJustificada.status, 200);
  assert.ok(adminJustificada.body.cita.inicio_utc.startsWith('2026-11-11'));

  const auditoria = ctx.repos.auditoria.filas.find((a) => a.cita_id === citaId && a.tipo_operacion === 'reprogramacion');
  assert.ok(auditoria);
});
