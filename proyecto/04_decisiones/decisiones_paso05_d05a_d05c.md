# Decisiones humanas — Paso 05 (Normalización): D-05a, D-05b, D-05c

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Fecha:** 9 de octubre de 2026
**Origen:** aprobación humana del Paso 05 sobre `informe_normalizacion.md` y `revision_complementaria_o1_o2_o3.md`.
**Estado:** **Las tres APROBADAS — Paso 05 APROBADO.**
**Evidencia previa:** `proyecto/03_resultados/evidencia_pre_aprobacion_paso05/`.

## D-05a — APROBADA — `duracion_efectiva_min` en T7

**Decisión:** conservar el atributo, documentando su **redundancia derivada justificada**, las dependencias funcionales y los mecanismos de consistencia transaccional.
**Aplicación (ya en la revisión complementaria §1):** FD de negocio D2 `(inicio, duración) → fin` (RN-04); `CK = {id}`; BCNF como declarada; clasificación como desnormalización justificada (RN-04 + patrón de acceso); 5 mecanismos de consistencia (fijación única al reservar, reprogramación atómica con T8/T9/T13 en un commit, validación servidor `fin = inicio + duración`, CHK de aritmética **diferida al Paso 07** (dependiente de motor), rastro en T8).
**Trazabilidad:** RN-04, RF-012…RF-016, RNF-003, ADR-001.

## D-05b — APROBADA — Anti-duplicados en T6

**Decisión:** impedir duplicados exactos conforme a la **identidad E2** `(profesional_id, fecha, tipo, hora_inicio, hora_fin)`; **validación en la lógica de negocio**; **restricción declarativa diferida** al paso correspondiente según el motor seleccionado; **no prohibir solapamientos legítimos**.
**Aplicación:** (A) regla transaccional de alta: rechazo de fila con tupla E2 existente (agnóstica, sin modificar el modelo); (B) UNIQUE declarativa sobre E2 → **Paso 07** tras elegir motor (semántica NULL de `hora_inicio/hora_fin`), con **autorización explícita al modificarse T6**. `motivo` fuera de la identidad; `tipo` incluido; `(NULL,NULL)` = jornada completa (A-05).
**Trazabilidad:** RF-008, RN-05, A-05.

## D-05c — APROBADA — Historial T8 sin UNIQUE de negocio

**Decisión:** preservar **todos** los eventos legítimos, **sin UNIQUE sobre valores de negocio**; usar **identidad propia, correlación con auditoría e idempotencia** para evitar duplicaciones técnicas.
**Aplicación:** **M-1** identidad por PK `id` · **M-2** la fila T9 de la operación registra en `contexto` el id del evento T8 (misma transacción; precedente de la precisión T14↔T9 del Paso 04) · **M-3** prevención: una escritura por transacción + idempotencia T12 + máquina de estados RN-08 · **M-4** verificación de que cada evento pertenece a una operación distinta. Append-only intacto; sin registros eliminados; sin columnas/tablas/relaciones nuevas.
**Trazabilidad:** RF-021, RF-026, RNF-012, RNF-013, RN-08, RN-10, RN-11.

## Detalles técnicos resueltos autónomamente (derivados de decisiones aprobadas — no requieren aprobación)

- CHK de coherencia `fin = inicio + duración` → **diferido al Paso 07** (dependiente de motor; D-05a).
- Semántica NULL de la UNIQUE E2 de T6 → **Pasos 06/07** (D-05b, según motor).
- TTL de idempotencia (L-03) → Paso 12; tipado/enums/longitudes → Paso 06+; mecanismo ER-02 → backend; numeración R17 reservada.
- Validación E2 en lógica de negocio y correlación T8↔T9 vía `contexto` → **reglas vigentes de diseño**, a implementar en el backend (Pasos 11+).

## Pendientes que siguen abiertos

1. **OD-01** — valor inicial de anticipación mínima para reservar (no bloqueante).
2. **OD-02** — canal seguro de entrega de contraseñas temporales (no bloqueante).
3. **Selección del DBMS (Paso 06)** — la aprobación de esta decisión NO está cubierta por esta autorización (instrucción 8 de la aprobación del Paso 05).

**Siguiente:** Paso 06 — Selección del DBMS (`seleccion_dbms.md`), hasta su checkpoint humano.
