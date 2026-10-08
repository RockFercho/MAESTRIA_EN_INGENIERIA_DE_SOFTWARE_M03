# Validación humana de requisitos — Etapa 1

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual  
**Módulo:** III — Maestría en Ingeniería de Software  
**Fecha:** 8 de octubre de 2026  
**Estado:** Validación humana completada  
**Observaciones revisadas:** 12 de 12

## 1. Objetivo

Documentar las decisiones adoptadas durante la revisión humana de las observaciones identificadas mediante el análisis de requisitos asistido por OpenCode.

El análisis automatizado constituye una propuesta técnica. La aceptación, modificación o rechazo de sus recomendaciones corresponde al responsable del proyecto.

## 2. Decisiones adoptadas

### V-01. Estados y transiciones de las citas

**Decisión: Aceptada.**

Se establece el estado inicial **Confirmada**.

Transiciones permitidas:

- Confirmada → En atención
- En atención → Atendida
- Confirmada → Cancelada
- Confirmada → No asistida

Los estados Atendida, Cancelada y No asistida son finales.

La reprogramación modifica la fecha u hora de la cita, mantiene el estado Confirmada y registra el cambio en el historial.

### V-02. Elegibilidad para reprogramar o cancelar

**Decisión: Aceptada.**

Solo podrán reprogramarse o cancelarse citas en estado Confirmada.

Los solicitantes deberán cumplir el plazo mínimo de anticipación configurado por el administrador.

Se propone una configuración inicial de **2 horas**, modificable mediante parámetros del sistema.

Las citas en otros estados no podrán reprogramarse ni cancelarse.

### V-03. Reservas en línea

**Decisión: Aceptada.**

La reserva de citas mediante la aplicación web formará parte de la primera versión.

Los solicitantes deberán autenticarse antes de confirmar una reserva.

Se corregirá la descripción del proyecto para eliminar la referencia contradictoria a una incorporación posterior de esta funcionalidad.

### V-04. Landing page funcional

**Decisión: Aceptada parcialmente.**

La landing page será parte del mismo sistema, no una aplicación independiente.

Deberá ser responsive, presentar información institucional y permitir consultar información real procedente del backend y la base de datos, como los servicios disponibles.

Se documentará mediante requisitos y criterios de aceptación específicos, diferenciando su función de presentación de las reglas de negocio de las reservas.

### V-05. Notificaciones

**Decisión: Aceptada.**

La primera versión utilizará notificaciones internas para informar sobre confirmaciones, reprogramaciones y cancelaciones.

Los usuarios autenticados podrán consultar sus notificaciones.

La generación de notificaciones estará desacoplada de la confirmación de reservas. Un fallo en la notificación no deberá invalidar una reserva correctamente confirmada.

El envío automático por correo electrónico quedará fuera del alcance inicial.

### V-06. Roles, autenticación y autorización

**Decisión: Aceptada.**

Se establecen tres roles:

- **Administrador:** gestiona usuarios, profesionales, servicios, horarios y citas institucionales.
- **Profesional:** accede a su agenda y gestiona las citas que tiene asignadas.
- **Solicitante:** se registra por cuenta propia y gestiona sus citas dentro de los permisos establecidos.

Las cuentas de profesionales serán creadas y habilitadas por administradores.

La autorización deberá verificarse en el servidor.

### V-07. Duración de los servicios

**Decisión: Aceptada.**

Cada servicio tendrá una duración general configurable por el administrador.

Podrá definirse una duración específica para una combinación de profesional y servicio. Cuando exista, tendrá prioridad sobre la duración general.

El cálculo de disponibilidad utilizará la duración efectiva.

Las citas confirmadas conservarán la duración con la que fueron reservadas, aunque la configuración cambie posteriormente.

### V-08. Perfil de carga y rendimiento

**Decisión: Aceptada.**

Se adopta el siguiente conjunto inicial de datos de prueba:

