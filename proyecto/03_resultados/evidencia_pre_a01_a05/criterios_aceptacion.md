
# Criterios de Aceptación
## Sistema Web de Gestión de Citas y Atención Virtual

### CA-001. Registro de usuarios
Relacionado: RF-001

- El sistema permite registrar un usuario con los datos obligatorios válidos.
- No permite registrar dos usuarios con el mismo correo electrónico.
- Rechaza solicitudes con campos obligatorios ausentes.
- Almacena las contraseñas mediante un hash seguro.
- Las contraseñas aceptadas tienen una longitud mínima de 12 caracteres.

### CA-002. Gestión de disponibilidad
Relacionados: RF-007, RF-008, RF-009, RF-010, RF-011, RF-006

- La disponibilidad se calcula según el horario configurado del profesional.
- No se ofrecen intervalos afectados por ausencias o bloqueos.
- Se considera la duración completa del servicio solicitado.
- Cuando existe una duración específica para la combinación profesional y servicio, se utiliza sobre la duración general del servicio (duración efectiva).
- No se ofrecen intervalos ocupados por citas vigentes.

### CA-003. Confirmación de reservas
Relacionados: RF-012, RF-013, RF-014, RF-015

- Un usuario autenticado puede solicitar un horario disponible.
- La reserva en línea exige que el solicitante esté autenticado.
- Se rechaza la reserva cuando el profesional no tiene una asociación activa con el servicio solicitado.
- El sistema verifica nuevamente la disponibilidad antes de confirmar.
- Una reserva válida recibe un identificador único.
- Dos solicitudes concurrentes incompatibles no pueden confirmar el mismo intervalo.
- Cuando no existe disponibilidad, se rechaza la solicitud sin crear una reserva confirmada.

### CA-004. Reprogramación de citas
Relacionados: RF-017, RF-019, RF-025, RN-12, RN-13, RN-14, RN-16

- Solo se pueden reprogramar citas en estado Confirmada dentro del plazo mínimo de anticipación (valor inicial para reprogramar: 2 horas).
- Los parámetros de anticipación mínima son independientes por operación (reservar, reprogramar, cancelar) y configurables por el administrador.
- El solicitante solo reprograma sus propias citas, el profesional sus citas asignadas y el administrador las de la institución.
- Los cambios fuera del plazo mínimo realizados por profesionales o administradores exigen una justificación obligatoria.
- El nuevo intervalo debe encontrarse disponible y mantener una asociación profesional-servicio válida y activa.
- Una reprogramación exitosa conserva la identidad de la cita, mantiene el estado Confirmada y queda registrada en el historial.
- Si la operación falla, la reserva original permanece sin cambios.

### CA-005. Cancelación de citas
Relacionados: RF-018, RF-019, RN-13, RN-14

- Solo se pueden cancelar citas en estado Confirmada dentro del plazo mínimo de anticipación (valor inicial para cancelar: 2 horas).
- Los cambios fuera del plazo mínimo realizados por profesionales o administradores exigen una justificación obligatoria.
- Una cita cancelada deja de bloquear la disponibilidad.
- Se registra la fecha y el responsable de la cancelación.
- Una cita en estado distinto de Confirmada, o fuera del plazo mínimo sin excepción justificada, no puede cancelarse.

### CA-006. Seguimiento y auditoría
Relacionados: RF-015, RF-020, RF-021, RF-022, RF-026, RN-08

- Toda cita nace en estado Confirmada.
- Las transiciones permitidas son: Confirmada → En atención; En atención → Atendida; Confirmada → Cancelada; Confirmada → No asistida.
- Las transiciones no previstas son rechazadas por el sistema.
- Solo el administrador y los profesionales autorizados actualizan estados de cita.
- Cada cambio conserva el estado anterior y el nuevo estado.
- La reprogramación no altera el estado (permanece Confirmada) y queda registrada en el historial.
- Las operaciones críticas registran el usuario responsable.
- Los registros históricos permanecen disponibles para auditoría.

### CA-007. Integridad bajo concurrencia
Relacionados: RNF-010, RNF-011, RNF-012

- Se ejecutan pruebas con solicitudes simultáneas sobre un mismo horario.
- No se producen reservas confirmadas incompatibles.
- Los reintentos de una misma operación no crean reservas duplicadas.
- Ante errores transaccionales, los datos permanecen consistentes.

### CA-008. Rendimiento
Relacionados: RNF-006, RNF-007, RNF-008, RNF-009, `perfil_carga.md`

