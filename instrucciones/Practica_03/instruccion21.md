## AUTORIZACIÓN HUMANA — PREPARACIÓN DEL ENTORNO MYSQL PARA EL PASO 17

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

He revisado y ACEPTO el informe de preflight del Paso 17.

Confirmo que utilizaremos MySQL 8.0.46 con InnoDB, conforme a la decisión D-06-R1.

### Autorización

Autorizo preparar un entorno local de base de datos exclusivo para este proyecto, sin afectar bases de datos existentes.

1. Inspeccionar la configuración actual de MySQL y verificar que el nombre propuesto para la nueva base de datos no esté ocupado.
2. Proponer un nombre específico para la base de datos del proyecto.
3. Preparar las instrucciones necesarias para configurar de forma segura las credenciales locales, utilizando `.env` y manteniendo los secretos fuera del repositorio.
4. Identificar los privilegios mínimos que requiere la cuenta de migración para los scripts `0001` a `0006`.
5. Revisar la dependencia del script `0005` respecto a cuentas previamente creadas y presentar una solución compatible con MySQL 8.0.46.
6. Verificar que los scripts SQL estén listos para ejecutarse en el orden aprobado.
7. Preparar el procedimiento de respaldo y las verificaciones posteriores a la ejecución.

### Restricciones

- No modificar ni eliminar bases de datos existentes.
- No ejecutar todavía los scripts `0001` a `0006` ni `9990`.
- No mostrar ni registrar contraseñas.
- No instalar software adicional.
- No avanzar al Paso 18.
- No modificar los requisitos, el ADR ni las decisiones aprobadas.

### Entrega

Presenta exclusivamente:

- Nombre propuesto de la base de datos y comprobación de que está disponible.
- Configuración de credenciales pendiente.
- Privilegios requeridos.
- Problemas reales que impiden ejecutar los scripts.
- Procedimiento final para completar el Paso 17.

Evita generar nuevos informes extensos o repetir análisis ya aprobados.

Detente antes de cualquier modificación real de la base de datos.

**HUMAN_STATUS: APPROVED_STEP_17_ENVIRONMENT_PREPARATION_ONLY.**