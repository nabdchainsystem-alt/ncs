import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Sparkles, RefreshCcw, Search, Filter } from 'lucide-react';

import BaseCard from '../ui/BaseCard';
import Button from '../ui/Button';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useAllInventoryTableItems } from '../../features/inventory/hooks';
import type { InventoryItemStatus, InventoryTableItem } from '../../features/inventory/items/adapters';

const STATUS_LABELS: Record<InventoryItemStatus, string> = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
};

const STATUS_ORDER: Record<InventoryItemStatus, number> = {
  'out-of-stock': 0,
  'low-stock': 1,
  'in-stock': 2,
};

const STATUS_COLORS: Record<InventoryItemStatus, string> = {
  'in-stock': 'inventory-holo-status--ok',
  'low-stock': 'inventory-holo-status--warn',
  'out-of-stock': 'inventory-holo-status--alert',
};

type StatusOption = 'all' | InventoryItemStatus;

const STATUS_OPTIONS: Array<{ value: StatusOption; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'in-stock', label: STATUS_LABELS['in-stock'] },
  { value: 'low-stock', label: STATUS_LABELS['low-stock'] },
  { value: 'out-of-stock', label: STATUS_LABELS['out-of-stock'] },
];

const INITIAL_VISIBLE = 6;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'SAR',
  maximumFractionDigits: 0,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) {
    return 'Movement pending';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Movement pending';
  }
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 45) {
    return 'Updated moments ago';
  }

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds } of units) {
    if (absSeconds >= seconds || unit === 'second') {
      const value = Math.round(diffSeconds / seconds);
      return relativeTimeFormatter.format(value, unit);
    }
  }

  return 'Updated recently';
}

type HologramCardProps = {
  item: InventoryTableItem;
  reducedMotion: boolean;
};

function HologramCard({ item, reducedMotion }: HologramCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || reducedMotion) {
      return undefined;
    }

    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
    node.style.setProperty('--glare-x', '50%');
    node.style.setProperty('--glare-y', '50%');

    let frameId: number | null = null;
    let currentX = 0;
    let currentY = 0;
    let currentGlareX = 50;
    let currentGlareY = 50;
    let targetX = 0;
    let targetY = 0;
    let targetGlareX = 50;
    let targetGlareY = 50;

    const maxTilt = 12;
    const lerpFactor = 0.18;

    const update = () => {
      currentX += (targetX - currentX) * lerpFactor;
      currentY += (targetY - currentY) * lerpFactor;
      currentGlareX += (targetGlareX - currentGlareX) * lerpFactor;
      currentGlareY += (targetGlareY - currentGlareY) * lerpFactor;

      node.style.setProperty('--tilt-x', `${currentX.toFixed(2)}deg`);
      node.style.setProperty('--tilt-y', `${currentY.toFixed(2)}deg`);
      node.style.setProperty('--glare-x', `${currentGlareX.toFixed(2)}%`);
      node.style.setProperty('--glare-y', `${currentGlareY.toFixed(2)}%`);

      frameId = requestAnimationFrame(update);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width;
      const offsetY = (event.clientY - rect.top) / rect.height;
      const clampedX = Math.min(Math.max(offsetX, 0), 1);
      const clampedY = Math.min(Math.max(offsetY, 0), 1);

      targetY = (clampedX - 0.5) * 2 * maxTilt;
      targetX = (0.5 - clampedY) * 2 * maxTilt;
      targetGlareX = clampedX * 100;
      targetGlareY = clampedY * 100;
    };

    const reset = () => {
      targetX = 0;
      targetY = 0;
      targetGlareX = 50;
      targetGlareY = 50;
    };

    node.addEventListener('pointermove', handlePointerMove);
    node.addEventListener('pointerenter', handlePointerMove);
    node.addEventListener('pointerleave', reset);
    node.addEventListener('touchend', reset, { passive: true });
    node.addEventListener('blur', reset);

    frameId = requestAnimationFrame(update);

    return () => {
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerenter', handlePointerMove);
      node.removeEventListener('pointerleave', reset);
      node.removeEventListener('touchend', reset);
      node.removeEventListener('blur', reset);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      node.style.removeProperty('--tilt-x');
      node.style.removeProperty('--tilt-y');
      node.style.removeProperty('--glare-x');
      node.style.removeProperty('--glare-y');
    };
  }, [reducedMotion, item.id]);

  const statusLabel = STATUS_LABELS[item.status];
  const statusClass = STATUS_COLORS[item.status];
  const hasImage = Boolean(item.pictureUrl);
  const totalValue = typeof item.unitCost === 'number' ? item.unitCost * item.qty : null;
  const valueLabel = totalValue != null && Number.isFinite(totalValue)
    ? currencyFormatter.format(totalValue)
    : '—';

  return (
    <article
      ref={cardRef}
      className={clsx('inventory-holo-card', statusClass)}
      data-tilt={!reducedMotion}
      tabIndex={0}
      aria-label={`${item.name} — ${statusLabel}`}
    >
      <div className="inventory-holo-card__media" aria-hidden={!hasImage}>
        {hasImage ? (
          <img
            src={item.pictureUrl ?? ''}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="inventory-holo-card__placeholder" aria-hidden="true">
            <span className="inventory-holo-card__placeholder-dot" />
            <span className="inventory-holo-card__placeholder-line" />
          </div>
        )}
      </div>
      <header className="inventory-holo-card__header">
        <h3 className="inventory-holo-card__title">{item.name}</h3>
        <span className={clsx('inventory-holo-status', statusClass)}>{statusLabel}</span>
      </header>
      <dl className="inventory-holo-card__meta" aria-label="Inventory item details">
        <div>
          <dt>SKU</dt>
          <dd>{item.code}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{item.category}</dd>
        </div>
        <div>
          <dt>Warehouse</dt>
          <dd>{item.warehouse ?? 'Unassigned'}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>{item.qty.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Unit</dt>
          <dd>{item.unit}</dd>
        </div>
        <div>
          <dt>Value</dt>
          <dd>{valueLabel}</dd>
        </div>
        <div className="inventory-holo-card__meta-span">
          <dt>Last movement</dt>
          <dd>{formatRelativeTime(item.lastMovementAt)}</dd>
        </div>
      </dl>
    </article>
  );
}

