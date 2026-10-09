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
- **Restricciones:** (profesional, servicio) identifica único; el estado **activa** es la base de RN-16 (OD-04).
- **Trazabilidad:** RF-006, RN-04, RN-16, CA-002.

### E5. Horario habitual de atención
- **Atributos:** identificador; profesional; día de semana; hora de inicio; hora de fin (hora local institucional, RN-15).
- **Trazabilidad:** RF-007, RN-05, RN-15.

### E6. Excepción de disponibilidad
- **Atributos:** identificador; profesional; fecha; hora de inicio/fin opcionales (bloqueo parcial); tipo (ausencia | feriado | bloqueo); motivo opcional.
- **Trazabilidad:** RF-008, RN-05.

### E7. Cita
- **Atributos:** identificador único; solicitante (usuario); profesional; servicio; instante de inicio (UTC); instante de fin (UTC); duración efectiva reservada en minutos (RN-04); estado (Confirmada | En atención | Atendida | Cancelada | No asistida — inicial **Confirmada**, RN-08); justificación del cambio fuera de plazo (opcional, obligatoria cuando RN-14 lo exige); marcas de creación/actualización.
- **Restricciones conceptuales:**
  - RN-01: solicitante, profesional, servicio e intervalo son obligatorios.
  - RN-03: dos citas del mismo profesional con estado que reserve tiempo (Confirmada/En atención) **no pueden solaparse**.
  - RN-16: al crear y al reprogramar, (profesional, servicio) debe existir como asociación **activa** (OD-04).
  - RN-11: sin eliminación física en estados finales.
  - RN-04: la duración efectiva queda **fijada en la cita** al reservarse.
- **Trazabilidad:** RF-012…RF-020, RN-01…RN-08, RN-13, RN-14, RN-16, CA-003…CA-005.

### E8. Historial de cambios de cita
- **Atributos:** identificador; cita; tipo de cambio (cambio de estado | reprogramación); estado anterior; estado nuevo (nulo en reprogramación); fecha/hora anterior y nueva (reprogramación); fecha del cambio (UTC); usuario responsable; justificación (opcional).
- **Restricciones:** escritura **append-only**; la reprogramación **no** altera el estado de la cita (se mantiene Confirmada — V-01) y siempre genera registro (RN-10).
- **Trazabilidad:** RF-021, RF-022, RN-08, RN-10, CA-006.

### E9. Auditoría de operaciones críticas
- **Atributos:** identificador de operación (correlación); tipo de operación (reserva | reprogramación | cancelación | cambio de estado | restablecimiento de contraseña | …); usuario responsable; fecha/hora (UTC); resultado (éxito | fallo); contexto adicional (**sin contraseñas ni secretos** — RNF-026).
- **Restricciones:** append-only (RF-026, RN-11 en espíritu).
- **Trazabilidad:** RF-026, RNF-013, RNF-026, CA-006.

### E10. Notificación interna
- **Atributos:** identificador; usuario destinatario; cita; evento (confirmada | reprogramada | cancelada); datos actualizados de la reserva (instantánea del momento del evento); fecha de generación (UTC).
- **Sin estado de lectura** (OD-03, fuera de alcance).
- **Restricciones:** la generación es **posterior y desacoplada** de la confirmación (outbox, E13); su fallo no invalida la cita (RNF-017, CA-012).
- **Trazabilidad:** RF-024, RF-028, RNF-017, CA-012.

### E11. Parámetro operativo
- **Atributos:** clave; valor; descripción; usuario que modificó; fecha de modificación (UTC).
- **Claves previstas (OD-01):** `anticipacion_minima_reservar` (**sin valor aprobado** — no asumir), `anticipacion_minima_reprogramar` (2 h), `anticipacion_minima_cancelar` (2 h); todas configurables por administrador.
- **Trazabilidad:** RF-025, RN-12, RN-13, CA-004, CA-005.

### E12. Clave de idempotencia
- **Atributos:** clave (identificador único); usuario/sesión; referencia de la operación; resultado asociado; fecha de creación y caducidad.
- **Restricciones:** clave única — los reintentos reutilizan el resultado en lugar de duplicar la reserva (RNF-012, CA-007).
- **Trazabilidad:** RNF-012, CA-007.

### E13. Evento outbox
- **Atributos:** identificador; tipo de evento (cita confirmada | reprogramada | cancelada); carga del evento; estado (pendiente | procesado); intentos; fechas.
- **Restricciones:** el evento se registra **en la misma transacción** que la cita y se consume fuera de ella; un fallo de consumo no afecta la reserva (RNF-017, CA-012).
- **Trazabilidad:** RF-024, RNF-017, CA-012.

### E14. Registro de restablecimiento de contraseña
- **Atributos:** identificador; usuario; hash de la contraseña temporal (nunca visible); fecha de caducidad (configurable); estado (pendiente | usado | caducado); fecha de creación; referencia de auditoría.
- **Restricciones:** un solo uso; cambio obligatorio al iniciar sesión; el sistema no almacena ni recupera la contraseña original (RF-029, RNF-030, OD-02).
- **Trazabilidad:** RF-029, RNF-030, CA-015.

## 3. Relaciones y cardinalidades

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
| R12 | Cita — Auditoría (operación) | N : 0..N | La auditoría referencia la operación y su contexto (RF-026); no es obligatoria por cita en todo estado |

**Nota sobre R12:** la auditoría se organiza por *operación*, no como atributo obligatorio de la cita; las operaciones críticas de una cita siempre dejan registro (CA-006), pero también se auditan operaciones sin cita (p. ej. restablecimiento de contraseña).

## 4. Reglas de negocio integrales del modelo

| RN | Expresión en el modelo |
|---|---|
| RN-01 | Cita con 4 componentes obligatorios (E7) |
| RN-02/RN-03 | Disponibilidad del profesional verificada; exclusión de solapes entre citas activas (E7) |
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

## 6. Ambigüedades y decisiones que requieren aprobación humana

| # | Ambigüedad / decisión | Propuesta del agente | Impacto |
|---|---|---|---|
| **A-01** | Validación de RN-16: ¿la cita debe guardar referencia a la asociación o solo (profesional, servicio) validados al crear/reprogramar? | Validar al crear/reprogramar y persistir solo (profesional, servicio) en la cita (la asociación puede desactivarse sin romper el histórico) | Integridad (Pasos 04/08) |
| **A-02** | ¿Almacenar "fecha" de la cita además de inicio/fin (RF-015 menciona fecha)? | No duplicar: derivar la fecha de presentación a partir del instante de inicio en America/La_Paz (RNF-028, CA-014) | Atributos de E7, CA-014 |
| **A-03** | Alcance de la exclusión de solapes (RN-03): ¿qué estados "reservan tiempo"? | Confirmada y En atención; Atendida/Cancelada/No asistida no bloquean (RN-06, coherente con V-01) | Regla RN-03, integridad |
| **A-04** | Notificación: instantánea vs referencia a la cita | Instantánea de los datos en el momento del evento (RF-024) | Atributos de E10 |
| **A-05** | Excepción de disponibilidad: ¿fecha completa o rango con horas? | Soportar ambos: fecha con inicio/fin opcionales (RF-008: ausencias, feriados y bloqueos de horarios) | Atributos de E6 |

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
- Cualquier SQL o definición de tipos de motor (Paso 04 en adelante).

**Estado del paso:** completado. **HUMAN_STATUS: PENDING** — presentado para revisión y aprobación humana del modelo conceptual antes del Paso 03 (diagrama E-R).
