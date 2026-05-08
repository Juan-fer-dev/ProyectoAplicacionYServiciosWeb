import { useState, useEffect } from 'react';
import { listar, obtenerPorClave, crear, actualizar, eliminar } from '../api/api';
import Modal from '../components/Modal';
import SeccionRelacion from '../components/SeccionRelacion';

const TABLA = 'proyecto';
const PK    = 'id';
const VACIO = {
  id: '', titulo: '', resumen: '', presupuesto: '',
  tipo_financiacion: 'interna', tipo_fondos: 'Público',
  fecha_inicio: '', fecha_fin: '',
};
const REL_VACIO = {
  aa:         { items: [], toDelete: [], nuevo: '' },
  ac:         { items: [], toDelete: [], nuevo: '' },
  aliado:     { items: [], toDelete: [], nuevo: '' },
  desarrolla: { items: [], toDelete: [], nuevoDocente: '', nuevoRol: '', nuevoDesc: '' },
  ods:        { items: [], toDelete: [], nuevo: '' },
  palabras:   { items: [], toDelete: [], nuevo: '' },
  linea:      { items: [], toDelete: [], nuevo: '' },
};

const TABS = [
  { key: 'aa',         label: 'Áreas Aplicación' },
  { key: 'ac',         label: 'Áreas Conocimiento' },
  { key: 'aliado',     label: 'Aliados' },
  { key: 'desarrolla', label: 'Docentes' },
  { key: 'ods',        label: 'ODS' },
  { key: 'palabras',   label: 'Palabras Clave' },
  { key: 'linea',      label: 'Líneas Investigación' },
];

