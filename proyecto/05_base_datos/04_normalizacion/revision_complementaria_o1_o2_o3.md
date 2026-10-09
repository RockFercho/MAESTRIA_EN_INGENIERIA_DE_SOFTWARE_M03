# Revisión técnica complementaria — O-1, O-2 y O-3 (Paso 05)

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 05 (Normalización), revisión complementaria solicitada por revisión humana.
**Fecha:** 9 de octubre de 2026.
**Documento base:** `informe_normalizacion.md` (evidencia previa de esta revisión: `proyecto/03_resultados/evidencia_pre_revision_o1_o2_o3/`).
**Alcance:** demostración formal de FD/CK y formas normales de O-1; definición de duplicados y restricciones de O-2; identificación/trazabilidad de O-3; re-verificación de las 14 tablas distinguiendo FD de restricciones de integridad.
**Restricciones cumplidas:** sin modificar modelos aprobados ni requisitos; sin SQL, código ni migraciones; sin seleccionar motor; sin avanzar al Paso 06; sin eliminar registros ni introducir entidades/relaciones nuevas.

---

## 1. O-1 — `duracion_efectiva_min` en T7 `cita`

### 1.1 Atributos, claves candidatas y FD declaradas (demostración formal)

Sea la relación **R** con universo:
`U = {id, solicitante_id, profesional_id, servicio_id, inicio_utc, fin_utc, duracion_efectiva_min, estado, justificacion_cambio, creado_utc, actualizado_utc}`.

**Claves candidatas (declaradas):** `CK = { {id} }`.
- `id` es PK (declara `id → U \ {id}`) → es superclave.
- No existe ninguna otra restricción UNIQUE en T7, luego no hay otro atributo o conjunto que determine a `id`. Candidatas "cercianas" descartadas como FD:
  - `(profesional_id, inicio_utc) → id` **no vale**: RN-03 sólo bloquea solapes de estados activos (Confirmada/En atención); una cita **Cancelada** y otra re-reservada en el mismo inicio del mismo profesional pueden coexistir → el par no determina la fila.
  - `(solicitante_id, inicio_utc)`, `(servicio_id, inicio_utc)`: contraejemplos análogos (dos solicitantes o dos servicios distintos en el mismo instante; o la misma cancelación+reserva).
  - Las FK no son determinantes: cada FK admite muchas filas.

**FD declaradas (implícitas en las restricciones del esquema):** únicamente
- **D1:** `id → U \ {id}`.
Con FD trivial + D1, todos los determinantes no triviales son superclaves → **R está en BCNF como está declarada** (y por tanto en 3FN, 2FN y 1FN). *Confirmación formal:* 2FN vacía (PK simple); transitivas vacías (ningún no-clave determina a otro bajo las restricciones declaradas).

### 1.2 FD de negocio (RN-04) — fuera del esquema declarado

RN-04 fija la duración al reservar y la cita ocupa `[inicio_utc, fin_utc)`. En todo estado legal del negocio vale la **invariante**:

- **D2:** `(inicio_utc, duracion_efectiva_min) → fin_utc` (la aplicación escribe `fin := inicio + duración`),
- equivalente **D2′:** `(inicio_utc, fin_utc) → duracion_efectiva_min`.

D2/D2′ **no están garantizadas por ninguna restricción declarada** (los CHK existentes sólo exigen `fin > inicio` y `duracion > 0`; emparejarlos exigiría aritmética de intervalos dentro de un CHECK → dependiente del motor, §1.5.4). Es decir: el esquema **admite instancias** donde la invariante falla, aunque el negocio la exige.

### 1.3 ¿Incumplimiento real de 3FN o BCNF?

| Lente | Determinante | ¿Superclave? | Y primos | Veredicto |
|---|---|---|---|---|
| **Esquema declarado** (sólo restricciones actuales) | todos = `id` | sí | — | **BCNF ✓** (3FN/2FN/1FN ✓) |
| **Modelo de negocio** (con D2/RN-04) | `(inicio_utc, fin_utc)` (o `(inicio, duración)`) | **No** — no determina `id` (citas de distintos profesionales comparten intervalo; cancelada + re-reservada también) | `duracion_efectiva_min` **no es prima** (único atributo primo: `id`) | **3FN ✗ y BCNF ✗ estrictas** |

