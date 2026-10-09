# Documentación de la base real — Paso 18

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 18 (Verificación de base real; skill `database-documentation`, tier **T2**: BD viva + agente único)
**Motor:** MySQL 8.0.46 (`8.0.46-0ubuntu0.24.04.4`) · InnoDB · `utf8mb4_0900_ai_ci` · **Fecha:** 9 de octubre de 2026
**Fuente de verdad:** introspección en vivo de `information_schema` (+ `SHOW INDEX` equivalente vía `statistics`), sesión de sólo lectura `devcode@localhost`. Sin ORM (el backend aún no existe); superficie documental: `modelo_fisico.md` (Paso 07) y scripts `0001–0006`.
**Identidad de cruce:** PK consultada con cruce por `table_schema + table_name` (la primera consulta, cruzada sólo por `constraint_name`, produjo producto cartesiano y fue descartada).

## 1. Paridad diseño ↔ base real (count gate)

| Clase de objeto | Real (viva) | Diseño (modelo_fisico / 0001–0004) | Match |
|---|---|---|---|
| Tablas (BASE TABLE) | **14** | 14 (T1–T14) | ✔ |
| Columnas | **97** | 97 (suma del mapeo T1–T14) | ✔ |
| PK (restricciones / columnas) | **14 / 15** | 14 (T4 compuesta = 2 cols) | ✔ |
| FK (`ON DELETE RESTRICT`, `ON UPDATE NO ACTION`) | **18** | 18 (R1–R16) | ✔ |
| UNIQUE (tabla-constricción) | **3** (`uq_t1_correo`, `uq_t2_usuario`, `uq_t5_dedup`) | 3 | ✔ |
| CHECK | **28** (27 de `0001` + `chk_t7_duracion_coherencia` de `0004`) | 27 + 1 (ampliación aprobada) | ✔ |
| Índices secundarios (nombres distintos sin PRIMARY) | **24** (19 `idx_*` + `fk_t11_modificado_por` + 4 `uq_*`) | 15 (`0001`) + 4 (`0002`) + 3 UQ (`0001`) + 1 UQ funcional (`0003`) + FK T11 | ✔ |
| Índice funcional E2 (expresión `CONCAT/IFNULL`) | **1** (`uq_t6_e2`) | 1 (`0003`, D-05b) | ✔ |
| Triggers / Vistas / Rutinas | **0 / 0 / 0** | 0 (no previstos) | ✔ |
| Filas por tabla | **0 en las 14** | 0 (BD nueva; fixtures `9990` en transacción con `ROLLBACK`) | ✔ |

**Parity report (fase de verificación):** diff de identidad sobre columnas (nombre/tipo/nulidad/defecto/extra), PK, FK (+reglas), UQ, CHECK (cláusulas), e índices (+expresión de `uq_t6_e2`): **vacío — 0 objetos no documentados, 0 inventados**. Tier T2 (BD viva + verificación secuencial).

## 2. ERD obtenido de la base real

