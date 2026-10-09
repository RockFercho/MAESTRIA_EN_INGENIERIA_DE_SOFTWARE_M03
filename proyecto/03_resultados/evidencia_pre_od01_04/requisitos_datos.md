# Requisitos de datos
## Sistema Web de Gestión de Citas y Atención Virtual

**Workflow:** `02_database_workflow` — Paso 01 (lectura y trazabilidad).
**Skill:** `database-schema-designer`.
**Fecha:** 8 de octubre de 2026.
**Restricción:** este paso **no genera SQL**. La creación de scripts requiere aprobación previa (Paso 15, `AGENTS.md` §7).

**Entradas leídas:** `proyecto/01_requisitos/` (RF, RNF, criterios de aceptación, `perfil_carga.md`, `trazabilidad_etapa1.md`), `proyecto/00_contexto/` (reglas de negocio, alcance, restricciones), `proyecto/04_decisiones/adr_001_arquitectura_monolito_modular_hexagonal.md`, `proyecto/03_resultados/arquitectura_alternativas.md`.

---

## 1. Contexto de datos aprobado

- Despliegue monolítico con **una única base de datos relacional** (ADR-001).
- Volumen inicial de prueba (`perfil_carga.md`): 1.000 usuarios, 20 profesionales, 15 servicios, 10.000 citas.
- Carga nominal: 100 usuarios concurrentes; 60 % consultas de disponibilidad, 20 % consultas de citas, 15 % confirmaciones de reservas, 5 % reprogramaciones/cancelaciones (RNF-006/007/008, CA-008).

## 2. Entidades identificadas y trazabilidad

| Entidad (nombre conceptual) | Contenido mínimo | RF/RN/RNF |
|---|---|---|
| **Usuario** | nombre completo, correo (único), contraseña hasheada, rol (solicitante/profesional/administrador), estado | RF-001..003, RF-029, RNF-002/029, CA-001 |
| **Profesional** | vínculo con usuario, datos profesionales, estado activo/inactivo; desactivación conserva historial | RF-004, RN-11 |
| **Servicio** | nombre, descripción, duración general (minutos, configurable) | RF-005, RN-04 |
| **Asociación profesional–servicio** | profesional, servicio, duración específica opcional (prioridad sobre la general) | RF-006, RN-04, CA-002 |
| **Horario habitual de atención** | profesional, día de semana, hora inicio/fin | RF-007, RN-05 |
| **Excepción de disponibilidad** | profesional, fecha/rango, tipo (ausencia, feriado, bloqueo) | RF-008, RN-05 |
| **Cita** | solicitante, profesional, servicio, inicio/fin (UTC), estado (Confirmada/En atención/Atendida/Cancelada/No asistida), duración efectiva reservada, justificación opcional de cambio fuera de plazo | RF-012..020, RN-01..RN-08, RN-13/RN-14, RNF-028 |
| **Historial de cambios de cita** | cita, estado anterior, estado nuevo (o campo cambiado en reprogramación), fecha, usuario responsable, justificación | RF-021/022, RN-08/RN-10, CA-006 |
| **Auditoría de operaciones críticas** | operación (reserva/reprogramación/cancelación), usuario, fecha, resultado, contexto | RF-026, RNF-013/026, CA-006 |
| **Notificación interna** | usuario destinatario, cita, evento, datos actualizados, fecha de generación, estado de lectura | RF-024, RF-028, RNF-017, CA-012 |
| **Parámetro operativo** | clave-valor de políticas (anticipación mínima, valor inicial 2 h) | RF-025, RN-12, RN-13 |
| **Clave de idempotencia** | clave del cliente, resultado de la operación, fecha | RNF-012, CA-007 |
| **Outbox de eventos** | evento (cita confirmada/reprogramada/cancelada), carga, estado de procesamiento | RNF-017, CA-012 |
| **Registro de restablecimiento de contraseña** | usuario, marca temporal, estado (sin contraseña visible) | RF-029, RNF-029 |

## 3. Reglas de integridad derivadas (para fases posteriores)

- **RN-01:** toda cita tiene usuario, profesional, servicio e intervalo → FKs NOT NULL.
- **RN-02/RN-03:** sin solapes de citas activas de un mismo profesional → restricción de unicidad/exclusión o verificación transaccional (Paso 12, con `database-specialist`).
- **RN-04:** duración efectiva = duración específica (profesional-servicio) si existe, si no duración general; las citas conservan su duración al reservarse → persistir la duración efectiva en la cita.
- **RN-06:** cancelación libera el intervalo → el bloqueo depende del estado de la cita, no de borrado.
- **RN-08/RN-11:** máquina de estados; historial append-only; **sin borrado físico** de citas en estados finales → ON DELETE restringido en catálogo con citas asociadas.
- **RN-13/RN-14:** elegibilidad y permisos; justificación obligatoria fuera de plazo.
- **RNF-012:** clave de idempotencia con restricción única.
- **RNF-028/RN-15:** almacén en UTC; interpretación de recurrencias en `America/La_Paz`.
- Correo de usuario único (CA-001); contraseñas nunca en texto plano (RNF-002).

## 4. Patrones de acceso

| Consulta | Frecuencia | Observación |
|---|---|---|
| Disponibilidad (horario ∖ excepciones ∖ citas, por profesional/servicio/fecha) | 60 % de la carga | requiere índice por profesional + rango de fechas; candidata a optimización en Pasos 11–12 |
| Consulta de citas por solicitante / profesional / administración con filtros fecha y estado | 20 % | índices por responsable + fecha + estado |
| Confirmación de reserva (transacción de escritura) | 15 % | concurrencia: RN-09/RNF-010 |
| Reprogramación y cancelación | 5 % | transacciones con verificación reiterada |
| Consulta de notificaciones del usuario | por evento | paginación |

Perfil **OLTP**, normalización a 3NF como punto de partida (Paso 05).

## 5. Retención, auditoría y respaldo

- RN-11: sin eliminación física de historial de citas confirmadas, atendidas o canceladas.
- RF-026/RNF-013: auditoría append-only con usuario, fecha y resultado.
- RNF-015/016: respaldo diario, retención ≥ 7 días, restauración antes de producción y cada 3 meses con verificación de integridad (CA-013).

## 6. Seguridad de los datos

- Contraseñas: hash adaptativo con sal (RNF-002); longitud ≥ 12 (RNF-029).
- Secretos solo por entorno, nunca en el repositorio (RNF-004).
- Logs sin contraseñas ni secretos (RNF-026).
- Autorización verificada en servidor (RNF-003).

## 7. Supuestos y pendientes

- **Motor de BD no seleccionado** (Paso 06, `seleccion_dbms.md`): este documento es agnóstico del motor.
- Técnica de exclusión de solapamientos, diseño de índices y estrategia de concurrencia se definen en los Pasos 11 y 12.
- No se han creado entidades ni tablas: el modelo conceptual corresponde al Paso 02.

**Estado del paso:** completado. **HUMAN_STATUS: PENDING** (revisión humana antes del Paso 02).
