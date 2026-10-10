### 1. Health (db real)
```
GET /api/v1/health -> 200
{"status":"ok","version":"0.1.0","checks":{"db":"ok"}}
```

### 2. Login administrador (app_rw)
```json
{
  "status": 200,
  "token_presente": true
}
```

### 3. Registro público (RF-001/CA-001)
```
POST /api/v1/auth/registro -> 201 (esperado 201)
{"id":990015,"nombre_completo":"Solicitante Verificacion CP10","correo":"verif.cp10.soli.1791606125543@citas.demo","rol":"solicitante"}
```

### 4. Login del solicitante
```
POST /api/v1/auth/login -> 200
```

### 5. Crear servicio (RF-005)
```
POST /api/v1/servicios -> 200
{"id":990011,"nota":"fixture de corrida previa reutilizado"}
```

### 6. Crear profesional (RF-004)
```
POST /api/v1/profesionales -> 409
{"error":{"code":"CONFLICTO_NEGOCIO","message":"Ya existe un usuario con ese correo"}}
```

### 6b. Recuperar profesional existente
```
GET /api/v1/profesionales -> id=990006
```

### 7. Asociar servicio al profesional (RF-006)
```
POST /api/v1/profesionales/990006/servicios -> 409 (409 = ya asociado en corrida previa)
{"error":{"code":"CONFLICTO_NEGOCIO","message":"La asociación ya existe (use PUT para modificarla)"}}
```

### 8. Crear horario habitual (RF-007)
```
POST /api/v1/profesionales/990006/horarios (dia=sab) -> 409 (409 = horario ya existente en corrida previa)
{"error":{"code":"CONFLICTO_NEGOCIO","message":"El horario se solapa con uno existente"}}
```

### 9. Parámetros de anticipación (RF-025)
```
PUT reprogramar -> 200 | PUT cancelar -> 200
{"reprogramar":{"clave":"anticipacion_reprogramar","valor":"120","descripcion":"2 h (RN-13)"},"cancelar":{"clave":"anticipacion_cancelar","valor":"120","descripcion":"2 h (RN-13)"}}
```

### 9b. Política de reservar sin aprobación (RN-12)
```
GET /api/v1/parametros -> 200
[
  {
    "clave": "anticipacion_reservar",
    "valor": "60",
    "descripcion": "60 min (aprobado 2026-10-10 en CP-FULL-10)",
    "configurado": true
  },
  {
    "clave": "anticipacion_reprogramar",
    "valor": "120",
    "descripcion": "2 h (RN-13)",
    "configurado": true
  },
  {
    "clave": "anticipacion_cancelar",
    "valor": "120",
    "descripcion": "2 h (RN-13)",
    "configurado": true
  }
]
```

### 9c. RN-12: reserva sin anticipacion_reservar (RF-025)
```
anticipacion_reservar ya activo (valor=60); el rechazo 409 POLITICA_NO_CONFIGURADA fue verificado en la corrida previa (evidencia guardada).
```

### 9d. Activación de anticipacion_reservar=60 (aprobación humana CP-FULL-10)
```
PUT /api/v1/parametros/anticipacion_reservar -> 200
{"clave":"anticipacion_reservar","valor":"60","descripcion":"60 min (aprobado 2026-10-10 en CP-FULL-10)"}
```

### 10. Disponibilidad (RF-009..011, CA-002)
```
GET /api/v1/disponibilidad?profesional_id=990006&servicio_id=990011&fecha=2026-10-10 -> 200
{"profesional_id":990006,"servicio_id":990011,"fecha":"2026-10-10","duracion_efectiva_min":30,"intervalos":["08:30","08:45","09:00","09:15","09:30","09:45","10:00","10:15","10:30","10:45","11:00","11:15","11:30","11:45","12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45","14:00","14:15","14:30","14:45","15:00","15:15","15:30","15:45","16:00","16:15","16:30","16:45","17:00"]}
```

