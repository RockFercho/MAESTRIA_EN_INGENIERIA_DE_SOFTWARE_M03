# Reglas de negocio

- RN-01. Toda cita deberá estar asociada a un usuario, un profesional,
  un servicio y un intervalo de atención.

- RN-02. Una cita solo podrá registrarse cuando el profesional se encuentre
  disponible para todo el intervalo solicitado.

- RN-03. Un profesional no podrá mantener dos citas activas cuyos intervalos
  de atención se solapen total o parcialmente. A estos efectos, se consideran
  activas las citas en estado Confirmada o En atención; los estados Atendida,
  Cancelada y No asistida no reservan tiempo del profesional.

- RN-04. Cada servicio tendrá una duración general configurable por el
  administrador. Podrá definirse una duración específica para una
  combinación de profesional y servicio, que tendrá prioridad sobre la
  duración general. El cálculo de disponibilidad utilizará la duración
  efectiva. Las citas confirmadas conservarán la duración con la que fueron
  reservadas, aunque la configuración cambie posteriormente.

- RN-05. Los horarios disponibles deberán calcularse considerando el horario
  habitual del profesional, las excepciones de disponibilidad y las citas
  previamente registradas.

- RN-06. Una cita cancelada liberará el intervalo reservado para que pueda
  volver a considerarse disponible.

- RN-07. La reprogramación de una cita deberá validar nuevamente la
  disponibilidad antes de confirmar el nuevo intervalo.

- RN-08. Toda cita nacerá en estado Confirmada y deberá seguir únicamente
  las siguientes transiciones permitidas:

  - Confirmada → En atención
  - En atención → Atendida
  - Confirmada → Cancelada
  - Confirmada → No asistida

  Los estados Atendida, Cancelada y No asistida son finales. Cualquier otra
  transición no estará permitida. La reprogramación no constituye una
  transición de estado: modifica la fecha u hora de la cita, mantiene el
  estado Confirmada y registra el cambio en el historial.

- RN-09. Las operaciones de reserva y reprogramación deberán evitar que dos
  solicitudes concurrentes confirmen el mismo intervalo para un profesional.

- RN-10. Los cambios relevantes realizados sobre una cita deberán conservar
  información suficiente para identificar qué cambió y cuándo ocurrió.

- RN-11. La eliminación de información histórica de citas confirmadas,
  atendidas o canceladas no deberá realizarse mediante eliminación física
  durante la operación normal del sistema.

- RN-12. Las reglas relacionadas con anticipación mínima para reservar,
  reprogramar o cancelar se definirán mediante tres parámetros operativos
  independientes —uno por operación—, configurables por el administrador.
  No se asumirán valores definitivos sin aprobación humana.

- RN-13. Solo podrán reprogramarse o cancelarse citas en estado Confirmada
  que cumplan el plazo mínimo de anticipación de la operación correspondiente.
  El valor inicial aprobado para reprogramar y cancelar será de 2 horas y
  podrá modificarse mediante parámetros del sistema; el valor del parámetro
  de anticipación para reservar deberá ser aprobado por el responsable del
  proyecto antes de activarse. Las citas en cualquier otro estado no podrán
  reprogramarse ni cancelarse.

- RN-14. El solicitante podrá reprogramar o cancelar sus propias citas, el
  profesional las citas que tiene asignadas y el administrador las citas de
  la institución, siempre que se encuentren en estado Confirmada y se
  respete el plazo mínimo de anticipación. Profesionales y administradores
  podrán efectuar cambios fuera del plazo mínimo por razones operativas,
  siempre que la cita permanezca en Confirmada y aportando una justificación
  obligatoria. Toda modificación deberá verificar la disponibilidad,
  registrarse en auditoría y generar una notificación interna al
  solicitante.

- RN-15. Los horarios recurrentes y sus excepciones se interpretarán según
  la zona horaria institucional America/La_Paz.

- RN-16. Toda cita deberá corresponder a una asociación profesional-servicio
  válida y activa al momento de su creación y de su reprogramación,
  respetando las políticas de integridad e historial del sistema. La
  desactivación posterior de la asociación no invalidará ni alterará
  automáticamente las citas históricas, conservándose la trazabilidad de la
  asociación utilizada.