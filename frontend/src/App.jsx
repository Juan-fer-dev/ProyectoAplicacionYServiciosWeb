import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Aliado       from './pages/Aliado';
import Proyecto     from './pages/Proyecto';
import TipoProducto from './pages/TipoProducto';
import Docente      from './pages/Docente';
import Producto     from './pages/Producto';
import AaProyecto      from './pages/AaProyecto';
import AcProyecto      from './pages/AcProyecto';
import AliadoProyecto  from './pages/AliadoProyecto';
import Desarrolla      from './pages/Desarrolla';
import OdsProyecto     from './pages/OdsProyecto';
import PalabrasClave   from './pages/PalabrasClave';
import ProyectoLinea   from './pages/ProyectoLinea';
import DocenteProducto from './pages/DocenteProducto';
import './index.css';

export default function App() {
  const [relacionesAbierto, setRelacionesAbierto] = useState(false);

  return (
    <BrowserRouter>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>Knowledge<span>Map</span></h1>
            <p>Panel de gestión</p>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/aliado"        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🤝 Aliados</NavLink>
            <NavLink to="/proyectos"     className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📁 Proyectos</NavLink>

            {/* Menú desplegable Relaciones */}
            <button
              className={`nav-link nav-group-btn ${relacionesAbierto ? 'open' : ''}`}
              onClick={() => setRelacionesAbierto(!relacionesAbierto)}
            >
              🔗 Relaciones
              <span className="nav-arrow">{relacionesAbierto ? '▴' : '▾'}</span>
            </button>
            {relacionesAbierto && (
              <div className="nav-submenu">
                <NavLink to="/aa-proyecto"       className={({ isActive }) => isActive ? 'nav-sublink active' : 'nav-sublink'}>Áreas de Aplicación</NavLink>
                <NavLink to="/ac-proyecto"       className={({ isActive }) => isActive ? 'nav-sublink active' : 'nav-sublink'}>Áreas de Conocimiento</NavLink>
                <NavLink to="/aliado-proyecto"   className={({ isActive }) => isActive ? 'nav-sublink active' : 'nav-sublink'}>Aliados por Proyecto</NavLink>
                <NavLink to="/desarrolla"        className={({ isActive }) => isActive ? 'nav-sublink active' : 'nav-sublink'}>Desarrolla</NavLink>
                <NavLink to="/ods-proyecto"      className={({ isActive }) => isActive ? 'nav-sublink active' : 'nav-sublink'}>ODS</NavLink>
                <NavLink to="/palabras-clave"    className={({ isActive }) => isActive ? 'nav-sublink active' : 'nav-sublink'}>Palabras Clave</NavLink>
                <NavLink to="/proyecto-linea"    className={({ isActive }) => isActive ? 'nav-sublink active' : 'nav-sublink'}>Líneas Investigación</NavLink>
                <NavLink to="/docente-producto"  className={({ isActive }) => isActive ? 'nav-sublink active' : 'nav-sublink'}>Docentes por Producto</NavLink>
              </div>
            )}

            <NavLink to="/tipo-producto" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🏷️ Tipo Producto</NavLink>
            <NavLink to="/docente"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>👨‍🏫 Docentes</NavLink>
            <NavLink to="/producto"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📦 Productos</NavLink>
          </nav>
          <div className="sidebar-footer">
            <p>API: localhost:5034</p>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/"                element={<div />} />
            <Route path="/aliado"          element={<Aliado />} />
            <Route path="/proyectos"       element={<Proyecto />} />
            <Route path="/tipo-producto"   element={<TipoProducto />} />
            <Route path="/docente"         element={<Docente />} />
            <Route path="/producto"        element={<Producto />} />
            <Route path="/aa-proyecto"     element={<AaProyecto />} />
            <Route path="/ac-proyecto"     element={<AcProyecto />} />
            <Route path="/aliado-proyecto" element={<AliadoProyecto />} />
            <Route path="/desarrolla"      element={<Desarrolla />} />
            <Route path="/ods-proyecto"    element={<OdsProyecto />} />
            <Route path="/palabras-clave"  element={<PalabrasClave />} />
            <Route path="/proyecto-linea"  element={<ProyectoLinea />} />
            <Route path="/docente-producto"element={<DocenteProducto />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}