### 11. Confirmación de reserva (CA-003)
```
POST /api/v1/citas (Idempotency-Key única, slot=08:30) -> 201 (esperado 201)
{"replique":false,"cita":{"id":990016,"solicitante_id":990015,"profesional_id":990006,"servicio_id":990011,"inicio_utc":"2026-10-10T12:30:00.000Z","fin_utc":"2026-10-10T13:00:00.000Z","duracion_efectiva_min":30,"estado":"Confirmada","justificacion_cambio":null}}
```

### 11b. Reintento con la misma clave (RNF-012, CA-007)
```
POST /api/v1/citas (misma Idempotency-Key) -> 200 (esperado 200 replique=true)
{"replique":true,"cita":{"id":990016,"solicitante_id":990015,"profesional_id":990006,"servicio_id":990011,"inicio_utc":"2026-10-10T12:30:00.000Z","fin_utc":"2026-10-10T13:00:00.000Z","duracion_efectiva_min":30,"estado":"Confirmada","justificacion_cambio":null}}
```

### 12. Concurrencia (RNF-010, CA-007)
```
Dos POST simultáneos (slot=09:00), claves distintas, mismo intervalo -> 201 / 409 (esperado un 201 y un 409/CONFLICTO)
```

### 13. Consulta de citas del solicitante (RF-016)
```
GET /api/v1/citas/mias -> 200 | total=2
```

### 14. Máquina de estados (RF-020/021, RN-08, CA-006)
```
Confirmada→Atendida (inválida) -> 409 (esperado 409)
Confirmada→En atención -> 200
En atención→Atendida -> 200
Atendida→Cancelada (final) -> 409 (esperado 409)
```

### 15. Cancelación con justificación (RF-018/019, CA-005)
```
PUT /api/v1/citas/990018/cancelar -> 200 (esperado 200)
{"replique":false,"cita":{"id":990018,"solicitante_id":990015,"profesional_id":990006,"servicio_id":990011,"inicio_utc":"2026-10-10T12:30:00.000Z","fin_utc":"2026-10-10T13:00:00.000Z","duracion_efectiva_min":30,"estado":"Cancelada","justificacion_cambio":"Cancelacion de verificacion CP-FULL-10"}}
```

### 16. Reprogramación (RF-017, CA-004)
```
PUT /api/v1/citas/990019/reprogramar (08:30 -> 17:00) -> 200 (esperado 200)
{"replique":false,"cita":{"id":990019,"solicitante_id":990015,"profesional_id":990006,"servicio_id":990011,"inicio_utc":"2026-10-10T21:00:00.000Z","fin_utc":"2026-10-10T21:30:00.000Z","duracion_efectiva_min":30,"estado":"Confirmada","justificacion_cambio":"Reprogramacion de verificacion CP-FULL-10"}}
```

### 17. Notificaciones internas (RF-024/028, CA-012)
```
GET /api/v1/notificaciones/mias -> 200 | total=6
[
  {
    "id": 12,
    "destinatario_id": 990015,
    "cita_id": 990019,
    "evento": "reprogramada",
    "instantanea_datos": "{\"id\":990019,\"solicitante_id\":990015,\"profesional_id\":990006,\"servicio_id\":990011,\"inicio_utc\":\"2026-10-10T21:00:00.000Z\",\"fin_utc\":\"2026-10-10T21:30:00.000Z\",\"duracion_efectiva_min\":30,\"estado\":\"Confirmada\",\"justificacion_cambio\":\"Reprogramacion de verificacion CP-FULL-10\",\"inicio_local\":\"2026-10-10 17:00\"}",
    "generado_utc": "2026-10-10T04:22:09.254Z",
    "instantanea": {
      "id": 990019,
      "solicitante_id": 990015,
      "profesional_id": 990006,
      "servicio_id": 990011,
      "inicio_utc": "2026-10-10T21:00:00.000Z",
      "fin_utc": "2026-10-10T21:30:00.000Z",
      "duracion_efectiva_min": 30,
      "estado": "Confirmada",
      "justificacion_cambio": "Reprogramacion de verificacion CP-FULL-10",
      "inicio_local": "2026-10-10 17:00"
    }
  },
  {
    "id": 11,
    "destinatario_id": 990015,
    "cita_id": 990019,
    "evento": "confirmada",
    "instantanea_datos": "{\"id\":990019,\"solicitante_id\":990015,\"profesional_id\":990006,\"servicio_id\":990011,\"inicio_utc\":\"2026-10-10T12:30:00.000Z\",\"fin_utc\":\"2026-10-10T13:00:00.000Z\",\"duracion_efectiva_min\":30,\"estado\":\"Confirmada\",\"justificacion_cambio\":null,\"inicio_local\":\"2026-10-10 08:30\"}",
    "generado_utc": "2026-10-10T04:22:08.687Z",
    "instantanea": {
      "id": 990019,
      "solicitante_id": 990015,
      "profesional_id": 990006,
      "servicio_id": 990011,
      "inicio_utc": "2026-10-10T12:30:00.000Z",
      "fin_utc": "2026-10-10T13:00:00.000Z",
      "duracion_efectiva_min": 30,
      "estado": "Confirmada",
      "justificacion_cambio": null,
      "inicio_local": "2026-10-10 08:30"
    }
  },
  {
    "id": 10,
    "destinatario_id": 990015,
    "cita_id": 990018,
    "evento": "cancelada",
    "instantanea_datos": "{\"id\":990018,\"solicitante_id\":990015,\"profesional_id\":990006,\"servicio_id\
```

