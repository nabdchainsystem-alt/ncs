import * as XLSX from 'xlsx';
import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Plus, Trash2, Palette, ChevronLeft, ChevronRight, Filter, XCircle, Columns, Check, ArrowUpDown, FileSpreadsheet, Star } from 'lucide-react';
import { ColumnMenu } from '../features/tasks/components/ColumnMenu';
import { PlusIcon } from './TaskBoardIcons';

interface ColumnConfig {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox' | 'status' | 'dropdown' | 'long_text' | 'money' | 'website' | 'email' | 'phone' | 'rating' | 'progress_manual';
    width: number;
    color?: string;
    options?: { id: string; label: string; color: string }[]; // For status/dropdown type
    currency?: string; // For money type
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
    onAddColumn?: (type?: string, config?: any) => void;
    onUpdateColumnType?: (columnId: string, newType: 'text' | 'number' | 'date' | 'checkbox' | 'status') => void;
    onDeleteColumn?: (columnId: string) => void;
    onUpdateColumnColor?: (columnId: string, newColor: string) => void;
    onUpdateRow?: (rowId: string, data: any) => void;
    onRowsChange?: (newRows: any[]) => void;
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
    onUpdateRow, onRowsChange, rows: propRows
}) => {
    const [rows, setRows] = useState<any[]>(propRows || [
        { id: '1', data: {} },
        { id: '2', data: {} },
        { id: '2', data: {} },
        { id: '3', data: {} },
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
    const [filters, setFilters] = useState<{ columnId: string; operator: string; value: string }[]>([]);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [activeColumnMenu, setActiveColumnMenu] = useState<{ id: string; rect: DOMRect } | null>(null);

    const toggleColumnVisibility = (columnId: string) => {
        setHiddenColumns(prev =>
            prev.includes(columnId)
                ? prev.filter(id => id !== columnId)
                : [...prev, columnId]
        );
    };

    const handleSort = (columnId: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === columnId && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key: columnId, direction });
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const worksheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[worksheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (jsonData.length === 0) {
                    alert('Excel file is empty!');
                    return;
                }

                // First row is headers
                const headers = jsonData[0] as string[];
                const dataRows = jsonData.slice(1).filter(row => row && row.some(cell => cell !== null && cell !== undefined && cell !== ''));

                if (dataRows.length === 0) {
                    alert('No data rows found in Excel file!');
                    return;
                }

                // Map headers to existing columns
                const columnMapping: { [index: number]: string } = {};
                headers.forEach((header, index) => {
                    const col = columns.find(c => c.name.toLowerCase() === header.toString().toLowerCase());
                    if (col) {
                        columnMapping[index] = col.id;
                    }
                });

                // Convert data rows to table format
                const newRows = dataRows.map((row, rowIndex) => {
                    const rowId = `imported-${Date.now()}-${rowIndex}`;
                    const rowData: any = {};

                    row.forEach((value, colIndex) => {
                        const colId = columnMapping[colIndex];
                        if (!colId) return;

                        const col = columns.find(c => c.id === colId);
                        if (!col) return;

                        // Convert value based on column type
                        if (col.type === 'checkbox') {
                            rowData[colId] = value === true || value === 'true' || value === 'TRUE' || value === 1 || value === '1';
                        } else if (col.type === 'number') {
                            const numValue = Number(value);
                            rowData[colId] = !isNaN(numValue) ? numValue : value;
                        } else if (col.type === 'date') {
                            if (typeof value === 'number') {
                                const dateValue = XLSX.SSF.parse_date_code(value);
                                const date = new Date(dateValue.y, dateValue.m - 1, dateValue.d);
                                rowData[colId] = date.toISOString().split('T')[0];
                            } else {
                                const date = new Date(value);
                                rowData[colId] = !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : value?.toString() || '';
                            }
                        } else {
                            rowData[colId] = value !== undefined && value !== null ? value.toString() : '';
                        }
                    });

                    return { id: rowId, data: rowData };
                });

                const updatedRows = [...rows, ...newRows];
                setRows(updatedRows);
                if (onRowsChange) onRowsChange(updatedRows);
                alert(`✅ Imported ${newRows.length} rows!`);

            } catch (error) {
                alert(`Failed to import Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };

        reader.readAsBinaryString(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const visibleColumns = columns.filter(col => !hiddenColumns.includes(col.id));

    // Filter and Sort rows
    const processedRows = rows.filter(row => {
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
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const aValue = a.data[sortConfig.key];
        const bValue = b.data[sortConfig.key];

        if (aValue === bValue) return 0;

        const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

        // Handle numbers
        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
            return (Number(aValue) - Number(bValue)) * directionMultiplier;
        }

        // Handle strings
        return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
    });

    // Calculate pagination based on processed rows
    const totalPages = Math.ceil(processedRows.length / itemsPerPage);
    const paginatedRows = processedRows.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (currentPage === 0 && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [processedRows.length, totalPages, currentPage]);

    useEffect(() => {
        if (propRows) {
            setRows(propRows);
        }
    }, [propRows]);

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page
    };

    const addRow = () => {
        const newData: any = {};
        columns.forEach(col => {
            if (col.type === 'date') {
                newData[col.id] = new Date().toISOString().split('T')[0];
            }
        });
        const newRow = { id: Math.random().toString(36).substr(2, 9), data: newData };
        const newRows = [...rows, newRow];
        setRows(newRows);
        if (onRowsChange) onRowsChange(newRows);
        // Don't auto-switch page on add if filtered, might be confusing if new row doesn't match filter
        if (filters.length === 0) {
            const newTotalPages = Math.ceil(newRows.length / itemsPerPage);
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
        if (onRowsChange) onRowsChange(updatedRows);
    };

    const deleteRow = (rowId: string) => {
        const newRows = rows.filter(r => r.id !== rowId);
        setRows(newRows);
        if (onRowsChange) onRowsChange(newRows);
    };

    const updateRowColor = (rowId: string, color: string) => {
        const newRows = rows.map(r => r.id === rowId ? { ...r, color } : r);
        setRows(newRows);
        if (onRowsChange) onRowsChange(newRows);
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
        <div className="mb-8 bg-white rounded-xl animate-in fade-in duration-500 flex flex-col">
            {/* Header */}
            <div className="px-0 py-6 flex justify-between items-center bg-white shrink-0">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onRenameTable && onRenameTable(e.target.value)}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full mr-4 placeholder-gray-300"
                    placeholder="Table Name"
                />
                <div className="flex items-center space-x-3">
                    {/* Import Button */}
                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleImportExcel}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
                            title="Import from Excel"
                        >
                            <span>Import</span>
                            <FileSpreadsheet size={14} />
                        </button>
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilterMenu ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            <span>Filter</span>
                            <Filter size={14} className="text-gray-500" />
                        </button>
                        {showFilterMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3 mt-2">Show/Hide Columns</h4>
                                    <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                                        {columns.map(col => (
                                            <button
                                                key={col.id}
                                                onClick={() => toggleColumnVisibility(col.id)}
                                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                            >
                                                <div className={`w-4 h-4 mr-3 rounded border flex items-center justify-center transition-colors ${!hiddenColumns.includes(col.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                    {!hiddenColumns.includes(col.id) && <Check size={10} className="text-white" />}
                                                </div>
                                                <span className="truncate font-medium">{col.name || 'Untitled'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Delete Table Button */}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Table"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 scrollbar-hide border-t border-gray-100">
                <table className={`min-w-full border-collapse`} style={{ tableLayout: 'auto' }}>
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            {visibleColumns.map(col => (
                                <th
                                    key={col.id}
                                    className={`px-6 py-4 text-left relative group/header first:pl-4 cursor-pointer hover:bg-gray-100 transition-colors`}
                                    style={{ minWidth: col.width }}
                                    onClick={() => handleSort(col.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="relative w-full flex items-center space-x-2">
                                            {/* Ghost span for header auto-sizing */}
                                            <span className="invisible whitespace-pre text-xs font-medium text-gray-500 block min-w-[80px]">
                                                {col.name || 'Column'}
                                            </span>
                                            <input
                                                type="text"
                                                value={col.name}
                                                onChange={(e) => onRenameColumn && onRenameColumn(col.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()} // Prevent sort when clicking input
                                                className="absolute inset-0 w-full h-full bg-transparent border-none focus:ring-0 p-0 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-text"
                                            />
                                            {sortConfig?.key === col.id && (
                                                <ArrowUpDown size={12} className={`text-gray-400 ${sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} transition-transform`} />
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteColumn && onDeleteColumn(col.id); }}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover/header:opacity-100 ml-2 shrink-0"
                                            title="Delete Column"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="px-2 py-2 w-10">
                                <div className="flex items-center justify-center relative group bg-gray-50/80">
                                    <div
                                        className={"cursor-pointer w-6 h-6 rounded flex items-center justify-center transition-all duration-200 " + (activeColumnMenu ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/50')}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setActiveColumnMenu(activeColumnMenu ? null : { id: 'table-add', rect });
                                        }}
                                        title="Add Column"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {paginatedRows.length > 0 ? (
                            paginatedRows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors group" style={{ backgroundColor: row.color || 'transparent' }}>
                                    {visibleColumns.map(col => (
                                        <td
                                            key={col.id}
                                            className={`p-0 align-middle first:pl-4`}
                                            style={{ backgroundColor: col.color || 'transparent' }}
                                        >
                                            {col.type === 'checkbox' ? (
                                                <div className="w-full h-full flex items-center justify-center py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.data[col.id] || false}
                                                        onChange={(e) => updateCell(row.id, col.id, e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </div>
                                            ) : col.type === 'status' || col.type === 'dropdown' ? (
                                                <div className="w-full h-full px-4 py-3">
                                                    <select
                                                        value={row.data[col.id] || ''}
                                                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                                        className={`w-full h-8 text-xs rounded border-0 bg-transparent focus:ring-0 cursor-pointer ${
                                                            // simple color mapping for now
                                                            'font-medium'
                                                            }`}
                                                        style={{
                                                            backgroundColor: col.options?.find(o => o.label === row.data[col.id])?.color || 'transparent',
                                                            color: col.options?.find(o => o.label === row.data[col.id])?.color ? '#1f2937' : 'inherit'
                                                        }}
                                                    >
                                                        <option value="">Select...</option>
                                                        {col.options?.map(opt => (
                                                            <option key={opt.id} value={opt.label}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : col.type === 'long_text' ? (
                                                <div className="relative w-full h-full">
                                                    <textarea
                                                        value={row.data[col.id] || ''}
                                                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                                        className="absolute inset-0 w-full h-full px-4 py-2 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-blue-500/20 text-sm text-gray-600 placeholder-gray-300 resize-none leading-relaxed"
                                                        placeholder="..."
                                                    />
                                                </div>
                                            ) : col.type === 'money' ? (
                                                <div className="relative w-full h-full flex items-center px-4">
                                                    <span className="text-gray-400 text-sm mr-1">{col.currency === 'EUR' ? '€' : col.currency === 'GBP' ? '£' : '$'}</span>
                                                    <input
                                                        type="number"
                                                        value={row.data[col.id] || ''}
                                                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                                        className="w-full h-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-600 placeholder-gray-300"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            ) : col.type === 'rating' ? (
                                                <div className="w-full h-full flex items-center px-4 space-x-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => updateCell(row.id, col.id, star)}
                                                            className="focus:outline-none transition-transform hover:scale-110"
                                                        >
                                                            <Star
                                                                size={16}
                                                                className={`${(row.data[col.id] || 0) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : col.type === 'progress_manual' ? (
                                                <div className="w-full h-full flex items-center px-4 space-x-2 group/progress">
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative cursor-pointer">
                                                        <div
                                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all"
                                                            style={{ width: `${Math.min(100, Math.max(0, Number(row.data[col.id] || 0)))}%` }}
                                                        />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={row.data[col.id] || 0}
                                                            onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-8 text-right">{row.data[col.id] || 0}%</span>
                                                </div>
                                            ) : (
                                                <div className="relative w-full h-full">
                                                    {/* Ghost span for cell auto-sizing */}
                                                    <span className="invisible whitespace-pre px-6 py-4 block min-w-[80px] text-sm text-gray-600">
                                                        {row.data[col.id] || '...'}
                                                    </span>
                                                    <input
                                                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : (col.type === 'email' ? 'email' : (col.type === 'phone' ? 'tel' : 'text'))}
                                                        value={row.data[col.id] || ''}
                                                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                                        className={`absolute inset-0 w-full h-full px-6 py-4 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-blue-500/20 text-sm text-gray-600 placeholder-gray-300 ${col.type === 'website' ? 'text-blue-600 underline' : ''}`}
                                                        placeholder="..."
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                    <td className="w-16 p-0 align-middle">
                                        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-1 px-2">
                                            <div className="relative group/color">
                                                <button className="text-gray-300 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                                    <Palette size={14} />
                                                </button>
                                                <div className="absolute bottom-full right-0 mb-1 bg-white rounded-xl shadow-xl border border-gray-100 p-3 hidden group-hover/color:grid grid-cols-4 gap-2 w-40 z-50 ring-1 ring-black/5">
                                                    {COLORS.map((c) => (
                                                        <button
                                                            key={c.value}
                                                            onClick={() => updateRowColor(row.id, c.value)}
                                                            className={`w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform ${row.color === c.value ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                                                            style={{ backgroundColor: c.value }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteRow(row.id)}
                                                className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
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
                                <td colSpan={visibleColumns.length + 1} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                            <Filter size={20} className="text-gray-300" />
                                        </div>
                                        <span>{filters.length > 0 ? 'No results match your filters' : 'No data available'}</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination */}
            <div className="px-0 py-4 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
                <button
                    onClick={addRow}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                    title="Add Row"
                >
                    <div className="w-5 h-5 rounded-md border border-gray-300 flex items-center justify-center group-hover:border-blue-300 transition-colors">
                        <Plus size={12} />
                    </div>
                    <span>Add Row</span>
                </button>

                <div className="flex items-center space-x-6">
                    {/* Items per page */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Rows per page:</span>
                        <select
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="text-xs border-none bg-gray-50 rounded px-2 py-1 focus:ring-0 cursor-pointer text-gray-700 font-medium"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    {/* Page Info */}
                    <span className="text-xs text-gray-500">
                        {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, processedRows.length)} of {processedRows.length}
                    </span>

                    {/* Navigation */}
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`p-1.5 rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-1.5 rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
            {activeColumnMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveColumnMenu(null)} />
                    <div
                        className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: activeColumnMenu.rect.top - 45,
                            left: Math.min(window.innerWidth - 350, activeColumnMenu.rect.left - 300),
                            height: 'auto',
                            maxHeight: '600px'
                        }}
                    >
                        <ColumnMenu
                            onClose={() => setActiveColumnMenu(null)}
                            onSelect={(type, label, options, currency) => {
                                if (onAddColumn) {
                                    // For now, map the rich column config to what CustomTable expects if possible
                                    // Or pass it through if onAddColumn is updated to handle it.
                                    // Based on previous plan, I updated the type of onAddColumn.
                                    onAddColumn(type, { name: label, options, currency });
                                }
                                setActiveColumnMenu(null);
                            }}
                        />
                    </div>
                </>
            )}
        </div >
    );
};

export default CustomTable;
