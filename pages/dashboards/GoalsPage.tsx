import React, { useState } from 'react';
import { Target, Plus, Trophy, TrendingUp, MoreHorizontal } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface Goal {
    id: string;
    title: string;
    progress: number; // 0-100
    owner: string;
    color: string;
    dueDate: string;
}

const MOCK_GOALS: Goal[] = [
    { id: '1', title: 'Q4 Revenue Targets', progress: 65, owner: 'Max', color: '#7b68ee', dueDate: '2025-12-31' },
    { id: '2', title: 'Launch Mobile App', progress: 30, owner: 'Team', color: '#e44356', dueDate: '2025-11-30' },
    { id: '3', title: 'Hire 5 Engineers', progress: 80, owner: 'HR', color: '#22c55e', dueDate: '2025-10-15' },
];

const GoalsView: React.FC = () => {
    const { showToast } = useToast();
    const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);

    const handleAddGoal = () => {
        const title = prompt("Goal Name:");
        if (!title) return;

        const newGoal: Goal = {
            id: Date.now().toString(),
            title,
            progress: 0,
            owner: 'Me',
            color: '#3b82f6',
            dueDate: new Date().toISOString()
        };
        setGoals([...goals, newGoal]);
        showToast('Goal created!', 'success');
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50/50 p-8 overflow-y-auto h-full">
            <div className="max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            <Target className="mr-3 text-clickup-purple" /> Goals
                        </h1>
                        <p className="text-gray-500 mt-1">Track your OKRs and high-level objectives.</p>
                    </div>
                    <button
                        onClick={handleAddGoal}
                        className="px-4 py-2 bg-clickup-purple text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-purple-200 flex items-center"
                    >
                        <Plus size={18} className="mr-2" /> New Goal
                    </button>
                </div>

                {/* Goals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-clickup-purple group-hover:bg-purple-50 transition-colors">
                                    <Trophy size={20} />
                                </div>
                                <button className="text-gray-300 hover:text-gray-600">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-clickup-purple transition-colors">{goal.title}</h3>

                            <div className="flex items-center text-xs text-gray-500 mb-6">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium mr-2">{goal.owner}</span>
                                <span>Due {new Date(goal.dueDate).toLocaleDateString()}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                                            Progress
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-purple-600">
                                            {goal.progress}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-100">
                                    <div style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out"></div>
                                </div>
                            </div>

                            <div className="flex items-center text-xs text-gray-400 mt-2">
                                <TrendingUp size={12} className="mr-1 text-green-500" /> On Track
                            </div>
                        </div>
                    ))}

                    {/* Add New Card Placeholder */}
                    <button
                        onClick={handleAddGoal}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-clickup-purple hover:text-clickup-purple hover:bg-purple-50/50 transition-all min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-white">
                            <Plus size={24} />
                        </div>
                        <span className="font-medium">Create New Goal</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoalsView;
