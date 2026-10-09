Corrige el bloque SQL administrativo que acabas de generar. NO lo ejecutes.

He detectado los siguientes problemas:

1. MySQL 8.0 no admite múltiples tablas separadas por comas en una misma sentencia GRANT. Genera una sentencia GRANT por tabla.
2. No intentes revocar permisos de columnas que no estén efectivamente concedidos.
3. Distingue privilegios a nivel de base de datos, tabla y columna utilizando los resultados reales de SHOW GRANTS.
4. Respeta exactamente los permisos definidos en 0005_cuentas_privilegios.sql, aplicándolos a las cinco cuentas existentes con host localhost.
5. No recrees cuentas, no cambies contraseñas, no modifiques datos ni tablas.
6. Genera un solo bloque SQL completo, válido para MySQL 8.0.46, con REVOKE y GRANT, y las cinco consultas SHOW GRANTS finales.
7. Comprueba sintácticamente todas las sentencias antes de entregarlas. No afirmes haberlas ejecutado.
8. Detente para mi ejecución manual como root.

No repitas informes, revisiones arquitectónicas ni migraciones. Necesitamos cerrar esta corrección y pasar inmediatamente al Paso 18.