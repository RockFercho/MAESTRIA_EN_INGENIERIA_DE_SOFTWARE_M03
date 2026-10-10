import { ahoraUtcMysql } from '../../../shared/time/utc.js';

export function crearProcesarOutbox({ ejecutarTransaccion, reloj = () => new Date() }) {
  return async function procesarOutbox() {
    const pendientes = await ejecutarTransaccion({}, (r) => r.outbox.findPendientes(50));
    let procesados = 0;
    for (const evento of pendientes) {
      try {
        await ejecutarTransaccion({}, async (r) => {
          const carga = JSON.parse(evento.carga);
          await r.notificaciones.insert({
            destinatario_id: carga.destinatario_id,
            cita_id: evento.cita_id,
            evento: carga.evento,
            instantanea_datos: carga.instantanea_datos,
            ahora: ahoraUtcMysql(reloj()),
          });
          await r.outbox.markProcesado(evento.id, ahoraUtcMysql(reloj()));
        });
        procesados += 1;
      } catch (err) {
        console.error('[notificaciones] fallo al procesar outbox id=', evento.id, err.message);
        try { await ejecutarTransaccion({}, (r) => r.outbox.marcarFallo(evento.id)); } catch { /* noop */ }
      }
    }
    return { procesados, pendientes: pendientes.length - procesados };
  };
}

function instantaneaParseada(fila) {
  try {
    return { ...fila, instantanea: JSON.parse(fila.instantanea_datos) };
  } catch {
    return { ...fila, instantanea: null };
  }
}

export function crearConsultarNotificaciones({ ejecutarTransaccion }) {
  return async function consultarNotificaciones({ destinatarioId }) {
    const filas = await ejecutarTransaccion({}, (r) => r.notificaciones.findAllByDestinatario(destinatarioId));
    return filas.map(instantaneaParseada);
  };
}
