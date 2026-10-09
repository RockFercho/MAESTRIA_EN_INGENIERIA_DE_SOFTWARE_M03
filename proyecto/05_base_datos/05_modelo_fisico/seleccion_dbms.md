# Selección del DBMS — Paso 06

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 06 (Selección del DBMS).
**Skill:** `databases` (comparación con versiones objetivo sept. 2026).
**Fecha:** 9 de octubre de 2026.
**Entradas:** RF/RNF/CA, `reglas_negocio.md`, `restricciones.md`, ADR-001, `perfil_carga.md`, decisiones OD/A/ER/L/D-05 aprobadas, `modelo_logico.md` (Paso 04), `informe_normalizacion.md` + `revision_complementaria_o1_o2_o3.md` (Paso 05 **aprobados**).
**Restricción:** documento de análisis **sin SQL, sin migraciones, sin instalación, sin código, sin despliegue**.

---

## 0. Resultado — D-06 (aprobada el 9 de octubre de 2026), con enmienda D-06-R1

| | |
|---|---|
| **Motor seleccionado** | **MySQL + InnoDB** — versión objetivo **8.0.46** (**D-06-R1**, decisión humana del 9 de octubre de 2026; D-06 original: 8.4 LTS, `APPROVED_STEP_06 — MYSQL_8_4_LTS_INNODB`) |
| **Justificación humana** | Experiencia previa del desarrollador · disponibilidad en el entorno local (Ubuntu 24.04, MySQL 8.0.46 instalado) · compatibilidad con ADR-001 · ACID/FK/índices/concurrencia InnoDB · menor tiempo de configuración y pruebas académicas |
| **Alternativa descartada para esta versión** | **PostgreSQL 18** — recomendación inicial de §6, **conservada como alternativa evaluada**, no adoptada por decisión humana (no es un rechazo técnico) |
| **Preflight local (instrucción 10)** | **RESUELTO por D-06-R1:** versión local **MySQL 8.0.46** (cliente y servidor) **coincide con el objetivo** → sin alineación pendiente; verificar `SELECT VERSION()` al momento de ejecutar (Pasos 15/17) |
| **Compatibilidad 8.0.46** | Verificada documentalmente para tipos, CHECK (8.0.16+), índices funcionales únicos (8.0.13+), FK `RESTRICT`, transacciones/bloqueos e idempotencia → `15_reportes/compatibilidad_mysql_8046.md` |
| **Observación de ciclo de vida** | 8.0.46 es la última entrega de la serie 8.0 (EoL abril 2026, *Sustaining Support*); registrada como pendiente de análisis humano no bloqueante — la decisión se mantiene aprobada |
| **Registro** | `proyecto/04_decisiones/decisiones_paso06_d06_mysql.md` (incl. enmienda D-06-R1) · evidencia previa `evidencia_pre_d06/` |
| **Efecto** | Pasos 07–14 construidos para **MySQL 8.0.46/InnoDB**; la §6 queda como análisis de alternativas |

Las secciones siguientes conservan la comparación original **sin modificar** (§1–§8), incluida la recomendación inicial y sus justificaciones, como historia de la decisión.

## 1. Restricciones previas verificadas

| Fuente | Hallazgo | Efecto |
|---|---|---|
| `restricciones.md` | **No hay motor preseleccionado**; elección debe justificarse por requisitos, **no por preferencia** | Se comparan las tres familias exigidas por el workflow |
| `restricciones.md` | Linux + **contenerización** + configuración externa + **mantenimiento activo y documentación** | Filtro obligatorio de viabilidad |
| ADR-001 | **Única BD relacional**; consistencia transaccional; el ADR **no** selecciona motor | Elige entre RDBMS ACID; nada de NoSQL ni nube |
| `perfil_carga.md` | 1.000 usuarios, 10.000 citas, **100 concurrentes**; p95 < 800/1200 ms (RNF-006/007/008) | Escala **pequeña-media**: los tres motores la soportan; la decisión se resuelve por **encaje funcional**, no por capacidad bruta |
| Restricción de nube | Sin proveedor de nube seleccionado | Modelo **autoalojado en contenedor** para los tres |

## 2. Criterios de evaluación (derivados de requisitos aprobados)

| # | Criterio | Origen |
|---|---|---|
| C1 | ACID, bloqueo a nivel de fila/MVCC para exclusión de reservas concurrentes | RN-09, RN-03, RNF-010/011, ADR-001 |
| C2 | Almacenamiento de instantes en **UTC** con zona explícita | RNF-028, RN-15 |
| C3 | UNIQUE de la identidad **E2 con columnas NULL** (jornada completa) | D-05b (aprobada) |
| C4 | CHECK de coherencia `fin = inicio + duración` | D-05a (aprobada) |
| C5 | Restricción de **exclusión de intervalos solapados** (RN-03) — Paso 12 | RN-03, RNF-010, §5 modelo lógico |
| C6 | Idempotencia (PK única de claves) y auditoría append-only | RNF-012, RF-026, RN-10/11 |
| C7 | Linux + imagen de contenedor + configuración externa | RNF-023/024, restricciones.md |
| C8 | Respaldos diarios ≥ 7 días y prueba de restauración | RNF-015/016 |
| C9 | Mantenimiento activo, documentación, actualizaciones razonables | restricciones.md |
| C10 | Seguridad: autenticación moderna, TLS, hash de contraseñas, sin secretos en logs | RNF-001/002/004/026 |
| C11 | Recursos disponibles / licencias (costo evitable si el encaje es equivalente) | AGENTS §11 (recursos, restricciones académicas) |
| C12 | Soporte operativo a 100 conexiones concurrentes (pool) | RNF-008 |

