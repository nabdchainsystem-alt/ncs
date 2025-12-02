import React, { useState, useMemo } from 'react';
import { DashboardShell } from './components/DashboardShell';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, ChevronDown, Plus, Award, MoreHorizontal, Calendar, ArrowUpRight, Zap, Activity, Layers } from 'lucide-react';
import { goalsService, Objective } from '../../features/goals/goalsService';

const GoalsPage: React.FC = () => {
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    React.useEffect(() => {
        setObjectives(goalsService.getObjectives());
        return goalsService.subscribe(() => {
            setObjectives(goalsService.getObjectives());
        });
    }, []);

    const toggleExpand = (id: string) => {
        const obj = objectives.find(o => o.id === id);
        if (obj) {
            goalsService.updateObjective(id, { expanded: !obj.expanded });
        }
    };

    const stats = useMemo(() => {
        const total = objectives.length;
        const onTrack = objectives.filter(o => o.status === 'on-track').length;
        const atRisk = objectives.filter(o => o.status === 'at-risk').length;
        const offTrack = objectives.filter(o => o.status === 'off-track').length;
        const avgProgress = Math.round(objectives.reduce((acc, curr) => acc + curr.progress, 0) / (total || 1));
        return { total, onTrack, atRisk, offTrack, avgProgress };
    }, [objectives]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'on-track': return 'text-emerald-600 bg-emerald-50 border-emerald-100 ring-emerald-500/20';
            case 'at-risk': return 'text-amber-600 bg-amber-50 border-amber-100 ring-amber-500/20';
            case 'off-track': return 'text-rose-600 bg-rose-50 border-rose-100 ring-rose-500/20';
            default: return 'text-slate-600 bg-slate-50 border-slate-100 ring-slate-500/20';
        }
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'bg-emerald-500 shadow-emerald-200';
            case 'medium': return 'bg-amber-500 shadow-amber-200';
            case 'low': return 'bg-rose-500 shadow-rose-200';
            default: return 'bg-slate-300';
        }
    };

    return (
        <DashboardShell
            title="Goals & OKRs"
            subtitle="Align your team, track progress, and achieve the impossible."
            headerActions={
                <button className="flex items-center px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5">
                    <Plus size={18} className="mr-2" /> New Objective
                </button>
            }
        >
            <div className="space-y-8 pb-10">
                {/* Hero Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={80} className="text-blue-600" />
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Overall Progress</p>
                        <div className="flex items-baseline space-x-2">
                            <h3 className="text-4xl font-black text-gray-900">{stats.avgProgress}%</h3>
                            <span className="text-sm font-medium text-emerald-600 flex items-center">
                                <ArrowUpRight size={14} className="mr-0.5" /> +12%
                            </span>
                        </div>
                        <div className="mt-4 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${stats.avgProgress}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">On Track</p>
                                <h3 className="text-3xl font-black text-gray-900">{stats.onTrack}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2"><strong>{Math.round((stats.onTrack / stats.total) * 100)}%</strong> of total objectives</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-amber-200 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">At Risk</p>
                                <h3 className="text-3xl font-black text-gray-900">{stats.atRisk}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Requires attention immediately</p>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-20">
                            <Award size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">Quarterly Goal</p>
                            <h3 className="text-xl font-bold mb-1">Q4 2024 Sprint</h3>
                            <p className="text-indigo-100 text-sm mb-4 opacity-90">24 days remaining</p>
                            <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-xs font-bold flex items-center">
                                View Roadmap <ChevronRight size={12} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Objectives Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                <Target size={20} className="mr-2 text-gray-400" />
                                Active Objectives
                            </h2>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                {['all', 'active', 'completed'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {objectives.map(obj => (
                                <div key={obj.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
                                    {/* Objective Header */}
                                    <div
                                        className="p-6 cursor-pointer"
                                        onClick={() => toggleExpand(obj.id)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                                                    <Target size={24} className={obj.status === 'on-track' ? 'text-emerald-500' : obj.status === 'at-risk' ? 'text-amber-500' : 'text-rose-500'} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ring-1 ${getStatusColor(obj.status)} uppercase tracking-wide`}>
                                                            {obj.status.replace('-', ' ')}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-gray-400 flex items-center bg-gray-50 px-2 py-0.5 rounded-full">
                                                            <Layers size={10} className="mr-1" /> Strategic
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{obj.title}</h3>
                                                </div>
                                            </div>
                                            <button className="text-gray-300 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-full transition-colors">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-500">Progress</span>
                                                <span className="text-gray-900">{obj.progress}%</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${obj.status === 'off-track' ? 'bg-rose-500' : obj.status === 'at-risk' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${obj.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Results */}
                                    {obj.expanded && (
                                        <div className="bg-gray-50/50 border-t border-gray-100 p-6 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Results</h4>
                                                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
                                                    <Plus size={12} className="mr-1" /> Add Result
                                                </button>
                                            </div>
                                            {obj.keyResults.map(kr => (
                                                <div key={kr.id} className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between group/kr hover:border-blue-200 transition-colors">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-2 h-2 rounded-full shadow-sm ${getConfidenceColor(kr.confidence)}`} title={`Confidence: ${kr.confidence}`}></div>
                                                        <div>
                                                            <div className="font-bold text-sm text-gray-800">{kr.title}</div>
                                                            <div className="flex items-center mt-1 space-x-2">
                                                                <div className="flex -space-x-1.5">
                                                                    <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-600">
                                                                        {kr.owner.charAt(0)}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 font-medium">{kr.owner}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-6">
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-gray-900">
                                                                {kr.current} <span className="text-gray-400 text-xs font-normal">/ {kr.target} {kr.unit}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500 rounded-full"
                                                                style={{ width: `${Math.min(100, (kr.current / kr.target) * 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!obj.expanded && (
                                        <div className="px-6 pb-4 pt-0">
                                            <button
                                                onClick={() => toggleExpand(obj.id)}
                                                className="w-full py-2 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                Show {obj.keyResults.length} Key Results <ChevronDown size={14} className="ml-1" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        {/* Pulse / Activity Feed */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Activity size={20} className="mr-2 text-blue-500" /> Pulse
                            </h3>
                            <div className="space-y-6 relative">
                                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                                {[
                                    { user: 'Sarah', action: 'updated', target: 'Q4 Revenue', time: '2h ago', color: 'bg-pink-500' },
                                    { user: 'Mike', action: 'completed', target: 'Hire Senior Dev', time: '4h ago', color: 'bg-blue-500' },
                                    { user: 'Alex', action: 'commented on', target: 'Mobile App Launch', time: '1d ago', color: 'bg-amber-500' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start space-x-3 relative z-10">
                                        <div className={`w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0 ${item.color}`}></div>
                                        <div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                <span className="font-bold text-gray-900">{item.user}</span> {item.action} <span className="font-medium text-blue-600">{item.target}</span>
                                            </p>
                                            <span className="text-[10px] text-gray-400 font-medium">{item.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-6 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                View All Activity
                            </button>
                        </div>

                        {/* Focus Areas */}
                        <div className="bg-amber-50/50 rounded-3xl border border-amber-100 p-6">
                            <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center">
                                <Zap size={16} className="mr-2" /> Focus Areas
                            </h3>
                            <p className="text-xs text-amber-700/80 mb-4 leading-relaxed">
                                These objectives are currently <strong>at risk</strong> and need immediate attention to get back on track.
                            </p>
                            <div className="space-y-2">
                                {objectives.filter(o => o.status === 'at-risk').map(obj => (
                                    <div key={obj.id} className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-800 truncate max-w-[150px]">{obj.title}</span>
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{obj.progress}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Alignment / Tags */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Strategic Pillars</h3>
                            <div className="flex flex-wrap gap-2">
                                {['Growth', 'Product', 'Culture', 'Efficiency', 'Innovation'].map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-100">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
};

export default GoalsPage;
