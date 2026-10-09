# Resultados de pruebas — Paso 19

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 19 (Pruebas) · **Fecha:** 9 de octubre de 2026
**Motor:** MySQL 8.0.46 (`8.0.46-0ubuntu0.24.04.4`) · InnoDB · sesión `devcode@localhost` (sólo lectura + escrituras transaccionales con `ROLLBACK`)
**Método:** batería `/tmp` ejecutada con `--force` (errores de restricción **esperados** y marcados); toda escritura dentro de `START TRANSACTION … ROLLBACK`; sin cambio de estructura; datos existentes preservados (baseline y finales = 0 filas verificadas).

## 1. Integridad de entidades — PK / UNIQUE (S1)

| Prueba | Esperado | Real | Resultado |
|---|---|---|---|
| Insert usuario + duplicar `correo` | 1062 `uq_t1_correo` | `ERROR 1062 … for key 'usuario.uq_t1_correo'` | ✔ |
| Segundo `profesional` con mismo `usuario_id` | 1062 `uq_t2_usuario` | `ERROR 1062 … 'profesional.uq_t2_usuario'` | ✔ |
| Horario duplicado exacto (prof+día+hora) | 1062 `uq_t5_dedup` | `ERROR 1062 … 'horario_habitual.uq_t5_dedup'` | ✔ |
| Clave de idempotencia duplicada | 1062 PK | `ERROR 1062 … 'clave_idempotencia.PRIMARY'` | ✔ |
| `ROLLBACK` posterior | 0 filas residuales | verificado (§9) | ✔ |

## 2. Integridad referencial — FK (S2)

| Prueba | Esperado | Real | Resultado |
|---|---|---|---|
| `cita` con `profesional_id` inexistente | 1452 | `ERROR 1452 … CONSTRAINT 'fk_t7_profesional' … ON DELETE RESTRICT` | ✔ |
| `cita` con `servicio_id` inexistente | 1452 | `ERROR 1452 … CONSTRAINT 'fk_t7_servicio'` | ✔ |
| `DELETE` de `servicio` referenciado por cita | rechazo RESTRICT | `ERROR 1451 … CONSTRAINT 'fk_t7_servicio'` | ✔ |
| `DELETE` de `usuario` referenciado | rechazo RESTRICT | `ERROR 1451 … CONSTRAINT 'fk_t2_usuario'` | ✔ |

Nota: MySQL 8 reporta el borrado de padre restringido con **1451** (no 1373, código de MariaDB); el mensaje confirma `ON DELETE RESTRICT`. Todas las 18 FK verificadas en el Paso 18 usan `RESTRICT`/`NO ACTION`.

## 3. Restricciones CHECK (S3 + S3b)

| Prueba | Esperado | Real | Resultado |
|---|---|---|---|
| `usuario.rol` fuera de dominio | 3819 `chk_t1_rol` | ✔ | ✔ |
| `servicio.duracion_minutos = 0` | 3819 `chk_t3_duracion` | ✔ | ✔ |
| `asociacion` `activa` con `baja_utc` presente | 3819 `chk_t4_baja` | ✔ | ✔ |
| `historial.tipo_cambio` inválido | 3819 `chk_t8_tipo` | ✔ | ✔ |
| `cambio_estado` con `estado_nuevo` NULL | 3819 `chk_t8_estado` | ✔ | ✔ |
| `evento_outbox.tipo_evento` inválido | 3819 `chk_t13_tipo` | ✔ | ✔ |
| `intentos = -1` | 3819 `chk_t13_intentos` | ✔ | ✔ |
| `restablecimiento.estado = 'borrador'` | 3819 `chk_t14_estado` | ✔ (tras corregir el script de prueba: faltaba `creado_utc` NN → 1364, error del script, no del esquema) | ✔ |
| **L-04:** `auditoria.tipo_operacion` arbitrario | INSERT permitido (sin CHECK, validado en aplicación) | `operacion_id` insertado | ✔ |

Complemento: las familias de CHECK de `cita` (`chk_t7_*`), `excepcion` (`chk_t6_*`) y `chk_t12_ttl` ya fueron probadas empíricamente en `9990` (Paso 17, evidencia `9990_salida.txt`). Cobertura total: **28 CHECK = 27 de `0001` + 1 de `0004`**, todos activos y verificados por violación real.

## 4. Transaccionalidad (S4)

| Prueba | Real | Resultado |
|---|---|---|
| `INSERT` dentro de transacción → `COUNT(*)=1` | `filas_servicio_dentro = 1` | ✔ |
| Tras `ROLLBACK` → `COUNT(*)=0` | `filas_servicio_tras_rollback = 0` | ✔ |

## 5. Auditoría y append-only (S5)

| Prueba | Real | Resultado |
|---|---|---|
| Triggers en el esquema | `0` (auditoría la escribe la aplicación vía T8/T9) | ✔ conforme al diseño |
| `app_append@localhost` | `GRANT SELECT, INSERT` **sólo** en `historial_cambio_cita` y `auditoria_operacion` (sin UPDATE/DELETE) | ✔ append-only en el motor (RN-10/RN-11, D-05c) |

## 6. Permisos (S6) — correspondencia total con `0005`

