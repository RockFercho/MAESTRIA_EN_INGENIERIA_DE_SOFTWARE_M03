# Validación final — Workflow 02 de Ingeniería de Base de Datos

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual (Módulo III — Maestría en Ingeniería de Software)
**Workflow:** `02_database_workflow` — **Pasos 01–20 completados** · **Fecha:** 9 de octubre de 2026
**Base de datos:** `gestion_citas_db` · MySQL **8.0.46** (`8.0.46-0ubuntu0.24.04.4`) · InnoDB · `utf8mb4_0900_ai_ci` · `STRICT_TRANS_TABLES`
**Resultado global de la validación: PASA** — esquema desplegado, verificado contra el diseño con paridad total (drift ninguno) y probado empíricamente; observaciones pendientes diferidas a la fase de backend por naturaleza (§7).
**APROBADO FINALMENTE** por el responsable el 9 de octubre de 2026 → workflow `02_database_workflow` **CERRADO** (`COMPLETED_CLOSED`).

## 1. Resultado del workflow por paso

| Paso | Salida | Estado |
|---|---|---|
| 01 Requisitos de datos | `01_requisitos_datos/requisitos_datos.md` | Completado (revisión registrada) |
| 02 Modelo conceptual | `02_modelo_conceptual/modelo_conceptual.md` | **APPROVED** (A-01…A-05) |
| 03 Diagrama E-R | `02_modelo_conceptual/diagrama_er.md` | **APPROVED** (ER-01…ER-05; corrección de cardinalidades Mermaid verificada) |
| 04 Modelo lógico | `03_modelo_logico/modelo_logico.md` | **APPROVED** (L-01…L-04) |
| 05 Normalización | `04_normalizacion/informe_normalizacion.md` (+ revisión O1–O3) | **APPROVED** (D-05a CHK transversal; D-05b E2 funcional; D-05c append-only por permisos) |
| 06 Selección DBMS | `05_modelo_fisico/seleccion_dbms.md` | **APPROVED con enmienda D-06-R1** (MySQL 8.0.46 + InnoDB; comparación PostgreSQL/MySQL/SQL Server) |
| 07 Diseño físico | `05_modelo_fisico/modelo_fisico.md` | Completado (agrupado 07–14) |
| 08 Integridad | `06_integridad/integridad.md` | Completado |
| 09 Seguridad | `07_seguridad/seguridad.md` | Completado (cuentas de mínimo privilegio) |
| 10 Auditoría/versionamiento | `08_auditoria/auditoria.md` · `09_versionamiento/versionamiento.md` | Completado |
| 11 Índices/rendimiento | `10_indices_rendimiento/indices_rendimiento.md` | Completado (catálogo ligado a P1–P12) |
| 12 Transacciones/concurrencia | `11_transacciones_concurrencia/transacciones_concurrencia.md` | Completado |
| 13 Migraciones | `12_migraciones/plan_migraciones.md` | Completado (patrón `NNNN_`; down pendiente por política) |
| 14 Revisión DBA | `15_reportes/revision_dba.md` | **STATUS: APPROVED** (+ `compatibilidad_mysql_8046.md`) |
| 15 Generación SQL | `13_sql/` (7 scripts, checksums SHA-256) | **APPROVED** (`decisiones_paso15_autorizacion_sql.md`) |
| 16 Conexión | `.env` (fuera del repo) · `.env.example` | **APPROVED** (`decisiones_paso16_conexion.md`; sin secretos en repo) |
| 17 Despliegue | `evidencia_paso17_ejecucion/` (evidencia + `9990_salida.txt`) | **APPROBADO** (0001–0006 aplicados; `0005` por intervención administrativa; realineación de privilegios verificada) |
| 18 Verificación base real | `15_reportes/documentacion_real.md` | **APPROBADO** (tier T2; paridad total; drift ninguno) |
| 19 Pruebas | `14_pruebas/resultados_pruebas.md` | **APROBADO** (PASA global) |
| 20 Informe final | `15_reportes/validacion_final.md` (este documento) | **APROBADO FINALMENTE** (responsable, 2026-10-09) — workflow cerrado |

