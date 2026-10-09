# Modelo lógico de datos
## Sistema Web de Gestión de Citas y Atención Virtual

**Workflow:** `02_database_workflow` — Paso 04 (modelo lógico).
**Skill:** `database-schema-designer`.
**Fecha:** 8 de octubre de 2026.
**Entradas aprobadas:** `requisitos_datos.md` (Paso 01), `modelo_conceptual.md` + `diagrama_er.md` (Paso 02/03 **aprobados**, con A-01…A-05 y ER-01…ER-05), decisiones OD-01…OD-04, ADR-001, RF/RNF/RN/CA vigentes.
**Restricción:** documento lógico agnóstico de motor; **sin SQL, sin migraciones, sin código, sin selección de motor, sin infraestructura**. El Paso 05 (normalización) y el Paso 06 (motor) **no están autorizados**.

---

## 1. Convenciones

- **Notación:** `PK` clave primaria · `FK→tabla` clave foránea · `UNIQUE` unicidad · `NOT NULL` obligatoriedad · `CHK[condición]` restricción de dominio. Todo en notación lógica; no es SQL.
- **Tipos genéricos** (el mapeo a tipos de motor se hace en el Paso 06): `entero`, `texto`, `texto_largo`, `enum_texto`, `fecha`, `hora_local`, `instante_utc`.
- **Temporalidad:** instantes en **UTC** (RNF-028); horarios y excepciones en **hora local** `America/La_Paz` (RN-15). La fecha de una cita se **deriva** del inicio en UTC — sin columna `fecha` en `cita` (**A-02**).
- **14 tablas** = 14 entidades aprobadas (E1…E14). Sin tablas nuevas; cualquier ampliación exige aprobación humana.
- **Política de borrado:** todas las FK usan **RESTRICT/NO ACTION** (RN-11: sin eliminación física de historial; RF-004: desactivar ≠ eliminar). Ningún borrado en cascada.

## 2. Tablas

### T1. `usuario` (E1)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| nombre_completo | texto | NOT NULL |
| correo | texto | NOT NULL, **UNIQUE** (CA-001) |
| hash_contrasena | texto | NOT NULL (RNF-002: solo hash; RNF-029 longitud ≥ 12 en aplicación) |
| rol | enum_texto | NOT NULL, CHK[rol ∈ {solicitante, profesional, administrador}] (V-01) |
| estado | enum_texto | NOT NULL, CHK[estado ∈ {activo, inactivo}], DEF[activo] |
| creado_utc / actualizado_utc | instante_utc | NOT NULL |

### T2. `profesional` (E2)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| usuario_id | entero | **FK→T1.id**, NOT NULL, **UNIQUE** (R1: 1:0..1), RESTRICT (RF-004, RN-11) |
| datos_exhibicion | texto | NULL |
| estado | enum_texto | NOT NULL, CHK[∈ {activo, inactivo}] |
| desactivado_utc | instante_utc | NULL, CHK[(estado=activo ∧ desactivado_utc NULL) ∨ (estado=inactivo ∧ desactivado_utc NOT NULL)] |

### T3. `servicio` (E3)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| nombre | texto | NOT NULL |
| descripcion | texto | NULL |
| duracion_minutos | entero | NOT NULL, CHK[> 0] (RN-04, configurable por administrador) |
| estado | enum_texto | NOT NULL, CHK[∈ {activo, inactivo}] |

### T4. `asociacion_profesional_servicio` (E4) — R5 (N:M)
| Columna | Tipo | Restricciones |
|---|---|---|
| profesional_id | entero | **PK** parte, **FK→T2.id**, NOT NULL, RESTRICT |
| servicio_id | entero | **PK** parte, **FK→T3.id**, NOT NULL, RESTRICT |
| duracion_especifica | entero | NULL, CHK[> 0] — prioridad sobre la general (RN-04) |
| estado | enum_texto | NOT NULL, CHK[∈ {activa, inactiva}], DEF[activa] |
| registrado_utc | instante_utc | NOT NULL |
| baja_utc | instante_utc | NULL, CHK[estado=activa ∧ baja_utc NULL ∨ estado=inactiva ∧ baja_utc NOT NULL] |