- El conjunto de datos de prueba contiene 1.000 usuarios registrados, 20 profesionales, 15 servicios y 10.000 citas registradas.
- Se ejecutan pruebas con 100 usuarios virtuales concurrentes, con 2 minutos de calentamiento y 10 minutos de ejecución.
- La mezcla de operaciones es: 60 % consultas de disponibilidad, 20 % consultas de citas, 15 % confirmaciones de reservas y 5 % reprogramaciones y cancelaciones.
- El p95 de consultas de disponibilidad es inferior a 800 ms.
- El p95 de confirmación de reservas es inferior a 1200 ms.
- Se verifican además los errores y la consistencia de las reservas.
- Los resultados incluyen métricas, metodología y descripción del entorno de prueba.

### CA-009. Seguridad
Relacionados: RNF-001, RNF-002, RNF-003, RNF-004, RNF-005, RNF-029, RF-003, RF-004

- Las operaciones protegidas rechazan solicitudes sin autorización.
- Las operaciones de reprogramación y cancelación se rechazan cuando el rol no está autorizado.
- Las cuentas de profesionales son creadas y habilitadas por administradores.
- Las contraseñas no se almacenan en texto plano.
- Las entradas inválidas son rechazadas por el servidor.
- Los secretos no se encuentran incluidos en el repositorio.
- Las comunicaciones sensibles utilizan conexiones cifradas en producción.
- El inicio de sesión limita los intentos y muestra mensajes de error genéricos.

### CA-010. Compatibilidad y despliegue
Relacionados: RNF-018, RNF-021, RNF-023, RNF-024

- Las funcionalidades principales se utilizan desde dispositivos móviles y computadoras.
- Los controles principales permiten navegación mediante teclado.
- La aplicación puede ejecutarse en Linux.
- La configuración se mantiene separada del código fuente.
- Las fechas y horas visibles en la interfaz se muestran en la zona horaria institucional.

### CA-011. Landing page
Relacionados: RF-027, RNF-018, RNF-021

- La landing page forma parte del mismo sistema y presenta información institucional.
- Muestra información real procedente del backend, como los servicios disponibles almacenados en la base de datos.
- Se adapta a pantallas móviles, tabletas y computadoras.
- Permite navegar sus controles principales mediante teclado.

### CA-012. Notificaciones internas
Relacionados: RF-024, RF-028, RNF-017

- Al confirmar, reprogramar o cancelar una cita se genera una notificación interna con el evento y los datos actualizados de la reserva.
- El usuario autenticado puede consultar sus notificaciones internas.
- Toda modificación autorizada de una cita genera una notificación interna al solicitante.
- Un fallo en la generación de una notificación no invalida ni elimina una reserva correctamente confirmada (verificable provocando el fallo de generación durante una prueba).
- La reserva permanece confirmada y consistente aunque la notificación no pueda generarse.

### CA-013. Disponibilidad y respaldos
Relacionados: RNF-014, RNF-015, RNF-016

- Existe registro periódico de la supervisión de las funciones esenciales, incluidos los períodos de indisponibilidad.
- Los mantenimientos excluidos del 99,5 % están previamente comunicados y documentados.
- El respaldo de datos es diario y conserva al menos 7 días de copias.
- Se realiza una prueba de restauración antes de producción y cada 3 meses, en un entorno separado.
- Cada restauración deja registro de resultados y verifica la integridad de los datos.

### CA-014. Fechas y zona horaria
Relacionados: RNF-028, RN-15

- Los instantes de inicio y fin de las citas y las marcas temporales de auditoría se almacenan en UTC.
- Los horarios recurrentes y sus excepciones se interpretan en America/La_Paz.
- La interfaz muestra las fechas y horas en America/La_Paz.

### CA-015. Política de contraseñas y acceso
Relacionados: RF-029, RNF-002, RNF-029, RNF-030

- Las contraseñas admiten una longitud mínima de 12 caracteres y frases de contraseña, sin exigir reglas arbitrarias de composición.
- Se rechazan contraseñas comunes o comprometidas cuando el mecanismo está disponible.
- El inicio de sesión limita los intentos y muestra mensajes de error genéricos.
- El administrador puede iniciar un restablecimiento seguro de contraseña sin acceder a la contraseña original.
- El restablecimiento genera una contraseña temporal segura de un solo uso, con caducidad configurable, almacenada exclusivamente mediante hash seguro.
- El cambio de contraseña es obligatorio al iniciar sesión con la contraseña temporal.
- La operación de restablecimiento queda registrada en auditoría.
- El sistema no permite visualizar ni recuperar contraseñas existentes.
- La v1 no incluye recuperación automática de contraseñas mediante correo electrónico.
