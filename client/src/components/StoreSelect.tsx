import React from 'react';
import clsx from 'clsx';

import { listStores, type StoreDTO } from '../lib/api/stores';

export type StoreSelectProps = {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  includeInactive?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  name?: string;
  required?: boolean;
  autoFocus?: boolean;
};

export function StoreSelect({
  value,
  onChange,
  includeInactive = false,
  disabled,
  placeholder = 'Select store',
  className,
  name,
  required,
  autoFocus,
}: StoreSelectProps) {
  const [stores, setStores] = React.useState<StoreDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listStores({ activeOnly: !includeInactive, includeCounts: false })
      .then((items) => {
        if (cancelled) return;
        setStores(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load stores');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [includeInactive]);

  const normalizedValue = value ?? null;

  return (
    <div className={clsx('flex flex-col gap-1 text-sm', className)}>
      <select
        name={name}
        value={normalizedValue ?? ''}
        onChange={(event) => {
          const raw = event.currentTarget.value;
          if (!raw) {
            onChange(null);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : null);
        }}
        disabled={disabled || loading || !!error}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <option value="">
          {loading ? 'Loading stores…' : error ? 'Failed to load stores' : placeholder}
        </option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name} ({store.code}){store.isActive ? '' : ' — inactive'}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

export default StoreSelect;
