import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Bell, Activity, CheckSquare, Zap, Users, ArrowUpRight, ArrowDownRight, MoreHorizontal, Clock, AlertCircle, FileText, Plus, Search, Settings, Database, Calendar as CalendarIcon, Server, Shield, Wifi, MessageSquare } from 'lucide-react';

// --- Shared Components ---

const WidgetHeader = ({ title, icon: Icon, action }: { title: string, icon: any, action?: () => void }) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-gray-800">
            <div className="p-1.5 bg-gray-100 rounded-md">
                <Icon size={16} className="text-gray-900" />
            </div>
            <span className="font-bold text-sm tracking-tight">{title}</span>
        </div>
        {action && (
            <button onClick={action} className="text-gray-400 hover:text-gray-900 transition-colors">
                <MoreHorizontal size={16} />
            </button>
        )}
    </div>
);

// --- Welcome Hero & Quick Access ---

export const WelcomeHeroWidget = ({ userName = "User" }: { userName?: string }) => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    const actions = [
        { label: "New Task", icon: Plus },
        { label: "Search", icon: Search },
        { label: "Discussions", icon: MessageSquare },
        { label: "Reports", icon: FileText },
    ];

    return (
        <div className="h-full flex flex-col justify-between p-1">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{greeting}, {userName}</h1>
                <p className="text-gray-500 font-medium">Here's what's happening in your workspace today.</p>
            </div>

            <div className="flex items-center gap-3 mt-6">
                {actions.map((a, i) => (
                    <button key={i} className="flex items-center space-x-2 px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 group">
                        <a.icon size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                        <span className="text-sm font-bold">{a.label}</span>
                    </button>
                ))}
                <button className="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-500">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>
    );
};

// --- Premium KPI Widget ---

export const KPIWidget = ({ title, value, trend, isPositive, icon: Icon }: { title: string, value: string, trend: string, isPositive: boolean, icon: any }) => {
    return (
        <div className="h-full flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
                    <Icon size={18} className="text-gray-900" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-bold ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    <span>{trend}</span>
                </div>
            </div>

            <div className="z-10">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{title}</p>
            </div>

            {/* Decorative Background Chart */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
                <ReactECharts
                    option={{
                        xAxis: { show: false },
                        yAxis: { show: false },
                        series: [{
                            data: [10, 15, 8, 22, 18, 25, 20],
                            type: 'line',
                            smooth: true,
                            showSymbol: false,
                            lineStyle: { width: 4, color: '#000' },
                            areaStyle: { color: '#000' }
                        }]
                    }}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                />
            </div>
        </div>
    );
};

// --- Chart Widget ---

export const ChartWidget = () => {
    const option = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#9ca3af' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af' }
        },
        series: [
            {
                name: 'Sales',
                type: 'line',
                stack: 'Total',
                smooth: true,
                lineStyle: { width: 3, color: '#000' },
                showSymbol: false,
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(0,0,0,0.2)' }, { offset: 1, color: 'rgba(0,0,0,0)' }]
                    }
                },
                data: [120, 132, 101, 134, 90, 230, 210]
            },
            {
                name: 'Costs',
                type: 'line',
                stack: 'Total',
                smooth: true,
                lineStyle: { width: 3, color: '#9ca3af', type: 'dashed' },
                showSymbol: false,
                data: [220, 182, 191, 234, 290, 330, 310]
            }
        ]
    };

    return (
        <div className="h-full flex flex-col">
            <WidgetHeader title="Weekly Performance" icon={Activity} />
            <div className="flex-1 min-h-0">
                <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
            </div>
        </div>
    );
};

// --- Task List Widget (My Tasks) ---

