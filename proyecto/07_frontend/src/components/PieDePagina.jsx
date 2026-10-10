export default function PieDePagina() {
  return (
    <footer className="pie">
      <div className="contenedor pie__rejilla">
        <div>
          <p className="pie__marca">Gestión de Citas y Atención Virtual</p>
          <p className="pie__texto">
            Sistema web institucional para la reserva y el seguimiento de citas con atención virtual.
          </p>
        </div>
        <nav aria-label="Enlaces del pie">
          <ul className="pie__enlaces">
            <li>
              <a href="#beneficios">Beneficios</a>
            </li>
            <li>
              <a href="#servicios">Servicios</a>
            </li>
            <li>
              <a href="#como-funciona">Cómo funciona</a>
            </li>
            <li>
              <a href="/login">Iniciar sesión</a>
            </li>
          </ul>
        </nav>
        <div>
          <p className="pie__texto">
            Maestría en Ingeniería de Software y Sistemas Informáticos · Módulo III: Desarrollo al Lado del
            Cliente y Servidor Web.
          </p>
        </div>
      </div>
      <div className="contenedor pie__legal">
        <p>© {new Date().getFullYear()} Sistema Web de Gestión de Citas y Atención Virtual. Uso académico.</p>
      </div>
    </footer>
  );
}
