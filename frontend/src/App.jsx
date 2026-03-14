import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Aliado from './pages/Aliado';
import Proyecto from './pages/Proyecto';
import TipoProducto from './pages/TipoProducto';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">

        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>Mapa de <span>Conocimiento</span></h1>
            <p>Panel de gestión</p>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/aliado" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Aliados</NavLink>
            <NavLink to="/proyectos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Proyectos</NavLink>
            <NavLink to="/tipo-producto" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Tipo Producto</NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<div />} />
            <Route path="/aliado" element={<Aliado />} />
            <Route path="/proyectos" element={<Proyecto />} />
            <Route path="/tipo-producto" element={<TipoProducto />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}
