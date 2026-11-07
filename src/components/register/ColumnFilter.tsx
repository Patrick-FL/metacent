import React, { useState, useRef, useEffect } from 'react';
import {
  Filter,
  Search,
  Check,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────

export interface CategoryFilterValue {
  selectedIds: string[];
  searchQuery: string;
}

export interface PayeeFilterValue {
  selectedPayees: string[];
  searchQuery: string;
}

export interface DateFilterValue {
  mode: 'range' | 'before' | 'after' | 'exact';
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface StatusFilterValue {
  uncleared: boolean;
  cleared: boolean;
  reconciled: boolean;
}

export interface AmountFilterValue {
  mode: 'gt' | 'lt' | 'between' | 'exact';
  value1: string; // in display format (e.g. "12,50")
  value2: string; // only for 'between'
}

export interface AllFilters {
  category: CategoryFilterValue | null;
  payee: PayeeFilterValue | null;
  date: DateFilterValue | null;
  status: StatusFilterValue | null;
  outflow: AmountFilterValue | null;
  inflow: AmountFilterValue | null;
}

export const emptyFilters: AllFilters = {
  category: null,
  payee: null,
  date: null,
  status: null,
  outflow: null,
  inflow: null,
};

export function hasActiveFilters(filters: AllFilters): boolean {
  return Object.values(filters).some((v) => v !== null);
}

// ─── Generic Dropdown Wrapper ───────────────────────────────────────────

interface FilterDropdownProps {
  label: string;
  isActive: boolean;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  isActive,
  children,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 cursor-pointer transition-colors group ${
          isActive
            ? 'text-[#D71921] font-semibold'
            : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
        }`}
      >
        <span>{label}</span>
        <Filter
          className={`w-3 h-3 transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-2xl p-3 min-w-[240px] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Category Filter ────────────────────────────────────────────────────

interface CategoryFilterProps {
  categories: Array<{ id: string; name: string }>;
  value: CategoryFilterValue | null;
  onChange: (value: CategoryFilterValue | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  value,
  onChange,
}) => {
  const [localSearch, setLocalSearch] = useState(value?.searchQuery || '');
  const [localSelected, setLocalSelected] = useState<string[]>(
    value?.selectedIds || []
  );

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(localSearch.toLowerCase())
  );

  const toggleCategory = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    if (localSelected.length === 0 && !localSearch.trim()) {
      onChange(null);
    } else {
      onChange({ selectedIds: localSelected, searchQuery: localSearch.trim() });
    }
  };

  const handleClear = () => {
    setLocalSearch('');
    setLocalSelected([]);
    onChange(null);
  };

  return (
    <FilterDropdown label="Kategorie" isActive={value !== null}>
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-2 text-[var(--nothing-muted)]" />
          <input
            type="text"
            placeholder="Kategorie suchen..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl text-xs pl-7 pr-2.5 py-1.5 text-[var(--nothing-text)] placeholder-[var(--nothing-muted)] focus:outline-none focus:border-[var(--nothing-border-hover)]"
          />
        </div>

        {/* Category List */}
        <div className="max-h-[200px] overflow-y-auto space-y-0.5">
          {filteredCategories.map((c) => {
            const isChecked = localSelected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] font-medium'
                    : 'text-[var(--nothing-muted)] hover:bg-[var(--nothing-subsurface)]/50 hover:text-[var(--nothing-text)]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-[#D71921] border-[#D71921]'
                      : 'border-[var(--nothing-border)]'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="truncate">{c.name}</span>
              </button>
            );
          })}
          {filteredCategories.length === 0 && (
            <div className="text-[10px] text-[var(--nothing-muted)] text-center py-2 font-mono uppercase tracking-wider">
              Keine Treffer
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--nothing-border)]">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-3 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Filtern
          </button>
          {value !== null && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] font-mono text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>
    </FilterDropdown>
  );
};

// ─── Payee Filter ───────────────────────────────────────────────────────

interface PayeeFilterProps {
  payees: string[];
  value: PayeeFilterValue | null;
  onChange: (value: PayeeFilterValue | null) => void;
}

