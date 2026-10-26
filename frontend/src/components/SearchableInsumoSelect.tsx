import { useEffect, useMemo, useRef, useState, useId } from 'react';

export type SearchableInsumoOption = {
  value: string;
  label: string;
  searchText?: string;
};

type SearchableInsumoSelectProps = {
  options: SearchableInsumoOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  emptyOptionLabel?: string;
};

const MAX_RESULTS = 40;

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function SearchableInsumoSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Escribe para buscar...',
  emptyOptionLabel,
}: SearchableInsumoSelectProps) {
  const id = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((option) => option.value === value);
  const matches = useMemo(() => {
    const term = normalizar(query.trim());
    if (!term) return [];

    return options.filter((option) => normalizar(`${option.label} ${option.searchText || ''}`).includes(term));
  }, [options, query]);
  const results = matches.slice(0, MAX_RESULTS);

  useEffect(() => {
    if (selected) setQuery(selected.label);
  }, [selected?.value, selected?.label]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const offset = emptyOptionLabel ? 1 : 0;
  const activeOptionId = emptyOptionLabel && activeIndex === 0
    ? `${id}-all`
    : `${id}-option-${activeIndex - offset}`;

  const selectOption = (option: SearchableInsumoOption | null) => {
    setQuery(option?.label || '');
    setOpen(false);
    onChange(option?.value || '');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const count = results.length + offset;
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(count - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (emptyOptionLabel && activeIndex === 0) {
        selectOption(null);
      } else if (results[activeIndex - offset]) {
        selectOption(results[activeIndex - offset]);
      }
    }
  };

  return (
    <div ref={containerRef}>
      <label htmlFor={`${id}-input`} className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <svg aria-hidden="true" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${id}-list`}
          aria-activedescendant={open && results.length + offset > 0 ? activeOptionId : undefined}
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setOpen(true);
            if (value) onChange('');
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected?.label || placeholder}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      </div>

      {open && (
        <div id={`${id}-list`} role="listbox" className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          {emptyOptionLabel && (
            <div
              id={`${id}-all`}
              role="option"
              aria-selected={value === ''}
              data-active={activeIndex === 0}
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => selectOption(null)}
              className={`cursor-pointer px-3 py-2 text-sm ${activeIndex === 0 ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
            >
              {emptyOptionLabel}
            </div>
          )}

          {!query.trim() ? (
            <p className="px-3 py-2 text-sm text-slate-500">Escribe para filtrar la lista.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">Sin coincidencias.</p>
          ) : (
            results.map((option, index) => {
              const optionIndex = index + offset;
              return (
                <div
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  data-active={optionIndex === activeIndex}
                  onMouseEnter={() => setActiveIndex(optionIndex)}
                  onClick={() => selectOption(option)}
                  className={`cursor-pointer px-3 py-2 text-sm ${optionIndex === activeIndex ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                >
                  {option.label}
                </div>
              );
            })
          )}
          {matches.length > MAX_RESULTS && (
            <p className="px-3 py-2 text-xs text-slate-500">Se muestran 40 resultados; escribe más para afinar.</p>
          )}
        </div>
      )}
    </div>
  );
}
