# Decisiones humanas — Paso 04 (Modelo lógico), observaciones L-01 a L-04

**Proyecto:** Sistema Web de Gestión de Citas y Atención Virtual
**Fecha:** 8 de octubre de 2026
**Origen:** revisión humana de las observaciones del Paso 04 (`proyecto/05_base_datos/03_modelo_logico/modelo_logico.md` §7).
**Estado:** 3 aprobadas, 1 diferida (L-03 → Paso 12).
**Evidencia previa:** `proyecto/03_resultados/evidencia_pre_l01_l04/`.
**Alcance de los cambios:** exclusivamente `modelo_logico.md`. Sin cambios en requisitos (RF/RNF/RN/CA), ni en los documentos aprobados de los Pasos 02/03, ni en las 14 entidades. Sin SQL, sin motor.

---

## L-01 — APROBADA — Múltiples intervalos de horario por día

**Decisión:** permitir múltiples intervalos de atención por profesional y día de la semana; impedir intervalos inválidos o superpuestos para el mismo profesional; documentar qué restricciones son declarativas y cuáles transaccionales.
**Aplicación en `modelo_logico.md`:**
- **Declarativos (§2 T5):** `CHK[hora_fin > hora_inicio]` por fila; `UNIQUE(profesional_id, dia_semana, hora_inicio)` de deduplicación exacta.
- **Transaccionales (§5):** impedir **superposición entre intervalos** del mismo profesional/día (comparación entre filas, sin restricción estándar agnóstica de motor → Paso 12 + backend).
**Justificación:** RF-007 no restringe a un intervalo por día (jornada mañana/tarde es legítima); la superposición sería redundante/conflictiva con RN-05 (disponibilidad). Se conserva la coherencia con RN-15 (hora local).
**Trazabilidad:** RF-007, RN-05, RN-15, CA-002.

## L-02 — APROBADA CON PRECISIÓN — Auditoría del restablecimiento y R17

**Decisión:** mantener la auditoría obligatoria del restablecimiento; **antes de introducir R17, verificar si las relaciones aprobadas cumplen el requisito sin duplicar información**; si R17 es necesaria, presentar la modificación para autorización específica; no modificar unilateralmente los documentos del Paso 03.
**Verificación realizada:**
1. **RF-026/RNF-013 se cumplen sin R17:** toda operación de restablecimiento genera fila obligatoria en T9 (`tipo_operacion = restablecimiento_password`, usuario, fecha, resultado) escrita en la misma transacción → regla transaccional (§5).
2. **Sin duplicación de información:** la fila de T9 ya contiene usuario/fecha/resultado; una relación R17 no añadiría dato nuevo, solo integridad referencial declarativa del enlace.
3. **Enlace reset ↔ auditoría:** el atributo conceptual aprobado *referencia de auditoría* (E14) se mapea en T14.`auditoria_ref` como **columna referencia lógica NULL, sin FK**; la integridad del enlace se verifica en la transacción de reset (Paso 07+).
**Conclusión:** **R17 NO necesaria** para cumplir el requisito → los documentos aprobados del Paso 03 **no se modifican**.
**Opción B (requiere autorización futura, no aplicada):** formalizar `restablecimiento_contrasena.auditoria_ref → auditoria_operacion` como **R17** (FK nullable) añadiéndola a §3 de `modelo_conceptual.md` y a `diagrama_er.md`. Se presenta por escrito; no se ejecuta sin decisión humana específica.
**Trazabilidad:** RF-026, RNF-013, RF-029, RNF-030, CA-015.

## L-03 — DIFERIDA — Caducidad de claves de idempotencia

**Decisión:** mantener el TTL de `clave_idempotencia` como **decisión técnica pendiente para el Paso 12**; **no establecer TTL arbitrario**; documentar que la expiración **no debe comprometer la prevención de reservas duplicadas**.
**Aplicación en `modelo_logico.md` (§2 T12, §5, §7):** columna `caduca_utc` NOT NULL con `CHK[caduca_utc > creada_utc]` (forma, sin valor); la política de expiración queda registrada en §5 con la condición de que la ventana de expiración sea **≥ ventana máxima de reintentos** del cliente, de modo que un reintento tardío nunca duplique una reserva (CA-007/RNF-012).
**Justificación:** el valor depende de patrones de reintento reales (Pasos 11/12) y de la estrategia de concurrencia; fijarlo ahora sería una suposición.
**Trazabilidad:** RNF-012, CA-007, RN-09.

## L-04 — APROBADA — Catálogo lógico de tipos de operación

**Decisión:** usar un **catálogo lógico controlado y extensible** de tipos de operación; valores iniciales **exclusivamente** de operaciones respaldadas por requisitos aprobados; sin funcionalidades nuevas.
**Aplicación en `modelo_logico.md` (§2, fin):** catálogo documentado **sin tabla nueva** (se conservan las 14 entidades). Valores iniciales y su respaldo:
| Valor | Respaldo en requisitos |
|---|---|
| `reserva` | RF-012…RF-016, RN-09 |
| `reprogramacion` | RF-016, RF-021, RN-10 |
| `cancelacion` | RF-016, RF-021, RN-06 |
| `cambio_estado` | RN-08, RF-021, CA-006 |
| `restablecimiento_password` | RF-029, RNF-030, CA-015 |