**Veredicto:** **sí existe incumplimiento formal**, pero *condicionado*: es una **violación de 3FN/BCNF bajo la FD de negocio D2**, no bajo las restricciones declaradas. Técnicamente es el caso clásico de **redundancia derivada**: el subconjunto `{inicio, fin, duración}` tiene **2 grados de libertad** (cualquiera de los tres se deduce de los otros dos) y la tabla almacena **los tres** → exactamente **un canal de redundancia**. La normalización estricta retendría dos y descartaría uno; el modelo aprobado retiene los tres.

### 1.4 Redundancia derivada vs desnormalización justificada

| Concepto | Definición | ¿Se aplica a T7? |
|---|---|---|
| **Redundancia derivada** | Atributo computable a partir de otros atributos **de la misma fila** (D2) | **Sí:** `duracion_efectiva_min = (fin − inicio)`; de forma simétrica, al escribir `fin` se deriva de `(inicio, duración)` |
| **Redundancia por copia (no derivada)** | Atributos ajenos copiados desde otra tabla | **No:** T7 guarda **sólo claves ajenas** (`solicitante_id`, `profesional_id`, `servicio_id`), nunca nombres/estados/duraciones de T1/T3 → sin transitivas clásicas |
| **Desnormalización justificada** | Conservar valor derivado porque lo exige un requisito aprobado o un patrón de acceso, con regla de consistencia explícita | **Sí (candidata a ratificación):** **RN-04** ("duración fijada al reservar": valor **auditable y estable** de la duración acordada) + **patrón de acceso**: listar/validar citas (RF-012…RF-016, RN-02/RN-03) sin joins ni aritmética temporal |

Precisión sobre "información histórica": la duración acordada también queda implícita en `(inicio, fin)` y **explícita en T8** para cambios de fecha; el valor almacenado en T7 aporta el **momento de la reserva como fuente de verdad inmutable** (no se recalcula desde T3/T4, cuya duración puede cambiar después — RN-04 configurable → el snapshot evita que la historia se reescriba). Ése es el fundamento de conservarlo.

### 1.5 Mecanismo de consistencia inicio ↔ fin ↔ duración

1. **Fijación única en la creación (RN-04):** la transacción de reserva escribe `inicio`, `duracion_efectiva_min` (tomada de T3 o T4 vía RN-04) y deriva `fin := inicio + duración` → coherencia **por construcción** en el instante de escritura.
2. **Reprogramación atómica (RN-05/RN-10):** cambiar `inicio` desplaza `fin` por el mismo delta **conservando la duración**; `inicio`, `fin` y (si procede) `duracion` se actualizan en **un solo commit** junto con T8 (historial), T9 (auditoría) y T13 (outbox) → ninguna falla parcial deja valores mezclados. Mismo patrón que la regla ya aprobada de outbox en transacción (RNF-017).
3. **Validación en servidor (agnóstica de motor):** toda escritura verifica `duración > 0 ∧ fin > inicio ∧ fin = inicio + duración` en la capa de servicio; la violación se rechaza **antes** de persistir (RNF-003; servidor manda).
4. **Refuerzo declarativo diferido (detalle técnico):** un CHK equivalente con aritmética de intervalos **depende del motor** → se registra como **detalle técnico diferido para el Paso 07** (tras elegir DBMS). **Sin SQL ahora.**
5. **Detección residual:** el historial T8 conserva `fecha_anterior_utc/fecha_nueva_utc` de cada reprogramación → cualquier desviación histórica es auditable (RF-021/RF-026).

### 1.6 Conclusión O-1

- **No se elimina ningún atributo aprobado** (restrucción respetada).
- **Decisión preliminar humana (conservar) = técnicamente sostenible**, con la calificación formal de §1.3: la tabla está en BCNF *como declarada* y en **3FN/BCNF estrictas violadas sólo bajo la FD de negocio D2**, clasificada como **desnormalización por redundancia derivada justificada en RN-04 + patrón de acceso**, sujeta a los 5 mecanismos de §1.5.
- **Requiere aprobación:** ratificación formal de **O-1-A** (conservar con §1.5); el CHK de §1.5.4 queda como detalle técnico diferido (Paso 07).

## 2. O-2 — Duplicados en `excepcion_disponibilidad` (T6)

### 2.1 Atributos que definen una excepción exactamente duplicada

Universo de T6: `{id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo}` (PK `id`).

