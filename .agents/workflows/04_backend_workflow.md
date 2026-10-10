# Workflow 04 — Backend reducido (identidad + catálogo)

**Adaptado (autorización humana de ejecución continua, 2026-10-09)** de la plantilla genérica PHP/`productos`
a este proyecto: módulo **`identidad`** (autenticación mínima) + módulo **`catalogo`** (`servicio`) ya
implementado en el workflow 03, cuyas mutaciones se protegen ahora con rol **administrador** (RF-003, RF-005).

Stack: **Node.js 22 + Express 4 + mysql2 + node:test** (aprobado en Práctica 2; ADR-001 hexagonal interno).
Cuenta MySQL de aplicación: **`app_rw`** (env `DB_PASSWORD_APP_RW`; sin secretos en repo/logs).
Autenticación: **sesión opaca de servidor** (token aleatorio + almacén en proceso; análogo Node de la sesión
PHP de la plantilla), hash de contraseñas **scrypt** con sal (RNF-002), límite de intentos y mensajes
genéricos (RNF-029). Sesión en memoria: limitación documentada (almacén distribuido pendiente si hay
múltiples procesos; RNF-024). Registro de usuarios (RF-001), agenda/reservas/seguimiento/notificaciones/
parámetros quedan **fuera del alcance** de este workflow (fases posteriores).

Skills: `php-development` → **no aplicable** (se ejecuta en Node); se conservan `error-handling-patterns` y
`auth-implementation-patterns`.

## CP-BACK-01
Consolidar patrón reutilizable del módulo `catalogo` (hexagonal: domain/application/ports/adapters, router
inyectado, validaciones en dominio, errores normalizados). Documentar el patrón y aplicarlo a `identidad`. STOP.

## CP-BACK-02
Crear `tools/create_demo_user.mjs` (usuario administrador de demostración con scrypt; sin credenciales
codificadas; operación idempotente). STOP.

## CP-BACK-03
POST `/api/v1/auth/login` (scrypt + sesión opaca + límite de intentos + mensaje genérico). STOP.

## CP-BACK-04
POST `/api/v1/auth/logout` + GET `/api/v1/auth/me`. STOP.

## CP-BACK-05
GET listado/detalle de servicios (públicos, RF-027) — ya implementados; verificar acces sin token. STOP.

## CP-BACK-06
POST `/api/v1/servicios` protegido: 401 sin sesión, 403 rol ≠ administrador, 201 con administrador. STOP.

## CP-BACK-07
PUT `/api/v1/servicios/{id}` con los mismos controles (401/403/200). STOP.

## CP-BACK-08
DELETE lógico (`estado='inactivo'`) con los mismos controles (401/403/200). STOP.

## CP-BACK-09
Suite backend completa + OpenAPI actualizado (auth + seguridad). Terminar en `HUMAN_STATUS: PENDING`.
No iniciar frontend.
