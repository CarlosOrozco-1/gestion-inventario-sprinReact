import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

export default function Reportes() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroInsumo, setFiltroInsumo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

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

  // Aplicar filtros en memoria
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(mov => {
      let coincideUsuario = true;
      let coincideInsumo = true;
      let coincideTipo = true;
      let coincideFecha = true;

      if (filtroUsuario) {
        coincideUsuario = mov.usuarioName === usuarios.find(u => u.id.toString() === filtroUsuario)?.name;
      }
      if (filtroInsumo) {
        coincideInsumo = mov.itemName === insumos.find(i => i.id.toString() === filtroInsumo)?.item;
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
      // Extraemos solo los IDs de los movimientos que están actualmente filtrados
      const idsMovimientos = movimientosFiltrados.map(m => m.id);
      
      const response = await api.post('/reportes/excel', idsMovimientos, {
        responseType: 'blob' // Importante para recibir archivos binarios
      });

      // Crear un enlace temporal para forzar la descarga del archivo en el navegador
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Inventario_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
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
      
      const response = await api.post('/reportes/pdf', idsMovimientos, {
        responseType: 'blob'
      });

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
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reportería Dinámica</h1>
          <p className="text-slate-500 mt-1">Filtra y exporta los movimientos exactos que necesitas.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportPdf}
            className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-rose-500/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Exportar PDF
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros Cruzados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Usuario</label>
            <select 
              value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">Todos los Usuarios</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.rol})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Insumo</label>
            <select 
              value={filtroInsumo} onChange={(e) => setFiltroInsumo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">Cualquier Insumo</option>
              {insumos.map(i => (
                <option key={i.id} value={i.id}>{i.item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo Movimiento</label>
            <select 
              value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SALIDA">Salidas</option>
              <option value="AJUSTE_POSITIVO">Ajuste (+)</option>
              <option value="AJUSTE_NEGATIVO">Ajuste (-)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Desde Fecha</label>
            <input 
              type="date" 
              value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta Fecha</label>
            <input 
              type="date" 
              value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center text-sm">
          <span className="text-slate-500">
            Mostrando <strong className="text-brand-600">{movimientosFiltrados.length}</strong> resultados
          </span>
          <button 
            onClick={() => { setFiltroUsuario(''); setFiltroInsumo(''); setFiltroTipo(''); setFechaInicio(''); setFechaFin(''); }}
            className="text-brand-600 font-medium hover:underline"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Tabla de Resultados (Previsualización) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold">Movimiento</th>
                <th className="p-4 font-semibold">Insumo</th>
                <th className="p-4 font-semibold text-right">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Cargando datos...</td></tr>
              ) : movimientosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500">No hay movimientos que coincidan con estos filtros.</td></tr>
              ) : (
                movimientosFiltrados.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{formatDate(mov.createdAt)}</td>
                    <td className="p-4 font-medium text-slate-700">{mov.usuarioName}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                        mov.type.includes('ENTRADA') || mov.type === 'AJUSTE_POSITIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {mov.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-900">{mov.itemName}</td>
                    <td className="p-4 text-right font-bold text-slate-700">{mov.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
