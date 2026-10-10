# Evidencia CP-API-08 — OpenAPI + suite CRUD completa

**Fecha:** 9 de octubre de 2026 · **Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual

## 1. Especificación

- Archivo: `proyecto/06_codigo/openapi.yaml` (OpenAPI **3.1.0**).
- 3 paths documentados: `GET /api/v1/health`, `GET|POST /api/v1/servicios`, `GET|PUT|DELETE /api/v1/servicios/{id}`.
- Schemas: `Servicio`, `ServicioCreacion`, `Error` (códigos VALIDATION_ERROR/NOT_FOUND/DB_ERROR/INTERNAL_ERROR).
- Validada con parser YAML (`openapi: 3.1.0 · paths: 3`).
- Contratos y códigos alineados con D-P2-2 (`decisiones_practica2_stack_api_piloto.md`) y con la suite real.

## 2. Suite final

```
$ npm test
# tests 41 · pass 41 · fail 0
```

Cobertura: CP-API-02 (health), CP-API-03 (colección/filtro/vacío/errores), CP-API-04 (por id 200/404/400),
CP-API-05 (POST 201/400×8/JSON malformado), CP-API-06 (PUT 200/404/400), CP-API-07 (DELETE lógico
conserva fila + idempotente + 404/400) + errores 500 sin fugas. Ejecución real (no simulada).

## 3. Cierre de la Práctica 2 (piloto)

- Workflow terminado en `HUMAN_STATUS: PENDING` (revisión del responsable), sin iniciar backend completo.
- Sin autenticación (diferida a `identidad`), sin frontend, sin otros módulos, sin cambios de esquema.
- Práctica 1 intacta; sin migraciones; sin credenciales en repo, respuestas ni evidencias.
