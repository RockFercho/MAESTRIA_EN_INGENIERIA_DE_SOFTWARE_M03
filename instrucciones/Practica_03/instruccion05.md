Revisa el Paso 03 del workflow `02_database_workflow`, correspondiente al diagrama entidad-relación del Sistema Web de Gestión de Citas y Atención Virtual.

Documentos de referencia:
- `AGENTS.md`
- `proyecto/05_base_datos/01_requisitos_datos/requisitos_datos.md`
- `proyecto/05_base_datos/02_modelo_conceptual/modelo_conceptual.md`
- `proyecto/05_base_datos/02_modelo_conceptual/diagrama_er.md`
- `proyecto/04_decisiones/adr_001_arquitectura_monolito_modular_hexagonal.md`
- RF, RNF, reglas de negocio y criterios de aceptación aprobados.

Realiza una revisión de las siguientes observaciones:

**ER-01:** Formalizar las relaciones de Usuario con HistorialCambio, AuditoriaOperacion y ParametroOperativo, comprobando las cardinalidades y la obligatoriedad.

**ER-02:** Precisar la semántica de `usuario_sesion` en ClaveIdempotencia y cómo se vincula cada clave con la operación protegida, conforme a RNF-012.

**ER-03:** Definir la trazabilidad entre EventoOutbox y la cita u operación que lo origina, sin imponer una asociación obligatoria con Cita para todos los eventos.

**ER-04:** Revisar la relación R12 entre Cita y AuditoriaOperacion. Justificar su cardinalidad y proponer una representación que permita auditar tanto operaciones sobre citas como operaciones independientes, por ejemplo, restablecimiento de contraseñas.

**ER-05:** Revisar la clave compuesta de AsociacionServicio y su compatibilidad con la desactivación, reactivación y conservación de información histórica.

Instrucciones obligatorias:

1. Mantener las 14 entidades, salvo que exista una justificación documentada para proponer cambios.
2. Respetar las decisiones humanas A-01 a A-05 y ADR-001.
3. No modificar los requisitos aprobados.
4. No generar SQL ni código.
5. No seleccionar el motor de base de datos.
6. No modificar todavía los archivos.
7. Presentar una tabla con cada observación, impacto, alternativa recomendada y justificación.
8. Identificar cuáles requieren una nueva decisión humana y cuáles son ajustes técnicos derivados de decisiones ya aprobadas.
9. No avanzar al Paso 04.

Mantén HUMAN_STATUS: PENDING hasta recibir mi autorización explícita.