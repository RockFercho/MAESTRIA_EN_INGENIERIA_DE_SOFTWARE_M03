# Integridad — MySQL 8.0.46 / InnoDB — Paso 08

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 08 (Integridad), motor D-06/D-06-R1 (MySQL 8.0.46/InnoDB).
**Skills:** `database-schema-designer` + `databases` · **Fecha:** 9 de octubre de 2026.
**Entradas:** `modelo_fisico.md` (Paso 07), `modelo_logico.md` (aprobado), `revision_complementaria_o1_o2_o3.md` (D-05a/b/c), decisiones L-01/L-02/L-04, D-06.
**Restricción:** documentación de restricciones **sin SQL ejecutable**; verificación de soporte de expresiones con la versión local antes de ejecutar (instrucción 10).

## 1. Inventario de restricciones (por tipo)

### 1.1 Claves primarias
14/14 tablas: `id INT AUTO_INCREMENT` en 12 tablas; **PK compuesta** `(profesional_id, servicio_id)` en T4 (R5/ER-05); **PK natural** `clave VARCHAR(100)` en T11 y T12 (RNF-012 exige unicidad global de la clave de idempotencia).

### 1.2 Claves foráneas (todas **`ON DELETE RESTRICT`, sin CASCADE** — RN-11/RF-004)
**18 FK** (conteo verificado 2026-10-09 en `modelo_logico.md` y `modelo_fisico.md`, desglose idéntico): T2.usuario_id→T1 · T4×2→T2,T3 · T5,T6.profesional_id→T2 · T7×3→T1,T2,T3 · T8×2→T7,T1 · T9×2→T1,T7 · T10×2→T1,T7 · T11.modificado_por→T1 · T12.usuario_sesion→T1 · T13.cita_id→T7 · T14.usuario_id→T1 (8→T1, 4→T2, 2→T3, 4→T7). Obligatoriedad: **16 NN**; **2 NULL** en T9.cita_id (R12) y T13.cita_id (R16) — 0..1 aprobados (ER-04/ER-03).

### 1.3 Unicidades (UQ)
| Tabla | Columnas | Origen |
|---|---|---|
| T1 | `correo` | CA-001 |
| T2 | `usuario_id` | R1 (1:0..1) |
| T4 | PK compuesta | R16/ER-05 (una fila por par) |
| T5 | `(profesional_id, dia_semana, hora_inicio)` | L-01 (deduplicación exacta) |
| T6 | **índice único funcional E2** (§3) | D-05b + MySQL |
| T11, T12 | `clave` (PK) | RN-12/RNF-012 |

### 1.4 Restricciones de dominio (CHECK, efectivas en MySQL 8.0.16+)
- Dominios cerrados con `IN (…)`: rol, estados (T1–T4, T7, T10, T13, T14), día (T5), tipo de excepción (T6), tipo de evento (T10, T13), tipo de cambio (T8), resultado de auditoría (T9), tipo de operación de T12, intentos ≥ 0, duraciones > 0, `fin_utc > inicio_utc`, `hora_fin > hora_inicio`, `caduca_utc > creada_utc`.
- **Nulidades condicionales** (A-05/T4/T8): expresadas como booleanos compuestos, p. ej. T6: `(hora_inicio IS NULL AND hora_fin IS NULL) OR (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_fin > hora_inicio)`.
- **T9.tipo_operacion: SIN CHECK** (L-04: catálogo validado en aplicación, extensible sin cambio de esquema; 5 valores: reserva, reprogramacion, cancelacion, cambio_estado, restablecimiento_password). **T12.tipo_operacion: CON CHK** de 3 valores (reserva/reprogramacion/cancelacion) — columnas distintas, dominios distintos, coherentes en ambos modelos.

**Total verificado (2026-10-09): 27 restricciones CHECK declarativas** en filas de tabla — **27 en `modelo_logico.md` = 27 en `modelo_fisico.md`, correspondencia 1:1 por tabla** (T1:2, T2:2, T3:2, T4:3, T5:2, T6:2, T7:3, T8:3, T9:1, T10:1, T11:0, T12:2, T13:3, T14:1). La cifra **39** equivale al número de **líneas** que mencionan CHK/CHECK en `modelo_logico.md` (incluye narrativa de §4–§7 y tablas de trazabilidad), **no** restricciones. Fuera de las 27: T9.tipo_operacion (L-04, sin CHECK), T9.contexto (validación transaccional, no expresable como CHK de fila) y la CHK transversal de duración (D-05a, **condicional y pendiente de verificación empírica** — Paso 15).

### 1.5 Valores por defecto
`DEF` sólo donde el modelo lógico los declara: rol/estado T1, estado T4/T7/T13/T14, intentos 0. Ningún DEF adicional introducido.

## 2. Reglas de negocio vinculadas a restricciones

| Regla | Mecanismo en MySQL/InnoDB |
|---|---|
| RN-01 cita válida | FKs NN + CHK `fin > inicio` + CHK duración > 0 |
| RN-03/RN-09 sin solapes de reserva | **No existe restricción UNIQUE que lo impida — por diseño** (ninguna clave única cubre rangos solapados): estrategia transaccional de bloqueo en **Paso 12** |
| RN-04 duración | `duracion_efectiva_min` NN + §4 |
| RN-05/L-01 horarios | CHK por fila + UQ de dedup; solapes entre filas → validación transaccional (Paso 12, alta de horario) |
| RN-06/RN-08 estados | CHK de dominio + transiciones validadas en backend (máquina RN-08) |
| RN-10/RN-11 append-only | T8/T9: **privilegios de sólo-inserción** (Paso 09) + backend sin UPDATE/DELETE |
| RN-12/RN-13 administración | T11 con PK y R15; permisos → servidor (RNF-003) |
| RN-14 justificación | Columna NULL + obligatoriedad según estado/plazo → transaccional (backend) |
| RN-16 asociación activa | Sin FK desde T7 (A-01); verificación dentro de la transacción de reserva (Paso 12) |
| RF-026/RNF-013/030 auditoría | T9 NN usuario/fecha/resultado; escritura atómica con la operación (Paso 12) |
| Correlación restablecimiento↔auditoría | Mismo commit T14+T9; **`contexto` de T9 con el id del restablecimiento** (precisión D-06/Paso 04: mecanismo principal) |

