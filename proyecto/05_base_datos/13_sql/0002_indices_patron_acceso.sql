-- =============================================================================
-- Paso 15 (autorizado 2026-10-09) — Unidad 0002: Índices de patrón de acceso
-- Catálogo: indices_rendimiento.md §2 (P1–P12) · motor MySQL 8.0.46/InnoDB
-- Sólo índices secundarios NO enlazados a FK (los de soporte FK ya están en 0001
-- para que las FK se enlacen al índice diseñado y no a índices implícitos).
-- Requiere: 0001 aplicado. Re-ejecución: error de índice duplicado (1061) — no
--           duplica objetos; ejecutar una sola vez por unidad.
-- NO EJECUTAR aún (etapa de ejecución = Paso 17, con autorización).
-- =============================================================================
-- Omitidos por ser prefijo izquierdo de un índice ya creado (espejo del catálogo):
--   T5 (profesional_id, dia_semana) → cubierto por uq_t5_dedup
--   T8 cita_id (FK)                 → cubierto por idx_t8_cita_cambiado
--   T11 modificado_por (FK)         → índice implícito InnoDB (sin patrón P1–P12)

-- P2 acotado a estados bloqueantes (A-03: Confirmada / En atención)
CREATE INDEX idx_t7_prof_estado_inicio
  ON cita (profesional_id, estado, inicio_utc);

-- P6 auditoría por rango de fechas (RF-026, RNF-013)
CREATE INDEX idx_t9_fecha
  ON auditoria_operacion (fecha_hora_utc);

-- P8 consumidor outbox: pendiente más antiguo primero (RNF-017, CA-012)
CREATE INDEX idx_t13_estado_creado
  ON evento_outbox (estado, creado_utc);

-- Verificación de caducidad de restablecimientos (OD-02, RNF-030)
CREATE INDEX idx_t14_estado_caduca
  ON restablecimiento_contrasena (estado, caduca_utc);
