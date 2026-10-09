## REVISIÓN HUMANA — PASO 05: NORMALIZACIÓN

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

He revisado el informe preliminar de normalización. Antes de aprobar el Paso 05, solicito una revisión técnica complementaria de las observaciones O-1, O-2 y O-3.

### O-1 — Duración efectiva de la cita

Mi decisión preliminar es conservar `duracion_efectiva_min` en T7, respetando RN-04 y la necesidad de conservar información histórica.

Antes de cerrar esta observación:

1. Demuestra formalmente las dependencias funcionales y claves candidatas de T7.
2. Determina si realmente existe incumplimiento de 3FN o BCNF.
3. Distingue redundancia derivada de desnormalización justificada.
4. Documenta cómo se conserva la consistencia entre inicio, fin y duración efectiva.
5. No elimines atributos aprobados.

### O-2 — Duplicados en excepciones de disponibilidad

Prefiero garantizar la integridad en la base de datos, siempre que sea compatible con las reglas aprobadas.

1. Identifica qué atributos definen una excepción exactamente duplicada.
2. Distingue duplicados exactos de intervalos superpuestos.
3. Explica qué restricciones son independientes del motor y cuáles deben diferirse.
4. No selecciones todavía el motor ni generes SQL.

### O-3 — Duplicados en historial de cambios

No apruebo todavía una restricción UNIQUE sobre los valores de negocio del historial.

1. Determina si dos registros con valores iguales pueden representar eventos legítimos diferentes.
2. Distingue duplicación técnica de repetición legítima de eventos.
3. Propón un mecanismo de identificación y trazabilidad que preserve el historial completo.
4. No elimines registros ni introduzcas nuevas entidades o relaciones.

### Verificación general

Revisa que las afirmaciones de normalización de las 14 tablas estén justificadas mediante dependencias funcionales y claves candidatas, sin confundir restricciones de integridad con formas normales.

Presenta las conclusiones y las decisiones que todavía requieran aprobación humana.

No modifiques los modelos aprobados ni los requisitos. No generes SQL, código o migraciones. No selecciones el motor de base de datos y no avances al Paso 06.

**HUMAN_STATUS: PENDING_STEP_05_APPROVAL.**

DETENERSE y esperar mi aprobación explícita.