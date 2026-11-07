import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { HelpCircle } from 'lucide-react';

interface TitleBarProps {
  onOpenShortcuts: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenShortcuts }) => {
  return (
    <header
      data-tauri-drag-region
      className="h-10 w-full flex items-center justify-between px-3 select-none bg-[var(--nothing-surface)] border-b border-[var(--nothing-border)] shrink-0 z-30"
    >
      <div className="flex items-center space-x-2.5">
        <div className="w-2 h-2 rounded-full bg-[#D71921] animate-pulse" />
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--nothing-text)] font-semibold">
          METACENT // 1.0
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="h-7 px-2.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[11px] uppercase tracking-wider text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] hover:border-[var(--nothing-border-hover)] flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Tastatur-Kurzbefehle anzeigen (?)"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="text-[10px]">TASTEN</span>
          <kbd className="px-1 py-0.2 rounded border border-[var(--nothing-border)] bg-[var(--nothing-surface)] font-mono text-[9px] text-[var(--nothing-text)] font-semibold">?</kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
};