| Cuenta (`@localhost`) | Privilegios reales | vs `0005` |
|---|---|---|
| `app_rw` | `SELECT` esquema · `INSERT, UPDATE` en **las 12 tablas** de negocio (incluye `asociacion_profesional_servicio`) · `DELETE` sólo `clave_idempotencia` | ✔ Equivalente |
| `app_append` | `SELECT, INSERT` en `historial_cambio_cita` **y** `auditoria_operacion` | ✔ Equivalente |
| `app_outbox` | `SELECT` esquema · `INSERT, UPDATE (estado, intentos, procesado_utc)` en `evento_outbox` | ✔ Equivalente |
| `backup_ro` | `SELECT` esquema (sin extras) | ✔ Equivalente |
| `migrador` | `ALL PRIVILEGES` esquema | ✔ Equivalente |

- **Observación del Paso 17: CERRADA DEFINITIVAMENTE** (los 2 GRANT finales ejecutados por root el 2026-10-09 fueron verificados con `SHOW GRANTS`).
- Pruebas funcionales por cuenta (login + denegación 1142): **no ejecutables aquí** — el intento de autenticación como `app_rw` con la contraseña del `.env` devolvió `ERROR 1045` (las contraseñas de las cuentas de servicio las definió root; RNF-004: no se prueban ni exponen credenciales). Verificación realizada a nivel de **metadatos de privilegios** (`SHOW GRANTS`, autoridad en MySQL). Las pruebas de login se harán en la fase de backend cuando la aplicación posea las credenciales.

## 7. Migraciones (S7)

| Prueba | Real | Resultado |
|---|---|---|
| Checksums SHA-256 de los 7 scripts vs registro del Paso 15 | `7/7 OK` | ✔ sin alteración de scripts aplicados |
| Aplicación única / esquema final | 14 tablas / 18 FK / 28 CHECK (Paso 18, drift ninguno) | ✔ |
| Capacidad de respaldo (RNF-015): `mysqldump --single-transaction` | `exit=0`, volcado con **14 `CREATE TABLE`** (fichero temporal de prueba **eliminado**; no se conservan respaldos en el repo) | ✔ |

## 8. EXPLAIN de patrones de acceso P1–P12 (§6.d)

| Patrón | Índice usado (`key`) | `type` | Observación |
|---|---|---|---|
| P1 disponibilidad | `uq_t5_dedup` + `idx_t6_fecha` + `idx_t7_prof_inicio` | ref/range | Sin full scan; `Not exists` anti-join |
| P2 solapes | `idx_t7_prof_inicio` (alternativa: `idx_t7_prof_estado_inicio`) | range | Previsto en catálogo |
| P3 agenda solicitante | `idx_t7_sol_inicio` | ref | `Using index` |
| P4 historial | `idx_t8_cita_cambiado` | ref | `Using index` |
| P5 notificaciones | `idx_t10_destinatario` | ref | ✔ |
| P6 auditoría | `idx_t9_usuario` | ref | ✔ |
| P7 idempotencia | PK (`no matching row in const table` = lookup const por PK) | const | Punto crítico de latencia → acceso directo |
| P8 outbox | `idx_t13_estado_creado` | ref | ✔ |
| P9 asociación | PK `(profesional_id, servicio_id)` (const) | const | ✔ |
| P10 excepciones | `idx_t6_fecha` | ref | ✔ |
| P11 dedup horario | PK/UQ lookup (const) | const | ✔ |
| P12 limpieza TTL | **sin índice** → `type=ALL` sobre `clave_idempotencia` | ALL | **Hallazgo documentado, no bloqueante:** el diseño no prevé índice en `caduca_utc` (sólo pocas filas; limpieza batch de baja frecuencia; evitar índice decorativo — regla del Paso 11). |

**Advertencia de validez:** la BD está **vacía**; estos planes confirman el uso de los índices previstos pero **no** constituyen medición de rendimiento. Las metas p95 (RNF-006 < 800 ms, RNF-007 < 1200 ms, RNF-008 con 100 concurrentes) **no se declaran superadas**: requieren datos de perfil (1.000 usuarios / 10.000 citas) y mediciones en la fase de carga/backend. `SELECT *`: ninguno en los patrones verificados.

## 9. Limpieza y preservación de datos

| Verificación | Real |
|---|---|
| Conteo baseline (14 tablas) | 0 filas |
| Conteo final tras la batería (14 tablas) | **0 filas** — sin residuos de fixtures ni pruebas |
| Datos existentes | preservados (no había filas previas; todos los fixtures en transacción con `ROLLBACK`) |
| Ficheros temporales de prueba | volcado de respaldo de prueba y salidas en `/tmp` eliminados; nada sensible en el repo |

## 10. Resumen

- **Resultado global: PASA** — integridad PK/UQ/FK/CHECK, transaccionalidad, append-only de auditoría, permisos de las 5 cuentas (equivalencia total con `0005`), migraciones (checksums + capacidad de respaldo) y planes EXPLAIN de P1–P12 verificados con evidencia real.
- **Errores no esperados:** ninguno (los códigos observados son los esperados por diseño; el 1364/1451 se explican en §§3 y 2).
- **Observaciones no bloqueantes:** (a) P12 sin índice de TTL (diseño intencional); (b) pruebas de login por cuenta y mediciones p95 diferidas a fase backend/carga con credenciales y datos reales.

**Estado:** Paso 19 ejecutado con evidencias reales; pendiente aprobación humana para el Paso 20 (informe final `validacion_final.md`).
