import { useState, useEffect } from 'react';
import { listar, crear, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'ods_proyecto';
const VACIO = { proyecto: '', ods: '' };

export default function OdsProyecto() {
  const [datos, setDatos]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(VACIO);
  const [guardando, setGuardando]   = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [proyectos, setProyectos]   = useState([]);
  const [ods, setOds]               = useState([]);

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
    Promise.allSettled([listar('proyecto'), listar('objetivo_desarrollo_sostenible')])
      .then(([rP, rO]) => {
        if (rP.status === 'fulfilled') setProyectos(rP.value.data.datos || []);
        if (rO.status === 'fulfilled') setOds(rO.value.data.datos || []);
      });
  }, []);

  const handleChange     = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const formularioValido = form.proyecto !== '' && form.ods !== '';
  const abrirModal       = () => { setForm(VACIO); setErrorModal(''); setModal(true); };
  const cerrarModal      = () => { setModal(false); setForm(VACIO); setErrorModal(''); };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      await crear(TABLA, { proyecto: parseInt(form.proyecto), ods: parseInt(form.ods) });
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
      await eliminar(TABLA, 'proyecto', `${fila.proyecto}/ods/${fila.ods}`);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  const nombreProyecto = (id) => proyectos.find(p => p.id == id)?.titulo || id;
  const nombreOds      = (id) => ods.find(o => o.id == id)?.nombre || id;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ODS por Proyecto</h2>
          <p>Relación entre proyectos y objetivos de desarrollo sostenible</p>
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
              <tr><th>Proyecto</th><th>ODS</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{nombreProyecto(fila.proyecto)}</td>
                  <td>{nombreOds(fila.ods)}</td>
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
              <label>Proyecto</label>
              <select name="proyecto" value={form.proyecto} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.id} - {p.titulo}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label>ODS</label>
              <select name="ods" value={form.ods} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {ods.map(o => <option key={o.id} value={o.id}>{o.id} - {o.nombre}</option>)}
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