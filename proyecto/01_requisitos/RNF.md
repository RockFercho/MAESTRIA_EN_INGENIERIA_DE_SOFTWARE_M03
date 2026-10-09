
# Requisitos No Funcionales
## Sistema Web de Gestión de Citas y Atención Virtual

### Seguridad

- RNF-001. Todas las comunicaciones que involucren autenticación o información de usuarios deberán realizarse mediante conexiones cifradas con TLS 1.2 o superior en producción.
- RNF-002. Las contraseñas deberán almacenarse mediante algoritmos de hash adaptativos con sal, adecuados para almacenamiento seguro de credenciales.
- RNF-003. Toda operación protegida deberá validar la identidad del usuario y sus permisos en el servidor, independientemente de las restricciones aplicadas en la interfaz.
- RNF-004. Las credenciales, claves y secretos de configuración no deberán incluirse en el código fuente ni publicarse en repositorios.
- RNF-005. Los datos recibidos desde clientes deberán validarse en el servidor antes de ser utilizados en operaciones de negocio o persistencia.

### Rendimiento

- RNF-006. El percentil 95 del tiempo de respuesta de las consultas de disponibilidad deberá ser inferior a 800 ms, medido en el servidor bajo la carga nominal definida en `perfil_carga.md`.
- RNF-007. El percentil 95 del tiempo de respuesta de las operaciones de confirmación de reservas deberá ser inferior a 1200 ms, sin incluir servicios externos de notificación.
- RNF-008. La solución deberá soportar inicialmente 100 usuarios concurrentes durante pruebas de carga nominal definidas en `perfil_carga.md`, manteniendo los objetivos de respuesta definidos.
- RNF-009. Las pruebas de rendimiento deberán documentar el entorno, la carga aplicada, el volumen de datos, la metodología y los resultados obtenidos, conforme al perfil de carga aprobado.

### Integridad y concurrencia

- RNF-010. Ante solicitudes concurrentes sobre un mismo intervalo de un profesional, el sistema deberá garantizar que no se confirmen reservas incompatibles.
- RNF-011. Las operaciones de reserva y reprogramación deberán mantener consistencia entre los datos de la cita y la disponibilidad del profesional, incluso ante fallos durante su ejecución.
- RNF-012. Los reintentos de una misma solicitud de confirmación deberán evitar la creación de reservas duplicadas.
- RNF-013. Las operaciones críticas deberán conservar trazabilidad suficiente para identificar el resultado y el usuario responsable.

### Disponibilidad y recuperación

- RNF-014. El sistema deberá tener como objetivo una disponibilidad mensual del 99,5 %, excluyendo únicamente ventanas de mantenimiento previamente comunicadas y documentadas. Se establecerá supervisión periódica de las funciones esenciales del sistema, registrando los resultados y los períodos de indisponibilidad. El objetivo se considerará cumplido únicamente cuando existan mediciones que lo acrediten.
- RNF-015. El sistema deberá contar con un procedimiento documentado de respaldo y restauración de los datos persistentes, con una política inicial de copia de seguridad diaria y conservación mínima de 7 días.
- RNF-016. El procedimiento de recuperación deberá verificarse mediante una prueba de restauración en un entorno separado no productivo antes del despliegue a producción y, posteriormente, cada 3 meses, registrando los resultados de cada restauración y verificando la integridad de los datos después de la restauración.
- RNF-017. Los fallos en la generación de notificaciones internas no deberán provocar la pérdida ni la invalidación de una reserva previamente confirmada. La generación de notificaciones deberá estar desacoplada de la confirmación de reservas y no depender de proveedores externos de mensajería.

### Usabilidad y compatibilidad

- RNF-018. La interfaz deberá adaptarse a pantallas móviles, tabletas y computadoras sin impedir la ejecución de las funcionalidades principales.
- RNF-019. Los formularios deberán identificar los campos obligatorios y mostrar mensajes comprensibles ante errores de validación.
- RNF-020. La interfaz deberá proporcionar confirmación visible del resultado de las operaciones de reserva, reprogramación y cancelación.
- RNF-021. Las funcionalidades principales deberán ser utilizables mediante teclado y contar con etiquetas accesibles para los controles interactivos.

### Mantenibilidad y portabilidad

- RNF-022. La solución deberá separar responsabilidades de presentación, lógica de negocio y persistencia de datos.
- RNF-023. La aplicación deberá poder ejecutarse en un entorno Linux compatible con las tecnologías seleccionadas.
- RNF-024. La solución deberá admitir despliegue mediante contenedores y configuración externa por entorno.
- RNF-025. Las funcionalidades críticas deberán contar con pruebas automatizadas que permitan detectar regresiones durante modificaciones posteriores.

### Observabilidad

- RNF-026. El sistema deberá registrar eventos de error y operaciones críticas con fecha, identificador de operación y contexto suficiente para diagnóstico, evitando registrar contraseñas o secretos.
- RNF-027. El sistema deberá permitir obtener métricas de latencia, errores y volumen de solicitudes para sus operaciones principales.

### Fechas y zonas horarias

- RNF-028. Los instantes de inicio y fin de las citas y las marcas temporales de auditoría se almacenarán en UTC. La interfaz y la interpretación de los horarios recurrentes y sus excepciones utilizarán la zona horaria institucional America/La_Paz.

### Autenticación y gestión de contraseñas

- RNF-029. Las contraseñas deberán tener una longitud mínima de 12 caracteres y admitir frases de contraseña, sin exigir reglas arbitrarias de composición, rechazando las contraseñas comunes o comprometidas cuando sea viable. El inicio de sesión incorporará limitación de intentos y mensajes de error genéricos.
- RNF-030. El restablecimiento administrativo de contraseñas deberá utilizar una contraseña temporal segura de un solo uso, con caducidad configurable, almacenada exclusivamente como hash seguro, obligatoria a cambiar en el primer inicio de sesión y entregada mediante un canal seguro definido previamente a la implementación, dejando registro de auditoría. El sistema no permitirá visualizar ni recuperar contraseñas existentes.