Aprobaciones humanas registradas en `.agents/state/database-workflow.json` y en los archivos de decisión de `proyecto/04_decisiones/`.

## 2. Trazabilidad requisitos → modelo → evidencia

Fuentes: `requisitos_datos.md` (Paso 01) · RF 29 · RNF 30 · RN 16 · CA 15 · ADR-001 (`adr_001_arquitectura_monolito_modular_hexagonal.md`).

| Dominio de datos | Entidades (T1–T14) | Requisitos/reglas trazados | Evidencia de validación |
|---|---|---|---|
| Identidad y usuarios | `usuario`, `profesional`, `restablecimiento_contrasena` | RF-001..004, RF-029; RNF-002/029/030; CA-001/015; RN-11 | CHECK `chk_t1_*`, `chk_t14_*`; UQ `uq_t1_correo`, `uq_t2_usuario` (1062 reales); sólo hash (RNF-002/029) |
| Catálogo y asociaciones | `servicio`, `asociacion_profesional_servicio` | RF-005/006; RN-04/RN-16; CA-002 | CHK duración > 0; PK compuesta R5; `chk_t4_*` |
| Disponibilidad | `horario_habitual`, `excepcion_disponibilidad` | RF-007/008; RN-05; L-01; D-05b | UQ `uq_t5_dedup` (1062); E2 funcional `uq_t6_e2` (duplicados 1062, solapes permitidos — 9990); EXPLAIN P1/P10/P11 |
| Citas | `cita` | RF-012..020; RN-01..RN-08, RN-13/14; RNF-028; A-03 | CHK `chk_t7_*` incl. transversal de duración (3819 reales); FK 1452/1451; UTC en `DATETIME(3)` (RN-15/RNF-028) |
| Historial y auditoría | `historial_cambio_cita`, `auditoria_operacion` | RF-021/022/026; RN-08/10/11; RNF-013/026; CA-006; D-05c/L-04 | Append-only por permisos (`app_append` sin UPDATE/DELETE); `tipo_operacion` sin CHECK (L-04, verificado); 0 triggers |
| Notificación y outbox | `notificacion`, `evento_outbox` | RF-024/028; RNF-017; CA-012; A-04 | CHK dominios; índices P5/P8; diseño desacoplado |
| Operación e idempotencia | `parametro_operativo`, `clave_idempotencia` | RF-025; RN-12/13; RNF-012; CA-004/005/007 | PK global (1062); TTL `chk_t12_ttl` (3819); semillas T11 comentadas (OD-01) |

Correspondencia confirmada: **requisitos → decisiones (A/ER/L/D-0x) → modelo lógico/físico → scripts `0001–0006` → esquema vivo → pruebas**. Ninguna entidad, atributo, relación, restricción o índice del modelo aprobado falta en la base real; ninguno inventado (Paso 18: identity-diff vacío).

## 3. Estado del esquema real (verificado, Paso 18)

14 tablas InnoDB · 97 columnas · 14 PK (15 columnas; T4 compuesta) · 18 FK (todas `RESTRICT`/`NO ACTION`) · 3 UNIQUE + 1 UNIQUE funcional (`uq_t6_e2`, NULL-seguro) · 28 CHECK (27 + CHK transversal 0004) · 24 índices secundarios (19 `idx_*` + FK T11 + 4 `uq_*`) · 0 triggers/vistas/rutinas · 0 filas (BD nueva, lista para datos).

## 4. Evidencias de ejecución y pruebas

- **Despliegue (Paso 17):** `CREATE DATABASE` + `0001–0004` OK; `0006` OK (0 parámetros); `9990` OK con resultados esperados (3819/1062/solapes permitidos/conteos/rollback 0). Evidencia: `evidencia_paso17_ejecucion/`.
- **Privilegios (0005):** 5 cuentas de servicio en host `localhost` equivalen **exactamente** al diseño (corrección administrativa verificada con `SHOW GRANTS`; observación cerrada). `migrador` con `ALL PRIVILEGES` de esquema para DDL auditado; la aplicación nunca lo usa.
- **Pruebas (Paso 19):** integridad PK/UQ/FK/CHECK por violación real; transaccionalidad con `ROLLBACK` limpio (0 filas residuales); append-only; checksums de migraciones 7/7; capacidad de respaldo `mysqldump` (RNF-015); EXPLAIN P1–P12 usando los índices previstos.

