# Índices y rendimiento — MySQL 8.0.46 / InnoDB — Paso 11

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 11, motor D-06/D-06-R1 (MySQL 8.0.46/InnoDB).
**Skills:** `database-schema-designer` + `databases` · **Fecha:** 9 de octubre de 2026.
**Regla del paso:** **todo índice se vincula a una consulta o patrón de acceso** (workflow). Sin SQL ejecutable.
**Objetivos:** RNF-006 (p95 disponibilidad < 800 ms), RNF-007 (p95 reserva < 1200 ms), RNF-008 (100 concurrentes), perfil: 1.000 usuarios / 10.000 citas.

## 1. Patrones de acceso identificados (fuente: RF/RNF/CA)

| # | Consulta/operación | Origen | Tablas |
|---|---|---|---|
| P1 | Disponibilidad de un profesional por día (horarios ∖ excepciones ∖ citas) | RN-05, RNF-006 | T5, T6, T7 |
| P2 | Confirmación de reserva (buscar solapes activos en ventana) | RN-03/RN-09, RNF-007 | T7 |
| P3 | Citas del solicitante / del profesional (listados, agenda) | RF-012…020 | T7 |
| P4 | Detalle de cita con sus eventos de historial | RF-021 | T8 |
| P5 | Notificaciones del destinatario | RF-028 | T10 |
| P6 | Auditoría por usuario/fecha u operación (consulta administrativa) | RF-026, RNF-013 | T9 |
| P7 | Búsqueda de clave de idempotencia (reintento) | RNF-012, CA-007 | T12 |
| P8 | Consumidor outbox: eventos `pendiente` ordenados por antigüedad | RNF-017, CA-012 | T13 |
| P9 | Asociación profesional–servicio vigente al reservar | RN-16, A-01 | T4 |
| P10 | Excepciones de un profesional/fecha (y anti-duplicados E2) | RN-05, D-05b | T6 |
| P11 | Alta de horario con deduplicación exacta | L-01, RN-16 | T5 |
| P12 | Limpieza de claves de idempotencia caducadas | L-03 (Paso 12) | T12 |

## 2. Catálogo de índices propuestos

Leyenda: **UNQ** = índice único (integridad) · **FK** = soporte de join/borrado restringido · orden de columnas = igualdad primero, rango después.

| Tabla | Índice | Tipo | Padrón/justificación |
|---|---|---|---|
| T1 | `correo` | **UNQ** | CA-001 + login (P3/P6) |
| T1 | PK `id` | UNQ/cluster | joins FK |
| T2 | `usuario_id` | **UNQ** | R1 + login de profesional |
| T4 | PK `(profesional_id, servicio_id)` | UNQ/cluster | P9 (búsqueda par exacta) + R5 |
| T4 | `servicio_id` | FK | inverso de P9 |
| T5 | PK `id` | cluster | — |
| T5 | `(profesional_id, dia_semana, hora_inicio)` | **UNQ** | P1/P11 (dedup L-01) |
| T5 | `(profesional_id, dia_semana)` |idx | P1 (rango de horarios del día) |
| T6 | PK `id` | cluster | — |
| T6 | `(profesional_id, fecha)` |idx | P1/P10 (excepciones del día) |
| T6 | **índice único funcional E2** (expresión NULL-segura) | **UNQ** | D-05b (anti-duplicados), Paso 08 §3 |
| T6 | `servicio…` — n/a; FK `profesional_id` cubierta por los anteriores | FK | — |
| T7 | PK `id` | cluster | P4 |
| T7 | `(profesional_id, inicio_utc)` |idx | **P2**: barrido de solapes activos por ventana + P1 |
| T7 | `(solicitante_id, inicio_utc)` |idx | P3 (agenda del solicitante) |
| T7 | `(profesional_id, estado, inicio_utc)` |idx | P2 acotado a estados bloqueantes (Confirmada/En atención — A-03) |
| T7 | `servicio_id` | FK | RF-015/018 por servicio |
| T8 | `cita_id` | **FK** | P4 (historial de la cita) |
| T8 | `usuario_id` | **FK** | R13/búsqueda por responsable |
| T8 | `(cita_id, cambiado_utc)` |idx | P4 ordenado cronológicamente |
| T9 | `usuario_id` | **FK** | P6 |
| T9 | `cita_id` | **FK** | R12 (operaciones de una cita) |
| T9 | `(fecha_hora_utc)` |idx | P6 por rango de fechas |
| T10 | `destinatario_id` | **FK** | P5 |
| T10 | `cita_id` | **FK** | R9 |
| T11 | PK `clave` | cluster | P-solo pocas filas (parámetros) |
| T12 | PK `clave` | cluster | **P7** (lookup idempotencia — punto crítico de latencia en reintentos) |
| T12 | `usuario_sesion` | **FK** | limpieza/depuración por sesión |
| T13 | PK `id` | cluster | — |
| T13 | `(estado, creado_utc)` |idx | **P8**: consumidor toma `pendiente` ordenado (baja selectividad → compuesto con rango) |
| T13 | `cita_id` | **FK** | R16 |
| T13 | `correlacion_id` |idx | ER-03 trazabilidad |
| T14 | `usuario_id` | **FK** | R11 (historial de restablecimientos) |
| T14 | `(estado, caduca_utc)` |idx | verificación de caducidad (OD-02/RNF-030) |

Notas MySQL/InnoDB: InnoDB crea índice para FK si falta, pero el **diseño explícito** fija orden de columnas; índices **UNQ son obligatorios** donde hay restricción de unicidad; no se añaden índices "por si acaso" (penalizan INSERT — RN-09/RNF-007 son de escritura).

## 3. Alineación con objetivos de rendimiento

| Objetivo | Medio |
|---|---|
| p95 < 800 ms disponibilidad (RNF-006) | P1 resuelto con `(profesional_id, dia_semana)` + `(profesional_id, fecha)` + `(profesional_id, inicio_utc)` — sin full scan; datos pequeños (10k citas) |
| p95 < 1200 ms reserva (RNF-007) | P2 con índice de solapes + **transacción corta con bloqueo por profesional** (Paso 12) — el planificador no sustituye al bloqueo |
| 100 concurrentes (RNF-008) | Pool de conexiones con **límite ≤ `max_connections`** (regla del skill); InnoDB maneja 100 sesiones sin pool agresivo, pero se recomienda pool en la app (p. ej. HikariCP u homólogo) con tamaño ajustado a CPU/IO del entorno |
| Escrituras frecuentes (reservas) | Índices **sólos los necesarios**; `innodb_buffer_pool_size` ≈ 70 % RAM del contenedor (checklist del skill para MySQL) |
| Verificación | **EXPLAIN/EXPLAIN ANALYZE** en Paso 19 sobre las consultas P1–P12 con datos de prueba (perfil de carga); detección de `SELECT *` y full scans como hallazgos |

## 4. Verificaciones

1. Cada índice del §2 cita su patrón (P1–P12) o restricción (UNQ/FK) — sin índices decorativos.
2. Sin SQL ejecutable; sin cambios en modelos aprobados; requisitos intactos.
3. Preflight **resuelto** (D-06-R1: local = objetivo = 8.0.46); índices funcionales (8.0.13+) compatibles — ver `15_reportes/compatibilidad_mysql_8046.md`.

**Estado:** elaborado — agrupado con Pasos 07–14.
