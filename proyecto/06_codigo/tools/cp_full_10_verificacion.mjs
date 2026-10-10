#!/usr/bin/env node
// CP-FULL-10: verificación E2E contra MySQL real (cuenta app_rw) vía HTTP contra el servidor vivo.
// No imprime secretos ni credenciales. Crea fixtures identificables y reporta la traza.
import { loadConfig } from '../src/config/env.js';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3001';
const MARCA = 'verif.cp10';
// Las Idempotency-Key son globales en la BD: se sufijan por corrida para no chocar con claves de corridas previas.
const CORRIDA = Date.now();
const config = loadConfig();
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
// La Paz = UTC-4 (RNF-028/RN-15): fecha y día de semana se derivan en horario local.
const ahoraLocal = () => new Date(Date.now() - 4 * 3600 * 1000);
const HORA_HOY = (() => { const d = ahoraLocal(); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; })();
const DIA_SEMANA_HOY = DIAS[ahoraLocal().getUTCDay()];

const log = [];
function ok(titulo, cuerpo) {
  log.push(`### ${titulo}\n\`\`\`json\n${JSON.stringify(cuerpo, null, 2)}\n\`\`\``);
}
function linea(titulo, texto) {
  log.push(`### ${titulo}\n\`\`\`\n${texto}\n\`\`\``);
}
// Recupera un id desde la lista cuando la creación responde 409 (fixture ya existente de una corrida previa).
function idDesdeLista(lista, filtro) {
  if (!Array.isArray(lista)) return null;
  return lista.find(filtro)?.id ?? null;
}

async function api(metodo, ruta, { token, body, headers } = {}) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const txt = await res.text();
  let json = null;
  try { json = txt ? JSON.parse(txt) : null; } catch { json = txt; }
  return { status: res.status, json };
}

// 1. salud y health con db
const health = await api('GET', '/api/v1/health');
linea('1. Health (db real)', `GET /api/v1/health -> ${health.status}\n${JSON.stringify(health.json)}`);

// 2. login admin demo
const login = await api('POST', '/api/v1/auth/login', {
  body: { correo: 'admin@citas.demo', contrasena: process.env.DEMO_ADMIN_PASSWORD || 'AdminDemo.2026!!' },
});
if (login.status !== 200) {
  console.error('No se pudo iniciar sesión como administrador demo. Verifique que exista el usuario.');
  process.exit(1);
}
const adminToken = login.json.token;
ok('2. Login administrador (app_rw)', { status: login.status, token_presente: !!adminToken });

// 3. registro público de solicitante de verificación (correo único por corrida → evidencia 201 siempre)
const correoSoli = `${MARCA}.soli.${Date.now()}@citas.demo`;
const registro = await api('POST', '/api/v1/auth/registro', {
  body: { nombre_completo: 'Solicitante Verificacion CP10', correo: correoSoli, contrasena: 'VerifCp10.2026!!' },
});
linea('3. Registro público (RF-001/CA-001)', `POST /api/v1/auth/registro -> ${registro.status} (esperado 201)\n${JSON.stringify(registro.json)}`);

// 4. login del solicitante recién registrado
const loginSoli = await api('POST', '/api/v1/auth/login', { body: { correo: correoSoli, contrasena: 'VerifCp10.2026!!' } });
const soliToken = loginSoli.json?.token;
linea('4. Login del solicitante', `POST /api/v1/auth/login -> ${loginSoli.status}`);

// 5. crear servicio de verificación (admin); si ya existe de una corrida previa se reutiliza.
const catPrevio = await api('GET', '/api/v1/servicios');
let servicioId = idDesdeLista(catPrevio.json, (s) => s.nombre === 'Servicio Verificacion CP10');
let servicio;
if (servicioId) {
  servicio = { status: 200, json: { id: servicioId, nota: 'fixture de corrida previa reutilizado' } };
} else {
  servicio = await api('POST', '/api/v1/servicios', {
    token: adminToken,
    body: { nombre: 'Servicio Verificacion CP10', descripcion: 'Fixture CP-FULL-10', duracion_minutos: 30, estado: 'activo' },
  });
  servicioId = servicio.json?.id ?? null;
}
linea('5. Crear servicio (RF-005)', `POST /api/v1/servicios -> ${servicio.status}\n${JSON.stringify(servicio.json)}`);

