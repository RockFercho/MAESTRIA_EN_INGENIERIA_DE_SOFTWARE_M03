# Informe de normalización — Paso 05

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 05 (Normalización).
**Skill:** `database-schema-designer`.
**Fecha:** 9 de octubre de 2026.
**Entradas:** `03_modelo_logico/modelo_logico.md` (**Paso 04 APROBADO** con L-01…L-04 y precisión de correlación T14↔T9), `01_requisitos_datos/requisitos_datos.md`, ADR-001, RF/RNF/RN/CA vigentes.
**Restricción:** análisis agnóstico de motor; **sin SQL, sin migraciones, sin código, sin selección de DBMS, sin infraestructura**. No se modifica el modelo lógico aprobado: las anomalías detectadas se **presentan para decisión humana** (instrucción 8) en lugar de resolverse unilateralmente.

---

## 1. Método y notación

1. Para cada tabla: clave primaria (PK), **claves candidatas (CK)**, **dependencias funcionales (FD)** con notación `X → Y` (X determina Y), determinantes no clave.
2. Evaluación progresiva: **1FN** (atomicidad, sin grupos repetidos) → **2FN** (sin dependencias parciales de atributos no clave respecto de una PK compuesta) → **3FN** (sin transitivas no clave→no clave) → **BCNF** (todo determinante es clave candidata), aplicando BCNF "cuando sea pertinente".
3. Toda desnormalización se contrasta con RF/RNF o patrón de acceso; toda anomalía de redundancia/inserción/actualización/eliminación que exija cambiar el modelo aprobado se eleva como **observación** (§7).
4. En las tablas del §2 del modelo lógico, pares como `creado_utc / actualizado_utc` o `hora_inicio / hora_fin` son **columnas separadas**, no un atributo compuesto (la eliminación de compuestos ya está garantizada en la 1FN desde el Paso 04).

## 2. Resumen global

| Tabla | PK | CK adicionales | 1FN | 2FN | 3FN | BCNF | Observación |
|---|---|---|---|---|---|---|---|
| T1 usuario | `id` | `correo` | ✓ | ✓ | ✓ | ✓ | — |
| T2 profesional | `id` | `usuario_id` | ✓ | ✓ | ✓ | ✓ | — |
| T3 servicio | `id` | — | ✓ | ✓ | ✓ | ✓ | — |
| T4 asociacion_profesional_servicio | `(profesional_id, servicio_id)` | la propia PK | ✓ | ✓ | ✓ | ✓ | PK compuesta sin parciales |
| T5 horario_habitual | `id` | `(profesional_id, dia_semana, hora_inicio)` | ✓ | ✓ | ✓ | ✓ | Solapes: no-FD → §5 transaccional |
| T6 excepcion_disponibilidad | `id` | — | ✓ | ✓ | ✓ | ✓ | **O-2** (filas duplicadas posibles) |
| T7 cita | `id` | ninguna declarada | ✓ | ✓ | **O-1** | **O-1** | `duracion_efectiva_min` derivada |
| T8 historial_cambio_cita | `id` | — | ✓ | ✓ | ✓ | ✓ | **O-3** (eventos idénticos posibles) |
| T9 auditoria_operacion | `operacion_id` | — | ✓ | ✓ | ✓ | ✓ | Append-only (RN-10/11) |
| T10 notificacion | `id` | — | ✓ | ✓ | ✓ | ✓ | Instantánea A-04 (desnorm. aprobada) |
| T11 parametro_operativo | `clave` | la propia PK | ✓ | ✓ | ✓ | ✓ | — |
| T12 clave_idempotencia | `clave` | la propia PK | ✓ | ✓ | ✓ | ✓ | Equivalencia → ER-02 transaccional |
| T13 evento_outbox | `id` | — | ✓ | ✓ | ✓ | ✓ | Carga: patrón outbox aprobado |
| T14 restablecimiento_contrasena | `id` | — | ✓ | ✓ | ✓ | ✓ | Correlación T14↔T9 vía `contexto` |

**Forma normal alcanzada:** **13 de 14 tablas en BCNF** (y por tanto en 3FN/2FN/1FN). **T7 `cita` está en 1FN y 2FN; su 3FN estricta depende de la decisión sobre O-1** (§7): `duracion_efectiva_min` está funcionalmente determinada por `(inicio_utc, fin_utc)`. Con la desnormalización **justificada y sujeta a ratificación** (RN-04), T7 se considera 3FN con desnormalización explícita; sin ella (opción B de O-1), T7 queda en BCNF.

**No se proponen reestructuraciones** (no hay tablas por dividir ni atributos por mover): el modelo aprobado ya viene esencialmente normalizado; las tres observaciones de §7 son de **restricción/decisión**, no de reordenación de atributos.

