import React from 'react';
import cardTheme from '../../theme/cardTheme';

export type ToolbarFilter = {
  id: string;
  label: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: (id: string) => void;
};

export type ColumnToggle = {
  id: string;
  label: string;
  visible: boolean;
};

export type TableToolbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  onExport?: () => void;
  exportLabel?: string;
  canExport?: boolean;
  columnToggles?: ColumnToggle[];
  onColumnToggle?: (id: string) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function TableToolbar({
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search…',
  filters,
  onExport,
  exportLabel = 'Export CSV',
  canExport = true,
  columnToggles,
  onColumnToggle,
  children,
  className,
  style,
}: TableToolbarProps) {
  const mode = cardTheme.runtimeMode();
  const [draft, setDraft] = React.useState(searchValue);
  const [columnMenuOpen, setColumnMenuOpen] = React.useState(false);
  const columnMenuRef = React.useRef<HTMLDetailsElement | null>(null);

  React.useEffect(() => {
    setDraft(searchValue);
  }, [searchValue]);

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!columnMenuRef.current) return;
      if (!columnMenuRef.current.contains(event.target as Node)) {
        columnMenuRef.current.open = false;
        setColumnMenuOpen(false);
      }
    };

    if (columnMenuOpen) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }

    return undefined;
  }, [columnMenuOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit?.(draft.trim());
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        ...style,
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={draft}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setDraft(value);
            onSearchChange?.(value);
          }}
          placeholder={searchPlaceholder}
          style={{
            height: 38,
            minWidth: 200,
            borderRadius: cardTheme.radius.sm,
            border: `1px solid ${cardTheme.border(mode)}`,
            background: cardTheme.surface(mode),
            padding: '0 12px',
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            height: 38,
            borderRadius: cardTheme.radius.sm,
            border: `1px solid ${cardTheme.border(mode)}`,
            background: '#1F2937',
            color: '#ffffff',
            padding: '0 14px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Search
        </button>
      </form>

      {filters && filters.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {filters.map((filter) => {
            const tone = filter.active ? cardTheme.pill('positive') : cardTheme.pill('neutral');
            return (
              <button
                key={filter.id}
                type="button"
                disabled={filter.disabled}
                onClick={() => filter.onClick?.(filter.id)}
                style={{
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${filter.active ? 'transparent' : cardTheme.border(mode)}`,
                  background: tone.bg,
                  color: tone.text,
                  opacity: filter.disabled ? 0.5 : 1,
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {children}
        {columnToggles && columnToggles.length ? (
          <details
            ref={columnMenuRef}
            onToggle={(event) => setColumnMenuOpen((event.currentTarget as HTMLDetailsElement).open)}
            style={{ position: 'relative' }}
          >
            <summary
              style={{
                listStyle: 'none',
                cursor: 'pointer',
                borderRadius: cardTheme.radius.sm,
                border: `1px solid ${cardTheme.border(mode)}`,
                padding: '0.5rem 0.85rem',
                fontSize: 13,
                fontWeight: 600,
                background: cardTheme.surface(mode),
              }}
            >
              Columns
            </summary>
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 4px)',
                minWidth: 180,
                borderRadius: cardTheme.radius.sm,
                border: `1px solid ${cardTheme.border(mode)}`,
                background: cardTheme.surface(mode),
                boxShadow: cardTheme.shadow(mode),
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                zIndex: 20,
              }}
            >
              {columnToggles.map((column) => (
                <label key={column.id} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={() => onColumnToggle?.(column.id)}
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>
          </details>
        ) : null}

        {onExport ? (
          <button
            type="button"
            onClick={() => canExport && onExport()}
            disabled={!canExport}
            style={{
              borderRadius: cardTheme.radius.sm,
              border: `1px solid ${cardTheme.border(mode)}`,
              padding: '0.5rem 0.85rem',
              fontSize: 13,
              fontWeight: 600,
              background: canExport ? cardTheme.surface(mode) : 'transparent',
              color: canExport ? cardTheme.valueColor(mode) : cardTheme.muted(mode),
              cursor: canExport ? 'pointer' : 'not-allowed',
            }}
          >
            {exportLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
