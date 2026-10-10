# Informe consolidado — Workflow 04 · Backend reducido (identidad + catálogo)

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual · **Fecha:** 9 de octubre de 2026
**Workflow:** `.agents/workflows/04_backend_workflow.md` (adaptado de la plantilla PHP/`productos` a `identidad`+`catalogo`; autorización de ejecución continua del responsable, 2026-10-09)
**Stack:** Node.js 22 + Express 4 + mysql2 + node:test · Hexagonal interno (ADR-001) · BD `gestion_citas_db` (MySQL 8.0.46) · Cuenta de aplicación `app_rw`

## 1. Checkpoints ejecutados y resultado

| CP | Alcance | Resultado |
|---|---|---|
| CP-BACK-01 | Patrón hexagonal reutilizable (catalogo → identidad) | COMPLETED |
| CP-BACK-02 | `tools/create_demo_user.mjs` (scrypt, idempotente, sin secretos) | COMPLETED |
| CP-BACK-03 | `POST /auth/login` (sesión opaca, límite de intentos, 401 genérico) | COMPLETED |
| CP-BACK-04 | `POST /auth/logout` + `GET /auth/me` | COMPLETED |
| CP-BACK-05 | GET listado/detalle servicios (públicos, RF-027) | COMPLETED |
| CP-BACK-06 | `POST /servicios` protegido (401/403/201) | COMPLETED |
| CP-BACK-07 | `PUT /servicios/{id}` protegido (401/403/200) | COMPLETED |
| CP-BACK-08 | `DELETE` lógico protegido (401/403/200, sin borrado físico) | COMPLETED |
| CP-BACK-09 | Suite completa + OpenAPI + cierre en `HUMAN_STATUS: PENDING` | COMPLETED |

## 2. Endpoints disponibles (`/api/v1`)

- `GET /health` (público) · `POST /auth/login` (público; rate-limit 5/15min por correo) · `POST /auth/logout` y `GET /auth/me` (sesión).
- `GET /servicios` y `GET /servicios/{id}` (públicos) · `POST /servicios`, `PUT /servicios/{id}`, `DELETE /servicios/{id}` (**requieren rol `administrador`**; DELETE = desactivación lógica).

## 3. Archivos creados o modificados (`proyecto/06_codigo/`)

**Creados:** `src/shared/security/passwords.js` (scrypt N=16384 + sal + timing-safe), `src/shared/time/utc.js`,
`src/modules/identidad/` completo (domain/usuario.js, application/auth-casos-de-uso.js, ports, adapters persistence
mysql+in-memory, adapters security sesiones-y-limite.js, adapters http auth-router.js + auth-middleware.js),
`tools/create_demo_user.mjs`, `test/unit/identidad/*` (2), `test/integration/auth.test.js`.
**Modificados:** `src/app.js` (auth router), `src/server.js` (wiring identidad+catálogo con `protegerMutaciones`),
`src/config/env.js` (SESSION_TTL_MINUTES, LOGIN_MAX_INTENTOS, LOGIN_VENTANA_MINUTOS),
`src/modules/catalogo/adapters/http/servicios-router.js` (middleware de protección en mutaciones),
`openapi.yaml` (auth, bearerAuth, 401/403/429; 6 paths).

## 4. Pruebas (ejecución real) y verificación contra MySQL real

- `npm test` → **61/61 pass, 0 fail** (13 unit identidad + 22 integración catálogo + 13 integración auth + 13 salud/colección previos).
- Contra MySQL real (`app_rw`): creación de 3 usuarios demo vía tool (hash `scrypt$16384$8$1$…` en BD, idempotente); login 200/401/429; me 200/401; logout 200→401; mutaciones catálogo 401/403/201/200 con DELETE lógico verificado en `SELECT`; GET público 200.
- Fixtures limpiados (devcode admin): `servicio` y `usuario` en **0 filas**; sin datos preexistentes alterados.
- Evidencia: `proyecto/03_resultados/evidencia_backend_workflow04/cp_back_01_09.md`.

## 5. Problemas encontrados y soluciones

