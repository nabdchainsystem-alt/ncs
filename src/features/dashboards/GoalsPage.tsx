import React, { useState } from 'react';
import { DashboardShell } from './components/DashboardShell';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, ChevronDown, Plus, Award, MoreHorizontal } from 'lucide-react';

interface KeyResult {
    id: string;
    title: string;
    current: number;
    target: number;
    unit: string;
    confidence: 'high' | 'medium' | 'low';
    owner: string;
}

interface Objective {
    id: string;
    title: string;
    progress: number;
    status: 'on-track' | 'at-risk' | 'off-track';
    keyResults: KeyResult[];
    expanded?: boolean;
}

const GoalsPage: React.FC = () => {
    const [objectives, setObjectives] = useState<Objective[]>([
        {
            id: '1',
            title: 'Scale Revenue to $10M ARR',
            progress: 65,
            status: 'on-track',
            expanded: true,
            keyResults: [
                { id: 'kr1', title: 'Close 5 Enterprise Deals', current: 3, target: 5, unit: 'deals', confidence: 'high', owner: 'Sales' },
                { id: 'kr2', title: 'Reduce Churn to < 2%', current: 2.4, target: 2.0, unit: '%', confidence: 'medium', owner: 'Success' },
                { id: 'kr3', title: 'Launch Self-Serve Plan', current: 80, target: 100, unit: '%', confidence: 'high', owner: 'Product' }
            ]
        },
        {
            id: '2',
            title: 'Become the #1 Rated App in Category',
            progress: 42,
            status: 'at-risk',
            expanded: true,
            keyResults: [
                { id: 'kr4', title: 'Achieve NPS of 70+', current: 58, target: 70, unit: 'score', confidence: 'low', owner: 'Product' },
                { id: 'kr5', title: 'Reduce App Load Time to 500ms', current: 800, target: 500, unit: 'ms', confidence: 'medium', owner: 'Eng' }
            ]
        },
        {
            id: '3',
            title: 'Build a World-Class Team',
            progress: 88,
            status: 'on-track',
            expanded: false,
            keyResults: [
                { id: 'kr6', title: 'Hire 5 Senior Engineers', current: 4, target: 5, unit: 'hires', confidence: 'high', owner: 'HR' },
                { id: 'kr7', title: 'Launch Internal Training Academy', current: 100, target: 100, unit: '%', confidence: 'high', owner: 'HR' }
            ]
        }
    ]);

    const toggleExpand = (id: string) => {
        setObjectives(prev => prev.map(obj =>
            obj.id === id ? { ...obj, expanded: !obj.expanded } : obj
        ));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'on-track': return 'text-green-600 bg-green-50 border-green-100';
            case 'at-risk': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'off-track': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'bg-green-500';
            case 'medium': return 'bg-amber-500';
            case 'low': return 'bg-red-500';
            default: return 'bg-gray-300';
        }
    };

    return (
        <DashboardShell
            title="Goals & OKRs"
            subtitle="Align your team, track progress, and achieve the impossible."
            headerActions={
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                    <Plus size={16} className="mr-2" /> New Objective
                </button>
            }
        >
            <div className="space-y-4">
                {/* High Level Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Overall Progress</p>
                            <h3 className="text-2xl font-bold text-gray-900">68%</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 flex items-center justify-center">
                            <TrendingUp size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">On Track</p>
                            <h3 className="text-2xl font-bold text-gray-900">12 <span className="text-xs text-gray-400 font-normal">/ 18</span></h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">At Risk</p>
                            <h3 className="text-2xl font-bold text-gray-900">3 <span className="text-xs text-gray-400 font-normal">Objectives</span></h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-amber-600" />
                        </div>
                    </div>
                </div>

                {/* Objectives List */}
                <div className="space-y-3">
                    {objectives.map(obj => (
                        <div key={obj.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Objective Header */}
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleExpand(obj.id)}
                            >
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className={`p-1.5 rounded-lg transition-transform duration-200 ${obj.expanded ? 'rotate-90' : ''}`}>
                                        <ChevronRight size={18} className="text-gray-400" />
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                        <Target size={20} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">{obj.title}</h3>
                                        <div className="flex items-center mt-0.5 space-x-2">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusColor(obj.status)} uppercase tracking-wide`}>
                                                {obj.status.replace('-', ' ')}
                                            </span>
                                            <span className="text-[10px] text-gray-400">Due Dec 31, 2024</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6 mr-2">
                                    <div className="flex flex-col items-end w-28">
                                        <div className="flex justify-between w-full text-xs mb-1">
                                            <span className="font-medium text-gray-700">{obj.progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${obj.status === 'off-track' ? 'bg-red-500' : obj.status === 'at-risk' ? 'bg-amber-500' : 'bg-blue-600'}`}
                                                style={{ width: `${obj.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 p-1.5">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Key Results */}
                            {obj.expanded && (
                                <div className="bg-gray-50/50 border-t border-gray-100 p-4 pl-20 space-y-2">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Key Results</h4>
                                    {obj.keyResults.map(kr => (
                                        <div key={kr.id} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between group hover:shadow-sm transition-shadow">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${getConfidenceColor(kr.confidence)}`} title={`Confidence: ${kr.confidence}`}></div>
                                                <span className="font-medium text-sm text-gray-800">{kr.title}</span>
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{kr.owner}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-xs text-gray-600">
                                                    <span className="font-bold text-gray-900">{kr.current}</span>
                                                    <span className="text-gray-400 mx-1">/</span>
                                                    <span>{kr.target} {kr.unit}</span>
                                                </div>
                                                <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${Math.min(100, (kr.current / kr.target) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="mt-1 text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                        <Plus size={12} className="mr-1" /> Add Key Result
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardShell>
    );
};

export default GoalsPage;
