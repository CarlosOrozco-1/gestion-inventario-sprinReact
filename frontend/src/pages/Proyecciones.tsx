import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

export default function Proyecciones() {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsumos = async () => {
      try {
        const response = await api.get('/insumos');
        setInsumos(response.data);
      } catch (err) {
        console.error('Error cargando insumos para proyecciones', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsumos();
  }, []);

  // Cálculos Inteligentes
  const proyeccionesData = useMemo(() => {
    const result = insumos.map(insumo => {
      const stockMin = insumo.stockMinimo || 5;
      const stockMax = insumo.stockMaximo || 50;
      const costo = insumo.costoEstimado || 0;
      const stock = insumo.stock;

      const deficit = stock < stockMax ? stockMax - stock : 0;
      const inversionNecesaria = deficit * costo;
      const urgencia = stock <= stockMin ? 'Alta' : (stock < stockMax ? 'Media' : 'Ninguna');

      return {
        ...insumo,
        deficit,
        inversionNecesaria,
        urgencia
      };
    });
    
    // Solo mostramos los que tienen déficit para no saturar la tabla
    return result.filter(item => item.deficit > 0).sort((a, b) => b.inversionNecesaria - a.inversionNecesaria);
  }, [insumos]);

  const inversionTotal = proyeccionesData.reduce((acc, curr) => acc + curr.inversionNecesaria, 0);
  const totalInsumosUrgentes = proyeccionesData.filter(i => i.urgencia === 'Alta').length;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Proyecciones de Compra</h1>
          <p className="text-slate-500 mt-1">Smart Restock: Planificación financiera para abastecimiento óptimo.</p>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Inversión Estimada Total</p>
            <h3 className="text-3xl font-black text-slate-800">${inversionTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Insumos con Urgencia Alta</p>
            <h3 className="text-3xl font-black text-rose-600">{totalInsumosUrgentes} <span className="text-base font-medium text-slate-400 normal-case">requieren atención</span></h3>
          </div>
        </div>
      </div>

      {/* Tabla de Proyecciones */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Insumo</th>
                <th className="p-4 font-semibold text-center">Stock Actual</th>
                <th className="p-4 font-semibold text-center">Meta (Máx)</th>
                <th className="p-4 font-semibold text-center">Déficit</th>
                <th className="p-4 font-semibold text-right">Costo Unit.</th>
                <th className="p-4 font-semibold text-right">Inversión</th>
                <th className="p-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Calculando proyecciones...</td></tr>
              ) : proyeccionesData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-emerald-600 font-medium">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ¡Felicidades! Todo tu inventario está en sus niveles máximos óptimos.
                  </td>
                </tr>
              ) : (
                proyeccionesData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{item.insumo}</td>
                    <td className={`p-4 text-center font-bold ${item.urgencia === 'Alta' ? 'text-rose-600' : 'text-slate-700'}`}>
                      {item.stock}
                    </td>
                    <td className="p-4 text-center text-slate-500">{item.stockMaximo || 50}</td>
                    <td className="p-4 text-center font-bold text-amber-600">{item.deficit}</td>
                    <td className="p-4 text-right text-slate-500">${(item.costoEstimado || 0).toFixed(2)}</td>
                    <td className="p-4 text-right font-black text-brand-700">
                      ${item.inversionNecesaria.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      {item.urgencia === 'Alta' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700">URGENTE</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">ATENCIÓN</span>
                      )}
                    </td>
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
