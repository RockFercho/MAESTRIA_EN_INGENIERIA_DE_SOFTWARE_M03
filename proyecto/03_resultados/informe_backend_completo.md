# Informe — Backend completo (workflow 07, CP-FULL-01..10)

**Fecha:** 2026-10-10
**Estado técnico:** COMPLETADO — **aprobado y cerrado formalmente (`HUMAN_STATUS: APPROVED`, 2026-10-10)**
**Stack:** Node.js 22 + Express 4 + mysql2 + node:test, arquitectura hexagonal interna (ADR-001)
**Base de datos:** `gestion_citas_db` (MySQL real, sin migraciones; cuenta de aplicación `app_rw`)
**Código:** `proyecto/06_codigo/`

---

## 1. Resumen

Se implementó el backend completo del Sistema Web de Gestión de Citas y Atención Virtual
dentro del alcance aprobado en el workflow 07: identidad, catálogo con asociaciones
profesional-servicio, agenda y disponibilidad, parámetros operativos, reservas idempotentes
con concurrencia controlada, seguimiento de estados con historial, notificaciones internas
desacopladas (outbox) y auditoría de operaciones críticas.

La verificación final se realizó en dos frentes:

- **Suite automatizada:** 73 pruebas `node:test` en verde (unitarias de dominio y casos de uso
  con persistencia en memoria, más pruebas de integración HTTP del camino feliz y de control de acceso).
- **Verificación E2E contra MySQL real:** script `tools/cp_full_10_verificacion.mjs` que opera
  el servidor vivo por HTTP con la cuenta `app_rw`, cubriendo health, registro, catálogo, agenda,
  disponibilidad, reserva idempotente, concurrencia, máquina de estados, cancelación,
  reprogramación, notificaciones, auditoría y autorización. Traza completa en
  `evidencia_backend_completo/cp_full_10_verificacion_mysql.md`.

La verificación contra la base real fue indispensable: expuso **tres defectos de paridad**
entre la persistencia en memoria (probada) y los adaptadores MySQL (no cubiertos por la suite),
todos detectados, corregidos y re-verificados (sección 5).

---

## 2. Alcance implementado por módulo

| Módulo | Checkpoint | Contenido |
| --- | --- | --- |
| identidad-ext | CP-FULL-02 | Registro público de solicitante (RF-001), login/logout/me con sesión opaca y límite de intentos (RF-002), administración de usuarios y roles (RF-003), CRUD de profesionales con cuenta creada por el administrador (RF-004) |
| asociaciones | CP-FULL-03 | Asociaciones profesional-servicio con duración específica prioritaria (RF-006, RN-04/RN-16) |
| agenda | CP-FULL-04 | Horarios habituales sin solapes por día (RF-007, RN-15) y excepciones por fecha (RF-008) |
| disponibilidad | CP-FULL-05 | Intervalos de 15 min = horario − excepciones − citas activas, con duración efectiva (RF-009..011, CA-002) |
| parametros | CP-FULL-06 | GET/PUT administrativo de tres parámetros independientes (RF-025); 120 min aprobados para reprogramar/cancelar (RN-13) |
| reservas | CP-FULL-07/08 | POST /citas transaccional con `GET_LOCK` por profesional (RN-09), Idempotency-Key obligatoria (RNF-012), reprogramar/cancelar con plazo, justificación y roles (RF-012..019, RN-13/14, CA-003/004/005/007) |
| seguimiento | CP-FULL-09 | Máquina de estados (RF-020/021, RN-08), historial (RF-022), auditoría (RF-026), consulta de citas por rol (RF-016/023) |
| notificaciones | CP-FULL-09 | Outbox atómico con worker; eventos confirmada/reprogramada/cancelada con instantánea (RF-024/028, RNF-017, CA-012) |
| OpenAPI | CP-FULL-10 | `openapi.yaml` con el inventario completo: 28 rutas, esquemas, códigos de error y cabecera `Idempotency-Key` |

### Decisiones de diseño relevantes

- **Idempotency-Key obligatoria** (8–128 caracteres imprimibles) en `POST /citas`,
  `PUT /citas/:id/reprogramar` y `PUT /citas/:id/cancelar`. Reintento con el mismo cuerpo
  devuelve `200 {replique:true}`; con cuerpo distinto, `409 CONFLICTO_IDEMPOTENCIA`.
- **Autorización por propiedad:** el solicitante opera sus citas, el profesional las suyas
  (resueltas vía perfil, no vía `usuario_id`) y el administrador todas.
