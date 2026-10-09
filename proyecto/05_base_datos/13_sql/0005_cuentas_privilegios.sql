-- =============================================================================
-- Paso 15 (autorizado 2026-10-09) — Unidad 0005: Cuentas y privilegios
-- Diseño: seguridad.md §2 (mínimo privilegio, RNF-004, AGENTS §12)
-- Motor: MySQL 8.0.46 · autenticación caching_sha2_password
--
-- DEPENDENCIAS (resueltas fuera del repositorio):
--   1. Cuentas creadas ANTES de ejecutar (contraseñas nunca en el repositorio,
--      RNF-004): se crean en Paso 16/17 desde .env del entorno. Plantilla:
--        CREATE USER IF NOT EXISTS 'app_rw'      @'%' IDENTIFIED BY '<desde .env>';
--        CREATE USER IF NOT EXISTS 'app_append'  @'%' IDENTIFIED BY '<desde .env>';
--        CREATE USER IF NOT EXISTS 'app_outbox'  @'%' IDENTIFIED BY '<desde .env>';
--        CREATE USER IF NOT EXISTS 'backup_ro'   @'%' IDENTIFIED BY '<desde .env>';
--        CREATE USER IF NOT EXISTS 'migrador'    @'%' IDENTIFIED BY '<desde .env>';
--        -- todos con plugin caching_sha2_password (declarado en el CREATE USER)
--   2. Sesión con el schema del proyecto SELECCIONADO (DATABASE() no NULL):
--      los GRANT se resuelven dinámicamente contra el schema en uso.
--   3. Cuenta ejecutora con ADMIN o con CREATE USER + GRANT OPTION sobre el schema
--      (uso puntual y auditado de `migrador`, seguridad.md §2).
-- NO EJECUTAR aún (etapa de ejecución = Paso 17, con autorización).
-- =============================================================================
SET @dbpref := CONCAT('`', DATABASE(), '`.');

-- ---------------------------------------------------------------------------
-- app_rw: operación normal. SELECT general; INSERT/UPDATE sobre tablas de
-- negocio (T1–T7, T10–T14); DELETE sólo en T12 (limpieza de caducadas, L-03).
-- Sin DDL, sin GRANT, sin privilegios de servidor (seguridad.md §2).
-- ---------------------------------------------------------------------------
SET @t_rw := '#usuario,#profesional,#servicio,#asociacion_profesional_servicio,#horario_habitual,#excepcion_disponibilidad,#cita,#notificacion,#parametro_operativo,#clave_idempotencia,#evento_outbox,#restablecimiento_contrasena';
SET @sql := CONCAT('GRANT SELECT ON ', @dbpref, '* TO ''app_rw''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;
SET @sql := CONCAT('GRANT INSERT ON ', REPLACE(@t_rw, '#', @dbpref), ' TO ''app_rw''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;
SET @sql := CONCAT('GRANT UPDATE ON ', REPLACE(@t_rw, '#', @dbpref), ' TO ''app_rw''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;
SET @sql := CONCAT('GRANT DELETE ON ', @dbpref, 'clave_idempotencia TO ''app_rw''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;

-- ---------------------------------------------------------------------------
-- app_append: append-only de T8/T9 en el MOTOR (RN-10/RN-11): sólo INSERT+SELECT.
-- ---------------------------------------------------------------------------
SET @sql := CONCAT('GRANT SELECT, INSERT ON ', @dbpref, 'historial_cambio_cita, ',
                   @dbpref, 'auditoria_operacion TO ''app_append''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;

-- ---------------------------------------------------------------------------
-- app_outbox: consumidor RNF-017 — SELECT general + INSERT de T13 (transacción
-- de negocio) + UPDATE acotado a columnas de proceso de T13 (column-level grant).
-- ---------------------------------------------------------------------------
SET @sql := CONCAT('GRANT SELECT ON ', @dbpref, '* TO ''app_outbox''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;
SET @sql := CONCAT('GRANT INSERT ON ', @dbpref, 'evento_outbox TO ''app_outbox''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;
SET @sql := CONCAT('GRANT UPDATE (estado, intentos, procesado_utc) ON ',
                   @dbpref, 'evento_outbox TO ''app_outbox''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;

-- ---------------------------------------------------------------------------
-- backup_ro: sólo lectura sobre todo el schema (RNF-015/016), red interna.
-- ---------------------------------------------------------------------------
SET @sql := CONCAT('GRANT SELECT ON ', @dbpref, '* TO ''backup_ro''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;

-- ---------------------------------------------------------------------------
-- migrador: DDL puntual y auditado sobre el schema del proyecto (Pasos 15/17);
-- nunca usado por la aplicación.
-- ---------------------------------------------------------------------------
SET @sql := CONCAT('GRANT ALL PRIVILEGES ON ', @dbpref, '* TO ''migrador''@''%''');
PREPARE gp FROM @sql; EXECUTE gp; DEALLOCATE PREPARE gp;

-- Verificación (ejecutar con privilegio de lectura sobre mysql.user):
--   SELECT user, host, plugin FROM mysql.user
--     WHERE user IN ('app_rw','app_append','app_outbox','backup_ro','migrador')
--     ORDER BY user;