## 5. ADR y decisiones incorporadas

- **ADR-001** (monolito modular hexagonal): la base es el límite de persistencia único del monolito; sin cambios estructurales requeridos.
- **D-06-R1:** versión objetivo MySQL 8.0.46 (local = objetivo, verificado al ejecutar).
- **D-05a/b/c, L-01/L-03/L-04:** CHECK transversal, anti-duplicados E2 de dos capas, append-only por permisos, deduplicación, TTL, catálogo libre T9.
- **Pendientes humanos heredados (no bloqueantes):** OD-01 (valor de anticipación mínima para reservar), OD-02 (canal seguro de contraseñas temporales), valor numérico de TTL T12, observación EoL de la serie MySQL 8.0 (abril 2026, Sustaining).

## 6. Correspondencia final requisitos ↔ verificación

**Comprobado empíricamente en esta práctica:** integridad estructural completa (PK/FK/UQ/CHECK/DEFAULT/NN), normalización 3FN (Paso 05), E2 anti-duplicados con NULL-seguridad, CHK transversal de duración, idempotencia estructural (PK + TTL CHK), auditoría e historial append-only en el motor de permisos, mínimo privilegio de las 5 cuentas, transaccionalidad básica, planes de acceso de los 12 patrones, migraciones aplicadas e integrales (checksums), capacidad de respaldo, paridad diseño↔real sin drift, y ausencia de secretos en el repo (RNF-004).

**Pendiente de validación durante el desarrollo backend (por naturaleza, no por déficit de esta práctica):**
1. **Rendimiento p95:** RNF-006 (< 800 ms disponibilidad) y RNF-007 (< 1200 ms reserva) — requieren datos de perfil (1.000 usuarios / 10.000 citas) y medición; RNF-008 (100 concurrentes) — requiere la aplicación con pool de conexiones.
2. **Autenticación y autorización funcionales:** RNF-002/003 (hash adaptativo, login, verificación en servidor) — login por cuenta de servicio no ejecutable sin credenciales (RNF-004); se probará con la aplicación.
3. **Comportamiento transaccional de negocio:** RN-03/RN-09 (solapes), RN-16 (asociación vigente), L-01/L-03 (solapes de horario y TTL operativo) — el diseño los soporta; la lógica se implementa y prueba en backend (Pasos 03–06 de aplicación).
4. **Operación de datos:** semillas T11 (OD-01), canal OD-02, valor de TTL, respaldos periódicos productivos (RNF-015/016, CA-013).

## 7. Observaciones y riesgos

- **P12 (limpieza TTL)** planifica `type=ALL` sin índice en `caduca_utc`: intencional (tabla pequeña, limpieza batch; evitar índices decorativos). Revisar si la tabla crece por encima de lo previsto.
- **Serie MySQL 8.0 en EoL/Sustaining** desde abril 2026 (D-06-R1): evaluar migración de versión antes de producción.
- Contadores `AUTO_INCREMENT` elevados por fixtures con `ROLLBACK`: benigno, sin filas residuales.
- Scripts `down/rollback` no generados (política: requieren autorización explícita); el plan de migraciones los contempla.

## 8. Seguridad

Sin credenciales ni secretos en el repositorio o informes (RNF-004); `.env` fuera del control de versiones con plantilla `.env.example`; conexión por `MYSQL_PWD` sin ficheros temporales residuales; cuentas de servicio de mínimo privilegio verificadas; `migrador` aislado para DDL auditado; auditoría sin secretos en `contexto` (RNF-026, diseño).

## 9. Cierre

El workflow `02_database_workflow` está **completado en los Pasos 01–20** con todas sus aprobaciones humanas registradas. La **práctica de base de datos puede considerarse finalizada** tras la revisión de este informe por el responsable; el trabajo continúa en el desarrollo backend (workflow 03 en adelante), donde se validarán los ítems diferidos del §6.

**Documento:** `proyecto/05_base_datos/15_reportes/validacion_final.md` · Sin modificaciones de esquema ni datos · Sin secretos.
