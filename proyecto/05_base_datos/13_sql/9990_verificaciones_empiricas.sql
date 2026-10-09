-- =============================================================================
-- Paso 15 (autorizado 2026-10-09) — Verificaciones empíricas PREPARADAS
-- Propósito: validaciones §6.a / §6.b / §6.c de compatibilidad_mysql_8046.md.
--   §6.d (EXPLAIN P1–P12) NO está aquí: corresponde al Paso 19 con datos de prueba.
--
-- REQUIERE: 0001–0004 aplicados (0004 opcional — ver §6.a).
-- EJECUCIÓN (sólo en etapa autorizada, Paso 17/18, entorno de desarrollo):
--   * Recomendado: `mysql --force` o ejecución por bloques, porque las PRUEBAS
--     NEGATivas deben fallar. Códigos esperados: 3819 = CHECK violada,
--     1062 = duplicado de clave única. Un error DIFERENTE al esperado = FALLO.
--   * Todo el bloque de datos va dentro de START TRANSACTION … ROLLBACK
--     (fixtures 990001 se descartan; sin residuos).
-- =============================================================================
SELECT VERSION()  AS esperado_8_0_46;              -- debe ser 8.0.46 (D-06-R1)
SELECT @@sql_mode AS sql_mode;                     -- debe contener STRICT_TRANS_TABLES
SELECT DATABASE() AS schema_en_uso;                -- NO debe ser NULL

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- Fixtures (eliminados por ROLLBACK)
-- ---------------------------------------------------------------------------
INSERT INTO usuario (id, nombre_completo, correo, hash_contrasena, rol, estado, creado_utc, actualizado_utc)
VALUES (990001, 'T15 Probe', 't15.probe@example.invalid',
        '<HASH-PROBE-NO-REAL-NO-ES-CREDENCIAL>',
        'administrador', 'activo', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3));
INSERT INTO profesional (id, usuario_id, datos_exhibicion, estado, desactivado_utc)
VALUES (990001, 990001, 'Probe', 'activo', NULL);
INSERT INTO servicio (id, nombre, descripcion, duracion_minutos, estado)
VALUES (990001, 'Servicio probe', NULL, 30, 'activo');

-- ---------------------------------------------------------------------------
-- §6.a — CHK transversal de duración (unidad 0004, D-05a)
-- ---------------------------------------------------------------------------
-- A1) Cita coherente (fin = inicio + 30 min) → debe INSERTAR (OK)
INSERT INTO cita (id, solicitante_id, profesional_id, servicio_id, inicio_utc, fin_utc,
                  duracion_efectiva_min, estado, justificacion_cambio, creado_utc, actualizado_utc)
VALUES (990001, 990001, 990001, 990001,
        '2026-03-02 10:00:00.000', '2026-03-02 10:30:00.000',
        30, 'Confirmada', NULL, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3));

-- A2) Cita incoherente (fin = inicio + 45 min, duracion 30) →
--     esperado ERROR 3819 (chk_t7_duracion_coherencia).
--     Si devuelve OK → unidad 0004 no aplicada: aplica contingencia D-05a
--     (garantía en capa de servicio) y registrar §6.a como no aplicable.
INSERT INTO cita (id, solicitante_id, profesional_id, servicio_id, inicio_utc, fin_utc,
                  duracion_efectiva_min, estado, justificacion_cambio, creado_utc, actualizado_utc)
VALUES (990002, 990001, 990001, 990001,
        '2026-03-02 11:00:00.000', '2026-03-02 11:45:00.000',
        30, 'Confirmada', NULL, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3));

-- ---------------------------------------------------------------------------
-- §6.b — Índice único funcional E2 (unidad 0003, D-05b)
-- ---------------------------------------------------------------------------
-- B1) Jornada completa (NULL, NULL) → debe INSERTAR (OK)
INSERT INTO excepcion_disponibilidad (id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo)
VALUES (990001, 990001, '2026-03-02', NULL, NULL, 'bloqueo', 'probe B1');
-- B2) Duplicado exacto de B1 → esperado ERROR 1062 (uq_t6_e2)
INSERT INTO excepcion_disponibilidad (id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo)
VALUES (990002, 990001, '2026-03-02', NULL, NULL, 'bloqueo', 'probe B2');
-- B3) Rango con horas → debe INSERTAR (OK)
INSERT INTO excepcion_disponibilidad (id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo)
VALUES (990003, 990001, '2026-03-03', '09:00:00', '13:00:00', 'ausencia', 'probe B3');
-- B4) Duplicado exacto de B3 → esperado ERROR 1062 (uq_t6_e2)
INSERT INTO excepcion_disponibilidad (id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo)
VALUES (990004, 990001, '2026-03-03', '09:00:00', '13:00:00', 'ausencia', 'probe B4');
-- B5) Rango SOLAPADO distinto (11:00–13:00 sobre 09:00–13:00) → debe INSERTAR (OK):
--     E2 NO protege solapes (alcance aprobado); exclusión de solapes = Paso 12.
INSERT INTO excepcion_disponibilidad (id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo)
VALUES (990005, 990001, '2026-03-03', '11:00:00', '13:00:00', 'bloqueo', 'probe B5');
-- B6) Mismo hueco de jornada con OTRO tipo → debe INSERTAR (OK; E2 incluye tipo)
INSERT INTO excepcion_disponibilidad (id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo)
VALUES (990006, 990001, '2026-03-02', NULL, NULL, 'feriado', 'probe B6');

