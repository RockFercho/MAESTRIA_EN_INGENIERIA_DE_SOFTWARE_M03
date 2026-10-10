# Evidencia backend completo (CP-FULL-10)

Fecha de verificación: 2026-10-10 (hora local La Paz, UTC-4).

## Artefactos

| Archivo | Contenido |
| --- | --- |
| `npm_test_73_de_73.txt` | Salida completa de `npm test`: **73 pruebas, 73 pasan, 0 fallan**. |
| `cp_full_10_verificacion_mysql.md` | Traza E2E contra MySQL real vía HTTP: health, login, registro público, catálogo, catálogo, parámetros, RN-12, disponibilidad, reserva idempotente, concurrencia, máquina de estados, cancelación, reprogramación, notificaciones, auditoría y control de acceso. |
| `cp_full_10_rn12_preaprobacion.md` | Corrida previa que deja constancia del comportamiento de RN-12 **antes** de aprobar `anticipacion_reservar`: reserva rechazada con `409 POLITICA_NO_CONFIGURADA`. |

## Incidentes detectados y corregidos durante la verificación

La suite en memoria (73 pruebas) no cubre los adaptadores MySQL, por lo que la
verificación contra la base real expuso tres defectos de paridad:

1. **Disponibilidad vacía en MySQL.** `minutosDesdeMedianoche` solo admitía
   `HH:MM`, pero MySQL devuelve `TIME` como `HH:MM:SS`, de modo que todo horario
   horario se descartaba y el sistema devolvía cero intervalos libres.
   Corregido en `src/shared/time/lapaz.js` aceptando el segundo opcional.
2. **Auditoría rechazada.** El repositorio MySQL enlazaba `datos.ahora` pero los
   cuatro puntos de inserción envían `fecha_hora_utc`, por lo que el parámetro
   llegaba `undefined` y la reserva completa fallaba con `500 DB_ERROR`.
   Corregido en `src/modules/reservas/adapters/persistence/reservas-repository-mysql.js`.
3. **Horas en UTC.** El script de verificación y el servidor calculaban el día de
   semana y la fecha en UTC, desalineados con el huso local del proyecto (UTC-4).

## Parámetros operativos tras la verificación

| Parámetro | Valor | Origen |
| --- | --- | --- |
| `anticipacion_reprogramar` | 120 min | Aprobado en RN-13. |
| `anticipacion_cancelar` | 120 min | Aprobado en RN-13. |
| `anticipacion_reservar` | 60 min | Aprobado explícitamente por el estudiante durante CP-FULL-10 para habilitar la verificación de reservas. |

## Limpieza

Los datos de prueba (`verif.cp10.*`, citas, claves de idempotencia, notificaciones,
outbox, auditoría, historial, horarios, asociaciones y el servicio de verificación)
fueron eliminados con la cuenta `devcode`, que sí posee permisos de borrado. La
cuenta `app_rw` de la aplicación no tiene `DELETE` y no se usó para limpiar.

Quedan únicamente el administrador de demostración, una cuenta sonda de registro
y los tres parámetros operativos.
