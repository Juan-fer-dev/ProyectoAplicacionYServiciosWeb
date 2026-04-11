import { useState, useEffect } from 'react';
import { listar, crear, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'aliado_proyecto';
const VACIO = { aliado: '', proyecto: '' };

export default function AliadoProyecto() {
  const [datos, setDatos]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(VACIO);
  const [guardando, setGuardando]   = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [proyectos, setProyectos]   = useState([]);
  const [aliados, setAliados]       = useState([]);

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
    Promise.allSettled([listar('proyecto'), listar('aliado')])
      .then(([rP, rA]) => {
        if (rP.status === 'fulfilled') setProyectos(rP.value.data.datos || []);
        if (rA.status === 'fulfilled') setAliados(rA.value.data.datos || []);
      });
  }, []);

  const handleChange     = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const formularioValido = form.aliado !== '' && form.proyecto !== '';
  const abrirModal       = () => { setForm(VACIO); setErrorModal(''); setModal(true); };
  const cerrarModal      = () => { setModal(false); setForm(VACIO); setErrorModal(''); };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      await crear(TABLA, { aliado: parseInt(form.aliado), proyecto: parseInt(form.proyecto) });
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
      await eliminar(TABLA, 'aliado', `${fila.aliado}/proyecto/${fila.proyecto}`);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  const nombreProyecto = (id) => proyectos.find(p => p.id == id)?.titulo || id;
  const nombreAliado   = (id) => aliados.find(a => a.nit == id)?.razon_social || id;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Aliados por Proyecto</h2>
          <p>Relación entre aliados y proyectos de investigación</p>
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
              <tr><th>Aliado</th><th>Proyecto</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{nombreAliado(fila.aliado)}</td>
                  <td>{nombreProyecto(fila.proyecto)}</td>
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
              <label>Aliado</label>
              <select name="aliado" value={form.aliado} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {aliados.map(a => <option key={a.nit} value={a.nit}>{a.nit} - {a.razon_social}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label>Proyecto</label>
              <select name="proyecto" value={form.proyecto} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.id} - {p.titulo}</option>)}
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