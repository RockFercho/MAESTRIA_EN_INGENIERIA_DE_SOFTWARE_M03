export const OFFSET_LOCAL_HORAS = -4;
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

export function minutosDesdeMedianoche(hhmm) {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(hhmm));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function hhmmDesdeMinutos(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function diaSemanaLocal(fecha) {
  const [y, m, d] = String(fecha).split('-').map(Number);
  if (!y || !m || !d) return null;
  return DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function aUtc(fecha, hhmm) {
  const [y, m, d] = String(fecha).split('-').map(Number);
  const min = minutosDesdeMedianoche(hhmm);
  if (!y || min === null) return null;
  return new Date(Date.UTC(y, m - 1, d, min / 60 + -OFFSET_LOCAL_HORAS, min % 60));
}

export function aLocal(dateUtc) {
  const local = new Date(dateUtc.getTime() + OFFSET_LOCAL_HORAS * 3600000);
  const fecha = local.toISOString().slice(0, 10);
  const hhmm = local.toISOString().slice(11, 16);
  const dia = DIAS[local.getUTCDay()];
  return { fecha, hora: hhmm, dia };
}

export function esFechaValida(fecha) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) && !Number.isNaN(Date.parse(`${fecha}T00:00:00Z`));
}

export function minutosEntreUtc(a, b) {
  return (b.getTime() - a.getTime()) / 60000;
}
