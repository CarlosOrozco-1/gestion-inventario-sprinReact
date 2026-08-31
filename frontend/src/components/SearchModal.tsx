import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Modal de búsqueda del catálogo.
 * Permite localizar un insumo (material o presentación) sin escanear el QR,
 * por nombre, código interno o cualquier coincidencia parcial (primeras letras,
 * presentación, tamaño, etc.). Al seleccionar un resultado abre el modal de
 * edición correspondiente.
 *
 * Props:
 * - items:  lista completa del catálogo [{id, code, name, presentations[]}].
 * - onSelectItem(item):               abre edición del material.
 * - onSelectPresentation(item, pres): abre edición de la presentación.
 */
export default function SearchModal({ isOpen, items, onClose, onSelectItem, onSelectPresentation }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { items: [], presentations: [] };

    const matchingItems: any[] = [];
    const matchingPresentations: any[] = [];

    for (const item of items || []) {
      const codeStr = String(item.code ?? '');
      const nameMatch = item.name?.toLowerCase().includes(q);
      const codeMatch = codeStr.includes(q);

      // Coincide el material (por nombre o código)
      if (nameMatch || codeMatch) {
        matchingItems.push(item);
      }

      // Coincide alguna presentación (por nombre, tamaño o material)
      for (const pres of item.presentations || []) {
        const presNameMatch = pres.name?.toLowerCase().includes(q);
        const sizeMatch = pres.size?.toLowerCase().includes(q);
        if (presNameMatch || sizeMatch || nameMatch || codeMatch) {
          matchingPresentations.push({ item, pres });
        }
      }
    }

    return { items: matchingItems, presentations: matchingPresentations };
  }, [query, items]);

  const totalResults = results.items.length + results.presentations.length;

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Buscar insumo</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Cerrar búsqueda"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="p-4">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, código o presentación..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {query.trim() === '' ? (
            <p className="text-sm text-slate-400 mt-4 text-center py-6">
              Escribe el nombre, código interno o presentación del insumo a buscar.
            </p>
          ) : totalResults === 0 ? (
            <p className="text-sm text-slate-500 mt-4 text-center py-6">
              No se encontraron insumos con "{query}".
            </p>
          ) : (
            <div className="mt-3 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {/* Resultados de materiales */}
              {results.items.map((item) => (
                <button
                  key={`it-${item.id}`}
                  onClick={() => { onSelectItem(item); }}
                  className="w-full text-left flex items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3 hover:border-brand-400 hover:bg-brand-50/40 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      Cód. <span className="font-semibold text-slate-700">{item.code}</span> · {item.presentations.length} presentación(es)
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-brand-600">
                    Editar material
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}

              {/* Resultados de presentaciones */}
              {results.presentations.map(({ item, pres }) => (
                <button
                  key={`pr-${pres.id}`}
                  onClick={() => { onSelectPresentation(item, pres); }}
                  className="w-full text-left flex items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3 hover:border-brand-400 hover:bg-brand-50/40 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {pres.name} <span className="font-normal text-slate-400 text-sm">· {pres.size}</span>
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.name} · Cód. <span className="font-semibold text-slate-700">{item.code}</span> · Stock {pres.stock}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-brand-600">
                    Editar
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}

              {totalResults > 0 && (
                <p className="text-xs text-slate-400 pt-1">
                  {totalResults} resultado(s) encontrado(s).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
