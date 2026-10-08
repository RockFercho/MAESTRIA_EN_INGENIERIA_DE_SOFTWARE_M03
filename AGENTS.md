# Reglas universales para agentes

## 1. Descripción del proyecto

Este repositorio contiene el desarrollo académico y técnico del **Sistema Web de Gestión de Citas y Atención Virtual**, correspondiente al Módulo III: Desarrollo al Lado del Cliente y Servidor Web de la Maestría en Ingeniería de Software y Sistemas Informáticos.

El proyecto se desarrollará de manera incremental, mediante agentes especializados, revisión humana y trazabilidad de requisitos.

El objetivo es diseñar, implementar y validar una solución funcional que incluya base de datos, backend, API, frontend e integración cliente-servidor, respetando las consignas académicas.

## 2. Orden obligatorio de análisis arquitectónico

Los agentes deberán ejecutarse en el siguiente orden:

1. requirements-analyst
2. solution-leader (delimitación del alcance)
3. architect
4. database-specialist
5. security-reviewer
6. devops-architect
7. architecture-reviewer
8. solution-leader (consolidación final)

No omitir etapas sin autorización humana.

## 3. Restricciones durante el análisis

Hasta aprobar la recomendación arquitectónica y las decisiones correspondientes:

- No generar código de aplicación.
- No instalar frameworks ni dependencias.
- No crear migraciones.
- No desplegar infraestructura.
- No modificar RF, RNF o reglas de negocio silenciosamente.
- No seleccionar tecnologías por preferencias personales.
- No implementar funcionalidades fuera del alcance aprobado.

Las recomendaciones deberán justificarse técnicamente.

## 4. Fuente de verdad

Los documentos principales se encuentran en:

- `proyecto/00_contexto/`
- `proyecto/01_requisitos/`
- `proyecto/02_configuracion/`

Los agentes deberán consultar estos documentos antes de emitir recomendaciones.

Ante contradicciones, solicitar aclaración humana.

## 5. Requisitos y trazabilidad

Toda decisión técnica deberá relacionarse con al menos uno de los siguientes elementos:

- Requisito funcional.
- Requisito no funcional.
- Regla de negocio.
- Restricción.
- Criterio de aceptación.
- Evidencia técnica o resultado de prueba.

Los agentes deberán identificar requisitos ambiguos, incompletos, contradictorios o no verificables.

No modificar los requisitos originales sin autorización.

## 6. Política de agentes y skills

Los agentes especializados se encuentran en:

`.opencode/agents/`

Las skills disponibles se encuentran en:

`.agents/skills/`

Los workflows se encuentran en:

`.agents/workflows/`

Las fuentes de skills se documentan en:

`SKILLS_SOURCES.md`

Los agentes deberán reutilizar las skills existentes cuando correspondan.

No instalar nuevas skills sin verificar previamente su necesidad, compatibilidad, procedencia y licencia.

## 7. Flujo de análisis y diseño de base de datos

Para iniciar la fase de base de datos:

1. Verificar los RF, RNF y criterios de aceptación.
2. Consultar `SKILLS_SOURCES.md`.
3. Consultar `.agents/workflows/02_database_workflow.md`.
4. Consultar el state correspondiente.
5. Identificar entidades, atributos, relaciones y restricciones.
6. Elaborar el modelo conceptual.
7. Elaborar el modelo lógico.
8. Evaluar normalización e integridad.
9. Evaluar y justificar el motor de base de datos.
10. Elaborar el modelo físico.
11. Generar scripts SQL cuando la etapa correspondiente esté aprobada.
12. Ejecutar pruebas y documentar evidencias.

No generar SQL antes de aprobar el diseño correspondiente.

## 8. Flujo de desarrollo de aplicación

Después de aprobar la arquitectura y la fase de base de datos, ejecutar progresivamente:

1. `.agents/workflows/03_api_pilot_workflow.md`
2. `.agents/workflows/04_backend_workflow.md`
3. `.agents/workflows/05_frontend_workflow.md`
4. `.agents/workflows/06_integration_workflow.md`

