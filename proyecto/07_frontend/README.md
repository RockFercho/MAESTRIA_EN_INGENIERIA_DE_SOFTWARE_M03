# Landing Page — Sistema Web de Gestión de Citas y Atención Virtual

Landing page responsive (RF-027 / CA-011) construida con **React 18 + Vite 5 + CSS responsive**, integrada con la API real del backend (`GET /api/v1/servicios`).

## Requisitos

- Node.js >= 22
- Backend Express del proyecto corriendo en `http://127.0.0.1:3001` (proyecto `06_codigo`)

## Instalación y ejecución

```bash
cd proyecto/07_frontend
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
```

Compilación de producción y vista previa:

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:4173 (con proxy a la API)
npm test           # pruebas unitarias (node --test)
```

## Configuración (variables de entorno)

Copiar `.env.example` a `.env` y ajustar si es necesario:

| Variable | Descripción | Por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL base de la API. Ruta relativa (`/api/v1`) usa el proxy de Vite; URL absoluta (`http://127.0.0.1:3001/api/v1`) requiere CORS en el backend | `/api/v1` |
| `VITE_API_PROXY_TARGET` | Destino del proxy de desarrollo/preview de Vite | `http://127.0.0.1:3001` |

## Integración con el backend (evidencia)

- Endpoint consumido: `GET {VITE_API_BASE_URL}/servicios?estado=activo` (contrato CP-API-01).
- El backend Express **no emite cabeceras CORS** (verificado con `curl -i -H "Origin: http://localhost:5173"`). Por eso la configuración por defecto usa el **proxy de Vite** (dev y preview): el navegador hace peticiones al mismo origen y Vite las reenvía a `127.0.0.1:3001`. Esto evita tocar el backend.
- Verificación real (con backend y MySQL activos):
  - `GET /api/v1/health` → `{"status":"ok","version":"0.1.0","checks":{"db":"ok"}}`
  - `GET /api/v1/servicios?estado=activo` → `200` con la lista de servicios de MySQL (tabla `servicio`).
- La landing implementa estados de **carga**, **lista vacía** y **error de conexión** (con botón «Reintentar conexión»). No se muestran datos ficticios: si la API falla o el catálogo está vacío, se indica explícitamente.
- Evidencias capturadas en `docs/evidencias/` (capturas de escritorio, móvil, estado vacío y estado de error, más el registro de build, pruebas y llamadas a la API).

## Estructura

```
07_frontend/
├── index.html
├── vite.config.js          # proxy API configurable según VITE_API_BASE_URL
├── .env.example            # plantilla de variables de entorno
├── src/
│   ├── main.jsx
│   ├── App.jsx             # carga de servicios + estados
│   ├── styles.css          # diseño responsive, tokens, accesibilidad
│   ├── api/servicios.js    # cliente de GET /api/v1/servicios
│   └── components/         # Encabezado, Hero, Beneficios, Servicios,
│                           # ComoFunciona, CtaFinal, PieDePagina
├── test/servicios.test.js  # pruebas del cliente API (node --test)
└── docs/
    ├── informe_landing.md
    └── evidencias/
```

## Accesibilidad y responsive

- HTML semántico, enlace «Saltar al contenido», `aria-live` para los estados de la API, `aria-expanded` en el menú móvil, foco visible y contraste AA.
- Breakpoints para móvil/tablet/escritorio; sin scroll horizontal; respeta `prefers-reduced-motion`.

## Notas

- La landing no implementa login ni reservas: los enlaces «Iniciar sesión» apuntan a `/login` de la misma aplicación (pantalla del backend/frontend de sesión, fuera del alcance de este entregable).
- No se modificó `proyecto/06_codigo/`, la base de datos ni los workflows.
