# Modelo físico — MySQL 8.0.46 / InnoDB — Paso 07

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 07 (Diseño físico), motor **D-06 (enmienda D-06-R1): MySQL 8.0.46 + InnoDB**.
**Skills:** `databases` (familia MySQL) · **Fecha:** 9 de octubre de 2026.
**Entradas:** `modelo_logico.md` (Paso 04 aprobado), `informe_normalizacion.md` + revisión (Paso 05 aprobados), `seleccion_dbms.md` + D-06/D-06-R1, decisiones A/ER/L/D-05.
**Restricción:** diseño **sin SQL ejecutable, sin migraciones, sin código**; los scripts se generan en el Paso 15 con autorización explícita. Preflight **resuelto** (D-06-R1): versión local = objetivo = **8.0.46**.

## 1. Convenciones globales (MySQL 8.0.46 / InnoDB)

| Elemento | Decisión técnica (derivada de D-06 y decisiones aprobadas) | Fundamento |
|---|---|---|
| Motor | **InnoDB** (transacciones ACID, FK, bloqueo de fila) | D-06; RN-09/RNF-010/011 |
| Codificación | `utf8mb4` + colación por defecto de la versión (`utf8mb4_0900_ai_ci`) — **nunca `utf8`** | regla del skill `databases`; RNF-019 textos |
| Modo estricto | `sql_mode` con **`STRICT_TRANS_TABLES`** (y `NO_ZERO_DATE`, `ERROR_FOR_DIVISION_BY_ZERO`) | regla del skill: evita truncado silencioso |
| Identificadores surrogate | `INT NOT NULL AUTO_INCREMENT` (InnoDB) | suficiente a la escala 10.000 citas/1.000 usuarios; clustered index en PK |
| PK compuesta | T4: PK `(profesional_id, servicio_id)` sin AUTO_INCREMENT | R5/ER-05; clustered index compuesto |
| Instantes UTC | **`DATETIME(3)`** (precisión ms), convención de almacenamiento **UTC** — **no** `TIMESTAMP` | RNF-028; evita límite 2038 de `TIMESTAMP` (regla del skill) |
| Horarios/excepciones (local) | `TIME` + `DATE` con zona `America/La_Paz` en aplicación | RN-15, CA-014 |
| `enum_texto` (dominios con CHK) | `VARCHAR(n)` + **`CHECK (… IN (…))`** — CHECK es efectivo en MySQL 8.0.16+ | modelo lógico §2 |
| `enum_texto` de **catálogo L-04** (T9.tipo_operacion) | `VARCHAR(40)` **sin CHECK**, validado en aplicación | L-04: "texto validado en aplicación, extensible sin cambiar el esquema" |
| `texto` / `texto_largo` | `VARCHAR(n)` acotado / `TEXT` (`MEDIUMTEXT` para `carga`) | longitud coherente con el uso |
| FK | `FOREIGN KEY … ON DELETE RESTRICT` **explícita** (nunca CASCADE) | RN-11, RF-004; regla del skill |
| Índices | Todo FK con índice (InnoDB los exige/crea implícitamente; diseño explícito en Paso 11) | regla del skill; RN-05/RNF-006 |
| Nombres | `snake_case`; verificado **sin palabras reservadas** de MySQL (`cita`, `estado`, `clave`, `contexto`… no lo son) | evita quoting |
| Formato de fila | DYNAMIC (`innodb_file_per_table=ON`) | estándar actual |

## 2. Mapeo de tipos por tabla

Notación: **PK** · **UQ** · **FK→Tn** · **CHK** · **DEF** · NN = NOT NULL.

### T1 `usuario`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| nombre_completo | VARCHAR(150) | NN |
| correo | VARCHAR(254) | NN, **UQ** (CA-001) |
| hash_contrasena | VARCHAR(255) | NN (RNF-002: sólo hash) |
| rol | VARCHAR(20) | NN, DEF `'solicitante'`, CHK IN (solicitante, profesional, administrador) |
| estado | VARCHAR(10) | NN, DEF `'activo'`, CHK IN (activo, inactivo) |
| creado_utc / actualizado_utc | DATETIME(3) | NN / NN |

