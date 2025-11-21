import React from 'react';
import { Wrench, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import CustomTable from '../../../components/tools/CustomTable';

interface MaintenancePageProps {
    widgets?: any[];
    onDeleteWidget?: (id: string) => void;
    onUpdateWidget?: (id: string, updates: any) => void;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ widgets = [], onDeleteWidget, onUpdateWidget }) => {
    return (
        <div className="flex-1 flex flex-col bg-gray-50/50 overflow-y-auto">
            <div className="p-8 w-full">

                {/* Render Dynamic Widgets */}
                {widgets.map((widget) => {
                    if (widget.type === 'custom-table') {
                        return (
                            <CustomTable
                                key={widget.id}
                                {...widget}
                                {...widget}
                                onDelete={() => onDeleteWidget && onDeleteWidget(widget.id)}
                                onRenameTable={(newTitle) => onUpdateWidget && onUpdateWidget(widget.id, { title: newTitle })}
                                onRenameColumn={(colId, newName) => {
                                    const updatedColumns = widget.columns.map((c: any) =>
                                        c.id === colId ? { ...c, name: newName } : c
                                    );
                                    onUpdateWidget && onUpdateWidget(widget.id, { columns: updatedColumns });
                                }}
                                onAddColumn={() => {
                                    const newColumn = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        name: 'New Column',
                                        type: 'text',
                                        width: 150
                                    };
                                    onUpdateWidget && onUpdateWidget(widget.id, { columns: [...widget.columns, newColumn] });
                                }}
                                onUpdateColumnType={(colId, newType) => {
                                    const updatedColumns = widget.columns.map((c: any) =>
                                        c.id === colId ? { ...c, type: newType } : c
                                    );
                                    onUpdateWidget && onUpdateWidget(widget.id, { columns: updatedColumns });
                                }}
                                onDeleteColumn={(colId) => {
                                    const updatedColumns = widget.columns.filter((c: any) => c.id !== colId);
                                    onUpdateWidget && onUpdateWidget(widget.id, { columns: updatedColumns });
                                }}
                                onUpdateColumnColor={(colId, newColor) => {
                                    const updatedColumns = widget.columns.map((c: any) =>
                                        c.id === colId ? { ...c, color: newColor } : c
                                    );
                                    onUpdateWidget && onUpdateWidget(widget.id, { columns: updatedColumns });
                                }}
                                onUpdateRow={(rowId, newData) => {
                                    const currentRows = widget.rows || [];
                                    const rowExists = currentRows.some((r: any) => r.id === rowId);
                                    let updatedRows;

                                    if (rowExists) {
                                        updatedRows = currentRows.map((r: any) =>
                                            r.id === rowId ? { ...r, data: newData } : r
                                        );
                                    } else {
                                        // If row doesn't exist (e.g. new row added locally in CustomTable), add it
                                        updatedRows = [...currentRows, { id: rowId, data: newData }];
                                    }
                                    onUpdateWidget && onUpdateWidget(widget.id, { rows: updatedRows });
                                }}
                            />
                        );
                    }
                    return null;
                })}

                {/* Default Placeholder Content (only if no widgets) */}
                {widgets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-indigo-50 p-6 rounded-full mb-6">
                            <Wrench className="text-indigo-600" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Operations</h2>
                        <p className="text-gray-500 max-w-md mb-8">
                            Manage equipment maintenance schedules, work orders, and repair logs here.
                            Use the "Insert" menu to add custom tables and charts.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                            {[
                                { label: 'Active Work Orders', value: '12', icon: AlertCircle, color: 'text-amber-600' },
                                { label: 'Completed Today', value: '8', icon: CheckCircle2, color: 'text-green-600' },
                                { label: 'Avg Response Time', value: '45m', icon: Clock, color: 'text-blue-600' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
                                        <stat.icon className={stat.color} size={20} />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaintenancePage;
