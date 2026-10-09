# Decisiones Paso 16 — Conexión

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 16 (Conexión).
**Definición exacta (workflow):** "Leer credenciales solo desde `.env`. No escribir contraseñas en reportes ni commits."
**Fecha:** 9 de octubre de 2026.

## 1. Alcance ejecutado

Revisión de los scripts generados en el Paso 15 **únicamente en los aspectos de
conexión/credenciales** exigidos por el Paso 16. Sin ejecución de SQL.

## 2. Verificaciones

| # | Verificación | Resultado |
|---|---|---|
| 1 | Credenciales en los 7 scripts de `13_sql/` | **Ninguna** — sólo marcadores `<desde .env>` en comentarios de `0005` (plantillas de `CREATE USER` comentadas, sin valores) |
| 2 | Valores tipo contraseña en reportes/modelos (`IDENTIFIED BY '…'`, `password=…`) | **Ninguno** en todo `proyecto/` |
| 3 | Material tipo credencial en fixtures | Detectado en `9990` (hash bcrypt de muestra) → **corregido** en la intervención agrupada: `<HASH-PROBE-NO-REAL-NO-ES-CREDENCIAL>` |
| 4 | `.env` presente en el repositorio | **No existe** (correcto: no hay ejecución de conexión todavía) |
| 5 | `.gitignore` | `.env`, `.env.*`, `*.pem`, `*.key` ignorados; `!.env.example` permitido ✔ |
| 6 | Archivos de entorno trackeados (`git ls-files`) | **Ninguno** ✔ — nada que commitear con credenciales |
| 7 | Mecanismo de lectura desde `.env` | **Preparado**: creado `.env.example` (marcadores **vacíos**, cero credenciales) con las variables de conexión que usará el Paso 17 |

## 3. Correcciones agrupadas (una sola intervención)

1. `proyecto/05_base_datos/13_sql/9990_verificaciones_empiricas.sql`: fixture `hash_contrasena` → marcador no credencial (checksum actualizado en `decisiones_paso15_autorizacion_sql.md`).
2. Nuevo `.env.example` en la raíz: define `DB_HOST/DB_PORT/DB_NAME`, `DB_MIGRADOR_USER/PASSWORD` y las contraseñas de `app_rw/app_append/app_outbox/backup_ro`, todas **vacías** — se rellenan en `.env` local (fuera del repositorio) antes del Paso 17.

## 4. Pendientes documentados (no bloquean el Paso 16)

- **Validaciones empíricas** (sin ejecutar): §6.a CHK transversal, §6.b E2, §6.c CHECK/idempotencia (Pasos 17/18), §6.d EXPLAIN (Paso 19).
- **Paso 17 requerirá** (creación humana, fuera del repo): `.env` real con credenciales + servidor MySQL 8.0.46 accesible + cuentas de `0005` creadas.
- No bloqueantes heredados: OD-01, OD-02, TTL T12, EoL serie 8.0, índices prefijo omitidos, scripts down no generados, semillas T11 comentadas, literales `dia_semana`.

## 5. Restricciones cumplidas

Sin ejecución de SQL · sin Paso 17 · sin instalación/despliegue · sin cambios en requisitos, ADR ni decisiones aprobadas · sin activar semillas (OD-01 pendiente) · sin operaciones destructivas.

## 6. Aprobación humana (Paso 16)

**Fecha:** 2026-10-09 · **Decisión:** `APPROVED` por el responsable del proyecto.

Aprueba: verificaciones de seguridad de credenciales, creación de `.env.example`,
corrección del dato de prueba (9990) y registro de evidencias. Autoriza la
**continuidad controlada al preflight del Paso 17** con los límites definidos:
sin ejecutar scripts SQL/migraciones/semillas, sin crear ni modificar bases de
datos reales sin aprobación específica, sin secretos en el repositorio, sin
instalación ni despliegue, sin avanzar al Paso 18.

**Estado:** `HUMAN_STATUS: APPROVED_STEP_16 — STEP_17_PREFLIGHT_ONLY`.

## 7. Preflight del Paso 17 (ejecutado en modo sólo-lectura de sistema, 2026-10-09)

| Comprobación | Resultado |
|---|---|
| Cliente MySQL | `/usr/bin/mysql` → **8.0.46**-0ubuntu0.24.04.4 ✔ (igual que el objetivo D-06-R1) |
| Servidor | `/usr/sbin/mysqld` → **8.0.46** ✔ · proceso activo (PID 2069) |
| `mysqldump` (respaldo RNF-015) | 8.0.46 ✔ · `mysqladmin` 8.0.46 ✔ · `sha256sum`, `python3`, `git`, `openssl` ✔ |
| Red | `127.0.0.1:3306` y `33060` — **sólo localhost** (coherente con seguridad §3); socket `/run/mysqld/mysqld.sock` presente |
| Integridad de scripts | `sha256sum -c` sobre los 7 scripts = **todos OK** (coinciden con los registrados) |
| Destructivos en scripts | Sin `DROP DATABASE`/`DROP TABLE`/`TRUNCATE` (sólo `ALTER TABLE … ADD CONSTRAINT` en 0004) ✔ |
| Conexión con credenciales | **DENEGADA** (`Access denied for user 'rockfercho'@'localhost'`, sin `.env` ni `~/.my.cnf`) → **impedimento pendiente del responsable** (ver §8) |
| SQL de sólo lectura (`SELECT VERSION()`, `@@sql_mode`) | **No ejecutado** — requiere conexión credenciada → queda para el Paso 17 autorizado |

**Distinción pedida (instrucción 5):**
- *Sin modificar datos (hechas ahora):* versiones binarios, proceso/puerto/socket, inventario de herramientas, existencia/permisos de `.env*` y `.gitignore`, integridad SHA-256 de scripts, ausencia de destructivos y de credenciales, configuración de red del servidor.
- *Requieren conexión/ejecución SQL (Paso 17 autorizado):* `SELECT VERSION()`/`@@sql_mode`, `SHOW DATABASES`, creación del schema, respaldo `mysqldump`, aplicación de `0001→0006`, pruebas `9990` (§6.a/b/c), verificación de grants.

## 8. Impedimentos reales (requieren intervención del responsable)

1. **Credenciales de conexión:** no existe `.env` ni `~/.my.cnf`; el servidor rechaza al usuario del sistema. Para el Paso 17 debe crear usted el `.env` real (fuera del repositorio, usando `.env.example` como plantilla) con `DB_NAME` y las credenciales de la cuenta DDL (`migrador`), incluida la creación de esa cuenta en MySQL (no puedo crearla sin sus credenciales ni sin su aprobación específica).
2. **Autorización específica de ejecución:** aplicar scripts y crear el schema real requieren su aprobación explícita del Paso 17 (y el respaldo previo RNF-015 con `mysqldump`).

**Estado:** preflight ejecutado — detenido, esperando autorización de ejecución del Paso 17.
