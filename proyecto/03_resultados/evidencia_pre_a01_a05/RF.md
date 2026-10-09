
# Requisitos Funcionales
## Sistema Web de Gestión de Citas y Atención Virtual

### Gestión de usuarios y profesionales

- RF-001. El sistema deberá permitir el registro de usuarios solicitantes mediante nombre completo, correo electrónico y contraseña.
- RF-002. El sistema deberá permitir la autenticación de usuarios registrados y la finalización de sus sesiones.
- RF-003. El sistema deberá administrar los roles de solicitante, profesional y administrador, restringiendo las operaciones según los permisos asignados.
- RF-004. El administrador deberá poder registrar, consultar, modificar y desactivar profesionales, conservando el historial de sus citas. Las cuentas de los profesionales serán creadas y habilitadas por el administrador.
- RF-005. El administrador deberá poder registrar, consultar, modificar y desactivar servicios, especificando como mínimo nombre, descripción y duración de atención en minutos, la cual deberá ser configurable por el administrador.
- RF-006. El administrador deberá poder asociar uno o varios servicios a cada profesional habilitado para prestarlos, pudiendo definir para esa combinación una duración específica que tendrá prioridad sobre la duración general del servicio.

### Gestión de agendas y disponibilidad

- RF-007. El sistema deberá permitir configurar los horarios habituales de atención de cada profesional, especificando días de la semana, hora de inicio y hora de finalización.
- RF-008. El sistema deberá permitir registrar excepciones de disponibilidad por profesional, incluyendo ausencias, feriados y bloqueos de horarios.
- RF-009. El sistema deberá calcular los intervalos disponibles considerando el horario habitual, las excepciones, la duración efectiva del servicio y las citas existentes.
- RF-010. El sistema deberá permitir consultar la disponibilidad de un profesional por servicio y fecha, mostrando únicamente los intervalos que permitan completar la duración requerida.
- RF-011. El sistema deberá excluir de la disponibilidad los intervalos que se solapen total o parcialmente con citas que mantengan reservado el tiempo del profesional.

### Gestión de reservas

- RF-012. El sistema deberá permitir a un usuario autenticado solicitar una cita seleccionando servicio, profesional, fecha y horario disponible. El profesional seleccionado deberá tener una asociación activa con el servicio elegido.
- RF-013. Antes de confirmar una reserva, el sistema deberá verificar nuevamente la disponibilidad del profesional para todo el intervalo solicitado.
- RF-014. El sistema deberá rechazar una reserva cuando el intervalo solicitado se encuentre ocupado, fuera de los horarios permitidos o cuando el profesional no mantenga una asociación activa con el servicio, informando al usuario el motivo del rechazo.
- RF-015. Cuando una reserva sea confirmada, el sistema deberá asignarle un identificador único y registrar el solicitante, profesional, servicio, fecha, hora de inicio, hora de finalización y estado inicial Confirmada.
- RF-016. El sistema deberá permitir a un solicitante consultar sus citas registradas, incluyendo fecha, horario, profesional, servicio y estado.
- RF-017. El sistema deberá permitir reprogramar una cita elegible, verificando nuevamente la disponibilidad y que la asociación profesional-servicio continúe válida y activa antes de confirmar el nuevo horario. Se considera elegible una cita en estado Confirmada que cumple el plazo mínimo de anticipación configurado. La reprogramación mantendrá el estado Confirmada y registrará el cambio en el historial; no constituye una transición de estado.
- RF-018. El sistema deberá permitir cancelar una cita elegible, registrando la fecha de cancelación y liberando el intervalo reservado. Podrán reprogramar o cancelar citas: el solicitante sus propias citas, el profesional sus citas asignadas y el administrador las citas de la institución. Los cambios fuera del plazo mínimo realizados por profesionales o administradores requerirán una justificación obligatoria.
- RF-019. El sistema deberá impedir la modificación o cancelación de citas cuando su estado no sea Confirmada o cuando las políticas configuradas, como el plazo mínimo de anticipación, no permitan dicha operación, salvo la excepción justificada prevista para profesionales y administradores.

### Seguimiento de atención

- RF-020. El sistema deberá administrar los estados de cita: confirmada, en atención, atendida, cancelada y no asistida, con la transición inicial Confirmada y las transiciones permitidas: Confirmada → En atención; En atención → Atendida; Confirmada → Cancelada; Confirmada → No asistida, siendo Atendida, Cancelada y No asistida estados finales.
- RF-021. El sistema deberá permitir que el administrador y los profesionales autorizados actualicen el estado de una cita, respetando exclusivamente las transiciones permitidas definidas en RF-020.
- RF-022. El sistema deberá registrar los cambios de estado de las citas, identificando el estado anterior, el nuevo estado, la fecha y el usuario responsable.
- RF-023. El administrador deberá poder consultar todas las citas de la institución y el profesional las citas asignadas a él, filtrando por fecha y estado.

### Notificaciones y configuración

- RF-024. El sistema deberá generar una notificación interna cuando una cita sea confirmada, reprogramada o cancelada, indicando el evento y los datos actualizados de la reserva. La generación de notificaciones estará desacoplada de la confirmación de reservas: un fallo al generar una notificación no invalidará una reserva correctamente confirmada. Toda modificación autorizada de una cita generará además una notificación interna al solicitante.
- RF-025. El sistema deberá permitir configurar, mediante tres parámetros independientes —uno por operación—, las políticas de anticipación mínima para reservar, reprogramar y cancelar citas. Todos serán configurables por el administrador. Los valores iniciales aprobados para reprogramar y cancelar son de 2 horas; el valor del parámetro de anticipación para reservar deberá ser aprobado por el responsable del proyecto antes de activarse.
- RF-026. El sistema deberá conservar un registro auditable de las operaciones críticas de reserva, reprogramación y cancelación, incluyendo fecha, usuario y resultado de la operación.

### Ampliaciones aprobadas en la validación humana de la Etapa 1

- RF-027. El sistema deberá incluir una landing page responsive, parte de la misma aplicación, que presente información institucional y consulte información real procedente del backend, como los servicios disponibles.
- RF-028. El sistema deberá permitir a los usuarios autenticados consultar sus notificaciones internas, incluyendo el evento y los datos de la cita relacionada.
- RF-029. El administrador deberá poder iniciar un restablecimiento seguro de contraseña para un usuario, generando una contraseña temporal segura de un solo uso con caducidad configurable, almacenada exclusivamente mediante hash seguro y obligatoria a cambiar al iniciar sesión. La entrega se realizará mediante un canal seguro definido antes de la implementación, la operación quedará registrada en auditoría y el sistema no permitirá visualizar ni recuperar contraseñas existentes. Este mecanismo se documenta conceptualmente; su implementación y selección tecnológica quedan pendientes de aprobación.
