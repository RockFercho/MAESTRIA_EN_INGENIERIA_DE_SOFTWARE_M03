# Evidencia CP-API-03 — GET /api/v1/servicios (módulo catálogo, hexagonal)

**Fecha:** 9 de octubre de 2026 · **Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Checkpoint:** CP-API-03 del workflow 03 adaptado. Cuenta de aplicación: **`app_rw`** (sin credenciales mostradas). Práctica 1 intacta; sin cambios de esquema.

## 1. Arquitectura (hexagonal, módulo `catalogo`)

| Capa | Archivo |
|---|---|
| domain | `src/modules/catalogo/domain/servicio.js` (parseEstadoQuery, toServicio) |
| application | `src/modules/catalogo/application/listar-servicios.js` |
| ports | `src/modules/catalogo/ports/servicio-repository.js` |
| adapters/persistence | `servicio-repository-mysql.js` (app_rw/pool), `servicio-repository-in-memory.js` (tests) |
| adapters/http | `servicios-router.js` (GET / con query `estado`) |
| wiring | `src/app.js` (inyección), `src/server.js` (pool + repo + use case) |

## 2. SQL ejecutado (preparado, parámetro enlazado)

```sql
SELECT id, nombre, descripcion, duracion_minutos, estado
  FROM servicio
 WHERE (:estado IS NULL OR estado = :estado)
 ORDER BY id
```

Adaptador: `MysqlServicioRepository.findAll` (mysql2 `execute`, `namedPlaceholders`). Errores SQL → log servidor + `AppError 500 DB_ERROR` sin fugas de SQL/secretos.

## 3. Suite automatizada

```
$ npm test    # node --test
# tests 17 · pass 17 · fail 0
  unit (8): parseEstadoQuery (acepta/rechaza), toServicio (5 columnas), listarServicios
            (lista completa, filtro estado, vacío, propagación de error)
  integración health (3): 200 ok / 503 db=error / 404
  integración servicios (6): lista completa 200 · filtro activo · vacío [] ·
            estado inválido 400 VALIDATION_ERROR · repo DB 500 DB_ERROR sin SQL filtrada ·
            error inesperado 500 INTERNAL_ERROR genérico
```

## 4. Verificación con datos reales (MySQL 8.0.46)

Fixtures identificables insertados con el usuario admin del entorno (`devcode`, operación administrativa; la aplicación sólo usa `app_rw` para SELECT). Tabla `servicio` estaba vacía (0 filas); no existían registros previos que alterar.

```
INSERT ... 'Fixture CP03 - Consulta general' (30, activo)
           'Fixture CP03 - Control pediátrico' (45, activo)
           'Fixture CP03 - Vacunación (retirado)' (15, inactivo)
→ ids 990005, 990006, 990007
```

```
$ curl http://127.0.0.1:3001/api/v1/servicios
[{"id":990005,"nombre":"Fixture CP03 - Consulta general","descripcion":null,"duracion_minutos":30,"estado":"activo"},
 {"id":990006,...,"duracion_minutos":45,"estado":"activo"},
 {"id":990007,...,"duracion_minutos":15,"estado":"inactivo"}]                                    HTTP 200

$ curl "...?estado=activo"    → 2 filas (990005, 990006)                                         HTTP 200
$ curl "...?estado=inactivo"  → 1 fila  (990007)                                                 HTTP 200
$ curl "...?estado=malo"
{"error":{"code":"VALIDATION_ERROR","message":"Parámetro 'estado' inválido: use 'activo' o 'inactivo'",
 "details":{"parametro":"estado"}}}                                                              HTTP 400
```

Cruce SQL↔HTTP: los 3 registros devueltos coinciden con `SELECT id, nombre, duracion_minutos, estado FROM servicio ORDER BY id` (mismos valores).

## 5. Limpieza (condición 8) y estado final

```
DELETE FROM servicio WHERE nombre LIKE 'Fixture CP03%';   -- sólo fixtures de este CP
SELECT COUNT(*) FROM servicio;                            → 0
$ curl /api/v1/servicios                                  → []   HTTP 200
```

Lista vacía real verificada. Servidor detenido tras cada prueba (sólo local). **CP-API-03: COMPLETADO.**
