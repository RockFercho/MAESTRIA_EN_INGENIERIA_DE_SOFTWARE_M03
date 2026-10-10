# Sistema Web de Gestión de Citas y Atención Virtual

**Maestría en Ingeniería de Software y Sistemas Informáticos — Módulo III: Desarrollo al lado del cliente y servidor web**

Repositorio: **[RockFercho/MAESTRIA_EN_INGENIERIA_DE_SOFTWARE_M03](https://github.com/RockFercho/MAESTRIA_EN_INGENIERIA_DE_SOFTWARE_M03)**

## 1. Presentación

Este repositorio reúne el trabajo académico y técnico del **Sistema Web de Gestión de Citas y Atención Virtual**. El proyecto aborda el análisis y validación de requisitos con agentes de IA, la evaluación de alternativas arquitectónicas, el diseño e implementación de una base de datos relacional, el desarrollo de una API HTTP y una **landing page funcional** que consulta servicios reales mediante la API.

El trabajo se realizó de manera incremental, conservando documentos de contexto, decisiones humanas, criterios de aceptación, estados de los workflows y evidencias de las verificaciones.

> **Alcance:** la landing page es una interfaz pública de presentación y consulta de servicios. **No equivale a una aplicación web completa de reserva de citas.** El backend implementa y verifica la lógica de reservas mediante API.

## 2. Tecnologías y arquitectura

| Capa / herramienta | Tecnología utilizada |
|---|---|
| Frontend | React + Vite + CSS responsive |
| Backend | Node.js 22, Express 4 |
| Persistencia | MySQL 8, motor InnoDB |
| Conector MySQL | `mysql2` |
| Pruebas backend | `node:test` y pruebas HTTP/integración |
| Documentación API | OpenAPI 3.1 (`openapi.yaml`) |
| Asistencia de desarrollo | OpenCode y agentes/skills del repositorio |
| Entorno de trabajo | Linux / Ubuntu |

La decisión arquitectónica **ADR-001** aprueba un **monolito modular con arquitectura hexagonal interna**: módulos de dominio, casos de uso, puertos y adaptadores, y una única base de datos relacional. Se evaluaron también monolito modular y microservicios como alternativas.

**Flujo de la landing page:** navegador → Vite (proxy de desarrollo `/api`) → Express (`/api/v1`) → MySQL. El proxy evita depender de CORS entre puertos durante el desarrollo local.

## 3. Organización del repositorio

Las rutas siguientes son relativas a la **raíz del repositorio**.

```text
.
├── AGENTS.md                         # Reglas y secuencia de trabajo con agentes
├── .agents/
│   ├── skills/                       # Skills disponibles para el trabajo asistido
│   ├── workflows/                    # Definición de procesos y checkpoints
│   └── state/                        # Estado y aprobaciones de los workflows
├── proyecto/
│   ├── 00_contexto/                  # Descripción, alcance, restricciones y reglas de negocio
│   ├── 01_requisitos/                # RF, RNF, criterios de aceptación y trazabilidad
│   ├── 02_configuracion/             # Configuración documental del proyecto, si aplica
│   ├── 03_resultados/                # Informes y evidencias de las verificaciones
│   ├── 04_decisiones/                # Decisiones arquitectónicas (ADR)
│   ├── 05_base_datos/                # Diseño y scripts SQL de MySQL
│   │   └── 13_sql/                   # Scripts de creación, índices, cuentas y verificaciones
│   ├── 06_codigo/                    # Backend Node.js / Express
│   │   ├── src/                      # Aplicación y módulos
│   │   ├── test/                     # Pruebas unitarias e integración
│   │   ├── tools/                    # Herramientas y verificaciones E2E
│   │   ├── openapi.yaml              # Contrato HTTP de la API
│   │   └── package.json
│   └── 07_frontend/                  # Landing page React / Vite
│       ├── src/                      # Componentes, estilos y consumo de API
│       ├── docs/                     # Informe y evidencias de la landing
│       ├── README.md                 # Instrucciones específicas del frontend
│       └── package.json
└── entregables/                      # Entregables académicos, si están versionados
```

**Nota:** la estructura anterior representa las rutas documentadas durante el desarrollo. Algunas carpetas auxiliares pueden variar según el estado de la rama publicada.

### Dónde encontrar cada trabajo

| Trabajo / etapa | Ubicación principal | Qué contiene |
|---|---|---|
| Caso de Estudio 1: requisitos | `proyecto/00_contexto/`, `proyecto/01_requisitos/` | RF, RNF, reglas, validación humana y trazabilidad |
| Caso de Estudio 2: arquitectura | `proyecto/03_resultados/arquitectura_alternativas.md`, `proyecto/04_decisiones/` | Alternativas, comparación y ADR-001 aprobado |
| Práctica 1: base de datos | `proyecto/05_base_datos/` | Modelo, decisiones, SQL y evidencias de MySQL |
| Práctica 2: backend | `proyecto/06_codigo/`, `proyecto/03_resultados/informe_backend_completo.md` | API, pruebas, documentación y cierre |
| Trabajo Final: landing page | `proyecto/07_frontend/` | Sitio React, conexión con API y evidencias |
| Flujos de trabajo con agentes | `.agents/workflows/`, `.agents/state/` | Checkpoints, trazabilidad y aprobaciones |

## 4. Requisitos para ejecutar el sistema

Antes de comenzar, disponer de:

- **Node.js 22** y `npm`.
- **MySQL 8** accesible localmente.
- Un usuario de MySQL de aplicación (`app_rw`) con los permisos definidos en los scripts de base de datos.
- La base de datos `gestion_citas_db` creada y con el esquema y datos iniciales necesarios.
- Git, para obtener el repositorio.

Los comandos de este README están pensados para una terminal de **Ubuntu/Linux**. Ejecutar cada comando desde el directorio indicado.

### 4.1. Obtener el código

```bash
git clone https://github.com/RockFercho/MAESTRIA_EN_INGENIERIA_DE_SOFTWARE_M03.git
cd MAESTRIA_EN_INGENIERIA_DE_SOFTWARE_M03
```

Si ya se tiene el repositorio, actualizar la rama correspondiente mediante `git pull` después de revisar los cambios locales.

## 5. Base de datos MySQL

**Ubicación:** `proyecto/05_base_datos/`.

El proyecto utiliza la base de datos **`gestion_citas_db`**, con **14 tablas** en el esquema verificado durante la Práctica 1. Los scripts se encuentran en:

```text
proyecto/05_base_datos/13_sql/
├── 0001_esquema_base.sql
├── 0002_indices_patron_acceso.sql
├── 0003_indice_e2_funcional.sql
├── 0004_chk_transversal_duracion.sql
├── 0005_cuentas_privilegios.sql
├── 0006_datos_iniciales.sql
└── 9990_verificaciones_empiricas.sql
```

**Descripción:** `0001` crea el esquema; `0002` y `0003` incorporan índices; `0004` aplica una restricción transversal; `0005` configura cuentas/permisos; `0006` carga datos iniciales; `9990` contiene verificaciones empíricas.

**Importante:** estos scripts se documentan para la **instalación inicial y la auditoría**, **no** para ejecutarlos indiscriminadamente sobre una base existente. `0005` requiere privilegios administrativos; las verificaciones deben revisarse antes de ejecutarse. No volver a aplicar `0001`–`0006` en la BD ya instalada sin verificar el estado de cada script. Nunca publicar credenciales.

Los parámetros operativos aprobados al cierre son:

| Parámetro | Valor inicial |
|---|---:|
| `anticipacion_reservar` | 60 minutos |
| `anticipacion_reprogramar` | 120 minutos |
| `anticipacion_cancelar` | 120 minutos |

Los tres son **independientes** y administrables conforme a las reglas de negocio. La zona horaria institucional es `America/La_Paz`; los instantes de persistencia se manejan en UTC según los requisitos aprobados.

## 6. Ejecutar el backend

**Ubicación:** `proyecto/06_codigo/`.

### 6.1. Configurar variables de entorno

El backend requiere una conexión MySQL mediante variables de entorno. Revisar el archivo **`.env.example` del repositorio** y la implementación `proyecto/06_codigo/src/config/env.js` para conocer todas las variables obligatorias.

Como referencia, la configuración de base de datos utilizada durante el desarrollo incluye:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=gestion_citas_db
DB_USER=app_rw
DB_PASSWORD_APP_RW=REEMPLAZAR_CON_PASSWORD_REAL
DB_TIMEZONE=+00:00
PORT=3001
```

> Este bloque es **orientativo**, no una copia certificada del `.env.example`. La implementación puede requerir otras variables. La cuenta de aplicación debe ser `app_rw`; no usar el usuario administrativo `devcode` para ejecutar la API. Mantener los secretos en `.env` no versionado y respetar la ubicación/carga indicada por `src/config/env.js`.

### 6.2. Instalar dependencias y arrancar

Desde la **raíz del repositorio**:

```bash
cd proyecto/06_codigo
npm install
npm start
```

Si `npm start` no está definido en el `package.json` de la versión publicada, iniciar con el punto de entrada utilizado en las verificaciones:

```bash
node src/server.js
```

El backend se ejecutó localmente en **`http://127.0.0.1:3001`** durante el desarrollo.

### 6.3. Comprobar la conexión

En otra terminal:

```bash
curl http://127.0.0.1:3001/api/v1/health
```

La verificación exitosa debe indicar estado correcto del servidor y conectividad a la BD (por ejemplo, `checks.db: "ok"`). Para consultar el catálogo público:

```bash
curl 'http://127.0.0.1:3001/api/v1/servicios?estado=activo'
```

La documentación de los endpoints, cuerpos de petición y respuestas se encuentra en **`proyecto/06_codigo/openapi.yaml`**; la versión final del cierre documentó **28 rutas**.

### 6.4. Pruebas del backend

Desde `proyecto/06_codigo/`:

```bash
npm test
```

El cierre formal de la Práctica 2 registró **73 pruebas aprobadas de 73**. Además, se ejecutó una verificación HTTP extremo a extremo contra MySQL real:

```text
proyecto/06_codigo/tools/cp_full_10_verificacion.mjs
```

**No ejecutar el script E2E como una prueba inocua en una base con datos importantes:** crea y utiliza registros de prueba y requiere una configuración y limpieza controladas. Las evidencias ya obtenidas están en `proyecto/03_resultados/evidencia_backend_completo/`.

### 6.5. Módulos del backend

El código se organiza en `src/modules/` y contiene, entre otros, los módulos de:

- **Identidad:** registro, autenticación, usuarios y roles.
- **Catálogo:** servicios, profesionales y asociaciones profesional–servicio.
- **Agenda:** horarios, excepciones y cálculo de disponibilidad.
- **Reservas:** creación, idempotencia, concurrencia, reprogramación y cancelación.
- **Notificaciones:** notificaciones internas desacopladas de las reservas.
- **Parámetros:** políticas configurables de anticipación.

También existen componentes compartidos para persistencia, HTTP, control de errores, fechas, auditoría y el arranque de la aplicación. Consultar el árbol real de `src/` para la ubicación exacta de cada adaptador.

## 7. Ejecutar la landing page (frontend)

**Ubicación:** `proyecto/07_frontend/`.

La landing page presenta el sistema, sus beneficios, el proceso de atención y un catálogo de servicios obtenido desde el backend. Incluye diseño responsive, llamadas reales a la API y estados de carga, ausencia de datos y error.

### 7.1. Orden correcto de arranque

**Terminal 1 — backend:**

```bash
cd proyecto/06_codigo
node src/server.js
```

**Terminal 2 — frontend:** abrir otra terminal desde la raíz del repositorio y ejecutar:

```bash
cd proyecto/07_frontend
npm install
npm run dev
```

Abrir en el navegador:

**http://localhost:5173**

El frontend utiliza un **proxy de Vite** para enviar las peticiones `/api` al backend local del puerto **3001**. Por eso el backend y MySQL deben estar disponibles para mostrar los servicios reales. Consultar `proyecto/07_frontend/README.md` y la configuración de Vite si los puertos cambian.

### 7.2. Generar versión de producción

Desde `proyecto/07_frontend/`:

```bash
npm run build
```

La construcción de producción se verificó satisfactoriamente durante el trabajo. La publicación en un hosting no forma parte de las verificaciones descritas aquí.

### 7.3. Qué se implementó y qué no

**Implementado:** portada/hero, navegación, llamadas a la acción, presentación de beneficios, sección de servicios conectada a la API, diseño responsive y estados de consulta.

**No implementado como parte de la landing:** formulario completo de reserva autenticada ni pantalla de inicio de sesión operativa. La opción de inicio de sesión puede enlazar a `/login`, pero esa pantalla no debe considerarse entregada por el frontend actual.

**Nota sobre los datos:** en las pruebas se visualizaron servicios de verificación o *fixtures*. Para una demostración institucional conviene disponer de servicios reales cargados mediante los mecanismos autorizados del backend.

### 7.4. Evidencias de la landing

```text
proyecto/07_frontend/docs/informe_landing.md
proyecto/07_frontend/docs/evidencias/
```

El trabajo académico se documentó con tres capturas: ejecución del primer prompt en OpenCode, página funcionando en el navegador y finalización del prompt. La disponibilidad de las imágenes dentro del repositorio depende de que se hayan incorporado al commit publicado.

## 8. Resultados, evidencias y decisiones

| Documento / carpeta | Utilidad |
|---|---|
| `proyecto/01_requisitos/RF.md` | Requisitos funcionales |
| `proyecto/01_requisitos/RNF.md` | Requisitos no funcionales |
| `proyecto/01_requisitos/criterios_aceptacion.md` | Criterios verificables |
| `proyecto/01_requisitos/trazabilidad_etapa1.md` | Trazabilidad de decisiones sobre requisitos |
| `proyecto/01_requisitos/perfil_carga.md` | Perfil de carga nominal definido académicamente |
| `proyecto/04_decisiones/adr_001_arquitectura_monolito_modular_hexagonal.md` | Decisión arquitectónica aprobada |
| `proyecto/03_resultados/arquitectura_alternativas.md` | Evaluación comparativa de arquitecturas |
| `proyecto/03_resultados/informe_backend_completo.md` | Informe integral y acta de cierre del backend |
| `proyecto/03_resultados/evidencia_backend_completo/` | Evidencias de pruebas y E2E |
| `proyecto/06_codigo/openapi.yaml` | Especificación de la API |
| `.agents/workflows/07_backend_completo_workflow.md` | Checkpoints de implementación backend |
| `.agents/state/backend-completo-workflow.json` | Estado final y aprobaciones del backend |
| `proyecto/07_frontend/docs/informe_landing.md` | Informe técnico de la landing |

## 9. Estado de avance y resultados comprobados

### Base de datos

Diseño e implementación de **14 tablas** en MySQL 8, con relaciones, restricciones, índices y pruebas de integridad. La documentación de la Práctica 1 se encuentra en `proyecto/05_base_datos/` y sus evidencias asociadas.

### Backend

**Estado formal: APROBADO Y CERRADO (2026-10-10).** El workflow 07 registra `HUMAN_STATUS: APPROVED`, `technical_status: COMPLETED` y `workflow_status: CLOSED`.

- Checkpoints **CP-FULL-01 a CP-FULL-10** completados con evidencias.
- **73/73** pruebas automatizadas aprobadas.
- Verificación E2E contra **MySQL real**: registro, disponibilidad, reservas, repetición idempotente, concurrencia, transiciones de estado, cancelación, reprogramación, notificaciones, auditoría y controles 401/403.
- **28 rutas** documentadas en OpenAPI.

Estas cifras corresponden a los resultados registrados durante el cierre del proyecto; no implican que las pruebas se ejecuten automáticamente al clonar el repositorio.

### Landing page

**Implementada y demostrada localmente** mediante React/Vite, conectada al catálogo de servicios de la API. Se verificaron la compilación de producción y las pruebas de frontend reportadas durante su desarrollo. La entrega académica de la landing se realizó por separado.

## 10. Limitaciones y trabajo futuro

El cierre del backend **no equivale a una certificación de producción**. Quedaron expresamente fuera del alcance verificado:

- **RF-029 / RNF-030:** implementación completa del restablecimiento de contraseñas administrado.
- **Pruebas de carga y rendimiento nominal** según `perfil_carga.md` y CA-008.
- **Despliegue de producción:** TLS, contenedores, monitoreo de disponibilidad, métricas, políticas operativas de respaldo y restauración.
- **Frontend transaccional completo:** inicio de sesión, reserva y gestión de citas desde una interfaz web, más allá de la landing informativa.

Para una instalación de producción sería necesario completar y verificar estos aspectos, configurar HTTPS y secretos, preparar los datos institucionales y realizar pruebas de aceptación y seguridad específicas del entorno.

## 11. Guía rápida de ejecución local

En resumen:

1. Preparar **MySQL 8** con la base `gestion_citas_db`, esquema y cuenta `app_rw`.
2. Configurar las variables de entorno **sin versionar credenciales**.
3. En `proyecto/06_codigo/`, instalar dependencias y ejecutar `node src/server.js`.
4. Confirmar `http://127.0.0.1:3001/api/v1/health`.
5. En otra terminal, ejecutar `cd proyecto/07_frontend && npm install && npm run dev`.
6. Abrir `http://localhost:5173` y comprobar la consulta de servicios.

## 12. Seguridad y publicación del repositorio

No incluir en GitHub archivos `.env` reales, contraseñas, tokens, datos personales de pacientes/usuarios, volcados de bases de datos con datos privados ni carpetas `node_modules/`. Utilizar `.env.example` con marcadores de posición y comprobar `git status` antes de publicar.

---

**Proyecto académico — Módulo III.** La documentación, el código y las evidencias se organizan en el mismo repositorio para permitir su revisión y reproducción controlada.
