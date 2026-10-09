# Informe de compatibilidad — MySQL 8.0.46 / InnoDB (D-06-R1)

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Workflow:** `02_database_workflow` — soporte de la enmienda humana **D-06-R1** (versión objetivo 8.0.46 en lugar de 8.4 LTS).
**Fecha:** 9 de octubre de 2026 · **Revisión técnica final previa al Paso 15** (iteración 2, tras observaciones del responsable).

## 0. Alcance del método — distinción obligatoria (observación 1)

| Tipo de verificación | Qué cubre | Método | Estado |
|---|---|---|---|
| **Compatibilidad DOCUMENTAL** | Que cada tipo, restricción, sintaxis y opción usada por el diseño exista y esté soportada en 8.0.46 según la documentación oficial | Revisión de Refman 8.0, notas de versión 8.0.x y fuentes secundarias; **sin ejecutar SQL** | **Realizada** (§1) |
| **Validación EMPÍRICA** | Que las expresiones SQL concretas se acepten y se comporten como se espera en el servidor 8.0.46 real | Requiere crear objetos y realizar inserciones de prueba | **PENDIENTE de ejecución** (§6) — sólo con autorización (Pasos 15/17/18) |

> **Precisión:** este informe **no declara compatibilidad total**. Declara **compatibilidad documental completa** (sin incompatibilidades identificadas por revisión de fuentes) y **lista cerrada de validaciones empíricas pendientes**. Ninguna conclusión de este informe sustituye la prueba en servidor.

## 1. Compatibilidad documental (construcciones del diseño vs 8.0.46)