export const PayeeFilter: React.FC<PayeeFilterProps> = ({
  payees,
  value,
  onChange,
}) => {
  const [localSearch, setLocalSearch] = useState(value?.searchQuery || '');
  const [localSelected, setLocalSelected] = useState<string[]>(
    value?.selectedPayees || []
  );

  const filteredPayees = payees.filter((p) =>
    p.toLowerCase().includes(localSearch.toLowerCase())
  );

  const togglePayee = (p: string) => {
    setLocalSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleApply = () => {
    if (localSelected.length === 0 && !localSearch.trim()) {
      onChange(null);
    } else {
      onChange({
        selectedPayees: localSelected,
        searchQuery: localSearch.trim(),
      });
    }
  };

  const handleClear = () => {
    setLocalSearch('');
    setLocalSelected([]);
    onChange(null);
  };

  return (
    <FilterDropdown label="Zahlungsempfänger" isActive={value !== null}>
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-2 text-[var(--nothing-muted)]" />
          <input
            type="text"
            placeholder="Empfänger suchen..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl text-xs pl-7 pr-2.5 py-1.5 text-[var(--nothing-text)] placeholder-[var(--nothing-muted)] focus:outline-none focus:border-[var(--nothing-border-hover)]"
          />
        </div>

        {/* Payee List */}
        <div className="max-h-[200px] overflow-y-auto space-y-0.5">
          {filteredPayees.map((p) => {
            const isChecked = localSelected.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePayee(p)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] font-medium'
                    : 'text-[var(--nothing-muted)] hover:bg-[var(--nothing-subsurface)]/50 hover:text-[var(--nothing-text)]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-[#D71921] border-[#D71921]'
                      : 'border-[var(--nothing-border)]'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="truncate font-sans">{p}</span>
              </button>
            );
          })}
          {filteredPayees.length === 0 && (
            <div className="text-[10px] text-[var(--nothing-muted)] text-center py-2 font-mono uppercase tracking-wider">
              Keine Treffer
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--nothing-border)]">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-3 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Filtern
          </button>
          {value !== null && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] font-mono text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>
    </FilterDropdown>
  );
};

// ─── Date Filter ────────────────────────────────────────────────────────

interface DateFilterProps {
  value: DateFilterValue | null;
  onChange: (value: DateFilterValue | null) => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<DateFilterValue['mode']>(
    value?.mode || 'range'
  );
  const [from, setFrom] = useState(value?.from || '');
  const [to, setTo] = useState(value?.to || '');

  const handleApply = () => {
    if (!from && !to) {
      onChange(null);
      return;
    }
    onChange({ mode, from, to });
  };

  const handleClear = () => {
    setMode('range');
    setFrom('');
    setTo('');
    onChange(null);
  };