Los usa T9 (los 5) y T12 (subconjunto `reserva|reprogramacion|cancelacion` — operaciones idempotentes según RNF-012). La **extensión** del catálogo exige un requisito aprobado (control de cambios); no añade funcionalidad por sí misma.
**Justificación:** coincide con el dominio ya descrito en la E9 conceptual aprobada; evita tanto el CHECK rígido como una tabla de catálogo que excedería las 14 entidades.
**Trazabilidad:** RF-026, RNF-013, RNF-012.

---

## Verificación de no contradicción (instrucción 7)

- **Sin contradicciones detectadas:** L-01 refuerza RN-05; L-02 conserva RF-026 sin tocar el Paso 03; L-03 respeta "no asumir valores" (OD-01); L-04 reproduce el dominio conceptual ya aprobado.
- **14 entidades intactas · R1–R16 intactas · requisitos sin modificar · ADR-001 sin afectar** (todo dentro de la única BD relacional).
- **Requiere aprobación adicional (pendiente, no ejecutada):** únicamente la **Opción B de L-02** (formalizar R17 en los documentos del Paso 03), si así se decide.

## Pendientes no bloqueantes (se mantienen)

1. Valor inicial de anticipación mínima para reservar (OD-01) — aprobar antes de activar.
2. Canal seguro de entrega de contraseñas temporales (OD-02) — definir antes de implementar.
3. TTL de claves de idempotencia (L-03) — decidir en el Paso 12.

---

## Complemento de L-02 — decisión final (revisión de consistencia del Paso 04)

**Fecha:** 8 de octubre de 2026. **Decisión humana:** **NO se autoriza la creación de R17** para la auditoría del restablecimiento de contraseñas.

**Verificación previa exigida (¿es `auditoria_ref` necesaria para algún requisito aprobado?):**

| Requisito | Texto exigido | ¿Pide un puntero reset→auditoría? |
|---|---|---|
| RF-026 | Registro auditable de operaciones críticas con fecha, usuario y resultado | **No** — exige la fila de auditoría (T9), no el enlace inverso |
| RF-029 | "la operación quedará registrada en auditoría" | **No** — exige existencia del registro, no una referencia almacenada en T14 |
| RNF-013 | Trazabilidad suficiente para identificar resultado y usuario responsable | **No** — se satisface con los campos de T9 |
| RNF-030 | "dejando registro de auditoría" | **No** — ídem RF-029 |
| CA-015 | Política de contraseñas y acceso | **No** — sin exigencia de referencia |

**Conclusión:** el atributo **no es necesario** para ningún requisito aprobado → **`auditoria_ref` ELIMINADO de T14** en `modelo_logico.md` (autorizado expresamente en esta decisión). **No hay contradicción** que presentar.

**Correlación restablecimiento ↔ auditoría SIN nueva relación conceptual:**
1. **Atomicidad:** la fila de T9 (`tipo_operacion = restablecimiento_password`, usuario, fecha, resultado) se escribe **en la misma transacción** que T14; si T9 falla, la transacción se revierte → **nunca existe un restablecimiento exitoso sin su registro de auditoría**.
2. **Correlación unidireccional:** la fila de auditoría identifica el restablecimiento mediante su atributo aprobado `contexto` (E9), que puede contener el identificador de la fila de `restablecimiento_contrasena`; alternativamente, por `usuario_id` + `fecha_hora_utc` = `creado_utc` dentro de la misma transacción. **Ninguna de las dos vías añade columnas, tablas ni relaciones** (R1–R16 intactas; 14 entidades intactas).
3. El puntero inverso T14→T9 no era exigido por requisito alguno; su ausencia no debilita RF-026/RF-029/RNF-013/RNF-030.

**Coherencia con el modelo conceptual (sin modificar el Paso 03):** la E14 conceptual aprobada incluye la descripción *referencia de auditoría*; el modelo lógico **no la materializa** por no estar respaldada por requisitos (decisión humana explícita). Los documentos del Paso 03 **no se modifican** (instrucción vigente).

**Mención hipotética a R17 en `diagrama_er.md` (revisada, sin modificar):** la única aparición (§4, línea sobre E12 Clave de idempotencia) se refiere a una **posible formalización futura de la relación de idempotencia**, no a la de auditoría; permanece **hipotética y no aplicada**, y cualquier propuesta futura requerirá su propia autorización y numeración (se evitará la colisión con "R17" al asignarla entonces).

**Evidencia previa a esta eliminación:** `proyecto/03_resultados/evidencia_pre_l02_complemento/`.

---

## Aprobación humana final del Paso 04 (9 de octubre de 2026)

**APROBADO** el Paso 04 — Modelo lógico, incluyendo L-01, L-02, L-03, L-04 y sus correcciones documentadas (complemento de L-02: R17 no autorizada; `auditoria_ref` eliminada de T14).

**Precisión técnica incorporada (no autoriza nuevas entidades, atributos ni relaciones):**
- La correlación T14 (`restablecimiento_contrasena`) ↔ T9 (`auditoria_operacion`) deberá utilizar **preferentemente el identificador del restablecimiento registrado en el atributo `contexto`** de la fila de auditoría.
- La **coincidencia de usuario y fecha NO es el mecanismo principal** de correlación (solo complemento secundario, si acaso).

**Pendientes conservados:** OD-01, OD-02 (decisión humana, no bloqueantes) y los detalles técnicos diferidos (TTL/Paso 12; tipado y enums/Paso 06; mecanismo ER-02/backend; numeración R17 reservada).

**Evidencia previa a la incorporación de la precisión:** `proyecto/03_resultados/evidencia_pre_precision_contexto/`.

**Siguiente:** Paso 05 — Normalización.
