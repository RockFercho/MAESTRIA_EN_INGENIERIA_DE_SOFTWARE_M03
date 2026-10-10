# Workflow 03 — API piloto: servicios (catálogo)

**Adaptado (aprobado por el responsable, 2026-10-09)** de la plantilla genérica PHP/`cat_categoria`
al módulo `catalogo` de este proyecto: tabla `servicio` · stack **Node.js 22 + Express 4 + mysql2 + node:test**
(ADR-001 hexagonal interno; decisión de stack registrada en `decisiones_practica2_stack_api_piloto.md`).

Cuenta MySQL de la aplicación: **`app_rw`** (credenciales sólo por entorno: `DB_PASSWORD_APP_RW`;
nunca `devcode` como cuenta de aplicación). Desactivación lógica: `estado='inactivo'`; **nunca `DELETE FROM`**.
Piloto sin autenticación: sólo local/demostración académica; auth diferida al módulo `identidad`.

Skills: `api-design-principles`, `openapi-spec-generation`.

## CP-API-01
Contrato de `/api/v1/servicios` (endpoints, payloads, códigos, validaciones). No programar. STOP.

## CP-API-02
Bootstrap Node + `.env` + pool `app_rw` + `/api/v1/health` (ping real a MySQL). STOP.

## CP-API-03
GET `/api/v1/servicios`. Probar colección con datos, vacía y error DB. STOP.

## CP-API-04
GET `/api/v1/servicios/{id}`. Probar existente, inexistente e ID inválido. STOP.

## CP-API-05
POST servicio + fixtures válidos/inválidos. STOP.

## CP-API-06
PUT servicio + validaciones. STOP.

## CP-API-07
DELETE lógico: `estado='inactivo'`. Nunca `DELETE FROM`. STOP.

## CP-API-08
OpenAPI + suite CRUD completa. Terminar en `HUMAN_STATUS: PENDING`. No iniciar backend completo.
