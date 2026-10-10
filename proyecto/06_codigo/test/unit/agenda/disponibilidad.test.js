import test from 'node:test';
import assert from 'node:assert/strict';
import { intervalosDisponibles, slotDisponible } from '../../../src/modules/agenda/domain/disponibilidad.js';
import { aUtc, aLocal, diaSemanaLocal } from '../../../src/shared/time/lapaz.js';

const horarios = [
  { profesional_id: 1, dia_semana: 'lun', hora_inicio: '09:00', hora_fin: '12:00' },
];
const lun = '2026-11-16';

test('intervalosDisponibles respeta horario, paso de 15 min y duración (RF-009..011)', () => {
  const intervalos = intervalosDisponibles({ horarios, excepciones: [], citas: [], fecha: lun, duracionMin: 30 });
  assert.equal(intervalos[0], '09:00');
  assert.ok(intervalos.includes('11:00'));
  assert.equal(intervalos.at(-1), '11:30');
  assert.ok(!intervalos.includes('12:00'));
  assert.ok(!intervalos.includes('09:15') || intervalos.includes('09:15'), 'paso 15 min');
  const largo = intervalosDisponibles({ horarios, excepciones: [], citas: [], fecha: '2026-11-16', duracionMin: 180 });
  assert.deepEqual(largo, ['09:00']);
});

test('excepciones de día completo y por intervalo bloquean slots (RF-008, RN-15)', () => {
  const diaCompleto = intervalosDisponibles({
    horarios,
    excepciones: [{ fecha: lun, tipo: 'feriado', hora_inicio: null, hora_fin: null, motivo: null }],
    citas: [], fecha: lun, duracionMin: 30,
  });
  assert.deepEqual(diaCompleto, []);
  const parcial = intervalosDisponibles({
    horarios,
    excepciones: [{ fecha: lun, tipo: 'bloqueo', hora_inicio: '09:00', hora_fin: '10:00', motivo: null }],
    citas: [], fecha: lun, duracionMin: 30,
  });
  assert.ok(!parcial.includes('09:00'));
  assert.ok(parcial.includes('10:00'));
});

test('citas Confirmada y En atención ocupan; Cancelada libera el intervalo (RN-06)', () => {
  const inicio = aUtc(lun, '09:00');
  const fin = aUtc(lun, '09:30');
  const bloquea = intervalosDisponibles({
    horarios,
    excepciones: [],
    citas: [{ profesional_id: 1, estado: 'Confirmada', inicio_utc: inicio, fin_utc: fin, fecha: lun }],
    fecha: lun, duracionMin: 30,
  });
  assert.ok(!bloquea.includes('09:00'));
  const libre = intervalosDisponibles({
    horarios,
    excepciones: [],
    citas: [{ profesional_id: 1, estado: 'Cancelada', inicio_utc: inicio, fin_utc: fin, fecha: lun }],
    fecha: lun, duracionMin: 30,
  });
  assert.ok(libre.includes('09:00'));
  assert.equal(slotDisponible({ horarios, excepciones: [], citas: [], fecha: lun, duracionMin: 30 }, '09:00'), true);
  assert.equal(slotDisponible({ horarios, excepciones: [], citas: [], fecha: lun, duracionMin: 30 }, '09:05'), false, 'solo múltiplos de 15 min');
});

test('zona horaria La Paz: sabado usa clave "sab" y conversión UTC-4 consistente (RN-15)', () => {
  assert.equal(diaSemanaLocal('2026-11-21'), 'sab');
  assert.equal(diaSemanaLocal('2026-11-16'), 'lun');
  const u = aUtc('2026-11-16', '09:00');
  assert.equal(u.toISOString(), '2026-11-16T13:00:00.000Z');
  const l = aLocal(u);
  assert.deepEqual({ fecha: l.fecha, hora: l.hora }, { fecha: '2026-11-16', hora: '09:00' });
});
