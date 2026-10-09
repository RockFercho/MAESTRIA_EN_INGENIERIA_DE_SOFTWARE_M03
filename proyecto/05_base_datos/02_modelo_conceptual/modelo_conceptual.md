# Modelo conceptual de datos
## Sistema Web de Gestión de Citas y Atención Virtual

**Workflow:** `02_database_workflow` — Paso 02 (modelo conceptual).
**Skill:** `database-schema-designer`.
**Fecha:** 8 de octubre de 2026.
**Entradas aprobadas:** RF-001…029, RNF-001…030, RN-01…16, CA-001…015, `requisitos_datos.md` (Paso 01 aprobado), ADR-001, decisiones OD-01…OD-04.
**Restricción:** documento conceptual; **sin SQL, sin migraciones, sin motor de base de datos seleccionado**.

---

## 1. Convención de este documento

- Atributos descritos de forma conceptual (nombre, significado, restricciones), sin tipos de motor.
- Instantes temporales: se almacenan en **UTC** (RNF-028); los horarios recurrentes y sus excepciones se interpretan en **America/La_Paz** (RN-15).
- Identificadores: toda entidad tiene un identificador único (implícito en las PK descritas).

## 2. Entidades

### E1. Usuario
- **Atributos:** identificador; nombre completo; correo electrónico (**único**); contraseña (solo hash, nunca texto plano); rol (solicitante | profesional | administrador); estado (activo | inactivo); fechas de creación/actualización.
- **Restricciones:** RNF-002, RNF-029 (longitud ≥ 12 se valida en aplicación), CA-001 (correo único), RNF-004 (sin secretos en datos).
- **Trazabilidad:** RF-001, RF-002, RF-003, RF-029, RNF-003.

### E2. Profesional
- **Atributos:** identificador; referencia al usuario (rol profesional); datos profesionales de exhibición; estado (activo | inactivo); fecha de desactivación.
- **Restricciones:** la desactivación **no** elimina registros históricos (RF-004, RN-11).
- **Trazabilidad:** RF-004, RF-006 (como protagonista de la asociación).

### E3. Servicio
- **Atributos:** identificador; nombre; descripción; duración general en minutos (**configurable** por administrador); estado (activo | inactivo).
- **Trazabilidad:** RF-005, RN-04.

### E4. Asociación profesional–servicio
- **Atributos:** profesional; servicio; duración específica opcional en minutos (prioridad sobre la general — RN-04); estado (activa | inactiva); fecha de registro/baja.
- **Restricciones:** clave compuesta **(profesional, servicio)** identifica único; el estado **activa** es la base de RN-16 (OD-04). Desactivación y reactivación son transiciones de estado **sin eliminación física**; no existen entidades de historial de activación (fuera de alcance — **ER-05 aprobada**). La reactivación conserva la fecha de registro original.
- **Compatibilidad con A-01:** las citas persisten (profesional, servicio) + duración efectiva **sin FK** a la asociación, por lo que desactivar o reactivar nunca altera citas históricas (RN-11).
- **Trazabilidad:** RF-006, RN-04, RN-16, CA-002.

### E5. Horario habitual de atención
- **Atributos:** identificador; profesional; día de semana; hora de inicio; hora de fin (hora local institucional, RN-15).
- **Trazabilidad:** RF-007, RN-05, RN-15.

### E6. Excepción de disponibilidad
- **Atributos:** identificador; profesional; fecha; hora de inicio/fin opcionales (bloqueo parcial); tipo (ausencia | feriado | bloqueo); motivo opcional.
- **Restricciones:** soporta **ambos casos** — jornada completa (sin inicio/fin) y rango horario específico (con inicio/fin) — sin ambigüedad (**A-05 aprobada**).
- **Trazabilidad:** RF-008, RN-05.

