# Evidencia CP-API-04/05/06/07 — CRUD completo de `/api/v1/servicios`

**Fecha:** 9 de octubre de 2026 · **Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Autorización humana:** ejecución continua CP-API-04…08 sin paradas intermedias (responsable, 2026-10-09).
Cuenta de aplicación: **`app_rw`** (sin credenciales mostradas). Sin cambios de esquema; Práctica 1 intacta.

## 1. Implementación (hexagonal, módulo `catalogo`)

| Checkpoint | Uso case | SQL (preparado) |
|---|---|---|
| CP-API-04 | `obtenerServicio` | `SELECT ... WHERE id = :id` |
| CP-API-05 | `crearServicio` | `INSERT INTO servicio (nombre, descripcion, duracion_minutos, estado) VALUES (:...)` |
| CP-API-06 | `actualizarServicio` | `UPDATE servicio SET ... WHERE id = :id` (comprueba existencia previa) |
| CP-API-07 | `desactivarServicio` | `UPDATE servicio SET estado = :estado WHERE id = :id` — **nunca `DELETE FROM`** |

Validaciones (dominio, servidor): id entero >0; nombre 1–100 (requerido, trim); descripcion ≤500 u `null`;
duracion_minutos entero 1–1440 (requerido; alineado a `chk_t3_duracion`); estado ∈ {activo,inactivo}
(default `activo` en POST/PUT; `chk_t3_estado`). JSON malformado → 400. Errores 500 sin fugas SQL/secretos.

## 2. Suite automatizada (ejecutada)

```
$ npm test    # node --test
# tests 41 · pass 41 · fail 0
  unit validaciones (7): parseIdParam, parseCrear/ActualizarServicioBody (acepta/rechaza/trim)
  unit casos de uso (4): obtener/crear/actualizar/desactivar + null en no encontrado
  unit listar (8): CP-API-03
  integración health (3) + servicios (19): colección, por id (200/404/400),
    POST (201 mínimo/completo, 8 payloads inválidos sin crear filas, JSON malformado),
    PUT (200/404/400), DELETE lógico (200 conserva fila, idempotente, 404/400)
```

Corrección interna durante CP-API-04: caso de test `id=''` mapeaba a la colección (`/servicios/`);
sustituido por `id=%20` (espacio) que sí ejercita la validación de id. Sin cambio de comportamiento del API.

## 3. Verificación HTTP+SQL con datos reales (MySQL 8.0.46, tabla `servicio`)

Estado previo: 0 filas (sin registros preexistentes que conservar). Servidor local `127.0.0.1:3001`.

```
CP-API-05 POST 201 ×2 → ids 990008, 990009 (nombres prefijo "API Piloto CP05 - ")
CP-API-05 POST 400 ×4 (nombre vacío, duracion 0, estado inválido, nombre ausente) → COUNT(*)=2 (sin filas fantasma)
CP-API-04 GET /990008 → 200 · GET /999999 → 404 · GET /abc → 400
CP-API-06 PUT /990008 → 200 (nombre/duracion actualizados) · PUT /999999 → 404 · PUT inválido → 400
CP-API-07 DELETE /990009 → 200 {estado:"inactivo"} · DELETE /999999 → 404
         GET ?estado=inactivo → [990009]
SQL devcode: SELECT → 990008 activo | 990009 inactivo   ← fila conservada, sin borrado físico
Limpieza (autorizada, fixtures propios por nombre LIKE 'API Piloto CP%') → COUNT(*)=0 → GET → [] 200
```

Servidor detenido tras cada bloque de pruebas (sólo local). **CP-API-04…07: COMPLETADOS.**
