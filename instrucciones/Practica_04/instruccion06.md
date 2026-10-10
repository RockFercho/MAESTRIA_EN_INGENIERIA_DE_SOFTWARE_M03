APRUEBO EL RESULTADO FINAL DEL WORKFLOW 03 (API PILOTO) Y AUTORIZO CONTINUAR CON LA IMPLEMENTACIÓN DEL BACKEND PLANIFICADO.

PROYECTO: Sistema Web de Gestión de Citas y Atención Virtual.

OBJETIVO:
Completar el backend definido en `.agents/workflows/04_backend_workflow.md`, mediante una ejecución continua, con pruebas automatizadas, integración real con MySQL y evidencias verificables.

FASE 1 — REVISIÓN OBLIGATORIA

1. Lee `AGENTS.md`, el workflow 04, los estados de ejecución, ADR-001, las decisiones humanas, los RF/RNF, reglas de negocio y criterios de aceptación.
2. Revisa el código existente en `proyecto/06_codigo/`.
3. Conserva la API piloto del módulo catálogo, sus pruebas y la documentación existente.
4. Identifica todos los módulos, endpoints, operaciones y verificaciones exigidos por el workflow 04.
5. Construye una matriz de cobertura: requisito → módulo → endpoint/caso de uso → prueba → estado.
6. Verifica qué decisiones técnicas y funcionales ya están aprobadas y cuáles siguen pendientes.

FASE 2 — IMPLEMENTACIÓN CONTINUA

Ejecuta consecutivamente todos los checkpoints del workflow 04 que estén autorizados y no requieran nuevas decisiones humanas.

Mantén:
- Node.js 22, Express, mysql2 y node:test.
- Monolito modular con arquitectura hexagonal interna.
- Base de datos MySQL `gestion_citas_db`.
- Consultas parametrizadas, validaciones en servidor y manejo seguro de errores.
- Autenticación, autorización y permisos por rol conforme a los requisitos aprobados.
- Separación entre dominio, aplicación, puertos y adaptadores.
- Transacciones ACID, control de concurrencia e idempotencia para operaciones críticas.
- Auditoría, historial y notificaciones internas según los requisitos.
- Manejo correcto de UTC y America/La_Paz.

Implementa los módulos de identidad, agenda, reservas, seguimiento, notificaciones, parámetros y demás funcionalidades únicamente cuando estén incluidos en el alcance aprobado.

No inventes requisitos ni amplíes funcionalidades.

FASE 3 — PRUEBAS Y CORRECCIONES

1. Ejecuta pruebas unitarias y de integración de todos los módulos implementados.
2. Verifica las operaciones críticas contra MySQL real.
3. Comprueba permisos, validaciones, errores, transacciones, concurrencia e idempotencia.
4. Ejecuta los escenarios de aceptación aplicables.
5. Corrige automáticamente los errores técnicos que no requieran decisiones nuevas.
6. Repite las pruebas después de las correcciones.
7. Conserva los datos preexistentes y limpia únicamente los fixtures de prueba identificados.
8. No declares cumplido un requisito sin evidencia de su verificación.

RESTRICCIONES:

- No modificar la estructura de la base de datos ni ejecutar migraciones sin autorización expresa.
- No alterar las evidencias de la Práctica 1 ni los checkpoints cerrados del workflow 03.
- No mostrar credenciales ni secretos.
- No exponer públicamente endpoints sin los controles de seguridad correspondientes.
- No implementar frontend.
- No detenerse por errores técnicos corregibles.
- Detenerse únicamente si aparece un bloqueo real o una decisión humana nueva indispensable.
- Si una operación requiere privilegios adicionales, documentar la necesidad y solicitar autorización; no elevar privilegios automáticamente.

FASE 4 — CIERRE Y VALIDACIÓN

Al finalizar:

1. Ejecuta toda la suite de pruebas.
2. Verifica que el backend arranca correctamente.
3. Valida los endpoints y la documentación OpenAPI.
4. Actualiza los estados y evidencias del workflow.
5. Genera un informe consolidado en `proyecto/03_resultados/`.
6. Incluye una matriz final RF/RNF/CA con estados IMPLEMENTADO, VERIFICADO, PENDIENTE o FUERA DEL ALCANCE.
7. Indica expresamente si el backend completo está terminado o si únicamente se completó el alcance del workflow 04.
8. Enumera cualquier funcionalidad pendiente y su motivo.

ENTREGA EN CONSOLA:

- Estado: BACKEND COMPLETADO, PARCIAL o BLOQUEADO.
- Módulos implementados.
- Endpoints disponibles.
- Total de pruebas aprobadas y fallidas.
- Requisitos cubiertos y pendientes.
- Archivos de evidencia.
- Ruta del informe final.

AUTORIZO LA EJECUCIÓN CONTINUA DE TODOS LOS CHECKPOINTS DEL WORKFLOW 04 QUE NO REQUIERAN UNA NUEVA DECISIÓN HUMANA.

No solicites aprobaciones intermedias innecesarias. Ejecuta, prueba, corrige y documenta hasta completar el alcance autorizado.