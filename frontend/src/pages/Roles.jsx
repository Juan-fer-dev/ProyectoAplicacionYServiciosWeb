import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'rol';
const PK    = 'id';
const VACIO = { nombre: '', descripcion: '', activo: true };

export default function Roles() {
  const [datos, setDatos]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(VACIO);
  const [pkEditar, setPkEditar]         = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [errorModal, setErrorModal]     = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const res = await listar(TABLA);
      setDatos(res.data.datos || []);
    } catch { setError('No se pudieron cargar los registros.'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const formularioValido = form.nombre.trim() !== '' && form.descripcion.trim() !== '';

  const abrirCrear  = () => { setForm(VACIO); setErrorModal(''); setModal('crear'); };
  const abrirEditar = (fila) => {
    setForm({ nombre: fila.nombre, descripcion: fila.descripcion, activo: fila.activo });
    setPkEditar(fila[PK]);
    setErrorModal('');
    setModal('editar');
  };
  const cerrarModal = () => { setModal(null); setForm(VACIO); setPkEditar(null); setErrorModal(''); };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      if (modal === 'crear') await crear(TABLA, form);
      else await actualizar(TABLA, PK, pkEditar, form);
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message || 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique'))
        setErrorModal('Ya existe un rol con ese nombre.');
      else setErrorModal(msg);
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (pk) => {
    try {
      await eliminar(TABLA, PK, pk);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Roles</h2>
          <p>Gestión de roles del sistema</p>
        </div>
        <button className="btn-primary" onClick={abrirCrear}>+ Nuevo rol</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? <p className="table-empty">Cargando registros...</p>
        : datos.length === 0 ? <p className="table-empty">No hay roles registrados aún.</p>
        : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{fila.id}</td>
                  <td>{fila.nombre}</td>
                  <td>{fila.descripcion}</td>
                  <td>
                    <span style={{
                      background:   fila.activo ? 'rgba(34,211,238,0.1)' : 'rgba(239,68,68,0.1)',
                      color:        fila.activo ? '#22d3ee' : '#f87171',
                      padding:      '2px 10px',
                      borderRadius: '20px',
                      fontSize:     '12px',
                      fontWeight:   600,
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
          titulo={modal === 'crear' ? 'Nuevo Rol' : 'Editar Rol'}
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
            <div className="form-group full">
              <label>Nombre</label>
              <input name="nombre" type="text" value={form.nombre}
                onChange={handleChange} placeholder="Nombre del rol" />
            </div>
            <div className="form-group full">
              <label>Descripción</label>
              <input name="descripcion" type="text" value={form.descripcion}
                onChange={handleChange} placeholder="Descripción del rol" />
            </div>
            <div className="form-group full" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input name="activo" type="checkbox" checked={form.activo} onChange={handleChange}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label style={{ margin: 0, cursor: 'pointer' }}>Rol activo</label>
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
            ¿Estás seguro de eliminar el rol con ID <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>? Esta acción eliminará también los usuarios asociados a este rol.
          </p>
        </Modal>
      )}
    </div>
  );
}