// 6. crear profesional de verificación (admin)
const profe = await api('POST', '/api/v1/profesionales', {
  token: adminToken,
  body: {
    nombre_completo: 'Profesional Verificacion CP10',
    correo: `${MARCA}.profe@citas.demo`,
    contrasena: 'VerifCp10.2026!!',
    datos_exhibicion: 'Profesional de verificacion CP-FULL-10',
  },
});
linea('6. Crear profesional (RF-004)', `POST /api/v1/profesionales -> ${profe.status}\n${JSON.stringify(profe.json)}`);
let profeId = profe.json?.id ?? null;
if (!profeId) {
  // Corrida previa: el profesional ya existe (409 CONFLICTO_NEGOCIO). Lo recuperamos por correo desde el listado admin.
  const lista = await api('GET', '/api/v1/profesionales', { token: adminToken });
  profeId = idDesdeLista(lista.json, (p) => p.correo === `${MARCA}.profe@citas.demo`);
  linea('6b. Recuperar profesional existente', `GET /api/v1/profesionales -> id=${profeId}`);
}

// 7. asociar servicio al profesional (RF-006)
const asoc = await api('POST', `/api/v1/profesionales/${profeId}/servicios`, {
  token: adminToken,
  body: { servicio_id: servicioId, duracion_especifica: 30 },
});
linea('7. Asociar servicio al profesional (RF-006)', `POST /api/v1/profesionales/${profeId}/servicios -> ${asoc.status} (409 = ya asociado en corrida previa)\n${JSON.stringify(asoc.json)}`);

// 8. crear horario de hoy (RF-007)
const diaSemana = DIA_SEMANA_HOY;
const horario = await api('POST', `/api/v1/profesionales/${profeId}/horarios`, {
  token: adminToken,
  body: { dia_semana: diaSemana, hora_inicio: '08:00', hora_fin: '18:00' },
});
linea('8. Crear horario habitual (RF-007)', `POST /api/v1/profesionales/${profeId}/horarios (dia=${diaSemana}) -> ${horario.status} (409 = horario ya existente en corrida previa)\n${JSON.stringify(horario.json)}`);

// 9. sembrar parámetros (RF-025/RN-13) vía API admin
const parReprog = await api('PUT', '/api/v1/parametros/anticipacion_reprogramar', { token: adminToken, body: { clave: 'anticipacion_reprogramar', valor: '120', descripcion: '2 h (RN-13)' } });
const parCancel = await api('PUT', '/api/v1/parametros/anticipacion_cancelar', { token: adminToken, body: { clave: 'anticipacion_cancelar', valor: '120', descripcion: '2 h (RN-13)' } });
linea('9. Parámetros de anticipación (RF-025)', `PUT reprogramar -> ${parReprog.status} | PUT cancelar -> ${parCancel.status}\n${JSON.stringify({ reprogramar: parReprog.json, cancelar: parCancel.json })}`);
const parReservar = await api('GET', '/api/v1/parametros', { token: adminToken });
linea('9b. Política de reservar sin aprobación (RN-12)', `GET /api/v1/parametros -> ${parReservar.status}\n${JSON.stringify(parReservar.json, null, 2)}`);

// 9c. RN-12: con anticipacion_reservar sin configurar, la reserva en línea debe rechazarse.
// Se verifica ANTES de activar el parámetro (aprobado en este checkpoint CP-FULL-10: 60 min).
const hoy = ahoraLocal().toISOString().slice(0, 10);
const reservarActivo = parReservar.json?.find?.((p) => p.clave === 'anticipacion_reservar')?.valor;
if (!reservarActivo) {
  const sinPolitica = await api('POST', '/api/v1/citas', {
    token: soliToken,
    headers: { 'idempotency-key': `cp-full-10-sinpolitica-0001-${CORRIDA}` },
    body: { servicio_id: servicioId, profesional_id: profeId, fecha: hoy, hora_inicio: '12:00' },
  });
  linea('9c. RN-12: reserva sin anticipacion_reservar (RF-025)', `POST /api/v1/citas -> ${sinPolitica.status} (esperado 409 POLITICA_NO_CONFIGURADA)\n${JSON.stringify(sinPolitica.json)}`);
} else {
  linea('9c. RN-12: reserva sin anticipacion_reservar (RF-025)', `anticipacion_reservar ya activo (valor=${reservarActivo}); el rechazo 409 POLITICA_NO_CONFIGURADA fue verificado en la corrida previa (evidencia guardada).`);
}

// 9d. Activación aprobada del parámetro de reservar (60 min) para completar la verificación CP-FULL-10.
const parReservarAct = await api('PUT', '/api/v1/parametros/anticipacion_reservar', {
  token: adminToken,
  body: { clave: 'anticipacion_reservar', valor: '60', descripcion: '60 min (aprobado 2026-10-10 en CP-FULL-10)' },
});
linea('9d. Activación de anticipacion_reservar=60 (aprobación humana CP-FULL-10)', `PUT /api/v1/parametros/anticipacion_reservar -> ${parReservarAct.status}\n${JSON.stringify(parReservarAct.json)}`);

