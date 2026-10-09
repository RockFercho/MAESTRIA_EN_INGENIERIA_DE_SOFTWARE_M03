-- =============================================================================
-- Paso 15 (autorizado 2026-10-09) — Unidad 0003: Índice único funcional E2 (T6)
-- Decisión D-05b · integridad.md §3 · compatibilidad_mysql_8046.md §2.3 (8.0.13+)
-- Expresión NULL-segura: nunca evalúa a NULL → UNIQUE aplicable a todas las filas,
--   incluida la jornada completa (hora_inicio/hora_fin = NULL).
-- ALCANCE E2 (instrucción humana): sólo anti-duplicados EXACTOS de excepción.
--   NO protege contra solapamientos de rangos distintos (RN-03/RN-09) — esa
--   garantía es transaccional en la capa de servicio (Paso 12, RNF-010).
-- Requiere: 0001 aplicado. Re-ejecución: error 1061 — no duplica objetos.
-- NO EJECUTAR aún (etapa de ejecución = Paso 17, con autorización).
-- Validación empírica pendiente: §6.b (9990_verificaciones_empiricas.sql).
-- =============================================================================
CREATE UNIQUE INDEX uq_t6_e2
  ON excepcion_disponibilidad (
    (CONCAT(profesional_id, '|', fecha, '|', tipo, '|',
            IFNULL(hora_inicio, 'D'), '|', IFNULL(hora_fin, 'D')))
  );
