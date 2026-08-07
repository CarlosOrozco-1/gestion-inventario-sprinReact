import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api/axios';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resInsumos, resMovs] = await Promise.all([
          api.get('/insumos'),
          api.get('/movimientos')
        ]);
        setInsumos(resInsumos.data);
        setMovimientos(resMovs.data);
      } catch (error) {
        console.error('Error cargando datos del dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // --- CÁLCULO DE KPIs ---
  const totalInsumos = insumos.length;
  const stockCritico = insumos.filter(i => i.stock <= (i.minStock || 5));
  
  // Total Entradas y Salidas
  let totalEntradas = 0;
  let totalSalidas = 0;
  movimientos.forEach(m => {
    if (m.type.includes('ENTRADA') || m.type === 'AJUSTE_POSITIVO') {
      totalEntradas += m.quantity;
    } else if (m.type.includes('SALIDA') || m.type === 'AJUSTE_NEGATIVO') {
      totalSalidas += m.quantity;
    }
  });

  // --- DATOS PARA GRÁFICOS ---
  // 1. Top 5 Insumos con más Stock (Gráfico de Barras)
  const topStockData = [...insumos]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map(i => ({
      name: i.item.length > 15 ? i.item.substring(0, 15) + '...' : i.item,
      stock: i.stock
    }));

  // 2. Distribución de Movimientos (Gráfico de Pastel)
  const movsAgrupados = movimientos.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.quantity;
    return acc;
  }, {});

  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b'];
  const pieData = Object.keys(movsAgrupados).map(tipo => ({
    name: tipo,
    value: movsAgrupados[tipo]
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Panel de Control</h1>
        <p className="text-slate-500 mt-1">Resumen general del estado de inventario y movimientos recientes.</p>
      </div>

      {/* Tarjetas de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Insumos (Catálogo)</p>
            <h3 className="text-3xl font-bold text-slate-800">{totalInsumos}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Volumen de Entradas</p>
            <h3 className="text-3xl font-bold text-slate-800">{totalEntradas}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Volumen de Salidas</p>
            <h3 className="text-3xl font-bold text-slate-800">{totalSalidas}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Stock Crítico (Bajo Mínimo)</p>
            <h3 className="text-3xl font-bold text-slate-800">{stockCritico.length}</h3>
          </div>
        </div>

      </div>

      {/* Gráficos y Tablas Secundarias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Barras (Ocupa 2 columnas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top 5 Insumos con Mayor Disponibilidad</h3>
          {topStockData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="stock" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400">No hay datos suficientes</div>
          )}
        </div>

        {/* Alertas de Stock */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Alertas de Reabastecimiento</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {stockCritico.length === 0 ? (
              <div className="text-center text-emerald-500 py-10">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">Inventario saludable</p>
                <p className="text-sm opacity-80 mt-1">Ningún insumo bajo el límite crítico.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {stockCritico.map(item => (
                  <li key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                      <p className="text-sm font-semibold text-slate-700 truncate" title={item.item}>
                        {item.item}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                      {item.stock} uds
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
