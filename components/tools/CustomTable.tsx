import React, { useState } from 'react';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';

interface ColumnConfig {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox';
    width: number;
}

interface CustomTableProps {
    id: string;
    title: string;
    columns: ColumnConfig[];
    showBorder: boolean;
    headerColor: string;
}

const CustomTable: React.FC<CustomTableProps> = ({ id, title, columns, showBorder, headerColor }) => {
    const [rows, setRows] = useState<any[]>([
        { id: '1', data: {} },
        { id: '2', data: {} },
        { id: '3', data: {} },
    ]);

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(36).substr(2, 9), data: {} }]);
    };

    const updateCell = (rowId: string, colId: string, value: any) => {
        setRows(rows.map(row => {
            if (row.id === rowId) {
                return { ...row, data: { ...row.data, [colId]: value } };
            }
            return row;
        }));
    };

    return (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                    <div className={`border-b border-gray-200 ${showBorder ? 'border-l border-r' : ''}`}>
                        {/* Header */}
                        <div className="flex" style={{ backgroundColor: headerColor }}>
                            {columns.map(col => (
                                <div
                                    key={col.id}
                                    className={`px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider ${showBorder ? 'border-r border-gray-200 last:border-r-0' : ''}`}
                                    style={{ width: col.width, minWidth: col.width }}
                                >
                                    {col.name}
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div className="bg-white divide-y divide-gray-200">
                            {rows.map((row) => (
                                <div key={row.id} className="flex hover:bg-gray-50 transition-colors group">
                                    {columns.map(col => (
                                        <div
                                            key={col.id}
                                            className={`p-0 ${showBorder ? 'border-r border-gray-200 last:border-r-0' : ''}`}
                                            style={{ width: col.width, minWidth: col.width }}
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
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <button
                    onClick={addRow}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                >
                    <Plus size={16} />
                    <span>Add Row</span>
                </button>
            </div>
        </div>
    );
};

export default CustomTable;
