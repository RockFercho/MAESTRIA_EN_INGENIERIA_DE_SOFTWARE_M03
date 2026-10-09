## CORRECCIÓN TÉCNICA FINAL — PASO 03

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

Durante la revisión humana de la aplicación de ER-01 a ER-05 se identificó un error de sintaxis en las cardinalidades Mermaid de R12 y R16.

La notación `|o` no es la representación correcta de cero o uno en Mermaid ER. La notación correcta es `o|`.

Autorizo exclusivamente las siguientes correcciones:

1. En `diagrama_er.md`, corregir las relaciones:

   `Cita o|--o{ AuditoriaOperacion : "R12 audita operacion"`

   `Cita o|--o{ EventoOutbox : "R16 origina evento"`

2. Revisar y corregir la leyenda de cardinalidades y cualquier ejemplo que utilice incorrectamente `|o`.

3. Verificar que `modelo_conceptual.md` describa las mismas cardinalidades:
   - AuditoriaOperacion → Cita: 0..1.
   - Cita → AuditoriaOperacion: 0..N.
   - EventoOutbox → Cita: 0..1.
   - Cita → EventoOutbox: 0..N.

4. Revisar la sintaxis de las demás relaciones R1–R16 sin alterar decisiones aprobadas.

5. Registrar la corrección como ajuste técnico del Paso 03, preservando la evidencia previa.

6. No modificar RF, RNF, RN ni CA.

7. No generar SQL, migraciones ni código; no seleccionar el motor de base de datos.

8. No avanzar al Paso 04.

Al finalizar, presentar las dos relaciones corregidas, el resultado de la verificación y los archivos modificados.

Mantener `step_03_final_approval: PENDING` y `HUMAN_STATUS: PENDING` hasta mi aprobación final.