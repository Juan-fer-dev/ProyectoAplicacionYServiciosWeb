import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'aliado';
const PK = 'nit';
const VACIO = { nit: '', razon_social: '', nombre_contacto: '', correo: '', telefono: '', ciudad: '' };

export default function Aliado({ readonly = false }) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [pkEditar, setPkEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
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

  const abrirCrear = () => { setForm(VACIO); setModal('crear'); };
  const abrirEditar = (fila) => { setForm(fila); setPkEditar(fila[PK]); setModal('editar'); };
  const cerrarModal = () => { setModal(null); setForm(VACIO); setPkEditar(null); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleNitChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 9) setForm({ ...form, nit: valor });
  };

  const handleTelefonoChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 10) setForm({ ...form, telefono: valor });
  };

  const formularioValido =
    form.nit.toString().trim() !== '' &&
    form.razon_social.trim() !== '' &&
    form.nombre_contacto.trim() !== '' &&
    form.correo.trim() !== '' &&
    form.telefono.toString().trim() !== '' &&
    form.ciudad.trim() !== '';

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const payload = { ...form, nit: parseInt(form.nit) };
      if (modal === 'crear') await crear(TABLA, payload);
      else await actualizar(TABLA, PK, pkEditar, payload);
      await cargar();
      cerrarModal();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detalle || e.message));
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (pk) => {
    try {
      await eliminar(TABLA, PK, pk);
      await cargar();
    } catch (e) {
      alert('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Aliados</h2>
          <p>Gestión de empresas aliadas</p>
        </div>
        {!readonly && <button className="btn-primary" onClick={abrirCrear}>+ Nuevo aliado</button>}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? (
          <p className="table-empty">Cargando registros...</p>
        ) : datos.length === 0 ? (
          <p className="table-empty">No hay aliados registrados aún.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>NIT</th>
                <th>Razón Social</th>
                <th>Nombre Contacto</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Ciudad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{fila.nit}</td>
                  <td>{fila.razon_social}</td>
                  <td>{fila.nombre_contacto}</td>
                  <td>{fila.correo}</td>
                  <td>{fila.telefono}</td>
                  <td>{fila.ciudad}</td>
                  {!readonly && (
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn-link-edit" onClick={() => abrirEditar(fila)}>Editar</button>
                      <button className="btn-link-delete" onClick={() => setConfirmEliminar(fila[PK])}>Eliminar</button>
                    </td>
                  )}
                  {readonly && <td></td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titulo={modal === 'crear' ? 'Nuevo Aliado' : 'Editar Aliado'} onClose={cerrarModal}>
          <div className="form-grid">
            <div className="form-group">
              <label>NIT (máx. 9 dígitos)</label>
              <input
                name="nit"
                type="text"
                inputMode="numeric"
                value={form.nit}
                onChange={handleNitChange}
                placeholder="900123456"
                disabled={modal === 'editar'}
              />
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <input name="ciudad" type="text" value={form.ciudad} onChange={handleChange} placeholder="Medellín" />
            </div>
            <div className="form-group full">
              <label>Razón Social</label>
              <input name="razon_social" type="text" value={form.razon_social} onChange={handleChange} placeholder="Empresa S.A.S" />
            </div>
            <div className="form-group full">
              <label>Nombre Contacto</label>
              <input name="nombre_contacto" type="text" value={form.nombre_contacto} onChange={handleChange} placeholder="Carlos Medina" />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="contacto@empresa.com" />
            </div>
            <div className="form-group">
              <label>Teléfono (máx. 10 dígitos)</label>
              <input
                name="telefono"
                type="text"
                inputMode="numeric"
                value={form.telefono}
                onChange={handleTelefonoChange}
                placeholder="3001234567"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
            <button
              className="btn-primary"
              onClick={handleGuardar}
              disabled={guardando || !formularioValido}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {confirmEliminar !== null && (
        <Modal titulo="Confirmar eliminación" onClose={() => setConfirmEliminar(null)}>
          <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
            ¿Estás seguro de eliminar el aliado con NIT <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>? Esta acción no se puede deshacer.
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