| Nivel | Tupla de identidad del hecho | Interpretación |
|---|---|---|
| **E1 — duplicado literal de fila** | `(profesional_id, fecha, tipo, hora_inicio, hora_fin, motivo)` iguales | Copia idéntica de la fila: redundancia evidente |
| **E2 — hecho redundante (recomendado)** | `(profesional_id, fecha, tipo, hora_inicio, hora_fin)` iguales, **independiente de `motivo`** | Mismo hecho de indisponibilidad; `motivo` es **anotación descriptiva** — dos filas con el mismo hecho y motivos distintos siguen representando la **misma excepción** |

**Regla de identidad propuesta: E2**, con `tipo` **incluido**: rangos idénticos con `tipo` distinto (p. ej. `feriado` de día completo + `ausencia` 08:00–12:00) son **hechos distintos y legítimos**. Los valores `NULL` (jornada completa, A-05) se interpretan como un **rango total del día** — `(NULL, NULL)` es un valor de rango identificable, no "sin rango".

### 2.2 Duplicado exacto vs intervalo superpuesto

| | Duplicado exacto | Solapamiento |
|---|---|---|
| Definición | Igualdad de la tupla E2 (mismo instante de inicio **y** fin exactos) | Intersección no vacía de `[hora_inicio, hora_fin)` entre filas: p. ej. 08:00–12:00 ∩ 10:00–14:00 ≠ ∅; o jornada completa (NULL,NULL) vs cualquier rango del día |
| Naturaleza | **Mismo hecho escrito dos veces** → redundancia/anomalía de inserción | **Hechos distintos que se traslapan** en el tiempo |
| ¿Es problema? | **Sí**, es la anomalía O-2 | **No necesariamente:** distintos `tipo` con rangos solapados son legítimos (feriado + bloqueo); incluso el mismo `tipo` con rangos solapados es una descripción válida de indisponibilidad (RN-05 descuenta la **unión** de excepciones, no exige partición) |
| Regla aprobada aplicable | **Ninguna prohíbe duplicados** → añadir límite = decisión de integridad | **Ninguna regla aprobada prohíbe solapes entre excepciones** — a diferencia de **T5/L-01**, donde SÍ se prohíben los solapes de horario |
| Caso límite | Un duplicado exacto **es** un solapamiento con intervalos idénticos **y** mismo `tipo` (subconjunto especial) | — |

**Conclusión clave:** la regla que conviene garantizar es **E2 (no duplicar el mismo hecho)**; **no** debe impedirse el solapamiento de excepciones (rompería escenarios legítimos y no está en requisitos).

### 2.3 Restricciones independientes del motor vs diferidas

**Independientes del motor (especificables ya, sin SQL):**
1. **PK `id`** — ya presente.
2. **Validación transaccional de E2 en el backend:** al dar de alta, la transacción verifica la inexistencia de una fila con la misma tupla E2 (y rechaza si existe). Regla agnóstica, del mismo estilo que las reglas transaccionales de §5 del modelo lógico. **No modifica el modelo aprobado.**
3. **CHKs ya declarados** (`hora_fin > hora_inicio` cuando ambas existen; dominio de `tipo`; A-05 nulidades duales): lógica agnóstica existente.

**Dependientes del motor / a diferir:**
4. **UNIQUE declarativa sobre E2:** su comportamiento con **columnas NULL** (`hora_inicio`, `hora_fin` de jornada completa) **varía según el motor** — el estándar y la mayoría de motores tratan los NULL como distintos en un índice UNIQUE (no detectarían el duplicado de jornada completa justo donde más importa), mientras que otras opciones del mismo motor (p. ej. variantes "NULLS NOT DISTINCT") o distintos motores lo comparan como iguales. Elegir semántica exige **elegir motor (Paso 06) y escribir la restricción física (Paso 07)** → **diferida**.
5. **Alternativa declarativa sin NULLs** (rango total representado sin nulidades, p. ej. columna de modo o centinela): **modificaría A-05 y el modelo aprobado** → requiere autorización explícita; **no propuesta** en este paso.
6. Índices asociados: dependientes del motor → Paso 07.

**Sin SQL ni selección de motor en este paso** (restrucción cumplida).

### 2.4 Conclusión O-2

