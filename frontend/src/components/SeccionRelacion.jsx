import { useState, useEffect } from 'react';
import { obtenerPorClave, crear, eliminar } from '../api/api';
import Modal from './Modal';

export default function SeccionRelacion({
  titulo, tabla, campoFiltro, valorFiltro,
  columnas, campos, opciones = {},
  pkPath, buildPayload,
}) {
  const [datos, setDatos]           = useState([]);
  const [cargando, setCargando]     = useState(false);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState({});
  const [guardando, setGuardando]   = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const camposVisibles = campos.filter(c => !c.oculto);

  const cargar = async () => {
    if (valorFiltro == null || valorFiltro === '') return;
    setCargando(true); setError('');
    try {
      const res = await obtenerPorClave(tabla, campoFiltro, valorFiltro);
      setDatos(res.data.datos || []);
    } catch { setError('No se pudieron cargar los datos.'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, [valorFiltro]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const formularioValido = camposVisibles.every(c => form[c.key]?.toString().trim() !== '');

  const abrirModal = () => {
    const vacio = Object.fromEntries(
      campos.map(c => [c.key, c.key === campoFiltro ? String(valorFiltro) : ''])
    );
    setForm(vacio);
    setErrorModal('');
    setModal(true);
  };
  const cerrarModal = () => { setModal(false); setErrorModal(''); };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      const payload = buildPayload
        ? buildPayload(form)
        : Object.fromEntries(campos.map(c => [c.key, c.esInt ? parseInt(form[c.key]) : form[c.key]]));
      await crear(tabla, payload);
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message || 'Error desconocido';
      setErrorModal(msg.toLowerCase().includes('duplicate') ? 'Esta relación ya existe.' : msg);
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (fila) => {
    try {
      const [pk, val] = pkPath(fila);
      await eliminar(tabla, pk, val);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  return (
    <div>
      <div className="seccion-header">
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{titulo}</span>
        <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 12px' }} onClick={abrirModal}>
          + Agregar
        </button>
      </div>
      {error && <div className="alert-error" style={{ margin: '12px 16px 0' }}>{error}</div>}
      {cargando ? (
        <p className="table-empty" style={{ padding: '24px' }}>Cargando...</p>
      ) : datos.length === 0 ? (
        <p className="table-empty" style={{ padding: '24px' }}>Sin registros relacionados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              {columnas.map(c => <th key={c.key}>{c.label}</th>)}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila, i) => (
              <tr key={i}>
                {columnas.map(c => (
                  <td key={c.key}>{c.render ? c.render(fila[c.key], opciones) : fila[c.key]}</td>
                ))}
                <td>
                  <button className="btn-link-delete" onClick={() => setConfirmEliminar(fila)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <Modal titulo={`Agregar ${titulo}`} onClose={cerrarModal}>
          {errorModal && <div className="alert-error" style={{ marginBottom: '16px' }}>{errorModal}</div>}
          <div className="form-grid">
            {camposVisibles.map(c => (
              <div key={c.key} className="form-group full">
                <label>{c.label}</label>
                {c.tipo === 'select' ? (
                  <select name={c.key} value={form[c.key] || ''} onChange={handleChange}>
                    <option value="">— Seleccionar —</option>
                    {(opciones[c.key] || []).map(o => (
                      <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={c.key} type="text"
                    value={form[c.key] || ''} onChange={handleChange}
                    placeholder={c.placeholder || ''}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
            <button className="btn-primary" onClick={handleGuardar} disabled={guardando || !formularioValido}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {confirmEliminar && (
        <Modal titulo="Confirmar eliminación" onClose={() => setConfirmEliminar(null)}>
          <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
            ¿Estás seguro de eliminar esta relación? Esta acción no se puede deshacer.
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
