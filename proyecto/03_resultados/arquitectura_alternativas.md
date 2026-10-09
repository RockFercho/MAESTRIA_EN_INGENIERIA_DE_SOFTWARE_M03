# Revisión arquitectónica — Alternativas evaluadas
## Sistema Web de Gestión de Citas y Atención Virtual

**Etapa:** 3 de 8 del orden de análisis (`AGENTS.md` §2 — agente `architect`).
**Fecha:** 8 de octubre de 2026.
**Skills utilizadas:** `architecture-design`, `architecture-patterns`.
**Naturaleza:** análisis comparativo previo a la decisión humana. La decisión formal se registra en `proyecto/04_decisiones/adr_001_arquitectura_monolito_modular_hexagonal.md`.

---

## 1. Drivers arquitectónicos (trazados desde requisitos)

| Driver | Requisito | Implicación |
|---|---|---|
| Atomicidad reserva ↔ disponibilidad | RN-09, RNF-010, RNF-011, CA-007 | Verificación y confirmación en una misma transacción |
| Idempotencia de reintentos | RNF-012, CA-007 | Clave de idempotencia persistida con la reserva |
| Notificaciones desacopladas | RF-024, RF-028, RNF-017, CA-012 | Outbox transaccional + consumidor asíncrono |
| Rendimiento nominal | RNF-006/007/008, `perfil_carga.md` | 100 VU, 60 % disponibilidad, p95 < 800/1200 ms con 10.000 citas: requiere índice y consulta, no distribución |
| Disponibilidad y respaldos | RNF-014/015/016, CA-013 | Menos piezas = menos modos de fallo |
| Separación de capas y pruebas | RNF-022, RNF-025 | Negocio testeable sin infraestructura |
| Zona horaria | RNF-028, RN-15, CA-014 | UTC en persistencia; `America/La_Paz` en interpretación y UI |
| Linux + contenedores + config externa | RNF-023/024, restricciones | Condiciona el despliegue, no el patrón |
| Alcance v1 acotado | `alcance.md` (29 RF, sin integraciones externas) | Volumen funcional moderado |

---

## 2. Alternativa A — Monolito modular

- **Componentes:** un proceso con módulos de límites explícitos: `web` (landing RF-027 + aplicación), `identidad` (RF-001..003, RF-029), `catalogo` (RF-004..006), `agenda` (RF-007..011), `reservas` (RF-012..019, núcleo transaccional), `seguimiento` (RF-020..023), `auditoria` (RF-026), `notificaciones` (RF-024/028), `parametros` (RF-025), y transversales `api-http`, `config`, `observabilidad`, `migraciones/seed`.
- **Comunicación:** cliente–servidor HTTPS/TLS + JSON sobre un origen (landing y app comparten API); interna, llamadas en proceso vía interfaces; desacoplamiento por eventos de dominio escritos en outbox dentro de la transacción y consumidos por un worker en proceso.
- **Persistencia:** una base de datos relacional con esquema por módulo; transacción ACID única para reserva (bloqueo de intervalo → verificación → cita → auditoría → outbox); idempotencia con tabla de claves únicas; soft-delete (RN-11); timestamps en UTC (RNF-028).
- **Tecnologías candidatas (justificadas, no selección):** Linux + Docker/Compose; proxy TLS; backend Python/FastAPI, Node/NestJS, Java/Spring, PHP/Laravel o .NET; PostgreSQL como candidato principal (timestamptz, exclusiones, respaldo); frontend SPA o server-side; logs JSON + Prometheus/OpenTelemetry.
- **Ventajas:** ACID local sin sagas; una BD → respaldos simples; latencia mínima; bajo costo; encaja con el volumen de la v1 y las prácticas académicas.
- **Desventajas:** escalado acoplado; fronteras de módulo pueden erosionarse.
- **Riesgos:** acoplamiento creciente; punto único de fallo de BD; 99,5 % exige supervisión real.
- **Costo operativo:** bajo (~3–4 contenedores).
- **Adecuación RF/RNF:** RNF-010/011/012 muy alta; RNF-006/007/008, RNF-014/015/016, RNF-017, RNF-026/027 altas; RNF-022/025 altas con disciplina.

## 3. Alternativa B — Microservicios

