import React from 'react';
import { Wrench, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import CustomTable from '../../../components/tools/CustomTable';

interface MaintenancePageProps {
    widgets?: any[];
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ widgets = [] }) => {
    return (
        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col animate-in fade-in duration-500 bg-gray-50/50">
            <div className="max-w-7xl mx-auto">

                {/* Render Dynamic Widgets */}
                {widgets.map((widget) => {
                    if (widget.type === 'custom-table') {
                        return <CustomTable key={widget.id} {...widget} />;
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
