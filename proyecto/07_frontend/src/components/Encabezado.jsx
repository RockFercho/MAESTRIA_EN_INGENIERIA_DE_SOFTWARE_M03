import { useState } from 'react';

const enlaces = [
  { href: '#beneficios', texto: 'Beneficios' },
  { href: '#servicios', texto: 'Servicios' },
  { href: '#como-funciona', texto: 'Cómo funciona' },
];

export default function Encabezado() {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="encabezado">
      <div className="contenedor encabezado__fila">
        <a className="marca" href="#contenido" aria-label="Inicio de Gestión de Citas y Atención Virtual">
          <span className="marca__icono" aria-hidden="true">
            +
          </span>
          <span className="marca__texto">
            Gestión de Citas
            <small>Atención Virtual</small>
          </span>
        </a>

        <button
          type="button"
          className="encabezado__alternador"
          aria-expanded={abierto}
          aria-controls="nav-principal"
          onClick={() => setAbierto((v) => !v)}
        >
          <span className="encabezado__alternador-barra" aria-hidden="true" />
          Menú
        </button>

        <nav id="nav-principal" className={`navegacion${abierto ? ' navegacion--abierta' : ''}`} aria-label="Principal">
          <ul className="navegacion__lista">
            {enlaces.map((e) => (
              <li key={e.href}>
                <a href={e.href} onClick={() => setAbierto(false)}>
                  {e.texto}
                </a>
              </li>
            ))}
          </ul>
          <a className="boton boton--secundario navegacion__acceso" href="/login" onClick={() => setAbierto(false)}>
            Iniciar sesión
          </a>
        </nav>
      </div>
    </header>
  );
}
