# Versionamiento de esquema y migraciones (estrategia) — Paso 10

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 10 (b), motor D-06/D-06-R1 (MySQL 8.0.46/InnoDB).
**Fecha:** 9 de octubre de 2026.
**Restricción:** estrategia **documental**; la **generación** de scripts es el Paso 15 y la **ejecución** el Paso 17 — ambos requieren autorización humana expresa (workflow + AGENTS §17).

## 1. Estrategia de versionado

| Aspecto | Decisión |
|---|---|
| Unidad | **Scripts numerados secuencialmente** (`0001_…`, `0002_…`) con par **forward + rollback** por unidad |
| Registro de aplicación | **Fuera de la base de datos**: manifiesto en repositorio con número de versión, checksum SHA-256 de cada script, fecha, entorno y responsable → **no se crea tabla de control** (preserva las 14 entidades aprobadas; una tabla `schema_migrations` requeriría aprobación humana explícita) |
| Integridad del manifiesto | El checksum detecta edición posterior ("drift") de un script ya aplicado; discrepancia = bloqueo y revisión |
| Orden | Las migraciones se aplican **estrictamente en orden**; nunca a medias (una unidad = una transacción DDL cuando el motor lo permita) |
| Compatibilidad | Patrón **expand/contract**: primero añadir (columnas/tablas nuevas o columnas compatibles), migrar/backfill, y sólo en una versión posterior eliminar — así la versión anterior de la aplicación sigue funcionando durante el despliegue (RNF-024, despliegue contenedorizado) |

## 2. Dependencia con decisiones aprobadas

- Los **primeros scripts** materializarán el diseño de los Pasos 07–08 (14 tablas, FK RESTRICT, CHECK, UQ, índice único funcional E2) — **sólo tras autorización del Paso 15**.
- Cambios de dominio aprobados a futuro (p. ej. nuevo valor del catálogo L-04) = nueva migración aprobada.
- **Prohibido** en cualquier migración: `DROP DATABASE`, `DROP TABLE`, `TRUNCATE` o equivalentes destructivos **sin autorización explícita** (workflow Paso 17) — la política de borrado es RF-004/RN-11: desactivar, no eliminar.

## 3. Precondiciones obligatorias antes de ejecutar (preflight)

1. **Versión local (instrucción 10): RESUELTA por D-06-R1** — versión local **MySQL 8.0.46** = versión objetivo; antes de ejecutar: confirmar con `SELECT VERSION()` que el servidor sigue en 8.0.46 y no se ha modificado el entorno (sin instalaciones ni actualizaciones autorizadas fuera de esta verificación).
2. **Modo estricto y charset:** confirmar `STRICT_TRANS_TABLES` y `utf8mb4` (Paso 09).
3. **Respaldo vigente** (RNF-015) antes de cualquier migración no trivial; **prueba de restauración** previa al despliegue y trimestral (RNF-016).
4. **Usuario `migrador`** con DDL (uso puntual), nunca la cuenta de aplicación.
5. **Verificación de expresiones** usadas en CHECK (aritmética de intervalos, §4 de `integridad.md`) contra la versión instalada — si no son soportadas, se documenta y aplica la garantía de capa de servicio (D-05a).

## 4. Evidencia y trazabilidad

- Cada aplicación de migración queda registrada en el manifiesto + logs del entorno (RNF-026 sin secretos).
- Las migraciones forman parte de la entrega académica: scripts versionados en `proyecto/05_base_datos/13_sql/` **una vez autorizados** (Paso 15) y su plan aquí documentado.

## 5. Verificaciones

- Sin SQL generado ni ejecutado; sin infraestructura; sin tablas nuevas; modelos/requisitos intactos.
- Estrategia coherente con ADR-001, RNF-015/016/024 y con las políticas de borrado (RF-004/RN-11).

**Estado:** elaborado — agrupado con Pasos 07–14.