- **`cita.profesional_id` referencia al perfil profesional**, no al usuario; la resolución
  de propiedad requiere consulta explícita del perfil asignado.
- **Zona horaria:** almacenamiento en UTC; interpretación de horarios y excepciones en
  La Paz (UTC-4) — RNF-028.
- **Notificaciones desacopladas:** el outbox se escribe en la misma transacción de la
  operación; el worker las envía después. Un fallo de notificación solo se loguea (RNF-017).

---

## 3. Matriz de requisitos funcionales

| RF | Requisito | Estado | Evidencia |
| --- | --- | --- | --- |
| RF-001 | Registro de solicitantes | Implementado | Verificación E2E paso 3 (HTTP 201) |
| RF-002 | Autenticación y cierre de sesión | Implementado | E2E pasos 2 y 4; `test/integration/auth.test.js` |
| RF-003 | Roles y permisos por operación | Implementado | E2E paso 19 (401 sin token, 403 por rol); `test/integration/usuarios-profesionales.test.js` |
| RF-004 | Administración de profesionales | Implementado | E2E pasos 6 y 6b; integración |
| RF-005 | Administración de servicios | Implementado | E2E paso 5; `test/integration/servicios.test.js` |
| RF-006 | Asociaciones con duración específica | Implementado | E2E pasos 7 y 10 (duración efectiva) |
| RF-007 | Horarios habituales | Implementado | E2E paso 8; unitarios de agenda |
| RF-008 | Excepciones de disponibilidad | Implementado | Unitarios de agenda (dominio `disponibilidad`) |
| RF-009 | Cálculo de intervalos disponibles | Implementado | E2E paso 10 (39 intervalos con horario 08:00–18:00) |
| RF-010 | Consulta por servicio y fecha | Implementado | E2E paso 10 |
| RF-011 | Exclusión de intervalos con citas activas | Implementado | E2E concurrencia/estados (citas Confirmada/En atención ocupan) |
| RF-012 | Solicitud de cita con asociación activa | Implementado | E2E paso 11 (HTTP 201) |
| RF-013 | Re-verificación de disponibilidad antes de confirmar | Implementado | E2E paso 12 (201/409 en carrera) |
| RF-014 | Rechazo con motivo (ocupado/sin asociación) | Implementado | Códigos `INTERVALO_OCUPADO` y `CONFLICTO_NEGOCIO` |
| RF-015 | Cita confirmada con identificador único | Implementado | E2E paso 11 (id 990016) |
| RF-016 | Consulta de citas propias | Implementado | E2E paso 13 (GET /citas/mias) |
| RF-017 | Reprogramación elegible | Implementado | E2E paso 16 (200, mantiene Confirmada) |
| RF-018 | Cancelación con justificación | Implementado | E2E paso 15 (200) |
| RF-019 | Bloqueo fuera de estado/plazo | Implementado | E2E pasos 14 y 16; códigos `TRANSICION_NO_PERMITIDA` y `FUERA_DE_PLAZO` |
| RF-020 | Estados y transiciones permitidas | Implementado | Dominio `cita.js` (incluye No asistida); E2E paso 14 |
| RF-021 | Actualización de estado por admin/profesional | Implementado | E2E paso 14 |
| RF-022 | Historial de cambios de estado | Implementado | Tabla `historial_cambio_cita`; unitarios de seguimiento |
| RF-023 | Consulta institucional/asignadas con filtros | Implementado | GET /citas con filtros de estado, fecha y profesional |
| RF-024 | Notificaciones internas con instantánea y desacople | Implementado | E2E paso 17 (6 notificaciones con instantánea) |
| RF-025 | Tres parámetros de anticipación independientes | Implementado | E2E pasos 9, 9b, 9c y 9d |
| RF-026 | Auditoría de operaciones críticas | Implementado | E2E paso 18 (16 registros con usuario y resultado) |
| RF-027 | Landing page responsive | **Fuera de alcance** del workflow 07 (fase frontend, workflow 05) | — |
| RF-028 | Consulta de notificaciones por usuario | Implementado | E2E paso 17 |
| RF-029 | Restablecimiento administrativo de contraseñas | **Pendiente de aprobación** de decisiones de seguridad (excluido explícitamente del workflow 07) | — |

---

## 4. Matriz de RNF y criterios de aceptación

