import React from 'react';
import { DashboardShell } from './components/DashboardShell';
import { Activity, AlertCircle, Calendar, CheckCircle2, Clock, Zap, ArrowUpRight, Users, TrendingUp, Shield } from 'lucide-react';

const OverviewPage: React.FC = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    return (
        <DashboardShell
            title="Command Center"
            subtitle={`${greeting}. Here's what's happening across the organization today.`}
            headerActions={
                <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm">
                    Generate Report
                </button>
            }
        >
            {/* Morning Briefing Section & Top Row */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={120} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Zap className="text-yellow-500 mr-2" size={20} />
                        Daily Briefing
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="mt-1"><Activity size={16} className="text-blue-600" /></div>
                            <div>
                                <p className="text-sm text-blue-900 font-medium">System Performance</p>
                                <p className="text-xs text-blue-700 mt-0.5">Server load is normal (34%). Database latency improved by 12% since yesterday's update.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                            <div className="mt-1"><TrendingUp size={16} className="text-green-600" /></div>
                            <div>
                                <p className="text-sm text-green-900 font-medium">Sales Velocity</p>
                                <p className="text-xs text-green-700 mt-0.5">Q3 targets are 95% met. The "Enterprise" deal with Acme Corp is ready for signature.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="mt-1"><AlertCircle size={16} className="text-amber-600" /></div>
                            <div>
                                <p className="text-sm text-amber-900 font-medium">Attention Needed</p>
                                <p className="text-xs text-amber-700 mt-0.5">3 critical bugs reported in the Mobile App module. Engineering team is investigating.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-100 group">
                            <Calendar className="mb-2 text-gray-400 group-hover:text-blue-500" size={24} />
                            <span className="text-xs font-medium">Schedule</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-600 transition-colors border border-gray-100 group">
                            <CheckCircle2 className="mb-2 text-gray-400 group-hover:text-purple-500" size={24} />
                            <span className="text-xs font-medium">New Task</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-green-50 hover:text-green-600 transition-colors border border-gray-100 group">
                            <Users className="mb-2 text-gray-400 group-hover:text-green-500" size={24} />
                            <span className="text-xs font-medium">Team Huddle</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-gray-100 group">
                            <Shield className="mb-2 text-gray-400 group-hover:text-rose-500" size={24} />
                            <span className="text-xs font-medium">Vault Access</span>
                        </button>
                    </div>
                </div>

                {/* Team Availability */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Team Availability</h2>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">SJ</div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Sarah Jenkins</p>
                                    <p className="text-xs text-green-600">Online • Product</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><Users size={16} /></button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-xs">MR</div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Mike Ross</p>
                                    <p className="text-xs text-amber-600">In Meeting • 15m</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><Users size={16} /></button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">AL</div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Ada Lovelace</p>
                                    <p className="text-xs text-gray-500">Offline • Eng</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><Users size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pulse Grid & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Revenue"
                    value="$4.2M"
                    trend="+12.5%"
                    trendUp={true}
                    icon={<TrendingUp size={20} className="text-white" />}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <MetricCard
                    title="Active Users"
                    value="8,540"
                    trend="+5.2%"
                    trendUp={true}
                    icon={<Users size={20} className="text-white" />}
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <MetricCard
                    title="Pending Tasks"
                    value="142"
                    trend="-2.4%"
                    trendUp={true}
                    icon={<CheckCircle2 size={20} className="text-white" />}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <MetricCard
                    title="Avg. Response"
                    value="1.2h"
                    trend="+0.4%"
                    trendUp={false}
                    icon={<Clock size={20} className="text-white" />}
                    color="bg-gradient-to-br from-rose-500 to-rose-600"
                />
            </div>

            {/* Activity Heatmap (Mock) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Organization Pulse</h2>
                    <select className="text-sm border-gray-200 rounded-lg text-gray-500 bg-gray-50">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                    </select>
                </div>
                <div className="h-64 w-full bg-gray-50 rounded-xl flex items-end justify-between p-4 space-x-2">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end space-y-1 group relative">
                            <div
                                className="w-full bg-blue-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all duration-300"
                                style={{ height: `${Math.random() * 80 + 20}%` }}
                            ></div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {Math.floor(Math.random() * 100)} events
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:59</span>
                </div>
            </div>

            {/* Bottom Row: Strategic Initiatives & Dept Velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strategic Initiatives */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Strategic Initiatives</h2>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Project Titan (AI Integration)</span>
                                <span className="text-sm font-bold text-blue-600">75%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Global Expansion (EU)</span>
                                <span className="text-sm font-bold text-purple-600">40%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Sustainability Goals</span>
                                <span className="text-sm font-bold text-green-600">90%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Department Velocity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Department Velocity</h2>
                    <div className="space-y-4">
                        {[
                            { name: 'Engineering', val: 92, color: 'bg-indigo-500' },
                            { name: 'Marketing', val: 78, color: 'bg-pink-500' },
                            { name: 'Sales', val: 85, color: 'bg-emerald-500' },
                            { name: 'Support', val: 64, color: 'bg-amber-500' },
                        ].map(dept => (
                            <div key={dept.name} className="flex items-center">
                                <span className="w-24 text-sm text-gray-500 font-medium">{dept.name}</span>
                                <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden flex items-center px-2 relative group">
                                    <div
                                        className={`absolute left-0 top-0 bottom-0 opacity-20 ${dept.color}`}
                                        style={{ width: `${dept.val}%` }}
                                    ></div>
                                    <div
                                        className={`h-2 rounded-full ${dept.color}`}
                                        style={{ width: `${dept.val}%` }}
                                    ></div>
                                    <span className="ml-auto text-xs font-bold text-gray-700 relative z-10">{dept.val}/100</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
};

const MetricCard = ({ title, value, trend, trendUp, icon, color }: any) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${color}`}>
                {icon}
            </div>
            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {trendUp ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowUpRight size={12} className="mr-1 transform rotate-90" />}
                {trend}
            </div>
        </div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
);

export default OverviewPage;
