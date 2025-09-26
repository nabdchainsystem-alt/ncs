import React from 'react';
import cardTheme from '../../theme/cardTheme';

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  renderCell: (row: T, rowIndex: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  cellClassName?: string;
  cellStyle?: React.CSSProperties;
};

export type DataTableSort = {
  sortBy?: string;
  direction?: 'asc' | 'desc';
  onSortChange?: (columnId: string, direction: 'asc' | 'desc') => void;
};

export type DataTablePagination = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor?: (row: T, index: number) => React.Key;
  toolbar?: React.ReactNode;
  loading?: boolean;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  pagination?: DataTablePagination;
  sort?: DataTableSort;
  className?: string;
  style?: React.CSSProperties;
  stickyHeader?: boolean;
  rowHeight?: number;
  onRowClick?: (row: T, index: number) => void;
};

function skeletonRows(count: number, columns: number) {
  return Array.from({ length: count }, (_, index) => (
    <tr key={`skeleton-${index}`}>
      {Array.from({ length: columns }, (_, columnIndex) => (
        <td key={`cell-${columnIndex}`} style={{ padding: '12px 16px' }}>
          <div
            style={{
              height: 12,
              width: `${60 + Math.random() * 30}%`,
              borderRadius: 999,
              background: 'linear-gradient(90deg, rgba(203,213,225,0.4) 25%, rgba(203,213,225,0.6) 37%, rgba(203,213,225,0.4) 63%)',
              animation: 'dt-skeleton 1.4s ease infinite',
            }}
          />
        </td>
      ))}
    </tr>
  ));
}

export default function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  toolbar,
  loading,
  emptyState,
  errorState,
  pagination,
  sort,
  className,
  style,
  stickyHeader = true,
  rowHeight,
  onRowClick,
}: DataTableProps<T>) {
  const mode = cardTheme.runtimeMode();

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || !sort?.onSortChange) return;
    const isActive = sort.sortBy === column.id;
    const nextDirection = !isActive ? 'asc' : sort.direction === 'asc' ? 'desc' : 'asc';
    sort.onSortChange(column.id, nextDirection);
  };

  const renderCell = (row: T, rowIndex: number, column: DataTableColumn<T>) => {
    const content = column.renderCell(row, rowIndex);
    const baseStyle: React.CSSProperties = {
      padding: '12px 16px',
      textAlign: column.align ?? 'left',
      minWidth: column.minWidth,
      width: column.width,
      borderTop: `1px solid ${cardTheme.border(mode)}`,
      verticalAlign: 'middle',
      cursor: onRowClick ? 'pointer' : 'default',
    };
    const style = column.cellStyle ? { ...baseStyle, ...column.cellStyle } : baseStyle;
    if (!column.cellStyle?.cursor && !onRowClick) {
      style.cursor = 'default';
    }
    return (
      <td
        key={column.id}
        className={column.cellClassName}
        style={style}
      >
        {content}
      </td>
    );
  };

  const computeKey = (row: T, index: number) => {
    if (keyExtractor) return keyExtractor(row, index);
    return index;
  };

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  let bodyContent: React.ReactNode;

  if (errorState) {
    bodyContent = (
      <tr>
        <td colSpan={columns.length} style={{ padding: '32px 16px', textAlign: 'center' }}>
          {errorState}
        </td>
      </tr>
    );
  } else if (loading) {
    bodyContent = skeletonRows(5, columns.length);
  } else if (rows.length === 0) {
    bodyContent = (
      <tr>
        <td colSpan={columns.length} style={{ padding: '32px 16px', textAlign: 'center', color: cardTheme.muted(mode) }}>
          {emptyState ?? 'No records to display.'}
        </td>
      </tr>
    );
  } else {
    bodyContent = rows.map((row, rowIndex) => {
      const isClickable = typeof onRowClick === 'function';
      return (
        <tr
          key={computeKey(row, rowIndex)}
          onClick={() => onRowClick?.(row, rowIndex)}
          tabIndex={isClickable ? 0 : -1}
          className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:odd:bg-gray-950 dark:even:bg-gray-900 dark:hover:bg-gray-800"
          style={{
            height: rowHeight,
            transition: 'background-color 120ms ease',
            cursor: isClickable ? 'pointer' : undefined,
          }}
        >
          {columns.map((column) => renderCell(row, rowIndex, column))}
        </tr>
      );
    });
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      {toolbar}
      <div
        style={{
          borderRadius: cardTheme.radius.md,
          border: `1px solid ${cardTheme.border(mode)}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={stickyHeader ? { position: 'sticky', top: 0, zIndex: 1 } : undefined}>
              <tr style={{ background: cardTheme.surface(mode) }}>
                {columns.map((column) => {
                  const isActive = sort?.sortBy === column.id;
                  const direction = isActive ? sort?.direction ?? 'asc' : undefined;
                  const baseStyle: React.CSSProperties = {
                    padding: '12px 16px',
                    textAlign: column.align ?? 'left',
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: cardTheme.muted(mode),
                    background: cardTheme.surface(mode),
                    borderBottom: `1px solid ${cardTheme.border(mode)}`,
                    verticalAlign: 'middle',
                    cursor: column.sortable ? 'pointer' : 'default',
                  };
                  const style = column.headerStyle ? { ...baseStyle, ...column.headerStyle } : baseStyle;
                  return (
                    <th
                      key={column.id}
                      onClick={() => handleSort(column)}
                      className={column.headerClassName}
                      style={style}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {column.header}
                        {column.sortable ? (
                          <span aria-hidden="true" style={{ fontSize: 11 }}>
                            {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '↕'}
                          </span>
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>{bodyContent}</tbody>
          </table>
        </div>
      </div>

      {pagination ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '4px 4px 0',
            color: cardTheme.muted(mode),
            fontSize: 13,
          }}
        >
          <span>
            Page {pagination.page + 1} of {totalPages}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {pagination.pageSizeOptions ? (
              <select
                value={pagination.pageSize}
                onChange={(event) => pagination.onPageSizeChange?.(Number(event.currentTarget.value))}
                style={{
                  height: 32,
                  borderRadius: cardTheme.radius.sm,
                  border: `1px solid ${cardTheme.border(mode)}`,
                  padding: '0 8px',
                }}
              >
                {pagination.pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} / page
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              onClick={() => pagination.onPageChange?.(Math.max(0, pagination.page - 1))}
              disabled={pagination.page <= 0}
              style={{
                borderRadius: cardTheme.radius.sm,
                border: `1px solid ${cardTheme.border(mode)}`,
                padding: '6px 12px',
                background: cardTheme.surface(mode),
                cursor: pagination.page <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => pagination.onPageChange?.(Math.min(totalPages - 1, pagination.page + 1))}
              disabled={pagination.page >= totalPages - 1}
              style={{
                borderRadius: cardTheme.radius.sm,
                border: `1px solid ${cardTheme.border(mode)}`,
                padding: '6px 12px',
                background: cardTheme.surface(mode),
                cursor: pagination.page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
      <style>{`
        @keyframes dt-skeleton {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
      `}</style>
    </div>
  );
}
