# ADR-001 — Arquitectura de la primera versión

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Fecha:** 8 de octubre de 2026
**Estado:** APROBADA (decisión humana explícita)
**Decisor:** responsable del proyecto (estudiante), conforme a `AGENTS.md` §14.
**Entradas:** `proyecto/03_resultados/arquitectura_alternativas.md`, `validacion_humana_requisitos.md`, `proyecto/01_requisitos/` (RF, RNF, CA, `perfil_carga.md`), `proyecto/00_contexto/`.

---

## 1. Contexto

La primera versión del sistema debe garantizar consistencia transaccional entre disponibilidad y reservas (RN-09, RNF-010/011), idempotencia (RNF-012), notificaciones internas desacopladas (RNF-017), separación de capas (RNF-022), pruebas automatizadas (RNF-025), rendimiento nominal de 100 usuarios concurrentes con p95 < 800/1200 ms (RNF-006/007/008), disponibilidad objetivo 99,5 % y respaldos verificables (RNF-014/015/016), despliegue en Linux contenedorizado con configuración externa (RNF-023/024), sin stack tecnológico seleccionado aún (`restricciones.md`).

Se evaluaron tres alternativas: **A** monolito modular, **B** microservicios y **C** arquitectura hexagonal (el análisis completo, con componentes, comunicación, persistencia, riesgos y costos, está en `proyecto/03_resultados/arquitectura_alternativas.md`).

## 2. Decisión

**Se aprueba la combinación A + C: monolito modular con arquitectura hexagonal interna y despliegue monolítico.**

- **A** define la topología de despliegue: un proceso de aplicación, una base de datos relacional, módulos con límites explícitos (`identidad`, `catalogo`, `agenda`, `reservas`, `seguimiento`, `auditoria`, `notificaciones`, `parametros`, presentación y transversales).
- **C** define el estilo interno: dominio sin framework, casos de uso, puertos y adaptadores, con dependencias hacia adentro y adaptadores in-memory para pruebas.

**Se descarta la alternativa B (microservicios) para la versión inicial.**

## 3. Justificación

1. **Consistencia transaccional:** reserva y reprogramación ocurren en una única transacción ACID local, sin sagas ni coordinación distribuida (RN-09, RNF-010/011, CA-007).
2. **Control de concurrencia e idempotencia:** verificación de solapamiento, escritura de la cita, auditoría y clave de idempotencia en el mismo ámbito transaccional (RNF-010/012).
3. **Mantenibilidad:** los módulos con límites explícitos y los puertos hexagonales hacen verificable la separación de capas (RNF-022) y preparan una futura extracción incremental si el sistema crece.
4. **Pruebas automatizadas:** los casos de uso se prueban con adaptadores in-memory, sin infraestructura (RNF-025, CA-007/CA-008).
5. **Costo operativo proporcional al alcance:** ~3–4 contenedores y una sola base de datos simplifican respaldos y restauración (RNF-015/016, CA-013) y la medición de disponibilidad (RNF-014), para un alcance de 29 RF sin integraciones externas.

**Motivos del descarte de B:** complejidad operativa desproporcionada para la v1; riesgo de introducir consistencia distribuida en la operación central de disponibilidad/reserva al separar `agenda` de `scheduling`; mayor número de modos de fallo frente al objetivo del 99,5 %; sobrecarga de pruebas y evidencias para el contexto académico. B permanece como opción documentada para ampliaciones futuras (mensajería externa, telemedicina, multi-institución).

## 4. Trazabilidad RF/RNF → decisión

| Requisito | Decisión | Justificación |
|---|---|---|
| RN-09, RNF-010, RNF-011, CA-007 | agenda + reservas en un proceso y una transacción ACID | elimina coordinación distribuida |
| RNF-012, CA-007 | almacenamiento de idempotencia en la misma transacción | clave única persistida con la reserva |
| RF-024, RF-028, RNF-017, CA-012 | outbox transaccional + worker asíncrono en proceso | fallo de notificación no invalida la reserva; sin proveedores externos |
| RNF-006/007/008 + `perfil_carga.md` | proceso único + consulta de disponibilidad indexada | 100 VU y p95 no requieren distribución |
| RNF-014, RNF-015, RNF-016, CA-013 | una sola base de datos y pocas piezas | respaldo diario y restauración trimestral simples |
| RNF-022 | hexagonal interno | presentación/persistencia fuera, negocio dentro |
| RNF-025 | puertos + adaptadores in-memory | pruebas sin BD ni red |
| RNF-026, RNF-027 | adaptadores de logs/métricas con `operation_id` | un solo punto de instrumentación |
| RNF-023, RNF-024 | contenedores + configuración externa por entorno | cumplible con menor esfuerzo en A/C |
| RNF-028, RN-15, CA-014 | puertos `Reloj` y `ConversorZonaHoraria` | núcleo inmune a la zona del servidor |
| RF-027, RNF-018..021 | presentación en el mismo sistema consumiendo la misma API | V-04: "parte del mismo sistema" |
| RF-001..003, RF-029, RNF-002/029 | módulo `identidad` con hash adaptativo, límite de intentos y reset por administrador | autorización en servidor |
| `restricciones.md` (stack sin decidir) | hexagonal interno | elección de tecnología diferida al borde |
| Alcance v1 | B descartada | proporcionalidad |

## 5. Consecuencias

- El diseño de base de datos se hará sobre **un único almacén relacional** (fase `02_database_workflow`).
- Quedan obligatorios: disciplina de fronteras de módulo (reglas de dependencia verificables) y contención del número de puertos hexagonales para evitar sobre-ingeniería.
- El ADR no selecciona lenguaje, framework, motor de base de datos, frontend ni proveedor de nube.

## 6. Decisiones pendientes (no cubiertas por este ADR)

1. Selección de stack (lenguaje, framework, motor BD, frontend) → humano + `architecture-reviewer`.
2. Técnica de exclusión de solapamiento de intervalos → `database-specialist`.
3. Estrategia de autenticación (sesión vs JWT vs cookie; expiración; límite de intentos) → `security-reviewer`.
4. Semántica de idempotencia (clave, TTL, fallo parcial) → backend + humano.
5. Índices y plan de consulta de disponibilidad para p95 < 800 ms → `database-specialist`.
6. Despliegue, TLS, secretos y CI/CD → `devops-architect`.
7. Política de respaldo/restauración y métrica del 99,5 % → `devops-architect` + humano.
8. Fronteras de módulos y profundidad hexagonal admisible → `architecture-reviewer` + humano.
9. Formato de presentación (SPA vs server-side) y consulta de notificaciones (paginado/SSE/polling) → humano.

## 7. Registro de la decisión humana

> **AUTORIZACIÓN HUMANA: APROBADA** (8 de octubre de 2026).
> Aprobación de la combinación A + C; descarte de B para la versión inicial; solicitud de registro formal con trazabilidad RF/RNF; selección de stack y decisiones especializadas permanecen pendientes; sin código, frameworks, migraciones ni infraestructura antes de la aprobación final de este ADR.