1. State heredado del docente (`cat_producto` PHP) → corregido a `identidad`+`catalogo` (precedente autorizado; `state_correction` registrado).
2. Bug en `ahoraUtcMysql` (slice tomaba la Z en vez de los ms) → corregido; test UTC falló y evidenció el bug antes de tocar BD.
3. YAML con dos puntos sin cominar en descripción de `bearerAuth` → corregido; parser valida 6 paths.
4. Límite de login implementado por correo en memoria (un proceso); limitación documentada para despliegues multiproceso.

## 6. Matriz RF/RNF/CA (workflow 04)

**Leyenda:** IMP = implementado · VER-T = verificado por suite automatizada · VER-DB = verificado contra MySQL real · PEND = pendiente · FA = fuera del alcance de workflow 04 (fases posteriores)

| Elemento | Estado | Notas |
|---|---|---|
| RF-002 autenticación/finalizar sesión | IMP + VER-T + VER-DB | login/logout/me con sesión opaca |
| RF-003 roles restringen operaciones | IMP + VER-T + VER-DB (parcial) | catálogo mutaciones=admin; resto de operaciones por rol en módulos FA |
| RF-005 gestión de servicios (admin) | IMP + VER-T + VER-DB | CRUD completo; duración configurable |
| RF-027 (consulta de servicios para landing) | IMP + VER-T + VER-DB | GETs públicos; la landing en sí es FA (frontend) |
| RF-001 registro | FA | workflow 04 no lo incluye (tool demo cubre creación operativa) |
| RF-004, RF-006..026, RF-028 | FA | módulos agenda/reservas/seguimiento/notificaciones/parámetros en fases posteriores |
| RF-029 restablecimiento contraseña | PEND | documentado conceptualmente; implementación pendiente de aprobación (por el propio RF) |
| RNF-002 hash adaptativo con sal | IMP + VER-T + VER-DB | scrypt 16384, sal 16B, timing-safe |
| RNF-003 identidad/permisos en servidor | IMP + VER-T + VER-DB (parcial) | 401/403 en servidor; alcance=catálogo |
| RNF-004 secretos fuera del repo | VER-T | env vars; sin secretos en logs/respuestas/evidencias |
| RNF-005 validación en servidor | IMP + VER-T + VER-DB | dominio; 400; JSON malformado |
| RNF-022 separación de capas | IMP + VER-T | hexagonal (identidad y catálogo) |
| RNF-023 Linux | VER-T | ejecutado en Ubuntu |
| RNF-025 pruebas automatizadas | VER-T | 61 tests |
| RNF-026 errores sin secretos | VER-T | 500 genéricos; log SQL sin credenciales |
| RNF-028 UTC (marcas) | IMP + VER-T | `DATETIME(3)` UTC vía helper; America/La_Paz pendiente de módulos de agenda (FA) |
| RNF-029 política de acceso | IMP + VER-T + VER-DB | min 12 caracteres en tool; límite de intentos; mensajes genéricos |
| RNF-001 TLS producción | FA | despliegue/devops |
| RNF-006..009, 010..013, 014..017, 024, 027, 030 | FA/PEND | rendimiento, concurrencia de citas, respaldos, métricas, reset: fuera del workflow 04 |
| CA-009 seguridad (parcial) | VER-T + VER-DB | 401/403, hash, validación, rate-limit, genéricos; TLS=FA |
| CA-015 política de contraseñas (parcial) | VER-T | min 12, rate-limit, genéricos; reset=PEND |
| CA-001..008, 010..014 | FA | dependen de módulos fuera del workflow 04 |

## 7. Estado del backend y pendientes

- **El alcance completo del workflow 04 (backend reducido: autenticación mínima + catálogo protegido) está TERMINADO y VERIFICADO** con pruebas automatizadas y verificación real MySQL.
- **El backend completo del proyecto NO está terminado:** quedan fuera del alcance autorizado de este workflow los módulos `agenda`, `reservas`, `seguimiento`, `notificaciones`, `parametros`, `auditoria`, registro de usuarios (RF-001), gestión de profesionales/asociaciones (RF-004/RF-006), restablecimiento de contraseñas (RF-029/RNF-030) y las pruebas de carga (CA-008). Motivo: el workflow 04 aprobado limita el alcance a autenticación mínima y catálogo; el plan de workflows de `AGENTS.md` continúa con frontend (05) e integración (06).
- Limitación operativa: sesiones y rate-limit en memoria (un proceso); para múltiples procesos se requerirá almacén de sesiones externo (RNF-024).
