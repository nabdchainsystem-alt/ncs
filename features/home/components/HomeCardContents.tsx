import React from 'react';
import { LayoutGrid, Plus, Sparkles, History, Calendar, ListTodo, ClipboardList, MessageSquare, ListOrdered, Clock, MapPin, Video } from 'lucide-react';
import { MOCK_TASKS } from '../../../constants';

export const RecentsContent = () => (
    <div className="space-y-2 text-sm">
        {['Q4 Strategy Doc', 'Backend Sprint List', 'Design System Board', 'Marketing Campaign', 'User Research 2024', 'Deployment Scripts'].map((item, i) => (
            <div key={i} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group border border-transparent hover:border-gray-100">
                <div className="w-8 h-8 bg-blue-50/50 rounded-md text-blue-500 flex items-center justify-center text-[10px] font-bold border border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200 transition-all">
                    {item[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-700 font-medium truncate group-hover:text-brand-primary transition-colors">{item}</p>
                    <p className="text-xs text-gray-400">Accessed {i + 1} hour{i !== 0 ? 's' : ''} ago</p>
                </div>
            </div>
        ))}
    </div>
);

export const LineUpContent = () => (
    <div className="space-y-3">
        {MOCK_TASKS.filter(t => t.priority === 'Urgent' || t.priority === 'High').slice(0, 5).map((task, i) => (
            <div key={task.id} className="flex items-start space-x-3 group cursor-pointer">
                <div className="mt-1 text-xs font-bold text-gray-300 w-4 text-right">{i + 1}</div>
                <div className="flex-1 bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-100">
                            {task.priority}
                        </span>
                        <span className="text-[10px] text-gray-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-tight group-hover:text-brand-primary transition-colors">{task.title}</p>
                </div>
            </div>
        ))}
        <button className="w-full py-2.5 text-xs font-medium text-gray-400 border border-dashed border-gray-200 rounded-lg hover:bg-gray-50 hover:text-brand-primary hover:border-brand-primary/30 transition-colors flex items-center justify-center space-x-1">
            <Plus size={12} />
            <span>Add Task to LineUp</span>
        </button>
    </div>
);

export const StandupContent = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center shadow-inner border border-white">
            <Sparkles className="text-brand-primary" size={28} />
        </div>
        <div>
            <h3 className="font-bold text-gray-800">Daily Standup</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">Brain analyzes your activity to generate a smart status report.</p>
        </div>
        <button className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95">
            Generate with AI
        </button>
    </div>
);

export const AgendaContent = () => {
    const nowPercent = 45;

    const events = [
        { time: '09:30', end: '10:00', title: 'Daily Standup', type: 'meeting', color: 'bg-blue-50 border-blue-100 text-blue-700', icon: Video },
        { time: '11:00', end: '12:30', title: 'Design Review: Mobile App', type: 'work', color: 'bg-purple-50 border-purple-100 text-purple-700', icon: MapPin },
        { time: '14:00', end: '15:00', title: 'Customer Sync', type: 'meeting', color: 'bg-green-50 border-green-100 text-green-700', icon: Video },
        { time: '16:30', end: '17:00', title: 'Wrap up & Planning', type: 'task', color: 'bg-gray-50 border-gray-100 text-gray-600', icon: ListTodo },
    ];

    return (
        <div className="relative h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today, Oct 24</h4>
                <button className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 transition-colors">Sync Calendar</button>
            </div>

            <div className="flex-1 relative overflow-y-auto scrollbar-hide pl-2 pr-2 space-y-4">
                {/* Time Line */}
                <div className="absolute left-[48px] top-0 bottom-0 w-[1px] bg-gray-200 z-0"></div>

                {/* Current Time Indicator */}
                <div className="absolute left-[42px] w-full flex items-center z-10" style={{ top: `${nowPercent}%` }}>
                    <div className="w-3 h-3 bg-brand-urgent rounded-full border-2 border-white shadow-sm"></div>
                    <div className="flex-1 h-[1px] bg-brand-urgent ml-1 opacity-50"></div>
                    <span className="text-[10px] text-brand-urgent font-bold bg-white px-1 ml-auto mr-2 shadow-sm rounded border border-red-100">12:45 PM</span>
                </div>

                {events.map((ev, i) => (
                    <div key={i} className="relative flex z-20 group">
                        <div className="w-12 text-[10px] text-gray-400 text-right pr-3 pt-1 font-mono">
                            <div>{ev.time}</div>
                            <div className="text-gray-300">{ev.end}</div>
                        </div>
                        <div className={`flex-1 p-3 rounded-lg border ${ev.color} shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden hover:-translate-y-0.5`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${ev.color.replace('bg-', 'bg-opacity-100 bg-').split(' ')[0].replace('50', '500')}`}></div>
                            <div className="flex justify-between items-start">
                                <div className="font-semibold text-sm mb-1">{ev.title}</div>
                                <ev.icon size={14} className="opacity-70" />
                            </div>
                            <div className="text-xs opacity-80">Zoom • 3 participants</div>
                        </div>
                    </div>
                ))}

                {/* Empty Slot */}
                <div className="relative flex z-20 opacity-50 hover:opacity-100 transition-opacity cursor-pointer group">
                    <div className="w-12 text-[10px] text-gray-300 text-right pr-3 pt-2">13:00</div>
                    <div className="flex-1 p-3 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 group-hover:bg-gray-50 h-16 transition-colors">
                        + Schedule block
                    </div>
                </div>
            </div>
        </div>
    );
}

export const DefaultContent = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-3">
        <div className="p-4 rounded-full bg-gray-50 border border-gray-100">
            <LayoutGrid size={24} className="opacity-30 text-gray-400" />
        </div>
        <span className="text-sm font-medium text-gray-400">No items in {title}</span>
        <button className="text-xs text-brand-primary font-semibold hover:underline">Connect Source</button>
    </div>
);