| # | Construcción (origen) | Requisito de versión | Soporte documental | Validación empírica |
|---|---|---|---|---|
| 1 | `INT AUTO_INCREMENT`, `VARCHAR(n)`, `TEXT/MEDIUMTEXT`, `TIME`, `DATE`, `DATETIME(3)` | 5.6.4+ | ✅ | no requerida (tipos) |
| 2 | `utf8mb4` + `utf8mb4_0900_ai_ci` | 8.0.1+ | ✅ | no requerida |
| 3 | `STRICT_TRANS_TABLES`, `NO_ZERO_DATE`, `ERROR_FOR_DIVISION_BY_ZERO`, `NO_ENGINE_SUBSTITUTION` | defaults 8.0 | ✅ | verificación de `sql_mode` al ejecutar |
| 4 | **CHK con `IN (…)` y comparaciones** (dominios de T1–T14) | CHECK efectivo **8.0.16+** | ✅ | **pendiente** (§6.c) |
| 5 | **CHK con nulidades condicionales** (`IS NULL`/`IS NOT NULL`, ∨, ∧) (T2, T4, T6, T8) | 8.0.16+; operadores permitidos | ✅ | **pendiente** (§6.c) |
| 6 | **CHK transversal D-05a**: `fin_utc = inicio_utc + INTERVAL duracion_efectiva_min MINUTE` (T7) | 8.0.16+; `INTERVAL` es **operador** de expresión → permitido ("operators are permitted") | ✅ con reserva: el manual no enumera operadores uno a uno | **pendiente — prioridad alta** (§6.a, §2.2) |
| 7 | **Índice único funcional E2** `IFNULL/CONCAT` sobre T6 (D-05b) | functional key parts **8.0.13+**; `UNIQUE` soportado con key parts funcionales | ✅ | **pendiente — prioridad alta** (§6.b, §2.3) |
| 8 | FK `ON DELETE RESTRICT` (18/18), PK compuesta (T4), PK naturales (T11/T12) | InnoDB 8.0 | ✅ | verificación de integridad al ejecutar |
| 9 | Transacciones InnoDB **REPEATABLE READ**, `SELECT … FOR UPDATE`, bloqueo por fila/gap | InnoDB 8.0 | ✅ | pruebas de concurrencia (Paso 19) |
| 10 | Errores **1213**/**1205** con reintento + backoff + jitter (Paso 12) | InnoDB 8.0 | ✅ | pruebas de concurrencia (Paso 19) |
| 11 | Idempotencia T12: PK única + `<=>` + `IFNULL` | desde 4.x | ✅ | **pendiente** (§6.c) |
| 12 | `caching_sha2_password`, `require_secure_transport`, `local_infile=OFF`, binlog/PITR | 8.0/5.7+ | ✅ | verificación de configuración al desplegar |
| 13 | Append-only T8/T9 por privilegios (`GRANT`) | permisos 8.0 | ✅ | verificación de privilegios al desplegar |

**Fuentes:** Refman 8.0 §15.1.20.6 (CHECK: "Literals, **deterministic built-in functions, and operators** are permitted; stored functions, variables, subqueries y columnas `AUTO_INCREMENT`/de otras tablas no") · §15.1.15 (functional key parts 8.0.13+, `UNIQUE` soportado) · notas de versión 8.0.x.

## 2. Análisis técnicos solicitados

### 2.1 Semántica NULL en CHECK (contexto)
MySQL viola un CHECK **sólo si evalúa a FALSE**; `UNKNOWN` (NULL) **no** lo viola — igual en 8.0 y 8.4. Todas nuestras restricciones condicionales están escritas como booleanos explícitos (`(a IS NULL AND b IS NULL) OR (a IS NOT NULL AND b IS NOT NULL AND …)`) → no dependen del NULL tácito. Además, todas las columnas que participan en CHECK de dominio/intervalo son `NN` o su nulidad está controlada por la propia fórmula.

### 2.2 CHK transversal de duración (observación 2) — expresión prevista y limitaciones en 8.0.46

**Expresión prevista** (única unidad condicional del plan: migración `0004`), sobre `T7 cita`:

```
CHECK (fin_utc = inicio_utc + INTERVAL duracion_efectiva_min MINUTE)
```

| # | Limitación / condición en MySQL 8.0.46 | Evaluación |
|---|---|---|
| L1 | CHECK sólo es efectivo desde **8.0.16** | ✅ cumplido por 8.0.46 |
| L2 | Sólo se permiten literales, **funciones deterministas** y **operadores**; prohibidos subconsultas, funciones almacenadas/cargables, variables, columnas `AUTO_INCREMENT` o de otras tablas | ✅ la expresión usa sólo operadores (`+`, `=`, `INTERVAL`) sobre 3 columnas base de la misma fila, ninguna `AUTO_INCREMENT` |
| L3 | El manual **no enumera explícitamente** el operador `INTERVAL` entre los operadores admitidos en CHECK | ⚠️ **fundamento documental indirecto** (causa de la verificación pendiente §6.a) |
| L4 | Sin columnas `NULL` en la expresión → el resultado **nunca es UNKNOWN** → no hay "pase silencioso" por NULL | ✅ las tres columnas son `NN` |
| L5 | Aritmética `DATETIME(3) + INTERVAL n MINUTE` **conserva los milisegundos** de `inicio_utc` → la igualdad exige que `fin_utc` tenga idéntica fracción; la capa de servicio calcula `fin := inicio + duración` → coherente; un `fin` truncado a minuto con `inicio` con ms **violaría** el CHK (comportamiento deseado) | ✅ con alineación de minutos (diseño) |
| L6 | La evaluación usa el **`sql_mode` de la sesión** → configurar `STRICT_TRANS_TABLES…` globalmente por entorno para evitar divergencias | ✅ previsto (Paso 09) |
| L7 | MySQL **no admite CHECK diferidos** (se evalúan en `INSERT`/`UPDATE`/`REPLACE`); no hay constraints diferidas | ✅ coherente con escritura atómica en transacción (Paso 12) |
| L8 | Si el parser rechazara `INTERVAL` en CHECK (riesgo residual L3) | **Plan de contingencia ya aprobado (D-05a):** unidad `0004` se omite; la **garantía obligatoria** queda en capa de servicio (reglas 1–3 de D-05a: escritura atómica, reprogramación atómica, detección vía T8) — el CHK era refuerzo, nunca única defensa. Sin pérdida de corrección |

**Veredicto 2.2:** apta para 8.0.46 **con validación empírica pendiente** (§6.a); contingencia definida (L8).

### 2.3 Índice único funcional E2 — demostración de ausencia de colisiones y de rechazo de duplicados (observación 3)

**Expresión prevista** (migración `0003`, sobre `T6 excepcion_disponibilidad`):

```
UNIQUE ((CONCAT(profesional_id, '|', fecha, '|', tipo, '|',
                IFNULL(hora_inicio, 'D'), '|', IFNULL(hora_fin, 'D'))))
```

Propiedades demostradas (por estructura de los datos, no por prueba de servidor):

1. **Nunca evalúa a NULL** → el UNIQUE se aplica a **todas** las filas (si evalúa a NULL, MySQL considera los NULL distintos y el índice no detectaría nada — ése era el problema del UNIQUE clásico). Base: `profesional_id`, `fecha`, `tipo` son `NN`; los dos `TIME` opcionales están envueltos en `IFNULL`. `CONCAT` sin argumentos NULL → resultado no NULL. ✔
2. **Inyectividad — sin colisiones entre valores distintos:** cada componente tiene formato cerrado **sin el separador `|`**:
   - `profesional_id` → dígitos decimales (`INT`);
   - `fecha` → `AAAA-MM-DD` (dígitos y guiones);
   - `tipo` → catálogo cerrado `ausencia|feriado|bloqueo` (validado por CHK; letras minúsculas);
   - `hora_*` → `HH:MM:SS` (texto de `TIME`) o centinela `D`.
   
   Ningún componente puede contener `|` → los límites de campo son recuperables de forma única → **dos tuplas distintas producen necesariamente cadenas distintas** (falso positivo de unicidad: **imposible**).
3. **Centinela `D` sin ambigüedad:** todo `TIME` se serializa como `\d{2}:\d{2}:\d{2}(.mmm)?`; la cadena `D` no es un serial de `TIME` → `(NULL,NULL)` ("jornada completa") nunca colisiona con un rango real, y viceversa. ✔
4. **Duplicados que deben rechazarse SÍ se rechazan:** duplicado exacto de la 5-tupla —incluido el caso `(NULL, NULL)`— → misma cadena → error de duplicado del índice. ✔ (refuerzo de la capa 1 transaccional con `<=>`, §3 de `integridad.md`)
5. **Duplicados que NO deben rechazarse NO se rechazan:** tuplas que difieren en cualquier campo → cadenas distintas → permitidas; los solapamientos legítimos de rangos distintos (D-05b: **no prohibidos**) tienen horas distintas → claves distintas → permitidos. ✔
6. **Colación `utf8mb4_0900_ai_ci` (sensible a mayúsculas):** los componentes son dígitos, guiones, dos puntos y literales minúsculos del catálogo → no existe variación de mayúsculas/acentos entre valores **semánticamente distintos**; una eventual escritura `AUSENCIA` vs `ausencia` es el **mismo** tipo (CHK `IN` la acepta por colación) y el índice la trataría como duplicado — **correcto**, y **consistente** con la capa 1 (`<=>` usa la misma colación → ambas capas concuerdan). ✔
7. **Implementación 8.0.46:** las key parts funcionales se implementan como columnas generadas virtuales ocultas → la expresión debe ser determinista (`CONCAT`/`IFNULL` lo son) ✔ · `UNIQUE` soportado ✔ · **no puede formar parte de PK** (el índice es secundario independiente; T6 tiene PK `id`) ✔ · cuenta para el límite de columnas (T6 usa ~7 de 1017) ✔ · orden de DDL: retirar el índice antes de eliminar columnas referenciadas (gestionado en el plan de migraciones).
8. **No introduce colisiones, no admite duplicados rechazables, no rechaza válidos** → propiedad satisfecha **por diseño**; queda la **confirmación empírica** (§6.b).

**Veredicto 2.3:** sin defectos de diseño identificados; validación empírica pendiente (§6.b).

### 2.4 Restricciones FK↔CHECK de MySQL (verificación de conflicto)
Refman 8.0 §15.1.20.6: las acciones referenciales (`ON UPDATE/ON DELETE`) están prohibidas en columnas usadas en CHECK, y viceversa. **Revisado:** ningún CHECK de las 27 restricciones referencia columnas FK (los CHK usan estados, roles, intervalos y tipos; las FK son identificadores), y las 18 FK usan exclusivamente `RESTRICT`. **Sin conflicto.** ✔

## 3. Coherencia de restricciones — conteos verificados (observación 4)

| Elemento | Conteo verificado | Desglose | Coherencia lógico↔físico |
|---|---|---|---|
| **Claves foráneas** | **18** (la cifra "20" anterior era errónea; corregida en `integridad.md`, `revision_dba.md`, `plan_migraciones.md`) | →T1: 8 · →T2: 4 · →T3: 2 · →T7: 4; **16 NN + 2 NULL** (T9.cita_id, T13.cita_id) | ✅ desglose idéntico en ambos modelos |
| **CHECK declarativos** | **27** en filas de tabla | T1:2 · T2:2 · T3:2 · T4:3 · T5:2 · T6:2 · T7:3 · T8:3 · T9:1 · T10:1 · T11:0 · T12:2 · T13:3 · T14:1 | ✅ **27 = 27, correspondencia 1:1 por tabla** |
| **Cifra "39"** | = **líneas** de `modelo_logico.md` que mencionan CHK/CHECK (narrativa §4–§7 + tablas de trazabilidad + declarativas) — **no** es un número de restricciones | — | aclarado |
| Fuera de las 27 | T9.tipo_operacion **sin CHECK** (L-04, 5 valores, app) · T12.tipo_operacion **con CHECK** (3 valores — columna distinta, coherente en ambos modelos) · T9.contexto (validación transaccional, no expressable) · CHK transversal (D-05a, **condicional**) | — | ✅ documentado |

## 4. Construcciones previstas para 8.4 incompatibles con 8.0.46

**Ninguna.** La revisión de los Pasos 06–14 halló únicamente **referencias de etiqueta** a "8.4 LTS" (actualizadas a 8.0.46). No se usó ninguna función, tipo, sintaxis u opción exclusiva de 8.1–8.4. Diferencias conocidas 8.0↔8.4 ajenas al diseño (`default_authentication_plugin` eliminado en 8.4; `innodb_log_file_size`→`innodb_redo_log_capacity`) no aparecen en nuestros documentos; la autenticación se documenta con `caching_sha2_password` explícito (válido en ambas).

## 5. Observación de ciclo de vida (registrada, no bloqueante)
MySQL **8.0.46** es la última entrega de la serie 8.0 y desde el **21 de abril de 2026** la serie está en **EoL / Oracle Sustaining Support** (la 8.4 LTS permanece con soporte activo). La decisión **D-06-R1 se mantiene aprobada tal cual**; clasificada como *pendiente de análisis humano* (AGENTS §14), sin efecto sobre la compatibilidad técnica.

## 6. Validaciones empíricas PENDIENTES de ejecución (todas requieren autorización; ninguna ejecutada)

| ID | Validación | Dónde se ejecutará | Criterio de aceptación |
|---|---|---|---|
| **§6.a** | CHK transversal `fin_utc = inicio_utc + INTERVAL duracion_efectiva_min MINUTE` | Paso 15/17 (crear T7 + INSERT que viole y uno que cumpla) | Se acepta el cumplido; **rechaza** el violado (error 3819). Si el parser la rechaza → unidad 0004 omitida (contingencia L8) |
| **§6.b** | Índice único funcional E2 (`IFNULL/CONCAT`) | Paso 15/17 (crear índice + INSERT de duplicado exacto, incl. jornada completa `(NULL,NULL)`, y de rangos solapados distintos) | Rechaza duplicado exacto (incl. ambos NULL); **permite** solapamiento de rangos distintos |
| **§6.c** | CHECK con `IN`, nulidades condicionales y `<=>`/idempotencia T12 | Paso 17/18 | Dominios rechazados fuera de catálogo; NULLs condicionales correctos; duplicado de `clave` rechazado |
| **§6.d** | EXPLAIN/EXPLAIN ANALYZE de P1–P12 con datos de prueba | Paso 19 | Sin full scan no justificado; p95 conforme a RNF-006/007 |

## 7. Conclusión

1. **Compatibilidad documental completa** con MySQL 8.0.46/InnoDB (§1); **sin incompatibilidades identificadas**; ninguna construcción exclusiva de 8.4 (§4).
2. **Validación empírica NO realizada** — lista cerrada en §6 (§6.a y §6.b son las de prioridad alta).
3. Conteos de restricciones **corregidos y coherentes: 18 FK / 27 CHECK** (§3).
4. Sin instalaciones, sin SQL, sin migraciones, sin código; requisitos, decisiones arquitectónicas y evidencias históricas intactos.
5. **Observaciones bloqueantes: NINGUNA de compatibilidad.** El Paso 15 sigue **bloqueado** por autorización humana: **`HUMAN_STATUS: PENDING_STEP_15_APPROVAL`**.
