Continúa con el workflow de diseño de base de datos del proyecto "Sistema Web de Gestión de Citas y Atención Virtual".

Como responsable del proyecto, APRUEBO las cinco observaciones A-01 a A-05 identificadas durante la revisión humana del Paso 02 (Modelo conceptual).

Decisiones aprobadas:

**A-01 — Asociación profesional-servicio**
APROBADA. La asociación profesional-servicio debe estar activa y ser válida al crear o reprogramar una cita. Una desactivación posterior no debe invalidar ni alterar automáticamente las citas históricas. Conservar la trazabilidad de la asociación utilizada.

**A-02 — Almacenamiento de fecha**
APROBADA. Evitar duplicar innecesariamente la fecha cuando pueda derivarse del instante de inicio almacenado en UTC. La fecha y hora institucionales se interpretarán mediante la zona horaria America/La_Paz. Considerar este criterio al elaborar posteriormente el modelo lógico y físico.

**A-03 — Estados que bloquean disponibilidad**
APROBADA. Las citas en estado Confirmada o En atención bloquean el intervalo del profesional. Los estados Atendida, Cancelada y No asistida no representan reservas activas. Conservar los registros históricos y verificar que las reglas de disponibilidad no generen conflictos con las transiciones de estado.

**A-04 — Notificaciones**
APROBADA. Cada notificación debe conservar una instantánea de los datos relevantes del evento que la originó, evitando que modificaciones posteriores de la cita alteren su contenido histórico. Mantener la trazabilidad con la cita y el evento correspondiente.

**A-05 — Excepciones de disponibilidad**
APROBADA. El modelo debe admitir excepciones de jornada completa y excepciones correspondientes a un rango horario específico. Las reglas deben permitir representar ambos casos sin ambigüedad.

Instrucciones de ejecución:

1. Registra formalmente estas cinco decisiones humanas en proyecto/04_decisiones/, conservando los códigos A-01 a A-05, la justificación y las referencias a los requisitos afectados.
2. Actualiza únicamente los documentos del modelo conceptual y los requisitos o reglas que realmente necesiten ajustes para mantener consistencia.
3. Conserva los identificadores existentes de RF, RNF, RN y CA. No elimines ni renumeres requisitos.
4. Preserva evidencia de los documentos anteriores a cualquier modificación.
5. Verifica la trazabilidad entre requisitos funcionales, no funcionales, reglas de negocio y entidades conceptuales.
6. Revisa que las decisiones no contradigan ADR-001 ni las decisiones humanas anteriores.
7. Mantén registrados como pendientes no bloqueantes el valor inicial de anticipación mínima para reservar y el canal seguro de entrega de contraseñas temporales.
8. Ejecuta una revisión final de consistencia y presenta un resumen de archivos modificados, decisiones registradas, verificaciones realizadas y observaciones pendientes.
9. Actualiza el estado del workflow únicamente conforme a sus reglas y a los resultados realmente verificados.

IMPORTANTE:
- No avances automáticamente al Paso 03.
- No generes SQL, migraciones ni código.
- No selecciones ni cambies el motor de base de datos.
- No implementes infraestructura.
- Al finalizar, detente y solicita mi aprobación final del Paso 02 para continuar con el diagrama entidad-relación.