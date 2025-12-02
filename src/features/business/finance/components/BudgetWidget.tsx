import React, { useMemo } from 'react';
import { useStore } from '../../../../contexts/StoreContext';
import { financeService } from '../../../../services/financeService';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetWidgetProps {
    projectId: string;
}

export const BudgetWidget: React.FC<BudgetWidgetProps> = ({ projectId }) => {
    const { projects, tasks, users } = useStore();

    const project = projects.find(p => p.id === projectId);

    const financialData = useMemo(() => {
        if (!project) return null;

        const projectTasks = tasks.filter(t => t.projectId === projectId);
        const spent = financeService.calculateProjectBurn(project, projectTasks, users);
        const remaining = financeService.calculateRemainingBudget(project, spent);
        const health = financeService.getBudgetHealth(project, spent);
        const percentUsed = Math.min(Math.round((spent / project.budget) * 100), 100);

        return { spent, remaining, health, percentUsed };
    }, [project, tasks, users, projectId]);

    if (!project || !financialData) return <div className="p-4 text-gray-400">Project not found</div>;

    const { spent, remaining, health, percentUsed } = financialData;

    const healthColor = {
        'Good': 'text-green-500',
        'At Risk': 'text-amber-500',
        'Critical': 'text-red-500'
    }[health];

    const progressBarColor = {
        'Good': 'bg-green-500',
        'At Risk': 'bg-amber-500',
        'Critical': 'bg-red-500'
    }[health];

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Project Budget</h3>
                    <p className="text-lg font-bold text-gray-900">{project.name}</p>
                </div>
                <div className={`p-2 rounded-xl bg-gray-50 ${healthColor}`}>
                    {health === 'Good' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
            </div>

            <div className="space-y-6">
                {/* Main Stats */}
                <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold text-gray-900">${spent.toLocaleString()}</span>
                    <span className="text-sm text-gray-400">spent of ${project.budget.toLocaleString()}</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span className={healthColor}>{percentUsed}% Used</span>
                        <span className="text-gray-400">${remaining.toLocaleString()} Remaining</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full ${progressBarColor} transition-all duration-1000 ease-out`}
                            style={{ width: `${percentUsed}%` }}
                        ></div>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Burn Rate</p>
                        <p className="text-sm font-bold text-gray-900 flex items-center">
                            <TrendingUp size={14} className="mr-1 text-red-500" />
                            $1,250/wk
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Forecast</p>
                        <p className="text-sm font-bold text-gray-900">
                            {health === 'Critical' ? 'Over Budget' : 'On Track'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