export const TaskListWidget = () => {
    const tasks = [
        { id: 1, title: "Review Q3 Financials", tag: "Finance", due: "Today", priority: "high" },
        { id: 2, title: "Update Homepage Hero", tag: "Design", due: "Tomorrow", priority: "medium" },
        { id: 3, title: "Client Meeting Prep", tag: "Sales", due: "Nov 30", priority: "high" },
        { id: 4, title: "Fix API Latency", tag: "Dev", due: "Dec 01", priority: "low" },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-black rounded-md">
                        <CheckSquare size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-900">My Tasks</span>
                </div>
                <div className="flex items-center space-x-1">
                    <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Add Task">
                        <Plus size={16} />
                    </button>
                    <button className="text-xs font-bold text-gray-500 hover:text-black transition-colors px-2">View All</button>
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
                {tasks.map(task => (
                    <div key={task.id} className="group flex items-center p-3 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all cursor-pointer hover:shadow-sm">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 transition-colors ${task.priority === 'high' ? 'border-red-400 hover:bg-red-400' : 'border-gray-300 hover:bg-gray-900'}`}></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-black">{task.title}</p>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[10px] font-medium text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-100">{task.tag}</span>
                                <span className="text-[10px] text-gray-400 flex items-center">
                                    <Clock size={10} className="mr-1" /> {task.due}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Reminders Widget ---

export const RemindersWidget = () => {
    const reminders = [
        { id: 1, text: "Review Q4 Procurement Plan", time: "10:00 AM", urgent: true },
        { id: 2, text: "Approve Pending POs", time: "11:30 AM", urgent: false },
        { id: 3, text: "Team Sync with Logistics", time: "2:00 PM", urgent: false },
        { id: 4, text: "Update Vendor Contracts", time: "4:00 PM", urgent: false },
    ];

    return (
        <div className="h-full flex flex-col">
            <WidgetHeader title="Reminders" icon={Bell} />
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
                {reminders.map(item => (
                    <div key={item.id} className="group flex items-center p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white">
                        <div className={`w-1.5 h-1.5 rounded-full mr-3 ${item.urgent ? 'bg-black animate-pulse' : 'bg-gray-300'}`}></div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${item.urgent ? 'text-gray-900' : 'text-gray-600'}`}>{item.text}</p>
                            <p className="text-xs text-gray-400 flex items-center mt-0.5">
                                <Clock size={10} className="mr-1" />
                                {item.time}
                            </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:bg-gray-100 rounded">
                                <CheckSquare size={14} className="text-gray-400 hover:text-gray-900" />
                            </button>
                        </div>
                    </div>
                ))}
                <button className="w-full py-2 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors mt-2">
                    + Add Reminder
                </button>
            </div>
        </div>
    );
};

// --- Mini Calendar Widget ---

