
import React from 'react';
import { Task } from '../tasks/types';
import { Status, Priority, STATUS_COLORS, PRIORITY_COLORS } from '../../types/shared';
import { PieChart, BarChart3, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface RoomDashboardViewProps {
  tasks: Task[];
}

const RoomDashboardView: React.FC<RoomDashboardViewProps> = ({ tasks }) => {

  // --- Stats Calculation ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === Status.Complete).length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== Status.Complete).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // --- Chart Data Preparation ---

  // Status Counts for Bar Chart
  const statusCounts = Object.values(Status).map(status => ({
    label: status,
    count: tasks.filter(t => t.status === status).length,
    color: STATUS_COLORS[status]
  }));
  const maxCount = Math.max(...statusCounts.map(s => s.count), 1); // Avoid div by zero

  // Priority Counts for Pie Chart
  const priorityCounts = Object.values(Priority).filter(p => p !== Priority.None).map(priority => ({
    label: priority,
    count: tasks.filter(t => t.priority === priority).length,
    color: PRIORITY_COLORS[priority]
  }));
  const totalPrioritized = priorityCounts.reduce((acc, curr) => acc + curr.count, 0);

  // Calculate Conic Gradient for Pie Chart
  let currentDeg = 0;
  const gradientParts = priorityCounts.map(p => {
    const deg = totalPrioritized > 0 ? (p.count / totalPrioritized) * 360 : 0;
    const str = `${p.color} ${currentDeg}deg ${currentDeg + deg}deg`;
    currentDeg += deg;
    return str;
  });
  const pieGradient = totalPrioritized > 0
    ? `conic-gradient(${gradientParts.join(', ')})`
    : `conic-gradient(#e5e7eb 0deg 360deg)`; // Grey if empty

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8 custom-scrollbar animate-in fade-in duration-500">

      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Total Progress */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Completion Rate</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{completionRate}%</h3>
              <p className="text-xs text-gray-400 mt-1">{completedTasks} / {totalTasks} tasks completed</p>
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center relative">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-gray-100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="text-brand-primary transition-all duration-1000 ease-out"
                  strokeDasharray={`${completionRate}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
              <CheckCircle2 size={20} className="text-brand-primary absolute" />
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Overdue</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{overdueTasks}</h3>
              <p className="text-xs text-gray-400 mt-1">Tasks past due date</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
              <AlertCircle size={24} />
            </div>
          </div>

          {/* Est Time (Mock) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Tasks</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalTasks}</h3>
              <p className="text-xs text-gray-400 mt-1">Active in this room</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
              <Clock size={24} />
            </div>
          </div>

        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Status Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-brand-primary" />
                Workload by Status
              </h3>
            </div>

            <div className="space-y-4">
              {statusCounts.map(status => (
                <div key={status.label} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>{status.label}</span>
                    <span>{status.count}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(status.count / maxCount) * 100}%`, backgroundColor: status.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <PieChart size={18} className="text-brand-primary" />
                Tasks by Priority
              </h3>
            </div>

            <div className="flex items-center justify-center gap-8">
              {/* The Pie */}
              <div
                className="w-40 h-40 rounded-full shadow-inner relative"
                style={{ background: pieGradient }}
              >
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-gray-800">{totalPrioritized}</span>
                  <span className="text-[10px] text-gray-400 uppercase">Prioritized</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {priorityCounts.map(p => (
                  <div key={p.label} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                    <span className="text-gray-600 font-medium min-w-[60px]">{p.label}</span>
                    <span className="text-gray-400">({p.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RoomDashboardView;