### T2 `profesional`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| usuario_id | INT | NN, **UQ**, FK→T1 RESTRICT (R1) |
| datos_exhibicion | VARCHAR(255) | NULL |
| estado | VARCHAR(10) | NN, CHK IN (activo, inactivo) |
| desactivado_utc | DATETIME(3) | NULL, CHK coherencia con `estado` (ambos estados inactivos ↔ instante presente) |

### T3 `servicio`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| nombre | VARCHAR(100) | NN |
| descripcion | VARCHAR(500) | NULL |
| duracion_minutos | INT | NN, CHK > 0 (RN-04) |
| estado | VARCHAR(10) | NN, CHK IN (activo, inactivo) |

### T4 `asociacion_profesional_servicio`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| profesional_id | INT | **PK parte**, NN, FK→T2 RESTRICT |
| servicio_id | INT | **PK parte**, NN, FK→T3 RESTRICT |
| duracion_especifica | INT | NULL, CHK > 0 (RN-04, prioridad) |
| estado | VARCHAR(10) | NN, DEF `'activa'`, CHK IN (activa, inactiva) |
| registrado_utc | DATETIME(3) | NN |
| baja_utc | DATETIME(3) | NULL, CHK (activa↔NULL / inactiva↔presente) |

### T5 `horario_habitual`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| profesional_id | INT | NN, FK→T2 RESTRICT (R6) |
| dia_semana | VARCHAR(3) | NN, CHK IN (lun…dom) |
| hora_inicio | TIME | NN |
| hora_fin | TIME | NN, CHK hora_fin > hora_inicio |
| — | — | **UQ (profesional_id, dia_semana, hora_inicio)**; solapes entre filas → transaccional (L-01, Paso 12) |

### T6 `excepcion_disponibilidad`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| profesional_id | INT | NN, FK→T2 RESTRICT (R7) |
| fecha | DATE | NN (día local, RN-15) |
| hora_inicio / hora_fin | TIME | NULL/NULL — CHK (ambas NULL ∨ ambas NN con hora_fin > hora_inicio) (A-05) |
| tipo | VARCHAR(15) | NN, CHK IN (ausencia, feriado, bloqueo) |
| motivo | VARCHAR(200) | NULL |
| — | — | **Anti-duplicados E2: índice único funcional NULL-seguro** (D-05b + MySQL) — ver Paso 08 §3 |

### T7 `cita`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| solicitante_id | INT | NN, FK→T1 RESTRICT (R2) |
| profesional_id | INT | NN, FK→T2 RESTRICT (R3) |
| servicio_id | INT | NN, FK→T3 RESTRICT (R4) |
| inicio_utc / fin_utc | DATETIME(3) | NN, CHK fin_utc > inicio_utc (RN-01) |
| duracion_efectiva_min | INT | NN, CHK > 0 (RN-04); coherencia con inicio/fin → **CHK transversal** (Paso 08 §4, verificable en Paso 15) |
| estado | VARCHAR(15) | NN, DEF `'Confirmada'`, CHK IN (Confirmada, En atención, Atendida, Cancelada, No asistida) (RN-08) |
| justificacion_cambio | VARCHAR(500) | NULL (RN-14 → transaccional) |
| creado_utc / actualizado_utc | DATETIME(3) | NN / NN |

### T8 `historial_cambio_cita`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| cita_id | INT | NN, FK→T7 RESTRICT (R8) |
| usuario_id | INT | NN, FK→T1 RESTRICT (R13) |
| tipo_cambio | VARCHAR(20) | NN, CHK IN (cambio_estado, reprogramacion) |
| estado_anterior / estado_nuevo | VARCHAR(15) | NULL / NULL, CHK (tipo=cambio_estado → estado_nuevo NN) |
| fecha_anterior_utc / fecha_nueva_utc | DATETIME(3) | NULL / NULL, CHK (tipo=reprogramacion → fecha_nueva NN) |
| cambiado_utc | DATETIME(3) | NN (ms reduce colisiones, O-3) |
| justificacion | VARCHAR(500) | NULL |
| — | — | **Append-only**: sin UPDATE/DELETE → permisos de sólo-inserción (Paso 09) |