| Elemento | Estado | Observación |
| --- | --- | --- |
| RNF-001 (TLS en producción) | Fuera de alcance de este checkpoint | Requiere entorno de despliegue; la app expone endpoints HTTP locales |
| RNF-002 (hash adaptativo con sal) | Implementado | scrypt con parámetros N/R/P y sal por contraseña (`src/shared/security/passwords.js`) |
| RNF-003 (validación en servidor) | Implementado | E2E paso 19; validadores de dominio en cada entrada |
| RNF-004 (secretos fuera del repo) | Cumplido | Credenciales solo en `.env` local; ningún log o evidencia contiene secretos |
| RNF-005 (validación de entradas) | Implementado | Parseadores de dominio; 400 `VALIDATION_ERROR` verificados |
| RNF-006..009 (rendimiento y carga) | **No verificado** | Requiere `perfil_carga.md` y herramienta de carga; pendiente explícito |
| RNF-010 (concurrencia sin reservas incompatibles) | Implementado y verificado | E2E paso 12: 201/409 sobre el mismo intervalo |
| RNF-011 (consistencia transaccional) | Implementado | Transacción ACID + `GET_LOCK` por profesional (`src/shared/db/transaccional.js`) |
| RNF-012 (sin duplicados por reintento) | Implementado y verificado | E2E pasos 11 y 11b: 201 y luego 200 `replique:true` con la misma clave |
| RNF-013 (trazabilidad de operaciones críticas) | Implementado | E2E paso 18 |
| RNF-014..016 (disponibilidad 99,5 %, respaldos, restauración) | **Fuera de alcance** | Requiere infraestructura y operación; sin despliegue aprobado |
| RNF-017 (fallos de notificación no invalidan reservas) | Implementado | Outbox atómico + despacho posterior; fallo solo logueado |
| RNF-022 (separación de capas) | Cumplido | Hexagonal: dominio / aplicación / adaptadores (HTTP y persistencia) |
| RNF-023 (ejecución en Linux) | Cumplido | Verificado en el entorno del estudiante (Linux) |
| RNF-024 (contenedores y configuración externa) | **Pendiente** | Configuración externa existe (`.env`); contenedores no aprobados aún |
| RNF-025 (pruebas automatizadas) | Cumplido | 73/73 en verde (`evidencia_backend_completo/npm_test_73_de_73.txt`) |
| RNF-026 (logs sin secretos) | Cumplido | Errores logueados sin credenciales; validado en revisión |
| RNF-027 (métricas) | **Pendiente** | Sin colector de métricas en el alcance actual |
| RNF-028 (UTC + America/La_Paz) | Implementado | `src/shared/time/lapaz.js`; corregido en esta fase (sección 5) |
| RNF-029 (política de contraseñas) | Implementado | Mínimo 12 y máximo 200 caracteres, sin reglas arbitrarias; login con límite de intentos y mensaje genérico |
| RNF-030 (restablecimiento) | **Pendiente** | Ligado a RF-029 |
| CA-001 | Implementado | Registro 201 y correo duplicado 409 verificados |
| CA-002 | Implementado | E2E pasos 7, 8 y 10 (duración efectiva, horario, excepciones) |
| CA-003 | Implementado | E2E pasos 11, 11b y 12 |
| CA-004 | Implementado | E2E paso 16 |
| CA-005 | Implementado | E2E paso 15 |
| CA-006 | Implementado | E2E pasos 14 y 18 |
| CA-007 | Implementado | E2E pasos 11b y 12 |
| CA-008 | **No verificado** | Requiere perfil de carga aprobado |
| CA-009 | Implementado | E2E pasos 2, 3, 19; scrypt y rate limit |
| CA-010/CA-011 | Fuera de alcance (frontend) | Workflow 05 |
| CA-012 | Implementado | E2E paso 17 |
| CA-013 | Fuera de alcance | Operación e infraestructura |
| CA-014 | Implementado (backend) | E2E: `inicio_local` en notificaciones; almacenamiento en UTC |
| CA-015 | Parcial | Política de contraseñas y rate limit implementados; restablecimiento pendiente (RF-029) |

---

## 5. Defectos detectados por la verificación contra MySQL real

La suite automatizada usa persistencia en memoria; la verificación E2E contra la base real
detectó tres defectos de paridad. Todos fueron corregados y re-verificados:

1. **Disponibilidad vacía en MySQL.** `minutosDesdeMedianoche` solo admitía `HH:MM`, pero
   MySQL devuelve `TIME` como `HH:MM:SS`; todo horario se descartaba y el sistema devolvía
   cero intervalos libres, bloqueando las reservas. Corregido en
   `src/shared/time/lapaz.js` (acepta segundos opcionales).
