import { useCallback, useEffect, useRef, useState } from 'react';
import Encabezado from './components/Encabezado.jsx';
import Hero from './components/Hero.jsx';
import Beneficios from './components/Beneficios.jsx';
import Servicios from './components/Servicios.jsx';
import ComoFunciona from './components/ComoFunciona.jsx';
import CtaFinal from './components/CtaFinal.jsx';
import PieDePagina from './components/PieDePagina.jsx';

export default function App() {
  const [servicios, setServicios] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | vacio | error
  const [mensajeError, setMensajeError] = useState('');
  const AbortarRef = useRef(null);

  const cargarServicios = useCallback(async () => {
    AbortarRef.current?.abort();
    const controlador = new AbortController();
    AbortarRef.current = controlador;
    setEstado('cargando');
    setMensajeError('');
    try {
      const { obtenerServicios } = await import('./api/servicios.js');
      const lista = await obtenerServicios({ signal: controlador.signal });
      if (controlador.signal.aborted) return;
      setServicios(lista);
      setEstado(lista.length === 0 ? 'vacío' : 'listo');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setServicios([]);
      setEstado('error');
      setMensajeError(err?.message || 'Error de conexión con la API.');
    }
  }, []);

  useEffect(() => {
    cargarServicios();
    return () => AbortarRef.current?.abort();
  }, [cargarServicios]);

  return (
    <>
      <a className="enlace-saltar" href="#contenido">
        Saltar al contenido principal
      </a>
      <Encabezado />
      <main id="contenido">
        <Hero />
        <Beneficios />
        <Servicios servicios={servicios} estado={estado} mensajeError={mensajeError} onReintentar={cargarServicios} />
        <ComoFunciona />
        <CtaFinal />
      </main>
      <PieDePagina />
    </>
  );
}