- **PK compuesta `(profesional_id, servicio_id)` = unicidad del par** (RN-16, ER-05): una sola fila por par; desactivación/reactivación son transiciones de estado **sin eliminación física** y **sin tabla de historial** (fuera de alcance, ER-05).
- **Sin FK desde `cita`** (A-01): RN-16 se valida en la transacción de crear/reprogramar (§6).

### T5. `horario_habitual` (E5) — R6
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| profesional_id | entero | **FK→T2.id**, NOT NULL, RESTRICT |
| dia_semana | enum_texto | NOT NULL, CHK[día ∈ {lun…dom}] |
| hora_inicio / hora_fin | hora_local | NOT NULL, CHK[hora_fin > hora_inicio] (RN-15: hora local) |
| — | — | **UNIQUE(profesional_id, dia_semana, hora_inicio)** (deduplicación exacta) |

### T6. `excepcion_disponibilidad` (E6) — R7
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| profesional_id | entero | **FK→T2.id**, NOT NULL, RESTRICT |
| fecha | fecha | NOT NULL (día local, RN-15) |
| hora_inicio / hora_fin | hora_local | NULL — **CHK[(ambas NULL) ∨ (ambas NOT NULL ∧ hora_fin > hora_inicio)]** (**A-05**: jornada completa vs rango) |
| tipo | enum_texto | NOT NULL, CHK[∈ {ausencia, feriado, bloqueo}] |
| motivo | texto | NULL |

### T7. `cita` (E7) — R2, R3, R4
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| solicitante_id | entero | **FK→T1.id**, NOT NULL, RESTRICT (R2, RN-01) |
| profesional_id | entero | **FK→T2.id**, NOT NULL, RESTRICT (R3, RN-01) |
| servicio_id | entero | **FK→T3.id**, NOT NULL, RESTRICT (R4, RN-01) |
| inicio_utc / fin_utc | instante_utc | NOT NULL, CHK[fin_utc > inicio_utc] (RN-01) — **sin columna `fecha`** (A-02) |
| duracion_efectiva_min | entero | NOT NULL, CHK[> 0] — fijada al reservar (RN-04) |
| estado | enum_texto | NOT NULL, DEF[Confirmada], CHK[∈ {Confirmada, En atención, Atendida, Cancelada, No asistida}] (RN-08, V-01; bloquean intervalo: Confirmada/En atención — **A-03**) |
| justificacion_cambio | texto | NULL — obligatoriedad según RN-14 **transaccional** (§5) |
| creado_utc / actualizado_utc | instante_utc | NOT NULL |

- **Sin FK a `asociacion_profesional_servicio`** (A-01/ER-05): la cita conserva el par (profesional_id, servicio_id) + duración efectiva como trazabilidad; RN-16 se valida en transacción.

### T8. `historial_cambio_cita` (E8) — R8, R13
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| cita_id | entero | **FK→T7.id**, NOT NULL, RESTRICT (R8) |
| usuario_id | entero | **FK→T1.id**, NOT NULL, RESTRICT (R13, ER-01: responsable NO NULO) |
| tipo_cambio | enum_texto | NOT NULL, CHK[∈ {cambio_estado, reprogramacion}] |
| estado_anterior / estado_nuevo | enum_texto | NULL/NULL — CHK[tipo=cambio_estado → estado_nuevo NOT NULL] |
| fecha_anterior_utc / fecha_nueva_utc | instante_utc | NULL — CHK[tipo=reprogramacion → fecha_nueva_utc NOT NULL] |
| cambiado_utc | instante_utc | NOT NULL |
| justificacion | texto | NULL (RN-14 la exige en ciertos casos → transaccional) |

- **Append-only** (RN-10/RN-11): sin UPDATE/DELETE → regla transaccional (§5). La reprogramación no altera el estado de la cita (V-01).