2. **Auditoría rechazada en toda reserva.** `MysqlAuditoriaRepository` enlazaba
   `datos.ahora`, pero los cuatro puntos de inserción envían `fecha_hora_utc`; el parámetro
   llegaba `undefined` y la transacción completa fallaba con `500 DB_ERROR`. Corregido en
   `src/modules/reservas/adapters/persistence/reservas-repository-mysql.js`.
3. **Día de semana calculado en UTC.** El script de verificación y los fixtures usaban
   `getUTCDay()` desalineado con La Paz (UTC-4); un horario podía registrarse para el día
   equivocado. Corregido derivando fecha y día en horario local.

Lección de proceso para próximas fases: los adaptadores MySQL requieren verificación
directa contra la base; la paridad con la persistencia en memoria no está garantizada por
la suite actual.

---

## 6. Parámetros operativos vigentes

| Parámetro | Valor | Origen |
| --- | --- | --- |
| `anticipacion_reprogramar` | 120 min | Aprobado en RN-13 |
| `anticipacion_cancelar` | 120 min | Aprobado en RN-13 |
| `anticipacion_reservar` | 60 min | **Valor inicial aprobado y confirmado en el cierre formal (2026-10-10)** por el responsable; sustituye la propuesta anterior de 120 min. RN-12/RF-025 exigen aprobación previa: antes de esta, el sistema rechazaba correctamente toda reserva con `409 POLITICA_NO_CONFIGURADA` (evidencia `cp_full_10_rn12_preaprobacion.md`). Verificado en BD: los tres parámetros son filas y claves independientes |

---

## 7. Cómo reproducir la verificación

```bash
cd proyecto/06_codigo
npm test                          # 73 pruebas
node src/server.js                # servidor en 127.0.0.1:3001 (requiere .env con DB_*)
node tools/cp_full_10_verificacion.mjs   # verificación E2E (usa admin@citas.demo)
```

El script es idempotente: reutiliza fixtures existentes, registra un solicitante único por
corrida y usa Idempotency-Key sufijadas por corrida. La limpieza de fixtures requiere la
cuenta `devcode` (la cuenta `app_rw` no tiene permisos `DELETE`).

---

## 8. Pendientes y decisiones requeridas

1. ~~Aprobación humana de CP-FULL-02..10~~ — **Cerrado el 2026-10-10** (`HUMAN_STATUS: APPROVED`).
2. **RF-029 / RNF-030:** restablecimiento administrativo de contraseñas — requiere definición
   del canal seguro antes de implementar.
3. **CA-008 / RNF-006..009:** pruebas de rendimiento según `perfil_carga.md`.
4. **RNF-024:** contenedores (Docker) y separación de configuración por entorno.
5. **RNF-014..016 y RNF-027:** supervisión, respaldos y métricas (etapa de despliegue).
6. **RF-027 / CA-010 / CA-011:** landing page y usabilidad — workflow 05 (frontend).

---

## 9. Cierre formal del backend

**Fecha:** 2026-10-10
**Decisión:** `HUMAN_STATUS: APPROVED` — cierre del workflow 07 y del backend completo.

Confirmado por el responsable del proyecto:

- **Valor inicial de `anticipacion_reservar = 60 minutos`** (RN-12/RF-025), sustituyendo la
  propuesta anterior de 120 min para reservar. Requería aprobación explícita previa a su
  activación; antes de esta, el sistema rechazaba correctamente toda reserva en línea con
  `409 POLITICA_NO_CONFIGURADA` (evidencia `cp_full_10_rn12_preaprobacion.md`).
- **Los tres parámetros operativos son independientes** (uno por operación reservar /
  reprogramar / cancelar), cada uno en su propia fila y clave en `parametro_operativo`:
  reservar 60 min, reprogramar 120 min (RN-13), cancelar 120 min (RN-13).
- **CP-FULL-01 a CP-FULL-10** figuran como completados, sustentados por sus evidencias
  (suite 73/73 y verificación E2E contra MySQL real).
- **73 pruebas automatizadas en verde** y **integración real con MySQL verificada** por
  script E2E (no se repitieron pruebas con evidencia válida).
- **Informe final y OpenAPI actualizados** (28 rutas, decisiones y matrices RF/RNF/CA).

Funcionalidades implementadas, limitaciones y pendientes quedan registrados en las
secciones 3, 4 y 8 de este informe. No se generaron nuevas funcionalidades, no se modificó
el esquema de MySQL, no se ejecutaron migraciones y no se abrieron nuevos workflows durante
este cierre.
