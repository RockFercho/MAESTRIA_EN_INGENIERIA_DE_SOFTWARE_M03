-- =============================================================================
-- Paso 15 (autorizado 2026-10-09) — Unidad 0004: CHK transversal de duración (T7)
-- Decisión D-05a · integridad.md §4 · modelo_fisico.md T7 (coherencia inicio/fin)
-- CONDICIONAL (instrucción del workflow): aplicar sólo si el parser de CHECK de la
--   versión instalada acepta la expresión INTERVAL (validación empírica §6.a).
-- CONTINGENCIA D-05a: si el servidor la rechaza → NO aplicar esta unidad;
--   la garantía queda en la capa de servicio (validación de negocio en application).
-- Requiere: 0001 aplicado. Re-ejecución: error 1060 (constraint duplicado).
-- NO EJECUTAR aún (etapa de ejecución = Paso 17, con autorización).
-- =============================================================================
ALTER TABLE cita
  ADD CONSTRAINT chk_t7_duracion_coherencia
  CHECK (fin_utc = inicio_utc + INTERVAL duracion_efectiva_min MINUTE);
