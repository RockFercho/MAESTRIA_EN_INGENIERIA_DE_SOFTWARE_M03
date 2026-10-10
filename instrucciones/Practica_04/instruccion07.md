APRUEBO el cierre técnico del workflow 04, con 61 pruebas aprobadas y 0 fallidas.

Sin embargo, NO considero terminado el backend general del Sistema Web de Gestión de Citas y Atención Virtual.

OBJETIVO:
Completar todos los módulos backend pendientes dentro del alcance funcional y arquitectónico aprobado, sin desarrollar frontend.

INSTRUCCIONES:

1. Lee AGENTS.md, los workflows disponibles, sus estados, ADR-001, RF.md, RNF.md, reglas_negocio.md y criterios_aceptacion.md.
2. Revisa los módulos existentes y el informe del workflow 04.
3. Determina si los workflows 05 y 06 cubren los módulos backend pendientes. No supongas su contenido por el nombre.
4. Si no existe un workflow específico para completar el backend, propón y documenta uno nuevo compatible con AGENTS.md, sin alterar los workflows cerrados.
5. Presenta una matriz que identifique cada RF pendiente, módulo responsable, endpoints necesarios, reglas de negocio y pruebas de aceptación.

IMPLEMENTACIÓN AUTORIZADA:

Una vez comprobado que las funcionalidades están aprobadas y que el workflow permite su ejecución, implementa los módulos backend pendientes:

- Administración de usuarios y profesionales.
- Asociaciones profesional-servicio.
- Agenda, horarios y excepciones.
- Cálculo de disponibilidad.
- Reservas, reprogramaciones y cancelaciones.
- Control de concurrencia, transacciones e idempotencia.
- Seguimiento de citas y máquina de estados.
- Historial y auditoría.
- Notificaciones internas.
- Parámetros operativos.

Respeta la arquitectura hexagonal modular, Node.js 22, Express, mysql2, node:test y la base de datos existente.

Para cada módulo:
- Implementa validaciones, casos de uso, repositorios y endpoints.
- Aplica autenticación y autorización según el rol.
- Implementa pruebas unitarias y de integración.
- Comprueba las operaciones críticas contra MySQL real.
- Corrige errores y repite las pruebas.
- Actualiza OpenAPI y las evidencias.

RESTRICCIONES:

No modificar el esquema de MySQL ni ejecutar migraciones sin autorización expresa.
No desarrollar frontend.
No modificar evidencias históricas.
No exponer secretos.
No inventar reglas de negocio.
No implementar el restablecimiento de contraseñas hasta resolver las decisiones de seguridad pendientes.
No marcar requisitos como verificados sin pruebas.
No ejecutar un workflow que requiera aprobación humana sin obtenerla.

CIERRE:

Ejecuta la suite completa y entrega:

1. Estado real del backend.
2. Módulos y endpoints implementados.
3. Total de pruebas aprobadas y fallidas.
4. Matriz de cobertura RF/RNF/CA.
5. Evidencia de integración con MySQL.
6. Funcionalidades pendientes y bloqueos.
7. Informe consolidado.
8. Confirmación expresa de si el backend está COMPLETO o PARCIAL.

Continúa automáticamente con las actividades ya autorizadas. Detente únicamente ante una decisión humana obligatoria o un bloqueo que impida avanzar correctamente.