```mermaid
erDiagram
    usuario ||--o{ profesional : "R1 1:1 (UQ)"
    usuario ||--o{ cita : "R2 solicitante"
    profesional ||--o{ cita : "R3"
    servicio ||--o{ cita : "R4"
    profesional ||--o{ asociacion_profesional_servicio : "R5 PK compuesta"
    servicio ||--o{ asociacion_profesional_servicio : "R5 PK compuesta"
    profesional ||--o{ horario_habitual : "R6"
    profesional ||--o{ excepcion_disponibilidad : "R7"
    cita ||--o{ historial_cambio_cita : "R8"
    cita ||--o{ notificacion : "R9"
    usuario ||--o{ notificacion : "R10"
    usuario ||--o{ restablecimiento_contrasena : "R11"
    cita ||--o| auditoria_operacion : "R12 0..1"
    usuario ||--o{ auditoria_operacion : "R14"
    usuario ||--o{ clave_idempotencia : "ER-02 sesion"
    usuario ||--o{ parametro_operativo : "R15"
    cita ||--o| evento_outbox : "R16 0..1"
    usuario {
        int id PK
        varchar nombre_completo
        varchar correo UQ
        varchar hash_contrasena
        varchar rol
        varchar estado
        datetime creado_utc
        datetime actualizado_utc
    }
    profesional {
        int id PK
        int usuario_id FK_UQ
        varchar datos_exhibicion
        varchar estado
        datetime desactivado_utc
    }
    servicio {
        int id PK
        varchar nombre
        varchar descripcion
        int duracion_minutos
        varchar estado
    }
    asociacion_profesional_servicio {
        int profesional_id PK_FK
        int servicio_id PK_FK
        int duracion_especifica
        varchar estado
        datetime registrado_utc
        datetime baja_utc
    }
    horario_habitual {
        int id PK
        int profesional_id FK
        varchar dia_semana
        time hora_inicio
        time hora_fin
    }
    excepcion_disponibilidad {
        int id PK
        int profesional_id FK
        date fecha
        time hora_inicio
        time hora_fin
        varchar tipo
        varchar motivo
    }
    cita {
        int id PK
        int solicitante_id FK
        int profesional_id FK
        int servicio_id FK
        datetime inicio_utc
        datetime fin_utc
        int duracion_efectiva_min
        varchar estado
        varchar justificacion_cambio
        datetime creado_utc
        datetime actualizado_utc
    }
    historial_cambio_cita {
        int id PK
        int cita_id FK
        int usuario_id FK
        varchar tipo_cambio
        varchar estado_anterior
        varchar estado_nuevo
        datetime fecha_anterior_utc
        datetime fecha_nueva_utc
        datetime cambiado_utc
        varchar justificacion
    }
    auditoria_operacion {
        int operacion_id PK
        int usuario_id FK
        int cita_id FK
        varchar tipo_operacion
        datetime fecha_hora_utc
        varchar resultado
        varchar contexto
    }
    notificacion {
        int id PK
        int destinatario_id FK
        int cita_id FK
        varchar evento
        text instantanea_datos
        datetime generado_utc
    }
    parametro_operativo {
        varchar clave PK
        varchar valor
        varchar descripcion
        int modificado_por FK
        datetime modificado_utc
    }
    clave_idempotencia {
        varchar clave PK
        int usuario_sesion FK
        varchar tipo_operacion
        text solicitud_original
        text resultado
        datetime creada_utc
        datetime caduca_utc
    }
    evento_outbox {
        int id PK
        varchar correlacion_id
        varchar tipo_evento
        int cita_id FK
        mediumtext carga
        varchar estado
        int intentos
        datetime creado_utc
        datetime procesado_utc
    }
    restablecimiento_contrasena {
        int id PK
        int usuario_id FK
        varchar hash_temporal
        datetime caduca_utc
        varchar estado
        datetime creado_utc
    }
```

## 3. Diccionario de datos (por tabla, según catálogo vivo)

### T1 `usuario`

Usuarios del sistema (solicitantes, profesionales, administradores); hash adaptativo de contraseña (RNF-002).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `nombre_completo` | varchar(150) | NN | — | — | — |
| 3 | `correo` | varchar(254) | NN | — | — | UQ |
| 4 | `hash_contrasena` | varchar(255) | NN | — | — | — |
| 5 | `rol` | varchar(20) | NN | `solicitante` | — | — |
| 6 | `estado` | varchar(10) | NN | `activo` | — | — |
| 7 | `creado_utc` | datetime(3) | NN | — | — | — |
| 8 | `actualizado_utc` | datetime(3) | NN | — | — | — |

**CHECK:** `chk_t1_estado`; `chk_t1_rol`

**Índices secundarios:** `uq_t1_correo`

**FK:** ninguna

### T2 `profesional`

Perfiles profesionales enlazados 1:1 con usuario; coherencia estado/desactivado verificada por CHK.

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `usuario_id` | int | NN | — | — | UQ FK→usuario |
| 3 | `datos_exhibicion` | varchar(255) | NULL | — | — | — |
| 4 | `estado` | varchar(10) | NN | — | — | — |
| 5 | `desactivado_utc` | datetime(3) | NULL | — | — | — |

**CHECK:** `chk_t2_desactivado`; `chk_t2_estado`

**Índices secundarios:** `uq_t2_usuario`

**FK:** `usuario_id`→`usuario.id` ON DELETE RESTRICT

### T3 `servicio`

Catálogo de servicios con duración > 0 (RN-04).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `nombre` | varchar(100) | NN | — | — | — |
| 3 | `descripcion` | varchar(500) | NULL | — | — | — |
| 4 | `duracion_minutos` | int | NN | — | — | — |
| 5 | `estado` | varchar(10) | NN | — | — | — |

