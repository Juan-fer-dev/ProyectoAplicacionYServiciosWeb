import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'tipo_producto';
const PK = 'id';
const VACIO = { id: '', categoria: '', clase: '', nombre: '', tipologia: '' };

export default function TipoProducto() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [pkEditar, setPkEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const res = await listar(TABLA);
      setDatos(res.data.datos || []);
    } catch {
      setError('No se pudieron cargar los registros.');
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear  = () => { setForm(VACIO); setErrorModal(''); setModal('crear'); };
  const abrirEditar = (fila) => { setForm(fila); setPkEditar(fila[PK]); setErrorModal(''); setModal('editar'); };
  const cerrarModal = () => { setModal(null); setForm(VACIO); setPkEditar(null); setErrorModal(''); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formularioValido =
    form.id.toString().trim() !== '' &&
    form.categoria.trim() !== '' &&
    form.clase.trim() !== '' &&
    form.nombre.trim() !== '' &&
    form.tipologia.trim() !== '';

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      const payload = { ...form, id: parseInt(form.id) };
      if (modal === 'crear') await crear(TABLA, payload);
      else await actualizar(TABLA, PK, pkEditar, payload);
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message || 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('primary key') || msg.toLowerCase().includes('unique')) {
        setErrorModal(`El ID ${form.id} ya existe en la base de datos. Por favor usa un ID diferente.`);
      } else {
        setErrorModal(msg);
      }
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
          <h2>Tipos de Producto</h2>
          <p>Gestión de categorías y tipos de productos</p>
        </div>
        <button className="btn-primary" onClick={abrirCrear}>+ Nuevo tipo</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? (
          <p className="table-empty">Cargando registros...</p>
        ) : datos.length === 0 ? (
          <p className="table-empty">No hay tipos de producto registrados aún.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Categoría</th>
                <th>Clase</th>
                <th>Nombre</th>
                <th>Tipología</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{fila.id}</td>
                  <td>{fila.categoria}</td>
                  <td>{fila.clase}</td>
                  <td>{fila.nombre}</td>
                  <td>{fila.tipologia}</td>
                  <td>
                    <button className="btn-link-edit" onClick={() => abrirEditar(fila)}>Editar</button>
                    <button className="btn-link-delete" onClick={() => setConfirmEliminar(fila[PK])}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titulo={modal === 'crear' ? 'Nuevo Tipo de Producto' : 'Editar Tipo de Producto'} onClose={cerrarModal}>
          {errorModal && (
            <div className="alert-error" style={{ marginBottom: '16px' }}>{errorModal}</div>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label>ID</label>
              <input name="id" type="number" value={form.id} onChange={handleChange} placeholder="1" disabled={modal === 'editar'} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input name="categoria" type="text" value={form.categoria} onChange={handleChange} placeholder="Nuevo Conocimiento" />
            </div>
            <div className="form-group">
              <label>Clase</label>
              <input name="clase" type="text" value={form.clase} onChange={handleChange} placeholder="Resultados de investigación" />
            </div>
            <div className="form-group">
              <label>Tipología</label>
              <input name="tipologia" type="text" value={form.tipologia} onChange={handleChange} placeholder="Artículo en revista indexada" />
            </div>
            <div className="form-group full">
              <label>Nombre</label>
              <input name="nombre" type="text" value={form.nombre} onChange={handleChange} placeholder="Artículo de investigación" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
            <button className="btn-primary" onClick={handleGuardar} disabled={guardando || !formularioValido}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {confirmEliminar !== null && (
        <Modal titulo="Confirmar eliminación" onClose={() => setConfirmEliminar(null)}>
          <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
            ¿Estás seguro de eliminar el tipo de producto con ID <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setConfirmEliminar(null)}>Cancelar</button>
            <button className="btn-danger" onClick={() => handleEliminar(confirmEliminar)}>Sí, eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}