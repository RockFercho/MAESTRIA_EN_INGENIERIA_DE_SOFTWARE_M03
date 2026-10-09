## APROBACIÓN HUMANA FINAL — PASO 04

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

Como responsable del proyecto, he revisado el resultado final de consistencia del Paso 04 — Modelo lógico.

**APRUEBO formalmente el Paso 04**, incluyendo las decisiones L-01, L-02, L-03 y L-04 y sus correcciones documentadas.

Establezco la siguiente precisión técnica:

La correlación entre RestablecimientoContrasena (T14) y AuditoriaOperacion (T9) deberá utilizar preferentemente el identificador del restablecimiento registrado en el atributo `contexto` de la auditoría. La coincidencia de usuario y fecha no debe considerarse el mecanismo principal de correlación.

Esta precisión no autoriza nuevas entidades, atributos ni relaciones conceptuales.

### Instrucciones

1. Registrar la aprobación humana final del Paso 04.
2. Actualizar `.agents/state/database-workflow.json` para reflejar el Paso 04 como aprobado y completado.
3. Conservar las 14 tablas y las relaciones R1–R16.
4. Mantener intactos los requisitos, decisiones arquitectónicas, documentos aprobados del Paso 03 y evidencias históricas.
5. Conservar OD-01, OD-02 y los detalles técnicos diferidos como pendientes documentados.
6. Continuar exclusivamente con el Paso 05 — Normalización, siguiendo `.agents/workflows/02_database_workflow.md`.
7. Aplicar la normalización correspondiente y justificar las dependencias funcionales, claves candidatas y formas normales.
8. Presentar cualquier anomalía de redundancia, inserción, actualización o eliminación que requiera una decisión humana.
9. Verificar la trazabilidad con RF, RNF, RN, CA y ADR-001.

### Restricciones

- No generar SQL ni migraciones.
- No seleccionar todavía el motor de base de datos.
- No generar código de aplicación.
- No instalar frameworks ni desplegar infraestructura.
- No modificar requisitos o decisiones humanas aprobadas sin autorización.
- No avanzar al Paso 06.

Al finalizar el Paso 05, presentar los documentos creados o modificados, las tablas analizadas, la forma normal alcanzada, las observaciones y el estado del workflow.

**HUMAN_STATUS: PENDING_STEP_05_APPROVAL.**

DETENERSE y esperar mi revisión y aprobación explícita.