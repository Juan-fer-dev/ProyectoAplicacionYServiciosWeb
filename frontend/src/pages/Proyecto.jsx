import { useState, useEffect } from 'react';
import { listar, crear, actualizar, eliminar, obtenerPorClave } from '../api/api';
import Modal from '../components/Modal';

const TABLA = 'proyecto';
const PK    = 'id';
const VACIO = {
  id: '', titulo: '', resumen: '', presupuesto: '',
  tipo_financiacion: 'interna', tipo_fondos: 'Público',
  fecha_inicio: '', fecha_fin: ''
};

export default function Proyecto({ readonly = false }) {
  const [datos, setDatos]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(VACIO);
  const [pkEditar, setPkEditar]     = useState(null);
  const [guardando, setGuardando]   = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [relaciones, setRelaciones] = useState({});

  // Catálogos
  const [areasAplicacion,   setAreasAplicacion]   = useState([]);
  const [areasConocimiento, setAreasConocimiento] = useState([]);
  const [aliados,           setAliados]           = useState([]);
  const [docentes,          setDocentes]          = useState([]);
  const [odsList,           setOdsList]           = useState([]);
  const [terminos,          setTerminos]          = useState([]);
  const [lineas,            setLineas]            = useState([]);

  // Relaciones locales del modal
  const [relAa,      setRelAa]      = useState([]);
  const [relAc,      setRelAc]      = useState([]);
  const [relAliados, setRelAliados] = useState([]);
  const [relDoc,     setRelDoc]     = useState([]);
  const [relOds,     setRelOds]     = useState([]);
  const [relPc,      setRelPc]      = useState([]);
  const [relLineas,  setRelLineas]  = useState([]);

  // Selects temporales
  const [selAa,      setSelAa]      = useState('');
  const [selAc,      setSelAc]      = useState('');
  const [selAliado,  setSelAliado]  = useState('');
  const [selDoc,     setSelDoc]     = useState('');
  const [selDocRol,  setSelDocRol]  = useState('');
  const [selDocDesc, setSelDocDesc] = useState('');
  const [selOds,     setSelOds]     = useState('');
  const [selPc,      setSelPc]      = useState('');
  const [selLinea,   setSelLinea]   = useState('');

  const cargarTodasRelaciones = async (proyectosData) => {
    const resultado = {};
    await Promise.allSettled(
      proyectosData.map(async (p) => {
        const safe = async (fn) => { try { return (await fn()).data.datos || []; } catch { return []; } };
        const [aa, ac, al, doc, ods, pc, li] = await Promise.all([
          safe(() => obtenerPorClave('aa_proyecto',     'proyecto', p.id)),
          safe(() => obtenerPorClave('ac_proyecto',     'proyecto', p.id)),
          safe(() => obtenerPorClave('aliado_proyecto', 'proyecto', p.id)),
          safe(() => obtenerPorClave('desarrolla',      'proyecto', p.id)),
          safe(() => obtenerPorClave('ods_proyecto',    'proyecto', p.id)),
          safe(() => obtenerPorClave('palabras_clave',  'proyecto', p.id)),
          safe(() => obtenerPorClave('proyecto_linea',  'proyecto', p.id)),
        ]);
        resultado[p.id] = { aa, ac, aliados: al, doc, ods, pc, lineas: li };
      })
    );
    setRelaciones(resultado);
  };

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const res = await listar(TABLA);
      const proyectosData = res.data.datos || [];
      setDatos(proyectosData);
      await cargarTodasRelaciones(proyectosData);
    } catch { setError('No se pudieron cargar los registros.'); }
    finally { setCargando(false); }
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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formularioValido =
    form.id.toString().trim() !== '' &&
    form.titulo.trim() !== '' &&
    form.resumen.trim() !== '' &&
    form.presupuesto.toString().trim() !== '' &&
    form.fecha_inicio.trim() !== '';

  const resetRelaciones = () => {
    setRelAa([]); setRelAc([]); setRelAliados([]); setRelDoc([]);
    setRelOds([]); setRelPc([]); setRelLineas([]);
    setSelAa(''); setSelAc(''); setSelAliado(''); setSelDoc('');
    setSelDocRol(''); setSelDocDesc(''); setSelOds(''); setSelPc(''); setSelLinea('');
  };

  const cargarRelaciones = async (pid) => {
    const safe = async (fn) => { try { return (await fn()).data.datos || []; } catch { return []; } };
    const [aa, ac, al, doc, ods, pc, li] = await Promise.all([
      safe(() => obtenerPorClave('aa_proyecto',     'proyecto', pid)),
      safe(() => obtenerPorClave('ac_proyecto',     'proyecto', pid)),
      safe(() => obtenerPorClave('aliado_proyecto', 'proyecto', pid)),
      safe(() => obtenerPorClave('desarrolla',      'proyecto', pid)),
      safe(() => obtenerPorClave('ods_proyecto',    'proyecto', pid)),
      safe(() => obtenerPorClave('palabras_clave',  'proyecto', pid)),
      safe(() => obtenerPorClave('proyecto_linea',  'proyecto', pid)),
    ]);
    setRelAa(aa); setRelAc(ac); setRelAliados(al); setRelDoc(doc);
    setRelOds(ods); setRelPc(pc); setRelLineas(li);
  };

  const abrirCrear = () => {
    setForm(VACIO); resetRelaciones(); setErrorModal(''); setModal('crear');
  };

  const abrirEditar = async (fila) => {
    setForm({
      ...fila,
      fecha_inicio: fila.fecha_inicio?.split('T')[0] || '',
      fecha_fin:    fila.fecha_fin?.split('T')[0] || '',
    });
    setPkEditar(fila[PK]);
    resetRelaciones();
    setErrorModal('');
    await cargarRelaciones(fila[PK]);
    setModal('editar');
  };

  const cerrarModal = () => {
    setModal(null); setForm(VACIO); setPkEditar(null);
    setErrorModal(''); resetRelaciones();
  };

  const agregar = (lista, setLista, item, key) => {
    if (!item[key]) return;
    if (lista.some(x => x[key] == item[key])) return;
    setLista([...lista, item]);
  };

  const quitar = (lista, setLista, key, val) =>
    setLista(lista.filter(x => x[key] != val));

  const handleGuardar = async () => {
    setGuardando(true); setErrorModal('');
    try {
      const payload = {
        ...form,
        id:          parseInt(form.id),
        presupuesto: parseFloat(form.presupuesto),
      };
      let pid = pkEditar;

      if (modal === 'crear') {
        await crear(TABLA, payload);
        pid = payload.id;
      } else {
        await actualizar(TABLA, PK, pkEditar, payload);
        await Promise.allSettled([
          eliminar('aa_proyecto',     'proyecto', pid),
          eliminar('ac_proyecto',     'proyecto', pid),
          eliminar('aliado_proyecto', 'proyecto', pid),
          eliminar('desarrolla',      'proyecto', pid),
          eliminar('ods_proyecto',    'proyecto', pid),
          eliminar('palabras_clave',  'proyecto', pid),
          eliminar('proyecto_linea',  'proyecto', pid),
        ]);
      }

      await Promise.allSettled([
        ...relAa.map(r      => crear('aa_proyecto',     { proyecto: pid, area_aplicacion: r.area_aplicacion })),
        ...relAc.map(r      => crear('ac_proyecto',     { proyecto: pid, area_conocimiento: r.area_conocimiento })),
        ...relAliados.map(r => crear('aliado_proyecto', { aliado: r.aliado, proyecto: pid })),
        ...relDoc.map(r     => crear('desarrolla',      { docente: r.docente, proyecto: pid, rol: r.rol, descripcion: r.descripcion })),
        ...relOds.map(r     => crear('ods_proyecto',    { proyecto: pid, ods: r.ods })),
        ...relPc.map(r      => crear('palabras_clave',  { proyecto: pid, termino_clave: r.termino_clave })),
        ...relLineas.map(r  => crear('proyecto_linea',  { proyecto: pid, linea_investigacion: r.linea_investigacion })),
      ]);

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
      await Promise.allSettled([
        eliminar('aa_proyecto',     'proyecto', pk),
        eliminar('ac_proyecto',     'proyecto', pk),
        eliminar('aliado_proyecto', 'proyecto', pk),
        eliminar('desarrolla',      'proyecto', pk),
        eliminar('ods_proyecto',    'proyecto', pk),
        eliminar('palabras_clave',  'proyecto', pk),
        eliminar('proyecto_linea',  'proyecto', pk),
      ]);
      await eliminar(TABLA, PK, pk);
      await cargar();
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data?.detalle || e.message));
    } finally { setConfirmEliminar(null); }
  };

  const nAa     = id  => areasAplicacion.find(a => a.id == id)?.nombre || id;
  const nAc     = id  => areasConocimiento.find(a => a.id == id)?.disciplina || id;
  const nAliado = nit => aliados.find(a => a.nit == nit)?.razon_social || nit;
  const nDoc    = ced => { const d = docentes.find(d => d.cedula == ced); return d ? `${d.nombres} ${d.apellidos}` : ced; };
  const nOds    = id  => odsList.find(o => o.id == id)?.nombre || id;
  const nLinea  = id  => lineas.find(l => l.id == id)?.nombre || id;

  const Seccion = ({ titulo, tags, onQuitar, children }) => (
    <div className="seccion-relacion-card">
      <div className="seccion-relacion-titulo"><span>{titulo}</span></div>
      <div className="tag-lista">
        {tags.length === 0
          ? <span style={{ color: '#64748b', fontSize: '13px' }}>Sin registros.</span>
          : tags.map((tag, i) => (
            <div key={i} className="tag">
              <span>{tag.label}</span>
              {!readonly && <button onClick={() => onQuitar(tag.val)}>×</button>}
            </div>
          ))
        }
      </div>
      {!readonly && <div className="seccion-add-row">{children}</div>}
    </div>
  );

  const rel = (pid) => relaciones[pid] || {};

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
        {cargando ? <p className="table-empty">Cargando registros...</p>
        : datos.length === 0 ? <p className="table-empty">No hay proyectos registrados aún.</p>
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '1600px' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Presupuesto</th>
                  <th>Financiación</th>
                  <th>Fondos</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Áreas Aplicación</th>
                  <th>Áreas Conocimiento</th>
                  <th>Aliados</th>
                  <th>Docentes</th>
                  <th>ODS</th>
                  <th>Palabras Clave</th>
                  <th>Líneas Investigación</th>
                  {!readonly && <th>Acciones</th>}
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
                    <td>{rel(fila.id).aa?.map(r => nAa(r.area_aplicacion)).join(', ') || '-'}</td>
                    <td>{rel(fila.id).ac?.map(r => nAc(r.area_conocimiento)).join(', ') || '-'}</td>
                    <td>{rel(fila.id).aliados?.map(r => nAliado(r.aliado)).join(', ') || '-'}</td>
                    <td>{rel(fila.id).doc?.map(r => nDoc(r.docente)).join(', ') || '-'}</td>
                    <td>{rel(fila.id).ods?.map(r => nOds(r.ods)).join(', ') || '-'}</td>
                    <td>{rel(fila.id).pc?.map(r => r.termino_clave).join(', ') || '-'}</td>
                    <td>{rel(fila.id).lineas?.map(r => nLinea(r.linea_investigacion)).join(', ') || '-'}</td>
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
          titulo={modal === 'crear' ? 'Nuevo Proyecto' : 'Editar Proyecto'}
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
              <input name="resumen" type="text" value={form.resumen}
                onChange={handleChange} placeholder="Descripción breve" />
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

          <Seccion
            titulo="Áreas de Aplicación"
            tags={relAa.map(r => ({ label: nAa(r.area_aplicacion), val: r.area_aplicacion }))}
            onQuitar={val => quitar(relAa, setRelAa, 'area_aplicacion', val)}
          >
            <select value={selAa} onChange={e => setSelAa(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {areasAplicacion.filter(a => !relAa.some(r => r.area_aplicacion == a.id))
                .map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            <button onClick={() => { agregar(relAa, setRelAa, { area_aplicacion: parseInt(selAa) }, 'area_aplicacion'); setSelAa(''); }}
              disabled={!selAa}>+ Agregar</button>
          </Seccion>

          <Seccion
            titulo="Áreas de Conocimiento"
            tags={relAc.map(r => ({ label: nAc(r.area_conocimiento), val: r.area_conocimiento }))}
            onQuitar={val => quitar(relAc, setRelAc, 'area_conocimiento', val)}
          >
            <select value={selAc} onChange={e => setSelAc(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {areasConocimiento.filter(a => !relAc.some(r => r.area_conocimiento == a.id))
                .map(a => <option key={a.id} value={a.id}>{a.id} - {a.disciplina}</option>)}
            </select>
            <button onClick={() => { agregar(relAc, setRelAc, { area_conocimiento: selAc }, 'area_conocimiento'); setSelAc(''); }}
              disabled={!selAc}>+ Agregar</button>
          </Seccion>

          <Seccion
            titulo="Aliados"
            tags={relAliados.map(r => ({ label: nAliado(r.aliado), val: r.aliado }))}
            onQuitar={val => quitar(relAliados, setRelAliados, 'aliado', val)}
          >
            <select value={selAliado} onChange={e => setSelAliado(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {aliados.filter(a => !relAliados.some(r => r.aliado == a.nit))
                .map(a => <option key={a.nit} value={a.nit}>{a.razon_social}</option>)}
            </select>
            <button onClick={() => { agregar(relAliados, setRelAliados, { aliado: parseInt(selAliado) }, 'aliado'); setSelAliado(''); }}
              disabled={!selAliado}>+ Agregar</button>
          </Seccion>

          <Seccion
            titulo="Docentes"
            tags={relDoc.map(r => ({ label: `${nDoc(r.docente)} — ${r.rol}`, val: r.docente }))}
            onQuitar={val => quitar(relDoc, setRelDoc, 'docente', val)}
          >
            <select value={selDoc} onChange={e => setSelDoc(e.target.value)}>
              <option value="">— Docente —</option>
              {docentes.filter(d => !relDoc.some(r => r.docente == d.cedula))
                .map(d => <option key={d.cedula} value={d.cedula}>{d.nombres} {d.apellidos}</option>)}
            </select>
            <input placeholder="Rol" value={selDocRol} onChange={e => setSelDocRol(e.target.value)} />
            <input placeholder="Descripción" value={selDocDesc} onChange={e => setSelDocDesc(e.target.value)} />
            <button
              onClick={() => {
                agregar(relDoc, setRelDoc, { docente: parseInt(selDoc), rol: selDocRol, descripcion: selDocDesc }, 'docente');
                setSelDoc(''); setSelDocRol(''); setSelDocDesc('');
              }}
              disabled={!selDoc || !selDocRol || !selDocDesc}>+ Agregar</button>
          </Seccion>

          <Seccion
            titulo="ODS"
            tags={relOds.map(r => ({ label: nOds(r.ods), val: r.ods }))}
            onQuitar={val => quitar(relOds, setRelOds, 'ods', val)}
          >
            <select value={selOds} onChange={e => setSelOds(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {odsList.filter(o => !relOds.some(r => r.ods == o.id))
                .map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
            <button onClick={() => { agregar(relOds, setRelOds, { ods: parseInt(selOds) }, 'ods'); setSelOds(''); }}
              disabled={!selOds}>+ Agregar</button>
          </Seccion>

          <Seccion
            titulo="Palabras Clave"
            tags={relPc.map(r => ({ label: r.termino_clave, val: r.termino_clave }))}
            onQuitar={val => quitar(relPc, setRelPc, 'termino_clave', val)}
          >
            <select value={selPc} onChange={e => setSelPc(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {terminos.filter(t => !relPc.some(r => r.termino_clave == t.termino))
                .map(t => <option key={t.termino} value={t.termino}>{t.termino}</option>)}
            </select>
            <button onClick={() => { agregar(relPc, setRelPc, { termino_clave: selPc }, 'termino_clave'); setSelPc(''); }}
              disabled={!selPc}>+ Agregar</button>
          </Seccion>

          <Seccion
            titulo="Líneas de Investigación"
            tags={relLineas.map(r => ({ label: nLinea(r.linea_investigacion), val: r.linea_investigacion }))}
            onQuitar={val => quitar(relLineas, setRelLineas, 'linea_investigacion', val)}
          >
            <select value={selLinea} onChange={e => setSelLinea(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {lineas.filter(l => !relLineas.some(r => r.linea_investigacion == l.id))
                .map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
            <button onClick={() => { agregar(relLineas, setRelLineas, { linea_investigacion: parseInt(selLinea) }, 'linea_investigacion'); setSelLinea(''); }}
              disabled={!selLinea}>+ Agregar</button>
          </Seccion>

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
            ¿Estás seguro de eliminar el proyecto con ID <strong style={{ color: '#fff' }}>{confirmEliminar}</strong>? Se eliminarán también todas sus relaciones.
          </p>
        </Modal>
      )}
    </div>
  );
}