import React, { useState, useMemo } from 'react';
import { DashboardShell } from './components/DashboardShell';
import {
    Activity, Calendar, CheckCircle2, Clock, Zap, ArrowUpRight, Users,
    TrendingUp, Shield, MoreHorizontal, Search, Bell, Command,
    MessageSquare, FileText, PieChart, BarChart3, Target, Sparkles
} from 'lucide-react';

// --- Mock Data ---
const ACTIVITY_DATA = [
    { title: 'New Enterprise Deal', time: '2m ago', desc: 'Acme Corp signed the $50k contract', icon: <FileText size={16} />, color: 'bg-blue-100 text-blue-600' },
    { title: 'System Update', time: '1h ago', desc: 'v2.4.0 deployed successfully', icon: <CheckCircle2 size={16} />, color: 'bg-green-100 text-green-600' },
    { title: 'New Team Member', time: '3h ago', desc: 'Sarah joined the Design team', icon: <Users size={16} />, color: 'bg-purple-100 text-purple-600' },
];

const PROJECT_DATA = [
    { name: 'Website Redesign', progress: 75, color: 'bg-blue-500' },
    { name: 'Mobile App v2', progress: 45, color: 'bg-purple-500' },
    { name: 'Marketing Campaign', progress: 90, color: 'bg-green-500' },
    { name: 'Q4 Planning', progress: 20, color: 'bg-amber-500' },
];

const TEAM_DATA = [
    { name: 'Sarah J.', status: 'online', role: 'Product' },
    { name: 'Mike R.', status: 'busy', role: 'Sales' },
    { name: 'Ada L.', status: 'offline', role: 'Eng' },
    { name: 'Tom H.', status: 'online', role: 'Design' },
];

const OverviewPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    // --- Filtering Logic ---
    const filteredActivity = useMemo(() => {
        if (!searchQuery) return ACTIVITY_DATA;
        const lowerQuery = searchQuery.toLowerCase();
        return ACTIVITY_DATA.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.desc.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery]);

    const filteredProjects = useMemo(() => {
        if (!searchQuery) return PROJECT_DATA;
        const lowerQuery = searchQuery.toLowerCase();
        return PROJECT_DATA.filter(item =>
            item.name.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery]);

    const filteredTeam = useMemo(() => {
        if (!searchQuery) return TEAM_DATA;
        const lowerQuery = searchQuery.toLowerCase();
        return TEAM_DATA.filter(item =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.role.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery]);


    return (
        <DashboardShell
            title="Overview"
            subtitle=""
            headerActions={
                <div className="flex items-center space-x-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all w-64 shadow-sm"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">⌘</span>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">K</span>
                        </div>
                    </div>
                    <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-all shadow-lg shadow-gray-900/20 flex items-center">
                        <Sparkles size={16} className="mr-2 text-yellow-400" />
                        Generate Report
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-blue-200 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                                    System Operational
                                </span>
                                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-purple-200">
                                    v2.4.0
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2">
                                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Max</span>
                            </h1>
                            <p className="text-gray-400 max-w-xl text-lg">
                                You have <span className="text-white font-semibold">12 pending tasks</span> and <span className="text-white font-semibold">3 meetings</span> scheduled for today.
                                Your team's velocity is up <span className="text-green-400 font-semibold">14%</span> this week.
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <div className="text-center px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Revenue</p>
                                <p className="text-2xl font-bold text-white mt-1">$4.2M</p>
                            </div>
                            <div className="text-center px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Users</p>
                                <p className="text-2xl font-bold text-white mt-1">8.5k</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                    {/* Main Content Column (Left) */}
                    <div className="md:col-span-2 lg:col-span-3 space-y-6">

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <BentoCard
                                title="Total Sales"
                                value="$124,500"
                                trend="+12%"
                                icon={<BarChart3 className="text-blue-500" />}
                                color="blue"
                            />
                            <BentoCard
                                title="Active Projects"
                                value="24"
                                trend="+4"
                                icon={<Target className="text-purple-500" />}
                                color="purple"
                            />
                            <BentoCard
                                title="Team Efficiency"
                                value="94%"
                                trend="+2.4%"
                                icon={<Zap className="text-amber-500" />}
                                color="amber"
                            />
                        </div>

                        {/* Charts & Activity Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Activity Feed */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900 flex items-center">
                                        <Activity size={20} className="mr-2 text-gray-400" />
                                        Live Activity
                                    </h3>
                                    <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                        <MoreHorizontal size={20} className="text-gray-400" />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {filteredActivity.length > 0 ? (
                                        filteredActivity.map((item, i) => (
                                            <div key={i} className="flex items-start space-x-4 group">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.color} group-hover:scale-110 transition-transform`}>
                                                    {item.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                                                        <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 text-sm text-center py-4">No matching activity found.</p>
                                    )}
                                </div>
                                <button className="w-full mt-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-dashed border-gray-200">
                                    View All Activity
                                </button>
                            </div>

                            {/* Project Status */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900 flex items-center">
                                        <PieChart size={20} className="mr-2 text-gray-400" />
                                        Project Status
                                    </h3>
                                    <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                        <MoreHorizontal size={20} className="text-gray-400" />
                                    </button>
                                </div>
                                <div className="space-y-5">
                                    {filteredProjects.length > 0 ? (
                                        filteredProjects.map((project, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700">{project.name}</span>
                                                    <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${project.color} transition-all duration-1000 ease-out`}
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 text-sm text-center py-4">No matching projects found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Column (Right) */}
                    <div className="space-y-6">
                        {/* Quick Actions Grid */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg">
                            <h3 className="font-bold mb-4 flex items-center">
                                <Command size={18} className="mr-2 text-gray-400" />
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <QuickActionButton icon={<Calendar size={20} />} label="Schedule" />
                                <QuickActionButton icon={<CheckCircle2 size={20} />} label="New Task" />
                                <QuickActionButton icon={<MessageSquare size={20} />} label="Message" />
                                <QuickActionButton icon={<Shield size={20} />} label="Vault" />
                            </div>
                        </div>

                        {/* Team Pulse */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                <Users size={18} className="mr-2 text-gray-400" />
                                Team Pulse
                            </h3>
                            <div className="space-y-4">
                                {filteredTeam.length > 0 ? (
                                    filteredTeam.map((member, i) => (
                                        <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                        {member.name.charAt(0)}{member.name.split(' ')[1]?.charAt(0)}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${member.status === 'online' ? 'bg-green-500' :
                                                        member.status === 'busy' ? 'bg-amber-500' : 'bg-gray-400'
                                                        }`}></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{member.name}</p>
                                                    <p className="text-xs text-gray-500">{member.role}</p>
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 transition-all">
                                                <MessageSquare size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-sm text-center py-4">No matching team members.</p>
                                )}
                            </div>
                        </div>

                        {/* Mini Calendar / Upcoming */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                <Clock size={18} className="mr-2 text-gray-400" />
                                Upcoming
                            </h3>
                            <div className="space-y-4">
                                <div className="flex space-x-3 pb-4 border-b border-gray-100">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 rounded-xl text-blue-600">
                                        <span className="text-xs font-bold">DEC</span>
                                        <span className="text-lg font-bold">02</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Product Review</p>
                                        <p className="text-xs text-gray-500">10:00 AM • Room A</p>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-purple-50 rounded-xl text-purple-600">
                                        <span className="text-xs font-bold">DEC</span>
                                        <span className="text-lg font-bold">02</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Team Lunch</p>
                                        <p className="text-xs text-gray-500">12:30 PM • Kitchen</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
};

const BentoCard = ({ title, value, trend, icon, color }: any) => {
    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
        purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
        amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp size={12} className="mr-1" />
                    {trend}
                </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
    );
};

const QuickActionButton = ({ icon, label }: any) => (
    <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors border border-white/5 backdrop-blur-sm group">
        <div className="mb-2 text-gray-300 group-hover:text-white transition-colors group-hover:scale-110 transform duration-200">
            {icon}
        </div>
        <span className="text-xs font-medium text-gray-300 group-hover:text-white">{label}</span>
    </button>
);

export default OverviewPage;