export default function Proyecto({ readonly = false }) {
  const [datos, setDatos]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(VACIO);
  const [pkEditar, setPkEditar]         = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [errorModal, setErrorModal]     = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [tabActiva, setTabActiva]       = useState('aa');

  const [relaciones, setRelaciones]   = useState(REL_VACIO);
  const [cargandoRel, setCargandoRel] = useState(false);

  const [areasAplicacion, setAreasAplicacion]     = useState([]);
  const [areasConocimiento, setAreasConocimiento] = useState([]);
  const [aliados, setAliados]                     = useState([]);
  const [docentes, setDocentes]                   = useState([]);
  const [odsList, setOdsList]                     = useState([]);
  const [terminos, setTerminos]                   = useState([]);
  const [lineas, setLineas]                       = useState([]);

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
    Promise.allSettled([
      listar('area_aplicacion'),
      listar('area_conocimiento'),
      listar('aliado'),
      listar('docente'),
      listar('objetivo_desarrollo_sostenible'),
      listar('termino_clave'),
      listar('linea_investigacion'),
    ]).then(([rAa, rAc, rAl, rD, rOds, rTc, rLi]) => {
      if (rAa.status  === 'fulfilled') setAreasAplicacion(rAa.value.data.datos || []);
      if (rAc.status  === 'fulfilled') setAreasConocimiento(rAc.value.data.datos || []);
      if (rAl.status  === 'fulfilled') setAliados(rAl.value.data.datos || []);
      if (rD.status   === 'fulfilled') setDocentes(rD.value.data.datos || []);
      if (rOds.status === 'fulfilled') setOdsList(rOds.value.data.datos || []);
      if (rTc.status  === 'fulfilled') setTerminos(rTc.value.data.datos || []);
      if (rLi.status  === 'fulfilled') setLineas(rLi.value.data.datos || []);
    });
  }, []);

  const seleccionarProyecto = (fila) => { setProyectoSeleccionado(fila); setTabActiva('aa'); };

  const abrirCrear = () => {
    setForm(VACIO); setRelaciones(REL_VACIO);
    setErrorModal(''); setModal('crear');
  };

  const abrirEditar = async (fila) => {
    setForm({
      ...fila,
      fecha_inicio: fila.fecha_inicio?.split('T')[0] || '',
      fecha_fin:    fila.fecha_fin?.split('T')[0]    || '',
    });
    setPkEditar(fila[PK]); setErrorModal('');
    setRelaciones(REL_VACIO); setModal('editar'); setCargandoRel(true);
    try {
      const id = fila[PK];
      const [rAa, rAc, rAl, rD, rOds, rPc, rLi] = await Promise.allSettled([
        obtenerPorClave('aa_proyecto',    'proyecto', id),
        obtenerPorClave('ac_proyecto',    'proyecto', id),
        obtenerPorClave('aliado_proyecto','proyecto', id),
        obtenerPorClave('desarrolla',     'proyecto', id),
        obtenerPorClave('ods_proyecto',   'proyecto', id),
        obtenerPorClave('palabras_clave', 'proyecto', id),
        obtenerPorClave('proyecto_linea', 'proyecto', id),
      ]);
      setRelaciones({
        aa:         { items: rAa.status  === 'fulfilled' ? rAa.value.data.datos  || [] : [], toDelete: [], nuevo: '' },
        ac:         { items: rAc.status  === 'fulfilled' ? rAc.value.data.datos  || [] : [], toDelete: [], nuevo: '' },
        aliado:     { items: rAl.status  === 'fulfilled' ? rAl.value.data.datos  || [] : [], toDelete: [], nuevo: '' },
        desarrolla: { items: rD.status   === 'fulfilled' ? rD.value.data.datos   || [] : [], toDelete: [], nuevoDocente: '', nuevoRol: '', nuevoDesc: '' },
        ods:        { items: rOds.status === 'fulfilled' ? rOds.value.data.datos || [] : [], toDelete: [], nuevo: '' },
        palabras:   { items: rPc.status  === 'fulfilled' ? rPc.value.data.datos  || [] : [], toDelete: [], nuevo: '' },
        linea:      { items: rLi.status  === 'fulfilled' ? rLi.value.data.datos  || [] : [], toDelete: [], nuevo: '' },
      });
    } finally { setCargandoRel(false); }
  };

  const cerrarModal = () => {
    setModal(null); setForm(VACIO); setPkEditar(null);
    setErrorModal(''); setRelaciones(REL_VACIO); setCargandoRel(false);
  };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formularioValido =
    form.id.toString().trim() !== '' &&
    form.titulo.trim() !== '' &&
    form.resumen.trim() !== '' &&
    form.presupuesto.toString().trim() !== '' &&
    form.fecha_inicio.trim() !== '';

  const setRel = (key, updates) =>
    setRelaciones(r => ({ ...r, [key]: { ...r[key], ...updates } }));

  const eliminarRelItem = (key, index) => {
    setRelaciones(r => {
      const item = r[key].items[index];
      const newItems = r[key].items.filter((_, i) => i !== index);
      const toDelete = item._new ? r[key].toDelete : [...r[key].toDelete, item];
      return { ...r, [key]: { ...r[key], items: newItems, toDelete } };
    });
  };

  const agregarSimple = (key, campo, toVal = v => v) => {
    setRelaciones(r => {
      const val = r[key].nuevo;
      if (!val) return r;
      if (r[key].items.some(i => String(i[campo]) === String(val))) return r;
      return { ...r, [key]: { ...r[key], items: [...r[key].items, { [campo]: toVal(val), _new: true }], nuevo: '' } };
    });
  };

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      const payload = { ...form, id: parseInt(form.id), presupuesto: parseFloat(form.presupuesto) };
      const proyectoId = modal === 'crear' ? payload.id : pkEditar;

      if (modal === 'crear') await crear(TABLA, payload);
      else await actualizar(TABLA, PK, pkEditar, payload);

      const ops = [];
      relaciones.aa.toDelete.forEach(i =>
        ops.push(eliminar('aa_proyecto', 'proyecto', `${i.proyecto}/area_aplicacion/${i.area_aplicacion}`)));
      relaciones.aa.items.filter(i => i._new).forEach(i =>
        ops.push(crear('aa_proyecto', { proyecto: proyectoId, area_aplicacion: parseInt(i.area_aplicacion) })));

      relaciones.ac.toDelete.forEach(i =>
        ops.push(eliminar('ac_proyecto', 'proyecto', `${i.proyecto}/area_conocimiento/${i.area_conocimiento}`)));
      relaciones.ac.items.filter(i => i._new).forEach(i =>
        ops.push(crear('ac_proyecto', { proyecto: proyectoId, area_conocimiento: i.area_conocimiento })));

      relaciones.aliado.toDelete.forEach(i =>
        ops.push(eliminar('aliado_proyecto', 'aliado', `${i.aliado}/proyecto/${i.proyecto}`)));
      relaciones.aliado.items.filter(i => i._new).forEach(i =>
        ops.push(crear('aliado_proyecto', { aliado: parseInt(i.aliado), proyecto: proyectoId })));

      relaciones.desarrolla.toDelete.forEach(i =>
        ops.push(eliminar('desarrolla', 'docente', `${i.docente}/proyecto/${i.proyecto}`)));
      relaciones.desarrolla.items.filter(i => i._new).forEach(i =>
        ops.push(crear('desarrolla', { docente: parseInt(i.docente), proyecto: proyectoId, rol: i.rol, descripcion: i.descripcion })));

      relaciones.ods.toDelete.forEach(i =>
        ops.push(eliminar('ods_proyecto', 'proyecto', `${i.proyecto}/ods/${i.ods}`)));
      relaciones.ods.items.filter(i => i._new).forEach(i =>
        ops.push(crear('ods_proyecto', { proyecto: proyectoId, ods: parseInt(i.ods) })));

      relaciones.palabras.toDelete.forEach(i =>
        ops.push(eliminar('palabras_clave', 'proyecto', `${i.proyecto}/termino_clave/${i.termino_clave}`)));
      relaciones.palabras.items.filter(i => i._new).forEach(i =>
        ops.push(crear('palabras_clave', { proyecto: proyectoId, termino_clave: i.termino_clave })));

      relaciones.linea.toDelete.forEach(i =>
        ops.push(eliminar('proyecto_linea', 'proyecto', `${i.proyecto}/linea_investigacion/${i.linea_investigacion}`)));
      relaciones.linea.items.filter(i => i._new).forEach(i =>
        ops.push(crear('proyecto_linea', { proyecto: proyectoId, linea_investigacion: parseInt(i.linea_investigacion) })));

      await Promise.allSettled(ops);
      await cargar();
      cerrarModal();
    } catch (e) {
      const msg = e.response?.data?.detalle || e.message || 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('primary key') || msg.toLowerCase().includes('unique'))
        setErrorModal(`El ID ${form.id} ya existe en la base de datos. Usa un ID diferente.`);
      else setErrorModal(msg);
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (pk) => {
    try {
      await eliminar(TABLA, PK, pk);
      if (proyectoSeleccionado?.[PK] === pk) setProyectoSeleccionado(null);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  // Options arrays for the detail panel (SeccionRelacion)
  const opcionesAa  = { area_aplicacion:     areasAplicacion.map(a  => ({ valor: a.id,      etiqueta: `${a.id} - ${a.nombre}` })) };
  const opcionesAc  = { area_conocimiento:   areasConocimiento.map(a => ({ valor: a.id,      etiqueta: `${a.id} - ${a.disciplina}` })) };
  const opcionesAl  = { aliado:              aliados.map(a           => ({ valor: a.nit,     etiqueta: `${a.nit} - ${a.razon_social}` })) };
  const opcionesD   = { docente:             docentes.map(d          => ({ valor: d.cedula,  etiqueta: `${d.cedula} - ${d.nombres} ${d.apellidos}` })) };
  const opcionesOds = { ods:                 odsList.map(o           => ({ valor: o.id,      etiqueta: `${o.id} - ${o.nombre}` })) };
  const opcionesPc  = { termino_clave:       terminos.map(t          => ({ valor: t.termino, etiqueta: t.termino })) };
  const opcionesLi  = { linea_investigacion: lineas.map(l            => ({ valor: l.id,      etiqueta: `${l.id} - ${l.nombre}` })) };

  // Display helpers for modal relation sections
  const etqAa    = v => areasAplicacion.find(a => a.id == v)?.nombre || v;
  const etqAc    = v => areasConocimiento.find(a => a.id == v)?.disciplina || v;
  const etqAl    = v => aliados.find(a => a.nit == v)?.razon_social || v;
  const etqDoc   = v => { const d = docentes.find(d => d.cedula == v); return d ? `${d.nombres} ${d.apellidos}` : v; };
  const etqOds   = v => odsList.find(o => o.id == v)?.nombre || v;
  const etqLinea = v => lineas.find(l => l.id == v)?.nombre || v;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Proyectos</h2>
          <p>Gestión de proyectos de investigación</p>
        </div>
       {!readonly && <button className="btn-primary" onClick={abrirCrear}>+ Nuevo proyecto</button>}
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
                <th>ID</th><th>Título</th><th>Presupuesto</th>
                <th>Tipo Financiación</th><th>Tipo Fondos</th>
                <th>Fecha Inicio</th><th>Fecha Fin</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i} style={{ cursor: 'pointer' }} onClick={() => seleccionarProyecto(fila)}>
                  <td>{fila.id}</td>
                  <td>{fila.titulo}</td>
                  <td>${Number(fila.presupuesto).toLocaleString('es-CO')}</td>
                  <td>{fila.tipo_financiacion}</td>
                  <td>{fila.tipo_fondos}</td>
                  <td>{fila.fecha_inicio?.split('T')[0] ?? '-'}</td>
                  <td>{fila.fecha_fin?.split('T')[0] ?? '-'}</td>
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

      {proyectoSeleccionado && (
        <div className="proyecto-detalle">
          <div className="proyecto-detalle-header">
            <div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Proyecto seleccionado</span>
              <h3 style={{ color: '#fff', fontSize: '15px', margin: '2px 0 0' }}>
                #{proyectoSeleccionado.id} — {proyectoSeleccionado.titulo}
              </h3>
            </div>
            <button className="btn-secondary" onClick={() => setProyectoSeleccionado(null)}>✕ Cerrar</button>
          </div>

          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`tab-btn${tabActiva === t.key ? ' active' : ''}`}
                onClick={() => setTabActiva(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tabActiva === 'aa' && (
            <SeccionRelacion
              titulo="Áreas de Aplicación" tabla="aa_proyecto"
              campoFiltro="proyecto" valorFiltro={proyectoSeleccionado.id}
              columnas={[{ key: 'area_aplicacion', label: 'Área de Aplicación',
                render: val => areasAplicacion.find(a => a.id == val)?.nombre || val }]}
              campos={[
                { key: 'proyecto',        oculto: true, esInt: true },
                { key: 'area_aplicacion', label: 'Área de Aplicación', tipo: 'select', esInt: true },
              ]}
              opciones={opcionesAa}
              pkPath={f => ['proyecto', `${f.proyecto}/area_aplicacion/${f.area_aplicacion}`]}
            />
          )}
          {tabActiva === 'ac' && (
            <SeccionRelacion
              titulo="Áreas de Conocimiento" tabla="ac_proyecto"
              campoFiltro="proyecto" valorFiltro={proyectoSeleccionado.id}
              columnas={[{ key: 'area_conocimiento', label: 'Área de Conocimiento',
                render: val => areasConocimiento.find(a => a.id == val)?.disciplina || val }]}
              campos={[
                { key: 'proyecto',          oculto: true, esInt: true },
                { key: 'area_conocimiento', label: 'Área de Conocimiento', tipo: 'select', esInt: false },
              ]}
              opciones={opcionesAc}
              pkPath={f => ['proyecto', `${f.proyecto}/area_conocimiento/${f.area_conocimiento}`]}
              buildPayload={f => ({ proyecto: parseInt(f.proyecto), area_conocimiento: f.area_conocimiento })}
            />
          )}
          {tabActiva === 'aliado' && (
            <SeccionRelacion
              titulo="Aliados" tabla="aliado_proyecto"
              campoFiltro="proyecto" valorFiltro={proyectoSeleccionado.id}
              columnas={[{ key: 'aliado', label: 'Aliado',
                render: val => aliados.find(a => a.nit == val)?.razon_social || val }]}
              campos={[
                { key: 'proyecto', oculto: true, esInt: true },
                { key: 'aliado',   label: 'Aliado', tipo: 'select', esInt: true },
              ]}
              opciones={opcionesAl}
              pkPath={f => ['aliado', `${f.aliado}/proyecto/${f.proyecto}`]}
              buildPayload={f => ({ aliado: parseInt(f.aliado), proyecto: parseInt(f.proyecto) })}
            />
          )}
          {tabActiva === 'desarrolla' && (
            <SeccionRelacion
              titulo="Docentes" tabla="desarrolla"
              campoFiltro="proyecto" valorFiltro={proyectoSeleccionado.id}
              columnas={[
                { key: 'docente', label: 'Docente',
                  render: val => { const d = docentes.find(d => d.cedula == val); return d ? `${d.nombres} ${d.apellidos}` : val; } },
                { key: 'rol',         label: 'Rol' },
                { key: 'descripcion', label: 'Descripción' },
              ]}
              campos={[
                { key: 'proyecto',    oculto: true, esInt: true },
                { key: 'docente',     label: 'Docente',     tipo: 'select', esInt: true },
                { key: 'rol',         label: 'Rol',         tipo: 'text',   placeholder: 'Investigador principal' },
                { key: 'descripcion', label: 'Descripción', tipo: 'text',   placeholder: 'Descripción del rol' },
              ]}
              opciones={opcionesD}
              pkPath={f => ['docente', `${f.docente}/proyecto/${f.proyecto}`]}
              buildPayload={f => ({ docente: parseInt(f.docente), proyecto: parseInt(f.proyecto), rol: f.rol, descripcion: f.descripcion })}
            />
          )}
          {tabActiva === 'ods' && (
            <SeccionRelacion
              titulo="Objetivos de Desarrollo Sostenible" tabla="ods_proyecto"
              campoFiltro="proyecto" valorFiltro={proyectoSeleccionado.id}
              columnas={[{ key: 'ods', label: 'ODS',
                render: val => odsList.find(o => o.id == val)?.nombre || val }]}
              campos={[
                { key: 'proyecto', oculto: true, esInt: true },
                { key: 'ods',      label: 'ODS', tipo: 'select', esInt: true },
              ]}
              opciones={opcionesOds}
              pkPath={f => ['proyecto', `${f.proyecto}/ods/${f.ods}`]}
            />
          )}
          {tabActiva === 'palabras' && (
            <SeccionRelacion
              titulo="Palabras Clave" tabla="palabras_clave"
              campoFiltro="proyecto" valorFiltro={proyectoSeleccionado.id}
              columnas={[{ key: 'termino_clave', label: 'Término Clave' }]}
              campos={[
                { key: 'proyecto',      oculto: true, esInt: true },
                { key: 'termino_clave', label: 'Término Clave', tipo: 'select', esInt: false },
              ]}
              opciones={opcionesPc}
              pkPath={f => ['proyecto', `${f.proyecto}/termino_clave/${f.termino_clave}`]}
              buildPayload={f => ({ proyecto: parseInt(f.proyecto), termino_clave: f.termino_clave })}
            />
          )}
          {tabActiva === 'linea' && (
            <SeccionRelacion
              titulo="Líneas de Investigación" tabla="proyecto_linea"
              campoFiltro="proyecto" valorFiltro={proyectoSeleccionado.id}
              columnas={[{ key: 'linea_investigacion', label: 'Línea de Investigación',
                render: val => lineas.find(l => l.id == val)?.nombre || val }]}
              campos={[
                { key: 'proyecto',            oculto: true, esInt: true },
                { key: 'linea_investigacion', label: 'Línea de Investigación', tipo: 'select', esInt: true },
              ]}
              opciones={opcionesLi}
              pkPath={f => ['proyecto', `${f.proyecto}/linea_investigacion/${f.linea_investigacion}`]}
            />
          )}
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      {modal && (
        <Modal
          titulo={modal === 'crear' ? 'Nuevo Proyecto' : 'Editar Proyecto'}
          onClose={cerrarModal}
          className="modal-wide"
        >
          {errorModal && <div className="alert-error" style={{ marginBottom: '16px' }}>{errorModal}</div>}

          {/* ── Datos del proyecto ── */}
          <p className="form-seccion-label">Datos del proyecto</p>
          <div className="form-grid">
            <div className="form-group">
              <label>ID</label>
              <input name="id" type="number" value={form.id} onChange={handleChange}
                placeholder="1" disabled={modal === 'editar'} />
            </div>
            <div className="form-group">
              <label>Presupuesto</label>
              <input name="presupuesto" type="number" value={form.presupuesto}
                onChange={handleChange} placeholder="85000000" />
            </div>
            <div className="form-group full">
              <label>Título</label>
              <input name="titulo" type="text" value={form.titulo}
                onChange={handleChange} placeholder="Nombre del proyecto" />
            </div>
            <div className="form-group full">
              <label>Resumen</label>
              <textarea name="resumen" value={form.resumen} onChange={handleChange}
                placeholder="Descripción breve del proyecto" rows={3} />
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

          {/* ── Secciones de relaciones ── */}
          {cargandoRel ? (
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '24px', textAlign: 'center' }}>
              Cargando relaciones existentes...
            </p>
          ) : (
            <>
              {/* Áreas de Aplicación */}
              <div className="form-seccion">
                <div className="form-seccion-titulo">Áreas de Aplicación</div>
                <div className="form-seccion-body">
                  {relaciones.aa.items.length === 0
                    ? <p className="rel-vacio">Sin áreas agregadas.</p>
                    : relaciones.aa.items.map((item, i) => (
                        <div key={i} className="rel-item">
                          <span className="rel-item-texto">
                            {etqAa(item.area_aplicacion)}
                            {item._new && <span className="rel-badge-new"> · nuevo</span>}
                          </span>
                          <button className="btn-link-delete" onClick={() => eliminarRelItem('aa', i)}>Eliminar</button>
                        </div>
                      ))
                  }
                  <div className="rel-agregar">
                    <select value={relaciones.aa.nuevo}
                      onChange={e => setRel('aa', { nuevo: e.target.value })}>
                      <option value="">— Seleccionar área —</option>
                      {opcionesAa.area_aplicacion
                        .filter(o => !relaciones.aa.items.some(i => String(i.area_aplicacion) === String(o.valor)))
                        .map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 14px', flexShrink: 0 }}
                      onClick={() => agregarSimple('aa', 'area_aplicacion', parseInt)}
                      disabled={!relaciones.aa.nuevo}>Agregar</button>
                  </div>
                </div>
              </div>

              {/* Áreas de Conocimiento */}
              <div className="form-seccion">
                <div className="form-seccion-titulo">Áreas de Conocimiento</div>
                <div className="form-seccion-body">
                  {relaciones.ac.items.length === 0
                    ? <p className="rel-vacio">Sin áreas agregadas.</p>
                    : relaciones.ac.items.map((item, i) => (
                        <div key={i} className="rel-item">
                          <span className="rel-item-texto">
                            {etqAc(item.area_conocimiento)}
                            {item._new && <span className="rel-badge-new"> · nuevo</span>}
                          </span>
                          <button className="btn-link-delete" onClick={() => eliminarRelItem('ac', i)}>Eliminar</button>
                        </div>
                      ))
                  }
                  <div className="rel-agregar">
                    <select value={relaciones.ac.nuevo}
                      onChange={e => setRel('ac', { nuevo: e.target.value })}>
                      <option value="">— Seleccionar área —</option>
                      {opcionesAc.area_conocimiento
                        .filter(o => !relaciones.ac.items.some(i => String(i.area_conocimiento) === String(o.valor)))
                        .map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 14px', flexShrink: 0 }}
                      onClick={() => agregarSimple('ac', 'area_conocimiento')}
                      disabled={!relaciones.ac.nuevo}>Agregar</button>
                  </div>
                </div>
              </div>

              {/* Aliados */}
              <div className="form-seccion">
                <div className="form-seccion-titulo">Aliados</div>
                <div className="form-seccion-body">
                  {relaciones.aliado.items.length === 0
                    ? <p className="rel-vacio">Sin aliados agregados.</p>
                    : relaciones.aliado.items.map((item, i) => (
                        <div key={i} className="rel-item">
                          <span className="rel-item-texto">
                            {etqAl(item.aliado)}
                            {item._new && <span className="rel-badge-new"> · nuevo</span>}
                          </span>
                          <button className="btn-link-delete" onClick={() => eliminarRelItem('aliado', i)}>Eliminar</button>
                        </div>
                      ))
                  }
                  <div className="rel-agregar">
                    <select value={relaciones.aliado.nuevo}
                      onChange={e => setRel('aliado', { nuevo: e.target.value })}>
                      <option value="">— Seleccionar aliado —</option>
                      {opcionesAl.aliado
                        .filter(o => !relaciones.aliado.items.some(i => String(i.aliado) === String(o.valor)))
                        .map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 14px', flexShrink: 0 }}
                      onClick={() => agregarSimple('aliado', 'aliado', parseInt)}
                      disabled={!relaciones.aliado.nuevo}>Agregar</button>
                  </div>
                </div>
              </div>

              {/* Docentes */}
              <div className="form-seccion">
                <div className="form-seccion-titulo">Docentes</div>
                <div className="form-seccion-body">
                  {relaciones.desarrolla.items.length === 0
                    ? <p className="rel-vacio">Sin docentes agregados.</p>
                    : relaciones.desarrolla.items.map((item, i) => (
                        <div key={i} className="rel-item">
                          <span className="rel-item-texto">
                            {etqDoc(item.docente)}
                            {item.rol && <span style={{ color: '#94a3b8' }}> · {item.rol}</span>}
                            {item.descripcion && <span style={{ color: '#64748b' }}> · {item.descripcion}</span>}
                            {item._new && <span className="rel-badge-new"> · nuevo</span>}
                          </span>
                          <button className="btn-link-delete" onClick={() => eliminarRelItem('desarrolla', i)}>Eliminar</button>
                        </div>
                      ))
                  }
                  <div className="rel-agregar" style={{ flexWrap: 'wrap' }}>
                    <select
                      value={relaciones.desarrolla.nuevoDocente}
                      onChange={e => setRel('desarrolla', { nuevoDocente: e.target.value })}
                      style={{ flex: '2 1 160px' }}>
                      <option value="">— Seleccionar docente —</option>
                      {opcionesD.docente
                        .filter(o => !relaciones.desarrolla.items.some(i => String(i.docente) === String(o.valor)))
                        .map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <input placeholder="Rol *" value={relaciones.desarrolla.nuevoRol}
                      onChange={e => setRel('desarrolla', { nuevoRol: e.target.value })}
                      style={{ flex: '1 1 90px' }} />
                    <input placeholder="Descripción" value={relaciones.desarrolla.nuevoDesc}
                      onChange={e => setRel('desarrolla', { nuevoDesc: e.target.value })}
                      style={{ flex: '1 1 110px' }} />
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 14px', flexShrink: 0 }}
                      onClick={() => {
                        setRelaciones(r => {
                          const { nuevoDocente, nuevoRol, nuevoDesc } = r.desarrolla;
                          if (!nuevoDocente || !nuevoRol) return r;
                          return {
                            ...r,
                            desarrolla: {
                              ...r.desarrolla,
                              items: [...r.desarrolla.items, {
                                docente: parseInt(nuevoDocente), rol: nuevoRol,
                                descripcion: nuevoDesc, _new: true,
                              }],
                              nuevoDocente: '', nuevoRol: '', nuevoDesc: '',
                            },
                          };
                        });
                      }}
                      disabled={!relaciones.desarrolla.nuevoDocente || !relaciones.desarrolla.nuevoRol}>
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* ODS */}
              <div className="form-seccion">
                <div className="form-seccion-titulo">Objetivos de Desarrollo Sostenible</div>
                <div className="form-seccion-body">
                  {relaciones.ods.items.length === 0
                    ? <p className="rel-vacio">Sin ODS agregados.</p>
                    : relaciones.ods.items.map((item, i) => (
                        <div key={i} className="rel-item">
                          <span className="rel-item-texto">
                            {etqOds(item.ods)}
                            {item._new && <span className="rel-badge-new"> · nuevo</span>}
                          </span>
                          <button className="btn-link-delete" onClick={() => eliminarRelItem('ods', i)}>Eliminar</button>
                        </div>
                      ))
                  }
                  <div className="rel-agregar">
                    <select value={relaciones.ods.nuevo}
                      onChange={e => setRel('ods', { nuevo: e.target.value })}>
                      <option value="">— Seleccionar ODS —</option>
                      {opcionesOds.ods
                        .filter(o => !relaciones.ods.items.some(i => String(i.ods) === String(o.valor)))
                        .map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 14px', flexShrink: 0 }}
                      onClick={() => agregarSimple('ods', 'ods', parseInt)}
                      disabled={!relaciones.ods.nuevo}>Agregar</button>
                  </div>
                </div>
              </div>

              {/* Palabras Clave */}
              <div className="form-seccion">
                <div className="form-seccion-titulo">Palabras Clave</div>
                <div className="form-seccion-body">
                  {relaciones.palabras.items.length === 0
                    ? <p className="rel-vacio">Sin palabras clave agregadas.</p>
                    : relaciones.palabras.items.map((item, i) => (
                        <div key={i} className="rel-item">
                          <span className="rel-item-texto">
                            {item.termino_clave}
                            {item._new && <span className="rel-badge-new"> · nuevo</span>}
                          </span>
                          <button className="btn-link-delete" onClick={() => eliminarRelItem('palabras', i)}>Eliminar</button>
                        </div>
                      ))
                  }
                  <div className="rel-agregar">
                    <select value={relaciones.palabras.nuevo}
                      onChange={e => setRel('palabras', { nuevo: e.target.value })}>
                      <option value="">— Seleccionar término —</option>
                      {opcionesPc.termino_clave
                        .filter(o => !relaciones.palabras.items.some(i => i.termino_clave === o.valor))
                        .map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 14px', flexShrink: 0 }}
                      onClick={() => agregarSimple('palabras', 'termino_clave')}
                      disabled={!relaciones.palabras.nuevo}>Agregar</button>
                  </div>
                </div>
              </div>

              {/* Líneas de Investigación */}
              <div className="form-seccion">
                <div className="form-seccion-titulo">Líneas de Investigación</div>
                <div className="form-seccion-body">
                  {relaciones.linea.items.length === 0
                    ? <p className="rel-vacio">Sin líneas agregadas.</p>
                    : relaciones.linea.items.map((item, i) => (
                        <div key={i} className="rel-item">
                          <span className="rel-item-texto">
                            {etqLinea(item.linea_investigacion)}
                            {item._new && <span className="rel-badge-new"> · nuevo</span>}
                          </span>
                          <button className="btn-link-delete" onClick={() => eliminarRelItem('linea', i)}>Eliminar</button>
                        </div>
                      ))
                  }
                  <div className="rel-agregar">
                    <select value={relaciones.linea.nuevo}
                      onChange={e => setRel('linea', { nuevo: e.target.value })}>
                      <option value="">— Seleccionar línea —</option>
                      {opcionesLi.linea_investigacion
                        .filter(o => !relaciones.linea.items.some(i => String(i.linea_investigacion) === String(o.valor)))
                        .map(o => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                    </select>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 14px', flexShrink: 0 }}
                      onClick={() => agregarSimple('linea', 'linea_investigacion', parseInt)}
                      disabled={!relaciones.linea.nuevo}>Agregar</button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="modal-footer-sticky">
            <button className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
            <button className="btn-primary" onClick={handleGuardar}
              disabled={guardando || !formularioValido}>
              {guardando ? 'Guardando...' : 'Guardar proyecto'}
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
