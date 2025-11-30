import React from 'react';
import { ListChecks, BarChart3, CheckCircle2, Timer } from 'lucide-react';

const TasksHubPage: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50/50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1 flex items-center space-x-2">
              <ListChecks size={14} className="text-clickup-purple" />
              <span>Tasks</span>
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Task Hub</h1>
            <p className="text-sm text-gray-500 mt-1">A focused slice of your workspace tasks with quick stats.</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
            <BarChart3 size={22} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Open tasks', value: '42', accent: 'text-blue-600', pill: 'bg-blue-50' },
            { label: 'Completed this week', value: '18', accent: 'text-emerald-600', pill: 'bg-emerald-50' },
            { label: 'Average cycle time', value: '2.4d', accent: 'text-amber-600', pill: 'bg-amber-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.accent}`}>{stat.value}</p>
              <span className={`inline-flex text-[11px] mt-2 px-2 py-0.5 rounded-full font-semibold ${stat.pill} text-gray-700`}>
                Snapshot
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Highlights</p>
              <h3 className="text-lg font-semibold text-gray-800">Quick view</h3>
            </div>
            <button className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
              Open tasks view
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'Ready for review', value: '9', icon: CheckCircle2, color: 'bg-purple-50 text-purple-600' },
              { title: 'Due today', value: '4', icon: Timer, color: 'bg-amber-50 text-amber-600' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">Managed by automation</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksHubPage;
