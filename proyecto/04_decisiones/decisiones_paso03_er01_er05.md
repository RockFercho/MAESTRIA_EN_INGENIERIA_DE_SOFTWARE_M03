# Decisiones humanas — Paso 03 (Diagrama E-R), observaciones ER-01 a ER-05

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Fecha:** 8 de octubre de 2026
**Origen:** revisión humana del Paso 03 del workflow `02_database_workflow` sobre `proyecto/05_base_datos/02_modelo_conceptual/diagrama_er.md` y `modelo_conceptual.md`.
**Estado:** 5 de 5 observaciones aprobadas (ER-02 con precisiones).
**Evidencia previa:** versiones anteriores a los cambios preservadas en `proyecto/03_resultados/evidencia_pre_er01_05/`.
**Alcance de los cambios:** solo `modelo_conceptual.md` y `diagrama_er.md`. Requisitos (RF/RNF/RN/CA) intactos. **14 entidades conservadas.** Sin SQL, sin código, sin motor de datos.

---

## ER-01 — APROBADA — Relaciones de Usuario con HistorialCambio, AuditoriaOperacion y ParametroOperativo

**Decisión:** formalizar tres relaciones (nuevas R13, R14, R15) con cardinalidades y obligatoriedad coherentes; identificar al usuario responsable de cada operación; sin funcionalidades ajenas al alcance.
**Modelo aplicado:**
- **R13** Usuario → Historial de cambios: 1 : 0..N; exactamente **1 usuario responsable NO NULO** por registro.
- **R14** Usuario → Auditoría de operaciones: 1 : 0..N; responsable **NO NULO** por operación.
- **R15** Usuario → Parámetro operativo: 1 : 0..N; modificador **NO NULO**.
**Justificación:** RF-022 exige usuario responsable en el historial; RF-026/RNF-013 exigen usuario, fecha y resultado en la auditoría; RF-025 exige trazabilidad del modificador de parámetros. Los atributos `usuario_id` ya existían en §2 del modelo; se formaliza su relación (corrección de la observación §4 del propio diagrama).
**Trazabilidad:** RF-021, RF-022, RF-025, RF-026, RNF-013, RN-08, RN-10, CA-006.
**Documentos ajustados:** `modelo_conceptual.md` (§2 E8/E9/E11, §3), `diagrama_er.md` (atributos, relaciones, §3).

## ER-02 — APROBADA CON PRECISIONES — Clave de idempotencia

**Decisión:** asociar la clave con la identidad del solicitante, el tipo de operación y la solicitud original; definir conceptualmente el mecanismo para reconocer solicitudes equivalentes; una clave **reutilizada con datos diferentes produce rechazo por conflicto**; los reintentos válidos recuperan el resultado previamente confirmado **sin duplicar operaciones**; consistencia con RNF-012 y CA-007; sin mecanismos específicos de motor.
**Modelo aplicado (E12):** atributos `clave` (única global), `usuario_sesion` (identidad del solicitante, NO NULO), `tipo_operacion`, `solicitud_original` (datos de la petición original), `resultado`, `creada_en`, `caduca_en`; restricciones: clave única; equivalencia = misma clave + misma solicitud (mismatch → conflicto); reintento válido → reutiliza resultado.
**Justificación:** RNF-012 (restricción única) + CA-007 (reutilización de resultado) exigían precisar semántica; el rechazo por conflicto evita que un reintento con payload distinto devuelva una respuesta ajena.
**Trazabilidad:** RNF-012, CA-007, RN-09.
**Documentos ajustados:** `modelo_conceptual.md` (§2 E12), `diagrama_er.md` (atributos de E12, §3).
**Reserva:** el reconocimiento de "solicitud equivalente" es conceptual en este paso; la comparación concreta se define en el Paso 04 sin seleccionar motor.

## ER-03 — APROBADA — Trazabilidad EventoOutbox ↔ Cita

**Decisión:** formalizar la relación (nueva **R16**): una cita origin múltiples eventos; un evento se relaciona con **cero o una** cita; trazabilidad con identificadores de correlación; preservar desacoplamiento e integridad transaccional; verificar la orientación Mermaid.
**Modelo aplicado:** **R16** Cita → Evento outbox: 1 : 0..N con lado evento **0..1 cita** (`cita_id` opcional + `correlacion_id`); Mermaid `Cita |o--o{ EventoOutbox`.
**Justificación:** RNF-017 y RF-024 definen eventos derivados de citas; la opcionalidad evita imponer vínculo obligatorio a eventos futuros ajenos al alcance actual (los eventos del alcance siempre llevan cita). RN-11/A-01 intactos: el vínculo no altera el histórico.
**Trazabilidad:** RF-024, RNF-017, CA-012.
**Documentos ajustados:** `modelo_conceptual.md` (§2 E13, §3), `diagrama_er.md` (atributos de E13, relaciones).

## ER-04 — APROBADA EXPRESAMENTE — Modificación de la cardinalidad R12

**Decisión:** R12 pasa de `N : 0..N` a **1 : 0..N del lado Cita con 0..1 cita por operación de auditoría**; una auditoría referencia a lo sumo una cita (`cita_id` opcional); se permiten operaciones independientes de citas (restablecimiento de contraseñas); se actualiza en modelo conceptual y diagrama.
**Modelo aplicado:** fila R12 actualizada (con mención "modificada por ER-04, antes N : 0..N"); Mermaid `Cita |o--o{ AuditoriaOperacion`; atributo `cita_id` opcional en E9.
**Justificación:** una fila de auditoría corresponde a **una operación** que toca a lo sumo una cita (reserva/reprogramación/cancelación/cambio de estado) o ninguna (restablecimiento — E14 referencia de auditoría). Precisa sin contradecir RF-026/RNF-013/RN-11. Es la única modificación a la cardinalidad del modelo conceptual aprobado en el Paso 02, autorizada expresamente aquí.
**Trazabilidad:** RF-026, RNF-013, RF-029, CA-006, CA-015.
**Documentos ajustados:** `modelo_conceptual.md` (§2 E9, §3), `diagrama_er.md` (E9, relaciones, §2 leyenda, §3).

