# Plan de migraciones — MySQL 8.0.46 / InnoDB — Paso 13

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 13 (estrategia forward/rollback **antes de ejecutar**), motor D-06/D-06-R1 (MySQL 8.0.46/InnoDB).
**Skills:** `database-schema-designer` + `databases` · **Fecha:** 9 de octubre de 2026.
**Restricción:** plan documental **sin generar scripts SQL** (Paso 15, requiere autorización) y **sin ejecutar** (Paso 17, requiere autorización y excluye operaciones destructivas sin ella).

## 1. Unidades de migración previstas

| # | Unidad | Tipo | Contenido (del diseño aprobado) | Rollback (reverse) |
|---|---|---|---|---|
| 0001 | Esquema base | Forward | **14 tablas** T1–T14 con tipos del `modelo_fisico.md`, PK (incl. compuesta T4 y PK naturales T11/T12), **18 FK** `ON DELETE RESTRICT`, **27 CHECK** por fila (salvo T9.tipo_operacion — L-04), UQ (T1.correo, T2.usuario_id, T5 dedup L-01, T11/T12.clave) | Eliminar objetos creados en orden inverso (sólo sobre BD **de desarrollo**, previa autorización) |
| 0002 | Índices | Forward | Catálogo del `indices_rendimiento.md` (P1–P12): soporte de FK faltantes + índices de patrón de acceso | Eliminar índices (reversible sin pérdida: son derivados) |
| 0003 | Índice único funcional E2 | Forward | Expresión NULL-segura de T6 (D-05b, Paso 08 §3) — **compatible con 8.0.46** (índices funcionales desde 8.0.13; verificar en Paso 15) | Eliminar índice |
| 0004 | CHK transversal de duración (condicional) | Forward | `fin_utc = inicio_utc + INTERVAL duracion_efectiva_min MINUTE` en T7 **sólo si** el preflight confirma soporte en la versión instalada; si no, no aplica (garantía en capa de servicio, D-05a) | Eliminar CHK |
| 0005 | Cuentas y privilegios | Forward (config) | `app_rw`, `app_append` (T8/T9 sólo INSERT+SELECT), `app_outbox` acotado, `backup_ro`, `migrador`; grants según `seguridad.md` §2 | Revocar grants |
| 0006 | Datos iniciales | Forward | Parámetros operativos T11 (valores por defecto de diseño; **T12 sin semilla**), catálogos de estado sólo si el modelo los exige como filas (T9 tipo_operación **no** es CHECK — sin semilla) | Borrado puntual de semilla (con autorización) |
| 0007+ | Evolutivas | Forward | Nuevas decisiones aprobadas (p. ej. valor de OD-01 al aprobarse → CHK o registro de parámetro; catálogo L-04 extensible sin DDL) | Reverse correspondiente |

**Cero unidades destructivas:** ninguna unidad incluye `DROP DATABASE`/`DROP TABLE`/`TRUNCATE` (workflow Paso 17 + RN-11: desactivar, no eliminar).

## 2. Patrón forward/rollback

- Cada unidad = **un par de scripts** `NNNN_up.*` / `NNNN_down.*` con **checksum SHA-256** registrado en el manifiesto (sin tabla de control, `versionamiento.md`).
- **Una unidad por commit DDL** cuando InnoDB lo permite (MySQL: DDL implícitamente commit-ea → cada unidad debe ser **idempotente o atómica**; se ejecuta en orden y un fallo detiene la cascada — nunca saltar unidades).
- **Idempotencia:** cada `up` tolera re-ejecución (comprobación previa de existencia del objeto) → ante fallo parcial no se duplican objetos.
- **Expand/contract** para cambios futuros compatibles con despliegue (RNF-024): añadir → backfill → (versión posterior) eliminar.

## 3. Secuencia de aplicación (Paso 17, con autorización)

1. **Preflight (instrucción 10): RESUELTO por D-06-R1** — `SELECT VERSION()` → confirmar **8.0.46** (versión local = objetivo). Confirmar `STRICT_TRANS_TABLES`, `utf8mb4`, `require_secure_transport`, usuario `migrador`. **No instalar ni actualizar MySQL.**
2. **Respaldo vigente** (RNF-015) del entorno objetivo.
3. Aplicar `0001 → 0002 → 0003 (si preflight ok) → 0004 (si soportado) → 0005 → 0006`, verificando objetos por unidad.
4. Verificación (Paso 18): esquema real vs `modelo_fisico.md` (14 tablas, 18 FK, 27 CHECK, UQ, índices), pruebas de resiliencia de integridad (violaciones rechazadas) y evidencias.
5. Rollback sólo como reversa de unidad, en desarrollo, con autorización; nunca sobre producción sin decisión humana.

## 4. Verificaciones

- Plan coherente con: 14 tablas intactas, R1–R16, D-05a/b/c, D-06, L-01/L-03/L-04, privilegios del Paso 09, índices del Paso 11.
- Sin SQL generado ni ejecutado; sin instalación de infraestructura; sin cambios en requisitos/modelos.

**Estado:** elaborado — agrupado con Pasos 07–14; siguiente checkpoint = autorización de SQL (Paso 15).
