# Decisión humana D-06 — Selección del DBMS (Paso 06)

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Fecha:** 9 de octubre de 2026
**Estado:** **APROBADA — `APPROVED_STEP_06 — MYSQL_8_4_LTS_INNODB`**, con **enmienda D-06-R1 (misma fecha): versión objetivo `MYSQL_8_0_46_INNODB`** (ver sección final).
**Documento técnico:** `proyecto/05_base_datos/05_modelo_fisico/seleccion_dbms.md` (actualizado con el resultado; evidencia previa: `proyecto/03_resultados/evidencia_pre_d06/`).

## Decisión

**Motor seleccionado: MySQL 8.4 LTS con motor InnoDB** para la versión inicial del sistema.

**Justificación registrada (humana):**
1. Experiencia previa del desarrollador con MySQL.
2. Disponibilidad de MySQL en el entorno local.
3. Compatibilidad con ADR-001 (monolito modular, hexagonal interno, única BD relacional).
4. ACID, claves foráneas, índices y control de concurrencia vía InnoDB.
5. Reducción de tiempo de configuración, implementación y pruebas académicas.

**Alternativa evaluada y no adoptada en esta versión:** PostgreSQL 18 (recomendación inicial del Paso 06 por encaje funcional en exclusión de intervalos, `timestamptz` y UNIQUE con `NULLS NOT DISTINCT`) — **se conserva documentada como alternativa descartada para la versión inicial**, no rechazada técnicamente.

## Efectos en el workflow

> **Nota D-06-R1:** los efectos que mencionan "8.4" en esta sección corresponden a la decisión original; la **enmienda D-06-R1 (sección final)** fija la versión objetivo en **MySQL 8.0.46/InnoDB** y resuelve el preflight. La familia, el motor y todas las construcciones descritas son idénticos en ambas versiones (compatibilidad verificada en `15_reportes/compatibilidad_mysql_8046.md`).

- Pasos 07–14 (diseño físico, integridad, seguridad, auditoría/versionamiento, índices/rendimiento, transacciones/concurrencia, plan de migraciones, revisión DBA) se ejecutan **construidos para MySQL 8.4/InnoDB**.
- Diferencias resueltas hacia MySQL (autónomas, derivadas de esta decisión):
  - UNIQUE con **NULLs distintos** → solución E2 de T6 con validación transaccional + índice único funcional NULL-seguro (Paso 08).
  - Sin restricciones `EXCLUDE` → **estrategia transaccional de bloqueo** para solapes de reserva (Paso 12); **ninguna UNIQUE pretende impedir solapes**.
  - Instantes UTC → `DATETIME` con convención UTC (evita el límite 2038 de `TIMESTAMP`).
  - Dominios `enum_texto` → `VARCHAR` + `CHECK` (compatibles con el catálogo L-04).
- **Preflight de versión (instrucción 10):** entorno local verificado **MySQL 8.0.46** (cliente y servidor, Ubuntu 24.04, servicio activo) vs **8.4 LTS aprobada** → verificación y alineación de versión **antes de ejecutar cualquier script o migración** (Pasos 15/17); si la alineación exige cambios en el entorno, se solicitará decisión humana entonces. Las características de diseño usadas (CHECK, índices funcionales, utf8mb4, InnoDB) existen también en 8.0.46.

## Pendientes heredados (sin cambios)

- **OD-01** — valor de anticipación mínima para reservar (no bloqueante).
- **OD-02** — canal seguro de contraseñas temporales (no bloqueante).
- Detalles técnicos diferidos: TTL→Paso 12; E2 declarativa y CHK de duración→Paso 08/15; ER-02→backend; numeración R17 reservada.

**Siguiente:** Pasos 07–14 agrupados (documentales), hasta el checkpoint de autorización de SQL (Paso 15).

---

## Enmienda D-06-R1 — Versión objetivo: MySQL 8.0.46 (9 de octubre de 2026)

**Estado:** **APROBADA — decisión humana explícita del responsable.**

**Texto de la decisión (humana):** confirmado el entorno Ubuntu 24.04 con **MySQL 8.0.46**, se actualiza D-06 para establecer **MySQL 8.0.46 con InnoDB** como versión objetivo de desarrollo e implementación, en lugar de MySQL 8.4 LTS. Restricciones de la misma decisión: no instalar ni actualizar MySQL; no generar ni ejecutar SQL, migraciones ni código; conservar 14 tablas, R1–R16, ADR-001 y decisiones previas; no tocar requisitos ni evidencias históricas; mantener **bloqueado el Paso 15** hasta aprobación explícita posterior.

**Efectos registrados:**
1. **Familia/motor sin cambios:** MySQL + InnoDB, ADR-001, las 14 tablas, R1–R16, D-05a/b/c, L-01…L-04 y todas las decisiones anteriores **intactos**; sólo cambia la **versión** de la misma familia.
2. **Preflight (instrucción 10) resuelto:** la versión local (8.0.46) **coincide ahora con el objetivo** — no hay alineación pendiente.
3. **Compatibilidad verificada documentalmente** (sin ejecutar SQL): CHECK 8.0.16+, índices funcionales únicos 8.0.13+, operadores/funciones deterministas en CHECK, `DATETIME(3)`, `<=>`, `IFNULL`, `CONCAT`, FK `RESTRICT`, InnoDB RR + `FOR UPDATE`, errores 1213/1205, `caching_sha2_password` — todo soportado en 8.0.46. Informe: `proyecto/05_base_datos/15_reportes/compatibilidad_mysql_8046.md`.
4. **Observación registrada (pendiente de análisis humano, no bloqueante):** MySQL 8.0.46 es la última entrega de la serie 8.0 y **alcanzó EoL en abril de 2026** (Oracle *Sustaining Support*); la serie 8.4 LTS permanece con soporte activo. La decisión D-06-R1 **se mantiene tal cual aprobada**; se deja constancia del horizonte de soporte por si el responsable desea reevaluarlo en el futuro.
5. Documentos de los Pasos 06–14 **actualizados** para reflejar 8.0.46; la comparación §1–§8 de `seleccion_dbms.md` se conserva como historia (incluida la recomendación original de PostgreSQL 18).

**Siguiente checkpoint:** autorización humana para generar SQL (Paso 15) — **bloqueado**.
