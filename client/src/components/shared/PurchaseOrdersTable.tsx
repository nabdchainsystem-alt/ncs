import React from 'react';
import cardTheme from '../../styles/cardTheme';
import { formatSAR, formatNumber } from '../../shared/format';

type ColumnKey = 'orderNo' | 'vendor' | 'department' | 'date' | 'status' | 'amount' | 'actions';

type SortDirection = 'asc' | 'desc';

export interface PurchaseOrderRow {
  id: string;
  orderNo: string;
  vendor: string;
  department: string;
  date: string;
  status: string;
  amount: number;
  actions?: React.ReactNode;
}

export interface PurchaseOrdersTableProps {
  title?: string;
  subtitle?: string;
  rows: PurchaseOrderRow[];
  totalRows: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  sort?: { column: ColumnKey; direction: SortDirection } | null;
  onSortChange?: (next: { column: ColumnKey; direction: SortDirection }) => void;
  columnVisibility?: Partial<Record<ColumnKey, boolean>>;
  onColumnVisibilityChange?: (column: ColumnKey, next: boolean) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: PurchaseOrderRow) => void;
  onExportCsv?: () => void;
  canExportCsv?: boolean;
  exportTooltip?: string;
  statusRenderer?: (status: string) => React.ReactNode;
  actionRenderer?: (row: PurchaseOrderRow) => React.ReactNode;
  stickyOffset?: number;
  className?: string;
  filters?: React.ReactNode;
}

type ColumnDefinition = {
  key: ColumnKey;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  width?: string;
  render: (row: PurchaseOrderRow) => React.ReactNode;
};

const DEFAULT_PAGE_SIZES = [5, 10, 20, 50];
const DEFAULT_EMPTY_MESSAGE = 'No purchase orders to display';

function nextDirection(current?: SortDirection): SortDirection {
  return current === 'asc' ? 'desc' : 'asc';
}

function defaultStatusPill(status: string) {
  const normalized = status.toLowerCase();
  let tone: 'positive' | 'neutral' | 'info' | 'warning' | 'negative' = 'neutral';

  if (normalized.includes('open')) tone = 'positive';
  else if (normalized.includes('progress') || normalized.includes('pending')) tone = 'info';
  else if (normalized.includes('closed') || normalized.includes('complete')) tone = 'neutral';
  else if (normalized.includes('cancel') || normalized.includes('reject')) tone = 'negative';
  else tone = 'warning';

  const pill = cardTheme.pill(tone === 'negative' ? 'negative' : tone);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: pill.bg, color: pill.text }}
    >
      {status}
    </span>
  );
}

