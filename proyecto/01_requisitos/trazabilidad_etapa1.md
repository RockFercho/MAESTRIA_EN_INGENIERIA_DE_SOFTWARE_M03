# Trazabilidad de la Etapa 1 — Requisitos

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Origen:** análisis asistido (`validacion_requisitos_etapa1.md`) y decisiones humanas (`validacion_humana_requisitos.md`).
**Estado:** ejecución del plan aprobado por autorización humana.

Los dos archivos de evidencia mencionados no fueron modificados por este proceso.

| Observación | Decisión humana | Documentos modificados | Identificadores afectados | Criterios de aceptación |
|-------------|-----------------|------------------------|---------------------------|-------------------------|
| V-01 | Estado inicial Confirmada; transiciones explícitas; reprogramación mantiene Confirmada y registra el cambio (no es transición) | `reglas_negocio.md`, `RF.md`, `criterios_aceptacion.md` | RN-08 (reescribir); RF-015, RF-020, RF-021 (ampliar) | CA-006 |
| V-02 | Elegibilidad = estado Confirmada + plazo mínimo (inicial 2 h) | `reglas_negocio.md`, `RF.md`, `criterios_aceptacion.md` | RN-13 (nueva); RF-017, RF-018, RF-019, RF-025 (ampliar) | CA-004, CA-005 |
| V-03 | Reserva en línea autenticada dentro de la v1; corregir descripción contradictoria | `descripcion.md` | Sin RF nuevo (corrección de contexto) | CA-003 |
| V-04 | Landing page del mismo sistema, responsive, con datos reales del backend | `alcance.md`, `descripcion.md`, `RF.md`, `criterios_aceptacion.md` | RF-027 (nueva) | CA-011 (nueva) |
| V-05 | Notificaciones internas consultables, desacopladas; correos fuera de alcance | `alcance.md`, `descripcion.md`, `RF.md`, `RNF.md`, `criterios_aceptacion.md` | RF-024 (ampliar), RF-028 (nueva); RNF-017 (reescribir) | CA-012 (nueva) |
| V-06 | Tres roles; cuentas de profesionales creadas por administrador; autorización en servidor | `RF.md`, `criterios_aceptacion.md` | RF-004, RF-021, RF-023 (ampliar) | CA-006, CA-009 |
| V-07 | Duración general configurable + duración específica profesional-servicio con prioridad; citas conservan su duración | `reglas_negocio.md`, `RF.md`, `criterios_aceptacion.md` | RN-04 (reescribir); RF-005, RF-006, RF-009 (ampliar) | CA-002 |
| V-08 | Perfil de carga aprobado (datos, usuarios, duración, mezcla) | `RNF.md`, `criterios_aceptacion.md`, nuevo `perfil_carga.md` | RNF-006, RNF-008, RNF-009 (ampliar) | CA-008 |
| V-09 | America/La_Paz; almacenamiento en UTC; horarios recurrentes en tz institucional | `reglas_negocio.md`, `restricciones.md`, `RNF.md`, `criterios_aceptacion.md` | RN-15 (nueva); RNF-028 (nueva) | CA-010, CA-014 (nueva) |
| V-10 | Permisos por rol; cambios fuera de plazo por profesional/admin con justificación obligatoria; auditoría y notificación | `reglas_negocio.md`, `RF.md`, `criterios_aceptacion.md` | RN-14 (nueva); RF-017, RF-018 (ampliar) | CA-004, CA-005 |
| V-11 | Contraseñas ≥ 12 caracteres, límite de intentos, mensajes genéricos, reset por administrador; correo fuera (futuro) | `alcance.md`, `RF.md`, `RNF.md`, `criterios_aceptacion.md` | RF-029 (nueva); RNF-029 (nueva) | CA-001, CA-009, CA-015 (nueva) |
| V-12 | 99,5 % medido; respaldo diario, retención ≥ 7 días; restauración antes de producción y cada 3 meses | `RNF.md`, `criterios_aceptacion.md` | RNF-014, RNF-015, RNF-016 (ampliar) | CA-013 (nueva) |

## Identificadores nuevos incorporados

- RF-027, RF-028, RF-029
- RNF-028, RNF-029
- RN-13, RN-14, RN-15
- CA-011, CA-012, CA-013, CA-014, CA-015

## Verificación de conservación

- Ningún RF, RNF, RN o CA existente fue eliminado.
- Los identificadores existentes se conservaron; las reescrituras de RN-04 y RN-08 quedan justificadas por V-07 y V-01.
- No se seleccionaron tecnologías ni se generó código.