export const MiniCalendarWidget = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const currentDay = new Date().getDate();

    return (
        <div className="h-full flex flex-col">
            <WidgetHeader title="November 2025" icon={CalendarIcon} />
            <div className="flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {days.map(d => <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                        <div key={d} className={`text-xs p-1 rounded-full ${d === currentDay ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                            {d}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Project Status Widget ---

export const ProjectListWidget = () => {
    const projects = [
        { name: "Website Redesign", progress: 75, status: "On Track" },
        { name: "Mobile App Q4", progress: 30, status: "At Risk" },
        { name: "Database Migration", progress: 90, status: "On Track" },
        { name: "Marketing Campaign", progress: 15, status: "Delayed" },
    ];

    return (
        <div className="h-full flex flex-col">
            <WidgetHeader title="Active Projects" icon={FileText} />
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
                {projects.map((p, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="font-medium text-gray-700">{p.name}</span>
                            <span className={`font-bold ${p.status === 'On Track' ? 'text-green-600' : p.status === 'At Risk' ? 'text-amber-500' : 'text-red-500'}`}>{p.status}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-gray-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Storage Widget ---

export const StorageWidget = () => {
    return (
        <div className="h-full flex flex-col">
            <WidgetHeader title="Storage" icon={Database} />
            <div className="flex-1 flex items-center justify-center relative">
                <ReactECharts
                    option={{
                        series: [
                            {
                                type: 'pie',
                                radius: ['60%', '80%'],
                                avoidLabelOverlap: false,
                                label: { show: false, position: 'center' },
                                emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold' } },
                                labelLine: { show: false },
                                data: [
                                    { value: 735, name: 'Used', itemStyle: { color: '#1f2937' } },
                                    { value: 265, name: 'Free', itemStyle: { color: '#f3f4f6' } }
                                ]
                            }
                        ]
                    }}
                    style={{ height: '100px', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-lg font-bold text-gray-900">75%</span>
                        <p className="text-[10px] text-gray-400">Used</p>
                    </div>
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
                150GB / 200GB
            </div>
        </div>
    );
};

// --- Live Actions Widget ---

export const LiveActionsWidget = () => {
    const actions = [
        { id: 1, user: "Sarah M.", action: "created a new PO", target: "PO-2024-001", time: "2m ago" },
        { id: 2, user: "System", action: "alerted low stock", target: "Item #4421", time: "15m ago" },
        { id: 3, user: "Mike R.", action: "commented on", target: "Logistics Report", time: "1h ago" },
        { id: 4, user: "Anna K.", action: "approved", target: "Vendor Application", time: "2h ago" },
    ];

    return (
        <div className="h-full flex flex-col">
            <WidgetHeader title="Live Actions" icon={Zap} />
            <div className="flex-1 overflow-y-auto scrollbar-hide relative">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-100"></div>
                <div className="space-y-4 pl-0">
                    {actions.map((action, i) => (
                        <div key={action.id} className="relative flex items-start pl-6 group">
                            <div className="absolute left-[7px] top-1.5 w-2 h-2 rounded-full bg-white border-2 border-gray-200 group-hover:border-black transition-colors z-10"></div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 leading-snug">
                                    <span className="font-bold text-gray-900">{action.user}</span> {action.action} <span className="font-medium text-gray-800 underline decoration-gray-200 underline-offset-2">{action.target}</span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">{action.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Online Team Tasks Widget ---

export const TeamTasksWidget = () => {
    const team = [
        { id: 1, name: "Max", status: "online", task: "Fixing login bug", avatar: "M" },
        { id: 2, name: "Sarah", status: "busy", task: "Designing dashboard", avatar: "S" },
        { id: 3, name: "James", status: "offline", task: "Deployment scripts", avatar: "J" },
        { id: 4, name: "Emily", status: "online", task: "Client meeting", avatar: "E" },
    ];

    return (
        <div className="h-full flex flex-col">
            <WidgetHeader title="Team Status" icon={Users} />
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
                {team.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                                    {member.avatar}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${member.status === 'online' ? 'bg-green-500' :
                                    member.status === 'busy' ? 'bg-red-500' : 'bg-gray-300'
                                    }`}></div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.task}</p>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                            {member.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- System Status Footer ---

export const SystemStatusFooter = () => {
    return (
        <div className="h-full flex items-center justify-between px-6 bg-gray-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>

            <div className="flex items-center space-x-6 z-10">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <Activity size={20} className="text-green-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Health</p>
                        <p className="text-sm font-bold text-white flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                            100% Operational
                        </p>
                    </div>
                </div>

                <div className="h-8 w-px bg-white/10"></div>

                <div className="flex items-center space-x-4 text-xs font-medium text-gray-400">
                    <div className="flex items-center space-x-2">
                        <Wifi size={14} /> <span>12ms Latency</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Database size={14} /> <span>DB Synced</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Shield size={14} /> <span>Secure</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4 z-10">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold">
                            U{i}
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-400">
                        +4
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-white">Team Online</p>
                    <p className="text-[10px] text-gray-400">Active in last 15m</p>
                </div>
            </div>
        </div>
    );
};

// --- Full Calendar Widget ---

export const FullCalendarWidget = () => {
    const [view, setView] = React.useState<'4day' | 'week' | 'month'>('week');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <CalendarIcon size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
                        <p className="text-sm text-gray-500">November 2025</p>
                    </div>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['4day', 'week', 'month'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {v === '4day' ? '4 Days' : v === 'week' ? 'Week' : 'Month'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
                {/* Calendar Header */}
                <div className="grid grid-cols-8 border-b border-gray-100 bg-gray-50/50">
                    <div className="p-4 border-r border-gray-100"></div>
                    {days.map((day, i) => (
                        <div key={day} className="p-4 text-center border-r border-gray-100 last:border-r-0">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</span>
                            <div className={`mt-1 text-lg font-bold ${i === 1 ? 'text-indigo-600' : 'text-gray-900'}`}>{24 + i}</div>
                        </div>
                    ))}
                </div>

                {/* Calendar Body */}
                <div className="flex-1 overflow-y-auto scrollbar-hide bg-white relative">
                    {hours.map((hour) => (
                        <div key={hour} className="grid grid-cols-8 h-20 border-b border-gray-50 group hover:bg-gray-50/30 transition-colors">
                            <div className="p-2 text-xs font-medium text-gray-400 text-right pr-4 border-r border-gray-100 -mt-2.5">
                                {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                            </div>
                            {days.map((_, i) => (
                                <div key={i} className="border-r border-gray-50 last:border-r-0 relative">
                                    {/* Mock Events */}
                                    {i === 1 && hour === 10 && (
                                        <div className="absolute top-2 left-1 right-1 bottom-2 bg-indigo-50 border-l-4 border-indigo-500 rounded p-2 cursor-pointer hover:shadow-md transition-shadow">
                                            <p className="text-xs font-bold text-indigo-900">Strategy Meeting</p>
                                            <p className="text-[10px] text-indigo-600">10:00 - 11:00 AM</p>
                                        </div>
                                    )}
                                    {i === 3 && hour === 14 && (
                                        <div className="absolute top-2 left-1 right-1 bottom-[-40px] bg-emerald-50 border-l-4 border-emerald-500 rounded p-2 z-10 cursor-pointer hover:shadow-md transition-shadow">
                                            <p className="text-xs font-bold text-emerald-900">Project Review</p>
                                            <p className="text-[10px] text-emerald-600">2:00 - 3:30 PM</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                    {/* Current Time Line */}
                    <div className="absolute left-0 right-0 top-[140px] h-px bg-red-500 z-20 pointer-events-none">
                        <div className="absolute left-0 -top-1.5 w-2 h-2 rounded-full bg-red-500"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
