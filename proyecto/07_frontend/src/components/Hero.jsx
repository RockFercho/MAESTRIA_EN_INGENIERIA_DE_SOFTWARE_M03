export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-titulo">
      <div className="contenedor hero__contenido">
        <p className="hero__cintillo">Sistema Web de Gestión de Citas y Atención Virtual</p>
        <h1 id="hero-titulo" className="hero__titulo">
          Reserva tu atención en línea, sin filas ni llamadas
        </h1>
        <p className="hero__subtitulo">
          Consulta los servicios disponibles, elige el que necesitas y agenda tu cita con proveedores
          institucionales desde cualquier dispositivo, con confirmación inmediata y seguimiento de tu solicitud.
        </p>
        <div className="hero__acciones">
          <a className="boton boton--primario boton--grande" href="#servicios">
            Consultar servicios
          </a>
          <a className="boton boton--acostado boton--grande" href="#como-funciona">
            Cómo funciona
          </a>
        </div>
        <dl className="hero__datos">
          <div>
            <dt>Reserva en línea</dt>
            <dd>24/7</dd>
          </div>
          <div>
            <dt>Confirmación</dt>
            <dd>Inmediata</dd>
          </div>
          <div>
            <dt>Dispositivos</dt>
            <dd>Móvil y escritorio</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