### T9. `auditoria_operacion` (E9) — R12, R14
| Columna | Tipo | Restricciones |
|---|---|---|
| operacion_id | entero | **PK** (correlación de operación) |
| usuario_id | entero | **FK→T1.id**, NOT NULL, RESTRICT (R14, ER-01) |
| cita_id | entero | **FK→T7.id**, **NULL** (R12, ER-04: 0..1 cita; RESTRICT) |
| tipo_operacion | enum_texto | NOT NULL — valores base: reserva, reprogramacion, cancelacion, cambio_estado, restablecimiento_password (ver **L-04**) |
| fecha_hora_utc | instante_utc | NOT NULL |
| resultado | enum_texto | NOT NULL, CHK[∈ {exito, fallo}] (RF-026, RNF-013) |
| contexto | texto | NULL — **CHK/validación: sin contraseñas ni secretos** (RNF-026, transaccional) |

- Una fila = **una operación**, que referencia a lo sumo una cita o ninguna (ER-04). **Append-only** (§5).

### T10. `notificacion` (E10) — R9, R10
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| destinatario_id | entero | **FK→T1.id**, NOT NULL, RESTRICT (R10, RF-028) |
| cita_id | entero | **FK→T7.id**, NOT NULL, RESTRICT (R9) |
| evento | enum_texto | NOT NULL, CHK[∈ {confirmada, reprogramada, cancelada}] |
| instantanea_datos | texto_largo | NOT NULL — copia de los datos en el momento del evento (**A-04**) |
| generado_utc | instante_utc | NOT NULL |

- **Sin estado de lectura** (OD-03). Generación desacoplada vía outbox (§5, RNF-017).

### T11. `parametro_operativo` (E11) — R15
| Columna | Tipo | Restricciones |
|---|---|---|
| clave | texto | **PK** |
| valor | texto | NOT NULL |
| descripcion | texto | NULL |
| modificado_por | entero | **FK→T1.id**, NOT NULL, RESTRICT (R15, ER-01) |
| modificado_utc | instante_utc | NOT NULL |

- Claves previstas (OD-01/RN-12): `anticipacion_minima_reservar` (**sin valor aprobado**), `anticipacion_minima_reprogramar` (2 h), `anticipacion_minima_cancelar` (2 h). Sin filas semilla hasta aprobación (Paso 15+).

### T12. `clave_idempotencia` (E12) — sin relación R# formal
| Columna | Tipo | Restricciones |
|---|---|---|
| clave | texto | **PK** (única global — RNF-012) |
| usuario_sesion | entero | **FK→T1.id**, NOT NULL (ER-02: identidad del solicitante) |
| tipo_operacion | enum_texto | NOT NULL (CHK[∈ {reserva, reprogramacion, cancelacion}]) |
| solicitud_original | texto | NOT NULL — datos de la petición original (ER-02) |
| resultado | texto | NOT NULL — respuesta confirmada reutilizable |
| creada_utc / caduca_utc | instante_utc | NOT NULL, CHK[caduca_utc > creada_utc] |

- Equivalencia, rechazo por conflicto y reutilización de resultado → **transaccional** (§5, ER-02/RNF-012/CA-007). TTL sin valor → **L-03**.

### T13. `evento_outbox` (E13) — R16
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| correlacion_id | texto | NOT NULL (trazabilidad evento↔operación — ER-03) |
| tipo_evento | enum_texto | NOT NULL, CHK[∈ {cita_confirmada, cita_reprogramada, cita_cancelada}] |
| cita_id | entero | **FK→T7.id**, **NULL** (R16, ER-03: evento → 0..1 cita; RESTRICT) |
| carga | texto_largo | NOT NULL |
| estado | enum_texto | NOT NULL, DEF[pendiente], CHK[∈ {pendiente, procesado}] |
| intentos | entero | NOT NULL, DEF[0], CHK[≥ 0] |
| creado_utc / procesado_utc | instante_utc | NOT NULL / NULL |

