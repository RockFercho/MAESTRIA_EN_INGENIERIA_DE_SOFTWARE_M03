APROBACIÓN HUMANA — PRÁCTICA 2, API PILOTO

APRUEBO el plan de implementación del módulo catálogo de servicios, con las siguientes condiciones:

1. AUTORIZO adaptar el workflow 03_api_pilot_workflow.md de su ejemplo PHP/cat_categoria al módulo servicio con Node.js 22, Express, mysql2 y node:test, conservando sus ocho checkpoints y la trazabilidad.
2. APRUEBO formalmente este stack para el backend piloto, compatible con ADR-001: monolito modular con arquitectura hexagonal interna.
3. AUTORIZO corregir el state heredado de api-pilot-workflow.json para reflejar el estado real de este proyecto. Registrar la corrección sin alterar el workflow de base de datos ya cerrado.
4. APRUEBO el piloto sin autenticación exclusivamente para ejecución local y demostración académica. No exponer públicamente endpoints administrativos. Documentar que la autenticación y autorización funcional quedan pendientes para la fase correspondiente.
5. Utilizar la cuenta de servicio app_rw para el acceso MySQL, con credenciales obtenidas de variables de entorno. No utilizar devcode como cuenta de aplicación.
6. Respetar exactamente las columnas, restricciones y reglas de negocio existentes en la tabla servicio. No modificar el esquema ni ejecutar migraciones.
7. Implementar los endpoints REST aprobados, incluyendo desactivación lógica sin DELETE físico.
8. Ejecutar pruebas unitarias y de integración con datos temporales identificables, evitando modificar registros existentes y garantizando su limpieza.
9. Registrar evidencias reales de las operaciones HTTP y SQL para el informe académico.
10. No modificar documentos ni evidencias de la Práctica 1.

AUTORIZO iniciar CP-API-01 y CP-API-02, generando el código necesario y ejecutando sus pruebas.

Al terminar CP-API-02, presenta un resumen breve con archivos creados, comandos ejecutados, resultado de GET /health y errores pendientes. Detente para mi revisión antes de continuar con CP-API-03.

Prioridad: completar la API funcional y su integración real con MySQL sin desarrollar componentes innecesarios.