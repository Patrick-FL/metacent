import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('nothing_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nothing_theme', theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="h-7 px-3 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[11px] uppercase tracking-wider text-[var(--nothing-text)] hover:border-[var(--nothing-border-hover)] flex items-center gap-1.5 transition-colors cursor-pointer select-none"
      title="Design umschalten (Hell / Dunkel)"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full transition-colors ${
          theme === 'light' ? 'bg-[#D71921]' : 'bg-[var(--nothing-muted)]'
        }`}
      />
      <span>{theme === 'light' ? 'LIGHT' : 'DARK'}</span>
    </button>
  );
}