- Escritura **en la misma transacción** que la cita → **transaccional** (§5, RNF-017/CA-012).

### T14. `restablecimiento_contrasena` (E14) — R11
| Columna | Tipo | Restricciones |
|---|---|---|
| id | entero | **PK** |
| usuario_id | entero | **FK→T1.id**, NOT NULL, RESTRICT (R11, RF-029) |
| hash_temporal | texto | NOT NULL (nunca texto plano; RF-029/RNF-030) |
| caduca_utc | instante_utc | NOT NULL (caducidad configurable — OD-02) |
| estado | enum_texto | NOT NULL, DEF[pendiente], CHK[∈ {pendiente, usado, caducado}] |
| creado_utc | instante_utc | NOT NULL |
| auditoria_ref | entero | **FK→T9.operacion_id**, NULL — **pendiente de formalización (L-02)** |

- Un solo uso, cambio obligatorio de contraseña y canal seguro → **transaccional** (§5, RNF-030/OD-02).

## 3. Mapeo de relaciones R1…R16 → restricciones

| R | De → A | Implementación lógica | Obligatoriedad |
|---|---|---|---|
| R1 | usuario → profesional | T2.usuario_id FK + UNIQUE | NOT NULL |
| R2 | usuario → cita (solicitante) | T7.solicitante_id FK | NOT NULL |
| R3 | profesional → cita | T7.profesional_id FK | NOT NULL |
| R4 | servicio → cita | T7.servicio_id FK | NOT NULL |
| R5 | profesional ↔ asociación ↔ servicio | T4 PK compuesta + 2 FK | NOT NULL |
| R6 | profesional → horario | T5.profesional_id FK | NOT NULL |
| R7 | profesional → excepción | T6.profesional_id FK | NOT NULL |
| R8 | cita → historial | T8.cita_id FK | NOT NULL |
| R9 | cita → notificación | T10.cita_id FK | NOT NULL |
| R10 | usuario → notificación | T10.destinatario_id FK | NOT NULL |
| R11 | usuario → restablecimiento | T14.usuario_id FK | NOT NULL |
| R12 | cita → auditoría | T9.cita_id FK | **NULL (0..1)** |
| R13 | usuario → historial (responsable) | T8.usuario_id FK | NOT NULL |
| R14 | usuario → auditoría (responsable) | T9.usuario_id FK | NOT NULL |
| R15 | usuario → parámetro (modificador) | T11.modificado_por FK | NOT NULL |
| R16 | cita → evento outbox | T13.cita_id FK | **NULL (0..1)** |

**Cobertura:** 16/16 relaciones; 14/14 tablas con PK; ninguna FK en cascada.

## 4. Matriz de trazabilidad (requisito → tablas/restricciones)

