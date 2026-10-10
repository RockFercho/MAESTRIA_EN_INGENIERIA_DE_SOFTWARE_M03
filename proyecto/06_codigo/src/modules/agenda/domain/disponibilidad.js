import { minutosDesdeMedianoche, hhmmDesdeMinutos, diaSemanaLocal, aUtc, aLocal } from '../../../shared/time/lapaz.js';

const PASO_MIN = 15;
const ESTADOS_QUE_OCUPAN = ['Confirmada', 'En atención'];

function solapa(aInicio, aFin, bInicio, bFin) {
  return aInicio < bFin && bInicio < aFin;
}

function excepcionAfecta(excepcion, fecha, inicioMin, finMin) {
  if (excepcion.fecha !== fecha) return false;
  if (excepcion.hora_inicio === null) return true;
  return solapa(inicioMin, finMin, minutosDesdeMedianoche(excepcion.hora_inicio), minutosDesdeMedianoche(excepcion.hora_fin));
}

export function intervalosDisponibles({ horarios, excepciones, citas, fecha, duracionMin }) {
  const dia = diaSemanaLocal(fecha);
  const dur = Number(duracionMin);
  const candidatos = [];
  for (const h of horarios) {
    if (h.dia_semana !== dia) continue;
    const inicio = minutosDesdeMedianoche(h.hora_inicio);
    const fin = minutosDesdeMedianoche(h.hora_fin);
    for (let s = inicio; s + dur <= fin; s += PASO_MIN) candidatos.push(s);
  }
  const citasLocales = citas
    .filter((c) => ESTADOS_QUE_OCUPAN.includes(c.estado))
    .map((c) => ({ ini: aLocal(new Date(c.inicio_utc)), fin: aLocal(new Date(c.fin_utc)) }));
  return candidatos.filter((iniMin) => {
    const finMin = iniMin + dur;
    if (excepciones.some((e) => excepcionAfecta(e, fecha, iniMin, finMin))) return false;
    return !citasLocales.some((c) => {
      const cIni = minutosDesdeMedianoche(c.ini.hora);
      const cFin = minutosDesdeMedianoche(c.fin.hora);
      if (c.ini.fecha !== fecha) return false;
      return solapa(iniMin, finMin, cIni, cFin);
    });
  }).map((m) => hhmmDesdeMinutos(m));
}

export function slotDisponible(params, hhmm) {
  return intervalosDisponibles(params).includes(hhmm);
}

export function aUtcSlot(fecha, hhmm) {
  return aUtc(fecha, hhmm);
}
