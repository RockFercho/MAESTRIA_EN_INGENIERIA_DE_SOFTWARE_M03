AUTORIZACIÓN HUMANA — IMPLEMENTACIÓN INTEGRAL DEL BACKEND

APRUEBO el workflow 07 propuesto y AUTORIZO ejecutar en una sola corrida toda la implementación backend pendiente del Sistema Web de Gestión de Citas y Atención Virtual.

OBJETIVO:
Completar el backend funcional del proyecto hoy, sin detenerse entre módulos y sin solicitar aprobaciones intermedias por decisiones técnicas ya resueltas.

1. CONSERVAR LO EXISTENTE

Lee AGENTS.md, ADR-001, RF.md, RNF.md, reglas_negocio.md, criterios_aceptacion.md y las decisiones humanas aprobadas.

Conserva todos los módulos existentes, la base de datos, las pruebas aprobadas y los workflows cerrados.

Stack obligatorio:
- Node.js 22.
- Express.
- MySQL 8.
- mysql2.
- node:test.
- Arquitectura monolítica modular con estructura hexagonal interna.

2. IMPLEMENTAR TODOS LOS MÓDULOS PENDIENTES

A. IDENTIDAD Y USUARIOS
- Registro de solicitantes.
- Administración de usuarios.
- Administración de profesionales.
- Roles y permisos.
- Validación de contraseñas.
- Integración con la autenticación existente.

B. CATÁLOGO
- Administración de profesionales y servicios.
- Asociación profesional-servicio.
- Validación de asociaciones activas.
- Duración efectiva del servicio.

C. AGENDA
- Horarios habituales.
- Excepciones de disponibilidad.
- Cálculo de horarios disponibles.
- Validación de duración y solapamientos.
- Interpretación de horarios en America/La_Paz y almacenamiento UTC.

D. RESERVAS
- Crear citas.
- Consultar citas.
- Reprogramar citas.
- Cancelar citas.
- Validar disponibilidad antes de confirmar.
- Validar anticipación mínima configurable.
- Aplicar transacciones ACID.
- Controlar concurrencia.
- Implementar idempotencia.
- Evitar reservas duplicadas.

E. SEGUIMIENTO
- Máquina de estados aprobada.
- Transiciones autorizadas.
- Historial de cambios.
- Justificación obligatoria cuando corresponda.

F. AUDITORÍA
- Registro de operaciones críticas.
- Identificación del usuario responsable.
- Fecha, operación y resultado.
- Persistencia append-only.

G. NOTIFICACIONES INTERNAS
- Generación de notificaciones.
- Consulta de notificaciones.
- Integración con el outbox.
- Garantizar que un fallo de notificación no invalide una reserva confirmada.

H. PARÁMETROS OPERATIVOS
- Consulta de parámetros.
- Actualización autorizada.
- Anticipación mínima para reservar, reprogramar y cancelar.

I. RESTABLECIMIENTO DE CONTRASEÑAS
Implementar únicamente los aspectos cubiertos por las decisiones humanas y de seguridad aprobadas. Si sigue pendiente definir el canal seguro de entrega, no inventarlo: registrar este punto como bloqueo específico sin detener los demás módulos.

3. IMPLEMENTACIÓN CONTINUA

Para cada módulo:
- Crear entidades y reglas de dominio.
- Implementar casos de uso.
- Implementar puertos y adaptadores MySQL.
- Implementar controladores y rutas REST.
- Aplicar validaciones y autorización.
- Crear pruebas unitarias y de integración.
- Ejecutar pruebas y corregir errores automáticamente.
- Continuar con el siguiente módulo.

NO SOLICITAR APROBACIÓN ENTRE MÓDULOS.

4. RESTRICCIONES

- No modificar el esquema MySQL.
- No ejecutar migraciones.
- No eliminar datos existentes.
- No cambiar la arquitectura aprobada.
- No desarrollar frontend.
- No modificar evidencias de prácticas anteriores.
- No mostrar secretos.
- No ampliar privilegios MySQL automáticamente.
- No inventar reglas de negocio.
- No marcar como verificado algo que no se probó.

5. VALIDACIÓN FINAL

Ejecuta:
- Suite completa de pruebas unitarias.
- Pruebas de integración contra MySQL real.
- Pruebas HTTP de endpoints.
- Pruebas de concurrencia e idempotencia.
- Pruebas de permisos por rol.
- Pruebas de transacciones y rollback.
- Pruebas de rendimiento con el perfil aprobado de 100 usuarios concurrentes, si el entorno dispone de las herramientas y condiciones necesarias.

Corrige automáticamente los errores técnicos encontrados y repite las pruebas.

6. DOCUMENTACIÓN Y ENTREGA

Actualiza OpenAPI y genera un informe consolidado que incluya:

- Módulos implementados.
- Endpoints disponibles.
- RF/RNF/CA cubiertos.
- Pruebas ejecutadas y resultados.
- Evidencias HTTP y MySQL.
- Errores corregidos.
- Funcionalidades pendientes.
- Estado final del backend.

IMPORTANTE:
Prioriza completar los flujos funcionales principales antes de mejoras secundarias.

Ejecuta todos los módulos en una sola corrida. Detente únicamente si surge una decisión humana nueva indispensable o un bloqueo técnico que no pueda resolverse sin intervención.

No declares BACKEND COMPLETO si existen funcionalidades obligatorias pendientes.

Al terminar, presenta un resumen breve con el número de módulos, endpoints y pruebas aprobadas/fallidas.