### 18. Auditoría (RF-026, CA-006)
```
GET /api/v1/auditoria -> 200 | total=16
[
  {
    "operacion_id": 990018,
    "usuario_id": 990011,
    "cita_id": 990019,
    "tipo_operacion": "reprogramacion",
    "fecha_hora_utc": "2026-10-10T04:22:09.068Z",
    "resultado": "exito",
    "contexto": "{\"idempotencia\":\"cp-full-10-reprog-op-0001-1791606125270\",\"fuera_plazo\":false}"
  },
  {
    "operacion_id": 990017,
    "usuario_id": 990015,
    "cita_id": 990019,
    "tipo_operacion": "reserva",
    "fecha_hora_utc": "2026-10-10T04:22:08.512Z",
    "resultado": "exito",
    "contexto": "{\"idempotencia\":\"cp-full-10-reprog-cita-0001-1791606125270\",\"servicio\":\"Servicio Verificacion CP10\"}"
  },
  {
    "operacion_id": 990016,
    "usuario_id": 990011,
    "cita_id": 990018,
    "tipo_operacion": "cancelacion",
    "fecha_hora_utc": "2026-10-10T04:22:08.094Z",
    "resultado": "exito",
    "contexto": "{\"idempotencia\":\"cp-full-10-cancel-op-0001-1791606125270\",\"fuera_plazo\":false}"
  },
  {
    "operacion_id": 990015,
    "usuario_id": 990015,
    "cita_id": 990018,
    "tipo_operacion": "reserva",
    "fecha_hora_utc": "2026-10-10T04:22:07.781Z",
    "resultado": "exito",
    "contexto": "{\"idempotencia\":\"cp-full-10-cancel-0001-1791606125270\",\"servicio\":\"Servicio Verificacion CP10\"}"
  },
  {
    "operacion_id": 990014,
    "usuario_id": 990011,
    "cita_id": 990016,
    "tipo_operacion": "cambio_estado",
    "fecha_hora_utc": "2026-10-10T04:22:07.522Z",
    "resultado": "exito",
    "contexto": "{\"de\":\"En atención\",\"a\":\"Atendida\"}"
  },
  {
    "operacion_id": 990013,
    "usuario_id": 990011,
    "cita_id": 990016,
    "tipo_operacion": "cambio_estado",
    "fecha_hora_utc": "2026-10-10T04:22:07.279Z",
    "resultado": "exito",
    "contexto": "{\"de\":\"Confirmada\",\"a\":\"En atención\"}"
  },
  {
    "operacion_id": 990012,
    "usuario_id": 990015,
    "cita_id": 990017,
    "tipo_operacion": "reserva",
    "fecha_hora_utc": "2026-10-10T04:22:06.845Z",
    "resultado": "exito",
    "contexto": "{\"idempotencia\"
```

### 19. Control de acceso (RF-003, CA-009)
```
GET /api/v1/usuarios sin token -> 401 (esperado 401)
GET /api/v1/usuarios como solicitante -> 403 (esperado 403)
```
