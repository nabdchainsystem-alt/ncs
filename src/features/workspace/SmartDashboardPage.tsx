import React from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Shield,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

const metricCards: MetricCard[] = [
  { title: 'Team Velocity', value: '82%', change: '+6% WoW', icon: Activity, color: 'from-indigo-500 to-purple-500' },
  { title: 'On-Time Delivery', value: '94%', change: '+3% QoQ', icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
  { title: 'Automation Coverage', value: '118 runs', change: '+12 today', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
];

const playbooks = [
  {
    title: 'AI Daily Brief',
    description: 'Auto-summarize overnight activity and surface blockers at 8AM.',
    icon: LayoutDashboard,
  },
  {
    title: 'Risk Guard',
    description: 'Flag slipping milestones and notify owners with recovery options.',
    icon: Shield,
  },
  {
    title: 'Next Best Action',
    description: 'Assign the next two tasks per owner based on effort and impact.',
    icon: Clock,
  },
];

const SmartDashboardPage: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50/50 p-6 overflow-y-auto h-full">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-800 text-white p-6 shadow-xl border border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-1 flex items-center space-x-2">
                <Sparkles size={14} className="text-amber-300" />
                <span>Smart Tools</span>
              </p>
              <h1 className="text-2xl font-bold tracking-tight mb-2">Smart Dashboard</h1>
              <p className="text-sm text-white/70 max-w-2xl">
                A focused command center that blends AI insights, live metrics, and one-click automations.
              </p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-black/20">
              <Sparkles size={14} />
              <span>Generate AI Brief</span>
            </button>
          </div>
          <div className="mt-4 flex items-center space-x-4 text-xs text-white/70">
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live sync</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield size={14} className="text-emerald-200" />
              <span>Data Guard enabled</span>
            </div>
            <div className="flex items-center space-x-2">
              <LayoutDashboard size={14} className="text-white/80" />
              <span>Last refresh: 2m ago</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {card.change}
                  </span>
                </div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gray-900 to-purple-700 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Flow</p>
                <h3 className="text-lg font-semibold text-gray-800">Execution snapshot</h3>
              </div>
              <button className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
                Open Timeline
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Critical milestones on track', value: '7 / 8', color: 'bg-emerald-500' },
                { label: 'Open blockers needing owners', value: '3', color: 'bg-amber-500' },
                { label: 'Pending approvals', value: '5', color: 'bg-blue-500' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                    <span className="text-sm font-medium text-gray-800">{row.label}</span>
                  </div>
                  <span className="text-sm text-gray-600 font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-2">Smart playbooks</p>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Autopilot queue</h3>
            <div className="space-y-3">
              {playbooks.map((play) => {
                const Icon = play.icon;
                return (
                  <div key={play.title} className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{play.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{play.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-600 font-semibold">
              <TrendingUp size={14} />
              <span>Automations saved ~3.2h today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartDashboardPage;