## 3. Análisis por tabla (FD y claves)

### T1 `usuario` — CK: `id`, `correo`
- FD: `id → {nombre_completo, correo, hash_contrasena, rol, estado, creado_utc, actualizado_utc}`; `correo → id` (UNIQUE CA-001 hace de `correo` clave candidata).
- Ningún no-clave determina a otro (`rol`/`estado` no determinan atributos ajenos). PK simple → 2FN automática; sin transitivas → **3FN**; todo determinante es CK → **BCNF**.

### T2 `profesional` — CK: `id`, `usuario_id`
- FD: `id → {usuario_id, datos_exhibicion, estado, desactivado_utc}`; `usuario_id → id` (UNIQUE, R1 1:0..1).
- El CHK `estado ↔ desactivado_utc` es **restricción de dominio, no FD** (dos filas inactivas admiten distintos instantes). **3FN/BCNF**.

### T3 `servicio` — CK: `id`
- FD: `id → {nombre, descripcion, duracion_minutos, estado}`. `nombre` no es UNIQUE → no es determinante. Sin transitivas → **3FN/BCNF**.

### T4 `asociacion_profesional_servicio` — CK: `(profesional_id, servicio_id)`
- FD: `(profesional_id, servicio_id) → {duracion_especifica, estado, registrado_utc, baja_utc}`.
- **2FN:** ningún atributo depende de un solo componente de la PK (`duracion_especifica` corresponde al **par**, RN-04); la PK compuesta codifica la unicidad R5/ER-05.
- **3FN:** `estado ↔ baja_utc` es CHK condicional, no transitiva. **BCNF** (la PK es el único determinante).

### T5 `horario_habitual` — CK: `id`, `(profesional_id, dia_semana, hora_inicio)`
- FD: `id → {profesional_id, dia_semana, hora_inicio, hora_fin}` y `(profesional_id, dia_semana, hora_inicio) → {id, hora_fin}` (UNIQUE de deduplicación, L-01).
- Ambos determinantes son CK → **BCNF**. La **superposición de intervalos entre filas no es una FD** (compara atributos de filas distintas) → correcto que quede transaccional en §5 del modelo lógico.

### T6 `excepcion_disponibilidad` — CK: `id`
- FD: `id → {profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo}`. Sin no-clave determinante → **3FN/BCNF**.
- **O-2:** no hay UNIQUE sobre `(profesional_id, fecha, hora_inicio, tipo…)` → se admiten filas **exactamente duplicadas** (anomalía de inserción, §7).

### T7 `cita` — CK: `id`
- FD: `id → {solicitante_id, profesional_id, servicio_id, inicio_utc, fin_utc, duracion_efectiva_min, estado, justificacion_cambio, creado_utc, actualizado_utc}`.
- **FD determinante del caso:** `(inicio_utc, fin_utc) → duracion_efectiva_min` (RN-04: duración fijada al reservar; `fin = inicio + duración`). El determinante **no es superclave** y `duracion_efectiva_min` no es prima → **violación estricta de 3FN y BCNF** → **O-1 (§7)**.
- `(profesional_id, inicio_utc)` **no** es CK (no está declarada y la exclusión de solapes es transaccional, RN-03); `justificacion_cambio` no depende de `estado` (obligatoriedad según RN-14 es condicional, transaccional). 1FN y 2FN cumplidas.
- Connotación adicional: `duracion_efectiva_min` también **copia** el dato de T3/T4 (RN-04) — instantánea de origen, misma observación O-1.

### T8 `historial_cambio_cita` — CK: `id`
- FD: `id → {cita_id, usuario_id, tipo_cambio, estado_anterior, estado_nuevo, fecha_anterior_utc, fecha_nueva_utc, cambiado_utc, justificacion}`.
- Los CHKs condicionales (`tipo_cambio → estado_nuevo NOT NULL`, etc.) regulan **nulidad**, no valor → no son transitivas. **3FN/BCNF**.
- **O-3:** sin UNIQUE sobre `(cita_id, tipo_cambio, cambiado_utc)` cabrían eventos idénticos (inserción) → §7.

### T9 `auditoria_operacion` — CK: `operacion_id`
- FD: `operacion_id → {usuario_id, cita_id, tipo_operacion, fecha_hora_utc, resultado, contexto}`. `cita_id` es FK 0..1, no determinante (muchas operaciones por cita). **3FN/BCNF**. Append-only → sin anomalía de eliminación (RN-10/RN-11).

### T10 `notificacion` — CK: `id`
- FD: `id → {destinatario_id, cita_id, evento, instantanea_datos, generado_utc}`. `instantanea_datos` es **copia aprobada (A-04)**, no transitiva entre claves ajenas. **3FN/BCNF** con desnormalización ya autorizada (§6).

