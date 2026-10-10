function TarjetaServicio({ servicio }) {
  return (
    <li className="tarjeta tarjeta--servicio">
      <div className="tarjeta__superior">
        <h3 className="tarjeta__titulo">{servicio.nombre || 'Servicio sin nombre'}</h3>
        {servicio.duracion_minutos ? (
          <span className="etiqueta">{servicio.duracion_minutos} min</span>
        ) : null}
      </div>
      <p className="tarjeta__texto">
        {servicio.descripcion || 'Sin descripción disponible.'}
      </p>
      <p className="tarjeta__origen">Datos reales · GET /api/v1/servicios</p>
    </li>
  );
}

export default function Servicios({ servicios, estado, mensajeError, onReintentar }) {
  return (
    <section id="servicios" className="seccion" aria-labelledby="servicios-titulo">
      <div className="contenedor">
        <h2 id="servicios-titulo" className="seccion__titulo">
          Servicios disponibles
        </h2>
        <p className="seccion__descripcion">
          Catálogo consultado en tiempo real desde el backend del sistema.
        </p>

        <div aria-live="polite" aria-busy={estado === 'cargando'}>
          {estado === 'cargando' && (
            <p className="estado estado--carga" role="status">
              <span className="estado__indicador" aria-hidden="true" />
              Cargando servicios desde el servidor…
            </p>
          )}

          {estado === 'error' && (
            <div className="estado estado--error" role="alert">
              <p>No fue posible obtener la lista de servicios.</p>
              <p className="estado__detalle">{mensajeError}</p>
              <button type="button" className="boton boton--primario" onClick={onReintentar}>
                Reintentar conexión
              </button>
            </div>
          )}

          {estado === 'vacío' && (
            <div className="estado estado--vacio" role="status">
              <p>No hay servicios publicados en este momento.</p>
              <p className="estado__detalle">
                La conexión con la API fue correcta, pero el catálogo está vacío.
              </p>
            </div>
          )}

          {estado === 'listo' && (
            <ul className="rejilla servicios__rejilla">
              {servicios.map((s) => (
                <TarjetaServicio key={s.id ?? s.nombre} servicio={s} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
