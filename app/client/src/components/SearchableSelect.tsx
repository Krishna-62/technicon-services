import { useMemo, useState } from 'react';

export interface SearchableOption {
  value: string;
  label: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search…',
}: {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query) return options.slice(0, 200);
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 200);
  }, [options, query]);

  function selectOption(opt: SearchableOption) {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) selectOption(filtered[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="searchable-select">
      <input
        type="text"
        value={open ? query : selected?.label || ''}
        placeholder={selected ? selected.label : placeholder}
        onFocus={() => { setOpen(true); setQuery(''); setHighlight(0); }}
        onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && (
        <div className="searchable-select-menu">
          {filtered.length === 0 && <div className="searchable-select-empty">No matches</div>}
          {filtered.map((opt, i) => (
            <div
              key={opt.value}
              className={`searchable-select-option${i === highlight ? ' highlighted' : ''}${opt.value === value ? ' selected' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
              onMouseEnter={() => setHighlight(i)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
