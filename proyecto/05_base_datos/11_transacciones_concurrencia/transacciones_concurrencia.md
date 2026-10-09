# Transacciones y concurrencia — MySQL 8.0.46 / InnoDB — Paso 12

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 12, motor D-06/D-06-R1 (MySQL 8.0.46/InnoDB).
**Skills:** `databases` + skill específico de MySQL · **Fecha:** 9 de octubre de 2026.
**Entradas:** RN-02/03/05/09/16, RNF-010/011/012/017, ER-02, D-05a/b/c, L-01/L-03, `integridad.md`.
**Restricción:** estrategia documental **sin SQL ejecutable**; verificación con la versión local antes de ejecutar.

## 1. Principio rector (instrucción 6)

> **Ninguna restricción UNIQUE impide solapes de intervalos.** No existe —ni se propone— una clave única que cubra rangos solapados: dos citas con `inicio_utc` distintos y ventanas que se traslapan son filas legítimas bajo cualquier UNIQUE (incluidas las de T7). **La exclusión de reservas incompatibles (RN-03/RNF-010) es una garantía transaccional**, resuelta con bloqueo explícito, reintentos e idempotencia, no con claves.

## 2. Estrategia de reserva/reprogramación (transacción canónica)

**Aislamiento:** InnoDB **REPEATABLE READ** (por defecto) + **lecturas con bloqueo explícito** donde se decide la concurrencia; sin depender de *gap locks* implícitos ni de unicidad.

**Protocolo (orden fijo de bloqueo para prevenir deadlocks — orden: profesional → excepciones → citas → asociación → detalle):**

1. **Lectura de idempotencia (previa a la transacción de negocio):** buscar `T12.clave`; si existe → **devolver el resultado guardado** sin re-ejecutar (RNF-012/CA-007). Si no existe, continuar.
2. **Abrir transacción.**
3. **Bloqueo canónico — clave del método:** `SELECT … FOR UPDATE` sobre la **fila de `T2.profesional`** objetivo → **serializa todas las operaciones de agenda de ese profesional** (escritor único por profesional). Es el recurso canónico que hace innecesario cualquier intento de UNIQUE de rangos.
4. **Dentro del bloqueo, validar (lecturas de decisión):**
   a. RN-16/A-01: asociación profesional–servicio **activa** en T4 (sin FK en T7, se verifica aquí).
   b. RN-05/L-01: horarios habituales del día (T5) ∖ excepciones (T6, lectura consistente) — disponibilidad.
   c. RN-03: **solapes** en T7 con `profesional_id` + ventana `inicio_utc < fin_nuevo AND fin_utc > inicio_nuevo` **y** estados bloqueantes (Confirmada/En atención — A-03). Si hay solape → **rechazo** con conflicto (no es error de sistema).
   d. RN-06/OD-01: anticipaciones mínimas (T11) — *valor de OD-01 aún no aprobado → se omitirá su validación hasta que se fije (pendiente humano)*.
5. **Escrituras en la misma transacción:** INSERT de la cita (o UPDATE de fechas conservando duración — D-05a atómica), INSERT de T8 (si aplica), INSERT de T9 (auditoría con `contexto`), INSERT de T13 **outbox** (RNF-017), INSERT de T12 (resultado confirmado).
6. **Commit** → libera el bloqueo del profesional. **Rollback** ante cualquier fallo → no queda parcialidad (RNF-011): ni cita sin auditoría/outbox, ni outbox sin cita.

**Garantías:** exclusión de incompatibles (RN-03/RNF-010) por el paso 3+4c; consistencia cita↔disponibilidad ante fallos (RNF-011) por atomicidad; notificaciones desacopladas sin pérdida (RNF-017) por outbox en el mismo commit.

## 3. Reintentos y errores (manejo formal)