  // Quick presets
  const applyPreset = (preset: string) => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        setMode('exact');
        setFrom(fmt(today));
        setTo(fmt(today));
        break;
      case 'this-week': {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() + 1); // Monday
        setMode('range');
        setFrom(fmt(start));
        setTo(fmt(today));
        break;
      }
      case 'this-month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        setMode('range');
        setFrom(fmt(start));
        setTo(fmt(today));
        break;
      }
      case 'last-month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        setMode('range');
        setFrom(fmt(start));
        setTo(fmt(end));
        break;
      }
      case 'this-year': {
        const start = new Date(today.getFullYear(), 0, 1);
        setMode('range');
        setFrom(fmt(start));
        setTo(fmt(today));
        break;
      }
    }
  };

  return (
    <FilterDropdown label="Datum" isActive={value !== null}>
      <div className="space-y-2 min-w-[260px]">
        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1">
          {[
            { key: 'today', label: 'Heute' },
            { key: 'this-week', label: 'Diese Woche' },
            { key: 'this-month', label: 'Dieser Monat' },
            { key: 'last-month', label: 'Letzter Monat' },
            { key: 'this-year', label: 'Dieses Jahr' },
          ].map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset.key)}
              className="px-2 py-1 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-[10px] font-mono uppercase tracking-wider text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] hover:border-[var(--nothing-border-hover)] transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Mode Select */}
        <div className="flex gap-1">
          {(
            [
              { key: 'range', label: 'Zeitraum' },
              { key: 'before', label: 'Vor' },
              { key: 'after', label: 'Nach' },
              { key: 'exact', label: 'Genau' },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`flex-1 px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                mode === m.key
                  ? 'bg-[var(--nothing-text)] text-[var(--nothing-bg)] font-semibold'
                  : 'border border-[var(--nothing-border)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2">
          {(mode === 'range' || mode === 'after' || mode === 'exact') && (
            <div className="flex-1">
              <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                {mode === 'exact' ? 'Datum' : 'Von'}
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl text-xs px-2.5 py-1.5 text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-border-hover)]"
              />
            </div>
          )}
          {(mode === 'range' || mode === 'before') && (
            <div className="flex-1">
              <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                {mode === 'range' ? 'Bis' : 'Vor'}
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl text-xs px-2.5 py-1.5 text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-border-hover)]"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--nothing-border)]">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-3 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Filtern
          </button>
          {value !== null && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] font-mono text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>
    </FilterDropdown>
  );
};

// ─── Status Filter ──────────────────────────────────────────────────────

interface StatusFilterProps {
  value: StatusFilterValue | null;
  onChange: (value: StatusFilterValue | null) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
}) => {
  const [local, setLocal] = useState<StatusFilterValue>(
    value || { uncleared: true, cleared: true, reconciled: true }
  );

  const toggle = (key: keyof StatusFilterValue) => {
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = () => {
    // If all are selected or all are deselected, it means no filter
    if (local.uncleared && local.cleared && local.reconciled) {
      onChange(null);
    } else if (!local.uncleared && !local.cleared && !local.reconciled) {
      onChange(null);
    } else {
      onChange(local);
    }
  };

  const handleClear = () => {
    setLocal({ uncleared: true, cleared: true, reconciled: true });
    onChange(null);
  };

  const statusOptions = [
    { key: 'uncleared' as const, label: 'Offen', color: 'var(--nothing-muted)' },
    { key: 'cleared' as const, label: 'Bestätigt', color: 'var(--nothing-sage)' },
    { key: 'reconciled' as const, label: 'Abgestimmt', color: 'var(--nothing-text)' },
  ];

  return (
    <FilterDropdown label="Status" isActive={value !== null} align="right">
      <div className="space-y-2 min-w-[180px]">
        {statusOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
              local[opt.key]
                ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] font-medium'
                : 'text-[var(--nothing-muted)] hover:bg-[var(--nothing-subsurface)]/50'
            }`}
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                local[opt.key]
                  ? 'bg-[#D71921] border-[#D71921]'
                  : 'border-[var(--nothing-border)]'
              }`}
            >
              {local[opt.key] && <Check className="w-3 h-3 text-white" />}
            </div>
            <span>{opt.label}</span>
          </button>
        ))}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--nothing-border)]">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-3 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Filtern
          </button>
          {value !== null && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] font-mono text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>
    </FilterDropdown>
  );
};

// ─── Amount Filter ──────────────────────────────────────────────────────

interface AmountFilterProps {
  label: string;
  value: AmountFilterValue | null;
  onChange: (value: AmountFilterValue | null) => void;
  align?: 'left' | 'right';
}

export const AmountFilter: React.FC<AmountFilterProps> = ({
  label,
  value,
  onChange,
  align = 'right',
}) => {
  const [mode, setMode] = useState<AmountFilterValue['mode']>(
    value?.mode || 'gt'
  );
  const [value1, setValue1] = useState(value?.value1 || '');
  const [value2, setValue2] = useState(value?.value2 || '');

  const handleApply = () => {
    if (!value1.trim()) {
      onChange(null);
      return;
    }
    onChange({ mode, value1: value1.trim(), value2: value2.trim() });
  };

  const handleClear = () => {
    setMode('gt');
    setValue1('');
    setValue2('');
    onChange(null);
  };

  return (
    <FilterDropdown label={label} isActive={value !== null} align={align}>
      <div className="space-y-2 min-w-[220px]">
        {/* Mode Select */}
        <div className="flex gap-1">
          {(
            [
              { key: 'gt', label: 'Größer' },
              { key: 'lt', label: 'Kleiner' },
              { key: 'between', label: 'Zwischen' },
              { key: 'exact', label: 'Genau' },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`flex-1 px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                mode === m.key
                  ? 'bg-[var(--nothing-text)] text-[var(--nothing-bg)] font-semibold'
                  : 'border border-[var(--nothing-border)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Amount Inputs */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
              {mode === 'between' ? 'Von €' : mode === 'gt' ? 'Größer als €' : mode === 'lt' ? 'Kleiner als €' : 'Betrag €'}
            </label>
            <input
              type="text"
              placeholder="0,00"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl text-xs px-2.5 py-1.5 text-right text-[var(--nothing-text)] font-mono tabular-nums focus:outline-none focus:border-[var(--nothing-border-hover)]"
            />
          </div>
          {mode === 'between' && (
            <div className="flex-1">
              <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                Bis €
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl text-xs px-2.5 py-1.5 text-right text-[var(--nothing-text)] font-mono tabular-nums focus:outline-none focus:border-[var(--nothing-border-hover)]"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--nothing-border)]">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-3 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Filtern
          </button>
          {value !== null && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] font-mono text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>
    </FilterDropdown>
  );
};

// ─── Filter Logic ───────────────────────────────────────────────────────

/** Parse a German-formatted amount string "12,50" or "12.50" to cents */
function parseFilterAmount(s: string): number | null {
  if (!s.trim()) return null;
  // Replace comma with dot for parsing
  const normalized = s.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

export function applyAllFilters<
  T extends {
    date: string;
    payee: string;
    categoryId: string | null;
    amountCents: number;
    clearedStatus: string;
    memo: string;
  }
>(
  transactions: T[],
  filters: AllFilters
): T[] {
  return transactions.filter((tx) => {
    // ── Category Filter ──
    if (filters.category) {
      const { selectedIds } = filters.category;
      if (selectedIds.length > 0 && !selectedIds.includes(tx.categoryId || '')) {
        return false;
      }
      // If only search query (no selections), skip — search is just for finding in the dropdown
    }

    // ── Payee Filter ──
    if (filters.payee) {
      const { selectedPayees, searchQuery } = filters.payee;
      if (selectedPayees.length > 0 && !selectedPayees.includes(tx.payee)) {
        return false;
      }
      // If only search query and no selections, filter by payee text
      if (selectedPayees.length === 0 && searchQuery) {
        if (!tx.payee.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
    }

    // ── Date Filter ──
    if (filters.date) {
      const { mode, from, to } = filters.date;
      switch (mode) {
        case 'range':
          if (from && tx.date < from) return false;
          if (to && tx.date > to) return false;
          break;
        case 'before':
          if (to && tx.date > to) return false;
          break;
        case 'after':
          if (from && tx.date < from) return false;
          break;
        case 'exact':
          if (from && tx.date !== from) return false;
          break;
      }
    }

    // ── Status Filter ──
    if (filters.status) {
      const s = filters.status;
      if (tx.clearedStatus === 'uncleared' && !s.uncleared) return false;
      if (tx.clearedStatus === 'cleared' && !s.cleared) return false;
      if (tx.clearedStatus === 'reconciled' && !s.reconciled) return false;
    }

    // ── Outflow (Ausgabe) Filter ──
    if (filters.outflow) {
      const absAmount = tx.amountCents < 0 ? Math.abs(tx.amountCents) : 0;
      if (tx.amountCents >= 0) return false; // Not an outflow
      const v1 = parseFilterAmount(filters.outflow.value1);
      const v2 = parseFilterAmount(filters.outflow.value2);
      if (v1 === null) return true;
      switch (filters.outflow.mode) {
        case 'gt':
          if (absAmount <= v1) return false;
          break;
        case 'lt':
          if (absAmount >= v1) return false;
          break;
        case 'between':
          if (v2 === null) return true;
          if (absAmount < v1 || absAmount > v2) return false;
          break;
        case 'exact':
          if (absAmount !== v1) return false;
          break;
      }
    }

    // ── Inflow (Einnahme) Filter ──
    if (filters.inflow) {
      if (tx.amountCents < 0) return false; // Not an inflow
      const v1 = parseFilterAmount(filters.inflow.value1);
      const v2 = parseFilterAmount(filters.inflow.value2);
      if (v1 === null) return true;
      switch (filters.inflow.mode) {
        case 'gt':
          if (tx.amountCents <= v1) return false;
          break;
        case 'lt':
          if (tx.amountCents >= v1) return false;
          break;
        case 'between':
          if (v2 === null) return true;
          if (tx.amountCents < v1 || tx.amountCents > v2) return false;
          break;
        case 'exact':
          if (tx.amountCents !== v1) return false;
          break;
      }
    }

    return true;
  });
}