| Regla / requisito | Expresión en el modelo lógico | Tablas |
|---|---|---|
| RN-01 | FKs NOT NULL en cita + CHK fin > inicio | T7 |
| RN-02/RN-03 | Disponibilidad y exclusión de solapes → **transaccional** (§5); estado bloqueante en dominio de `cita.estado` (A-03) | T7, T5, T6 |
| RN-04 | `duracion_efectiva_min` NOT NULL; `duracion_especifica` opcional con prioridad | T7, T4, T3 |
| RN-05 | Disponibilidad = horarios ∖ excepciones ∖ citas → consultas; FKs RESTRICT | T5, T6, T7 |
| RN-06 | Cancelación libera por estado, sin borrado | T7 |
| RN-08 | CHK de dominio de estados + DEF Confirmada; transiciones → T8 | T7, T8 |
| RN-09 | Verificación concurrente → **transaccional** (§5) | T7 |
| RN-10/RN-11 | Append-only de T8/T9; FKs RESTRICT; sin borrado físico | T8, T9, T7 |
| RN-12/RN-13 | Parámetros como filas con clave; permisos → aplicación | T11 |
| RN-14 | Justificación: columna NULL + validación de obligatoriedad → **transaccional** | T7, T8 |
| RN-15/RNF-028 | Instantes UTC vs hora local en horarios/excepciones; fecha de cita derivada (A-02) | T5, T6, T7 |
| RN-16 | Par (profesional_id, servicio_id) único en T4 con estado; **validación en transacción** sin FK (A-01) | T4, T7 |
| RF-001/002/029, RNF-002/029 | Hash NOT NULL, correo UNIQUE | T1 |
| RF-003/004, RF-006 | FK único usuario→profesional; asociación con estado | T2, T4 |
| RF-007/008 | Horarios y excepciones con CHK de intervalo (A-05) | T5, T6 |
| RF-012…020 | Atributos de cita y estados | T7 |
| RF-021/022, CA-006 | Historial append-only con responsable | T8 |
| RF-024, RNF-017, CA-012 | Notificación con instantánea (A-04) + outbox en transacción | T10, T13 |
| RF-025, CA-004/005 | Parámetros configurables con modificador | T11 |
| RF-026, RNF-013/026 | Auditoría con usuario, fecha, resultado; contexto sin secretos | T9 |
| RF-028 | Destinatario NOT NULL en notificación | T10 |
| RF-029, RNF-030, CA-015 | Restablecimiento con hash, caducidad, estado de un solo uso | T14 |
| RNF-012, CA-007 | PK única de clave; equivalencia/conflicto → transaccional | T12 |
| RNF-003 | Autorización en servidor → aplicación | (todas) |
| CA-001 | UNIQUE correo | T1 |
| CA-002/003 | Asociación activa validada en transacción; histórico intacto | T4, T7 |
| CA-007 | Reintento reutiliza resultado sin duplicar → transaccional | T12 |
| CA-014 | Zona institucional America/La_Paz | T5, T6 |

## 5. Restricciones representables vs mecanismos transaccionales

**Representables en el modelo lógico (§2):** PK, FK + RESTRICT, UNIQUE (correo, usuario_id de profesional, PK de asociación, clave de idempotencia, dedup de horario), NOT NULL, CHK de dominios/estados, CHK de intervalos (fin > inicio, hora_fin > hora_inicio, caducidad > creación, nulidades condicionales de excepción/asociación), valores por defecto de estado.

**Requerirán mecanismos transaccionales o de aplicación (Pasos 11/12/07+, NO resueltos aquí):**

| Regla | Motivo | Dónde se resolverá |
|---|---|---|
| RN-03 exclusión de solapes (Confirmada/En atención) | Sin restricción estándar agnóstica de motor | Paso 12 (índice de exclusión/verificación) con `database-specialist` |
| RN-09 reservas concurrentes (15 % de la carga) | Bloqueo/serialización | Paso 12 (estrategia de concurrencia) |
| RN-16 asociación activa al crear/reprogramar | Validación temporal, sin FK (A-01) | Backend (Paso 07+) |
| RN-14 justificación obligatoria fuera de plazo | Depende del estado anterior y del plazo | Backend + T8 |
| RN-10/RN-11 append-only de T8/T9 | Sin UPDATE/DELETE | Permisos de tabla + aplicación |
| RN-12/13 permisos de administrador | Autorización | Servidor (RNF-003) |
| RNF-012 equivalencia/conflicto de idempotencia | Comparación de solicitudes | Backend (ER-02) |
| RNF-017 outbox en la misma transacción que la cita | Patrón transaccional | Backend (Paso 07+) |
| RNF-026 sin secretos en contexto/logs | Validación de contenido | Aplicación |
| A-04 escritura de instantánea al evento | Generación en el momento del evento | Backend |
| OD-02 un solo uso + cambio obligatorio de contraseña | Ciclo de vida de estado | Backend |

## 6. Verificación de reglas de negocio en el modelo lógico

