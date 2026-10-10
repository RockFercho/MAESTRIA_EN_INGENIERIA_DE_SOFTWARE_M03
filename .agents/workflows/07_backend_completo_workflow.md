# Workflow 07 — Backend completo (módulos pendientes)

**Creado (autorización humana explícita, 2026-10-09)** por no existir workflow que cubra los módulos
backend pendientes: 05 = frontend, 06 = integración didáctica (login/categorías/productos del ejemplo).
No altera workflows cerrados (02/03/04). Mismo stack aprobado: Node.js 22 + Express 4 + mysql2 + node:test,
hexagonal interno (ADR-001), BD existente sin migraciones, cuenta **`app_rw`** (con GRANT INSERT autorizado
en `historial_cambio_cita` y `auditoria_operacion`, 2026-10-09). Sin frontend. Sin restablecimiento de
contraseñas (RF-029 pendiente de decisiones de seguridad). Ejecución continua autorizada por el responsable.

Módulos: identidad-ext (RF-001/003/004), catalogo-ext/asociaciones (RF-006), agenda (RF-007..011),
parametros (RF-025; semilla 2 h reprogramar/cancelar aprobada; reservar SIN valor — pendiente aprobación),
reservas (RF-012..019 + RNF-010..013 + CA-003/004/005/007), seguimiento (RF-020..023, CA-006),
notificaciones/outbox (RF-024/028, RNF-017, CA-012), auditoría (RF-026).

## CP-FULL-01
Documentar workflow + matriz RF pendiente → módulo → endpoints → pruebas. STOP (integrado en este inicio).

## CP-FULL-02
identidad-ext: registro público (solicitante), administración de usuarios, gestión de profesionales (RF-001/003/004).

## CP-FULL-03
Asociaciones profesional-servicio con duración específica (RF-006, RN-04/RN-16).

## CP-FULL-04
Agenda: horarios habituales (UQ, sin solapes) y excepciones (RF-007/008, RN-15).

## CP-FULL-05
Disponibilidad: cálculo de intervalos (horario + excepciones + citas activas + duración efectiva) RF-009..011, CA-002.

## CP-FULL-06
Parámetros operativos: GET/PUT admin; semilla 2 h (reprogramar/cancelar); sin valor para reservar (RF-025, RN-12/13).

## CP-FULL-07
Reservas: POST /citas con transacción ACID + GET_LOCK por profesional (RN-09) + idempotencia (clave_idempotencia,
RNF-012) + auditoría + outbox/notificación (RF-012..015, RNF-010/011/17).

## CP-FULL-08
Reprogramar y cancelar con plazo/justificación/roles (RF-017..019, RN-13/14, CA-004/005) + historial + notificaciones.

## CP-FULL-09
Seguimiento: máquina de estados (RF-020/021, RN-08) + historial (RF-022) + auditoría consulta (RF-026, CA-006) +
consulta de citas por rol (RF-016/023) + notificaciones consulta (RF-028).

## CP-FULL-10
Suite completa + OpenAPI + verificación MySQL real + evidencias + informe.

**CIERRE FORMAL (2026-10-10).** `HUMAN_STATUS: APPROVED`. CP-FULL-01..10 completados y
aprobados por el responsable del proyecto. Valor aprobado: `anticipacion_reservar = 60 min`
(RN-12/RF-025); reprogramar y cancelar permanecen en 120 min (RN-13); los tres parámetros
operativos son independientes. Evidencias en `proyecto/03_resultados/evidencia_backend_completo/`;
informe en `proyecto/03_resultados/informe_backend_completo.md`. Workflow cerrado.