**CHECK:** `chk_t3_duracion`; `chk_t3_estado`

**FK:** ninguna

### T4 `asociacion_profesional_servicio`

Asociación N:M profesional–servicio con PK compuesta; duración específica opcional.

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `profesional_id` | int | NN | — | — | PK FK→profesional |
| 2 | `servicio_id` | int | NN | — | — | PK FK→servicio |
| 3 | `duracion_especifica` | int | NULL | — | — | — |
| 4 | `estado` | varchar(10) | NN | `activa` | — | — |
| 5 | `registrado_utc` | datetime(3) | NN | — | — | — |
| 6 | `baja_utc` | datetime(3) | NULL | — | — | — |

**CHECK:** `chk_t4_baja`; `chk_t4_duracion`; `chk_t4_estado`

**Índices secundarios:** `idx_t4_servicio`

**FK:** `servicio_id`→`servicio.id` ON DELETE RESTRICT; `profesional_id`→`profesional.id` ON DELETE RESTRICT

### T5 `horario_habitual`

Horarios semanales por día (lun–dom ASCII); duplicados exactos impedidos por UQ.

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `profesional_id` | int | NN | — | — | UQ FK→profesional |
| 3 | `dia_semana` | varchar(3) | NN | — | — | UQ |
| 4 | `hora_inicio` | time | NN | — | — | UQ |
| 5 | `hora_fin` | time | NN | — | — | — |

**CHECK:** `chk_t5_dia`; `chk_t5_rango`

**Índices secundarios:** `uq_t5_dedup`; `uq_t5_dedup`; `uq_t5_dedup`

**FK:** `profesional_id`→`profesional.id` ON DELETE RESTRICT

### T6 `excepcion_disponibilidad`

Ausencias/feriados/bloqueos; anti-duplicados por índice único funcional E2 (no impide solapes).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `profesional_id` | int | NN | — | — | FK→profesional |
| 3 | `fecha` | date | NN | — | — | — |
| 4 | `hora_inicio` | time | NULL | — | — | — |
| 5 | `hora_fin` | time | NULL | — | — | — |
| 6 | `tipo` | varchar(15) | NN | — | — | — |
| 7 | `motivo` | varchar(200) | NULL | — | — | — |

**CHECK:** `chk_t6_horas`; `chk_t6_tipo`

**Índices secundarios:** `idx_t6_fecha`; `idx_t6_fecha`; `uq_t6_e2` (funcional: `CONCAT/IFNULL`)

**FK:** `profesional_id`→`profesional.id` ON DELETE RESTRICT

### T7 `cita`

Citas con estados RN-08; coherencia fin=inicio+duración garantizada por CHK transversal (0004).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `solicitante_id` | int | NN | — | — | FK→usuario |
| 3 | `profesional_id` | int | NN | — | — | FK→profesional |
| 4 | `servicio_id` | int | NN | — | — | FK→servicio |
| 5 | `inicio_utc` | datetime(3) | NN | — | — | — |
| 6 | `fin_utc` | datetime(3) | NN | — | — | — |
| 7 | `duracion_efectiva_min` | int | NN | — | — | — |
| 8 | `estado` | varchar(15) | NN | `Confirmada` | — | — |
| 9 | `justificacion_cambio` | varchar(500) | NULL | — | — | — |
| 10 | `creado_utc` | datetime(3) | NN | — | — | — |
| 11 | `actualizado_utc` | datetime(3) | NN | — | — | — |

**CHECK:** `chk_t7_duracion`; `chk_t7_duracion_coherencia`; `chk_t7_estado`; `chk_t7_rango`

**Índices secundarios:** `idx_t7_prof_estado_inicio`; `idx_t7_prof_estado_inicio`; `idx_t7_prof_estado_inicio`; `idx_t7_prof_inicio`; `idx_t7_prof_inicio`; `idx_t7_servicio`; `idx_t7_sol_inicio`; `idx_t7_sol_inicio`

**FK:** `profesional_id`→`profesional.id` ON DELETE RESTRICT; `servicio_id`→`servicio.id` ON DELETE RESTRICT; `solicitante_id`→`usuario.id` ON DELETE RESTRICT

### T8 `historial_cambio_cita`

