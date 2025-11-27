import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Trash2, Palette, ChevronLeft, ChevronRight, Filter, XCircle, Columns, Check } from 'lucide-react';

interface ColumnConfig {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox' | 'status';
    width: number;
    color?: string;
    options?: string[]; // For status type
}

interface CustomTableProps {
    id: string;
    title: string;
    columns: ColumnConfig[];
    showBorder?: boolean;
    headerColor?: string;
    onDelete?: () => void;
    onRenameTable?: (newTitle: string) => void;
    onRenameColumn?: (columnId: string, newName: string) => void;
    onAddColumn?: () => void;
    onUpdateColumnType?: (columnId: string, newType: 'text' | 'number' | 'date' | 'checkbox' | 'status') => void;
    onDeleteColumn?: (columnId: string) => void;
    onUpdateColumnColor?: (columnId: string, newColor: string) => void;
    onUpdateRow?: (rowId: string, data: any) => void;
    rows?: any[];
}

const COLORS = [
    { name: 'Default', value: 'transparent' },
    { name: 'Red', value: '#fee2e2' },
    { name: 'Green', value: '#dcfce7' },
    { name: 'Blue', value: '#dbeafe' },
    { name: 'Yellow', value: '#fef9c3' },
    { name: 'Purple', value: '#f3e8ff' },
    { name: 'Orange', value: '#ffedd5' },
];
const ITEMS_PER_PAGE = 10;

