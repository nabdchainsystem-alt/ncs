import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { resourceService } from '../../services/resourceService';

export const ResourceHeatmap: React.FC = () => {
    const { users, tasks } = useStore();

    // --- Data Preparation ---
    // For V1, we'll show a simple "Current Load" heatmap.
    // Future V2: Show load over time (Next 4 weeks).

    const heatmapData = users.map(user => {
        const load = resourceService.calculateUserLoad(user, tasks);
        const color = resourceService.getLoadColor(load);

        // Mocking future weeks for visualization
        const futureLoads = [
            load, // Current
            Math.max(0, load + (Math.random() * 40 - 20)), // Week +1
            Math.max(0, load + (Math.random() * 40 - 20)), // Week +2
            Math.max(0, load + (Math.random() * 40 - 20)), // Week +3
        ];

        return { user, futureLoads };
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Resource Heatmap</h2>
                <div className="flex space-x-4 text-xs text-gray-500">
                    <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-1"></div> &lt;50%</div>
                    <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-1"></div> 50-80%</div>
                    <div className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div> 80-100%</div>
                    <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-1"></div> &gt;100%</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left py-2 px-4 text-gray-500 font-medium text-sm">Team Member</th>
                            <th className="text-center py-2 px-4 text-gray-500 font-medium text-sm">Current</th>
                            <th className="text-center py-2 px-4 text-gray-500 font-medium text-sm">Week +1</th>
                            <th className="text-center py-2 px-4 text-gray-500 font-medium text-sm">Week +2</th>
                            <th className="text-center py-2 px-4 text-gray-500 font-medium text-sm">Week +3</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {heatmapData.map(({ user, futureLoads }) => (
                            <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center text-white text-xs font-bold`}>
                                            {user.avatar}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.role}</div>
                                        </div>
                                    </div>
                                </td>
                                {futureLoads.map((load, idx) => (
                                    <td key={idx} className="py-3 px-4">
                                        <div className="flex flex-col items-center justify-center">
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105"
                                                style={{ backgroundColor: resourceService.getLoadColor(load) }}
                                            >
                                                {Math.round(load)}%
                                            </div>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
