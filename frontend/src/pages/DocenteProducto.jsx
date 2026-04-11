import { useState, useEffect } from 'react';
import { listar, crear, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'docente_producto';
const VACIO = { docente: '', producto: '' };

export default function DocenteProducto() {
  const [datos, setDatos]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(VACIO);
  const [guardando, setGuardando]   = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [docentes, setDocentes]     = useState([]);
  const [productos, setProductos]   = useState([]);

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
    Promise.allSettled([listar('docente'), listar('producto')])
      .then(([rD, rP]) => {
        if (rD.status === 'fulfilled') setDocentes(rD.value.data.datos || []);
        if (rP.status === 'fulfilled') setProductos(rP.value.data.datos || []);
      });
  }, []);

  const handleChange     = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const formularioValido = form.docente !== '' && form.producto !== '';
  const abrirModal       = () => { setForm(VACIO); setErrorModal(''); setModal(true); };
  const cerrarModal      = () => { setModal(false); setForm(VACIO); setErrorModal(''); };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      await crear(TABLA, { docente: parseInt(form.docente), producto: parseInt(form.producto) });
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message;
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('primary key'))
        setErrorModal('Esta relación ya existe.');
      else setErrorModal(msg);
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (fila) => {
    try {
      await eliminar(TABLA, 'docente', `${fila.docente}/producto/${fila.producto}`);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  const nombreDocente  = (id) => { const d = docentes.find(d => d.cedula == id); return d ? `${d.nombres} ${d.apellidos}` : id; };
  const nombreProducto = (id) => productos.find(p => p.id == id)?.nombre || id;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Docentes por Producto</h2>
          <p>Relación entre docentes y productos de investigación</p>
        </div>
        <button className="btn-primary" onClick={abrirModal}>+ Nueva relación</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? <p className="table-empty">Cargando registros...</p>
        : datos.length === 0 ? <p className="table-empty">No hay relaciones registradas aún.</p>
        : (
          <table>
            <thead>
              <tr><th>Docente</th><th>Producto</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{nombreDocente(fila.docente)}</td>
                  <td>{nombreProducto(fila.producto)}</td>
                  <td><button className="btn-link-delete" onClick={() => setConfirmEliminar(fila)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titulo="Nueva Relación" onClose={cerrarModal}
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
              <label>Docente</label>
              <select name="docente" value={form.docente} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {docentes.map(d => <option key={d.cedula} value={d.cedula}>{d.cedula} - {d.nombres} {d.apellidos}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label>Producto</label>
              <select name="producto" value={form.producto} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.id} - {p.nombre}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {confirmEliminar && (
        <Modal titulo="Confirmar eliminación" onClose={() => setConfirmEliminar(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setConfirmEliminar(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleEliminar(confirmEliminar)}>Sí, eliminar</button>
            </>
          }
        >
          <p style={{ color: '#cbd5e1', fontSize: '14px' }}>¿Estás seguro de eliminar esta relación?</p>
        </Modal>
      )}
    </div>
  );
}