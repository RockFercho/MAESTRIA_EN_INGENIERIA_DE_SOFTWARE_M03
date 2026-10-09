## DECISIÓN HUMANA — AJUSTE DE VERSIÓN MYSQL

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

Confirmo que mi entorno Ubuntu 24.04 dispone de MySQL 8.0.46.

Como responsable del proyecto, autorizo actualizar la decisión D-06 para establecer **MySQL 8.0.46 con InnoDB** como versión objetivo de desarrollo e implementación, en lugar de MySQL 8.4 LTS.

### Instrucciones

1. Revisar los documentos generados en los Pasos 06–14.
2. Actualizar la decisión D-06 y sus referencias para reflejar MySQL 8.0.46 con InnoDB.
3. Verificar la compatibilidad de tipos de datos, restricciones CHECK, índices funcionales, claves foráneas, transacciones, bloqueos e idempotencia.
4. Prestar especial atención a las restricciones que utilizan expresiones, valores NULL y cálculos de fecha/hora.
5. Identificar cualquier construcción prevista para MySQL 8.4 que no sea compatible con MySQL 8.0.46 y proponer una alternativa equivalente.
6. Conservar las 14 tablas, R1–R16, ADR-001 y las decisiones humanas previamente aprobadas.
7. No modificar los requisitos ni las evidencias históricas.
8. Actualizar la revisión DBA y registrar los resultados de compatibilidad.
9. Mantener bloqueado el Paso 15 hasta recibir mi aprobación explícita.

No instalar ni actualizar MySQL. No generar ni ejecutar SQL, migraciones o código.

### Entrega

Presentar un informe breve de compatibilidad, documentos actualizados, posibles incompatibilidades y estado final del workflow.

**HUMAN_STATUS: PENDING_STEP_15_APPROVAL.**

Detenerse y esperar autorización humana.