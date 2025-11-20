import React, { useState } from 'react';
import { X, Plus, Trash2, Grid3X3, Type, Hash, Calendar, CheckSquare } from 'lucide-react';

interface ColumnConfig {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox';
    width: number;
}

interface TableBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (config: { title: string; columns: ColumnConfig[]; showBorder: boolean; headerColor: string }) => void;
}

const TableBuilder: React.FC<TableBuilderProps> = ({ isOpen, onClose, onAdd }) => {
    const [title, setTitle] = useState('New Table');
    const [columns, setColumns] = useState<ColumnConfig[]>([
        { id: '1', name: 'Column 1', type: 'text', width: 150 },
        { id: '2', name: 'Column 2', type: 'text', width: 150 },
    ]);
    const [showBorder, setShowBorder] = useState(true);
    const [headerColor, setHeaderColor] = useState('#f3f4f6');

    if (!isOpen) return null;

    const addColumn = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        setColumns([...columns, { id: newId, name: `Column ${columns.length + 1}`, type: 'text', width: 150 }]);
    };

    const removeColumn = (id: string) => {
        setColumns(columns.filter(c => c.id !== id));
    };

    const updateColumn = (id: string, field: keyof ColumnConfig, value: any) => {
        setColumns(columns.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleSubmit = () => {
        onAdd({ title, columns, showBorder, headerColor });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center space-x-2">
                        <Grid3X3 className="text-indigo-600" size={20} />
                        <h2 className="text-lg font-semibold text-gray-800">Custom Table Builder</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-8">

                    {/* Table Settings */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Table Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Enter table name..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Header Style</label>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={headerColor}
                                        onChange={(e) => setHeaderColor(e.target.value)}
                                        className="h-9 w-16 rounded cursor-pointer border border-gray-300 p-1"
                                    />
                                    <span className="text-xs text-gray-500">Color</span>
                                </div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showBorder}
                                        onChange={(e) => setShowBorder(e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Show Borders</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Column Designer */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-700">Columns Configuration</label>
                            <button
                                onClick={addColumn}
                                className="text-sm flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                <Plus size={16} />
                                <span>Add Column</span>
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-5">Name</div>
                                <div className="col-span-3">Type</div>
                                <div className="col-span-3">Width (px)</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {columns.map((col) => (
                                    <div key={col.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-white transition-colors">
                                        <div className="col-span-5">
                                            <input
                                                type="text"
                                                value={col.name}
                                                onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <select
                                                value={col.type}
                                                onChange={(e) => updateColumn(col.id, 'type', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-indigo-500 outline-none bg-white"
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date</option>
                                                <option value="checkbox">Checkbox</option>
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                value={col.width}
                                                onChange={(e) => updateColumn(col.id, 'width', parseInt(e.target.value))}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button
                                                onClick={() => removeColumn(col.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                disabled={columns.length <= 1}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Live Preview</label>
                        <div className="border rounded-lg overflow-hidden" style={{ borderColor: showBorder ? '#e5e7eb' : 'transparent' }}>
                            <div className="flex" style={{ backgroundColor: headerColor }}>
                                {columns.map(col => (
                                    <div
                                        key={col.id}
                                        className={`px-4 py-2 text-sm font-semibold text-gray-700 ${showBorder ? 'border-r border-gray-200 last:border-r-0' : ''}`}
                                        style={{ width: col.width }}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {col.type === 'text' && <Type size={12} className="text-gray-400" />}
                                            {col.type === 'number' && <Hash size={12} className="text-gray-400" />}
                                            {col.type === 'date' && <Calendar size={12} className="text-gray-400" />}
                                            {col.type === 'checkbox' && <CheckSquare size={12} className="text-gray-400" />}
                                            <span>{col.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white">
                                <div className={`flex border-t border-gray-100`}>
                                    {columns.map(col => (
                                        <div
                                            key={col.id}
                                            className={`px-4 py-3 text-sm text-gray-400 italic ${showBorder ? 'border-r border-gray-100 last:border-r-0' : ''}`}
                                            style={{ width: col.width }}
                                        >
                                            Sample Data
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
                    >
                        <Plus size={16} />
                        <span>Add Table</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TableBuilder;