function TableSkeleton({ columns }: { columns: ColumnDefinition[] }) {
  return (
    <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
          {columns.map((column) => (
            <td key={column.key} className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : 'text-left'}`}>
              <div className="h-3.5 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function PurchaseOrdersTable({
  title = 'Purchase Orders',
  subtitle,
  rows,
  totalRows,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  sort,
  onSortChange,
  columnVisibility,
  onColumnVisibilityChange,
  isLoading = false,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  onRowClick,
  onExportCsv,
  canExportCsv = true,
  exportTooltip,
  statusRenderer = defaultStatusPill,
  actionRenderer,
  stickyOffset = 0,
  className,
  filters,
}: PurchaseOrdersTableProps) {
  const [columnsMenuOpen, setColumnsMenuOpen] = React.useState(false);
  const columnsMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(event.target as Node)) {
        setColumnsMenuOpen(false);
      }
    }
    if (columnsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [columnsMenuOpen]);

  const baseColumns = React.useMemo<ColumnDefinition[]>(() => [
    {
      key: 'orderNo',
      label: 'PO Code',
      sortable: true,
      width: '160px',
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.orderNo}</span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.vendor}</span>,
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.department}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => <span className="text-gray-600 dark:text-gray-300">{row.date}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => statusRenderer(row.status),
    },
    {
      key: 'amount',
      label: 'Amount (SAR)',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatSAR(row.amount)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        actionRenderer?.(row)
          ?? row.actions
          ?? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              Quick Actions
            </button>
          )
      ),
    },
  ], [actionRenderer, statusRenderer]);

  const mergedVisibility = React.useMemo(() => {
    const defaultVisibility: Record<ColumnKey, boolean> = {
      orderNo: true,
      vendor: true,
      department: true,
      date: true,
      status: true,
      amount: true,
      actions: true,
    };
    return { ...defaultVisibility, ...columnVisibility };
  }, [columnVisibility]);

  const visibleColumns = React.useMemo(
    () => baseColumns.filter((column) => mergedVisibility[column.key] !== false),
    [baseColumns, mergedVisibility],
  );

  const totalPages = Math.max(1, Math.ceil(totalRows / Math.max(pageSize, 1)));

  const handleSort = (column: ColumnKey, sortable?: boolean) => {
    if (!sortable || !onSortChange) return;
    const direction = column === sort?.column ? nextDirection(sort.direction) : 'desc';
    onSortChange({ column, direction });
  };

  const renderTableBody = () => {
    if (isLoading) {
      return <TableSkeleton columns={visibleColumns} />;
    }

    if (!rows.length) {
      return (
        <tbody>
          <tr>
            <td colSpan={visibleColumns.length} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {emptyMessage}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
        {rows.map((row) => (
          <tr
            key={row.id}
            className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
            onClick={() => onRowClick?.(row)}
          >
            {visibleColumns.map((column) => (
              <td
                key={`${row.id}-${column.key}`}
                className={`px-4 py-3 text-sm ${column.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className={`flex flex-col rounded-2xl border bg-white p-4 shadow-card dark:bg-gray-900 ${className ?? ''}`} style={{ borderColor: cardTheme.border() }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="text-sm">
            <div className="font-semibold text-gray-600 dark:text-gray-300">{title}</div>
            {subtitle ? <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div> : null}
          </div>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {formatNumber(totalRows)} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={columnsMenuRef}>
            <button
              type="button"
              className="rounded-full border px-3 py-1 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setColumnsMenuOpen((open) => !open)}
            >
              Columns
            </button>
            {columnsMenuOpen ? (
              <div
                className="absolute right-0 z-20 mt-2 w-48 rounded-xl border bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                style={{ borderColor: cardTheme.border() }}
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Show Columns</div>
                <ul className="space-y-2 text-sm">
                  {baseColumns.map((column) => (
                    <li key={column.key} className="flex items-center justify-between gap-2">
                      <label className="flex flex-1 items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                          checked={mergedVisibility[column.key] !== false}
                          onChange={(event) => onColumnVisibilityChange?.(column.key, event.target.checked)}
                        />
                        <span>{column.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          {onExportCsv ? (
            <button
              type="button"
              className="rounded-full border px-3 py-1 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              disabled={!canExportCsv}
              onClick={onExportCsv}
              title={exportTooltip}
            >
              Export CSV
            </button>
          ) : null}
        </div>
      </div>

      {filters ? <div className="mt-4">{filters}</div> : null}

      <div className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: cardTheme.border() }}>
        <div className="relative overflow-auto">
          <table className="min-w-full table-auto">
            <thead
              className="text-[12px] uppercase tracking-wide text-gray-500 dark:text-gray-400"
              style={{ background: cardTheme.surface(), position: 'sticky', top: stickyOffset, zIndex: 10 }}
            >
              <tr>
                {visibleColumns.map((column) => {
                  const isSorted = sort?.column === column.key;
                  const direction = isSorted ? sort?.direction : undefined;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-4 py-3 text-left ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 text-[12px] font-semibold ${column.sortable ? 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100' : 'cursor-default text-gray-500 dark:text-gray-400'}`}
                        onClick={() => handleSort(column.key, column.sortable)}
                        disabled={!column.sortable}
                      >
                        {column.label}
                        {column.sortable ? (
                          <span className="text-[10px]" aria-hidden="true">
                            {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '▲'}
                          </span>
                        ) : null}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {renderTableBody()}
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            className="rounded-lg border px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
            value={pageSize}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border px-3 py-1 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              onClick={() => onPageChange?.(Math.max(0, page - 1))}
              disabled={page <= 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-full border px-3 py-1 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseOrdersTable;
