import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './context/PrivateRoute';

import Login          from './pages/Login';
import Aliado         from './pages/Aliado';
import Proyecto       from './pages/Proyecto';
import TipoProducto   from './pages/TipoProducto';
import Docente        from './pages/Docente';
import Producto       from './pages/Producto';
import AreaAplicacion      from './pages/AreaAplicacion';
import AreaConocimiento    from './pages/AreaConocimiento';
import LineaInvestigacion  from './pages/LineaInvestigacion';
import ObjetivoDesarrolloSostenible from './pages/ObjetivoDesarrolloSostenible';
import TerminoClave        from './pages/TerminoClave';
import Usuarios       from './pages/Usuarios';
import Roles          from './pages/Roles';
import './index.css';

const ADMIN       = ['Administrador'];
const ADMIN_MOD   = ['Administrador', 'Modificador'];
const TODOS       = ['Administrador', 'Modificador', 'Visitante'];

function Layout() {
  const { usuario, logout } = useAuth();
  const [relacionesAbierto, setRelacionesAbierto] = useState(false);
  const esAdmin    = usuario?.rol === 'Administrador';
  const esVisitante = usuario?.rol === 'Visitante';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Knowledge<span>Map</span></h1>
          <p>Panel de gestión</p>
        </div>

        <nav className="sidebar-nav">
          {/* Solo Admin */}
          {esAdmin && <>
            <NavLink to="/usuarios"    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>👤 Usuarios</NavLink>
            <NavLink to="/roles"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🔑 Roles</NavLink>
            <div className="nav-divider" />
          </>}

          <NavLink to="/aliado"        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🤝 Aliados</NavLink>
          <NavLink to="/proyectos"     className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📁 Proyectos</NavLink>
          <NavLink to="/tipo-producto" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🏷️ Tipo Producto</NavLink>
          <NavLink to="/docente"       className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>👨‍🏫 Docentes</NavLink>
          <NavLink to="/producto"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📦 Productos</NavLink>

          <div className="nav-divider" />

          <NavLink to="/area-aplicacion"   className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📋 Área Aplicación</NavLink>
          <NavLink to="/area-conocimiento" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📋 Área Conocimiento</NavLink>
          <NavLink to="/linea-investigacion" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📋 Línea Investigación</NavLink>
          <NavLink to="/ods"               className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📋 ODS</NavLink>
          <NavLink to="/termino-clave"     className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📋 Término Clave</NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '8px' }}>
            <p style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{usuario?.username}</p>
            <p style={{ color: '#22d3ee', fontSize: '11px' }}>{usuario?.rol}</p>
          </div>
          <button
            onClick={logout}
            style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', width: '100%' }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<div />} />

          {/* Solo Administrador */}
          <Route path="/usuarios" element={
            <PrivateRoute rolesPermitidos={ADMIN}><Usuarios /></PrivateRoute>
          } />
          <Route path="/roles" element={
            <PrivateRoute rolesPermitidos={ADMIN}><Roles /></PrivateRoute>
          } />

          {/* Admin y Modificador — CRUD completo */}
          <Route path="/aliado"        element={<PrivateRoute rolesPermitidos={TODOS}><Aliado readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/proyectos"     element={<PrivateRoute rolesPermitidos={TODOS}><Proyecto readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/tipo-producto" element={<PrivateRoute rolesPermitidos={TODOS}><TipoProducto readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/docente"       element={<PrivateRoute rolesPermitidos={TODOS}><Docente readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/producto"      element={<PrivateRoute rolesPermitidos={TODOS}><Producto readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/area-aplicacion"     element={<PrivateRoute rolesPermitidos={TODOS}><AreaAplicacion readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/area-conocimiento"   element={<PrivateRoute rolesPermitidos={TODOS}><AreaConocimiento readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/linea-investigacion" element={<PrivateRoute rolesPermitidos={TODOS}><LineaInvestigacion readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/ods"                 element={<PrivateRoute rolesPermitidos={TODOS}><ObjetivoDesarrolloSostenible readonly={esVisitante} /></PrivateRoute>} />
          <Route path="/termino-clave"       element={<PrivateRoute rolesPermitidos={TODOS}><TerminoClave readonly={esVisitante} /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { usuario } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/*"     element={usuario ? <Layout /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}