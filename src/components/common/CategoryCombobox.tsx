import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category, CategoryGroup } from '../../types';
import { Search, ChevronDown, Check } from 'lucide-react';

interface CategoryComboboxProps {
  categories: Category[];
  groups?: CategoryGroup[];
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
  placeholder?: string;
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  categories,
  groups = [],
  value,
  onChange,
  className = '',
  placeholder = 'Kategorie wählen...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === value),
    [categories, value]
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();

    // Also match against group name
    const matchingGroupIds = new Set(
      groups.filter((g) => g.name.toLowerCase().includes(q)).map((g) => g.id)
    );

    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || matchingGroupIds.has(c.groupId)
    );
  }, [categories, groups, search]);

  // Group filtered categories
  const groupedCategories = useMemo(() => {
    const map = new Map<string, { group: CategoryGroup | null; items: Category[] }>();

    for (const cat of filteredCategories) {
      const g = groups.find((gr) => gr.id === cat.groupId) || null;
      const key = g ? g.id : '__no_group__';
      if (!map.has(key)) {
        map.set(key, { group: g, items: [] });
      }
      map.get(key)!.items.push(cat);
    }

    return Array.from(map.values());
  }, [filteredCategories, groups]);

  const handleSelect = (catId: string) => {
    onChange(catId);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCategories.length > 0) {
        handleSelect(filteredCategories[0].id);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-xs font-sans text-[var(--nothing-text)] transition-colors cursor-pointer text-left min-w-[130px] max-w-[200px]"
        title={selectedCategory?.name || placeholder}
      >
        <span className="truncate">
          {selectedCategory ? selectedCategory.name : <span className="text-[var(--nothing-muted)] italic">{placeholder}</span>}
        </span>
        <ChevronDown className="w-3 h-3 text-[var(--nothing-muted)] shrink-0" />
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 right-0 sm:left-0 sm:right-auto w-64 bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-72 text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Search Field */}
          <div className="p-2 border-b border-[var(--nothing-border)] bg-[var(--nothing-subsurface)]/60">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-[var(--nothing-muted)] pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Kategorie suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl text-xs pl-8 pr-2.5 py-1 text-[var(--nothing-text)] placeholder-[var(--nothing-muted)] focus:outline-none focus:border-[#D71921]"
              />
            </div>
          </div>

          {/* List of items */}
          <div className="overflow-y-auto flex-1 p-1">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-[var(--nothing-muted)] font-mono text-[11px]">
                Keine Kategorie gefunden
              </div>
            ) : (
              groupedCategories.map(({ group, items }) => (
                <div key={group?.id || 'nogroup'} className="mb-1.5 last:mb-0">
                  {group && (
                    <div className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[var(--nothing-muted)] font-semibold select-none">
                      {group.name}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {items.map((cat) => {
                      const isSelected = cat.id === value;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelect(cat.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#D71921]/10 text-[#D71921] font-medium'
                              : 'hover:bg-[var(--nothing-subsurface)] text-[var(--nothing-text)]'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#D71921] shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

