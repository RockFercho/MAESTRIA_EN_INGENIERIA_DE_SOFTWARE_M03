## APROBACIÓN HUMANA — PASO 03: DIAGRAMA ENTIDAD–RELACIÓN

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

Como responsable del proyecto, APRUEBO las cinco correcciones ER-01 a ER-05 identificadas durante la revisión del Paso 03 del workflow `02_database_workflow`.

Autorizo la actualización documental conforme a las siguientes decisiones:

### ER-01 — APROBADA
Formalizar las relaciones entre Usuario e HistorialCambio, AuditoriaOperacion y ParametroOperativo.

- Establecer cardinalidades y obligatoriedad coherentes con los requisitos.
- Identificar al usuario responsable de cada operación.
- No agregar funcionalidades ajenas al alcance.

### ER-02 — APROBADA CON PRECISIONES
Revisar el modelo de ClaveIdempotencia para garantizar trazabilidad y reintentos seguros.

- Asociar la clave con la identidad del solicitante, el tipo de operación y la solicitud original.
- Definir conceptualmente el mecanismo para reconocer solicitudes equivalentes.
- Una clave reutilizada con datos diferentes debe producir un rechazo por conflicto.
- Los reintentos válidos deben recuperar el resultado previamente confirmado sin duplicar operaciones.
- Mantener la consistencia con RNF-012 y CA-007.
- No seleccionar todavía mecanismos específicos del motor de base de datos.

### ER-03 — APROBADA
Formalizar la relación entre Cita y EventoOutbox.

- Una cita puede originar múltiples eventos.
- Un evento puede estar relacionado con cero o una cita.
- Mantener trazabilidad mediante identificadores de correlación.
- Preservar el desacoplamiento de notificaciones y la integridad transaccional.
- Verificar que la cardinalidad Mermaid represente correctamente estas condiciones.

### ER-04 — APROBADA EXPRESAMENTE
Modificar la cardinalidad R12 del modelo conceptual aprobado.

- Una cita puede estar asociada a múltiples operaciones de auditoría.
- Una operación de auditoría puede corresponder a cero o una cita.
- Permitir operaciones independientes de citas, como el restablecimiento de contraseñas.
- Incorporar una referencia opcional a Cita en AuditoriaOperacion si resulta coherente con el modelo.
- Mantener la auditoría histórica y la trazabilidad exigidas por RF-026 y RNF-013.
- Actualizar la cardinalidad tanto en el modelo conceptual como en el diagrama E-R.

### ER-05 — APROBADA
Mantener la clave compuesta de AsociacionServicio:

(profesional_id, servicio_id)

- Permitir desactivación y reactivación sin eliminación física.
- Preservar las citas históricas.
- Validar la asociación activa al crear o reprogramar citas, conforme a RN-16.
- No incorporar nuevas entidades para historiales de activación.
- Mantener las decisiones A-01 a A-05 previamente aprobadas.

### INSTRUCCIONES OBLIGATORIAS

1. Registrar formalmente las decisiones ER-01 a ER-05 en `proyecto/04_decisiones/`, incluyendo justificación y trazabilidad.
2. Preservar evidencia de los documentos anteriores a la modificación.
3. Actualizar `modelo_conceptual.md` y `diagrama_er.md` únicamente donde corresponda.
4. Actualizar la numeración y descripción de las relaciones nuevas o modificadas, sin perder la trazabilidad histórica de R1 a R12.
5. Revisar cuidadosamente la orientación de todas las cardinalidades Mermaid.
6. Mantener coherencia con RF, RNF, RN, CA y ADR-001.
7. Conservar las 14 entidades existentes, salvo que detectes una contradicción que requiera nueva aprobación humana.
8. No modificar requisitos aprobados sin autorización.
9. No seleccionar todavía el motor de base de datos.
10. No generar SQL, migraciones ni código.
11. No instalar herramientas ni desplegar infraestructura.
12. Ejecutar una revisión final de consistencia y reportar los archivos modificados, las relaciones definitivas, las verificaciones realizadas y los pendientes.
13. Actualizar el estado del workflow únicamente según los resultados efectivamente verificados.

IMPORTANTE: Al finalizar, DETENTE.

No avances al Paso 04 (Modelo lógico).

Mantén HUMAN_STATUS: PENDING hasta recibir mi aprobación final del Paso 03.