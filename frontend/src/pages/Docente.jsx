import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'docente';
const PK    = 'cedula';
const VACIO = {
  cedula: '', nombres: '', apellidos: '', genero: 'Hombre', cargo: '',
  fecha_nacimiento: '', correo: '', telefono: '', url_cvlac: '',
  fecha_actualizacion: '', escalafon: '', perfil: '',
  cat_minciencia: '', conv_minciencia: '', nacionalidaad: '',
  linea_investigacion_principal: ''
};
const REQUERIDOS = [
  'cedula','nombres','apellidos','genero','cargo','fecha_nacimiento',
  'correo','telefono','url_cvlac','fecha_actualizacion','escalafon',
  'perfil','conv_minciencia','nacionalidaad'
];

export default function Docente() {
  const [datos, setDatos]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(VACIO);
  const [pkEditar, setPkEditar]         = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [errorModal, setErrorModal]     = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [lineas, setLineas]             = useState([]);

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
    listar('linea_investigacion').then(r => setLineas(r.data.datos || [])).catch(() => {});
  }, []);

  const handleChange        = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCedulaChange  = (e) => { const v = e.target.value.replace(/\D/g,''); if(v.length<=10) setForm({...form, cedula: v}); };
  const handleTelefonoChange= (e) => { const v = e.target.value.replace(/\D/g,''); if(v.length<=10) setForm({...form, telefono: v}); };

  const formularioValido = REQUERIDOS.every(k => form[k]?.toString().trim() !== '');

  const abrirCrear  = () => { setForm(VACIO); setErrorModal(''); setModal('crear'); };
  const abrirEditar = (fila) => {
    setForm({
      ...fila,
      cedula: fila.cedula?.toString() || '',
      fecha_nacimiento: fila.fecha_nacimiento?.split('T')[0] || '',
      fecha_actualizacion: fila.fecha_actualizacion?.split('T')[0] || '',
      linea_investigacion_principal: fila.linea_investigacion_principal?.toString() || '',
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
        cedula: parseInt(form.cedula),
        linea_investigacion_principal: form.linea_investigacion_principal !== ''
          ? parseInt(form.linea_investigacion_principal) : null,
      };
      if (modal === 'crear') await crear(TABLA, payload);
      else await actualizar(TABLA, PK, pkEditar, payload);
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message || 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('primary key')) {
        setErrorModal(`La cédula ${form.cedula} ya está registrada.`);
      } else { setErrorModal(msg); }
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
          <h2>Docentes</h2>
          <p>Gestión del perfil profesoral e investigadores</p>
        </div>
        <button className="btn-primary" onClick={abrirCrear}>+ Nuevo docente</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        {cargando ? (
          <p className="table-empty">Cargando registros...</p>
        ) : datos.length === 0 ? (
          <p className="table-empty">No hay docentes registrados aún.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cédula</th><th>Nombres</th><th>Apellidos</th><th>Género</th>
                <th>Cargo</th><th>Correo</th><th>Teléfono</th><th>Escalafón</th>
                <th>Nacionalidad</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  <td>{fila.cedula}</td>
                  <td>{fila.nombres}</td>
                  <td>{fila.apellidos}</td>
                  <td>{fila.genero}</td>
                  <td>{fila.cargo}</td>
                  <td>{fila.correo}</td>
                  <td>{fila.telefono}</td>
                  <td>{fila.escalafon}</td>
                  <td>{fila.nacionalidaad}</td>
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
        <Modal titulo={modal === 'crear' ? 'Nuevo Docente' : 'Editar Docente'} onClose={cerrarModal}>
          {errorModal && <div className="alert-error" style={{ marginBottom: '16px' }}>{errorModal}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>Cédula (máx. 10 dígitos)</label>
              <input name="cedula" type="text" inputMode="numeric" value={form.cedula}
                onChange={handleCedulaChange} placeholder="1234567890" disabled={modal === 'editar'} />
            </div>
            <div className="form-group">
              <label>Género</label>
              <select name="genero" value={form.genero} onChange={handleChange}>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nombres</label>
              <input name="nombres" type="text" value={form.nombres} onChange={handleChange} placeholder="Juan Sebastián" />
            </div>
            <div className="form-group">
              <label>Apellidos</label>
              <input name="apellidos" type="text" value={form.apellidos} onChange={handleChange} placeholder="García López" />
            </div>
            <div className="form-group">
              <label>Cargo</label>
              <input name="cargo" type="text" value={form.cargo} onChange={handleChange} placeholder="Docente investigador" />
            </div>
            <div className="form-group">
              <label>Escalafón</label>
              <input name="escalafon" type="text" value={form.escalafon} onChange={handleChange} placeholder="Asistente" />
            </div>
            <div className="form-group">
              <label>Teléfono (máx. 10 dígitos)</label>
              <input name="telefono" type="text" inputMode="numeric" value={form.telefono}
                onChange={handleTelefonoChange} placeholder="3001234567" />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="docente@usb.edu.co" />
            </div>
            <div className="form-group">
              <label>Fecha de Nacimiento</label>
              <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Fecha de Actualización</label>
              <input name="fecha_actualizacion" type="date" value={form.fecha_actualizacion} onChange={handleChange} />
            </div>
            <div className="form-group full">
              <label>URL CvLAC</label>
              <input name="url_cvlac" type="text" value={form.url_cvlac} onChange={handleChange}
                placeholder="https://scienti.minciencias.gov.co/cvlac/..." />
            </div>
            <div className="form-group full">
              <label>Perfil</label>
              <input name="perfil" type="text" value={form.perfil} onChange={handleChange}
                placeholder="Descripción del perfil profesional" />
            </div>
            <div className="form-group">
              <label>Convocatoria Minciencias</label>
              <input name="conv_minciencia" type="text" value={form.conv_minciencia} onChange={handleChange} placeholder="N/A" />
            </div>
            <div className="form-group">
              <label>Nacionalidad</label>
              <input name="nacionalidaad" type="text" value={form.nacionalidaad} onChange={handleChange} placeholder="Colombiano" />
            </div>
            <div className="form-group">
              <label>Cat. Minciencias <span style={{ color:'#64748b', fontWeight:400 }}>(opcional)</span></label>
              <input name="cat_minciencia" type="text" value={form.cat_minciencia} onChange={handleChange} placeholder="Junior" />
            </div>
            <div className="form-group">
              <label>Línea Investigación Principal <span style={{ color:'#64748b', fontWeight:400 }}>(opcional)</span></label>
              <select name="linea_investigacion_principal" value={form.linea_investigacion_principal} onChange={handleChange}>
                <option value="">— Sin asignar —</option>
                {lineas.map(l => <option key={l.id} value={l.id}>{l.id} - {l.nombre}</option>)}
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
          <p style={{ color:'#cbd5e1', fontSize:'14px' }}>
            ¿Estás seguro de eliminar el docente con cédula <strong style={{ color:'#fff' }}>{confirmEliminar}</strong>? Esta acción no se puede deshacer.
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