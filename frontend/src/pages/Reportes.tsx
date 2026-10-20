import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import Paginacion from '../components/Paginacion';
import { usePaginacion } from '../hooks/usePaginacion';
import { btn } from '../utils/buttonStyles';

const TAMANIO_PAGINA = 10;

export default function Reportes() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'reportes' | 'trazabilidad'>('reportes');

  const [trazaPresentationId, setTrazaPresentationId] = useState<string>('');
  const [trazaItemId, setTrazaItemId] = useState<string>('');
  const [trazaMovimientos, setTrazaMovimientos] = useState<any[]>([]);
  const [trazaStock, setTrazaStock] = useState<number | null>(null);
  const [trazaCargando, setTrazaCargando] = useState(false);
  const [trazaPagina, setTrazaPagina] = useState(0);
  const [trazaTotalPaginas, setTrazaTotalPaginas] = useState(0);

  useEffect(() => {
    const fetchDatosBase = async () => {
      try {
        const [movRes, insRes, usrRes] = await Promise.all([
          api.get('/movimientos'),
          api.get('/insumos'),
          api.get('/usuarios')
        ]);
        setMovimientos(movRes.data);
        setInsumos(insRes.data);
        setUsuarios(usrRes.data);
      } catch (err) {
        console.error('Error cargando datos para reportes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatosBase();
  }, []);

  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroInsumo, setFiltroInsumo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(mov => {
      let coincideUsuario = true;
      let coincideInsumo = true;
      let coincideTipo = true;
      let coincideFecha = true;

      if (filtroUsuario) {
        const u = usuarios.find((u: any) => u.id.toString() === filtroUsuario);
        coincideUsuario = u ? mov.usuarioName === u.name : true;
      }
      if (filtroInsumo) {
        const i = insumos.find((x: any) => x.id.toString() === filtroInsumo);
        coincideInsumo = i ? mov.itemName === i.item : true;
      }
      if (filtroTipo) {
        coincideTipo = mov.type === filtroTipo;
      }
      if (fechaInicio || fechaFin) {
        const movDate = new Date(mov.createdAt).getTime();
        if (fechaInicio) coincideFecha = coincideFecha && movDate >= new Date(fechaInicio).getTime();
        if (fechaFin) coincideFecha = coincideFecha && movDate <= new Date(fechaFin + 'T23:59:59').getTime();
      }

      return coincideUsuario && coincideInsumo && coincideTipo && coincideFecha;
    });
  }, [movimientos, filtroUsuario, filtroInsumo, filtroTipo, fechaInicio, fechaFin, usuarios, insumos]);

  const {
    pagina, totalPaginas, total, visibles: movimientosVisibles, setPagina,
  } = usePaginacion(movimientosFiltrados, TAMANIO_PAGINA);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleExportExcel = async () => {
    if (movimientosFiltrados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    try {
      const idsMovimientos = movimientosFiltrados.map(m => m.id);
      const response = await api.post('/reportes/excel', idsMovimientos, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Inventario_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando Excel', error);
      alert('Ocurrió un error al generar el reporte.');
    }
  };

  const handleExportPdf = async () => {
    if (movimientosFiltrados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    try {
      const idsMovimientos = movimientosFiltrados.map(m => m.id);
      const response = await api.post('/reportes/pdf', idsMovimientos, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Inventario_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando PDF', error);
      alert('Ocurrió un error al generar el reporte PDF.');
    }
  };


  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reportería</h1>
          <p className="text-slate-500 mt-1">Filtra, exporta y consulta trazabilidad por producto.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setTab('reportes')} className={`${btn(tab === 'reportes' ? 'primario' : 'neutro', 'barra')}`}>Reportes dinámicos</button>
        <button onClick={() => setTab('trazabilidad')} className={`${btn(tab === 'trazabilidad' ? 'primario' : 'neutro', 'barra')}`}>Trazabilidad por producto</button>
      </div>

      {tab === 'reportes' && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div></div>
            <div className="flex items-center gap-3">
              <button onClick={handleExportPdf} className={btn('peligro', 'barra')}>
                Exportar PDF
              </button>
              <button onClick={handleExportExcel} className={btn('exito', 'barra')}>
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Filtros Cruzados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Usuario</label>
                <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <option value="">Todos los Usuarios</option>
                  {usuarios.map((u: any) => (<option key={u.id} value={u.id}>{u.name} ({u.rol})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Insumo</label>
                <select value={filtroInsumo} onChange={(e) => setFiltroInsumo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <option value="">Todos los Insumos</option>
                  {insumos.map((i: any) => (<option key={i.id} value={i.id}>{i.item}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de Movimiento</label>
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <option value="">Todos</option>
                  <option value="ENTRADA">ENTRADA</option>
                  <option value="SALIDA">SALIDA</option>
                  <option value="AJUSTE_POSITIVO">AJUSTE POSITIVO</option>
                  <option value="AJUSTE_NEGATIVO">AJUSTE NEGATIVO</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha Inicio</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha Fin</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Resultados</h2>
              <span className="text-sm text-slate-500">{total} registros encontrados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Movimiento</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Insumo</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Justificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Cargando...</td></tr>
                  ) : movimientosVisibles.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No hay resultados con los filtros aplicados</td></tr>
                  ) : (
                    movimientosVisibles.map((mov: any) => (
                      <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(mov.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{mov.usuarioName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            mov.type === 'ENTRADA' || mov.type === 'AJUSTE_POSITIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>{mov.type}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">{mov.itemName}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-slate-800">{mov.quantity}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{mov.detail || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} total={total} onCambioPagina={setPagina} etiqueta="movimientos" />
        </div>
      )}

      {tab === 'trazabilidad' && (
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Buscar trazabilidad por producto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Insumo</label>
                <select value={trazaItemId} onChange={(e) => { setTrazaItemId(e.target.value); setTrazaPresentationId(''); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <option value="">Seleccionar insumo</option>
                  {insumos.map((i: any) => <option key={i.id} value={i.id}>{i.item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Presentación</label>
                <select value={trazaPresentationId} onChange={(e) => setTrazaPresentationId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <option value="">Seleccionar presentación</option>
                  {(insumos.find((i:any)=> i.id.toString()===trazaItemId)?.presentations || []).map((p:any) => <option key={p.id} value={p.id}>{p.name} {p.size}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={async () => {
                  if (!trazaPresentationId) { alert('Selecciona una presentación'); return; }
                  setTrazaCargando(true);
                  try {
                    const res = await api.get('/movimientos/paginado', { params: { page: trazaPagina, size: 20, presentationId: trazaPresentationId } });
                    setTrazaMovimientos(res.data.content || []);
                    setTrazaTotalPaginas(res.data.totalPages || 0);
                    try {
                      const pres = await api.get(`/presentations/${trazaPresentationId}`);
                      setTrazaStock(pres.data.stock ?? null);
                    } catch {}
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setTrazaCargando(false);
                  }
                }} className={btn('primario', 'barra')}>Buscar trazabilidad</button>
              </div>
            </div>
            {trazaStock !== null && <p className="mt-3 text-sm text-slate-600">Stock actual: <span className="font-semibold">{trazaStock}</span></p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo después</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Justificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trazaCargando ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Cargando...</td></tr>
                  ) : trazaMovimientos.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Sin movimientos para mostrar</td></tr>
                  ) : trazaMovimientos.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(m.createdAt)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{m.type}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-slate-800">{m.quantity}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-700">{m.balanceAfter ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{m.usuarioName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{m.detail || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {trazaTotalPaginas > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center gap-2">
                <button onClick={() => { setTrazaPagina(p => Math.max(0,p-1)); }} disabled={trazaPagina === 0} className="px-3 py-1 text-sm">Anterior</button>
                <span className="px-3 text-sm">Página {trazaPagina+1} de {trazaTotalPaginas}</span>
                <button onClick={() => { setTrazaPagina(p => Math.min(trazaTotalPaginas-1,p+1)); }} disabled={trazaPagina >= trazaTotalPaginas-1} className="px-3 py-1 text-sm">Siguiente</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
