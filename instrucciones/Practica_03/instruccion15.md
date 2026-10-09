## DECISIÓN HUMANA D-06 — APROBACIÓN DEL MOTOR MYSQL

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

Como responsable del proyecto, APRUEBO la selección de **MySQL 8.4 LTS con motor InnoDB** como sistema gestor de base de datos para la versión inicial.

### Justificación

1. Experiencia previa del desarrollador con MySQL.
2. Disponibilidad de MySQL en el entorno local.
3. Compatibilidad con la arquitectura ADR-001: monolito modular, arquitectura hexagonal interna y una base de datos relacional.
4. Soporte para transacciones ACID, claves foráneas, índices y control de concurrencia mediante InnoDB.
5. Reducción del tiempo de configuración, implementación y pruebas académicas.

La recomendación inicial de PostgreSQL se conserva como alternativa evaluada, pero no se adopta para esta versión.

### Instrucciones

1. Registrar formalmente la decisión D-06 como APROBADA.
2. Actualizar `seleccion_dbms.md`, documentando MySQL como motor seleccionado y PostgreSQL como alternativa descartada para la versión inicial.
3. Mantener intactos ADR-001, los requisitos aprobados, los modelos conceptuales y las decisiones anteriores.
4. Continuar con los siguientes pasos del workflow `02_database_workflow.md` que estén autorizados.
5. Diseñar las restricciones de integridad específicamente para MySQL 8.4 e InnoDB.
6. Para las reservas concurrentes, definir una estrategia transaccional segura que impida solapamientos, incluyendo bloqueos adecuados, manejo de reintentos e idempotencia. No asumir que una restricción UNIQUE simple impide solapamientos de intervalos.
7. Para las excepciones de disponibilidad T6, definir una solución compatible con MySQL que impida duplicados exactos conforme a E2, considerando la semántica de los valores NULL.
8. Mantener la consistencia de inicio, fin y duración efectiva de las citas.
9. Preservar la integridad del historial, auditoría, notificaciones y eventos outbox.
10. Verificar la compatibilidad con la versión local instalada antes de ejecutar scripts o migraciones.

### Prioridad de ejecución

Agrupar los pasos documentales consecutivos para evitar revisiones repetitivas. Resolver autónomamente los detalles técnicos ya derivados de decisiones aprobadas.

No solicitar aprobación por cada índice, tipo de dato o detalle menor.

Respetar los checkpoints humanos obligatorios del workflow. No generar ni ejecutar SQL, migraciones o infraestructura antes de alcanzar las autorizaciones correspondientes.

### Entrega

Presentar los documentos generados, las verificaciones realizadas y únicamente las decisiones nuevas que realmente requieran intervención humana.

Detenerse en el siguiente checkpoint obligatorio.

**HUMAN_STATUS: APPROVED_STEP_06 — MYSQL_8_4_LTS_INNODB.**