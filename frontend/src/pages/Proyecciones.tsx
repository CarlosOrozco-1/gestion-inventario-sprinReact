import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { getRol } from "../access";

export default function Proyecciones() {
  const { user } = useAuthStore();
  const esAdmin = getRol(user) === "ADMIN";

  const [insumos, setInsumos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [sugerenciasLoading, setSugerenciasLoading] = useState(true);
  const [aplicandoId, setAplicandoId] = useState<number | null>(null);

  const showToast = useToastStore((s: any) => s.showToast);

  const fetchInsumos = async () => {
    try {
      const response = await api.get("/insumos");
      setInsumos(response.data);
    } catch (err) {
      console.error("Error cargando insumos para proyecciones", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSugerencias = async () => {
    try {
      const response = await api.get("/insumos/sugerencias-stock");
      setSugerencias(response.data);
    } catch (err) {
      console.error("Error cargando sugerencias de stock", err);
    } finally {
      setSugerenciasLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
    fetchSugerencias();
  }, []);

  const aplicarSugerencia = async (sugerencia: any) => {
    setAplicandoId(sugerencia.id);
    try {
      await api.put(`/presentations/${sugerencia.id}`, {
        name: sugerencia.presentation,
        size: sugerencia.size,
        minStock: sugerencia.suggestedMinStock,
        maxStock: sugerencia.suggestedMaxStock,
        estimatedCost: sugerencia.estimatedCost ?? 0,
      });
      showToast(
        `Stock de "${sugerencia.item}" actualizado (${sugerencia.suggestedMinStock} – ${sugerencia.suggestedMaxStock}).`,
      );
      await Promise.all([fetchInsumos(), fetchSugerencias()]);
    } catch (err) {
      console.error("Error aplicando sugerencia", err);
      alert("No se pudo aplicar la sugerencia de stock.");
    } finally {
      setAplicandoId(null);
    }
  };

  // Cálculos Inteligentes
  const proyeccionesData = useMemo(() => {
    const result = insumos.map((insumo) => {
      const stockMin = insumo.minStock || 5;
      const stockMax = insumo.maxStock || 50;
      const costo = insumo.estimatedCost || 0;
      const stock = insumo.stock;

      const deficit = stock < stockMax ? stockMax - stock : 0;
      const requiredInvestment = deficit * costo;
      const urgency =
        stock <= stockMin ? "Alta" : stock < stockMax ? "Media" : "Ninguna";

      return {
        ...insumo,
        deficit,
        requiredInvestment,
        urgency,
      };
    });

    // Solo mostramos los que tienen déficit para no saturar la tabla
    return result
      .filter((item) => item.deficit > 0)
      .sort((a, b) => b.requiredInvestment - a.requiredInvestment);
  }, [insumos]);

  const inversionTotal = proyeccionesData.reduce(
    (acc, curr) => acc + curr.requiredInvestment,
    0,
  );
  const totalInsumosUrgentes = proyeccionesData.filter(
    (i) => i.urgency === "Alta",
  ).length;

  const handleExport = async (format: "pdf" | "excel") => {
    if (proyeccionesData.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    try {
      const response = await api.post(
        `/reportes/proyecciones/${format}`,
        proyeccionesData,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const extension = format === "pdf" ? "pdf" : "xlsx";
      link.setAttribute(
        "download",
        `Proyecciones_${new Date().getTime()}.${extension}`,
      );
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exportando ${format}`, error);
      alert(
        `Ocurrió un error al generar el reporte en ${format.toUpperCase()}.`,
      );
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Proyecciones de Compra
          </h1>
          <p className="text-slate-500 mt-1">
            Smart Restock: Planificación financiera para abastecimiento óptimo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport("pdf")}
            className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-rose-500/50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Exportar a PDF
          </button>

          <button
            onClick={() => handleExport("excel")}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500/50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Exportar a Excel
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Inversión Estimada Total
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              Q
              {inversionTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Insumos con Urgencia Alta
            </p>
            <h3 className="text-3xl font-black text-rose-600">
              {totalInsumosUrgentes}{" "}
              <span className="text-base font-medium text-slate-400 normal-case">
                requieren atención
              </span>
            </h3>
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
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Calculando proyecciones...
                  </td>
                </tr>
              ) : proyeccionesData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-emerald-600 font-medium"
                  >
                    <svg
                      className="w-12 h-12 mx-auto mb-3 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    ¡Felicidades! Todo tu inventario está en sus niveles máximos
                    óptimos.
                  </td>
                </tr>
              ) : (
                proyeccionesData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {item.item}
                    </td>
                    <td
                      className={`p-4 text-center font-bold ${item.urgency === "Alta" ? "text-rose-600" : "text-slate-700"}`}
                    >
                      {item.stock}
                    </td>
                    <td className="p-4 text-center text-slate-500">
                      {item.maxStock || 50}
                    </td>
                    <td className="p-4 text-center font-bold text-amber-600">
                      {item.deficit}
                    </td>
                    <td className="p-4 text-right text-slate-500">
                      Q{(item.estimatedCost || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-black text-brand-700">
                      Q
                      {item.requiredInvestment.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-4 text-center">
                      {item.urgency === "Alta" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700">
                          URGENTE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">
                          ATENCIÓN
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Criterios Avanzados: Sugerencias de stock según consumo */}
      <div className="mt-10 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Sugerencias de Stock (Smart Restock)
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              Mínimo/Máximo recomendados según el consumo de los últimos 90
              días (salidas + ajustes). Mínimo = consumo diario × 7 días de
              reposición · Máximo = consumo diario × 37 días de cobertura.
            </p>
          </div>
          {!esAdmin && (
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-500">
              Solo ADMIN puede aplicar cambios
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Insumo</th>
                <th className="p-4 font-semibold text-center">Consumo/día</th>
                <th className="p-4 font-semibold text-center">Stock</th>
                <th className="p-4 font-semibold text-center">Mínimo (actual → sugerido)</th>
                <th className="p-4 font-semibold text-center">Máximo (actual → sugerido)</th>
                <th className="p-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sugerenciasLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Calculando consumo y niveles óptimos...
                  </td>
                </tr>
              ) : sugerencias.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    No hay insumos registrados.
                  </td>
                </tr>
              ) : (
                sugerencias.map((sug) => {
                  const cambios = sug.suggestedMinStock && sug.suggestedMaxStock;
                  return (
                    <tr key={sug.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{sug.item}</p>
                        <p className="text-xs text-slate-400">
                          {sug.presentation} {sug.size}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        {sug.noConsumption ? (
                          <span className="text-slate-400">— sin consumo</span>
                        ) : (
                          <span className="font-bold text-slate-700">
                            {Number(sug.dailyConsumption).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">
                        {sug.stock}
                      </td>
                      <td className="p-4 text-center">
                        {cambios ? (
                          <span className={sug.differs ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                            {sug.currentMinStock}
                            <span className="text-slate-400 mx-1">→</span>
                            {sug.suggestedMinStock}
                          </span>
                        ) : (
                          <span className="text-slate-400">{sug.currentMinStock}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {cambios ? (
                          <span className={sug.differs ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                            {sug.currentMaxStock}
                            <span className="text-slate-400 mx-1">→</span>
                            {sug.suggestedMaxStock}
                          </span>
                        ) : (
                          <span className="text-slate-400">{sug.currentMaxStock}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {esAdmin && cambios && sug.differs ? (
                          <button
                            onClick={() => aplicarSugerencia(sug)}
                            disabled={aplicandoId === sug.id}
                            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {aplicandoId === sug.id ? "Aplicando..." : "Aplicar"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {esAdmin && cambios && !sug.differs
                              ? "Niveles óptimos"
                              : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
