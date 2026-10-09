-- =============================================================================
-- Paso 15 (autorizado por responsables 2026-10-09) — Unidad 0001: Esquema base
-- Proyecto: Sistema Web de Gestión de Citas y Atención Virtual
-- Motor objetivo: MySQL 8.0.46 / InnoDB (D-06-R1) · utf8mb4 · STRICT_TRANS_TABLES
-- Origen: modelo_fisico.md (Paso 07) · modelo_logico.md (Paso 04) · decisiones
--         V/OD/A/ER/L/D-05 · ADR-001 (única BD relacional)
-- Conteos exigidos: 14 tablas · 18 FK ON DELETE RESTRICT · 27 CHECK
-- NO EJECUTAR aún: la ejecución corresponde a la etapa autorizada (Paso 17).
-- Dependencia: servidor MySQL 8.0.46 con schema seleccionado por el ejecutor
--              (los scripts no crean ni eliminan bases de datos).
-- =============================================================================
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- T1 usuario — RF-001/002/003 · CA-001 · RNF-002/005 · RN roles (V-01/V-06)
CREATE TABLE IF NOT EXISTS usuario (
  id                INT NOT NULL AUTO_INCREMENT,
  nombre_completo   VARCHAR(150) NOT NULL,
  correo            VARCHAR(254) NOT NULL,
  hash_contrasena   VARCHAR(255) NOT NULL,
  rol               VARCHAR(20) NOT NULL DEFAULT 'solicitante',
  estado            VARCHAR(10) NOT NULL DEFAULT 'activo',
  creado_utc        DATETIME(3) NOT NULL,
  actualizado_utc   DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_t1_correo (correo),
  CONSTRAINT chk_t1_rol    CHECK (rol IN ('solicitante','profesional','administrador')),
  CONSTRAINT chk_t1_estado CHECK (estado IN ('activo','inactivo'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E1 usuarios; hash adaptativo (RNF-002); unico por correo (CA-001)';

-- T2 profesional — RF-004 · R1 (0..1 con usuario) · RN-11 (desactivar, no eliminar)
CREATE TABLE IF NOT EXISTS profesional (
  id                INT NOT NULL AUTO_INCREMENT,
  usuario_id        INT NOT NULL,
  datos_exhibicion  VARCHAR(255) NULL,
  estado            VARCHAR(10) NOT NULL,
  desactivado_utc   DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_t2_usuario (usuario_id),
  CONSTRAINT chk_t2_estado CHECK (estado IN ('activo','inactivo')),
  CONSTRAINT chk_t2_desactivado CHECK (
    (estado = 'activo'   AND desactivado_utc IS NULL) OR
    (estado = 'inactivo' AND desactivado_utc IS NOT NULL)),
  CONSTRAINT fk_t2_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E2 profesional; RF-004; coherencia estado/instante (integridad §1.4)';

-- T3 servicio — RF-005 · RN-04 (duracion configurable > 0)
CREATE TABLE IF NOT EXISTS servicio (
  id                INT NOT NULL AUTO_INCREMENT,
  nombre            VARCHAR(100) NOT NULL,
  descripcion       VARCHAR(500) NULL,
  duracion_minutos  INT NOT NULL,
  estado            VARCHAR(10) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_t3_duracion CHECK (duracion_minutos > 0),
  CONSTRAINT chk_t3_estado   CHECK (estado IN ('activo','inactivo'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E3 servicios; RF-005; duracion > 0 (RN-04)';

-- T4 asociacion_profesional_servicio — RF-006 · R5/ER-05 · RN-16 · RN-04 (prioridad)
CREATE TABLE IF NOT EXISTS asociacion_profesional_servicio (
  profesional_id       INT NOT NULL,
  servicio_id          INT NOT NULL,
  duracion_especifica  INT NULL,
  estado               VARCHAR(10) NOT NULL DEFAULT 'activa',
  registrado_utc       DATETIME(3) NOT NULL,
  baja_utc             DATETIME(3) NULL,
  PRIMARY KEY (profesional_id, servicio_id),
  KEY idx_t4_servicio (servicio_id),
  CONSTRAINT chk_t4_duracion CHECK (duracion_especifica IS NULL OR duracion_especifica > 0),
  CONSTRAINT chk_t4_estado   CHECK (estado IN ('activa','inactiva')),
  CONSTRAINT chk_t4_baja CHECK (
    (estado = 'activa'   AND baja_utc IS NULL) OR
    (estado = 'inactiva' AND baja_utc IS NOT NULL)),
  CONSTRAINT fk_t4_profesional FOREIGN KEY (profesional_id) REFERENCES profesional (id) ON DELETE RESTRICT,
  CONSTRAINT fk_t4_servicio    FOREIGN KEY (servicio_id)    REFERENCES servicio (id)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E4 asociacion N:M con PK compuesta (R5/ER-05); valida para RN-16';

-- T5 horario_habitual — RF-007 · RN-05/RN-15 · L-01 (deduplicacion; solapes: Paso 12)
CREATE TABLE IF NOT EXISTS horario_habitual (
  id              INT NOT NULL AUTO_INCREMENT,
  profesional_id  INT NOT NULL,
  dia_semana      VARCHAR(3) NOT NULL,
  hora_inicio     TIME NOT NULL,
  hora_fin        TIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_t5_dedup (profesional_id, dia_semana, hora_inicio),
  CONSTRAINT chk_t5_dia CHECK (dia_semana IN ('lun','mar','mie','jue','vie','sab','dom')),
  CONSTRAINT chk_t5_rango CHECK (hora_fin > hora_inicio),
  CONSTRAINT fk_t5_profesional FOREIGN KEY (profesional_id) REFERENCES profesional (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E5 horarios; L-01: UQ deduplica exacta; solapes entre filas via transaccion (Paso 12)';

-- T6 excepcion_disponibilidad — RF-008 · A-05 · D-05b (E2 en 0003; NO protege solapes)
CREATE TABLE IF NOT EXISTS excepcion_disponibilidad (
  id              INT NOT NULL AUTO_INCREMENT,
  profesional_id  INT NOT NULL,
  fecha           DATE NOT NULL,
  hora_inicio     TIME NULL,
  hora_fin        TIME NULL,
  tipo            VARCHAR(15) NOT NULL,
  motivo          VARCHAR(200) NULL,
  PRIMARY KEY (id),
  KEY idx_t6_fecha (profesional_id, fecha),
  CONSTRAINT chk_t6_horas CHECK (
    (hora_inicio IS NULL AND hora_fin IS NULL) OR
    (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_fin > hora_inicio)),
  CONSTRAINT chk_t6_tipo CHECK (tipo IN ('ausencia','feriado','bloqueo')),
  CONSTRAINT fk_t6_profesional FOREIGN KEY (profesional_id) REFERENCES profesional (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E6 excepciones A-05; anti-duplicados E2 = unidad 0003 (no impide solapes)';

-- T7 cita — RF-012..021 · RN-01/04/06/08 · RNF-010/011 · CA-003/004/005
CREATE TABLE IF NOT EXISTS cita (
  id                     INT NOT NULL AUTO_INCREMENT,
  solicitante_id         INT NOT NULL,
  profesional_id         INT NOT NULL,
  servicio_id            INT NOT NULL,
  inicio_utc             DATETIME(3) NOT NULL,
  fin_utc                DATETIME(3) NOT NULL,
  duracion_efectiva_min  INT NOT NULL,
  estado                 VARCHAR(15) NOT NULL DEFAULT 'Confirmada',
  justificacion_cambio   VARCHAR(500) NULL,
  creado_utc             DATETIME(3) NOT NULL,
  actualizado_utc        DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_t7_prof_inicio     (profesional_id, inicio_utc),
  KEY idx_t7_sol_inicio      (solicitante_id, inicio_utc),
  KEY idx_t7_servicio        (servicio_id),
  CONSTRAINT chk_t7_rango     CHECK (fin_utc > inicio_utc),
  CONSTRAINT chk_t7_duracion  CHECK (duracion_efectiva_min > 0),
  CONSTRAINT chk_t7_estado    CHECK (estado IN ('Confirmada','En atención','Atendida','Cancelada','No asistida')),
  CONSTRAINT fk_t7_solicitante FOREIGN KEY (solicitante_id) REFERENCES usuario (id)      ON DELETE RESTRICT,
  CONSTRAINT fk_t7_profesional FOREIGN KEY (profesional_id) REFERENCES profesional (id)  ON DELETE RESTRICT,
  CONSTRAINT fk_t7_servicio    FOREIGN KEY (servicio_id)    REFERENCES servicio (id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E7 cita; RN-08 estados (A-03 bloquean: Confirmada/En atencion); exclusión de solapes: transaccion Paso 12 (RNF-010)';

-- T8 historial_cambio_cita — RF-021/022 · RN-10/RN-11/RN-14 · append-only (Paso 09)
CREATE TABLE IF NOT EXISTS historial_cambio_cita (
  id                 INT NOT NULL AUTO_INCREMENT,
  cita_id            INT NOT NULL,
  usuario_id         INT NOT NULL,
  tipo_cambio        VARCHAR(20) NOT NULL,
  estado_anterior    VARCHAR(15) NULL,
  estado_nuevo       VARCHAR(15) NULL,
  fecha_anterior_utc DATETIME(3) NULL,
  fecha_nueva_utc    DATETIME(3) NULL,
  cambiado_utc       DATETIME(3) NOT NULL,
  justificacion      VARCHAR(500) NULL,
  PRIMARY KEY (id),
  KEY idx_t8_usuario (usuario_id),
  KEY idx_t8_cita_cambiado (cita_id, cambiado_utc),
  CONSTRAINT chk_t8_tipo   CHECK (tipo_cambio IN ('cambio_estado','reprogramacion')),
  CONSTRAINT chk_t8_estado CHECK (tipo_cambio <> 'cambio_estado' OR estado_nuevo IS NOT NULL),
  CONSTRAINT chk_t8_fecha  CHECK (tipo_cambio <> 'reprogramacion' OR fecha_nueva_utc IS NOT NULL),
  CONSTRAINT fk_t8_cita    FOREIGN KEY (cita_id)    REFERENCES cita (id)      ON DELETE RESTRICT,
  CONSTRAINT fk_t8_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E8 historial por evento (V-01; D-05c sin UQ de negocio); append-only por privilegios (Paso 09)';

-- T9 auditoria_operacion — RF-026 · RNF-013/026/030 · R12/R14 · L-04 (tipo sin CHECK)
CREATE TABLE IF NOT EXISTS auditoria_operacion (
  operacion_id     INT NOT NULL AUTO_INCREMENT,
  usuario_id       INT NOT NULL,
  cita_id          INT NULL,
  tipo_operacion   VARCHAR(40) NOT NULL,
  fecha_hora_utc   DATETIME(3) NOT NULL,
  resultado        VARCHAR(10) NOT NULL,
  contexto         VARCHAR(500) NULL,
  PRIMARY KEY (operacion_id),
  KEY idx_t9_usuario (usuario_id),
  KEY idx_t9_cita (cita_id),
  CONSTRAINT chk_t9_resultado CHECK (resultado IN ('exito','fallo')),
  CONSTRAINT fk_t9_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT,
  CONSTRAINT fk_t9_cita    FOREIGN KEY (cita_id)    REFERENCES cita (id)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E9 auditoria append-only (R12 cita 0..1, R14 usuario NN); tipo_operacion SIN CHECK (L-04, app); contexto sin secretos (RNF-026); correlacion T14/T8 via contexto';

-- T10 notificacion — RF-024/028 · RNF-017 · A-04 (instantanea) · OD-03 (sin estado lectura)
CREATE TABLE IF NOT EXISTS notificacion (
  id                 INT NOT NULL AUTO_INCREMENT,
  destinatario_id    INT NOT NULL,
  cita_id            INT NOT NULL,
  evento             VARCHAR(15) NOT NULL,
  instantanea_datos  TEXT NOT NULL,
  generado_utc       DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_t10_destinatario (destinatario_id),
  KEY idx_t10_cita (cita_id),
  CONSTRAINT chk_t10_evento CHECK (evento IN ('confirmada','reprogramada','cancelada')),
  CONSTRAINT fk_t10_destinatario FOREIGN KEY (destinatario_id) REFERENCES usuario (id) ON DELETE RESTRICT,
  CONSTRAINT fk_t10_cita         FOREIGN KEY (cita_id)         REFERENCES cita (id)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E10 notificaciones con instantanea (A-04, RF-024); sin estado de lectura (OD-03); desacopladas via outbox (RNF-017)';

-- T11 parametro_operativo — RN-12/R15 · RF-025 · sin filas semilla (0006; OD-01 pendiente)
CREATE TABLE IF NOT EXISTS parametro_operativo (
  clave          VARCHAR(100) NOT NULL,
  valor          VARCHAR(255) NOT NULL,
  descripcion    VARCHAR(200) NULL,
  modificado_por INT NOT NULL,
  modificado_utc DATETIME(3) NOT NULL,
  PRIMARY KEY (clave),
  CONSTRAINT fk_t11_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E11 parametros (anticipaciones RF-025/RN-12); indice FK implicito InnoDB';

-- T12 clave_idempotencia — RNF-012 · CA-007 · ER-02 · L-03 (TTL pendiente)
CREATE TABLE IF NOT EXISTS clave_idempotencia (
  clave               VARCHAR(100) NOT NULL,
  usuario_sesion      INT NOT NULL,
  tipo_operacion      VARCHAR(20) NOT NULL,
  solicitud_original  TEXT NOT NULL,
  resultado           TEXT NOT NULL,
  creada_utc          DATETIME(3) NOT NULL,
  caduca_utc          DATETIME(3) NOT NULL,
  PRIMARY KEY (clave),
  KEY idx_t12_sesion (usuario_sesion),
  CONSTRAINT chk_t12_tipo CHECK (tipo_operacion IN ('reserva','reprogramacion','cancelacion')),
  CONSTRAINT chk_t12_ttl  CHECK (caduca_utc > creada_utc),
  CONSTRAINT fk_t12_sesion FOREIGN KEY (usuario_sesion) REFERENCES usuario (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E12 idempotencia: PK unica global (RNF-012); TTL via L-03 (Paso 12)';

-- T13 evento_outbox — R16/ER-03 · RNF-017/CA-012 (escritura atomica con la cita)
CREATE TABLE IF NOT EXISTS evento_outbox (
  id              INT NOT NULL AUTO_INCREMENT,
  correlacion_id  VARCHAR(64) NOT NULL,
  tipo_evento     VARCHAR(25) NOT NULL,
  cita_id         INT NULL,
  carga           MEDIUMTEXT NOT NULL,
  estado          VARCHAR(10) NOT NULL DEFAULT 'pendiente',
  intentos        INT NOT NULL DEFAULT 0,
  creado_utc      DATETIME(3) NOT NULL,
  procesado_utc   DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_t13_cita (cita_id),
  KEY idx_t13_correlacion (correlacion_id),
  CONSTRAINT chk_t13_tipo    CHECK (tipo_evento IN ('cita_confirmada','cita_reprogramada','cita_cancelada')),
  CONSTRAINT chk_t13_estado  CHECK (estado IN ('pendiente','procesado')),
  CONSTRAINT chk_t13_intentos CHECK (intentos >= 0),
  CONSTRAINT fk_t13_cita FOREIGN KEY (cita_id) REFERENCES cita (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E13 outbox R16 (cita 0..1): fallos de notificacion no invalidan reservas (RNF-017)';

-- T14 restablecimiento_contrasena — RF-029 · RNF-029/030 · R11 · OD-02 (canal)
CREATE TABLE IF NOT EXISTS restablecimiento_contrasena (
  id              INT NOT NULL AUTO_INCREMENT,
  usuario_id      INT NOT NULL,
  hash_temporal   VARCHAR(255) NOT NULL,
  caduca_utc      DATETIME(3) NOT NULL,
  estado          VARCHAR(10) NOT NULL DEFAULT 'pendiente',
  creado_utc      DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_t14_usuario (usuario_id),
  CONSTRAINT chk_t14_estado CHECK (estado IN ('pendiente','usado','caducado')),
  CONSTRAINT fk_t14_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC
  COMMENT='E14 restablecimiento: solo hash (RNF-029/030); correlacion con T9 via contexto de auditoria';
