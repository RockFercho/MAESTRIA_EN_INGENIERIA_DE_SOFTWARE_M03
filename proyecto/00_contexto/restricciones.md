# Supuestos y restricciones

- No se ha seleccionado inicialmente lenguaje de programación, framework,
  motor de base de datos ni proveedor de nube.

- Las decisiones tecnológicas deberán justificarse posteriormente a partir
  de los requisitos del sistema y no únicamente por preferencias del
  desarrollador.

- La solución deberá poder ejecutarse en un entorno Linux.

- La solución deberá permitir su despliegue mediante mecanismos de
  contenerización.

- Las credenciales, claves y demás secretos no deberán almacenarse
  directamente en el código fuente ni publicarse en el repositorio.

- Las tecnologías seleccionadas deberán contar con mantenimiento activo,
  documentación suficiente y mecanismos razonables de actualización.

- La primera versión será una aplicación web responsive; no se desarrollará
  una aplicación móvil nativa.

- Los mecanismos específicos de infraestructura, disponibilidad, respaldo
  y recuperación serán definidos posteriormente de acuerdo con los RNF.

- La integración con proveedores externos de mensajería no deberá ser
  indispensable para ejecutar las funciones principales de reserva y
  administración de citas.

- La zona horaria institucional inicial será America/La_Paz; los horarios
  recurrentes y sus excepciones se interpretarán en dicha zona, y los
  instantes de inicio y fin de las citas y las marcas temporales de
  auditoría se almacenarán en UTC.