## 3. Alternativas comparadas (versiones objetivo: skill `databases`)

| Alternativa | Versión de referencia | Naturaleza |
|---|---|---|
| **A1 PostgreSQL** | 18.6 (ramas 17.11/16.15/15.19 soportadas; EOL 18 → 2030-11) | Open source (licencia permisiva PostgreSQL) |
| **A2 MySQL / MariaDB** | MySQL 8.4.12 (LTS) · MariaDB 11.8.6 (LTS, EOL 2028-06) | Open source (GPL); familia evaluada como un candidato con matices |
| **A3 SQL Server** | 2025 RTM + CU8 | Comercial (licencia; ediciones Developer/Express con límites) |

**Descartada sin comparación formal:** SQLite — no es servidor multiusuario ACID concorrente adecuado para RN-09/RNF-010/011 en despliegue contenedorizado cliente-servidor (100 concurrentes, verificación servidor RNF-003).

## 4. Matriz de comparación

Leyenda: **✓** cumple bien · **△** cumple con matiz/costo · **✗** no cumple o es claramente inferior.

| Criterio | A1 PostgreSQL | A2 MySQL/MariaDB | A3 SQL Server |
|---|---|---|---|
| C1 ACID + concurrencia (RN-09, RNF-010/011) | ✓ MVCC + bloqueo de fila | ✓ InnoDB MVCC | ✓ MVCC (READ COMMITTED) |
| C2 UTC explícito (RNF-028) | ✓ `timestamptz` con zona, almacena UTC por diseño | △ `TIMESTAMP` limita a 2038 → usar `DATETIME` + convención; zona depende de configuración | ✓ `DATETIME2` + `AT TIME ZONE`; requiere disciplina de convención |
| C3 UNIQUE E2 con NULLs (D-05b) | ✓ `UNIQUE … NULLS NOT DISTINCT` (15+) cubre `(NULL,NULL)` | ✗ UNIQUE trata NULLs como distintos → **no detecta** duplicados de jornada completa | ✓ índice único compara NULLs como iguales → detecta duplicados E2 |
| C4 CHECK `fin = inicio + duración` (D-05a) | ✓ aritmética de intervalos nativa en CHECK | △ CHECK 8.0.16+ con expresiones deterministas; aritmética de fechas más incómoda | ✓ `DATEADD/DATEDIFF` o columna computada persistida |
| C5 Exclusión de intervalos (RN-03, Paso 12) | ✓ **`EXCLUDE` con `btree_gist`/rangos** — única con restricción nativa de no solapamiento | ✗ sin exclusión declarativa → todo bloqueo manual | ✗ sin exclusión declarativa → bloqueos/índices de rangos |
| C6 Idempotencia + append-only | ✓ | ✓ | ✓ |
| C7 Linux + contenedor + config externa | ✓ imagen oficial ligera; variables/`ALTER SYSTEM` | ✓ imagen oficial ligera; variables de entorno | △ contenedor oficial Linux disponible, pero imagen pesada y licencia a considerar |
| C8 Respaldos (RNF-015/016) | ✓ `pg_dump`/WAL/PITR (pgBackRest/Barman) | ✓ `mysqldump`/binlog; MariaDB `mariabackup` | ✓ `BACKUP/RESTORE`, FULL recovery; complejidad mayor |
| C9 Mantenimiento/documentación | ✓ activo hasta 2030, documentación extensa | ✓ LTS 8.4 / MariaDB LTS, documentación extensa | ✓ CU mensual, documentación Microsoft |
| C10 Seguridad (RNF-001/002/004/026) | ✓ `scram-sha-256`, `hostssl`, TLS, pgAudit opcional | ✓ `caching_sha2_password`, `require_secure_transport`, `STRICT_TRANS_TABLES` obligatorio | ✓ autenticación/TDE/auditoría integrada (más peso de configuración) |
| C11 Recursos/licencia | ✓ sin costo, sin vendor lock-in | ✓ sin costo (GPL) | △ licencia comercial para producción (Developer no es producción; Express: BD ≤ 10 GB — suficiente para 10.000 citas, pero es límite de producto) |
| C12 100 concurrentes (RNF-008) | △ modelo proceso/conexión → **PgBouncer** obligatorio (pool) | ✓ modelo hilo/conexión con pool de la app | △ pool nativo; `Max Server Memory`/`MAXDOP` a ajustar |
| Encaje con skills del workflow | ✓ `postgresql-table-design` + `databases` | ✓ `databases` | ✓ `sql-server` + `sqlserver-engineering` + `mssql` (verificación sólo lectura) |