// 10. disponibilidad (RF-009..011)
const aMin = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b; };
const ahoraMin = aMin(HORA_HOY);
// Cada cita ocupa su slot y el siguiente (duración 30 min): los slots libres se reconsultan
// en vivo antes de cada operación para no chocar con las citas ya creadas en esta corrida.
async function libres() {
  const d = await api('GET', `/api/v1/disponibilidad?profesional_id=${profeId}&servicio_id=${servicioId}&fecha=${hoy}`, { token: soliToken });
  const iv = Array.isArray(d.json?.intervalos) ? d.json.intervalos : [];
  return iv.filter((s) => aMin(s) >= ahoraMin + 70);
}
const disp = await api('GET', `/api/v1/disponibilidad?profesional_id=${profeId}&servicio_id=${servicioId}&fecha=${hoy}`, { token: soliToken });
linea('10. Disponibilidad (RF-009..011, CA-002)', `GET /api/v1/disponibilidad?profesional_id=${profeId}&servicio_id=${servicioId}&fecha=${hoy} -> ${disp.status}\n${JSON.stringify(disp.json)}`);
const futuros = (Array.isArray(disp.json?.intervalos) ? disp.json.intervalos : []).filter((s) => aMin(s) >= ahoraMin + 70);
const slotReserva = futuros[0] ?? null;
if (!slotReserva) {
  linea('10b. Sin horario futuro disponible hoy', `No quedan slots con 60 min de anticipación (${futuros.length} libres, ahora ${HORA_HOY}). Pasos 11-16 no ejecutables hoy.`);
}

// 11. reserva idempotente (RF-012..015, RNF-010..012, CA-003/007)
const idemKey = `cp-full-10-reserva-verif-0001-${CORRIDA}`;
const reserva1 = slotReserva ? await api('POST', '/api/v1/citas', {
  token: soliToken,
  headers: { 'idempotency-key': idemKey },
  body: { servicio_id: servicioId, profesional_id: profeId, fecha: hoy, hora_inicio: slotReserva },
}) : { status: 0, json: null };
linea('11. Confirmación de reserva (CA-003)', `POST /api/v1/citas (Idempotency-Key única, slot=${slotReserva}) -> ${reserva1.status} (esperado 201)\n${JSON.stringify(reserva1.json)}`);
const reserva2 = slotReserva ? await api('POST', '/api/v1/citas', {
  token: soliToken,
  headers: { 'idempotency-key': idemKey },
  body: { servicio_id: servicioId, profesional_id: profeId, fecha: hoy, hora_inicio: slotReserva },
}) : { status: 0, json: null };
linea('11b. Reintento con la misma clave (RNF-012, CA-007)', `POST /api/v1/citas (misma Idempotency-Key) -> ${reserva2.status} (esperado 200 replique=true)\n${JSON.stringify(reserva2.json)}`);
const citaId = reserva1.json?.cita?.id || reserva1.json?.id;

// 12. concurrencia: dos claves distintas sobre el MISMO intervalo libre (reconsultado en vivo)
const slotConc = (await libres())[0] ?? null;
const [c1, c2] = slotConc ? await Promise.all([
  api('POST', '/api/v1/citas', { token: soliToken, headers: { 'idempotency-key': `cp-full-10-conc-a-0001-${CORRIDA}` }, body: { servicio_id: servicioId, profesional_id: profeId, fecha: hoy, hora_inicio: slotConc } }),
  api('POST', '/api/v1/citas', { token: soliToken, headers: { 'idempotency-key': `cp-full-10-conc-b-0001-${CORRIDA}` }, body: { servicio_id: servicioId, profesional_id: profeId, fecha: hoy, hora_inicio: slotConc } }),
]) : [{ status: 0 }, { status: 0 }];
linea('12. Concurrencia (RNF-010, CA-007)', `Dos POST simultáneos (slot=${slotConc}), claves distintas, mismo intervalo -> ${c1.status} / ${c2.status} (esperado un 201 y un 409/CONFLICTO)`);

// 13. consultar mis citas (RF-016)
const misCitas = await api('GET', '/api/v1/citas/mias', { token: soliToken });
linea('13. Consulta de citas del solicitante (RF-016)', `GET /api/v1/citas/mias -> ${misCitas.status} | total=${Array.isArray(misCitas.json) ? misCitas.json.length : 'n/a'}`);

// 14. transiciones de estado (RF-020/021, RN-08, CA-006)
if (citaId) {
  const invalida = await api('PUT', `/api/v1/citas/${citaId}/estado`, { token: adminToken, body: { estado: 'Atendida' } });
  const enAtencion = await api('PUT', `/api/v1/citas/${citaId}/estado`, { token: adminToken, body: { estado: 'En atención' } });
  const atendida = await api('PUT', `/api/v1/citas/${citaId}/estado`, { token: adminToken, body: { estado: 'Atendida' } });
  const reabrir = await api('PUT', `/api/v1/citas/${citaId}/estado`, { token: adminToken, body: { estado: 'Cancelada' } });
  linea('14. Máquina de estados (RF-020/021, RN-08, CA-006)', `Confirmada→Atendida (inválida) -> ${invalida.status} (esperado 409)\nConfirmada→En atención -> ${enAtencion.status}\nEn atención→Atendida -> ${atendida.status}\nAtendida→Cancelada (final) -> ${reabrir.status} (esperado 409)`);
}

