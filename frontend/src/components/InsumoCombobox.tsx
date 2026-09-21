import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Combobox de selección de insumo con búsqueda incremental.
 *
 * Reemplaza al <select> nativo: cuando el catálogo crece (cientos de
 * presentaciones) desplazarse por una lista cerrada deja de ser usable. Aquí
 * el usuario escribe y la lista se filtra al instante.
 *
 * Detalles de implementación:
 * - Los resultados muestran sólo nombre y presentación; el código interno y el
 *   stock se ven en la tarjeta de resumen una vez seleccionado el insumo.
 * - Aun así el código interno sigue siendo un criterio de búsqueda, para quien
 *   lo conoce de memoria.
 * - La lista se renderiza en el flujo del documento (no flotante) para que no
 *   la recorte el contenedor con scroll del modal.
 */

interface Props {
  insumos: any[];
  /** id de la presentación seleccionada ('' si no hay ninguna). */
  value: string;
  /** Recibe el insumo elegido o null cuando se limpia/edita la selección. */
  onChange: (insumo: any | null) => void;
  label: string;
  placeholder?: string;
  tone?: 'brand' | 'amber';
}

const MAX_RESULTS = 50;

const displayLabel = (i: any) =>
  `${i.item} (${i.presentation}${i.size ? ` ${i.size}` : ''})`;

export default function InsumoCombobox({
  insumos,
  value,
  onChange,
  label: fieldLabel,
  placeholder = 'Buscar por nombre o presentación...',
  tone = 'brand',
}: Props) {
  const selected = insumos.find((i: any) => String(i.id) === String(value));

  const [query, setQuery] = useState<string>(() => (selected ? displayLabel(selected) : ''));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusClasses =
    tone === 'amber'
      ? 'focus:ring-amber-500/20 focus:border-amber-500'
      : 'focus:ring-brand-500/20 focus:border-brand-500';
  const activeClasses = tone === 'amber' ? 'bg-amber-50' : 'bg-brand-50';

  // La selección puede llegar desde fuera (insumo precargado por escaneo QR),
  // así que el texto visible se sincroniza cuando hay un insumo seleccionado.
  useEffect(() => {
    const sel = insumos.find((i: any) => String(i.id) === String(value));
    if (sel) setQuery(displayLabel(sel));
  }, [value, insumos]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return insumos
      .filter((i: any) => {
        const code = String(i.code ?? '');
        return (
          String(i.item ?? '').toLowerCase().includes(q) ||
          String(i.presentation ?? '').toLowerCase().includes(q) ||
          String(i.size ?? '').toLowerCase().includes(q) ||
          code.includes(q)
        );
      })
      .slice(0, MAX_RESULTS);
  }, [insumos, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Mantiene visible la opción resaltada al navegar con el teclado.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector('[data-active="true"]');
    // jsdom no implementa scrollIntoView.
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  // Cierra la lista al hacer clic fuera del componente.
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    // Escribir invalida la selección anterior hasta elegir un resultado.
    if (value) onChange(null);
  };

  const handleSelect = (insumo: any) => {
    setQuery(displayLabel(insumo));
    setOpen(false);
    onChange(insumo);
  };

  const handleClear = () => {
    setQuery('');
    setOpen(false);
    onChange(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  const showList = open && query.trim() !== '';

  return (
    <div ref={containerRef}>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{fieldLabel}</label>

      <div className="relative">
        <svg
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          aria-controls="insumo-combobox-list"
          aria-activedescendant={showList ? `insumo-option-${results[activeIndex]?.id}` : undefined}
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() !== '') setOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 transition-all ${focusClasses}`}
        />

        {query !== '' && (
          <button
            type="button"
            onClick={handleClear}
            title="Limpiar"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showList && (
        <div
          ref={listRef}
          id="insumo-combobox-list"
          role="listbox"
          className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100"
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">Sin coincidencias.</p>
          ) : (
            results.map((insumo: any, idx: number) => (
              <div
                key={insumo.id}
                id={`insumo-option-${insumo.id}`}
                role="option"
                aria-selected={idx === activeIndex}
                data-active={idx === activeIndex}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleSelect(insumo)}
                className={`cursor-pointer px-3 py-2 transition-colors ${
                  idx === activeIndex ? activeClasses : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-semibold text-slate-800 truncate">{insumo.item}</p>
                <p className="text-xs text-slate-500 truncate">
                  {[insumo.presentation, insumo.size].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
