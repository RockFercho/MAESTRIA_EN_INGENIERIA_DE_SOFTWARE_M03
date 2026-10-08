# Perfil de carga nominal
## Sistema Web de Gestión de Citas y Atención Virtual

**Origen:** decisión humana V-08 de `validacion_humana_requisitos.md`.
**Referencias:** RNF-006, RNF-007, RNF-008, RNF-009, CA-008.

## 1. Conjunto de datos de prueba

- 1.000 usuarios registrados.
- 20 profesionales.
- 15 servicios.
- 10.000 citas registradas.

## 2. Condiciones de la prueba nominal

- 100 usuarios virtuales concurrentes.
- 2 minutos de calentamiento.
- 10 minutos de ejecución.

## 3. Distribución de operaciones

| Operación | Proporción |
|-----------|------------|
| Consultas de disponibilidad | 60 % |
| Consultas de citas | 20 % |
| Confirmaciones de reservas | 15 % |
| Reprogramaciones y cancelaciones | 5 % |

## 4. Objetivos verificables

- p95 de consultas de disponibilidad < 800 ms (RNF-006).
- p95 de confirmación de reservas < 1200 ms (RNF-007), sin incluir servicios externos de notificación.
- 100 usuarios concurrentes soportados manteniendo los objetivos (RNF-008).
- Verificación adicional de errores y consistencia de las reservas.

## 5. Evidencia requerida

Las pruebas de rendimiento deberán documentar entorno, configuración de la
prueba, datos utilizados, metodología y resultados (RNF-009). Los objetivos
no se considerarán cumplidos sin mediciones.
