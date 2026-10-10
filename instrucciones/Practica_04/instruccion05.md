APRUEBO CP-API-03 y AUTORIZO LA EJECUCIÓN CONTINUA DE LOS CHECKPOINTS RESTANTES DE LA PRÁCTICA 2.

Objetivo: completar CP-API-04 hasta CP-API-08 del workflow `.agents/workflows/03_api_pilot_workflow.md` en una sola ejecución, sin solicitar aprobaciones intermedias.

INSTRUCCIONES:

1. Lee AGENTS.md, el workflow 03, el estado actual y las decisiones humanas aprobadas.
2. Registra esta autorización humana como aprobación para ejecutar consecutivamente CP-API-04, 05, 06, 07 y 08.
3. Implementa todos los endpoints REST pendientes del módulo `catalogo`, respetando el contrato API aprobado.
4. Mantén Node.js 22, Express, mysql2, node:test y la arquitectura modular hexagonal de ADR-001.
5. Utiliza exclusivamente la cuenta `app_rw` para la aplicación.
6. Implementa validaciones, manejo de errores, códigos HTTP correctos y desactivación lógica para DELETE.
7. Incorpora pruebas unitarias y de integración para todos los endpoints y escenarios relevantes.
8. Ejecuta las pruebas automáticamente y corrige los errores encontrados. Repite las pruebas hasta obtener resultados satisfactorios o identificar un bloqueo real.
9. Realiza verificaciones HTTP y SQL contra MySQL utilizando datos de prueba identificables. Conserva los datos preexistentes y limpia los fixtures mediante mecanismos autorizados y seguros.
10. No modifiques el esquema de la base de datos, no ejecutes migraciones y no alteres archivos ni evidencias de la Práctica 1.
11. No expongas credenciales, contraseñas ni información sensible.
12. Registra las evidencias reales de cada checkpoint y actualiza el estado del workflow.
13. Realiza una validación final de cumplimiento de RF, RNF y criterios de aceptación aplicables al alcance de esta práctica.
14. No amplíes el alcance a otros módulos, frontend o funcionalidades no contempladas en el workflow.

IMPORTANTE:
- No te detengas para solicitar aprobación después de cada checkpoint.
- Puedes resolver autónomamente errores técnicos menores y ajustes internos que respeten las decisiones aprobadas.
- Si surge una decisión arquitectónica, funcional o de seguridad no aprobada, detente y presenta únicamente ese bloqueo.
- No declares pruebas aprobadas si no fueron ejecutadas realmente.

AL FINALIZAR:

Genera un informe consolidado en Markdown dentro de `proyecto/03_resultados/` que incluya:
- Checkpoints ejecutados y resultado.
- Endpoints implementados.
- Archivos creados o modificados.
- Pruebas realizadas y resultados.
- Evidencias HTTP y SQL.
- Problemas encontrados y soluciones.
- Requisitos y criterios de aceptación verificados.
- Pendientes o limitaciones.

Presenta en consola un resumen breve: IMPLEMENTACIÓN COMPLETADA o BLOQUEADA, número de pruebas aprobadas/fallidas y ubicación del informe.

Detente únicamente al finalizar toda la implementación o ante un bloqueo que realmente requiera intervención humana.