INICIAR PRÁCTICA N.º 2 — DESARROLLO BACKEND E INTEGRACIÓN CON BASE DE DATOS

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

La Práctica 1 de base de datos ha concluido. Continuaremos utilizando el mismo proyecto, la arquitectura ADR-001 aprobada y la base de datos MySQL gestion_citas_db.

OBJETIVO:
Implementar un backend funcional que permita recibir solicitudes HTTP, validar datos, aplicar lógica de negocio, ejecutar operaciones reales sobre la base de datos y devolver respuestas verificables.

INSTRUCCIONES:

1. Lee AGENTS.md y el workflow .agents/workflows/03_api_pilot_workflow.md, si existe. Respeta los checkpoints de aprobación humana.
2. Revisa los RF, RNF, reglas de negocio, ADR-001 y el modelo físico de la base de datos.
3. Propón como piloto el módulo de gestión de servicios, utilizando la tabla servicio existente.
4. Determina qué endpoints REST podemos implementar respetando los requisitos y las restricciones reales del esquema.
5. Propón una implementación backend con Node.js 22, Express y arquitectura hexagonal modular, verificando primero su compatibilidad con las decisiones arquitectónicas vigentes.
6. Reutiliza la conexión MySQL existente mediante configuración de entorno. No expongas contraseñas ni secretos.
7. Define las validaciones, la lógica de negocio, el acceso a datos, el manejo de errores y las pruebas necesarias.
8. No recrees la base de datos, no modifiques sus tablas y no ejecutes nuevamente las migraciones.
9. No alteres las evidencias ni los entregables de la Práctica 1.
10. Presenta un plan breve de implementación y los archivos que se crearán.

DETENTE antes de generar código y solicita mi aprobación humana del plan.

Prioridad: implementar una funcionalidad real, ejecutarla, probarla y obtener evidencias para la entrega académica, sin desarrollar innecesariamente todo el sistema.