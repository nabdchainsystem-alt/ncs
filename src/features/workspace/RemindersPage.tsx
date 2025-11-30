import React from 'react';
import { Bell, AlarmClock, Clock3 } from 'lucide-react';

const RemindersPage: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50/50 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto animate-in fade-in duration-300 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1 flex items-center space-x-2">
              <AlarmClock size={14} className="text-clickup-purple" />
              <span>Reminders</span>
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Stay on top of follow-ups</h1>
            <p className="text-sm text-gray-500 mt-1">Schedule nudges, due date pings, and recurring reminders.</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-clickup-purple flex items-center justify-center shadow-inner">
            <Bell size={22} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Today', value: '3', accent: 'text-emerald-600', pill: 'bg-emerald-50' },
            { label: 'Upcoming', value: '7', accent: 'text-blue-600', pill: 'bg-blue-50' },
            { label: 'Overdue', value: '1', accent: 'text-amber-600', pill: 'bg-amber-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.accent}`}>{stat.value}</p>
              <span className={`inline-flex text-[11px] mt-2 px-2 py-0.5 rounded-full font-semibold ${stat.pill} text-gray-700`}>
                {stat.label === 'Overdue' ? 'Needs attention' : 'Scheduled'}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Next nudges</p>
              <h3 className="text-lg font-semibold text-gray-800">Quick preview</h3>
            </div>
            <button className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
              New reminder
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { title: 'Ping design review thread', time: '11:30 AM', tag: 'Team' },
              { title: 'Follow up with vendor on SLA', time: '2:00 PM', tag: 'Ops' },
              { title: 'Daily summary to leadership', time: '5:15 PM', tag: 'Exec' },
            ].map((item) => (
              <div key={item.title} className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-md transition-colors">
                <div className="flex items-center space-x-2">
                  <Clock3 size={14} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{item.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemindersPage;
