import React from 'react';
import cardTheme from '../../theme/cardTheme';

type FilterPill = {
  id: string;
  label: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: (id: string) => void;
};

type DateRangeOption = {
  id: string;
  label: string;
};

type FiltersBarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  dateRangeValue?: string;
  dateRanges?: DateRangeOption[];
  onDateRangeChange?: (id: string) => void;
  pills?: FilterPill[];
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function FiltersBar({
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search…',
  searchAriaLabel = 'Search list',
  dateRangeValue,
  dateRanges,
  onDateRangeChange,
  pills,
  children,
  className,
  style,
}: FiltersBarProps) {
  const mode = cardTheme.runtimeMode();
  const [draft, setDraft] = React.useState(searchValue);

  React.useEffect(() => {
    setDraft(searchValue);
  }, [searchValue]);

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
        alignItems: 'center',
        gap: 12,
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
          aria-label={searchAriaLabel}
          style={{
            height: 40,
            minWidth: 220,
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
            height: 40,
            borderRadius: cardTheme.radius.sm,
            border: `1px solid ${cardTheme.border(mode)}`,
            background: '#1D4ED8',
            color: '#ffffff',
            padding: '0 16px',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Search
        </button>
      </form>

      {dateRanges && dateRanges.length ? (
        <div style={{ position: 'relative' }}>
          <select
            value={dateRangeValue}
            onChange={(event) => onDateRangeChange?.(event.currentTarget.value)}
            style={{
              height: 40,
              borderRadius: cardTheme.radius.sm,
              border: `1px solid ${cardTheme.border(mode)}`,
              background: cardTheme.surface(mode),
              padding: '0 12px',
              fontSize: 14,
            }}
          >
            {dateRanges.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {pills && pills.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {pills.map((pill) => {
            const tone = pill.active ? cardTheme.pill('positive') : cardTheme.pill('neutral');
            return (
              <button
                key={pill.id}
                type="button"
                disabled={pill.disabled}
                onClick={() => pill.onClick?.(pill.id)}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${pill.active ? 'transparent' : cardTheme.border(mode)}`,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  background: tone.bg,
                  color: tone.text,
                  opacity: pill.disabled ? 0.5 : 1,
                  cursor: pill.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {children ? <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div> : null}
    </div>
  );
}

export type { FiltersBarProps, FilterPill, DateRangeOption };
