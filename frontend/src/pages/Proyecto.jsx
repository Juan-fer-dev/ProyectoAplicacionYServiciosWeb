import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'proyecto';
const PK = 'id';
const VACIO = { id: '', titulo: '', resumen: '', presupuesto: '', tipo_financiacion: 'interna', tipo_fondos: 'Público', fecha_inicio: '', fecha_fin: '' };

export default function Proyecto() {
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
  const abrirEditar = (fila) => {
    setForm({
      ...fila,
      fecha_inicio: fila.fecha_inicio?.split('T')[0] || '',
      fecha_fin: fila.fecha_fin?.split('T')[0] || '',
    });
    setPkEditar(fila[PK]);
    setErrorModal('');
    setModal('editar');
  };
  const cerrarModal = () => { setModal(null); setForm(VACIO); setPkEditar(null); setErrorModal(''); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formularioValido =
    form.id.toString().trim() !== '' &&
    form.titulo.trim() !== '' &&
    form.resumen.trim() !== '' &&
    form.presupuesto.toString().trim() !== '' &&
    form.tipo_financiacion.trim() !== '' &&
    form.tipo_fondos.trim() !== '' &&
    form.fecha_inicio.trim() !== '';

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      const payload = {
        ...form,
        id: parseInt(form.id),
        presupuesto: parseFloat(form.presupuesto),
      };
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
          <h2>Proyectos</h2>
          <p>Gestión de proyectos de investigación</p>
        </div>
        <button className="btn-primary" onClick={abrirCrear}>+ Nuevo proyecto</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? (
          <p className="table-empty">Cargando registros...</p>
        ) : datos.length === 0 ? (
          <p className="table-empty">No hay proyectos registrados aún.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Presupuesto</th>
                <th>Tipo Financiación</th>
                <th>Tipo Fondos</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{fila.id}</td>
                  <td>{fila.titulo}</td>
                  <td>${Number(fila.presupuesto).toLocaleString('es-CO')}</td>
                  <td>{fila.tipo_financiacion}</td>
                  <td>{fila.tipo_fondos}</td>
                  <td>{fila.fecha_inicio?.split('T')[0] ?? '-'}</td>
                  <td>{fila.fecha_fin?.split('T')[0] ?? '-'}</td>
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
        <Modal titulo={modal === 'crear' ? 'Nuevo Proyecto' : 'Editar Proyecto'} onClose={cerrarModal}>
          {errorModal && (
            <div className="alert-error" style={{ marginBottom: '16px' }}>{errorModal}</div>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label>ID</label>
              <input name="id" type="number" value={form.id} onChange={handleChange} placeholder="1" disabled={modal === 'editar'} />
            </div>
            <div className="form-group">
              <label>Presupuesto</label>
              <input name="presupuesto" type="number" value={form.presupuesto} onChange={handleChange} placeholder="85000000" />
            </div>
            <div className="form-group full">
              <label>Título</label>
              <input name="titulo" type="text" value={form.titulo} onChange={handleChange} placeholder="Nombre del proyecto" />
            </div>
            <div className="form-group full">
              <label>Resumen</label>
              <input name="resumen" type="text" value={form.resumen} onChange={handleChange} placeholder="Descripción breve del proyecto" />
            </div>
            <div className="form-group">
              <label>Tipo Financiación</label>
              <select name="tipo_financiacion" value={form.tipo_financiacion} onChange={handleChange}>
                <option value="interna">Interna</option>
                <option value="externa">Externa</option>
                <option value="cofinanciado">Cofinanciado</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo Fondos</label>
              <select name="tipo_fondos" value={form.tipo_fondos} onChange={handleChange}>
                <option value="Público">Público</option>
                <option value="Privado">Privado</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>
            <div className="form-group">
              <label>Fecha Inicio</label>
              <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Fecha Fin <span style={{ color: '#64748b', fontWeight: 400 }}>(opcional)</span></label>
              <input name="fecha_fin" type="date" value={form.fecha_fin} onChange={handleChange} />
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
            ¿Estás seguro de eliminar el proyecto con ID <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>? Esta acción no se puede deshacer.
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