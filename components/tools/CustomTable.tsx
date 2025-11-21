import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Trash2, Type, Hash, Calendar, CheckSquare, ChevronDown, Palette } from 'lucide-react';

interface ColumnConfig {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox';
    width: number;
    color?: string;
}

interface CustomTableProps {
    id: string;
    title: string;
    columns: ColumnConfig[];
    showBorder: boolean;
    headerColor: string;
    onDelete?: () => void;
    onRenameTable?: (newTitle: string) => void;
    onRenameColumn?: (columnId: string, newName: string) => void;
    onAddColumn?: () => void;
    onUpdateColumnType?: (columnId: string, newType: 'text' | 'number' | 'date' | 'checkbox') => void;
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

const CustomTable: React.FC<CustomTableProps> = ({
    id, title, columns, showBorder, headerColor,
    onDelete, onRenameTable, onRenameColumn, onAddColumn,
    onUpdateColumnType, onDeleteColumn, onUpdateColumnColor,
    onUpdateRow, rows: propRows
}) => {
    const [rows, setRows] = useState<any[]>(propRows || [
        { id: '1', data: {} },
        { id: '2', data: {} },
        { id: '3', data: {} },
    ]);

    useEffect(() => {
        if (propRows) {
            setRows(propRows);
        }
    }, [propRows]);

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(36).substr(2, 9), data: {} }]);
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

    return (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onRenameTable && onRenameTable(e.target.value)}
                    className="text-lg font-semibold text-gray-800 bg-transparent border-none focus:ring-0 p-0 w-full mr-4"
                    placeholder="Table Name"
                />
                <div className="flex items-center space-x-2">
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

            <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                    <div className={`border-b border-gray-200 ${showBorder ? 'border-l border-r' : ''}`}>
                        <div className="flex" style={{ backgroundColor: headerColor }}>
                            {columns.map(col => (
                                <div
                                    key={col.id}
                                    className={`px-4 py-3 relative group/header ${showBorder ? 'border-r border-gray-200 last:border-r-0' : ''}`}
                                    style={{ width: col.width, minWidth: col.width }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                                            <div className="text-gray-400">
                                                {/* Icons removed for cleaner look */}
                                            </div>
                                            <input
                                                type="text"
                                                value={col.name}
                                                onChange={(e) => onRenameColumn && onRenameColumn(col.id, e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 p-0 w-full text-xs font-bold text-gray-600 uppercase tracking-wider"
                                            />
                                        </div>
                                        <button
                                            onClick={() => onDeleteColumn && onDeleteColumn(col.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover/header:opacity-100"
                                            title="Delete Column"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>

                                    {/* Type Selection Menu Removed */}
                                </div>
                            ))}

                            {/* Add Column Button */}
                            <div className="px-2 py-2 flex items-center justify-center border-l border-transparent hover:border-gray-200 w-10">
                                <button
                                    onClick={onAddColumn}
                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Add Column"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="bg-white divide-y divide-gray-200">
                            {rows.map((row) => (
                                <div key={row.id} className="flex hover:bg-gray-50 transition-colors group" style={{ backgroundColor: row.color || 'transparent' }}>
                                    {columns.map(col => (
                                        <div
                                            key={col.id}
                                            className={`p-0 ${showBorder ? 'border-r border-gray-200 last:border-r-0' : ''}`}
                                            style={{ width: col.width, minWidth: col.width, backgroundColor: col.color || 'transparent' }}
                                        >
                                            {col.type === 'checkbox' ? (
                                                <div className="w-full h-full flex items-center justify-center py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.data[col.id] || false}
                                                        onChange={(e) => updateCell(row.id, col.id, e.target.checked)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            ) : (
                                                <input
                                                    type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                                    value={row.data[col.id] || ''}
                                                    onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                                    className="w-full h-full px-4 py-3 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-sm text-gray-900"
                                                    placeholder="..."
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {/* Row Actions */}
                                    <div className="w-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
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
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={addRow}
                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Add Row"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div >
    );
};

export default CustomTable;
