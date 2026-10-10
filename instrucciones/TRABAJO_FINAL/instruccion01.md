TRABAJO FINAL — LANDING PAGE FUNCIONAL
Sistema Web de Gestión de Citas y Atención Virtual

OBJETIVO:
Desarrollar y entregar una landing page funcional, responsive, moderna y profesional, conectada al backend existente.

PLAZO:
Priorizar una implementación mínima completa y verificable. Evitar análisis extensos y funcionalidades adicionales.

INSTRUCCIONES:

1. Lee AGENTS.md, RF-027, CA-011, las instrucciones del trabajo final y el estado del backend.

2. Trabaja exclusivamente en `proyecto/07_frontend/`. Si existe una ubicación aprobada diferente, respétala.

3. No modifiques `proyecto/06_codigo/`, la base de datos ni los workflows cerrados. Otra sesión está desarrollando el backend simultáneamente.

4. Utiliza React + Vite y CSS responsive. Evita dependencias innecesarias.

5. Implementa una landing page con:
   - Encabezado y navegación.
   - Hero principal con propuesta de valor clara.
   - Botón CTA destacado: «Consultar servicios».
   - Sección de beneficios.
   - Sección de servicios obtenidos desde la API real.
   - Sección «Cómo funciona».
   - CTA final para iniciar sesión.
   - Pie de página institucional.

6. Integra GET /api/v1/servicios mediante una URL configurable en variables de entorno.

7. Implementa estados de carga, lista vacía y error de conexión. No presentes datos ficticios como si provinieran de MySQL.

8. Usa un diseño profesional, adaptable a escritorio y móvil, con contraste y accesibilidad adecuados.

9. Verifica CORS y conectividad. Si el backend no está disponible, conserva la página funcional y documenta la integración pendiente, sin modificar el backend.

10. Ejecuta npm install, npm run build y las pruebas disponibles. Corrige los errores automáticamente.

11. Genera README.md con instrucciones de ejecución, configuración y evidencia de integración.

12. Prepara un informe breve en Markdown con:
    - Objetivo.
    - Público objetivo.
    - Propuesta de valor.
    - Estructura y CTA.
    - Tecnologías.
    - Integración cliente-servidor.
    - Pruebas realizadas.
    - Espacios para capturas.
    - Conclusiones.

AUTORIZACIÓN:
Puedes implementar, instalar las dependencias del frontend y corregir errores sin solicitar aprobaciones intermedias.

No implementes reservas completas ni autenticación nueva. Reutiliza el backend existente.

Al finalizar, muestra únicamente:
- Estado de implementación.
- Ruta del frontend.
- Comando para ejecutarlo.
- Resultado del build.
- Resultado de la conexión con la API.
- Problemas pendientes.

Ejecuta ahora toda la implementación de forma continua.