## 5. Factores diferenciadores decisivos (encaje funcional, no preferencia)

1. **C5 — Exclusión de solapes (RN-03/RNF-010):** sólo PostgreSQL ofrece una **restricción declarativa `EXCLUDE`** para impedir reservas incompatibles en el intervalo; en A2/A3 la misma garantía requiere protocolo de bloqueo en aplicación (más riesgo, más código) → ventaja directa a la regla de negocio central (RN-09).
2. **C3 — Identidad E2 aprobada (D-05b):** con `NULLS NOT DISTINCT`, PostgreSQL puede aplicar la UNIQUE **completa** (incluida jornada completa) en el Paso 07; MySQL **no la detecta** en NULL; SQL Server sí, pero con menor claridad documental del alcance del índice compuesto.
3. **C4 — Coherencia de cita aprobada (D-05a):** CHECK con aritmética de intervalos **nativa y legible** en PostgreSQL.
4. **C2 — RNF-028:** `timestamptz` hace que almacenar UTC sea el **comportamiento por defecto** (regla del skill: `timestamptz` siempre en PostgreSQL), frente a convenciones manuales en A2.
5. **C11 + C7 — recursos y despliegue:** A1/A2 cumplen sin costo; A3 introduce licencia y contenedor más pesado sin aportar capacidad diferencial a esta escala (100 concurrentes/10.000 citas).

## 6. Recomendación (pendiente de aprobación humana)

> **Recomendación: A1 — PostgreSQL 18.x**, justificada por encaje con RN-09/RNF-010 (exclusión de intervalos), RNF-028 (UTC nativo), D-05b (UNIQUE E2 completa), D-05a (CHECK de coherencia), RNF-023/024 (Linux/contenedor, imagen ligera), licencia sin costo (recursos) y soporte hasta 2030. **No es una aprobación:** requiere decisión explícita del responsable.

**Contrapartidas operativas asumidas si se aprueba (detalles, no decisiones nuevas):**
- **PgBouncer** en modo transacción delante de la BD (regla del skill; sostiene RNF-008 sin agotar `max_connections`).
- Índices en **todas** las columnas FK (PostgreSQL no los crea automáticamente).
- `scram-sha-256` + `hostssl` en `pg_hba.conf`; TLS forzado (RNF-001/004/010).
- Autovacuum y `shared_buffers`≈25 % RAM / `effective_cache_size`≈75 % (ajuste en Paso 07/12).
- Respaldos con `pg_dump`/WAL + **prueba de restauración** documentada (RNF-015/016).

**Por qué no A2:** funcionalmente correcto en todo lo demás, pero **pierde en C3 (NULL de E2), C5 (exclusión) y es más flojo en C4** — tres requisitos ya decididos por el responsable.
**Por qué no A3:** cumple C3/C4/C2, pero **C11 (licencia/límites) y C7 (peso del contenedor)** lo penalizan sin ventaja funcional a esta escala; sería la alternativa válida si existiera requisito previo de entorno Microsoft (no existe).

## 7. Qué queda diferido tras la aprobación (Pasos 06+ — sin decisiones nuevas aquí)

- Tipado de identificadores, representación de `enum_texto` (CHECK vs tipo nativo `ENUM` de PG), longitudes exactas → **Paso 07**.
- UNIQUE declarativa E2 en T6 (D-05b) y CHK `fin = inicio + duración` (D-05a) → **Paso 07** (ambas requieren **autorización adicional** al modificar el modelo aprobado).
- Exclusión de solapes con `EXCLUDE` + `btree_gist` y estrategia de concurrencia → **Paso 12** (junto con L-03/TTL e idempotencia).
- Seguridad/RLS si procede → **Paso 09**; índice/rendimiento → **Paso 11**.

## 8. Verificaciones

1. **Sin SQL, sin migraciones, sin código, sin instalación de frameworks, sin infraestructura, sin selección ejecutada.**
2. Requisitos (29/30/16/15), decisiones aprobadas, modelos de los Pasos 02–05 y evidencias **intactos**.
3. Comparación de **al menos** PostgreSQL, MySQL/MariaDB y SQL Server (workflow exigido), sin elegir por preferencia; criterios trazados a RF/RNF/RN/CA/ADR-001/restricciones.
4. Estado del workflow: Paso 05 **APPROVED**; Paso 06 **elaborado, pendiente de aprobación**.

---

**Estado del paso:** **APROBADO — D-06 (9 de octubre de 2026) + enmienda D-06-R1 (misma fecha): MySQL 8.0.46 + InnoDB es la versión objetivo** (§0); PostgreSQL 18 conservada como alternativa evaluada y descartada para esta versión. **HUMAN_STATUS: PENDING_STEP_15_APPROVAL** — los Pasos 07–14 fueron ejecutados y actualizados a 8.0.46; el Paso 15 permanece bloqueado hasta autorización explícita.
