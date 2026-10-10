const pasos = [
  {
    numero: '1',
    titulo: 'Inicia sesión',
    texto: 'Accede con tus credenciales institucionales para consultar y gestionar tus citas.',
  },
  {
    numero: '2',
    titulo: 'Elige el servicio',
    texto: 'Revisa el catálogo publicado por el sistema y selecciona la atención que necesitas.',
  },
  {
    numero: '3',
    titulo: 'Selecciona fecha y horario',
    texto: 'Consulta la disponibilidad del profesional y reserva el espacio que mejor te acomode.',
  },
  {
    numero: '4',
    titulo: 'Recibe la confirmación',
    texto: 'El sistema confirma tu reserva y te notifica cualquier cambio de estado o de horario.',
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="seccion seccion--fondo" aria-labelledby="como-titulo">
      <div className="contenedor">
        <h2 id="como-titulo" className="seccion__titulo">
          Cómo funciona
        </h2>
        <p className="seccion__descripcion">Cuatro pasos para gestionar tu atención virtual.</p>
        <ol className="pasos">
          {pasos.map((p) => (
            <li className="paso" key={p.numero}>
              <span className="paso__numero" aria-hidden="true">
                {p.numero}
              </span>
              <h3 className="paso__titulo">{p.titulo}</h3>
              <p className="paso__texto">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