### T11 `parametro_operativo` — CK: `clave`
- FD: `clave → {valor, descripcion, modificado_por, modificado_utc}`. `valor` no determina nada (no UNIQUE). **3FN/BCNF**.

### T12 `clave_idempotencia` — CK: `clave`
- FD: `clave → {usuario_sesion, tipo_operacion, solicitud_original, resultado, creada_utc, caduca_utc}`.
- Semánticamente `resultado` corresponde a la solicitud original, pero la **equivalencia/conflicto entre solicitudes no es una FD declarada**: se decide en transacción (ER-02, §5) → no afecta la normalización. **3FN/BCNF**.

### T13 `evento_outbox` — CK: `id`
- FD: `id → {correlacion_id, tipo_evento, cita_id, carga, estado, intentos, creado_utc, procesado_utc}`. `estado → procesado_utc` es CHK condicional, no FD. **3FN/BCNF**. `carga` duplica datos de la cita → patrón outbox aprobado (§6).

### T14 `restablecimiento_contrasena` — CK: `id`
- FD: `id → {usuario_id, hash_temporal, caduca_utc, estado, creado_utc}`. `usuario_id` no determina la fila (varios restablecimientos por usuario) → no es CK. **3FN/BCNF**. La correlación con T9 (precisión del Paso 04: id del restablecimiento en `contexto`) es una regla de escritura, no una FD → sin efecto normalizacional.

## 4. Dependencias funcionales problemáticas (síntesis)

| # | Tabla | FD problemática | Determinante ¿superclave? | ¿Afecta a | Forma |
|---|---|---|---|---|---|
| O-1 | T7 cita | `(inicio_utc, fin_utc) → duracion_efectiva_min` | **No** | 3FN y BCNF de T7 | Transgresión real, justificable por RN-04 |
| O-2 | T6 excepción | — (falta CK lógica de unicidad del hecho) | n/a | Inserción de duplicados | No viola FN; viola integridad de datos |
| O-3 | T8 historial | — (falta unicidad del evento) | n/a | Inserción de duplicados | No viola FN; riesgo de historial repetido |

## 5. Dependencias funcionales correctas destacadas (para trazabilidad)

- `correo → usuario` (CA-001), `usuario_id → profesional` (R1).
- Par compuesto `→ atributos de asociación` (R5/RN-16/ER-05): base de la 2FN de T4.
- `clave_idempotencia → resultado` por PK (RNF-012/CA-007: un solo resultado reutilizable por clave).
- `clave → valor` (RN-12/RF-025: un valor vigente por parámetro, modificado por T11 con R15).
- `operacion_id → usuario, fecha, resultado` (RF-026/RNF-013: los tres datos viven juntos en la fila de auditoría).

## 6. Desnormalizaciones presentes (todas con justificación)

| # | Dónde | Qué se almacena duplicado/derivado | Justificación RF/RNF/patrón | Estado |
|---|---|---|---|---|
| D-1 | T7 `duracion_efectiva_min` | Derivada de `(inicio, fin)` y copia de T3/T4 | **RN-04** (fijada al reservar) + patrón de acceso: leer/validar cita sin joins; evita recalcular intervalos en listados | **Requiere ratificación → O-1** |
| D-2 | T10 `instantanea_datos` | Copia de los datos de la cita en el evento | **A-04 aprobada** + RF-024 (notificaciones auditables aunque la cita cambie) | Ya aprobada (Paso 02) |
| D-3 | T13 `carga` | Payload del evento | Patrón outbox aprobado (**RNF-017/CA-012**, ER-03): consumidor independiente de la BD | Ya aprobado (Paso 02) |

Ninguna otra tabla almacena atributos ajenos derivados: las FK guardan **solo identificadores** (no se copian nombres, estados ni duraciones de tablas padre) — la regla de "guardar solo la clave ajena" se respeta salvo D-1/D-2/D-3.

## 7. Anomalías y observaciones para decisión humana