Historial append-only por evento de cita (V-01, D-05c).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `cita_id` | int | NN | — | — | FK→cita |
| 3 | `usuario_id` | int | NN | — | — | FK→usuario |
| 4 | `tipo_cambio` | varchar(20) | NN | — | — | — |
| 5 | `estado_anterior` | varchar(15) | NULL | — | — | — |
| 6 | `estado_nuevo` | varchar(15) | NULL | — | — | — |
| 7 | `fecha_anterior_utc` | datetime(3) | NULL | — | — | — |
| 8 | `fecha_nueva_utc` | datetime(3) | NULL | — | — | — |
| 9 | `cambiado_utc` | datetime(3) | NN | — | — | — |
| 10 | `justificacion` | varchar(500) | NULL | — | — | — |

**CHECK:** `chk_t8_estado`; `chk_t8_fecha`; `chk_t8_tipo`

**Índices secundarios:** `idx_t8_cita_cambiado`; `idx_t8_cita_cambiado`; `idx_t8_usuario`

**FK:** `cita_id`→`cita.id` ON DELETE RESTRICT; `usuario_id`→`usuario.id` ON DELETE RESTRICT

### T9 `auditoria_operacion`

Auditoría append-only de operaciones; tipo_operacion sin CHECK (L-04, validado en aplicación).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `operacion_id` | int | NN | — | auto_increment | PK |
| 2 | `usuario_id` | int | NN | — | — | FK→usuario |
| 3 | `cita_id` | int | NULL | — | — | FK→cita |
| 4 | `tipo_operacion` | varchar(40) | NN | — | — | — |
| 5 | `fecha_hora_utc` | datetime(3) | NN | — | — | — |
| 6 | `resultado` | varchar(10) | NN | — | — | — |
| 7 | `contexto` | varchar(500) | NULL | — | — | — |

**CHECK:** `chk_t9_resultado`

**Índices secundarios:** `idx_t9_cita`; `idx_t9_fecha`; `idx_t9_usuario`

**FK:** `cita_id`→`cita.id` ON DELETE RESTRICT; `usuario_id`→`usuario.id` ON DELETE RESTRICT

### T10 `notificacion`

Notificaciones con instantánea de datos (A-04); desacopladas vía outbox (RNF-017).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `destinatario_id` | int | NN | — | — | FK→usuario |
| 3 | `cita_id` | int | NN | — | — | FK→cita |
| 4 | `evento` | varchar(15) | NN | — | — | — |
| 5 | `instantanea_datos` | text | NN | — | — | — |
| 6 | `generado_utc` | datetime(3) | NN | — | — | — |

**CHECK:** `chk_t10_evento`

**Índices secundarios:** `idx_t10_cita`; `idx_t10_destinatario`

**FK:** `cita_id`→`cita.id` ON DELETE RESTRICT; `destinatario_id`→`usuario.id` ON DELETE RESTRICT

### T11 `parametro_operativo`

Parámetros operativos (anticipaciones RF-025/RN-12).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `clave` | varchar(100) | NN | — | — | PK |
| 2 | `valor` | varchar(255) | NN | — | — | — |
| 3 | `descripcion` | varchar(200) | NULL | — | — | — |
| 4 | `modificado_por` | int | NN | — | — | FK→usuario |
| 5 | `modificado_utc` | datetime(3) | NN | — | — | — |

**CHECK:** 

**Índices secundarios:** `fk_t11_modificado_por`

**FK:** `modificado_por`→`usuario.id` ON DELETE RESTRICT

### T12 `clave_idempotencia`

Claves idempotencia globales (RNF-012) con TTL (L-03).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `clave` | varchar(100) | NN | — | — | PK |
| 2 | `usuario_sesion` | int | NN | — | — | FK→usuario |
| 3 | `tipo_operacion` | varchar(20) | NN | — | — | — |
| 4 | `solicitud_original` | text | NN | — | — | — |
| 5 | `resultado` | text | NN | — | — | — |
| 6 | `creada_utc` | datetime(3) | NN | — | — | — |
| 7 | `caduca_utc` | datetime(3) | NN | — | — | — |

**CHECK:** `chk_t12_tipo`; `chk_t12_ttl`

**Índices secundarios:** `idx_t12_sesion`

**FK:** `usuario_sesion`→`usuario.id` ON DELETE RESTRICT

### T13 `evento_outbox`