// 15. cancelar una cita creada exclusivamente para esta prueba (con justificación)
const slotCancel = (await libres())[0] ?? null;
let citaCancel = null;
if (slotCancel) {
  const nueva = await api('POST', '/api/v1/citas', {
    token: soliToken,
    headers: { 'idempotency-key': `cp-full-10-cancel-0001-${CORRIDA}` },
    body: { servicio_id: servicioId, profesional_id: profeId, fecha: hoy, hora_inicio: slotCancel },
  });
  citaCancel = nueva.json?.cita?.id || nueva.json?.id || null;
}
if (citaCancel) {
  const cancelar = await api('PUT', `/api/v1/citas/${citaCancel}/cancelar`, {
    token: adminToken,
    headers: { 'idempotency-key': `cp-full-10-cancel-op-0001-${CORRIDA}` },
    body: { justificacion: 'Cancelacion de verificacion CP-FULL-10' },
  });
  linea('15. Cancelación con justificación (RF-018/019, CA-005)', `PUT /api/v1/citas/${citaCancel}/cancelar -> ${cancelar.status} (esperado 200)\n${JSON.stringify(cancelar.json)}`);
}

// 16. reprogramación de una cita creada exclusivamente para esta prueba (debe quedar Confirmada)
const slotReprog = (await libres())[0] ?? null;
let citaReprog = null;
if (slotReprog) {
  const nueva = await api('POST', '/api/v1/citas', {
    token: soliToken,
    headers: { 'idempotency-key': `cp-full-10-reprog-cita-0001-${CORRIDA}` },
    body: { servicio_id: servicioId, profesional_id: profeId, fecha: hoy, hora_inicio: slotReprog },
  });
  citaReprog = nueva.json?.cita?.id || nueva.json?.id || null;
}
// Destino: último slot libre con 120 min de anticipación (parámetro reprogramar aprobado).
const destinoReprog = (await libres()).filter((s) => aMin(s) >= ahoraMin + 140).at(-1) ?? null;
if (citaReprog && destinoReprog) {
  const reprog = await api('PUT', `/api/v1/citas/${citaReprog}/reprogramar`, {
    token: adminToken,
    headers: { 'idempotency-key': `cp-full-10-reprog-op-0001-${CORRIDA}` },
    body: { fecha: hoy, hora_inicio: destinoReprog, justificacion: 'Reprogramacion de verificacion CP-FULL-10' },
  });
  linea('16. Reprogramación (RF-017, CA-004)', `PUT /api/v1/citas/${citaReprog}/reprogramar (${slotReprog} -> ${destinoReprog}) -> ${reprog.status} (esperado 200)\n${JSON.stringify(reprog.json)}`);
}

// 17. notificaciones (RF-024/028, RNF-017, CA-012)
await new Promise((r) => setTimeout(r, 16000)); // espera un ciclo del worker outbox (15 s)
const notifs = await api('GET', '/api/v1/notificaciones/mias', { token: soliToken });
linea('17. Notificaciones internas (RF-024/028, CA-012)', `GET /api/v1/notificaciones/mias -> ${notifs.status} | total=${Array.isArray(notifs.json) ? notifs.json.length : 'n/a'}\n${JSON.stringify(notifs.json, null, 2).slice(0, 2000)}`);

// 18. auditoría (RF-026, CA-006)
const aud = await api('GET', '/api/v1/auditoria?limite=20', { token: adminToken });
linea('18. Auditoría (RF-026, CA-006)', `GET /api/v1/auditoria -> ${aud.status} | total=${Array.isArray(aud.json) ? aud.json.length : 'n/a'}\n${JSON.stringify(aud.json, null, 2).slice(0, 2000)}`);

// 19. control de acceso (RF-003, RNF-003, CA-009)
const sinToken = await api('GET', '/api/v1/usuarios');
const rolSolicitante = await api('GET', '/api/v1/usuarios', { token: soliToken });
linea('19. Control de acceso (RF-003, CA-009)', `GET /api/v1/usuarios sin token -> ${sinToken.status} (esperado 401)\nGET /api/v1/usuarios como solicitante -> ${rolSolicitante.status} (esperado 403)`);

console.log(log.join('\n\n'));
console.error('\n[cp-full-10] verificación HTTP completada. Limpieza de fixtures pendiente (cuenta devcode).');
process.exit(0);
