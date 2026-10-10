import test from 'node:test';
import assert from 'node:assert/strict';
import { transicionPermitida, esEstadoFinal, parseReservaBody, puedeModificarCita, ESTADOS } from '../../../src/modules/reservas/domain/cita.js';

test('máquina de estados RN-08: solo transiciones permitidas', () => {
  assert.equal(transicionPermitida('Confirmada', 'En atención'), true);
  assert.equal(transicionPermitida('Confirmada', 'Cancelada'), true);
  assert.equal(transicionPermitida('Confirmada', 'No asistida'), true);
  assert.equal(transicionPermitida('En atención', 'Atendida'), true);
  for (const desde of ESTADOS) {
    for (const hacia of ESTADOS) {
      if (desde === 'En atención' && hacia === 'Cancelada') assert.equal(transicionPermitida(desde, hacia), false);
    }
  }
  assert.equal(transicionPermitida('Atendida', 'Cancelada'), false);
  assert.equal(transicionPermitida('Cancelada', 'Confirmada'), false);
  assert.equal(transicionPermitida('No asistida', 'Atendida'), false);
  assert.equal(transicionPermitida('Confirmada', 'Atendida'), false);
  assert.equal(esEstadoFinal('Atendida'), true);
  assert.equal(esEstadoFinal('Cancelada'), true);
  assert.equal(esEstadoFinal('No asistida'), true);
  assert.equal(esEstadoFinal('Confirmada'), false);
  assert.equal(esEstadoFinal('En atención'), false);
});

test('parseReservaBody valida fecha, hora e identificadores', () => {
  const ok = parseReservaBody({ servicio_id: 1, profesional_id: 2, fecha: '2026-11-16', hora_inicio: '09:00' });
  assert.equal(ok.fecha, '2026-11-16');
  assert.throws(() => parseReservaBody({ servicio_id: 0, profesional_id: 2, fecha: '2026-11-16', hora_inicio: '09:00' }));
  assert.throws(() => parseReservaBody({ servicio_id: 1, profesional_id: 2, fecha: '16-11-2026', hora_inicio: '09:00' }));
  assert.throws(() => parseReservaBody({ servicio_id: 1, profesional_id: 2, fecha: '2026-11-16', hora_inicio: '25:00' }));
  assert.throws(() => parseReservaBody({ servicio_id: 1, profesional_id: 2, fecha: '2026-11-16', hora_inicio: '9am' }));
});

test('puedeModificarCita aplica propiedad por rol (RN-14); profesional compara por id de perfil, no de usuario', () => {
  const cita = { solicitante_id: 10, profesional_id: 20 };
  assert.equal(puedeModificarCita('solicitante', 10, cita), true);
  assert.equal(puedeModificarCita('solicitante', 11, cita), false);
  assert.equal(puedeModificarCita('profesional', 3, cita, 20), true, 'usuario 3 con perfil profesional 20');
  assert.equal(puedeModificarCita('profesional', 20, cita, null), false, 'sin perfil resuelto no hay autorización');
  assert.equal(puedeModificarCita('profesional', 3, cita, 21), false);
  assert.equal(puedeModificarCita('administrador', 999, cita), true);
  assert.equal(puedeModificarCita('desconocido', 10, cita), false);
});
