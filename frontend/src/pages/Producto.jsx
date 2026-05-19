import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar, obtenerPorClave } from '../api/api';
import Modal from '../components/Modal';

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
  const [relacionesProducto, setRelacionesProducto] = useState({});

  // Relación local del modal
  const [docentesRelacion, setDocentesRelacion]       = useState([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('');

  const cargarTodasRelaciones = async (productosData) => {
    const resultado = {};
    await Promise.allSettled(
      productosData.map(async (p) => {
        try {
          const res = await obtenerPorClave('docente_producto', 'producto', p.id);
          resultado[p.id] = res.data.datos || [];
        } catch { resultado[p.id] = []; }
      })
    );
    setRelacionesProducto(resultado);
  };

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const res = await listar(TABLA);
      const productosData = res.data.datos || [];
      setDatos(productosData);
      await cargarTodasRelaciones(productosData);
    } catch { setError('No se pudieron cargar los registros.'); }
    finally { setCargando(false); }
  };

  useEffect(() => {
    cargar();
    Promise.allSettled([listar('proyecto'), listar('tipo_producto'), listar('docente')])
      .then(([rP, rT, rD]) => {
        if (rP.status === 'fulfilled') setProyectos(rP.value.data.datos || []);
        if (rT.status === 'fulfilled') setTiposProducto(rT.value.data.datos || []);
        if (rD.status === 'fulfilled') setDocentes(rD.value.data.datos || []);
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formularioValido =
    form.id.toString().trim() !== '' &&
    form.nombre.trim() !== '' &&
    form.categoria.trim() !== '' &&
    form.fecha_entrega.trim() !== '' &&
    form.proyecto.toString().trim() !== '' &&
    form.tipo_producto.toString().trim() !== '';

  const cargarRelaciones = async (productoId) => {
    try {
      const res = await obtenerPorClave('docente_producto', 'producto', productoId);
      setDocentesRelacion(res.data.datos || []);
    } catch { setDocentesRelacion([]); }
  };

  const abrirCrear = () => {
    setForm(VACIO); setDocentesRelacion([]); setDocenteSeleccionado(''); setErrorModal(''); setModal('crear');
  };

  const abrirEditar = async (fila) => {
    setForm({
      ...fila,
      fecha_entrega:  fila.fecha_entrega?.split('T')[0] || '',
      proyecto:       fila.proyecto?.toString() || '',
      tipo_producto:  fila.tipo_producto?.toString() || '',
    });
    setPkEditar(fila[PK]);
    setDocenteSeleccionado('');
    setErrorModal('');
    await cargarRelaciones(fila[PK]);
    setModal('editar');
  };

  const cerrarModal = () => {
    setModal(null); setForm(VACIO); setPkEditar(null);
    setErrorModal(''); setDocentesRelacion([]); setDocenteSeleccionado('');
  };

  const agregarDocente = () => {
    if (!docenteSeleccionado) return;
    if (docentesRelacion.some(d => d.docente == docenteSeleccionado)) return;
    setDocentesRelacion([...docentesRelacion, { docente: parseInt(docenteSeleccionado) }]);
    setDocenteSeleccionado('');
  };

  const quitarDocente = (cedula) => setDocentesRelacion(docentesRelacion.filter(d => d.docente != cedula));

  const nombreDocente = (cedula) => {
    const d = docentes.find(d => d.cedula == cedula);
    return d ? `${d.nombres} ${d.apellidos}` : cedula;
  };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      const payload = {
        ...form,
        id:            parseInt(form.id),
        proyecto:      parseInt(form.proyecto),
        tipo_producto: parseInt(form.tipo_producto),
      };
      let productoId = pkEditar;

      if (modal === 'crear') {
        await crear(TABLA, payload);
        productoId = payload.id;
      } else {
        await actualizar(TABLA, PK, pkEditar, payload);
        try { await eliminar('docente_producto', 'producto', pkEditar); } catch {}
      }

      await Promise.allSettled(
        docentesRelacion.map(d => crear('docente_producto', { docente: d.docente, producto: productoId }))
      );

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
      try { await eliminar('docente_producto', 'producto', pk); } catch {}
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
          <h2>Productos</h2>
          <p>Gestión de productos resultantes de investigación</p>
        </div>
        {!readonly && <button className="btn-primary" onClick={abrirCrear}>+ Nuevo producto</button>}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? <p className="table-empty">Cargando registros...</p>
        : datos.length === 0 ? <p className="table-empty">No hay productos registrados aún.</p>
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '1100px' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Fecha Entrega</th>
                  <th>Proyecto</th>
                  <th>Tipo Producto</th>
                  <th>Docentes</th>
                  {!readonly && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {datos.map((fila, i) => (
                  <tr key={i}>
                    <td>{fila.id}</td>
                    <td>{fila.nombre}</td>
                    <td>{fila.categoria}</td>
                    <td>{fila.fecha_entrega?.split('T')[0] ?? '-'}</td>
                    <td>{proyectos.find(p => p.id == fila.proyecto)?.titulo || fila.proyecto}</td>
                    <td>{tiposProducto.find(t => t.id == fila.tipo_producto)?.nombre || fila.tipo_producto}</td>
                    <td>
                      {(relacionesProducto[fila.id] || [])
                        .map(r => nombreDocente(r.docente))
                        .join(', ') || '-'}
                    </td>
                    {!readonly && (
                      <td>
                        <button className="btn-link-edit" onClick={() => abrirEditar(fila)}>Editar</button>
                        <button className="btn-link-delete" onClick={() => setConfirmEliminar(fila[PK])}>Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          titulo={modal === 'crear' ? 'Nuevo Producto' : 'Editar Producto'}
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
            <div className="form-group">
              <label>ID</label>
              <input name="id" type="number" value={form.id} onChange={handleChange}
                placeholder="1" disabled={modal === 'editar'} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input name="categoria" type="text" value={form.categoria}
                onChange={handleChange} placeholder="Artículo" />
            </div>
            <div className="form-group full">
              <label>Nombre</label>
              <input name="nombre" type="text" value={form.nombre}
                onChange={handleChange} placeholder="Nombre del producto" />
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
            <div className="form-group full">
              <label>Tipo de Producto</label>
              <select name="tipo_producto" value={form.tipo_producto} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {tiposProducto.map(t => <option key={t.id} value={t.id}>{t.id} - {t.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Sección docentes */}
          <div className="seccion-relacion-card" style={{ marginTop: '20px' }}>
            <div className="seccion-relacion-titulo">
              <span>Docentes relacionados</span>
            </div>
            <div className="tag-lista">
              {docentesRelacion.length === 0
                ? <span style={{ color: '#64748b', fontSize: '13px' }}>Sin docentes agregados.</span>
                : docentesRelacion.map((d, i) => (
                  <div key={i} className="tag">
                    <span>{nombreDocente(d.docente)}</span>
                    {!readonly && <button onClick={() => quitarDocente(d.docente)}>×</button>}
                  </div>
                ))
              }
            </div>
            {!readonly && (
              <div className="seccion-add-row">
                <select value={docenteSeleccionado} onChange={e => setDocenteSeleccionado(e.target.value)}>
                  <option value="">— Seleccionar docente —</option>
                  {docentes
                    .filter(d => !docentesRelacion.some(r => r.docente == d.cedula))
                    .map(d => <option key={d.cedula} value={d.cedula}>{d.nombres} {d.apellidos}</option>)
                  }
                </select>
                <button onClick={agregarDocente} disabled={!docenteSeleccionado}>+ Agregar</button>
              </div>
            )}
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
            ¿Estás seguro de eliminar el producto con ID <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}