# Seguridad de la base de datos — MySQL 8.0.46 / InnoDB — Paso 09

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — Paso 09 (Seguridad), motor D-06/D-06-R1 (MySQL 8.0.46/InnoDB).
**Skills:** `databases` · **Fecha:** 9 de octubre de 2026.
**Entradas:** RNF-001…005, RNF-026, RNF-029/030, RNF-003, `restricciones.md`, `modelo_fisico.md`, `integridad.md`.
**Restricción:** diseño documental **sin SQL ejecutable, sin credenciales reales, sin instalación**. Credenciales sólo por variables de entorno (RNF-004).

## 1. Principios aplicados

| Principio | Origen | Aplicación MySQL |
|---|---|---|
| Credenciales/secretos fuera del código y del repositorio | RNF-004, restricciones.md | Contraseña de BD sólo en `.env`/orquestador de contenedores (RNF-024); **nunca** en scripts, reportes ni commits |
| Validación e identidad en el servidor | RNF-003, RNF-005 | El servidor de aplicación valida identidad/permisos y sanitiza entradas antes de tocar la BD; la BD no expone lógica de negocio |
| Contraseñas de usuarios: sólo hash adaptativo con sal | RNF-002, RNF-029 | Hash **en la aplicación** (p. ej. argon2id/bcrypt); la BD almacena `hash_contrasena`/`hash_temporal` como `VARCHAR(255)` — nunca texto plano ni recuperable (RF-029) |
| Sin secretos en logs/auditoría | RNF-026, RNF-030 | `contexto` de T9 y logs de MySQL sin contraseñas/tokens; validación de contenido en aplicación |
| Comunicaciones cifradas | RNF-001 | Cliente↔servidor con TLS; en MySQL: `require_secure_transport = ON` y certificados por entorno |
| Mínimo privilegio | AGENTS §12 | Usuarios dedicados con grants por operación (§2) |
| Separación por entorno | RNF-024, AGENTS §12 | Base de datos y usuarios distintos por entorno (dev/test/prod), configuración externa |

## 2. Modelo de cuentas y privilegios (diseño)

| Cuenta | Uso | Privilegios sobre las 14 tablas | Notas |
|---|---|---|---|
| **`app_rw`** (aplicación) | Operación normal | **SELECT** (todas) · **INSERT** (T1–T7, T10–T14) · **UPDATE** (T1–T7, T10–T14) · **DELETE** sólo donde el modelo lo requiere (T12 limpieza de caducadas; **nunca** T8/T9/T13-histórico) | **Sin DDL** (CREATE/ALTER/DROP), **sin GRANT**, **sin FILE/SUPER/PROCESS** |
| **`app_append`** (o rol equivalente sobre app_rw) | T8 y T9 | **Sólo INSERT + SELECT** en `historial_cambio_cita` y `auditoria_operacion` — **sin UPDATE ni DELETE** | Garantiza **append-only** (RN-10/RN-11) en el motor, no sólo en la aplicación |
| **`app_outbox`** | Consumidor del outbox | SELECT general + **UPDATE limitado a `estado`/`intentos`/`procesado_utc` de T13** + INSERT de T13 en la transacción de negocio (puede compartir `app_rw` con control de columnas en la capa de servicio) | RNF-017 sin ampliar privilegios |
| **`backup_ro`** | Respaldos/verificación (RNF-015/016) | SELECT sobre todo | Sólo red interna |
| **`migrador`** | DDL de migraciones (Pasos 15/17, **con autorización**) | DDL sobre el esquema del proyecto | Uso **puntual y auditado**; nunca la aplicación |
| **`root`/`mysql.sys`** | Administración | — | **Nunca** usada por la aplicación; deshabilitada/omitida en configuración |

Todas las cuentas: autenticación **`caching_sha2_password`** (autenticador por defecto de la serie 8.0, incluida 8.0.46; declararlo explícitamente al crear cuentas; `mysql_native_password` sigue disponible en 8.0 pero desaconsejado), contraseña fuerte por entorno, rotación documentada.

## 3. Endurecimiento del servidor MySQL (checklist de configuración)

- `sql_mode` = `STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION` (evita corrupción silenciosa — regla del skill).
- `require_secure_transport = ON`; TLS 1.2+ (RNF-001); cifrado en reposo según capacidad del entorno (al menos cifrado de disco del contenedor/volumen).
- `default_authentication_plugin`/usuarios con `caching_sha2_password`; sin contraseñas por defecto.
- Bind a red interna del contenedor (sin exposición pública directa de 3306; acceso sólo desde la red del servicio — ADR-001 monolito).
- `local_infile = OFF`; sin `FILE` privilegies; logs sin datos sensibles (RNF-026).
- Charset/collation globales `utf8mb4` (coherencia con §1 de `modelo_fisico.md`).
- Auditoría de acceso a BD: binario de transacciones habilitado para respaldo/PITR (RNF-015) + logs de errores (RNF-026/027).
- Backup: diario con retención ≥ 7 días (RNF-015) y **prueba de restauración** periódica en entorno separado (RNF-016).

## 4. Controles de aplicación vinculados (RNF-002/029/030, OD-02)

- Hash de contraseñas y contraseñas temporales: sólo en capa de servicio; T14 guarda hash + caducidad + estado (un solo uso, cambio obligatorio).
- **OD-02 pendiente:** canal seguro de entrega de contraseñas temporales — definir antes de implementar (no bloquea este paso).
- Limitación de intentos y mensajes genéricos (RNF-029) → capa de servidor, no BD.
- Rate limiting/límites de conexión: pool de aplicaciones ajustado (Paso 11/12) — la BD no debe recibir conexiones directas de clientes.

## 5. Verificaciones

1. Sin credenciales, contraseñas ni valores reales en el documento; sin SQL ejecutable; sin instalación ni despliegue.
2. RNF-001…005, RNF-026, RNF-029/030 y restricciones de secretos mapeados a controles concretos (§1–§4).
3. Append-only de T8/T9 traducido a **privilegios de motor** (§2), complementando D-05c.
4. Modelos y requisitos intactos; preflight **resuelto** (D-06-R1: local = objetivo = 8.0.46); compatibilidad de opciones de endurecimiento en `15_reportes/compatibilidad_mysql_8046.md`.

**Estado:** elaborado — agrupado con Pasos 07–14; checkpoint de SQL al final.
