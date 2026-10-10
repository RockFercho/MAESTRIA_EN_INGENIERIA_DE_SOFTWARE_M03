const beneficios = [
  {
    titulo: 'Disponible cuando lo necesites',
    texto: 'Consulta el catálogo y agenda tu atención a cualquier hora, desde el celular o la computadora.',
  },
  {
    titulo: 'Proceso claro y en pocos pasos',
    texto: 'Eliges el servicio, seleccionas fecha y horario, y recibes la confirmación de tu reserva.',
  },
  {
    titulo: 'Información siempre actualizada',
    texto: 'Los servicios que ves provienen del sistema institucional, no de listas manuales ni de copias.',
  },
  {
    titulo: 'Seguimiento de tu solicitud',
    texto: 'Puedes consultar, reprogramar o cancelar tu cita, y recibes notificaciones de cada cambio.',
  },
];

export default function Beneficios() {
  return (
    <section id="beneficios" className="seccion seccion--fondo" aria-labelledby="beneficios-titulo">
      <div className="contenedor">
        <h2 id="beneficios-titulo" className="seccion__titulo">
          ¿Por qué usar el sistema?
        </h2>
        <p className="seccion__descripcion">
          Un canal único de atención digital para gestionar tus citas con rapidez y trazabilidad.
        </p>
        <ul className="rejilla beneficios__rejilla">
          {beneficios.map((b) => (
            <li className="tarjeta" key={b.titulo}>
              <span className="tarjeta__marca" aria-hidden="true" />
              <h3 className="tarjeta__titulo">{b.titulo}</h3>
              <p className="tarjeta__texto">{b.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