Outbox de eventos de notificación R16 (RNF-017).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `correlacion_id` | varchar(64) | NN | — | — | — |
| 3 | `tipo_evento` | varchar(25) | NN | — | — | — |
| 4 | `cita_id` | int | NULL | — | — | FK→cita |
| 5 | `carga` | mediumtext | NN | — | — | — |
| 6 | `estado` | varchar(10) | NN | `pendiente` | — | — |
| 7 | `intentos` | int | NN | `0` | — | — |
| 8 | `creado_utc` | datetime(3) | NN | — | — | — |
| 9 | `procesado_utc` | datetime(3) | NULL | — | — | — |

**CHECK:** `chk_t13_estado`; `chk_t13_intentos`; `chk_t13_tipo`

**Índices secundarios:** `idx_t13_cita`; `idx_t13_correlacion`; `idx_t13_estado_creado`; `idx_t13_estado_creado`

**FK:** `cita_id`→`cita.id` ON DELETE RESTRICT

### T14 `restablecimiento_contrasena`

Restablecimientos: sólo hash temporal (RNF-029/030).

| # | Columna | Tipo | Nulable | Default | Extra | PK/UQ/FK |
|---|---|---|---|---|---|---|
| 1 | `id` | int | NN | — | auto_increment | PK |
| 2 | `usuario_id` | int | NN | — | — | FK→usuario |
| 3 | `hash_temporal` | varchar(255) | NN | — | — | — |
| 4 | `caduca_utc` | datetime(3) | NN | — | — | — |
| 5 | `estado` | varchar(10) | NN | `pendiente` | — | — |
| 6 | `creado_utc` | datetime(3) | NN | — | — | — |

**CHECK:** `chk_t14_estado`

**Índices secundarios:** `idx_t14_estado_caduca`; `idx_t14_estado_caduca`; `idx_t14_usuario`

**FK:** `usuario_id`→`usuario.id` ON DELETE RESTRICT

## 4. Comparación diseño vs esquema real y detección de drift

| Dimensión | Resultado |
|---|---|
| Tipos (INT/`DATETIME(3)`/`VARCHAR`/`TIME`/`DATE`/`TEXT`/`MEDIUMTEXT`) | Idénticos al mapeo T1–T14 de `modelo_fisico.md` §2 |
| Nulabilidad y DEFAULT (`solicitante`, `activo`, `Confirmada`, `pendiente`, `0`, `activa`) | Idéntica |
| PK/UQ/FK (14/3/18; FK siempre `RESTRICT`/`NO ACTION`, nunca CASCADE) | Idéntica a R1–R16 |
| CHECK (28) | 27 de `0001` + `chk_t7_duracion_coherencia` (`0004`, ampliación aprobada Paso 15) — sin desviaciones |
| E2 funcional (`uq_t6_e2` con `CONCAT`+`IFNULL`, NULL-seguro) | Presente con la expresión exacta de `0003` |
| Motor/colación/`sql_mode` | InnoDB · `utf8mb4_0900_ai_ci` · `STRICT_TRANS_TABLES` activo (verificado en Paso 17 con `SELECT @@sql_mode`) |
| Triggers/vistas/rutinas | 0 = 0 (sin desviación) |

**Drift detectado: ninguno estructural.** Observaciones no bloqueantes:
1. Contadores `AUTO_INCREMENT` avanzados (p. ej. `usuario`=990002) por las fixtures de `9990` ejecutadas en transacción con `ROLLBACK`: los contadores no se revierten; **no hay filas residuales** (conteos exactos = 0).
2. `En atención` del CHECK `chk_t7_estado` puede mostrarse con mojibake (`Ã³`) en salidas `mysql --batch` según locale del cliente; la cláusula almacenada es UTF-8 correcta (comparada byte a byte con el diseño).
3. Seguridad (fuera del catálogo): las 5 cuentas de servicio existen en host `localhost`; tras la corrección de privilegios, **2 `GRANT` quedaron pendientes de ejecución manual** (`app_rw` sobre `asociacion_profesional_servicio`; `app_append` sobre `historial_cambio_cita`) — detalle y comandos en `evidencia_paso17_ejecucion/evidencia.md` §6.4. No afecta al esquema.

**Estado:** Paso 18 completado — documentación generada íntegramente desde la BD viva (tier T2), paridad verificada, sin drift estructural.
