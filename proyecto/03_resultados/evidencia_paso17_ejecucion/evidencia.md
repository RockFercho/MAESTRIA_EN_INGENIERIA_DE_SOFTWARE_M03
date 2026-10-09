# Evidencia Paso 17 — Ejecución controlada (parcial, detenida en 0005)

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual · **Fecha:** 9 de octubre de 2026.
**Autorización:** `APPROVED_STEP_17_EXECUTION_ONLY` (responsable) · **Motor:** MySQL 8.0.46 / InnoDB.
**Mecanismo de conexión:** variables desde `.env` vía entorno de sesión; **sin** ficheros temporales con credenciales, **sin** secretos en argumentos/salidas.

## 1. Limpieza

- Eliminado el fichero temporal residual de la fase anterior: `/tmp/mysql_p17.7cRIWX.cnf` (contenido no leído).

## 2. Validaciones previas (sólo lectura)

| Validación | Resultado |
|---|---|
| `.env` (6 claves, sin continuaciones con `\`, `DB_USER=devcode`, password no vacío) | OK |
| Conexión autenticada `127.0.0.1:3306` | OK — `devcode@localhost`, `8.0.46-0ubuntu0.24.04.4` |
| `SHOW DATABASES LIKE 'gestion_citas_db'` previo | Vacío (no existía) |
| `@@sql_mode` | `…STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION…` |
| Motor por defecto / InnoDB | `InnoDB` / `SUPPORT=YES` |
| Privilegios de `devcode` | Globales amplios **sin `GRANT OPTION`** (detectado en fase de autenticación) |
| Scripts: destructivos (`DROP DATABASE/TABLE`, `TRUNCATE`) | Ninguno |
| Scripts: referencias a otras bases de datos | Ninguna |
| Checksums SHA-256 de los 7 scripts | 7/7 OK |

## 3. Ejecución

| Paso | Resultado |
|---|---|
| `CREATE DATABASE gestion_citas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci` | **OK** (verificado: 1 esquema) |
| `0001_esquema_base.sql` | **OK** |
| `0002_indices_patron_acceso.sql` | **OK** |
| `0003_indice_e2_funcional.sql` | **OK** |
| `0004_chk_transversal_duracion.sql` | **OK** (parser 8.0.46 aceptó la CHK transversal — creación de §6.a superada) |
| `0005_cuentas_privilegios.sql` | **ERROR — SE DETENIDO AQUÍ** |
| `0006_datos_iniciales.sql` | No ejecutado (secuencia detenida) |
| `9990_verificaciones_empiricas.sql` | No ejecutado (secuencia detenida) |

**Primer error bloqueante (registro literal):**
`ERROR 1044 (42000) at line 30: Access denied for user 'devcode'@'localhost' to database 'gestion_citas_db'`
→ primera sentencia `GRANT` de `0005`; causa: `devcode` **no posee `GRANT OPTION`** (confirmado por `SHOW GRANTS`).
→ Dependencia adicional pendiente en `0005`: las cuentas `app_rw`, `app_append`, `app_outbox`, `backup_ro`, `migrador` **aún no existen** (MySQL 8 no crea usuarios implícitos con `GRANT`).

## 4. Estado real del esquema (verificación posterior de sólo lectura)

| Métrica | Diseñado | Real |
|---|---|---|
| Tablas (todas InnoDB, ninguna ajena) | 14 | **14** ✔ |
| Claves foráneas | 18 | **18** ✔ |
| Restricciones CHECK | 27 (+1 si 0004 aplica) | **28** ✔ (incluye `chk_t7_duracion_coherencia`) |
| Tablas con PK | 14 | **14** ✔ |
| Índices únicos clave (`uq_t1_correo`, `uq_t2_usuario`, `uq_t5_dedup`, `uq_t6_e2`) | presentes | **presentes** ✔ |
| Colación | utf8mb4_0900_ai_ci | verificada en creación ✔ |

## 5. Pendientes (no ejecutados por la detención)

- `0006` (semillas comentadas) · `9990` (§6.a creación ya superada vía 0004; §6.b/§6.c pendientes) · validación de grants de las 5 cuentas.
- **Pruebas de concurrencia/rendimiento NO ejecutadas** (no se declaran superadas).
- Intervención administrativa mínima requerida: (1) crear las 5 cuentas con contraseñas definidas fuera del repo; (2) ejecutar `0005` con una cuenta que posea `GRANT OPTION` (recomendado: la cuenta administrativa del responsable) — sin modificar privilegios globales de `devcode`.
- Reanude en `0005` (no repetir `0001–0004`).

**Estado:** Paso 17 detenido en `0005` a la espera de intervención humana.

---

## 6. Continuación y cierre del Paso 17 (misma fecha)

**Intervención administrativa del responsable (ejecutada por él):** 5 cuentas creadas desde MySQL root y privilegios asignados manualmente.

### 6.1 Verificación de permisos reales vs `0005` (sólo lectura)

| Cuenta | Real (`SHOW GRANTS`) | `0005` previsto | Veredicto |
|---|---|---|---|
| `app_rw@localhost` | `SELECT, INSERT, UPDATE, DELETE ON gestion_citas_db.*` | SELECT esquema · INSERT/UPDATE en 12 tablas (sin T8/T9) · DELETE sólo en `clave_idempotencia` | **DIVERGENTE** (DELETE/INSERT/UPDATE ampliados, incluye T8/T9) |
| `app_append@localhost` | `SELECT, INSERT ON gestion_citas_db.*` | sólo `historial_cambio_cita` + `auditoria_operacion` | **DIVERGENTE** (ámbito ampliado; sin UPDATE/DELETE → append-only OK) |
| `app_outbox@localhost` | `SELECT, INSERT, UPDATE ON gestion_citas_db.*` | SELECT esquema · INSERT `evento_outbox` · UPDATE sólo 3 columnas de T13 | **DIVERGENTE** (UPDATE ampliado, incluye T8/T9 → el append-only en motor no queda garantizado para esta cuenta) |
| `backup_ro@localhost` | `SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON …*` | SELECT esquema | DIVERGENCIA MENOR (extras de sólo-lectura) |
| `migrador@localhost` | `ALL PRIVILEGES ON gestion_citas_db.*` | idéntico | **EQUIVALENTE** ✔ |

- **Host:** cuentas creadas en `'@'localhost'` (más restrictivo que `'%'` de `0005`; justificado por `bind-address=localhost`) → las sentencias de `0005` son **incompatibles** con las cuentas reales y **no se re-ejecutaron** (instrucción del responsable).
- **Registro de `0005`:** aplicado por intervención administrativa **con divergencias §6.1 registradas** (no equivalentes estrictamente). Realineación mínima propuesta, **NO ejecutada**, pendiente de autorización:
  - `app_rw`: `REVOKE SELECT, INSERT, UPDATE, DELETE ON gestion_citas_db.*` + `GRANT SELECT ON gestion_citas_db.*` + `GRANT INSERT, UPDATE ON` (las 12 tablas de negocio) + `GRANT DELETE ON gestion_citas_db.clave_idempotencia`.
  - `app_append`: `REVOKE` del esquema + `GRANT SELECT, INSERT ON gestion_citas_db.historial_cambio_cita, gestion_citas_db.auditoria_operacion`.
  - `app_outbox`: `REVOKE` del esquema + `GRANT SELECT ON gestion_citas_db.*` + `GRANT INSERT ON gestion_citas_db.evento_outbox` + `GRANT UPDATE (estado, intentos, procesado_utc) ON gestion_citas_db.evento_outbox`.
  - `backup_ro`: `REVOKE LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON gestion_citas_db.*` (conserva `SELECT`).

### 6.2 Ejecución restante

| Paso | Resultado |
|---|---|
| `0006_datos_iniciales.sql` | **OK** (exit 0) — `filas_parametros = 0` (semillas comentadas, sin OD-01) |
| `9990_verificaciones_empiricas.sql` (`--force`) | **OK según lo previsto** — salida archivada en `9990_salida.txt` |

### 6.3 Resultados de verificaciones empíricas (§6.a / §6.b / §6.c)

| Prueba | Esperado | Real |
|---|---|---|
| §6.a cita incoherente (fin ≠ inicio+duración) | ERROR 3819 `chk_t7_duracion_coherencia` | **3819** ✔ (y la coherente insertó OK) |
| §6.b duplicado exacto jornada completa (NULL,NULL) | ERROR 1062 `uq_t6_e2` | **1062** ✔ (clave `990001\|2026-03-02\|bloqueo\|D\|D`) |
| §6.b duplicado exacto con horas | ERROR 1062 `uq_t6_e2` | **1062** ✔ |
| §6.b solapamiento de rango distinto | INSERT permitido (E2 no protege solapes) | **sin error** ✔ |
| §6.b tipo distinto mismo hueco | INSERT permitido | **sin error** ✔ |
| §6.c estado de cita fuera de dominio | 3819 `chk_t7_estado` | **3819** ✔ |
| §6.c excepción con una sola hora | 3819 `chk_t6_horas` | **3819** ✔ |
| §6.c TTL idempotencia (caduca ≤ crea) | 3819 `chk_t12_ttl` | **3819** ✔ |
| §6.c clave idempotencia repetida | 1062 PK | **1062** ✔ |
| §6.c L-04 tipo de operación arbitrario (T9 sin CHECK) | INSERT permitido | **sin error** ✔ |
| Conteos finales | 14 / 18 / 28 | **14 tablas · 18 FK · 28 CHECK** ✔ |
| Rollback de fixtures | 0 filas probe | **0** ✔ |

**No ejecutadas:** pruebas de concurrencia y rendimiento (Paso 19) — no se declaran superadas.

**Estado final:** Paso 17 **ejecutado por completo** (0001–0006 + 9990); `0005` satisfecho vía intervención administrativa con divergencias §6.1 registradas; realineación de privilegios pendiente de autorización; sin avance al Paso 18.

---

## 7. Realineación de privilegios y cierre (misma fecha)

- Bloque de corrección v2 (REVOKE/GRANT exactos de `0005`, host `localhost`, 1 GRANT por tabla) entregado y **ejecutado manualmente por el responsable como root** (2026-10-09).
- **Verificación posterior (`SHOW GRANTS`, sólo lectura):**

| Cuenta | Resultado |
|---|---|
| `app_outbox@localhost` | ✔ Equivalente — `SELECT` esquema · `INSERT, UPDATE (estado, intentos, procesado_utc)` en `evento_outbox` |
| `backup_ro@localhost` | ✔ Equivalente — sólo `SELECT` esquema (extras revocados) |
| `migrador@localhost` | ✔ Intacto — `ALL PRIVILEGES` esquema |
| `app_rw@localhost` | ⚠ **11 de 12 tablas** — falta `GRANT INSERT, UPDATE ON gestion_citas_db.asociacion_profesional_servicio TO 'app_rw'@'localhost';` |
| `app_append@localhost` | ⚠ **1 de 2 tablas** — falta `GRANT SELECT, INSERT ON gestion_citas_db.historial_cambio_cita TO 'app_append'@'localhost';` |

- **Observación de seguridad:** cerrada en esquema/permisos de diseño **excepto las 2 sentencias anteriores**, pendientes de ejecución manual del responsable (no ejecutables con `devcode` — sin `GRANT OPTION`).
- **Paso 18 ejecutado:** `proyecto/05_base_datos/15_reportes/documentacion_real.md` (tier T2, BD viva) — paridad verificada 14 tablas / 97 columnas / 14 PK / 18 FK / 3 UQ / 28 CHECK / 24 índices secundarios / 0 triggers-vistas-rutinas / 0 filas; **drift estructural: ninguno**; observaciones no bloqueantes: contadores `AUTO_INCREMENT` elevados por fixtures con `ROLLBACK` y artefacto de locale en la visualización de `En atención`.

---

## 8. Cierre definitivo de la observación (misma fecha)

- El responsable ejecutó como root los **2 GRANT restantes** (`app_rw` → `asociacion_profesional_servicio`; `app_append` → `historial_cambio_cita`); verificación posterior con `SHOW GRANTS`: las **5 cuentas equivalen exactamente al diseño de `0005`** (host `localhost`). **Observación de seguridad del Paso 17: CERRADA DEFINITIVAMENTE.**
- **Paso 18 APROBADO** por el responsable (2026-10-09).
- Paso 19 ejecutado: `proyecto/05_base_datos/14_pruebas/resultados_pruebas.md` (integridad, transaccionalidad, auditoría, permisos, migraciones, EXPLAIN P1–P12; limpieza verificada 0 filas residuales).