function HologramInventoryBlock() {
  const reducedMotion = usePrefersReducedMotion();
  const { data, isLoading, isFetching, error, refetch } = useAllInventoryTableItems();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusOption>('all');
  const [minQty, setMinQty] = useState('');
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const normalizedMinQty = useMemo(() => {
    const parsed = Number.parseInt(minQty, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }, [minQty]);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(data)) {
      return [] as InventoryTableItem[];
    }

    const query = search.trim().toLowerCase();

    return [...data]
      .filter((item) => {
        if (status !== 'all' && item.status !== status) {
          return false;
        }
        if (normalizedMinQty != null && item.qty < normalizedMinQty) {
          return false;
        }
        if (!query) {
          return true;
        }
        const haystack = [
          item.name,
          item.code,
          item.category,
          item.categoryParent ?? '',
          item.warehouse ?? '',
          item.store ?? '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const severityDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (severityDiff !== 0) return severityDiff;
        return b.qty - a.qty;
      });
  }, [data, search, status, normalizedMinQty]);

  const visibleItems = filteredItems.slice(0, visible);
  const canLoadMore = visible < filteredItems.length;
  const totalCount = filteredItems.length;
  const isEmpty = !isLoading && totalCount === 0;

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setMinQty('');
    setVisible(INITIAL_VISIBLE);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setVisible(INITIAL_VISIBLE);
  };

  const handleLoadMore = () => {
    setVisible((prev) => Math.min(prev + INITIAL_VISIBLE, filteredItems.length));
  };

  return (
    <BaseCard
      title="Inventory Hologram Wall"
      subtitle="Immersive view of live inventory health with tilt-reactive cards."
      headerRight={(
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void refetch();
          }}
          disabled={isFetching}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      )}
      className="relative overflow-hidden"
    >
      <div className="inventory-holo-screen">
        <div className="inventory-holo-screen__header">
          <div className="inventory-holo-screen__title">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <span>Holographic wall feed</span>
          </div>
          <p className="inventory-holo-screen__subtitle">
            Explore priority inventory movements with ambient scanlines and adaptive depth. Filters apply instantly.
          </p>
        </div>

        <form className="inventory-holo-toolbar" onSubmit={handleSubmit}>
          <label className="inventory-holo-field" aria-label="Search inventory">
            <span className="inventory-holo-field__label">Search</span>
            <div className="inventory-holo-field__control">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="SKU, name, warehouse"
                autoComplete="off"
              />
            </div>
          </label>

          <label className="inventory-holo-field" aria-label="Filter by status">
            <span className="inventory-holo-field__label">Status</span>
            <div className="inventory-holo-field__control inventory-holo-field__control--select">
              <Filter className="h-4 w-4" aria-hidden="true" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusOption)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="inventory-holo-field" aria-label="Minimum quantity">
            <span className="inventory-holo-field__label">Min quantity</span>
            <div className="inventory-holo-field__control">
              <input
                type="number"
                min={0}
                value={minQty}
                onChange={(event) => setMinQty(event.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                inputMode="numeric"
              />
            </div>
          </label>

          <div className="inventory-holo-toolbar__actions" role="group" aria-label="Filter actions">
            <button type="submit" className="inventory-holo-button">
              Apply
            </button>
            <button type="button" className="inventory-holo-button inventory-holo-button--ghost" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </form>

        <p className="inventory-holo-results" aria-live="polite">
          {isLoading
            ? 'Loading hologram feed…'
            : totalCount
              ? `Showing ${visibleItems.length} of ${totalCount} item${totalCount === 1 ? '' : 's'}`
              : 'No items match the current filters'}
        </p>

        {error ? (
          <div className="inventory-holo-empty" role="alert">
            <h4>Feed unavailable</h4>
            <p>We couldn’t reach the inventory feed. Please retry shortly.</p>
            <button type="button" className="inventory-holo-button" onClick={() => { void refetch(); }}>
              Retry
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="inventory-holo-grid" aria-live="polite" aria-busy="true">
            {Array.from({ length: INITIAL_VISIBLE }).map((_, index) => (
              <div className="inventory-holo-card inventory-holo-card--skeleton" key={`skeleton-${index}`}>
                <div className="inventory-holo-card__media skeleton" />
                <div className="inventory-holo-card__skeleton-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && isEmpty ? (
          <div className="inventory-holo-empty" role="note">
            <h4>No inventory matches</h4>
            <p>Adjust your filters to surface different SKUs or broaden quantity thresholds.</p>
          </div>
        ) : null}

        {!isLoading && !isEmpty ? (
          <div className="inventory-holo-grid" role="list" aria-live="polite">
            {visibleItems.map((item) => (
              <HologramCard key={item.id} item={item} reducedMotion={reducedMotion} />
            ))}
          </div>
        ) : null}

        {canLoadMore ? (
          <div className="inventory-holo-load-more">
            <button type="button" className="inventory-holo-button" onClick={handleLoadMore}>
              Load more
            </button>
          </div>
        ) : null}
      </div>
    </BaseCard>
  );
}

export default HologramInventoryBlock;
