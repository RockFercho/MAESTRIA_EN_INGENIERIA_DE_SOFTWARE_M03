# Auditoría e histórico — Paso 10

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 10 (Auditoría, histórico y versionamiento), motor D-06/D-06-R1 (MySQL 8.0.46/InnoDB).
**Skills:** `database-schema-designer` + `databases` · **Fecha:** 9 de octubre de 2026.
**Entradas:** RF-021/026, RNF-013/017/026/030, RN-10/11, ER-01…ER-05, decisiones D-05c, precisión T14↔T9.

## 1. Distinguir los tres ámbitos (según el workflow)

### 1.1 Auditoría de cambios — T9 `auditoria_operacion`
- **Qué:** una fila por **operación crítica** con usuario, fecha, resultado (RF-026/RNF-013): reserva, reprogramación, cancelación, cambio de estado, restablecimiento de contraseña (catálogo L-04 validado en aplicación).
- **Integridad:** PK `operacion_id`; usuario NN (R14); cita opcional 0..1 (R12); append-only (**privilegios sólo-INSERT**, Paso 09); escritura **en el mismo commit** que la operación → una operación fallida no deja auditoría de éxito ni viceversa.
- **Correlación (mecanismo principal, precisión aprobada):** `contexto` de T9 porta el **id del registro relacionado**: id del restablecimiento T14 (RF-029/RNF-030) y, con D-05c, id del evento de historial T8. Usuario+fecha no es el mecanismo principal.
- **Sin secretos** en `contexto` (RNF-026); T9 sin CHECK en `tipo_operacion` (L-04).

### 1.2 Histórico (temporal) — T8 `historial_cambio_cita`
- **Qué:** una fila por **evento de cambio de cita** con responsable NN (R13/ER-01), valores anterior/nuevo de estado o de fechas (RF-021) y justificación (RN-14, obligatoriedad transaccional).
- **Integridad:** append-only por privilegios; **sin UNIQUE de negocio** (D-05c: los eventos legítimos repetidos se preservan); identidad por PK; prevención de duplicación técnica: una escritura por transacción + idempotencia T12 + máquina de estados RN-08 (M-3); trazabilidad vía `contexto` de la fila T9 de la misma operación (M-2).
- **Reprogramación:** conserva `fecha_anterior_utc/fecha_nueva_utc` y **no altera el estado** de la cita (V-01); la duración efectiva se mantiene (D-05a) y los cambios de inicio/fin son atómicos.

### 1.3 Versionamiento (esquema y migraciones) — ver `versionamiento.md`
Resumido aquí: versionado **por archivos** (scripts numerados con checksum) **sin tabla de control nueva** (las 14 entidades quedan intactas; una tabla `schema_migrations` exigiría aprobación humana por añadir entidad).

## 2. Cascos de protección transversal

| Capa | Mecanismo |
|---|---|
| Motor | Privilegios sólo-INSERT en T8/T9 (Paso 09); FK RESTRICT; CHECK de dominios |
| Transacción | T8+T9 (+T13 cuando aplique) escritas con la operación de negocio en **un solo commit** (Paso 12) |
| Aplicación | Sin UPDATE/DELETE sobre T8/T9; validación de máquina de estados; idempotencia |
| Respaldo | binlog + respaldos diarios ≥ 7 días (RNF-015) y prueba de restauración (RNF-016) → el histórico es recuperable |

## 3. Notificaciones y outbox (cómo se conservan)

- **T10 `notificacion`:** instantánea de datos en el momento del evento (A-04), FKs RESTRICT, evento con CHK; escritura junto al hecho de negocio o publicada desde el outbox; **sin estado de lectura** (OD-03).
- **T13 `evento_outbox`:** fila escrita **en la misma transacción** que la cita (RNF-017/CA-012/ER-03); el consumidor sólo marca `estado`/`intentos`; fallos del consumidor **no invalidan reservas** (RNF-017); correlación `correlacion_id` para trazabilidad evento↔operación.

## 4. Verificaciones

1. Auditoría vs histórico diferenciados con sus reglas; correlación T14/T8↔T9 por `contexto` coherente con el Paso 04.
2. RN-10/RN-11 cumplidas por privilegio de motor; D-05c aplicado sin UNIQUE de negocio.
3. RF-021/026, RNF-013/017/026/030 trazados; sin SQL ejecutable; modelos y requisitos intactos.

**Estado:** elaborado — agrupado con Pasos 07–14.
