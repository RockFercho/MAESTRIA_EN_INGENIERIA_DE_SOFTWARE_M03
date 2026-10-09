# Decisiones Paso 15 — Autorización y generación de SQL

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 15 (generación de scripts SQL).
**Motor:** MySQL **8.0.46** + InnoDB (D-06 / enmienda **D-06-R1**).
**Fecha:** 9 de octubre de 2026.

## 1. Autorización humana (responsable del proyecto)

**Fecha:** 2026-10-09 · **Decisión:** autorizada la **generación** de scripts SQL.

Restricciones impuestas por el responsable (citadas textualmente en su criterio):

1. Incorporar las **14 tablas**, **18 claves foráneas** y **27 restricciones CHECK**, verificando que los conteos coincidan.
2. E2 **sin protección de solapes** (sólo anti-duplicados exactos).
3. Estrategia transaccional de solapes (referenciada, Paso 12).
4. Mantener la **trazabilidad** con RF/RNF/RN/CA/ADR.
5. Preparar las **verificaciones empíricas**.
6. Presentar únicamente: scripts generados, dependencias, orden de ejecución y problemas realmente bloqueantes.
7. **No ejecutar**, **no instalar**, no modificar requisitos ni decisiones aprobadas, **no avanzar al Paso 16**.
8. Observaciones menores → registrar como **pendientes no bloqueantes** (sin nuevas rondas de revisión documental).
9. `HUMAN_STATUS` permanece `PENDING_STEP_15_APPROVAL` hasta que el responsable apruebe el resultado generado.

## 2. Resultado generado

Directorio: `proyecto/05_base_datos/13_sql/`

| # | Script | Contenido |
|---|---|---|
| 1 | `0001_esquema_base.sql` | 14 `CREATE TABLE` · 18 FK `ON DELETE RESTRICT` · 27 CHECK con nombre · 3 UQ · 15 índices secundarios de soporte de FK/patrón · `SET SESSION sql_mode` del Paso 09 |
| 2 | `0002_indices_patron_acceso.sql` | 4 índices de patrón (P2, P6, P8, caducidad) del catálogo del Paso 11 |
| 3 | `0003_indice_e2_funcional.sql` | `UNIQUE` funcional NULL-seguro sobre T6 (D-05b) — **sólo anti-duplicados exactos, sin protección de solapes** |
| 4 | `0004_chk_transversal_duracion.sql` | CHK transversal de T7 (D-05a) — **condicional**: si el parser la rechaza, contingencia = capa de servicio |
| 5 | `0005_cuentas_privilegios.sql` | GRANT dinámicos (schema en uso) para `app_rw`, `app_append`, `app_outbox`, `backup_ro`, `migrador` (seguridad §2) — **sin credenciales** |
| 6 | `0006_datos_iniciales.sql` | Semillas T11 (2 h) **comentadas** (requieren administrador real + aprobación); OD-01 sin valor; T12/catálogos sin semilla |
| 7 | `9990_verificaciones_empiricas.sql` | Preparación de §6.a/§6.b/§6.c con fixtures `START TRANSACTION…ROLLBACK` y contadores de integridad |

### Verificación de conteos (ejecutada por conteo estático sobre los scripts)

- `CREATE TABLE` en 0001 = **14** ✔
- `FOREIGN KEY` en 0001 = **18** ✔ (16 NN + T9.cita_id y T13.cita_id NULL)
- `CONSTRAINT chk_` en 0001 = **27** ✔ (T11 = 0, por diseño L-04/natural) · +1 en 0004 = 28 en tiempo de ejecución si la unidad condicional aplica
- Índices: 15 en 0001 (soporte FK/patrón) + 4 en 0002 + E2 en 0003

### Checksums SHA-256 de los scripts generados

```
501ec430c51c19d66ca94dd4d761a96555706d61bb1693b49eb6a987c8942e77  0001_esquema_base.sql
8ddfac4bde63074b844e54c1d44953729513ea5f2ee9a88a86bb6877a17c7f4b  0002_indices_patron_acceso.sql
1e9d0cb1343cd5d1e63ef9dbf376a0546dde2a181628bac39cd6ecf088b1977d  0003_indice_e2_funcional.sql
c43bc3fe9e6d10511fffbf902a4507cb4da96a8abceeb918f4a2fdf9e0406d5d  0004_chk_transversal_duracion.sql
eb9a2243c6de9ea3915e6e488d960d7019e88c1e0e513133a8bda8a44b37e2cb  0005_cuentas_privilegios.sql
38fa51d2440a574bb707cdc5ecccba9b4d039e74497fddd485787137ac8013ec  0006_datos_iniciales.sql
e16b89431fe98693e36a54f14be690a7dc332ed8c58eac98ef6ea5b8987bb6ec  9990_verificaciones_empiricas.sql (tras corrección del Paso 16)
```

> Nota: el checksum de `9990` cambió en el Paso 16 al sustituir el hash de fixture por
> un marcador no credencial (`<HASH-PROBE-NO-REAL-NO-ES-CREDENCIAL>`) — corrección agrupada.

## 3. Aprobación humana del resultado (Paso 15)

**Fecha:** 2026-10-09 · **Decisión:** `APPROVED` por el responsable del proyecto.

- Aprueba formalmente los **siete scripts** de `proyecto/05_base_datos/13_sql/`.
- Autoriza la ejecución del **Paso 16** (Conexión) bajo sus restricciones (sin SQL, sin Paso 17, sin instalación, sin semillas pendientes, sin operaciones destructivas).
- Estado resultante: Paso 15 **completado y aprobado**; `HUMAN_STATUS: PENDING_STEP_16_APPROVAL`.

## 4. Estado

**Paso 15: APPROVED (2026-10-09).** Scripts **no ejecutados**: la ejecución corresponde al Paso 17 con autorización separada posterior a la aprobación del Paso 16.