### E7. Cita
- **Atributos:** identificador único; solicitante (usuario); profesional; servicio; instante de inicio (UTC); instante de fin (UTC); duración efectiva reservada en minutos (RN-04); estado (Confirmada | En atención | Atendida | Cancelada | No asistida — inicial **Confirmada**, RN-08); justificación del cambio fuera de plazo (opcional, obligatoria cuando RN-14 lo exige); marcas de creación/actualización.
- **Restricciones conceptuales:**
  - RN-01: solicitante, profesional, servicio e intervalo son obligatorios.
  - RN-03: dos citas del mismo profesional en estado **Confirmada o En atención** no pueden solaparse; Atendida, Cancelada y No asistida no reservan tiempo (**A-03 aprobada**).
  - RN-16: al crear y al reprogramar, (profesional, servicio) debe existir como asociación **activa** (OD-04/**A-01 aprobada**); la desactivación posterior no altera la cita histórica y la cita conserva la trazabilidad de la asociación utilizada (par profesional-servicio + duración efectiva).
  - RN-11: sin eliminación física en estados finales.
  - RN-04: la duración efectiva queda **fijada en la cita** al reservarse.
  - **A-02 aprobada:** no se almacena un atributo "fecha" independiente; la fecha institucional se deriva del instante de inicio en America/La_Paz (a considerar en los modelos lógico y físico).
- **Trazabilidad:** RF-012…RF-020, RN-01…RN-08, RN-13, RN-14, RN-16, CA-003…CA-005.

### E8. Historial de cambios de cita
- **Atributos:** identificador; cita; tipo de cambio (cambio de estado | reprogramación); estado anterior; estado nuevo (nulo en reprogramación); fecha/hora anterior y nueva (reprogramación); fecha del cambio (UTC); **usuario responsable (NO NULO — R13, ER-01)**; justificación (opcional).
- **Restricciones:** escritura **append-only**; la reprogramación **no** altera el estado de la cita (se mantiene Confirmada — V-01) y siempre genera registro (RN-10).
- **Trazabilidad:** RF-021, RF-022, RN-08, RN-10, CA-006.

### E9. Auditoría de operaciones críticas
- **Atributos:** identificador de operación (correlación); tipo de operación (reserva | reprogramación | cancelación | cambio de estado | restablecimiento de contraseña | …); **usuario responsable (NO NULO — R14, ER-01)**; **cita (opcional, 0..1 — R12, ER-04)**; fecha/hora (UTC); resultado (éxito | fallo); contexto adicional (**sin contraseñas ni secretos** — RNF-026).
- **Restricciones:** append-only (RF-026, RN-11 en espíritu); una fila corresponde a **una operación**, que referencia a lo sumo una cita o ninguna (p. ej. restablecimiento de contraseña — E14).
- **Trazabilidad:** RF-026, RNF-013, RNF-026, CA-006.

### E10. Notificación interna
- **Atributos:** identificador; usuario destinatario; cita; evento (confirmada | reprogramada | cancelada); datos actualizados de la reserva (instantánea del momento del evento); fecha de generación (UTC).
- **Sin estado de lectura** (OD-03, fuera de alcance).
- **Restricciones:** conserva **instantánea** de los datos relevantes del evento que la originó; cambios posteriores de la cita no alteran su contenido histórico (**A-04 aprobada**). La generación es **posterior y desacoplada** de la confirmación (outbox, E13); su fallo no invalida la cita (RNF-017, CA-012).
- **Trazabilidad:** RF-024, RF-028, RNF-017, CA-012.

### E11. Parámetro operativo
- **Atributos:** clave; valor; descripción; **usuario que modificó (NO NULO — R15, ER-01)**; fecha de modificación (UTC).
- **Claves previstas (OD-01):** `anticipacion_minima_reservar` (**sin valor aprobado** — no asumir), `anticipacion_minima_reprogramar` (2 h), `anticipacion_minima_cancelar` (2 h); todas configurables por administrador.
- **Trazabilidad:** RF-025, RN-12, RN-13, CA-004, CA-005.

### E12. Clave de idempotencia
- **Atributos:** clave (**única global**); **usuario/sesión — identidad del solicitante (NO NULO)**; **tipo de operación** protegida; **solicitud original** (datos de la petición); resultado confirmado; fechas de creación y caducidad.
- **Mecanismo conceptual de equivalencia (ER-02 aprobada):** dos solicitudes son **equivalentes** si comparten la misma clave **y** los mismos datos de solicitud original; una clave **reutilizada con datos diferentes produce rechazo por conflicto**; un reintento válido **recupera el resultado previamente confirmado sin duplicar la operación**.
- **Restricciones:** clave única — RNF-012, CA-007; consistencia con RN-09. La comparación concreta se define en el Paso 04 **sin seleccionar mecanismos de motor**.
- **Trazabilidad:** RNF-012, CA-007, RN-09.

### E13. Evento outbox
- **Atributos:** identificador; **identificador de correlación**; tipo de evento (cita confirmada | reprogramada | cancelada); **cita (opcional, 0..1 — R16, ER-03)**; carga del evento; estado (pendiente | procesado); intentos; fechas.
- **Restricciones:** el evento se registra **en la misma transacción** que la cita y se consume fuera de ella; un fallo de consumo no afecta la reserva (RNF-017, CA-012). La trazabilidad con el origen se mantiene mediante el identificador de correlación; la referencia a cita es 0..1 para no imponer vínculo obligatorio a eventos ajenos al alcance actual.
- **Trazabilidad:** RF-024, RNF-017, CA-012.

### E14. Registro de restablecimiento de contraseña
- **Atributos:** identificador; usuario; hash de la contraseña temporal (nunca visible); fecha de caducidad (configurable); estado (pendiente | usado | caducado); fecha de creación; referencia de auditoría.
- **Restricciones:** un solo uso; cambio obligatorio al iniciar sesión; el sistema no almacena ni recupera la contraseña original (RF-029, RNF-030, OD-02).
- **Trazabilidad:** RF-029, RNF-030, CA-015.

## 3. Relaciones y cardinalidades

**Numeración:** R1…R12 conservadas (R12 **modificada por ER-04**, con su preexistencia documentada); R13…R16 añadidas en la revisión del Paso 03 (ER-01, ER-03). Sin renumeraciones.

| # | Relación | Cardinalidad | Justificación |
|---|---|---|---|
| R1 | Usuario — Profesional | 1 : 0..1 | Solo los usuarios con rol profesional tienen ficha de profesional (RF-003, RF-004) |
| R2 | Usuario — Cita (como solicitante) | 1 : N | RF-015/RF-016: un solicitante tiene muchas citas |
| R3 | Profesional — Cita | 1 : N | RN-01/RN-03: todas las citas pertenecen a un profesional |
| R4 | Servicio — Cita | 1 : N | RN-01 |
| R5 | Profesional — Asociación — Servicio | N : M | RF-006: un profesional ofrece varios servicios y viceversa; la asociación porta duración específica y estado (RN-16) |
| R6 | Profesional — Horario habitual | 1 : 0..N | RF-007: puede no tener horario configurado aún |
| R7 | Profesional — Excepción de disponibilidad | 1 : 0..N | RF-008 |
| R8 | Cita — Historial de cambios | 1 : 0..N | RF-022/CA-006: la reprogramación y cada cambio de estado generan registro |
| R9 | Cita — Notificación | 1 : 0..N | RF-024: una cita genera varias notificaciones (reserva, reprogramación, cancelación) |
| R10 | Usuario — Notificación (destinatario) | 1 : 0..N | RF-028 |
| R11 | Usuario — Restablecimiento de contraseña | 1 : 0..N | RF-029: históricos de restablecimientos |
| R12 | Cita — Auditoría (operación) | **1 : 0..N** — cada operación de auditoría referencia **0..1** cita (FK opcional) **(modificada por ER-04; antes: N : 0..N)** | RF-026/RNF-013; permite auditar operaciones sin cita (restablecimiento) |
| R13 | Usuario — Historial de cambios (responsable) | 1 : 0..N — cada registro tiene **exactamente 1** usuario responsable (NO NULO) | RF-021/RF-022: identificar al usuario responsable de cada operación (ER-01) |
| R14 | Usuario — Auditoría (responsable) | 1 : 0..N — responsable **NO NULO** en cada operación | RF-026/RNF-013 (ER-01) |
| R15 | Usuario — Parámetro operativo (modificador) | 1 : 0..N — modificador **NO NULO** | RF-025: trazabilidad de modificaciones por el administrador (ER-01) |
| R16 | Cita — Evento outbox | **1 : 0..N** — cada evento referencia **0..1** cita; trazabilidad por **identificador de correlación** | RF-024/RNF-017: una cita origina múltiples eventos; desacoplamiento preservado (ER-03) |

**Nota sobre R12 (actualizada por ER-04):** la auditoría se organiza por *operación*; una fila corresponde a **una** operación que toca a lo sumo una cita (reserva, reprogramación, cancelación, cambio de estado) o **ninguna** (p. ej. restablecimiento de contraseña, E14). Sustituye al `N : 0..N` del Paso 02 bajo autorización explícita ER-04; RF-026 y RNF-013 se conservan íntegros.

**Nota sobre R13–R16:** formalizan referencias de atributo que ya existían en §2 (usuario responsable en E8/E9, modificador en E11, cita en E13), sin añadir entidades ni funcionalidad fuera de alcance (ER-01, ER-03).

## 4. Reglas de negocio integrales del modelo

| RN | Expresión en el modelo |
|---|---|
| RN-01 | Cita con 4 componentes obligatorios (E7) |
| RN-02/RN-03 | Disponibilidad del profesional verificada; exclusión de solapes entre citas en estado Confirmada o En atención (E7, **A-03**) |
| RN-04 | Duración efectiva = asociación (E4) si existe, si no servicio (E3); fijada en la cita |
| RN-05 | Disponibilidad = E5 ∖ E6 ∖ citas vigentes (E7) |
| RN-06 | Cancelación cambia estado; el intervalo queda libre por el estado, no por borrado |
| RN-08 | Máquina de estados en E7 con registro en E8; reprogramación no es transición |
| RN-09/RN-12…RN-14 | Validación en creación/reprogramación; parámetros en E11; justificación en E7/E8 |
| RN-10/RN-11 | E8 y E9 append-only; sin borrado físico de historial |
| RN-15/RNF-028 | E5/E6 en hora local institucional; E7/E8/E9 en UTC |
| RN-16 | Asociación activa (E4) exigida al crear/reprogramar (E7) |

## 5. Decisiones de modelado y su justificación

1. **Cita referencia (profesional, servicio), no a la asociación directamente:** la asociación puede desactivarse o cambiar su duración; el histórico de la cita debe conservarse intacto (RN-11). RN-16 se valida *al momento de crear y reprogramar*, no como FK permanente. → ver A-01 en §6.
2. **Ficha de Profesional separada de Usuario:** RF-004 permite desactivar profesionales conservando citas, lo que es independiente del ciclo de la cuenta (RF-002).
3. **Duración efectiva persistida en la cita:** exige RN-04 (las citas conservan su duración aunque cambie la configuración).
4. **Notificación con instantánea de datos:** RF-024 exige informar los datos *actualizados del evento*; si se referenciara la cita viva, notificaciones antiguas cambiarían retroactivamente. → ver A-04.
5. **Auditoría por operación, no por cita:** RF-026/RNF-013 piden usuario, fecha y resultado de la *operación*; incluye operaciones sin cita (reset de contraseña).
6. **Tres entidades de soporte (idempotencia, outbox, restablecimiento):** traducen directamente RNF-012, RNF-017 y RNF-030 sin mezclarlas con el dominio de citas.
7. **Parámetros como entidades con clave conocida (OD-01):** evita columnas dispersas y permite nuevos parámetros sin cambiar el modelo.

## 6. Decisiones humanas aprobadas — A-01 a A-05

Registradas en `proyecto/04_decisiones/decisiones_paso02_a01_a05.md`; evidencia previa en `proyecto/03_resultados/evidencia_pre_a01_a05/`.

| # | Decisión aprobada | Efecto en el modelo | Referencias |
|---|---|---|---|
| **A-01** | Asociación activa y válida al crear/reprogramar; la desactivación posterior no invalida las citas históricas; conservar la trazabilidad de la asociación utilizada | E7 persiste (profesional, servicio) + duración efectiva; RN-16 ampliada | RN-16, RF-012/014/017, RN-04, RN-11, CA-003, CA-004 |
| **A-02** | No duplicar la fecha derivable del instante de inicio en UTC; interpretación en America/La_Paz | E7 sin atributo "fecha" independiente; criterio para modelos lógico y físico | RNF-028, RN-15, RF-015, CA-014 |
| **A-03** | Confirmada y En atención bloquean el intervalo; Atendida, Cancelada y No asistida no; conservar históricos y evitar conflictos con las transiciones | RN-03 y RF-011 precisados; E7 y §4 actualizados | RN-03, RN-06, RN-08, RF-011, CA-002/003/006 |
| **A-04** | Instantánea de los datos del evento en cada notificación | E10 con instantánea; RF-024 precisado | RF-024, RF-028, RNF-017, CA-012 |
| **A-05** | Excepciones de jornada completa y de rango horario específico, sin ambigüedad | E6 con fecha y inicio/fin opcionales | RF-007, RF-008, RN-05, CA-002 |

## 7. Trazabilidad entidad → requisito

| Entidad | RF | RN | RNF | CA |
|---|---|---|---|---|
| E1 Usuario | 001–003, 029 | — | 002, 003, 029 | 001, 009, 015 |
| E2 Profesional | 004 | 11 | — | 009 |
| E3 Servicio | 005 | 04 | — | 002 |
| E4 Asociación | 006 | 04, 16 | — | 002, 003 |
| E5 Horario | 007 | 05, 15 | 028 | 002, 014 |
| E6 Excepción | 008 | 05, 15 | 028 | 002, 014 |
| E7 Cita | 012–020 | 01–04, 06–09, 13, 14, 16 | 010, 011, 028 | 003–005, 007 |
| E8 Historial | 021, 022 | 08, 10, 11 | — | 006 |
| E9 Auditoría | 026 | 10, 11 | 013, 026 | 006, 015 |
| E10 Notificación | 024, 028 | 14 | 017 | 012 |
| E11 Parámetro | 025 | 12, 13 | — | 004, 005 |
| E12 Idempotencia | — | 09 | 012 | 007 |
| E13 Outbox | 024 | — | 017 | 012 |
| E14 Restablecimiento | 029 | — | 030 | 015 |

## 8. Fuera del alcance de este modelo

- Historial clínico, facturación, pagos, telemedicina, IA diagnóstica (`alcance.md`).
- Notificaciones por correo (V-01/O-05 de la validación de requisitos).
- Estado de lectura de notificaciones (OD-03, eliminado).
- Historial de transiciones de la asociación profesional–servicio (ER-05: sin RF que lo exija).
- Cualquier SQL o definición de tipos de motor (Paso 04 en adelante).

## 9. Decisiones de revisión del Paso 03 — ER-01 a ER-05

Registradas en `proyecto/04_decisiones/decisiones_paso03_er01_er05.md`; evidencia previa en `proyecto/03_resultados/evidencia_pre_er01_05/`.

| # | Decisión aprobada | Efecto en el modelo |
|---|---|---|
| **ER-01** | Relaciones Usuario↔Historial, Usuario↔Auditoría, Usuario↔Parámetro con responsable/modificador NO NULO | Nuevas R13, R14, R15 (§3); precisión de §2 E8/E9/E11 |
| **ER-02** | Idempotencia: clave única global ligada a solicitante, tipo de operación y solicitud original; rechazo por conflicto en reuso con datos distintos; reintentos válidos recuperan resultado sin duplicar | E12 reescrito (§2) |
| **ER-03** | Cita→múltiples eventos; evento→0..1 cita; correlación preservada | Nueva R16 (§3); E13 con `cita_id` opcional y `correlacion_id` |
| **ER-04** | R12 modificada de N:0..N a 1:0..N con auditoría→0..1 cita | Fila R12 actualizada (§3); E9 con `cita_id` opcional |
| **ER-05** | Clave compuesta (profesional, servicio) mantenida; desactivación/reactivación sin eliminación física; sin historiales nuevos | Notas en §2 E4 y §8; sin cambios estructurales |

**Estado del paso 02:** aprobado por el responsable el 8 de octubre de 2026. **Paso 03 (diagrama E-R) aprobado formalmente** por el responsable (ER-01…ER-05 y corrección Mermaid incluidas). **HUMAN_STATUS: APPROVED_STEP_03 — WAITING_FOR_STEP_04_AUTHORIZATION** — el Paso 04 (modelo lógico) no está autorizado todavía.
