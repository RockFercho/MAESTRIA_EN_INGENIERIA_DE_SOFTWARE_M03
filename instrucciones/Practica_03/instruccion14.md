## APROBACIÓN HUMANA — PASO 05 Y CONTINUIDAD DEL WORKFLOW

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

Como responsable del proyecto, APRUEBO el Paso 05 — Normalización y las decisiones siguientes:

**D-05a — APROBADA:** conservar `duracion_efectiva_min` en T7, documentando su redundancia derivada justificada, las dependencias funcionales y los mecanismos de consistencia transaccional.

**D-05b — APROBADA:** impedir duplicados exactos en T6 conforme a la identidad E2. Aplicar validación en la lógica de negocio y diferir la restricción declarativa al paso correspondiente, según el motor seleccionado. No prohibir solapamientos legítimos.

**D-05c — APROBADA:** preservar todos los eventos legítimos de T8, sin restricciones UNIQUE sobre valores de negocio. Utilizar identidad propia, correlación con auditoría e idempotencia para evitar duplicaciones técnicas.

### Instrucciones de ejecución

1. Registrar estas decisiones y aprobar formalmente el Paso 05.
2. Actualizar el estado del workflow con la evidencia correspondiente.
3. Continuar con los pasos siguientes del workflow `02_database_workflow.md`, respetando estrictamente sus dependencias.
4. Agrupar en una sola entrega los resultados de los pasos que no requieran una decisión humana nueva.
5. Resolver autónomamente los detalles técnicos que ya estén determinados por RF, RNF, RN, CA, ADR-001 y decisiones humanas previas.
6. No solicitar aprobación por cada detalle menor, verificación rutinaria o restricción ya derivada de decisiones aprobadas.
7. Presentar las decisiones realmente nuevas en una sola tabla consolidada, indicando recomendación e impacto.
8. No interpretar esta autorización como aprobación automática del motor de base de datos, SQL, migraciones, tecnologías o cambios de arquitectura.
9. Si un paso requiere aprobación humana explícita según el workflow, detenerse en ese punto y presentar conjuntamente los resultados y decisiones pendientes.
10. Mantener todos los documentos y evidencias organizados para elaborar posteriormente el informe académico.

Prioridad: completar el trabajo con rigor técnico, evitando revisiones repetitivas y solicitudes de aprobación innecesarias.

No generar código ni ejecutar infraestructura antes de las autorizaciones correspondientes.

**HUMAN_STATUS: APPROVED_STEP_05 — CONTINUE_UNTIL_NEXT_REQUIRED_HUMAN_CHECKPOINT.**