-- ---------------------------------------------------------------------------
-- §6.c — CHECK IN / nulidades / idempotencia (L-04, ER-02)
-- ---------------------------------------------------------------------------
-- C1) Estado de cita fuera de dominio → esperado ERROR 3819 (chk_t7_estado)
INSERT INTO cita (id, solicitante_id, profesional_id, servicio_id, inicio_utc, fin_utc,
                  duracion_efectiva_min, estado, justificacion_cambio, creado_utc, actualizado_utc)
VALUES (990003, 990001, 990001, 990001,
        '2026-03-04 10:00:00.000', '2026-03-04 10:30:00.000',
        30, 'Pendiente', NULL, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3));
-- C2) Excepción con una sola hora → esperado ERROR 3819 (chk_t6_horas)
INSERT INTO excepcion_disponibilidad (id, profesional_id, fecha, hora_inicio, hora_fin, tipo, motivo)
VALUES (990007, 990001, '2026-03-05', '10:00:00', NULL, 'bloqueo', 'probe C2');
-- C3) T12 con caducidad no posterior a creación → esperado ERROR 3819 (chk_t12_ttl)
INSERT INTO clave_idempotencia (clave, usuario_sesion, tipo_operacion, solicitud_original,
                                resultado, creada_utc, caduca_utc)
VALUES ('probe:idem:c3', 990001, 'reserva', '{}', '{}',
        '2026-03-02 10:00:00.000', '2026-03-02 09:00:00.000');
-- C4) T12 válido → debe INSERTAR (OK)
INSERT INTO clave_idempotencia (clave, usuario_sesion, tipo_operacion, solicitud_original,
                                resultado, creada_utc, caduca_utc)
VALUES ('probe:idem:c4', 990001, 'reserva', '{}', '{}',
        UTC_TIMESTAMP(3), DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 1 HOUR));
-- C5) Repetir clave de C4 → esperado ERROR 1062 (PK global, RNF-012)
INSERT INTO clave_idempotencia (clave, usuario_sesion, tipo_operacion, solicitud_original,
                                resultado, creada_utc, caduca_utc)
VALUES ('probe:idem:c4', 990001, 'reserva', '{}', '{}',
        UTC_TIMESTAMP(3), DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 1 HOUR));
-- C6) L-04: tipo_operacion arbitrario fuera de catálogo → debe INSERTAR (OK,
--     validación en aplicación, sin CHECK en T9)
INSERT INTO auditoria_operacion (operacion_id, usuario_id, cita_id, tipo_operacion,
                                 fecha_hora_utc, resultado, contexto)
VALUES (990001, 990001, NULL, 'operacion_arbitraria_l04',
        UTC_TIMESTAMP(3), 'exito', 'probe C6');

-- ---------------------------------------------------------------------------
-- Conteos de integridad (esperados de diseño)
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS tablas_esperado_14
  FROM information_schema.tables
 WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';
SELECT COUNT(*) AS fk_esperado_18
  FROM information_schema.referential_constraints
 WHERE constraint_schema = DATABASE();
SELECT COUNT(*) AS chk_esperado_27_mas_1_si_0004
  FROM information_schema.check_constraints
 WHERE constraint_schema = DATABASE();
SELECT index_name
  FROM information_schema.statistics
 WHERE table_schema = DATABASE()
   AND table_name = 'excepcion_disponibilidad'
   AND index_name = 'uq_t6_e2';

-- ---------------------------------------------------------------------------
-- Limpieza total de fixtures (los INSERT fallidos no dejaron filas)
-- ---------------------------------------------------------------------------
ROLLBACK;
SELECT COUNT(*) AS filas_probe_t15_tras_rollback
  FROM usuario WHERE id = 990001;                  -- esperado: 0