| Situación | Detección | Acción |
|---|---|---|
| Deadlock (InnoDB, error 1213) | código del motor | Rollback completo + **reintento** con la **misma `clave` de idempotencia** |
| Lock wait timeout (1205) | código del motor | Rollback + reintento con backoff |
| Conflicto de solape (paso 4c) | rechazo de negocio | No reintentar a ciegas: responder "no disponible" (la condición puede cambiar) |
| Reintento del cliente (red, RNF-012) | misma clave T12 | Búsqueda de idempotencia (paso 1) → reutiliza resultado, **nunca duplica** (CA-007) |

**Política de reintento:** máximo acotado (p. ej. 3–5 intentos) con **backoff exponencial + jitter**; entre intentos, **sin transacción abierta**; siempre con la misma clave de idempotencia. El patrón es seguro porque T12 se inserta **dentro** de la transacción exitosa: o se confirma todo, o no queda clave de un resultado parcial.

## 4. Otras operaciones concurrentes

| Operación | Estrategia |
|---|---|
| **Alta de horario (L-01)** | Bloqueo `FOR UPDATE` de la fila de profesional + verificación de solapes entre intervalos del mismo día **antes** de insertar (CHK por fila + UQ sólo cubren deduplicación exacta) |
| **Alta de excepción (T6)** | Misma transacción: anti-duplicados E2 (Paso 08 §3: búsqueda NULL-segura + índice único funcional); **solapes con otros tipos permitidos** (D-05b) |
| **Cambio de estado (RN-08)** | Bloqueo de la fila de la cita (`FOR UPDATE`) → máquina de estados valida; si el estado ya no corresponde → rechazo; evita "cambio duplicado técnico" (D-05c M-3) |
| **Restablecimiento (RF-029/RNF-030)** | T14 + T9 en **un solo commit**; `contexto` con id del restablecimiento (correlación principal) |
| **Consumidor outbox** | UPDATE acotado a filas `pendiente` con semántica "tomar y marcar" (lectura con bloqueo de la fila en proceso o actualización condicionada por `estado`); reintento con `intentos` incrementado (CHK ≥ 0); nunca reintentar indefinidamente sin techo |
| **Idempotencia TTL (L-03)** | **Diferida al Paso 12 → aquí se fija la regla, no el valor:** la caducidad de T12 debe ser **≥ ventana máxima de reintentos del cliente**; expiración por proceso de limpieza **sin** comprometer la prevención de duplicados (CA-007/RNF-012). *Valor concreto: requiere criterio de operación — se propone no bloqueante en la tabla de decisiones del cierre* |
| **ER-02 equivalencia/conflicto** | Comparación de solicitudes en la transacción: misma clave → reuso; misma operación con datos distintos → conflicto controlado (respuesta de error, sin sobrescribir) |
| **RN-09 bajo carga (15 % reservas)** | Bloqueo por profesional = concurrencia **por cliente**, no global; no hay cuello de botella central; pool acotado (Paso 11) |

## 5. No destructivos y auditoría

- Append-only de T8/T9 garantizado también por permisos (Paso 09).
- Ninguna operación masiva sin respaldo previo (RNF-015) y sin autorización (workflow Pasos 15/17).

## 6. Verificaciones

1. Exclusión de solapes **no** delegada a UNIQUE — bloqueo canónico por profesional + validación en transacción (instrucción 6).
2. Reintentos con idempotencia formal (mecanismo, error codes, backoff) y sin duplicados (CA-007/RNF-012).
3. D-05a (duración atómica), D-05b (E2 transaccional), D-05c (estados/idempotencia), outbox RNF-017 y auditoría RF-029 integrados.
4. Sin SQL ejecutable; sin cambios en modelos; preflight **resuelto** (D-06-R1: local = objetivo = 8.0.46); InnoDB RR + `FOR UPDATE` + errores 1213/1205 compatibles con 8.0.46 (ver `15_reportes/compatibilidad_mysql_8046.md`).

**Estado:** elaborado — agrupado con Pasos 07–14.