## ER-05 — APROBADA — Clave compuesta de AsociacionServicio

**Decisión:** mantener clave compuesta `(profesional_id, servicio_id)`; desactivación y reactivación sin eliminación física; citas históricas preservadas; RN-16 valida la asociación activa al crear/reprogramar; **sin** entidades nuevas de historial de activación; A-01…A-05 vigentes.
**Modelo aplicado:** sin cambios estructurales (el modelo ya cumplía); se añade nota explícita de compatibilidad en §2 E4 y §3.
**Justificación:** única fila por par elimina ambigüedad en RN-16; con A-01 la cita persiste (profesional, servicio) + duración efectiva sin FK a la asociación, por lo que desactivar/reactivar nunca toca citas históricas (RN-11). Un histórico de transiciones de la asociación carece de RF que lo exija → fuera de alcance.
**Trazabilidad:** RF-006, RN-04, RN-16, RN-11, CA-002, CA-003, A-01.
**Documentos ajustados:** `modelo_conceptual.md` (nota en §2 E4 y §5), `diagrama_er.md` (nota §3).

---

## Verificaciones de no contradicción

- **ADR-001:** todos los cambios son relaciones dentro de la única base de datos relacional del monolito modular; sin componentes nuevos ni distribuidos.
- **A-01…A-05:** ER-05/A-01 (sin FK a asociación en la cita) intacta; ER-03/A-04 (instantánea de notificaciones) intacta; ER-04 no afecta a A-03 (bloqueo por estados, independiente de la auditoría).
- **Requisitos:** sin altas ni modificaciones de RF/RNF/RN/CA (instrucción 8 cumplida).
- **Numeración:** R1…R12 conservadas (R12 modificada con su preexistencia documentada); R13…R16 nuevas y consecutivas; trazabilidad histórica íntegra.

## Pendientes no bloqueantes (se mantienen)

1. Valor inicial de anticipación mínima para reservar (OD-01) — aprobar antes de activar.
2. Canal seguro de entrega de contraseñas temporales (OD-02) — definir antes de implementar.

## Corrección técnica de sintaxis Mermaid — R12 y R16 (autorizada por el responsable)

- **Tipo:** ajuste técnico del Paso 03; no altera decisiones aprobadas ER-01…ER-05 ni A-01…A-05.
- **Cambio:** en `diagrama_er.md`, las líneas de relación pasan de `Cita |o--o{ …` a **`Cita o|--o{ AuditoriaOperacion : "R12 audita operacion"`** y **`Cita o|--o{ EventoOutbox : "R16 origina evento"`**; leyenda §2, tabla §3, notas y §5 actualizados (se unifica el uso de `o|` para cero o uno en el lado de Cita; corregida también la fila de "uno a muchos" de la leyenda: `}|` izq. / `|{` der.).
- **Verificación técnica:** la gramática oficial de Mermaid `erDiagram.jison` (v12.1) define `\|o` y `o\|` como tokens equivalentes `ZERO_OR_ONE` aceptados en cualquier lado; ambos grafos son sintácticamente válidos y semánticamente idénticos. Las 17 líneas de relación (R1…R16, con R5 duplicada) usan exclusivamente tokens válidos: `||`, `o|`, `o{`.
- **Cardinalidades confirmadas en `modelo_conceptual.md` (sin modificación):** Auditoría → Cita 0..1; Cita → Auditoría 0..N; Evento → Cita 0..1; Cita → Evento 0..N.
- **Sin cambios:** RF, RNF, RN, CA (verificados: 29/30/16/15); sin SQL, sin motor, sin nuevas entidades (14).
- **Evidencia previa:** `proyecto/03_resultados/evidencia_pre_correccion_mermaid/` (versiones anteriores de `diagrama_er.md` y `modelo_conceptual.md`).
- **Estado:** corrección aplicada; `step_03_final_approval` quedó en **PENDING** hasta la aprobación registrada en la sección siguiente.

## Aprobación final humana del Paso 03

- **Decisión:** APROBADA FORMALMENTE por el responsable del proyecto (8 de octubre de 2026).
- **Alcance de la aprobación:** Paso 03 — Diagrama entidad-relación completo: observaciones ER-01…ER-05 revisadas y aplicadas, corrección de sintaxis Mermaid R12/R16 (`|o` → `o|`) verificada, cardinalidades R1–R16 confirmadas.
- **Registro:** `step_03_final_approval: APPROVED` en `.agents/state/database-workflow.json`; estado global `HUMAN_STATUS: APPROVED_STEP_03 — WAITING_FOR_STEP_04_AUTHORIZATION`.
- **Conservar:** 14 entidades, relaciones R1–R16, decisiones previas OD-01…OD-04, A-01…A-05, ER-01…ER-05 y ADR-001.
- **Pendientes no bloqueantes vigentes:** (1) valor inicial de anticipación mínima para reservar (OD-01); (2) canal seguro de entrega de contraseñas temporales (OD-02).
- **Restricción:** el Paso 04 (modelo lógico) **no está autorizado**; sin SQL, migraciones, código, selección de motor ni infraestructura.
- **Evidencia previa a la aprobación:** `proyecto/03_resultados/evidencia_pre_aprobacion_paso03/`.