const CustomTable: React.FC<CustomTableProps> = ({
    id, title, columns, showBorder, headerColor,
    onDelete, onRenameTable, onRenameColumn, onAddColumn,
    onUpdateColumnType, onDeleteColumn, onUpdateColumnColor,
    onUpdateRow, rows: propRows
}) => {
    const [rows, setRows] = useState<any[]>(propRows || [
        { id: '1', data: {} },
        { id: '2', data: {} },
        { id: '2', data: {} },
        { id: '3', data: {} },
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<{ columnId: string; operator: string; value: string }[]>([]);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    const toggleColumnVisibility = (columnId: string) => {
        setHiddenColumns(prev =>
            prev.includes(columnId)
                ? prev.filter(id => id !== columnId)
                : [...prev, columnId]
        );
    };

    const visibleColumns = columns.filter(col => !hiddenColumns.includes(col.id));

    // Filter rows
    const filteredRows = rows.filter(row => {
        if (filters.length === 0) return true;
        return filters.every(filter => {
            const cellValue = String(row.data[filter.columnId] || '').toLowerCase();
            const filterValue = filter.value.toLowerCase();
            switch (filter.operator) {
                case 'contains': return cellValue.includes(filterValue);
                case 'equals': return cellValue === filterValue;
                case 'starts_with': return cellValue.startsWith(filterValue);
                case 'ends_with': return cellValue.endsWith(filterValue);
                default: return true;
            }
        });
    });

    // Calculate pagination based on filtered rows
    const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
    const paginatedRows = filteredRows.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (currentPage === 0 && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [filteredRows.length, totalPages, currentPage]);

    useEffect(() => {
        if (propRows) {
            setRows(propRows);
        }
    }, [propRows]);

    const addRow = () => {
        const newRow = { id: Math.random().toString(36).substr(2, 9), data: {} };
        const newRows = [...rows, newRow];
        setRows(newRows);
        // Don't auto-switch page on add if filtered, might be confusing if new row doesn't match filter
        if (filters.length === 0) {
            const newTotalPages = Math.ceil(newRows.length / ITEMS_PER_PAGE);
            setCurrentPage(newTotalPages);
        }
    };

    const updateCell = (rowId: string, colId: string, value: any) => {
        const updatedRows = rows.map(row => {
            if (row.id === rowId) {
                const newData = { ...row.data, [colId]: value };
                if (onUpdateRow) onUpdateRow(rowId, newData);
                return { ...row, data: newData };
            }
            return row;
        });
        setRows(updatedRows);
    };

    const deleteRow = (rowId: string) => {
        setRows(rows.filter(r => r.id !== rowId));
    };

    const updateRowColor = (rowId: string, color: string) => {
        setRows(rows.map(r => r.id === rowId ? { ...r, color } : r));
    };

    const addFilter = () => {
        if (columns.length > 0) {
            setFilters([...filters, { columnId: columns[0].id, operator: 'contains', value: '' }]);
        }
    };

    const removeFilter = (index: number) => {
        const newFilters = [...filters];
        newFilters.splice(index, 1);
        setFilters(newFilters);
    };

    const updateFilter = (index: number, field: 'columnId' | 'operator' | 'value', value: string) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], [field]: value };
        setFilters(newFilters);
    };

    return (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in duration-500 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0 rounded-t-xl">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onRenameTable && onRenameTable(e.target.value)}
                    className="text-lg font-semibold text-gray-800 bg-transparent border-none focus:ring-0 p-0 w-full mr-4"
                    placeholder="Table Name"
                />
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`p-1 rounded transition-colors ${showFilterMenu ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                            title="Filter Columns"
                        >
                            <Filter size={18} />
                        </button>
                        {showFilterMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Show/Hide Columns</h4>
                                    <div className="space-y-1 max-h-60 overflow-y-auto">
                                        {columns.map(col => (
                                            <button
                                                key={col.id}
                                                onClick={() => toggleColumnVisibility(col.id)}
                                                className="flex items-center w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <div className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${!hiddenColumns.includes(col.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                    {!hiddenColumns.includes(col.id) && <Check size={10} className="text-white" />}
                                                </div>
                                                <span className="truncate">{col.name || 'Untitled'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete Table"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto flex-1 scrollbar-hide">
                <table className={`min-w-full border-collapse ${showBorder ? 'border-l border-r border-gray-200' : ''}`} style={{ tableLayout: 'auto' }}>
                    <thead>
                        <tr style={{ backgroundColor: headerColor }} className="border-b border-gray-200">
                            {visibleColumns.map(col => (
                                <th
                                    key={col.id}
                                    className={`px-4 py-3 text-left relative group/header ${showBorder ? 'border-r border-gray-200 last:border-r-0' : ''}`}
                                    style={{ minWidth: col.width }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="relative w-full">
                                            {/* Ghost span for header auto-sizing */}
                                            <span className="invisible whitespace-pre text-xs font-bold uppercase tracking-wider block min-w-[80px]">
                                                {col.name || 'Column'}
                                            </span>
                                            <input
                                                type="text"
                                                value={col.name}
                                                onChange={(e) => onRenameColumn && onRenameColumn(col.id, e.target.value)}
                                                className="absolute inset-0 w-full h-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-gray-600 uppercase tracking-wider"
                                            />
                                        </div>
                                        <button
                                            onClick={() => onDeleteColumn && onDeleteColumn(col.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover/header:opacity-100 ml-2 shrink-0"
                                            title="Delete Column"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="px-2 py-2 w-10 border-l border-transparent hover:border-gray-200">
                                <button
                                    onClick={onAddColumn}
                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Add Column"
                                >
                                    <Plus size={16} />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedRows.length > 0 ? (
                            paginatedRows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors group" style={{ backgroundColor: row.color || 'transparent' }}>
                                    {visibleColumns.map(col => (
                                        <td
                                            key={col.id}
                                            className={`p-0 align-middle ${showBorder ? 'border-r border-gray-200 last:border-r-0' : ''}`}
                                            style={{ backgroundColor: col.color || 'transparent' }}
                                        >
                                            {col.type === 'checkbox' ? (
                                                <div className="w-full h-full flex items-center justify-center py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.data[col.id] || false}
                                                        onChange={(e) => updateCell(row.id, col.id, e.target.checked)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="relative w-full h-full">
                                                    {/* Ghost span for cell auto-sizing */}
                                                    <span className="invisible whitespace-pre px-4 py-3 block min-w-[80px] text-sm">
                                                        {row.data[col.id] || '...'}
                                                    </span>
                                                    <input
                                                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                                        value={row.data[col.id] || ''}
                                                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                                        className="absolute inset-0 w-full h-full px-4 py-3 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-sm text-gray-900"
                                                        placeholder="..."
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                    <td className="w-16 p-0 align-middle">
                                        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-1 px-2">
                                            <div className="relative group/color">
                                                <button className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50">
                                                    <Palette size={14} />
                                                </button>
                                                <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-xl border border-gray-100 p-2 hidden group-hover/color:grid grid-cols-4 gap-1 w-32 z-50">
                                                    {COLORS.map((c) => (
                                                        <button
                                                            key={c.value}
                                                            onClick={() => updateRowColor(row.id, c.value)}
                                                            className={`w-5 h-5 rounded-full border border-gray-200 ${row.color === c.value ? 'ring-2 ring-indigo-500' : ''}`}
                                                            style={{ backgroundColor: c.value }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteRow(row.id)}
                                                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                                                title="Delete Row"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center text-gray-500 text-sm">
                                    {filters.length > 0 ? 'No results match your filters' : 'No data'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
                <button
                    onClick={addRow}
                    className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Add Row"
                >
                    <Plus size={16} />
                    <span>Add Row</span>
                </button>

                {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`p-1 rounded transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs text-gray-500 font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-1 rounded transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};

export default CustomTable;