- Definición de duplicado: **E2** con `tipo` incluido; `motivo` fuera de la identidad.
- Solapamientos **no** se prohíben (no hay regla aprobada; RN-05 usa unión).
- **Preferencia humana "integridad en la BD"** compatible con las reglas aprobadas **en dos fases:** (A) validación transaccional E2 **ya**, sin tocar el modelo; (B) UNIQUE declarativa **diferida al Paso 07** (semántica de NULL según motor), que requerirá además **autorización para modificar T6**.
- **Requiere aprobación:** elegir A (inmediata), A+B (fase 2 tras motor) o sólo A.

## 3. O-3 — Duplicados en `historial_cambio_cita` (T8)

### 3.1 ¿Pueden dos registros con valores de negocio iguales ser eventos legítimos distintos? — **Sí**

Universo de negocio de T8 (excluida la PK `id`): `(cita_id, usuario_id, tipo_cambio, estado_anterior, estado_nuevo, fecha_anterior_utc, fecha_nueva_utc, cambiado_utc, justificacion)`.

| Caso | Por qué es legítimo | ¿Distinguible por valores? |
|---|---|---|
| **C1 — Reprogramaciones cíclicas:** `A→B` se repite tras `B→A→B` | RN-05/RF-021 admiten reprogramaciones sucesivas; el par `(fecha_anterior=A, fecha_nueva=B)` puede ocurrir **varias veces** a lo largo de la vida de la cita | Sólo por `cambiado_utc` (instantes distintos) |
| **C2 — Colisión temporal:** dos eventos reales en el mismo `cambiado_utc` (precisión truncada) | Dos cambios distintos dentro del mismo instante redondeado (concurrencia, mismo usuario) | **No** — tupla idéntica posible |
| **C3 — Evolución de RN-08:** ciclos de estado no previstos hoy | CA-006/RN-08 son controladas por cambios; hoy la máquina no tiene ciclos, pero **la unicidad no puede cimentarse en una regla de negocio evolutiva** | Depende del futuro |
| **C4 — Mismo usuario, misma justificación repetida** | Nada prohíbe que el mismo responsable repita la misma acción con el mismo texto tras un ciclo | Refuerza C1/C2 |

Por tanto: **UNIQUE sobre valores de negocio sería incorrecto** — rechazaría historial legítimo (C1/C2). **La decisión humana de no aprobarlo es técnicamente correcta.**

### 3.2 Duplicación técnica vs repetición legítima

| | Duplicación técnica (anomalía) | Repetición legítima (preservar) |
|---|---|---|
| Qué es | **El mismo evento** escrito más de una vez: reintento de transacción, doble envío del cliente, reejecución at-least-once **sin** un nuevo cambio de negocio | **Ocurrencias distintas** con tupla de negocio idéntica (C1, C2) |
| Huella | **No lleva operación de negocio nueva**: cae dentro de la misma operación lógica que ya registró T8/T9 | **Sí lleva operación nueva**: una transacción de negocio distinta, con su propia fila de auditoría T9 |
| ¿Se distingue por los valores de T8? | **No siempre** (C2 es indistinguible por valores) | **No siempre** (tupla idéntica) |
| ¿Se distingue por el contexto de escritura? | **Sí** — la identidad de la **operación** que originó la escritura | **Sí** — operación distinta |
| Tratamiento | Prevenir (una sola escritura por operación) | **Conservar íntegro** (append-only RN-10/RN-11) |

**Conclusión:** la distinción es **imposible sólo con los atributos de negocio de T8** y **posible con el contexto de operación** → el mecanismo de §3.3 se basa en ese contexto, no en restricciones UNIQUE.

### 3.3 Mecanismo de identificación y trazabilidad propuesto (sin borrar, sin entidades/relaciones nuevas)

- **M-1 — Identidad por PK:** cada evento ya es único por **`id`** (identidad formal del registro). No se elimina ningún registro (RN-10/RN-11 intactos).
- **M-2 — Ancla de trazabilidad en la auditoría (patrón ya aprobado):** T8 se escribe **en la misma transacción** del cambio (regla existente §5) junto con la fila de auditoría **T9** de esa operación (RF-026/RNF-013). Siguiendo la **precisión ya aprobada en el Paso 04** (correlación preferente vía `contexto`), la fila T9 de la operación registra en su atributo aprobado **`contexto` el `id` del evento de historial** correspondiente. Resultado: **1 operación ↔ 1 auditoría ↔ 1 evento**, correlacionados **sin columnas nuevas, sin tablas nuevas, sin relaciones nuevas** (usa sólo atributos existentes y aprobados).
- **M-3 — Prevención de duplicación técnica (backend):**
  1. **Una sola escritura de T8 por transacción de negocio** (ya regla transaccional);
  2. **idempotencia de origen** en T12 para reserva/reprogramación/cancelación (ER-02/RNF-012) → los reintentos reutilizan el resultado **sin** regenerar eventos;
  3. **máquina de estados RN-08** como guarda: una transición sin cambio real (`origen = destino`, o destino no permitido) se rechaza → impide el "cambio_estado" repetido técnico.