- 1.000 usuarios registrados.
- 20 profesionales.
- 15 servicios.
- 10.000 citas registradas.

La prueba nominal contemplará 100 usuarios virtuales concurrentes, con 2 minutos de calentamiento y 10 minutos de ejecución.

Distribución propuesta de operaciones:

- 60 % consultas de disponibilidad.
- 20 % consultas de citas.
- 15 % confirmaciones de reservas.
- 5 % reprogramaciones y cancelaciones.

Se verificarán los objetivos de p95 establecidos en RNF-006 y RNF-007, además de errores y consistencia de las reservas.

Se documentarán entorno, configuración, datos, metodología y resultados. Los objetivos no se considerarán cumplidos sin mediciones.

### V-09. Fechas y zonas horarias

**Decisión: Aceptada.**

Se utilizará inicialmente la zona horaria **America/La_Paz**.

Los instantes de inicio y fin de las citas y las marcas temporales de auditoría se almacenarán en UTC.

Los horarios recurrentes y sus excepciones se interpretarán según la zona horaria de la institución.

La interfaz mostrará las fechas y horas correspondientes a dicha zona.

### V-10. Permisos para reprogramar y cancelar

**Decisión: Aceptada.**

- **Solicitante:** puede modificar sus propias citas, respetando el plazo mínimo.
- **Profesional:** puede modificar sus citas asignadas.
- **Administrador:** puede modificar las citas de la institución.

Profesionales y administradores podrán efectuar cambios fuera del plazo mínimo por razones operativas, siempre que la cita permanezca en estado Confirmada.

Estas excepciones requerirán una justificación obligatoria.

Toda modificación deberá verificar disponibilidad, registrarse en auditoría y generar una notificación interna para el solicitante.

### V-11. Política de contraseñas y recuperación

**Decisión: Aceptada.**

Las contraseñas tendrán una longitud mínima de 12 caracteres y admitirán frases de contraseña.

No se exigirán reglas arbitrarias de composición. Se procurará rechazar contraseñas comunes o comprometidas cuando sea viable.

Las contraseñas se almacenarán mediante hash adaptativo con sal.

El inicio de sesión incorporará limitación de intentos, mensajes de error genéricos y controles de autenticación y autorización en el servidor.

En la primera versión, el administrador podrá iniciar un restablecimiento seguro de contraseña, sin acceder a la contraseña original.

La recuperación automática mediante correo electrónico será una ampliación futura.

### V-12. Disponibilidad y recuperación de datos

**Decisión: Aceptada.**

Se mantiene un objetivo de disponibilidad mensual del **99,5 %**, excluyendo únicamente mantenimientos previamente comunicados y documentados.

Se establecerá supervisión periódica de las funciones esenciales del sistema, registrando resultados y períodos de indisponibilidad.

Política inicial de respaldos:

- Copia de seguridad diaria.
- Conservación mínima de 7 días.
- Prueba de restauración antes de producción y cada 3 meses.
- Registro de resultados de cada restauración.
- Verificación de integridad posterior a la restauración.

Las pruebas de restauración se realizarán en un entorno separado.

La disponibilidad mensual se considerará un objetivo hasta contar con mediciones reales que acrediten su cumplimiento.

## 3. Resultado de la validación

Las 12 observaciones fueron revisadas mediante decisiones humanas explícitas.

Se aceptaron 11 observaciones y se aceptó parcialmente 1 observación (V-04).

Las decisiones constituyen la referencia aprobada para actualizar los requisitos funcionales, requisitos no funcionales, reglas de negocio, criterios de aceptación y descripción del alcance.

## 4. Siguiente actividad

Actualizar los documentos del proyecto conservando trazabilidad entre:

1. Requisito o documento original.
2. Observación del análisis asistido por IA.
3. Decisión humana adoptada.
4. Modificación documental realizada.
5. Criterio de aceptación o mecanismo de verificación.

No se autoriza todavía la selección de tecnologías ni la generación de código de implementación.