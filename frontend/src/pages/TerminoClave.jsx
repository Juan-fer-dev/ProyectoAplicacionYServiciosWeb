import { useState, useEffect } from 'react';
import { listar, crear, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'termino_clave';
const PK    = 'termino';
const VACIO = { termino: '' };

export default function TerminoClave({ readonly = false }) {
  const [datos, setDatos]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');
  const [modal, setModal]               = useState(false);
  const [form, setForm]                 = useState(VACIO);
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

  const abrirModal  = () => { setForm(VACIO); setErrorModal(''); setModal(true); };
  const cerrarModal = () => { setModal(false); setForm(VACIO); setErrorModal(''); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formularioValido = form.termino.trim() !== '';

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      await crear(TABLA, { termino: form.termino });
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message || 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('primary key') || msg.toLowerCase().includes('unique'))
        setErrorModal(`El término "${form.termino}" ya existe.`);
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
          <h2>Términos Clave</h2>
          <p>Gestión de términos clave para proyectos</p>
        </div>
       {!readonly && <button className="btn-primary" onClick={abrirModal}>+ Nuevo término</button>}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? <p className="table-empty">Cargando registros...</p>
        : datos.length === 0 ? <p className="table-empty">No hay términos registrados aún.</p>
        : (
          <table>
            <thead>
              <tr><th>Término</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{fila.termino}</td>
                  {!readonly && (
                    <td onClick={e => e.stopPropagation()}>
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
        <Modal titulo="Nuevo Término Clave" onClose={cerrarModal}>
          {errorModal && <div className="alert-error" style={{ marginBottom: '16px' }}>{errorModal}</div>}
          <div className="form-grid">
            <div className="form-group full">
              <label>Término</label>
              <input name="termino" type="text" value={form.termino} onChange={handleChange} placeholder="machine learning" />
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
            ¿Estás seguro de eliminar el término <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>? Esta acción no se puede deshacer.
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