- **M-4 — Detección/auditoría de anomalías:** la correlación M-2 permite verificar por auditoría que **cada evento pertenece a una operación distinta**; una eventual coincidencia de `cambiado_utc` (C2) queda resuelta por `id` + operación. *Posibilidad futura (no propuesta):* precisión temporal mayor o identificador de evento — **exigiría modificar T8 aprobado → sólo con autorización**; se registra como posibilidad, no como plan.

### 3.4 Conclusión O-3

- Dos valores iguales **sí** pueden ser eventos distintos legítimos → **sin UNIQUE de negocio** (decisión humana confirmada por la técnica).
- Duplicación técnica y repetición legítima se separan **por el contexto de operación**, no por los valores.
- Mecanismo propuesto: **M-1 (PK) + M-2 (`contexto` de T9 con el id del evento) + M-3 (prevención backend/idempotencia/estados)** — conserva el historial completo.
- **Requiere aprobación:** adopción de M-2+M-3 como mecanismo oficial de trazabilidad/antiduplicación.

## 4. Re-verificación general — 14 tablas: FD/CK vs restricciones de integridad

**Criterio:** una **forma normal** depende sólo de las **dependencias funcionales** (determinantes). Las **restricciones de integridad** (CHK, UNIQUE de negocio, FK, DEF) **no son FD salvo que creen un determinante** (UNIQUE → clave candidata) o expresen una invariante funcional no garantizada (caso D2 de T7).

| Tabla | PK | CK adicionales (por UNIQUE) | FD determinantes efectivas | Lo que **NO** es FD (y por qué no altera la FN) | FN |
|---|---|---|---|---|---|
| T1 usuario | `id` | `correo` | `id → resto`; `correo → id` | CHK de `rol`/`estado`: dominio, no determinan valores ajenos | **BCNF** |
| T2 profesional | `id` | `usuario_id` | `id → resto`; `usuario_id → id` | CHK `estado ↔ desactivado_utc`: nulidad condicional (2 inactivas pueden tener instantes distintos) | **BCNF** |
| T3 servicio | `id` | — | `id → resto` | `nombre` no UNIQUE → no es determinante | **BCNF** |
| T4 asociación | `(prof. id, servicio id)` | la PK | par completo → `duracion_especifica, estado, registrado_utc, baja_utc` | CHK `estado ↔ baja_utc`: condicional; **sin parciales** (todo depende del par: 2FN) | **BCNF** |
| T5 horario | `id` | `(prof., día, hora_inicio)` | `id → resto`; tripleta → `id, hora_fin` | UNIQUE de dedup (L-01): crea CK, compatible con BCNF; solapes entre filas: **no-FD** (entre filas) → transaccional | **BCNF** |
| T6 excepción | `id` | — | `id → resto` | CHK A-05 duales: dominio; **falta CK de E2** → anomalía O-2 (integridad, **no** forma normal) | **BCNF** (O-2 aparte) |
| T7 cita | `id` | — | `id → resto` **+ D2 de negocio** | CHK `fin > inicio`, `duracion > 0`: no garantizan D2; FK guardan **sólo claves** (sin transitivas a T1/T3) | **BCNF declarada; 3FN/BCNF estrictas ↔ O-1 (D2)** |
| T8 historial | `id` | — | `id → resto` | CHKs de `tipo_cambio` → nulidades: condicionales; **falta unicidad técnica** → O-3 (integridad, no FN) | **BCNF** |
| T9 auditoría | `operacion_id` | — | `operacion_id → resto` | `cita_id` FK 0..1: no determinante; `contexto`: sin secretos (RNF-026) | **BCNF** |
| T10 notificación | `id` | — | `id → resto` | `instantanea_datos`: desnormalización **aprobada A-04**, no FD entre claves ajenas | **BCNF** |
| T11 parámetro | `clave` | la PK | `clave → valor, descripcion, modificado_por, modificado_utc` | `valor` no UNIQUE → no determinante | **BCNF** |
| T12 idempotencia | `clave` | la PK | `clave → resto` | Equivalencia de solicitudes: **decisión transaccional** (ER-02), no FD declarada | **BCNF** |
| T13 outbox | `id` | — | `id → resto` | CHK `estado`→`procesado_utc`: condicional; `carga`: patrón outbox aprobado (RNF-017) | **BCNF** |
| T14 restablecimiento | `id` | — | `id → resto` | CHK de estado de un solo uso: ciclo de vida (OD-02), no FD; correlación con T9 vía `contexto`: regla de escritura, no FD | **BCNF** |

