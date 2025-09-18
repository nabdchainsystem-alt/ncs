import React from 'react';
import cardTheme from '../../styles/cardTheme';

export type RecentActivityEntry = {
  id: string;
  icon: React.ReactNode;
  title: string;
  meta: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
};

export interface RecentActivityFeedProps {
  items?: RecentActivityEntry[];
  visibleCount?: number;
  isLoading?: boolean;
  errorMessage?: string | null;
  emptyMessage?: string;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_EMPTY = 'No recent activity to display';

function ActivitySkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-4 py-3"
      style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}
    >
      <span className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-1/3 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export function RecentActivityFeed({
  items = [],
  visibleCount = 6,
  isLoading = false,
  errorMessage,
  emptyMessage = DEFAULT_EMPTY,
  onRetry,
  className,
  style,
}: RecentActivityFeedProps) {
  const limitedItems = React.useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  let body: React.ReactNode;

  if (isLoading) {
    body = (
      <div className="space-y-3">
        {Array.from({ length: visibleCount }).map((_, index) => (
          <ActivitySkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  } else if (errorMessage) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-6 text-sm text-gray-500 dark:text-gray-400" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
        <span>{errorMessage}</span>
        {onRetry ? (
          <button
            type="button"
            className="rounded-full border px-3 py-1 font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  } else if (!limitedItems.length) {
    body = (
      <div className="flex items-center justify-center rounded-2xl border px-4 py-6 text-sm text-gray-500 dark:text-gray-400" style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}>
        {emptyMessage}
      </div>
    );
  } else {
    body = (
      <ul className="space-y-3">
        {limitedItems.map((item) => {
          const primary = (
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-full border bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900"
                style={{ borderColor: cardTheme.border() }}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{item.meta}</div>
              </div>
            </div>
          );

          return (
            <li key={item.id}>
              <div
                className="rounded-2xl border px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"
                style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}
              >
                <div className="flex items-center justify-between gap-3">
                  {item.href ? (
                    <a href={item.href} className="flex flex-1" aria-label={item.title}>
                      {primary}
                    </a>
                  ) : (
                    <div className="flex flex-1">{primary}</div>
                  )}
                  {item.actionLabel ? (
                    <button
                      type="button"
                      className="rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={item.onAction}
                    >
                      {item.actionLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={`flex flex-col ${className ?? ''}`} style={style}>
      {body}
    </div>
  );
}

export default RecentActivityFeed;