### T9 `auditoria_operacion`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| operacion_id | INT AUTO_INCREMENT | PK |
| usuario_id | INT | NN, FK→T1 RESTRICT (R14) |
| cita_id | INT | NULL, FK→T7 RESTRICT (R12, 0..1) |
| tipo_operacion | VARCHAR(40) | NN, **sin CHECK** (catálogo L-04 validado en aplicación) |
| fecha_hora_utc | DATETIME(3) | NN |
| resultado | VARCHAR(10) | NN, CHK IN (exito, fallo) (RF-026, RNF-013) |
| contexto | VARCHAR(500) | NULL; validación de contenido sin secretos (RNF-026); **correlación T14/T8↔T9** (precisión Paso 04 + D-05c) |
| — | — | Append-only (permisos, Paso 09) |

### T10 `notificacion`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| destinatario_id | INT | NN, FK→T1 RESTRICT (R10, RF-028) |
| cita_id | INT | NN, FK→T7 RESTRICT (R9) |
| evento | VARCHAR(15) | NN, CHK IN (confirmada, reprogramada, cancelada) |
| instantanea_datos | TEXT | NN (A-04) |
| generado_utc | DATETIME(3) | NN |

### T11 `parametro_operativo`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| clave | VARCHAR(100) | **PK** |
| valor | VARCHAR(255) | NN |
| descripcion | VARCHAR(200) | NULL |
| modificado_por | INT | NN, FK→T1 RESTRICT (R15) |
| modificado_utc | DATETIME(3) | NN |

### T12 `clave_idempotencia`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| clave | VARCHAR(100) | **PK** (global, RNF-012) |
| usuario_sesion | INT | NN, FK→T1 RESTRICT (ER-02) |
| tipo_operacion | VARCHAR(20) | NN, CHK IN (reserva, reprogramacion, cancelacion) |
| solicitud_original | TEXT | NN |
| resultado | TEXT | NN |
| creada_utc / caduca_utc | DATETIME(3) | NN / NN, CHK caduca_utc > creada_utc (TTL → Paso 12) |

### T13 `evento_outbox`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| correlacion_id | VARCHAR(64) | NN (ER-03) |
| tipo_evento | VARCHAR(25) | NN, CHK IN (cita_confirmada, cita_reprogramada, cita_cancelada) |
| cita_id | INT | NULL, FK→T7 RESTRICT (R16, 0..1) |
| carga | MEDIUMTEXT | NN |
| estado | VARCHAR(10) | NN, DEF `'pendiente'`, CHK IN (pendiente, procesado) |
| intentos | INT | NN, DEF 0, CHK >= 0 |
| creado_utc / procesado_utc | DATETIME(3) | NN / NULL |

### T14 `restablecimiento_contrasena`
| Columna | Tipo MySQL | Restricciones |
|---|---|---|
| id | INT AUTO_INCREMENT | PK |
| usuario_id | INT | NN, FK→T1 RESTRICT (R11, RF-029) |
| hash_temporal | VARCHAR(255) | NN (sólo hash) |
| caduca_utc | DATETIME(3) | NN (OD-02) |
| estado | VARCHAR(10) | NN, DEF `'pendiente'`, CHK IN (pendiente, usado, caducado) |
| creado_utc | DATETIME(3) | NN |

## 3. Verificaciones del paso

1. **14 tablas** mapeadas = 14 entidades aprobadas; **R1–R16** representadas (FK/UNIQUE/PK compuesta); sin tablas nuevas (el versionamiento **no** introduce tabla de control — ver `versionamiento.md`).
2. Sin SQL ejecutable ni migraciones; sin instalación ni despliegue; **sin cambios en modelos aprobados ni requisitos**.
3. Diferencias PostgreSQL→MySQL de la comparación del Paso 06 resueltas: UTC vía `DATETIME(3)`; E2 vía solución del Paso 08; sin `EXCLUDE` → Paso 12; catálogo L-04 sin CHECK.
4. Preflight de versión (instrucción 10): **resuelto con D-06-R1** — versión local = objetivo = **8.0.46**; verificar `SELECT VERSION()` al momento de ejecutar (Pasos 15/17). Compatibilidad de tipos/CHECK/índices funcionales registrada en `15_reportes/compatibilidad_mysql_8046.md`.

**Estado:** elaborado y actualizado a D-06-R1 (MySQL 8.0.46). Los Pasos 07–14 se presentan agrupados; checkpoint de autorización de SQL al final (Paso 15).
