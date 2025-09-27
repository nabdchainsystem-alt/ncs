import React from 'react';
import clsx from 'clsx';

import { ENFORCE_RM_PREFIX, RM_PREFIX_PATTERN, MATERIAL_SUGGESTION_LIMIT } from '../config/inventory';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getMaterialsByPrefix, type MaterialSuggestion } from '../lib/api/materials';

export type MaterialAutocompleteProps = {
  value: string;
  onChange: (next: string) => void;
  onSelect: (hit?: MaterialSuggestion) => void;
  enforceRMPrefix?: boolean;
  inputId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  limit?: number;
};

type Option =
  | { kind: 'hit'; hit: MaterialSuggestion }
  | { kind: 'create'; label: string };

export function MaterialAutocomplete({
  value,
  onChange,
  onSelect,
  enforceRMPrefix = ENFORCE_RM_PREFIX,
  inputId,
  placeholder = 'Start typing material name…',
  disabled,
  className,
  limit = MATERIAL_SUGGESTION_LIMIT,
}: MaterialAutocompleteProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [suggestions, setSuggestions] = React.useState<MaterialSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [highlight, setHighlight] = React.useState<number>(-1);

  const debouncedValue = useDebouncedValue(value, 300);
  const trimmed = debouncedValue.trim();
  const canSearch = trimmed.length >= 2 && (!enforceRMPrefix || RM_PREFIX_PATTERN.test(trimmed));

  React.useEffect(() => {
    if (!canSearch) {
      setSuggestions([]);
      setOpen(false);
      setError(null);
      setHighlight(-1);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    getMaterialsByPrefix(trimmed, limit)
      .then((items) => {
        if (cancelled) return;
        setSuggestions(items);
        setOpen(true);
        if (items.length === 0) {
          setHighlight(-1);
        } else {
          setHighlight(0);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setSuggestions([]);
        setError(err instanceof Error ? err.message : 'Failed to fetch materials');
        setOpen(false);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canSearch, trimmed, limit]);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const exactMatch = suggestions.find((item) => item.name.toLowerCase() === trimmed.toLowerCase());

  const options: Option[] = suggestions.map((hit) => ({ kind: 'hit', hit }));
  if (trimmed && !exactMatch) {
    options.push({ kind: 'create', label: trimmed });
  }

  React.useEffect(() => {
    if (!open) return;
    if (!options.length) {
      setHighlight(-1);
      return;
    }
    setHighlight((current) => (current >= 0 && current < options.length ? current : 0));
  }, [open, options.length]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !options.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((prev) => {
        const next = prev + 1;
        return next >= options.length ? 0 : next;
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((prev) => {
        if (prev <= 0) return options.length - 1;
        return prev - 1;
      });
    } else if (event.key === 'Enter') {
      if (highlight >= 0 && highlight < options.length) {
        event.preventDefault();
        const option = options[highlight];
        if (option.kind === 'hit') {
          onChange(option.hit.name);
          onSelect(option.hit);
        } else {
          onSelect(undefined);
        }
        setOpen(false);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
    }
  };

  const showPrefixWarning = Boolean(value) && enforceRMPrefix && !RM_PREFIX_PATTERN.test(value);

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
          showPrefixWarning ? 'border-red-400 focus:ring-red-500' : 'border-gray-300',
        )}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.currentTarget.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (canSearch && suggestions.length) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />

      {showPrefixWarning ? (
        <div className="mt-1 text-xs text-red-600">Material names must start with “RM”.</div>
      ) : null}

      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}

      {open && (options.length > 0 || loading) ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-500">Loading…</div>
          ) : null}
          {options.map((option, index) => {
            if (option.kind === 'hit') {
              const { hit } = option;
              const isActive = index === highlight;
              const matchLength = value.length;
              const prefix = hit.name.slice(0, matchLength);
              const rest = hit.name.slice(matchLength);
              return (
                <button
                  key={`material-hit-${hit.id}`}
                  type="button"
                  className={clsx(
                    'flex w-full items-start gap-2 px-3 py-2 text-left text-sm',
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50',
                  )}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => {
                    onChange(hit.name);
                    onSelect(hit);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold text-primary-600">{prefix}</span>
                  <span className="flex-1 truncate">
                    {rest}
                    {hit.code ? (
                      <span className="ml-2 text-xs text-gray-400">{hit.code}</span>
                    ) : null}
                  </span>
                </button>
              );
            }

            const isActive = index === highlight;
            return (
              <button
                key="material-create"
                type="button"
                className={clsx(
                  'flex w-full items-center px-3 py-2 text-left text-sm',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50',
                )}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => {
                  onSelect(undefined);
                  setOpen(false);
                }}
              >
                Create “{option.label}”
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default MaterialAutocomplete;
