# Decisiones humanas — Paso 02 (Modelo conceptual), observaciones A-01 a A-05

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Fecha:** 8 de octubre de 2026
**Origen:** revisión humana del `proyecto/05_base_datos/02_modelo_conceptual/modelo_conceptual.md` (§6).
**Estado:** 5 de 5 observaciones aprobadas.
**Evidencia previa:** documentos anteriores a estos ajustes preservados en `proyecto/03_resultados/evidencia_pre_a01_a05/`.

---

## A-01 — APROBADA — Asociación profesional-servicio

**Decisión:** la asociación debe estar activa y ser válida al crear o reprogramar una cita. Una desactivación posterior no invalida ni altera automáticamente las citas históricas. Conservar la trazabilidad de la asociación utilizada.
**Justificación:** RN-16 (OD-04) exigía la regla pero no el tratamiento del histórico; RN-11 prohíbe perder historial. Persistir en la cita el par (profesional, servicio) y la duración efectiva conserva la trazabilidad aun si la asociación se desactiva.
**Referencias:** RN-16, RF-012, RF-014, RF-017, RN-04, RN-11, CA-003, CA-004.
**Documentos ajustados:** `reglas_negocio.md` (RN-16), `RF.md` (ninguno nuevo; ya exigían asociación activa), `criterios_aceptacion.md` (CA-003), `modelo_conceptual.md` (E4, E7, §5.1).

## A-02 — APROBADA — Almacenamiento de fecha

**Decisión:** no duplicar la fecha cuando puede derivarse del instante de inicio almacenado en UTC; fecha e hora institucionales se interpretan en America/La_Paz. Aplicarlo en el modelo lógico y físico posteriores.
**Justificación:** RNF-028/CA-014 ya fijan UTC + zona institucional; duplicar fecha introduce inconsistencia potencial.
**Referencias:** RNF-028, RN-15, RF-015, CA-014.
**Documentos ajustados:** `modelo_conceptual.md` (E7, nota de atributos). Sin cambios en RF/RN/CA.

## A-03 — APROBADA — Estados que bloquean disponibilidad

**Decisión:** Confirmada y En atención bloquean el intervalo; Atendida, Cancelada y No asistida no representan reservas activas. Conservar registros históricos y verificar que las reglas de disponibilidad no entren en conflicto con las transiciones de estado.
**Justificación:** RN-03 usaba "citas activas" sin definir; RN-06 ya liberaba al cancelar; V-01 fija la máquina de estados. Definirlo elimina la ambigüedad verificable.
**Referencias:** RN-03, RN-06, RN-08, RF-011, CA-002, CA-003, CA-006.
**Documentos ajustados:** `reglas_negocio.md` (RN-03), `RF.md` (RF-011), `modelo_conceptual.md` (E7, §4).

## A-04 — APROBADA — Notificaciones

**Decisión:** cada notificación conserva una instantánea de los datos relevantes del evento que la originó; modificaciones posteriores de la cita no alteran su contenido histórico. Mantener trazabilidad con la cita y el evento.
**Justificación:** RF-024 exige informar los datos actualizados del evento; sin instantánea, lecturas tardías mostrarían estados distintos a los notificados.
**Referencias:** RF-024, RF-028, RNF-017, CA-012.
**Documentos ajustados:** `RF.md` (RF-024, precisión de instantánea), `modelo_conceptual.md` (E10).

## A-05 — APROBADA — Excepciones de disponibilidad

**Decisión:** el modelo debe admitir excepciones de jornada completa y de rango horario específico, sin ambigüedad.
**Justificación:** RF-008 contempla ausencias, feriados y bloqueos de horarios; el modelo debe representar ambos alcances.
**Referencias:** RF-007, RF-008, RN-05, CA-002.
**Documentos ajustados:** `modelo_conceptual.md` (E6, ya contemplaba fecha con inicio/fin opcionales). Sin cambios en RF/RN/CA.

---

## Verificaciones de no contradicción

- **ADR-001:** las cinco decisiones son de modelado dentro del monolito modular con una única BD relacional; ninguna introduce componentes distribuidos o nuevos servicios.
- **Decisiones previas:** A-01 coherente con OD-04/RN-16; A-03 coherente con V-01 (máquina de estados) y RN-06; A-04 coherente con OD-03 (sin estado de lectura) y CA-012; A-02 coherente con V-09/RNF-028; A-05 coherente con RF-008 original.
- **Identificadores:** sin altas ni bajas de RF/RNF/RN/CA en esta ronda salvo ajustes de texto; sin renumeraciones.

## Pendientes no bloqueantes (se mantienen)

1. Valor inicial de anticipación mínima para reservar (OD-01) — aprobar antes de activar.
2. Canal seguro de entrega de contraseñas temporales (OD-02) — definir antes de implementar.

## Aprobación final del Paso 02

- **Decisión:** ACEPTADA.
- **Justificación:** el responsable autorizó continuar con el workflow tras la revisión de A-01…A-05 ("Continue if you have next steps", 8 de octubre de 2026), dando por aprobado el modelo conceptual con los ajustes aplicados.
- **Efecto:** se habilita el Paso 03 (diagrama entidad-relación) en `proyecto/05_base_datos/02_modelo_conceptual/diagrama_er.md`.
