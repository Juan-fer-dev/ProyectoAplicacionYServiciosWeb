import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar } from '../api/api';
import Modal from '../components/Modal';
import SeccionRelacion from '../components/SeccionRelacion';

const TABLA = 'producto';
const PK    = 'id';
const VACIO = { id: '', nombre: '', categoria: '', fecha_entrega: '', proyecto: '', tipo_producto: '' };

export default function Producto({ readonly = false }) {
  const [datos, setDatos]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(VACIO);
  const [pkEditar, setPkEditar]         = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [errorModal, setErrorModal]     = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [proyectos, setProyectos]       = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [docentes, setDocentes]         = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const res = await listar(TABLA);
      setDatos(res.data.datos || []);
    } catch {
      setError('No se pudieron cargar los registros.');
    } finally { setCargando(false); }
  };

  useEffect(() => {
    cargar();
    Promise.all([listar('proyecto'), listar('tipo_producto'), listar('docente')])
      .then(([rP, rT, rD]) => {
        setProyectos(rP.data.datos || []);
        setTiposProducto(rT.data.datos || []);
        setDocentes(rD.data.datos || []);
      }).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formularioValido =
    form.id.toString().trim() !== '' &&
    form.nombre.trim() !== '' &&
    form.categoria.trim() !== '' &&
    form.fecha_entrega.trim() !== '' &&
    form.proyecto.toString().trim() !== '' &&
    form.tipo_producto.toString().trim() !== '';

  const abrirCrear  = () => { setForm(VACIO); setErrorModal(''); setModal('crear'); };
  const abrirEditar = (fila) => {
    setForm({
      ...fila,
      fecha_entrega: fila.fecha_entrega?.split('T')[0] || '',
      proyecto: fila.proyecto?.toString() || '',
      tipo_producto: fila.tipo_producto?.toString() || '',
    });
    setPkEditar(fila[PK]);
    setErrorModal('');
    setModal('editar');
  };
  const cerrarModal = () => { setModal(null); setForm(VACIO); setPkEditar(null); setErrorModal(''); };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      const payload = {
        ...form,
        id: parseInt(form.id),
        proyecto: parseInt(form.proyecto),
        tipo_producto: parseInt(form.tipo_producto),
      };
      if (modal === 'crear') await crear(TABLA, payload);
      else await actualizar(TABLA, PK, pkEditar, payload);
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message || 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('primary key'))
        setErrorModal(`El ID ${form.id} ya existe en la base de datos.`);
      else setErrorModal(msg);
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (pk) => {
    try {
      await eliminar(TABLA, PK, pk);
      if (productoSeleccionado?.id === pk) setProductoSeleccionado(null);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  const opcionesDocente = { docente: docentes.map(d => ({ valor: d.cedula, etiqueta: `${d.cedula} - ${d.nombres} ${d.apellidos}` })) };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Productos</h2>
          <p>Gestión de productos resultantes de investigación</p>
        </div>
        {!readonly && <button className="btn-primary" onClick={abrirCrear}>+ Nuevo producto</button>}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? (
          <p className="table-empty">Cargando registros...</p>
        ) : datos.length === 0 ? (
          <p className="table-empty">No hay productos registrados aún.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Categoría</th><th>Fecha Entrega</th>
                <th>Proyecto</th><th>Tipo Producto</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setProductoSeleccionado(fila)}>
                  <td>{fila.id}</td>
                  <td>{fila.nombre}</td>
                  <td>{fila.categoria}</td>
                  <td>{fila.fecha_entrega?.split('T')[0] ?? '-'}</td>
                  <td>{proyectos.find(p => p.id == fila.proyecto)?.titulo || fila.proyecto}</td>
                  <td>{tiposProducto.find(t => t.id == fila.tipo_producto)?.nombre || fila.tipo_producto}</td>
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

      {productoSeleccionado && (
        <div className="proyecto-detalle">
          <div className="proyecto-detalle-header">
            <div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Producto seleccionado</span>
              <h3 style={{ color: '#fff', fontSize: '15px', margin: '2px 0 0' }}>
                #{productoSeleccionado.id} — {productoSeleccionado.nombre}
              </h3>
            </div>
            <button className="btn-secondary" onClick={() => setProductoSeleccionado(null)}>✕ Cerrar</button>
          </div>
          <SeccionRelacion
            titulo="Docentes relacionados"
            tabla="docente_producto"
            campoFiltro="producto"
            valorFiltro={productoSeleccionado.id}
            columnas={[{ key: 'docente', label: 'Docente',
              render: val => { const d = docentes.find(d => d.cedula == val); return d ? `${d.cedula} - ${d.nombres} ${d.apellidos}` : val; } }]}
            campos={[
              { key: 'producto', oculto: true, esInt: true },
              { key: 'docente',  label: 'Docente', tipo: 'select', esInt: true },
            ]}
            opciones={opcionesDocente}
            pkPath={f => ['docente', `${f.docente}/producto/${f.producto}`]}
            buildPayload={f => ({ docente: parseInt(f.docente), producto: parseInt(f.producto) })}
          />
        </div>
      )}

      {modal && (
        <Modal titulo={modal === 'crear' ? 'Nuevo Producto' : 'Editar Producto'} onClose={cerrarModal}>
          {errorModal && <div className="alert-error" style={{ marginBottom: '16px' }}>{errorModal}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>ID</label>
              <input name="id" type="number" value={form.id} onChange={handleChange}
                placeholder="1" disabled={modal === 'editar'} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input name="categoria" type="text" value={form.categoria} onChange={handleChange} placeholder="Artículo" />
            </div>
            <div className="form-group full">
              <label>Nombre</label>
              <input name="nombre" type="text" value={form.nombre} onChange={handleChange} placeholder="Nombre del producto" />
            </div>
            <div className="form-group">
              <label>Fecha de Entrega</label>
              <input name="fecha_entrega" type="date" value={form.fecha_entrega} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Proyecto</label>
              <select name="proyecto" value={form.proyecto} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.id} - {p.titulo}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de Producto</label>
              <select name="tipo_producto" value={form.tipo_producto} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {tiposProducto.map(t => <option key={t.id} value={t.id}>{t.id} - {t.nombre}</option>)}
              </select>
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
            ¿Estás seguro de eliminar el producto con ID <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>?
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
