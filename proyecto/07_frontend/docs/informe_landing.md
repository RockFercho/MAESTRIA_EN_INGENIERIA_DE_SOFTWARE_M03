# Informe — Landing Page Funcional (Trabajo Final)

**Sistema:** Sistema Web de Gestión de Citas y Atención Virtual
**Requisitos:** RF-027 · CA-011 · RNF-018 · RNF-021
**Fecha:** 9 de octubre de 2026

## 1. Objetivo

Entregar una landing page funcional, responsive, moderna y profesional, parte de la misma aplicación, que presente información institucional y consulte información real procedente del backend (`GET /api/v1/servicios`), sin datos ficticios.

## 2. Público objetivo

- **Solicitantes (usuarios finales):** personas que desean consultar los servicios disponibles y agendar una atención en línea.
- **Responsables institucionales:** que necesitan un canal público, claro y trazable de acceso al sistema de citas.

## 3. Propuesta de valor

«Reserva tu atención en línea, sin filas ni llamadas»: consulta el catálogo real del sistema, elige el servicio y agenda desde cualquier dispositivo, con confirmación inmediata y seguimiento de la solicitud.

## 4. Estructura y CTA

| Sección | Función | CTA |
|---|---|---|
| Encabezado con navegación | Marca + anclas a secciones | «Iniciar sesión» |
| Hero | Propuesta de valor y datos clave | **«Consultar servicios»** (primario, desplaza a la sección de servicios) |
| Beneficios | 4 razones de uso | — |
| Servicios (API real) | Catálogo desde `GET /api/v1/servicios` con estados carga/vacío/error | «Reintentar conexión» (en error) |
| Cómo funciona | 4 pasos del flujo de reserva | — |
| CTA final | Invitación a entrar al sistema | «Iniciar sesión» |
| Pie institucional | Identidad del proyecto y enlaces | — |

## 5. Tecnologías

- **React 18** + **Vite 5** (build y dev server), JavaScript (ESM).
- **CSS responsive** propio con variables (sin frameworks ni librerías UI).
- **node:test** para las pruebas unitarias del cliente API.
- Integración con el backend existente (Node.js 22 + Express 4, `proyecto/06_codigo/`), sin modificarlo.

## 6. Integración cliente-servidor

- La URL base es configurable mediante `VITE_API_BASE_URL` (por defecto `/api/v1`).
- El backend **no emite cabeceras CORS** (verificado); por defecto se usa el **proxy de Vite** (dev y preview) para que el navegador consulte la API en el mismo origen. También puede configurarse una URL absoluta si el backend habilita CORS o detrás de un reverse proxy.
- Manejo de estados: **cargando**, **lista vacía** (conexión correcta, catálogo sin registros) y **error de conexión** (mensaje + «Reintentar conexión»). Nunca se presentan datos ficticios como si vinieran de MySQL.
- Verificación con backend y MySQL activos: `GET /api/v1/health` → `ok/db ok`; `GET /api/v1/servicios?estado=activo` → `200` con los registros reales de la tabla `servicio`, visualizados en la sección de servicios (cada tarjeta indica «Datos reales · GET /api/v1/servicios»).

## 7. Pruebas realizadas

| Prueba | Resultado |
|---|---|
| `npm install` | Dependencias instaladas sin errores |
| `npm run build` | Build correcto (`dist/`, 40 módulos, ~49 kB gzip JS principal) |
| `npm test` | **8/8 pruebas unitarias superadas** (normalización, errores HTTP, fallo de red, JSON inválido) |
| Servidor dev/preview + proxy | `http://localhost:5173` y `4173` responden `200` y sirven la API vía proxy |
| Conectividad con la API | `200 OK` con servicios reales; estado vacío y estado de error verificados en navegador (Chrome headless) |
| Accesibilidad básica | Enlace «Saltar al contenido», semántica, `aria-live`/`aria-expanded`, foco visible, contraste AA |
| Responsive | Verificado en 1440 px (escritorio) y 390 px (móvil); sin scroll horizontal |

Registro completo: `docs/evidencias/build_test_api.txt`.

## 8. Espacios para capturas

- `docs/evidencias/landing_desktop_servicios_reales.png` — escritorio con servicios reales de la API.
- `docs/evidencias/landing_movil.png` — vista móvil (390 px) con menú desplegable.
- `docs/evidencias/landing_estado_vacio.png` — estado «No hay servicios publicados» (API OK, catálogo vacío).
- `docs/evidencias/landing_estado_error.png` — estado de error de conexión con opción de reintento.

## 9. Conclusiones

- La landing cumple RF-027 y CA-011: forma parte del mismo sistema, muestra información real del backend, es responsive y navegable por teclado.
- La integración cliente-servidor funcionó contra el backend real (MySQL + Express) sin modificar el backend; el ausente soporte CORS se resolvió con el proxy de Vite, manteniendo la URL configurable por variables de entorno.
- Pendientes futuros (fuera de este alcance): habilitar CORS o reverse proxy en producción, implementar la pantalla `/login` y el flujo completo de reservas, y sembrar el catálogo institucional de servicios.
