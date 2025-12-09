import React, { useState } from 'react';
import CustomTable from '../../ui/CustomTable';
import {
    Sparkles,
    Search,
    Filter,
    ArrowUpDown,
    Columns,
    Download,
    Upload,
    Wand2,
    Settings,
    MoreHorizontal,
    Bot
} from 'lucide-react';

interface RoomTableProps {
    roomId: string;
    viewId: string;
}

const RoomTable: React.FC<RoomTableProps> = ({ roomId, viewId }) => {
    const storageKeyColumns = `room-table-columns-${roomId}-${viewId}`;
    const storageKeyRows = `room-table-rows-${roomId}-${viewId}`;

    // Load initial data from storage or use defaults
    const [columns, setColumns] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem(storageKeyColumns);
            return saved ? JSON.parse(saved) : [
                { id: 'col1', name: 'Task Name', type: 'text', width: 250 },
                { id: 'col2', name: 'Status', type: 'status', width: 150 },
                { id: 'col3', name: 'Due Date', type: 'date', width: 150 },
                { id: 'col4', name: 'Priority', type: 'text', width: 120 },
            ];
        } catch (e) {
            return [
                { id: 'col1', name: 'Task Name', type: 'text', width: 250 },
                { id: 'col2', name: 'Status', type: 'status', width: 150 },
                { id: 'col3', name: 'Due Date', type: 'date', width: 150 },
                { id: 'col4', name: 'Priority', type: 'text', width: 120 },
            ];
        }
    });

    const [rows, setRows] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem(storageKeyRows);
            return saved ? JSON.parse(saved) : [
                { id: '1', data: { col1: 'Research competitors', col2: 'In Progress', col3: '2025-12-10', col4: 'High' } },
                { id: '2', data: { col1: 'Design mockups', col2: 'To Do', col3: '2025-12-15', col4: 'Medium' } },
                { id: '3', data: { col1: 'Client meeting', col2: 'Done', col3: '2025-12-05', col4: 'High' } },
            ];
        } catch (e) {
            return [];
        }
    });

    // Persist data when it changes
    React.useEffect(() => {
        localStorage.setItem(storageKeyColumns, JSON.stringify(columns));
    }, [columns, storageKeyColumns]);

    React.useEffect(() => {
        localStorage.setItem(storageKeyRows, JSON.stringify(rows));
    }, [rows, storageKeyRows]);

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Third Top Bar - Advanced Tools */}
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white sticky top-0 z-20 shadow-sm">
                <div className="flex items-center space-x-2">
                    {/* Primary Tools */}
                    <div className="flex items-center space-x-1 mr-4 border-r border-gray-200 pr-4">
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium">
                            <Search size={14} />
                            <span>Search</span>
                        </button>
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium">
                            <Filter size={14} />
                            <span>Filter</span>
                        </button>
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium">
                            <ArrowUpDown size={14} />
                            <span>Sort</span>
                        </button>
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium">
                            <Columns size={14} />
                            <span>Columns</span>
                        </button>
                    </div>

                    {/* Advanced Tools */}
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
                            Advanced
                        </div>

                        <button className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-all text-xs font-medium group">
                            <Bot size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                            <span>Ask AI</span>
                        </button>

                        <button className="flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-50 text-gray-600 rounded-lg border border-transparent hover:border-gray-200 transition-all text-xs font-medium">
                            <Wand2 size={14} />
                            <span>Auto-Fill</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors" title="Import">
                        <Upload size={14} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors" title="Export">
                        <Download size={14} />
                    </button>
                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="flex-1 overflow-hidden p-4 bg-gray-50/50">
                <CustomTable
                    id={`table-${roomId}-${viewId}`}
                    title="Main Table"
                    columns={columns}
                    rows={rows}
                    onRowsChange={setRows}
                    onAddColumn={() => {
                        const newId = Math.random().toString(36).substr(2, 9);
                        setColumns([...columns, { id: newId, name: 'New Column', type: 'text', width: 150 }]);
                    }}
                    onRenameColumn={(id, name) => {
                        setColumns(columns.map(c => c.id === id ? { ...c, name } : c));
                    }}
                    onDeleteColumn={(id) => {
                        setColumns(columns.filter(c => c.id !== id));
                    }}
                    showBorder={true}
                    headerColor="transparent"
                />
            </div>
        </div>
    );
};

export default RoomTable;
