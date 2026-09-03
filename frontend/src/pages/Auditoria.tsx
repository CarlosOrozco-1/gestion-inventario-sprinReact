import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuditSocket } from '../hooks/useAuditSocket';

const PAGE_SIZE = 20;

const badgeFor = (eventType: string) => {
  if (eventType === 'LOGIN') return 'bg-sky-100 text-sky-700 border-sky-200';
  if (eventType === 'LOGIN_FALLIDO') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (eventType === 'MOVIMIENTO_CREADO') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (eventType?.startsWith('USUARIO')) return 'bg-violet-100 text-violet-700 border-violet-200';
  if (eventType?.startsWith('EXPORTACION')) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export default function Auditoria() {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [catalogo, setCatalogo] = useState<Record<string, string>>({});
  const [filtroEvento, setFiltroEvento] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async (pagina: number) => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page: pagina, size: PAGE_SIZE };
      if (filtroEvento) params.evento = filtroEvento;
      if (filtroUsuario.trim()) params.usuario = filtroUsuario.trim();
      if (filtroDesde) params.desde = filtroDesde;
      if (filtroHasta) params.hasta = filtroHasta;
      const response = await api.get('/auditoria', { params });
      setLogs(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
      setPage(pagina);
    } catch (err) {
      console.error('Error cargando auditoría', err);
      setError('No se pudo cargar la bitácora de auditoría.');
    } finally {
      setLoading(false);
    }
  }, [filtroEvento, filtroUsuario, filtroDesde, filtroHasta]);

  const aplicarFiltros = () => fetchLogs(0);

  const limpiarFiltros = () => {
    setFiltroEvento('');
    setFiltroUsuario('');
    setFiltroDesde('');
    setFiltroHasta('');
    fetchLogs(0);
  };

  useEffect(() => {
    api.get('/auditoria/eventos').then((res) => setCatalogo(res.data)).catch(() => {});
    fetchLogs(0);
    // Filtros solo se aplican con "Buscar"; no re-ejecutar al teclear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresco en tiempo real: al recibir un aviso por WebSocket, se re-consulta
  // la bitácora (conservando la página y filtros actuales) sin recargar la pestaña.
  const fetchRef = useRef(fetchLogs);
  fetchRef.current = fetchLogs;
  const auditSocket = useAuditSocket(true);
  useEffect(() => {
    return auditSocket.onMessage(() => {
      fetchRef.current(pageRef.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageRef = useRef(page);
  pageRef.current = page;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const inputCls = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="page-container animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Auditoría del Sistema</h1>
          <p className="text-slate-500 mt-1">Bitácora de accesos, movimientos, usuarios y exportaciones.</p>
        </div>
        <span className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 border border-violet-200 px-4 py-2 rounded-lg text-sm font-semibold">
          {totalElements} evento{totalElements === 1 ? '' : 's'} registrado{totalElements === 1 ? '' : 's'}
        </span>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Evento</label>
            <select value={filtroEvento} onChange={(e) => setFiltroEvento(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              {Object.entries(catalogo).map(([codigo, etiqueta]) => (
                <option key={codigo} value={codigo}>{etiqueta}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Usuario</label>
            <input
              type="text"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              placeholder="Correo del usuario"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Desde</label>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Hasta</label>
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={aplicarFiltros}
              className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-brand-500/50"
            >
              Buscar
            </button>
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold whitespace-nowrap">Fecha</th>
                <th className="p-4 font-semibold">Evento</th>
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold">Descripción</th>
                <th className="p-4 font-semibold hidden md:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Cargando bitácora...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">No hay eventos registrados</p>
                    <p className="text-slate-400 text-xs mt-1">Ajusta los filtros o realiza alguna acción para generar registros.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${badgeFor(log.eventType)}`}>
                        {catalogo[log.eventType] || log.eventType}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">{log.usuarioEmail}</td>
                    <td className="p-4 text-slate-600 max-w-sm truncate" title={log.description || ''}>
                      {log.description || '—'}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-xs hidden md:table-cell">{log.ipAddress || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Página {page + 1} de {totalPages} · {totalElements} eventos
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium text-slate-600 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium text-slate-600 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}