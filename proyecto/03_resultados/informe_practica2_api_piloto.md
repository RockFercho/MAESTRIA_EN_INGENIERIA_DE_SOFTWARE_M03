# Informe consolidado — Práctica 2 · API piloto (`catalogo` / `servicio`)

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual · **Fecha:** 9 de octubre de 2026
**Workflow:** `.agents/workflows/03_api_pilot_workflow.md` (adaptado y aprobado) · **Stack:** Node.js 22 + Express 4 + mysql2 + node:test · **Cuenta BD:** `app_rw` · **Arquitectura:** hexagonal interna (ADR-001)
**Autorización humana:** CP-API-04…08 en ejecución continua (responsable, 2026-10-09). Piloto sin autenticación (sólo local/demo).

## 1. Checkpoints ejecutados y resultado

| CP | Alcance | Resultado |
|---|---|---|
| CP-API-01 | Contrato `/api/v1` | COMPLETED (aprobado en el plan humano) |
| CP-API-02 | Bootstrap + `/health` (ping real `app_rw`) | COMPLETED — 200 `db:"ok"` |
| CP-API-03 | `GET /servicios` (lista/filtro/vacío/error DB) | COMPLETED — 200/400/500 verificados |
| CP-API-04 | `GET /servicios/{id}` | COMPLETED — 200/404/400 con datos reales |
| CP-API-05 | `POST /servicios` + fixtures válidos/inválidos | COMPLETED — 201×2, 400×4 sin filas fantasma |
| CP-API-06 | `PUT /servicios/{id}` | COMPLETED — 200 real / 404 / 400 |
| CP-API-07 | `DELETE` lógico (`estado='inactivo'`) | COMPLETED — fila conservada, sin `DELETE FROM` |
| CP-API-08 | OpenAPI + suite CRUD completa | COMPLETED — `openapi.yaml` 3.1.0; 41/41 |

## 2. Endpoints implementados (`/api/v1`)

- `GET /health` → 200 `{status,version,checks.db}` / 503 si BD caída.
- `GET /servicios?estado=activo|inactivo` → 200 `[]…` / 400 estado inválido.
- `GET /servicios/{id}` → 200 / 400 id no entero / 404.
- `POST /servicios` → 201 / 400 (nombre 1–100 req., descripcion ≤500, duracion entero 1–1440 req., estado enum, default activo; JSON malformado → 400).
- `PUT /servicios/{id}` → 200 (PUT completo; mismas validaciones) / 400 / 404.
- `DELETE /servicios/{id}` → 200 con `estado:"inactivo"` (idempotente, desactivación lógica) / 400 / 404.
- Errores: `VALIDATION_ERROR`, `NOT_FOUND`, `DB_ERROR`, `INTERNAL_ERROR` — sin fugas SQL ni secretos.

## 3. Archivos creados o modificados (`proyecto/06_codigo/`)

**Creados en esta ejecución:** `src/modules/catalogo/domain/servicio.js` (validaciones completas),
`application/servicio-casos-de-uso.js`, `adapters/persistence/servicio-repository-mysql.js` (findAll/findById/create/update/setState),
`adapters/persistence/servicio-repository-in-memory.js`, `adapters/http/servicios-router.js` (CRUD),
`test/unit/catalogo/validaciones.test.js`, `test/unit/catalogo/servicio-casos-de-uso.test.js`,
`openapi.yaml` (OpenAPI 3.1.0).
**Modificados:** `src/app.js` (inyección del router), `src/server.js` (wiring completo),
`src/shared/http/errors.js` (JSON malformado/errores 4xx de Express → 400),
`test/integration/servicios.test.js` (suite CRUD), `ports/servicio-repository.js` (tipado del puerto).
**De CP-API-02/03 (previos):** `package.json`, `.gitignore`, `config/env.js`, `shared/db/pool.js`, `app.js`, `server.js`, tests de salud/colección.

## 4. Pruebas realizadas y resultados (ejecución real)

```
npm test (node --test) → tests 41 · pass 41 · fail 0
```
- Unitarias (19): validaciones de dominio (id, cuerpo POST/PUT), casos de uso, listar.
- Integración (22): salud (3) + servicios (19) con repositorio en memoria: colección, por id, POST, PUT, DELETE lógico, errores 500 sin fugas.
- Corrección interna: test `id=''` mapeaba a la colección → sustituido por `%20` (comportamiento del API sin cambios).

## 5. Evidencias HTTP y SQL (MySQL 8.0.46, real)

- HTTP+SQL CP-API-02/03: `evidencia_practica2_api_piloto/cp_api_02_bootstrap.md`, `cp_api_03_get_servicios.md`.
- HTTP+SQL CP-API-04…07: `cp_api_04_07_crud.md` — POST 201 (ids 990008/990009), 400×4 (COUNT=2), GET por id 200/404/400, PUT 200/404/400, DELETE → `inactivo` con fila presente en `SELECT` de verificación, limpieza de fixtures → `COUNT(*)=0` y `[]` 200.
- CP-API-08: `cp_api_08_openapi_suite.md`.
- SQL preparado con parámetros enlazados (`:nombre`, `:estado`, `:id`…); cuenta de aplicación exclusivamente `app_rw` en la app; `devcode` sólo como operación administrativa puntual de fixtures/limpieza.

## 6. Problemas encontrados y soluciones

1. Falta de `DB_PASSWORD_APP_RW` → 503 en `/health` → resuelto con la credencial aportada por el responsable (CP-API-02).
2. `node --test` con directorios vacíos falla en Node 22.14 → script `test` a descubrimiento automático.
3. Source de `.env` en bash rompe con contraseñas con `{` (shell) → extracción segura vía python para operaciones admin; la app usa dotenv sin incidencias.
4. Test `id=''` confundía ruta vacía con colección → ajustado a `%20`.

## 7. Requisitos y criterios verificados (alcance del piloto)

| Elemento | Estado |
|---|---|
| RNF-004 (secretos fuera del repo/logs/respuestas) | Verificado (env vars; mensajes sin credenciales) |
| RNF-005 (validación en servidor) | Verificado (dominio + integración) |
| RNF-023 (ejecución en Linux) | Verificado (Ubuntu, Node 22) |
| RNF-025 (pruebas automatizadas) | Verificado (41 tests) |
| RNF-026 (errores sin secretos ni fugas SQL) | Verificado (tests 500) |
| RN-04 / `chk_t3_duracion` (duración 1–1440) | Verificado (validación servidor alineada al CHECK) |
| `chk_t3_estado` | Verificado (enum servidor) |
| Contrato D-P2-2 (códigos HTTP) | Verificado (suite + verificación real) |
| Desactivación lógica (sin `DELETE FROM`) | Verificado (SELECT de verificación) |
| Práctica 1 intacta | Verificado (sin DDL/DML sobre esquema ni evidencias) |

**Diferidos al backend completo (no del alcance del piloto):** autenticación/autorización (RNF-002/003, módulo `identidad`), p95 de respuesta y carga (RNF-006/007/008), logging estructurado (RNF-026 ampliado), contenedores/entornos (RNF-024).

## 8. Pendientes y limitaciones

- **Sin autenticación** (condición humana 4): no exponer públicamente; auth pendiente en `identidad`.
- Piloto sólo con tabla `servicio`; no amplía a citas/profesionales/frontend.
- Datos de prueba identificables; limpieza garantizada (tabla en 0 filas al cerrar).
- Workflow 03 termina en `HUMAN_STATUS: PENDING` — revisión del responsable antes del backend completo (workflow 04).
