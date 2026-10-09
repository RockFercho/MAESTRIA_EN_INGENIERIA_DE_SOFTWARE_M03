## APROBACIÓN HUMANA — PASO 01: REQUISITOS DE DATOS

Como responsable del proyecto, apruebo las cuatro observaciones OD-01, OD-02, OD-03 y OD-04 identificadas durante la revisión de consistencia del Paso 01 del workflow `02_database_workflow`.

### OD-01 — APROBADA (opción B)
Definir tres parámetros independientes de anticipación mínima para:
- Reservar citas.
- Reprogramar citas.
- Cancelar citas.

Los valores deben ser configurables por un administrador. No asumir valores definitivos sin aprobación humana. Actualizar los requisitos, reglas de negocio y criterios de aceptación afectados.

### OD-02 — APROBADA CON MODIFICACIÓN
Implementar conceptualmente el restablecimiento de contraseñas mediante un administrador autorizado, bajo las siguientes condiciones:
- Generación de una contraseña temporal segura y de un solo uso.
- Caducidad configurable.
- Almacenamiento exclusivamente mediante hash seguro.
- Cambio obligatorio al iniciar sesión.
- Entrega mediante un canal seguro definido antes de la implementación.
- Registro de auditoría de la operación.
- Prohibición de visualizar o recuperar contraseñas existentes.

No implementar todavía este mecanismo ni seleccionar tecnologías.

### OD-03 — APROBADA (opción B)
Eliminar del modelo de datos el atributo de estado de lectura de las notificaciones.

Mantener únicamente los atributos necesarios para cumplir los requisitos aprobados de generación y consulta de notificaciones.

### OD-04 — APROBADA (opción C)
Formalizar una nueva regla de negocio que establezca que toda cita debe corresponder a una asociación profesional-servicio válida y activa.

La regla debe aplicarse al momento de crear y reprogramar una cita, respetando las políticas de integridad e historial del sistema.

### INSTRUCCIONES DE EJECUCIÓN

1. Registrar estas cuatro decisiones humanas con sus respectivas justificaciones y referencias a los requisitos afectados.
2. Actualizar de manera consistente los documentos RF, RNF, reglas de negocio, criterios de aceptación y `proyecto/05_base_datos/01_requisitos_datos/requisitos_datos.md`, únicamente donde corresponda.
3. Mantener la trazabilidad de las decisiones y preservar la evidencia de los requisitos iniciales.
4. Ejecutar una nueva revisión de consistencia del Paso 01.
5. Informar los archivos modificados, las decisiones registradas y cualquier inconsistencia pendiente.

No generar SQL, no ejecutar migraciones, no seleccionar todavía el motor de base de datos y no avanzar al Paso 02 sin una nueva aprobación humana.

El objetivo es dejar el Paso 01 completamente validado y documentado antes de continuar.