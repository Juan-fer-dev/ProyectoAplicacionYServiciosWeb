import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'usuario';
const PK    = 'id';
const VACIO = { username: '', password: '', email: '', nombre_completo: '', activo: true };

export default function Usuarios() {
  const [datos, setDatos]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(VACIO);
  const [pkEditar, setPkEditar]         = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [errorModal, setErrorModal]     = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [roles, setRoles]               = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [rolesUsuario, setRolesUsuario] = useState([]);

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const res = await listar(TABLA);
      setDatos(res.data.datos || []);
    } catch { setError('No se pudieron cargar los registros.'); }
    finally { setCargando(false); }
  };

  useEffect(() => {
    cargar();
    listar('rol').then(r => setRoles(r.data.datos || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const formularioValido =
    form.username.trim() !== '' &&
    form.email.trim() !== '' &&
    form.nombre_completo.trim() !== '' &&
    (modal === 'editar' || form.password.trim() !== '');

  const abrirCrear = () => {
    setForm(VACIO);
    setRolSeleccionado('');
    setErrorModal('');
    setModal('crear');
  };

  const abrirEditar = async (fila) => {
    setForm({
      username:       fila.username,
      password:       '',
      email:          fila.email,
      nombre_completo: fila.nombre_completo,
      activo:         fila.activo,
    });
    setPkEditar(fila[PK]);
    setErrorModal('');
    // Cargar roles actuales del usuario
    try {
      const res = await listar('rol_usuario');
      const misRoles = (res.data.datos || []).filter(r => r.usuario_id == fila[PK]);
      setRolesUsuario(misRoles);
      setRolSeleccionado(misRoles[0]?.rol_id?.toString() || '');
    } catch { setRolesUsuario([]); }
    setModal('editar');
  };

  const cerrarModal = () => { setModal(null); setForm(VACIO); setPkEditar(null); setErrorModal(''); setRolSeleccionado(''); setRolesUsuario([]); };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      if (modal === 'crear') {
        // Crear usuario con contraseña hasheada
        const res = await crear(`${TABLA}?camposEncriptar=password`, {
          username:        form.username,
          password:        form.password,
          email:           form.email,
          nombre_completo: form.nombre_completo,
          activo:          form.activo,
        });
        // Obtener el id del usuario recién creado
        const usuarios = await listar(TABLA);
        const nuevo = (usuarios.data.datos || []).find(u => u.username === form.username);
        if (nuevo && rolSeleccionado) {
          await crear('rol_usuario', { usuario_id: nuevo.id, rol_id: parseInt(rolSeleccionado) });
        }
      } else {
        // Editar usuario
        const payload = {
          email:           form.email,
          nombre_completo: form.nombre_completo,
          activo:          form.activo,
        };
        // Solo actualizar contraseña si se escribió una nueva
        if (form.password.trim() !== '') {
          payload.password = form.password;
          await actualizar(`${TABLA}?camposEncriptar=password`, PK, pkEditar, payload);
        } else {
          await actualizar(TABLA, PK, pkEditar, payload);
        }
        // Actualizar rol: eliminar el anterior y asignar el nuevo
        if (rolSeleccionado && rolesUsuario.length > 0) {
          await eliminar('rol_usuario', 'usuario_id', pkEditar);
        }
        if (rolSeleccionado) {
          await crear('rol_usuario', { usuario_id: pkEditar, rol_id: parseInt(rolSeleccionado) });
        }
      }
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message || 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique'))
        setErrorModal('El nombre de usuario o correo ya existe.');
      else setErrorModal(msg);
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (pk) => {
    try {
      await eliminar('rol_usuario', 'usuario_id', pk);
      await eliminar(TABLA, PK, pk);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  const nombreRol = (id) => roles.find(r => r.id == id)?.nombre || '-';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Usuarios</h2>
          <p>Gestión de usuarios del sistema</p>
        </div>
        <button className="btn-primary" onClick={abrirCrear}>+ Nuevo usuario</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? <p className="table-empty">Cargando registros...</p>
        : datos.length === 0 ? <p className="table-empty">No hay usuarios registrados aún.</p>
        : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Usuario</th><th>Nombre Completo</th>
                <th>Email</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{fila.id}</td>
                  <td>{fila.username}</td>
                  <td>{fila.nombre_completo}</td>
                  <td>{fila.email}</td>
                  <td>
                    <span style={{
                      background: fila.activo ? 'rgba(34,211,238,0.1)' : 'rgba(239,68,68,0.1)',
                      color:      fila.activo ? '#22d3ee' : '#f87171',
                      padding:    '2px 10px',
                      borderRadius: '20px',
                      fontSize:   '12px',
                      fontWeight: 600,
                    }}>
                      {fila.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-link-edit"   onClick={() => abrirEditar(fila)}>Editar</button>
                    <button className="btn-link-delete" onClick={() => setConfirmEliminar(fila[PK])}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          titulo={modal === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-primary" onClick={handleGuardar} disabled={guardando || !formularioValido}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          {errorModal && <div className="alert-error" style={{ marginBottom: '16px' }}>{errorModal}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>Usuario</label>
              <input name="username" type="text" value={form.username} onChange={handleChange}
                placeholder="nombre_usuario" disabled={modal === 'editar'} />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select value={rolSeleccionado} onChange={e => setRolSeleccionado(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label>Nombre Completo</label>
              <input name="nombre_completo" type="text" value={form.nombre_completo}
                onChange={handleChange} placeholder="Juan Pérez" />
            </div>
            <div className="form-group full">
              <label>Email</label>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="usuario@usb.edu.co" />
            </div>
            <div className="form-group full">
              <label>
                Contraseña
                {modal === 'editar' && <span style={{ color: '#64748b', fontWeight: 400 }}> (dejar vacío para no cambiar)</span>}
              </label>
              <input name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="••••••••" />
            </div>
            <div className="form-group full" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input name="activo" type="checkbox" checked={form.activo} onChange={handleChange}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label style={{ margin: 0, cursor: 'pointer' }}>Usuario activo</label>
            </div>
          </div>
        </Modal>
      )}

      {confirmEliminar !== null && (
        <Modal titulo="Confirmar eliminación" onClose={() => setConfirmEliminar(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setConfirmEliminar(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleEliminar(confirmEliminar)}>Sí, eliminar</button>
            </>
          }
        >
          <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
            ¿Estás seguro de eliminar el usuario con ID <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>? Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
}