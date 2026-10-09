# Decisiones humanas — Revisión del Paso 01 (Requisitos de datos)

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Fecha:** 8 de octubre de 2026
**Origen:** revisión de consistencia de `proyecto/05_base_datos/01_requisitos_datos/requisitos_datos.md` frente a RF, RNF, RN, CA, ADR-001.
**Estado:** 4 de 4 observaciones resueltas por decisión humana.
**Evidencia previa:** versiones de los documentos antes de estos cambios, preservadas en `proyecto/03_resultados/evidencia_pre_od01_04/`.

---

## OD-01 — APROBADA (opción B)

**Decisión:** tres parámetros independientes de anticipación mínima (reservar, reprogramar, cancelar), configurables por el administrador. No asumir valores definitivos sin aprobación humana.
**Justificación:** RF-025 y RN-12 prevén políticas para las tres operaciones; V-02 solo fijó 2 h para reprogramar/cancelar. Un parámetro único impediría políticas diferenciadas.
**Valores aprobados:** 2 h para reprogramar y cancelar (V-02); el de reservar queda **sin valor** hasta aprobación explícita.
**Documentos actualizados:** `reglas_negocio.md` (RN-12, RN-13), `RF.md` (RF-025), `criterios_aceptacion.md` (CA-004, CA-005), `requisitos_datos.md` (entidad Parámetro operativo).

## OD-02 — APROBADA CON MODIFICACIÓN

**Decisión:** restablecimiento conceptual mediante administrador autorizado con: contraseña temporal segura de un solo uso; caducidad configurable; almacenamiento solo con hash seguro; cambio obligatorio al iniciar sesión; entrega por canal seguro definido antes de la implementación; registro de auditoría; prohibición de visualizar o recuperar contraseñas existentes. No implementar aún ni seleccionar tecnologías.
**Justificación:** el correo queda fuera del alcance (V-11), pero RF-029 exigía un mecanismo seguro verificable a nivel de requisito y modelo de datos.
**Documentos actualizados:** `RF.md` (RF-029), `RNF.md` (**RNF-030**, nueva), `criterios_aceptacion.md` (CA-015), `requisitos_datos.md` (entidad de restablecimiento y pendientes).

## OD-03 — APROBADA (opción B)

**Decisión:** eliminar del modelo el atributo de estado de lectura de las notificaciones; conservar solo los atributos requeridos por RF-024/RF-028.
**Justificación:** el campo no estaba aprobado en ningún RF; incluirlo introduciría funcionalidad fuera del alcance.
**Documentos actualizados:** `requisitos_datos.md` (entidad Notificación interna). **Ningún RF modificado.**

## OD-04 — APROBADA (opción C)

**Decisión:** nueva regla de negocio: toda cita debe corresponder a una asociación profesional-servicio válida y activa al crearla y al reprogramarla, respetando integridad e historial.
**Justificación:** RF-006/RF-010 lo suponen pero ninguna RN lo declaraba; sin la regla, la integridad de la reserva quedaría indefinida.
**Documentos actualizados:** `reglas_negocio.md` (**RN-16**, nueva), `RF.md` (RF-012, RF-014, RF-017), `criterios_aceptacion.md` (CA-003, CA-004), `requisitos_datos.md` (asociación con estado activo; integridad RN-16).

---

## Identificadores nuevos incorporados

- RN-16 · RNF-030 (sin eliminaciones; identificadores existentes conservados).

## Fuera de alcance de esta revisión

- Sin SQL, sin migraciones, sin selección de motor de base de datos.
- Sin implementación del mecanismo de restablecimiento ni selección de tecnologías.
- Sin avance al Paso 02 del workflow de base de datos.