- **RN-01…RN-16:** todas mapeadas en §4; las no estáticas están clasificadas en §5 (ninguna omitida).
- **Integridad profesional–servicio (ítem 7 de la autorización):** T4 PK compuesta impide pares duplicados; `duracion_especifica` con prioridad (RN-04); RN-16 validado en transacción sin FK en T7 (A-01/ER-05); desactivación/reactivación sin borrado ni historiales nuevos.
- **Reservas concurrentes:** sin solución en este paso; registrada en §5 para el Paso 12.
- **Historial:** T8 append-only con responsable NOT NULL (R13) y estados con CHK condicional.
- **Auditoría:** T9 append-only, responsable NOT NULL (R14), cita opcional 0..1 (R12/ER-04), resultado obligatorio.
- **Idempotencia:** T12 con PK global, solicitante NOT NULL, solicitud original y resultado; comportamiento de conflicto/reuso → §5.
- **Outbox:** T13 con correlación, cita opcional (R16/ER-03), estados e intentos; escritura atómica con la cita → §5.

## 7. Observaciones que requieren decisión humana

| # | Observación | Alternativa recomendada | Impacto |
|---|---|---|---|
| **L-01** | ¿Varios intervalos de horario por día de la semana (p. ej. mañana/tarde)? RF-007 no lo aclara | **A (recomendada): permitir varios** intervalos por día; UNIQUE solo deduplica el inicio exacto | Restringir (alternativa B: UNIQUE(profesional, día)) exigiría decisión de alcance |
| **L-02** | Formalizar `restablecimiento_contrasena.auditoria_ref` → `auditoria_operacion` como **relación R17** en el modelo conceptual/diagrama (hoy es FK propuesta en T14) | **A (recomendada): sí como FK nullable**, añadiendo R17 a §3 de `modelo_conceptual.md` y al diagrama | Toca documentos aprobados del Paso 03 → requiere autorización |
| **L-03** | Caducidad (TTL) de las claves de idempotencia: sin valor aprobado | **A: aprobar un valor de diseño en el Paso 12**; B: nueva clave en `parametro_operativo` (ampliaría RN-12/RF-025 → alcance) | No asumir hasta decisión |
| **L-04** | Conjunto de `tipo_operacion` en T9: el modelo conceptual usa lista abierta ("…") | **A (recomendada): texto validado en aplicación** con los 5 valores base, extensible sin cambiar el esquema; B: catálogo como tabla nueva (excedería las 14 entidades) | Menor; decisión de diseño |

**Pendientes no bloqueantes heredados (vigentes):** valor de anticipación mínima para reservar (OD-01); canal seguro de entrega de contraseñas temporales (OD-02).

**Diferida por depender del motor (Paso 06, no es decisión humana ahora):** tipado final de identificadores (`entero` vs `texto` de correlación), representación de `enum_texto` (CHECK vs catálogo nativo) y longitudes exactas.

## 8. Verificaciones de consistencia

1. **14/14 tablas** = 14 entidades aprobadas; sin tablas nuevas.
2. **16/16 relaciones R1…R16** mapeadas (§3); R12 y R16 con FK **NULL** (0..1) conforme a ER-04/ER-03.
3. **Cada tabla tiene PK**; toda FK tiene RESTRICT/NO ACTION; sin borrados en cascada (RN-11).
4. Trazabilidad RF/RNF/RN/CA completa (§4); requisitos y decisiones **sin modificar**.
5. Coherencia con **A-01…A-05** (sin FK de cita a asociación; sin columna fecha; estados bloqueantes; instantánea; excepciones duales), **ER-01…ER-05** (responsables NO NULO; idempotencia; correlación; R12 refinada; PK compuesta) y **ADR-001** (una única BD relacional).
6. **Sin SQL, sin migraciones, sin código, sin motor, sin infraestructura, sin instalación de herramientas.**
7. Pendientes OD-01/OD-02 documentados; nuevas observaciones L-01…L-04 **sin resolver unilateralmente**.

---

**Estado del paso:** completado y presentado. **HUMAN_STATUS: PENDING_STEP_04_APPROVAL** — revisión humana del modelo lógico y de las observaciones L-01…L-04; **no avanzar al Paso 05** (normalización) sin autorización.