**Síntesis de la verificación general:**
1. **13/14 en BCNF** con FD y CK explícitas; **T7 en BCNF declarada** con la FD de negocio D2 pendiente de ratificación (O-1).
2. Ningún CHK condicional se ha confundido con FD; las **UNIQUE sí crean CK** y por eso son compatibles con BCNF; las **FK evitan transitivas** al guardar sólo identificadores (efecto clásico 3FN).
3. O-2 y O-3 son **anomalías de integridad/inserción**, **no** incumplimientos de forma normal — se mantienen separadas, sin resolver en este informe.
4. Desnormalizaciones vigentes: D-1 (T7, **pendiente de ratificación**), D-2 (T10, A-04 aprobada), D-3 (T13, patrón aprobado).

## 5. Decisiones que aún requieren aprobación humana

| # | Decisión solicitada | Opción recomendada | Alcance del cambio |
|---|---|---|---|
| **D-05a (O-1)** | Ratificar **conservar** `duracion_efectiva_min` como desnormalización justificada (RN-04 + patrón de acceso) con los 5 mecanismos de consistencia de §1.5; CHK de aritmética como detalle diferido (Paso 07) | **Sí (A)** | Ninguna modificación de modelo |
| **D-05b (O-2)** | Mecanismo anti-duplicados en T6: **(A)** validación transaccional E2 inmediata; **(B)** añadir UNIQUE declarativa E2 **diferida al Paso 07** (semántica NULL según motor) | **A + B diferida** | A: no modifica modelo; **B: sí modificaría T6 → autorización explícita en el Paso 07** |
| **D-05c (O-3)** | Adoptar **M-2 + M-3** (correlación vía `contexto` de T9 + prevención backend) y **confirmar el rechazo** de UNIQUE sobre valores de negocio del historial | **Sí** | Ninguna modificación de modelo |
| OD-01 / OD-02 | (Heredadas, no bloqueantes) valor de anticipación mínima; canal seguro de contraseñas temporales | — | Pendientes vigentes |

**Detalles técnicos diferidos (no requieren aprobación humana ahora):** CHK de coherencia `fin = inicio + duración` (Paso 07, dependiente de motor) · TTL de idempotencia (Paso 12) · tipado/enums/longitudes (Paso 06) · semántica NULL de la UNIQUE de T6 (Pasos 06/07) · mecanismo de equivalencia ER-02 (backend).

## 6. Verificaciones de esta revisión

1. **Modelos aprobados intactos:** `modelo_logico.md` (Paso 04), `modelo_conceptual.md` y `diagrama_er.md` (Paso 03) **no modificados**; requisitos RF/RNF/RN/CA intactos (29/30/16/15); decisiones humanas previas sin alterar.
2. **14 tablas y R1–R16 sin cambios**; **ningún atributo eliminado**; **ninguna entidad ni relación introducida**; **ningún registro eliminado**.
3. **Sin SQL, sin código, sin migraciones, sin selección de motor, sin infraestructura; no se avanzó al Paso 06.**
4. Evidencia previa: `proyecto/03_resultados/evidencia_pre_revision_o1_o2_o3/informe_normalizacion.md`.

---

**Estado:** **APROBADO (9 de octubre de 2026)** — D-05a, D-05b y D-05c aprobadas y registradas en `proyecto/04_decisiones/decisiones_paso05_d05a_d05c.md`. **HUMAN_STATUS: APPROVED_STEP_05** — continuidad autorizada hacia el Paso 06.