- **Componentes:** `gateway-api`, `identity`, `catalog`, `agenda`, `scheduling`, `notification`, `parameter`, `web-frontend`, más broker, tracing y orquestación.
- **Hallazgo crítico:** separar disponibilidad de reserva choca con RN-09/RNF-010/011 (pierden atomicidad); mantenerlos juntos reduce el beneficio de separarlos.
- **Comunicación:** REST vía gateway con token propagado; asíncrona con broker (RabbitMQ/Kafka) + outbox; reprogramación multi-servicio exigiría saga con compensación.
- **Persistencia:** database-per-service; transaccionalidad distribuida; UTC crítico entre servicios.
- **Tecnologías candidatas:** Docker Compose/Kubernetes; gateway; broker; PostgreSQL por servicio; OpenTelemetry + Prometheus.
- **Ventajas:** escalado independiente; aislamiento de fallos; despliegues independientes.
- **Desventajas:** complejidad operativa muy superior; consistencia distribuida en la operación central; pruebas y desarrollo más lentos.
- **Riesgos:** alto riesgo de incumplir RNF-010/011; 99,5 % más difícil; respaldos coordinados; sobredimensionada para 29 RF.
- **Costo operativo:** alto (~8–14+ contenedores, broker, N BD).
- **Adecuación RF/RNF:** RNF-006/007/008 media-alta; RNF-010/011/012 media (o baja si se fragmenta); RNF-014/015/016 media-baja; RNF-017 alta; RNF-025/026/027 media.

## 4. Alternativa C — Hexagonal (puertos y adaptadores)

- **Componentes:** dominio framework-free (`Cita` como raíz de agregado, `Profesional`, `Servicio`, `HorarioAtencion`, `ExcepcionDisponibilidad`, `Notificacion`, `Parametro`, `RegistroAuditoria`; RN-01..RN-15 aquí); casos de uso (`ReservarCita`, `ReprogramarCita`, `CancelarCita`, `CambiarEstadoCita`, `ConsultarDisponibilidad`, `Autenticar`, `IniciarResetContrasena`, `ConsultarNotificaciones`, `ConsultarServiciosPublicos`, etc.); puertos driving (REST, worker) y driven (repositorios, `UnitOfWork`, `Reloj`, `ConversorZonaHoraria`, `HashContrasena`, `OutboxPort`, `AlmacenIdempotencia`, `AuditoriaPort`, config, métricas); adaptadores concretos incluido **in-memory para pruebas**.
- **Comunicación:** adaptadores → casos de uso → puertos (dependencias hacia adentro); outbox dentro de la transacción, worker fuera (garantiza CA-012 por diseño).
- **Persistencia:** repositorio por agregado; mapeo ORM solo en adaptador; desplegado monolítico → una BD con esquema por módulos; `UnitOfWork` envuelve la transacción ACID.
- **Tecnologías candidatas:** mismos candidatos que A; el stack queda diferido a los bordes (`restricciones.md`).
- **Ventajas:** máxima testabilidad (RNF-025); separación verificable (RNF-022); neutralidad tecnológica; reloj/zona horaria como puertos explícitos.
- **Desventajas:** más piezas de código; curva conceptual; riesgo de sobre-ingeniería.
- **Riesgos:** duplicación dominio↔ORM; contaminación del núcleo si se pierde disciplina.
- **Costo operativo:** bajo (idéntico a A); el costo adicional es de diseño.
- **Adecuación RF/RNF:** RNF-010/011/012, RNF-017, RNF-022, RNF-025 muy altas; RNF-006/007/008, RNF-014/015/016 altas.

---

## 5. Matriz comparativa

Escala: complejidad/costo (más alto = peor); el resto (más alto = mejor). C asumido con despliegue monolítico.

| Criterio | A. Monolito modular | B. Microservicios | C. Hexagonal (despliegue monolito) |
|---|---|---|---|
| Complejidad de diseño | Baja–Media | **Alta** | Media–Alta |
| Costo operativo | **Baja** | **Alta** | **Baja** |
| Escalabilidad | Media | **Alta** | Media |
| Mantenibilidad | Media–Alta | Media | **Alta** |
| Consistencia transaccional (RN-09, RNF-010/011/012) | **Alta** | **Media/Baja** | **Alta** |
| Seguridad (RNF-001..005, RNF-029) | Alta | Media | **Alta** |
| Adecuación a RF/RNF de la v1 | **Muy alta** | Media | **Muy alta** |
| Pruebas (RNF-025) | Alta | Media | **Muy alta** |
| Esfuerzo académico | **Bajo–Medio** | **Alto** | Medio–Alto |
| Riesgo frente a las prácticas | **Bajo** | **Alto** | Bajo–Medio |
| Tiempo hasta 1ª funcionalidad | **Rápido** | Lento | Rápido |

## 6. Recomendación técnica preliminar del agente

Combinación **A + C**: monolito modular con estructura interna hexagonal. A define la topología de despliegue (un proceso, una BD) y C el estilo interno (puertos y adaptadores). B queda documentada como alternativa viable futura si el proyecto crece, extraíble incrementalmente desde módulos bien delimitados.

La decisión formal del estudiante se registra en el ADR (§4 de decisiones). Pendientes posteriores: selección de stack, técnica de exclusión de solapamiento, estrategia de autenticación, semántica de idempotencia, índices de disponibilidad, despliegue/secretos/CI-CD, política de respaldos, métricas de disponibilidad, fronteras de módulos, formato de presentación, profundidad hexagonal admisible y consulta de notificaciones.