| # | Tipo | Descripción | Alternativas | Recomendación |
|---|---|---|---|---|
| **O-1** | **Redundancia / actualización** | En T7, `duracion_efectiva_min` está determinada por `(inicio_utc, fin_utc)`: si cambia el inicio (reprogramación), la duración debe actualizarse en la misma transacción o quedaría obsoleta (anomalía de actualización). Estrictamente transgrede 3FN/BCNF. | **A (recomendada):** mantener la columna como **desnormalización explícita** justificada en RN-04 + patrón de acceso (lectura de cita sin joins), con regla transaccional: reprogramación actualiza `inicio/fin/duración` atómicamente (a §5 del modelo lógico). **B:** eliminar la columna y derivar `fin − inicio` en consultas → **exige modificar T7 del modelo lógico aprobado** y contradice "fijada al reservar" como dato almacenado. | **A** |
| **O-2** | **Inserción** | T6 admite filas idénticas (mismo profesional, fecha, rango y tipo): redundancia de hechos y confusión de disponibilidad. Sin UNIQUE declarado en el modelo aprobado. | **A:** validación de duplicados exactos en la transacción de alta (backend, sin tocar el modelo). **B:** añadir UNIQUE lógica en T6 → **modifica el modelo aprobado**; además su comportamiento con `hora_inicio NULL` (jornada completa) depende del motor → remitir a Pasos 06/07. **C:** mantener sin restricción. | **A** ahora; evaluar **B** en el Paso 07 (tras elegir motor) |
| **O-3** | **Inserción** | T8 podría recibir dos filas idénticas para el mismo `(cita_id, tipo_cambio, cambiado_utc)` (reintento duplicado del backend). | **A (recomendada):** garantizar en backend una sola fila por evento (append-only por transacción), sin tocar el modelo. **B:** UNIQUE lógica → modifica el modelo aprobado; `cambiado_utc` admite colisiones teóricas → remitir a Paso 07. | **A** |

**Anomalías descartadas (sin decisión requerida):**
- *Eliminación:* ninguna — todas las FK son RESTRICT/NO ACTION, T8/T9 son append-only (RN-10/RN-11) y T2/T3/T4 usan estados `inactivo/a` en lugar de borrado (RF-004: desactivar ≠ eliminar).
- *Inserción con datos parciales:* CHKs condicionales (A-05, T4, T8, T12) impiden filas inconsistentes.
- *Redundancia entre tablas por copia de atributos no clave:* solo D-1/D-2/D-3, todas justificadas (D-1 pendiente de ratificación).

## 8. Trazabilidad RF/RNF/RN/CA/ADR-001 → normalización

| Origen | Verificación de normalización |
|---|---|
| RN-04 (duración fijada al reservar) | Origen de D-1/O-1; justificación declarada |
| RN-10/RN-11 (append-only, sin borrado) | T8/T9 sin anomalías de eliminación |
| RN-12/RF-025 (parámetros) | T11 en BCNF, `clave` única |
| RN-15/RNF-028 (UTC vs hora local) | T5/T6 con tipos separados; sin redundancia temporal |
| RN-16/ER-05 (par profesional-servicio) | T4 PK compuesta en 2FN/BCNF, sin atributos parciales |
| RF-004 (desactivar ≠ eliminar) | Estados en T2/T3/T4; sin borrado físico → sin anomalía de eliminación |
| RF-012…RF-021 (citas/historial) | T7 con O-1 único; T8 en BCNF con O-3 |
| RF-026/RNF-013 (auditoría) | T9 en BCNF con los tres datos dependientes de `operacion_id` |
| RF-029/RNF-030/CA-015 (restablecimiento) | T14 en BCNF; correlación con T9 vía `contexto` (precisión Paso 04), sin FD nueva |
| RNF-012/CA-007 (idempotencia) | T12 en BCNF con PK única; equivalencia transaccional (ER-02) |
| RNF-017/CA-012 (outbox atómico) | D-3 justificada |
| RF-024/A-04 (instantánea) | D-2 ya aprobada |
| CA-001 (correo único) | CK de T1 verificada |
| CA-002/CA-006/CA-014 | Sin efectos normalizacionales adversos (T4/T7 estados y T5/T6 hora local) |
| **ADR-001** (monolito modular, **única BD relacional**) | Normalización completa en un único esquema lógico; sin reparto de datos ni tablas fuera del alcance |

## 9. Verificaciones del paso

1. **14/14 tablas analizadas**; **R1–R16 intactas**; ninguna entidad/atributo/relación añadido, eliminado ni movido.
2. **Modelo lógico, requisitos, decisiones aprobadas, documentos del Paso 03 y evidencias históricas NO modificados** (este informe es un documento nuevo).
3. **Sin SQL, sin migraciones, sin código, sin selección de motor, sin instalación de frameworks ni infraestructura.**
4. Forma normal declarada con justificación FD a FD (§2–§5); anomalías elevadas en §7 sin resolución unilateral.
5. Pendientes humanos conservados: **OD-01, OD-02** (no bloqueantes) y los **detalles técnicos diferidos** (TTL→Paso 12; tipado/enums→Paso 06; ER-02→backend; numeración R17 reservada).

---

**Estado del paso:** informe elaborado y presentado con observaciones **O-1, O-2 y O-3** para decisión humana. **HUMAN_STATUS: PENDING_STEP_05_APPROVAL** — esperando revisión y aprobación explícita; **no avanzar al Paso 06** (selección del DBMS).
