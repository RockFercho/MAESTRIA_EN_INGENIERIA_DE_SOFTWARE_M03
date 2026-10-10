export function ahoraUtcMysql(fecha = new Date()) {
  const iso = fecha.toISOString();
  return `${iso.slice(0, 19).replace('T', ' ')}${iso.slice(19, 23)}`;
}

export function minutosDesdeUtc(instanteUtcMysql, ahora = new Date()) {
  const normalizado = String(instanteUtcMysql).replace(' ', 'T') + (String(instanteUtcMysql).includes('.') ? '' : '.000');
  return (ahora.getTime() - new Date(`${normalizado}Z`).getTime()) / 60000;
}
