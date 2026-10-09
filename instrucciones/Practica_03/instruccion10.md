## DECISIÓN HUMANA — OBSERVACIONES L-01 A L-04 DEL PASO 04

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

He revisado el resultado del modelo lógico y establezco las siguientes decisiones:

**L-01 — APROBADA.** Permitir múltiples intervalos de atención por profesional y día de la semana. Impedir intervalos inválidos o superpuestos para el mismo profesional. Documentar qué restricciones son declarativas y cuáles requieren validación transaccional.

**L-02 — APROBADA CON PRECISIÓN.** Mantener la auditoría obligatoria del restablecimiento de contraseñas. Antes de introducir una relación R17, verificar si las relaciones y referencias ya aprobadas permiten cumplir el requisito sin duplicar información. Si R17 resulta necesaria, presentar la modificación propuesta al modelo conceptual y al diagrama ER para autorización humana específica. No modificar unilateralmente los documentos aprobados del Paso 03.

**L-03 — DIFERIDA.** Mantener la caducidad de claves de idempotencia como decisión técnica pendiente para el Paso 12. No establecer un TTL arbitrario. Documentar que la expiración no debe comprometer la prevención de reservas duplicadas.

**L-04 — APROBADA.** Utilizar un catálogo lógico controlado y extensible de tipos de operación. Definir los valores iniciales exclusivamente a partir de operaciones respaldadas por los requisitos aprobados. No introducir funcionalidades nuevas.

### Instrucciones

1. Revisar `AGENTS.md`, el workflow y los documentos aprobados.
2. Aplicar al modelo lógico únicamente las decisiones autorizadas.
3. Mantener la trazabilidad RF/RNF/RN/CA y R1–R16.
4. Verificar integridad referencial, nulabilidad, unicidad y coherencia entre tablas.
5. No alterar las 14 entidades aprobadas sin autorización.
6. Registrar las decisiones L-01 a L-04 y sus justificaciones.
7. Informar cualquier contradicción o cambio que requiera aprobación adicional.
8. Corregir el estado del workflow si el Paso 04 figura como completado sin aprobación humana final: debe permanecer elaborado, pendiente de revisión y bloqueado para el Paso 05.

### Restricciones

No generar SQL, migraciones ni código. No seleccionar motor de base de datos. No avanzar al Paso 05. No modificar requisitos ni decisiones aprobadas sin autorización.

### Entrega

Presentar los cambios realizados, la verificación de consistencia, los pendientes y el estado actualizado del workflow.

**HUMAN_STATUS: PENDING_STEP_04_APPROVAL.**

DETENERSE y esperar aprobación humana final.