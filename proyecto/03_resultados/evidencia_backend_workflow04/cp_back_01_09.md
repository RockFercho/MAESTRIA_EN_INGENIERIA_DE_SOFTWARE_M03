# Evidencia Workflow 04 — Backend reducido (identidad + catálogo)

**Fecha:** 9 de octubre de 2026 · **Autorización humana:** ejecución continua CP-BACK-01…09 (responsable, 2026-10-09).
Cuenta de aplicación: **`app_rw`** (sin credenciales mostradas). Workflow 04 adaptado de la plantilla PHP/`productos`
a `identidad` + `catalogo` (servicio); state heredado corregido (ejemplo del docente, precedente ya autorizado).

## CP-BACK-01 — Patrón reutilizable

Módulo `catalogo` (workflow 03) consolidado como patrón: `domain/` (validaciones), `application/` (casos de uso),
`ports/` (JSDoc), `adapters/{persistence,http,security}`, router con inyección de dependencias, errores normalizados
(`AppError` 401/403/404/400/429/500 sin fugas). Módulo `identidad` implementado siguiendo exactamente el patrón.

## CP-BACK-02 — `tools/create_demo_user.mjs`

```
$ DEMO_USER_PASSWORD=<secreto> node tools/create_demo_user.mjs --correo admin@citas.demo --rol administrador
Usuario creado (id=990007, correo=admin@citas.demo, rol=administrador).   [app_rw]
$ (repetir) → Usuario ya existente (id=990007); nada que crear.           [idempotente]
SQL: SELECT → hash_contrasena = scrypt$16384$8$1$<sal>$<hash> (sin texto plano)
```

## CP-BACK-03 — POST /api/v1/auth/login (MySQL real, app_rw)

```
login admin ok → token (64 hex) + usuario {id, nombre_completo, correo, rol} sin hash          200
login contraseña mala → {"error":{"code":"UNAUTHORIZED","message":"Credenciales inválidas"}}   401
5 intentos fallidos fuerza@citas.demo → 401×5; 6º (incluso correcta) → RATE_LIMITED            429
```

## CP-BACK-04 — logout + me

```
GET /auth/me con token → {"id":990007,...,"rol":"administrador"}                              200
GET /auth/me sin token → 401 · token basura → 401
POST /auth/logout → 200 · GET /me tras logout → 401 (sesión revocada)
```

## CP-BACK-05..08 — catálogo con control de acceso (RF-003/RF-005)

```
GET /servicios y /servicios/{id} sin token → 200 (públicos, RF-027)
POST /servicios sin token        → 401 UNAUTHORIZED
POST /servicios rol solicitante  → 403 FORBIDDEN
POST admin → 201 (id 990010) · PUT admin → 200 · DELETE admin → 200 {estado:"inactivo"} (lógico)
```

## CP-BACK-09 — suite y OpenAPI

```
$ npm test → # tests 61 · pass 61 · fail 0
  unit (13): scrypt (formato/sal/verify/política 12+), UTC ms, parseLoginBody, sesiones (TTL/revocación),
             rate-limiter (bloqueo por correo, éxito limpia)
  integración catálogo (22): CP-API-02..07 sin cambios
  integración auth (13): login 200/401 genérico/inactivo/400/429; me 200/401; logout; token basura;
             catálogo 401/403/201/200 con rol administrador; GET público
openapi.yaml 3.1.0 → 6 paths (health, auth×3, servicios×2), security bearerAuth, 401/403/429 documentados
```

Corrección interna: bug de slicing en `ahoraUtcMysql` (tomaba la Z en vez de los ms) → corregido y verificado.

## Limpieza (fixtures identificables)

`DELETE` (devcode, operación admin) de `servicio LIKE 'Backend CP06%'` y `usuario LIKE '%@citas.demo'`
→ `COUNT(*)=0` en ambas tablas. Sin registros preexistentes alterados; Práctica 1 y workflow 03 intactos.

**CP-BACK-01…09: COMPLETADOS.** Workflow termina en `HUMAN_STATUS: PENDING`.
