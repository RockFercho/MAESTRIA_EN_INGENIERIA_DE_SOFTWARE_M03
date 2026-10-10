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
POST /api/v1/auth/registro -> 409
{"error":{"code":"CONFLICTO_NEGOCIO","message":"No fue posible completar el registro con esos datos"}}
```

### 3b. Registro ya existente (corrida previa)
```
Se reutiliza la cuenta fixture para continuar la verificación.
```

### 4. Login del solicitante
```
POST /api/v1/auth/login -> 200
```

### 5. Crear servicio (RF-005)
```
POST /api/v1/servicios -> 201
{"id":990013,"nombre":"Servicio Verificacion CP10","descripcion":"Fixture CP-FULL-10","duracion_minutos":30,"estado":"activo"}
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
POST /api/v1/profesionales/990006/servicios -> 201 (409 = ya asociado en corrida previa)
{"profesional_id":990006,"servicio_id":990013,"duracion_especifica":30,"estado":"activa","registrado_utc":"2026-10-10T04:00:29.887Z","baja_utc":null}
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
    "valor": null,
    "descripcion": null,
    "configurado": false
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

### 10. Disponibilidad (RF-009..011, CA-002)
```
GET /api/v1/disponibilidad?profesional_id=990006&servicio_id=990013&fecha=2026-10-10 -> 200
{"profesional_id":990006,"servicio_id":990013,"fecha":"2026-10-10","duracion_efectiva_min":30,"intervalos":["08:00","08:15","08:30","08:45","09:00","09:15","09:30","09:45","10:00","10:15","10:30","10:45","11:00","11:15","11:30","11:45","12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45","14:00","14:15","14:30","14:45","15:00","15:15","15:30","15:45","16:00","16:15","16:30","16:45","17:00","17:15","17:30"]}
```

### 11. Confirmación de reserva (CA-003)
```
POST /api/v1/citas (Idempotency-Key única) -> 409
{"error":{"code":"POLITICA_NO_CONFIGURADA","message":"Política de anticipación para reservar no configurada (RF-025/RN-12: requiere aprobación del responsable); no se aceptan reservas en línea"}}
```

### 11b. Reintento con la misma clave (RNF-012, CA-007)
```
POST /api/v1/citas (misma Idempotency-Key) -> 409 (esperado 200 replique=true)
{"error":{"code":"POLITICA_NO_CONFIGURADA","message":"Política de anticipación para reservar no configurada (RF-025/RN-12: requiere aprobación del responsable); no se aceptan reservas en línea"}}
```

### 12. Concurrencia (RNF-010, CA-007)
```
Dos POST simultáneos, claves distintas, mismo intervalo -> 409 / 409 (esperado un 201 y un 409/CONFLICTO)
```

### 13. Consulta de citas del solicitante (RF-016)
```
GET /api/v1/citas/mias -> 200 | total=0
```

### 17. Notificaciones internas (RF-024/028, CA-012)
```
GET /api/v1/notificaciones/mias -> 200 | total=0
[]
```

### 18. Auditoría (RF-026, CA-006)
```
GET /api/v1/auditoria -> 200 | total=0
[]
```

### 19. Control de acceso (RF-003, CA-009)
```
GET /api/v1/usuarios sin token -> 401 (esperado 401)
GET /api/v1/usuarios como solicitante -> 403 (esperado 403)
```

### 20. Política de anticipación para reservar no aprobada (RN-12)
```
POST /api/v1/citas sin anticipacion_reservar -> 409 (esperado 409 POLITICA_NO_CONFIGURADA)
{"error":{"code":"POLITICA_NO_CONFIGURADA","message":"Política de anticipación para reservar no configurada (RF-025/RN-12: requiere aprobación del responsable); no se aceptan reservas en línea"}}
```
