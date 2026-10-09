## AUTORIZACIÓN HUMANA — LIMPIEZA Y CONTINUACIÓN DEL PASO 17

Proyecto: Sistema Web de Gestión de Citas y Atención Virtual.

He revisado los resultados de autenticación y CONFIRMO:

- Conexión MySQL exitosa mediante `devcode@localhost`.
- MySQL 8.0.46 / InnoDB.
- `.env` cargado correctamente.
- `gestion_citas_db` todavía no existe.
- `devcode` no dispone de GRANT OPTION.

### 1. Limpieza inmediata

AUTORIZO eliminar exclusivamente el archivo temporal residual creado por OpenCode durante los intentos anteriores de conexión, que contiene credenciales.

Identificarlo por su ruta exacta registrada en la sesión anterior. No utilizar patrones globales ni eliminar archivos temporales ajenos.

No leer, imprimir ni registrar su contenido.

Confirmar su eliminación.

### 2. Ejecución del Paso 17

Una vez completada la limpieza, retomar la autorización humana previa para ejecutar el Paso 17.

Antes de crear objetos, verificar que el usuario tiene los permisos requeridos y que los scripts respetan el alcance autorizado.

Si las condiciones son satisfactorias:

1. Crear únicamente `gestion_citas_db`.
2. Ejecutar los scripts aprobados en orden.
3. Detenerse inmediatamente ante cualquier error.
4. No omitir scripts fallidos ni modificar privilegios globales para forzar su ejecución.
5. Si `0005` necesita GRANT OPTION, detenerse en ese punto y presentar la intervención administrativa mínima necesaria.
6. Ejecutar únicamente verificaciones empíricas seguras y autorizadas.
7. Registrar los resultados reales y actualizar las evidencias del workflow.

### Restricciones

- No modificar otras bases de datos.
- No utilizar DROP DATABASE.
- No utilizar credenciales de root automáticamente.
- No modificar las contraseñas existentes.
- No mostrar secretos.
- No utilizar `devcode` como cuenta permanente del backend.
- No avanzar al Paso 18.

### Entrega

Presentar únicamente:
- Confirmación de limpieza.
- Resultado de creación de la base.
- Scripts ejecutados correctamente.
- Primer error bloqueante, si existe.
- Estado del Paso 17.

Evitar nuevas revisiones documentales.

**HUMAN_STATUS: APPROVED_STEP_17_EXECUTION_ONLY.**