La implementación deberá respetar las decisiones arquitectónicas aprobadas.

No asumir que las configuraciones o decisiones del sistema de ejemplo del docente son aplicables a este proyecto.

## 9. Regla obligatoria de checkpoints

Cada interacción de ejecución deberá:

1. Identificar el checkpoint pendiente.
2. Leer el workflow y state correspondientes.
3. Ejecutar únicamente el checkpoint autorizado.
4. Validar los resultados obtenidos.
5. Documentar evidencias y observaciones.
6. Actualizar el state cuando corresponda.
7. Marcar `HUMAN_STATUS: PENDING`.
8. Detenerse y esperar aprobación humana.

No avanzar automáticamente al siguiente checkpoint.

## 10. Organización del código

El código de aplicación se desarrollará dentro de:

`proyecto/06_codigo/`

La documentación, decisiones, modelos y evidencias deberán conservarse en sus carpetas correspondientes.

No crear estructuras paralelas innecesarias.

## 11. Selección tecnológica

El lenguaje, framework, arquitectura, base de datos y herramientas de desarrollo todavía no han sido aprobados.

Los agentes deberán evaluar las alternativas considerando:

- Requisitos funcionales y no funcionales.
- Seguridad.
- Rendimiento.
- Mantenibilidad.
- Escalabilidad.
- Compatibilidad con Linux.
- Posibilidad de contenerización.
- Complejidad de implementación.
- Recursos disponibles.
- Restricciones académicas.

Toda selección tecnológica deberá quedar documentada y aprobada.

## 12. Seguridad

- No almacenar credenciales en el repositorio.
- No exponer información sensible en logs.
- Aplicar validaciones del lado del servidor.
- Implementar controles de autenticación y autorización según los requisitos.
- Evitar operaciones destructivas sin autorización.
- Mantener separación de configuraciones por entorno.

## 13. Alcance funcional

El alcance inicial está definido en:

`proyecto/00_contexto/alcance.md`

Los requisitos específicos están definidos en:

- `proyecto/01_requisitos/RF.md`
- `proyecto/01_requisitos/RNF.md`
- `proyecto/01_requisitos/criterios_aceptacion.md`

No implementar funcionalidades adicionales sin una decisión explícita.

## 14. Política de validación humana

Los agentes generan propuestas, análisis, implementaciones y evidencias técnicas.

La decisión final corresponde al estudiante.

Toda observación deberá clasificarse como:

- Aceptada.
- Rechazada.
- Pendiente de análisis.

Cada decisión deberá incluir su justificación.

## 15. Objetivos académicos

El proyecto deberá proporcionar evidencias para:

**Práctica 1: Diseño de Base de Datos**

- Requisitos iniciales.
- Validación mediante agente.
- Análisis crítico de observaciones.
- Diseño y generación de SQL.
- Evidencias de ejecución.

**Práctica 2: Desarrollo Backend e Integración**

- Backend funcional.
- Validación de solicitudes.
- Lógica de negocio.
- Conexión con base de datos.
- Operaciones reales sobre los datos.
- API funcional.
- Evidencias de pruebas.

**Trabajo Final: Landing Page Funcional**

- Interfaz responsive.
- Interacción con el usuario.
- Procesamiento del lado del servidor.
- Persistencia o consulta de datos.
- Comunicación cliente-servidor.
- Código fuente y documentación.
- Evidencias de funcionamiento.

Estas entregas forman parte de un mismo proyecto, pero deberán conservar sus evidencias y criterios de evaluación individuales.

## 16. Lectura progresiva

Cuando el usuario indique `continúa`:

1. Consultar el state de la fase actual.
2. Consultar el workflow correspondiente.
3. Verificar el último checkpoint aprobado.
4. Ejecutar solamente el siguiente checkpoint autorizado.

No releer todo el repositorio salvo que sea necesario.

## 17. Regla final

La prioridad es garantizar coherencia entre requisitos, arquitectura, base de datos, código y pruebas.

Ningún agente deberá considerar una propuesta como definitivamente aprobada sin validación humana.