## 3. Duplicados exactos en T6 (E2) — solución compatible con MySQL (D-05b)

**Problema:** en MySQL, `UNIQUE` trata los **NULL como distintos** → una UNIQUE clásica sobre `(profesional_id, fecha, tipo, hora_inicio, hora_fin)` **no detectaría** duplicados de jornada completa (`hora_inicio/hora_fin = NULL`, A-05).

**Solución en dos capas (sin modificar el modelo aprobado):**
1. **Capa primaria — validación transaccional en la lógica de negocio (D-05b-A, ya aprobada):** en la transacción de alta, buscar existencia con comparación **NULL-segura** (operador `<=>` de MySQL) sobre la tupla `(profesional_id, fecha, tipo, hora_inicio <=> ?, hora_fin <=> ?)`; si existe → rechazo. Esta capa cubre **todos** los casos, incluida jornada completa.
2. **Capa de refuerzo declarativo — índice único funcional NULL-seguro:** índice único sobre **expresión** que normalice los NULL a un centinela, p. ej. concatenación `profesional_id|fecha|tipo|IFNULL(hora_inicio,'D')|IFNULL(hora_fin,'D')` (funcionalidades disponibles en MySQL **8.0.13+**, por tanto en la versión objetivo **8.0.46**). La expresión **nunca evalúa a NULL** → el índice único **sí** detecta duplicados de jornada completa. Se materializa en el Paso 15 (con autorización).
3. **No se prohíben solapamientos legítimos** (D-05b: distintos `tipo` o rangos que se traslapan siguen permitidos; RN-05 descuenta la unión).

## 4. Consistencia inicio ↔ fin ↔ duración efectiva (D-05a, instrucción 8)

1. **Escritura atómica en creación:** `fin_utc := inicio_utc + duración` calculado en la capa de servicio (RN-04).
2. **Reprogramación atómica:** desplazamiento de inicio conservando duración; inicio/fin/duración + T8 + T9 + T13 en **un solo commit** (Paso 12).
3. **Capa declarativa por fila (ya en diseño):** CHK `fin_utc > inicio_utc` y `duracion_efectiva_min > 0`.
4. **CHK transversal** `fin_utc = inicio_utc + INTERVAL duracion_efectiva_min MINUTE`: **pendiente de verificación de soporte** con la versión local (instrucción 10) en el Paso 15; si el motor no admite la expresión en CHECK, la **garantía obligatoria** es la validación de capa de servicio (regla 1–3), ya aprobada — el CHK sería refuerzo adicional, no única defensa.
5. **Detección residual:** T8 conserva fechas anteriores/nuevas → auditabilidad (RF-021/026).

## 5. Historial, auditoría, notificaciones y outbox (instrucción 9)

| Tabla | Protección de integridad | Mecanismo |
|---|---|---|
| **T8 historial** | Sin pérdida ni alteración: **sólo INSERT** vía privilegios (Paso 09); sin UNIQUE de negocio (D-05c); identidad por PK; correlación T8↔T9 por `contexto` de la auditoría de la operación; idempotencia de origen (T12) + máquina RN-08 evitan duplicación técnica | M-1…M-3 (D-05c) |
| **T9 auditoría** | Sólo INSERT; NN usuario/fecha/resultado (RF-026); FK RESTRICT; contexto sin secretos (RNF-026); escritura en el mismo commit que la operación (incluido **restablecimiento: T14+T9 atómicos** — RF-029/RNF-030) | privilegios + transacción |
| **T10 notificaciones** | Instantánea NN (A-04), FKs RESTRICT, evento con CHK; generación desacoplada **sin pérdida de reserva** → fila T10 escrita en transacción de negocio o vía outbox; **sin estado de lectura** (OD-03) | diseño aprobado |
| **T13 outbox** | Escritura **en el mismo commit** que la cita (RNF-017/CA-012); FK RESTRICT 0..1 (R16); estado/intentos con CHK+DEF; consumidor sólo actualiza `estado/intentos` (UPDATE permitido únicamente en esas columnas, control de aplicación) | transaccional + permisos |

## 6. Verificaciones

1. Cobertura: 14/14 tablas · **18/18 FK** (conteo verificado, desglose idéntico en modelo lógico y físico) · PK en todas · UNIQUE completas · **27/27 CHECK declarativos** coherentes 1:1 entre modelos (salvo L-04 T9.tipo_operacion, intencional).
2. **Ninguna UNIQUE pretende impedir solapes de intervalos** (instrucción 6): la exclusión de reservas incompatibles queda para la estrategia transaccional del **Paso 12**.
3. Solución E2 con semántica NULL de MySQL resuelta en dos capas (§3); solapamientos de excepciones **no** prohibidos.
4. Append-only de T8/T9 garantizado por privilegios (Paso 09); outbox/notificaciones/auditoría integros (§5).
5. Sin SQL ejecutable, sin migraciones, sin cambios en modelos ni requisitos; preflight **resuelto** (D-06-R1: local = objetivo = 8.0.46); compatibilidad de CHECK/índices/NULL registrada en `15_reportes/compatibilidad_mysql_8046.md`.

**Estado:** elaborado — agrupado con Pasos 07–14; checkpoint de SQL al final.
