# Evidencia CP-API-02 — Bootstrap Node + /api/v1/health

**Fecha:** 9 de octubre de 2026 · **Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Checkpoint:** CP-API-02 del workflow 03 adaptado (Node 22 + Express 4 + mysql2 + node:test, módulo piloto `catalogo`).

## 1. Entorno

- Node.js v22.14.0 · npm 10.9.2 (ya instalados; sin instalar sistema).
- `npm install` en `proyecto/06_codigo/`: **80 paquetes** (express, mysql2, dotenv).
- Cuenta de aplicación: **`app_rw`** vía `DB_PASSWORD_APP_RW` (entorno); **sin** uso de `devcode` como cuenta de aplicación; sin secretos en el repo.

## 2. Archivos creados (CP-API-01/02)

`package.json` · `.gitignore` · `src/config/env.js` · `src/shared/db/pool.js` · `src/shared/http/errors.js` · `src/app.js` · `src/server.js` · `test/integration/health.test.js`.
Contrato CP-API-01 y decisiones de stack: `proyecto/04_decisiones/decisiones_practica2_stack_api_piloto.md`.

## 3. Comandos ejecutados y resultados

```
$ npm test          # node --test (descubrimiento automático)
# tests 3 · pass 3 · fail 0
  - GET /health 200 db=ok (ping inyectado OK)         ✔
  - GET /health 503 db=error (ping falla)             ✔
  - ruta desconocida → 404 normalizado                ✔
```

```
$ PORT=3001 node src/server.js   # servidor real local (127.0.0.1)
[config] Falta DB_PASSWORD_APP_RW en .env: /health reportara db=error (cuenta app_rw requerida; sin fallback a devcode)
[server] escuchando en http://127.0.0.1:3001 (modo local, sin auth)

$ curl -s http://127.0.0.1:3001/api/v1/health
{"status":"error","version":"0.1.0","checks":{"db":"error"}}
HTTP 503
```

## 4. Resultado y pendiente

- **CP-API-01:** contrato aprobado (plan humano, 2026-10-09) — COMPLETADO.
- **CP-API-02:** bootstrap funcional (servidor arranca, rutas y manejo de errores operativos; suite 3/3) — **ejecutado con 1 pendiente**:
  - `GET /health` devuelve `db=error` (503) porque **`.env` aún no contiene `DB_PASSWORD_APP_RW`**. Acción del responsable: añadir al `.env` de la raíz `DB_PASSWORD_APP_RW=<contraseña de app_rw definida como root>` y reanudar (re-ejecución de /health esperada: 200 `db:"ok"`).
- Sin cambios de esquema, sin migraciones, sin tocar Práctica 1. Servidor detenido tras la prueba (sólo local).

## 5. Re-verificación tras añadir `DB_PASSWORD_APP_RW` (misma fecha)

```
config: DB_PASSWORD_APP_RW presente (longitud 20 chars, valor NO mostrado)
config: APP_RW_USER no definido → default app_rw (sin fallback a devcode)

$ PORT=3001 node src/server.js        # sin avisos de configuración
$ curl -s http://127.0.0.1:3001/api/v1/health
{"status":"ok","version":"0.1.0","checks":{"db":"ok"}}
HTTP 200

$ npm test
# pass 3 · fail 0
```

**CP-API-02: COMPLETADO** — conexión MySQL real verificada exclusivamente con la cuenta `app_rw` (ping `SELECT 1` vía pool); sin secretos mostrados; servidor detenido; sin cambios de esquema ni datos.
