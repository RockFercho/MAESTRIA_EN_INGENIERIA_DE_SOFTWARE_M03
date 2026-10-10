export default function CtaFinal() {
  return (
    <section className="cta-final" aria-labelledby="cta-titulo">
      <div className="contenedor cta-final__contenido">
        <h2 id="cta-titulo" className="cta-final__titulo">
          ¿Listo para agendar tu atención?
        </h2>
        <p className="cta-final__texto">
          Inicia sesión para consultar tu disponibilidad, reservar una cita y recibir las notificaciones del sistema.
        </p>
        <a className="boton boton--claro boton--grande" href="/login">
          Iniciar sesión
        </a>
      </div>
    </section>
  );
}
