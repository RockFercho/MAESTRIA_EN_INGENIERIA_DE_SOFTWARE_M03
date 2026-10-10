# Decisiones — Práctica 2 · Stack del backend piloto y contrato CP-API-01

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual · **Fecha:** 9 de octubre de 2026
**Decisor:** responsable del proyecto (AGENTS §14). **Estado:** APROBADAS (aprobación humana íntegra del plan, 2026-10-09).

## D-P2-1 · Stack del backend piloto (cierra decisión pendiente ADR-001 §6.1 para el backend)

| Elemento | Decisión | Justificación |
|---|---|---|
| Runtime | **Node.js 22 LTS** (local: v22.14.0) | LTS vigente; RNF-023 (Linux); sin dependencias de sistema |
| HTTP | **Express 4** | maduro; sólo adaptador inbound (hexagonal: el dominio no lo conoce) |
| Cliente MySQL | **mysql2** (pool de promesas) | compatible con MySQL 8.0.46 y `caching_sha2_password` (D-06-R1) |
| Validación | módulo propio de validadores de dominio (sin dependencias extra) | RNF-003 servidor; superficie mínima |
| Pruebas | **node:test** + fetch nativo | RNF-025; sin Jest/supertest |
| Cuenta de aplicación | **`app_rw`** vía `DB_PASSWORD_APP_RW` en `.env` | condición humana 5; sin fallback a `devcode` |
| Arquitectura | hexagonal interna, módulo **`catalogo`** (ADR-001) | domain/application/ports/adapters |
| Auth | **sin autenticación** en el piloto (sólo local/demo) | condición humana 4; pendiente módulo `identidad` |

Workflow 03 adaptado de plantilla PHP/`cat_categoria` a `servicio`+Node conservando los 8 checkpoints (condición 1). State heredado corregido (condición 3; workflow de BD permanece cerrado e intacto).

## D-P2-2 · Contrato CP-API-01 (`/api/v1`)

| Método/ruta | Éxito | Errores |
|---|---|---|
| `GET /health` | 200 `{status:"ok", version, checks:{db:"ok"}}` | 503 `{status:"error", checks:{db:"error"}}` si el ping a MySQL falla |
| `GET /servicios?estado=activo\|inactivo` | 200 `[{id,nombre,descripcion,duracion_minutos,estado}]` | 400 estado inválido · 500 DB |
| `GET /servicios/{id}` | 200 objeto | 400 id no entero · 404 |
| `POST /servicios` | 201 objeto creado | 400 validación · 500 DB |
| `PUT /servicios/{id}` | 200 objeto | 400 · 404 · 500 |
| `DELETE /servicios/{id}` | 200 `{...estado:"inactivo"}` (lógico) | 400 · 404 · 500 |

Validaciones (servidor): `nombre` 1–100 requerido (POST); `descripcion` ≤500 u `null`; `duracion_minutos` entero >0 (RN-04, `chk_t3_duracion`) ≤1440; `estado` ∈ {activo,inactivo} (`chk_t3_estado`); `id` entero >0. Respeto exacto del esquema `servicio` (5 columnas); sin DELETE físico; sin UNIQUE adicional (el esquema no lo define). Errores sin fugas SQL ni secretos (RNF-004/026).

**Registro:** workflow adaptado en `.agents/workflows/03_api_pilot_workflow.md`; state corregido en `.agents/state/api-pilot-workflow.json`.
