import React, { useState, useEffect } from 'react';
import {
    Users, CheckCircle2, Clock, MoreHorizontal, Plus, Calendar, ArrowRight,
    LayoutGrid, Star, Settings, BarChart2, Search, Filter, Bell, Shield,
    Zap, Activity, TrendingUp, AlertCircle, Truck, Briefcase, LifeBuoy
} from 'lucide-react';
import { useToast } from '../../ui/Toast';
import { Team, User } from '../../types/shared';
import { Task } from '../tasks/types';
import { teamService } from './teamService';
import { taskService } from '../tasks/taskService';
import { authService } from '../../services/auth';

import { CreateTeamModal } from './CreateTeamModal';

export const TeamPage: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { showToast } = useToast();
    // const API_URL = getApiUrl(); // Removed unused API_URL

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setLoading(true);
            const [teamsData, tasksData, usersData] = await Promise.all([
                teamService.getTeams(),
                taskService.getTasks(), // This now fetches from Supabase
                authService.getUsers()  // This now fetches from Supabase
            ]);

            setTeams(teamsData);
            setTasks(tasksData);
            setUsers(usersData);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
            showToast('Failed to load teams', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getTeamTasks = (teamId: string) => {
        return tasks.filter(task => task.assignees.some(u => u.id === teamId));
    };

    const getUser = (userId: string) => {
        return users.find(u => u.id === userId);
    };

    // Calculate Global Stats
    const totalMembers = new Set(teams.flatMap(t => t.members)).size;
    const totalActiveTasks = tasks.filter(t => t.status !== 'Complete').length;
    const avgCompletion = teams.length > 0
        ? teams.reduce((acc, team) => {
            const tTasks = getTeamTasks(team.id);
            const completed = tTasks.filter(t => t.status === 'Complete').length;
            return acc + (tTasks.length > 0 ? (completed / tTasks.length) * 100 : 0);
        }, 0) / teams.length
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-white text-gray-900 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-[260px] bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-4 pb-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 focus:border-black focus:ring-0 rounded-xl text-sm transition-all placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar mt-2">
                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeTab === 'all' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutGrid size={18} className={activeTab === 'all' ? 'text-white' : 'text-gray-400'} />
                                <span>All Teams</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>{teams.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${activeTab === 'my' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Star size={18} className={activeTab === 'my' ? 'text-white' : 'text-gray-400'} />
                                <span>My Teams</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'my' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
                        </button>
                    </div>

                    <div>
                        <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Departments</h3>
                        <div className="space-y-4">
                            {/* Supply Chain */}
                            <div>
                                <div className="px-3 py-1 text-xs font-semibold text-gray-500 flex items-center gap-2 mb-1">
                                    <Truck size={14} />
                                    Supply Chain
                                </div>
                                <div className="space-y-0.5">
                                    {['Procurement', 'Warehouse', 'Shipping', 'Planning'].map(dept => (
                                        <button key={dept} className="w-full flex items-center px-3 py-1.5 rounded-lg text-[14px] font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Operations */}
                            <div>
                                <div className="px-3 py-1 text-xs font-semibold text-gray-500 flex items-center gap-2 mb-1">
                                    <Settings size={14} />
                                    Operations
                                </div>
                                <div className="space-y-0.5">
                                    {['Maintenance', 'Production', 'Quality'].map(dept => (
                                        <button key={dept} className="w-full flex items-center px-3 py-1.5 rounded-lg text-[14px] font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Business */}
                            <div>
                                <div className="px-3 py-1 text-xs font-semibold text-gray-500 flex items-center gap-2 mb-1">
                                    <Briefcase size={14} />
                                    Business
                                </div>
                                <div className="space-y-0.5">
                                    {['Sales', 'Finance', 'Marketing'].map(dept => (
                                        <button key={dept} className="w-full flex items-center px-3 py-1.5 rounded-lg text-[14px] font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button className="w-full bg-black hover:bg-gray-800 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2">
                        <Plus size={18} />
                        <span>Create Team</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative z-10 shadow-2xl rounded-l-3xl overflow-hidden ml-[-1px] border-l border-gray-200">
                {/* Header */}
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Teams</h1>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{teams.length}</span>
                            <span>active squads</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button className="p-1.5 text-black bg-white shadow-sm rounded-md transition-all">
                                <LayoutGrid size={18} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-all">
                                <Users size={18} />
                            </button>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Filter size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Team Health Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-gray-100 rounded-xl">
                                    <TrendingUp className="text-black" size={24} />
                                </div>
                                <span className="flex items-center text-black text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">+12% vs last month</span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">{Math.round(avgCompletion)}%</h3>
                            <p className="text-gray-500 text-sm font-medium">Average Task Completion</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-gray-100 rounded-xl">
                                    <Zap className="text-black" size={24} />
                                </div>
                                <span className="flex items-center text-black text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">High Velocity</span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalActiveTasks}</h3>
                            <p className="text-gray-500 text-sm font-medium">Active Tasks Across Teams</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-gray-100 rounded-xl">
                                    <Shield className="text-black" size={24} />
                                </div>
                                <span className="flex items-center text-black text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">All Systems Operational</span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">{teams.length}</h3>
                            <p className="text-gray-500 text-sm font-medium">Active Squads Deployed</p>
                        </div>
                    </div>

                    {/* Teams Table */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Featured Squads</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Performance and status overview</p>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-lg transition-colors">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-5 px-8 text-xs font-bold text-gray-400 uppercase tracking-wider w-[30%]">Lead</th>
                                        <th className="text-left py-5 px-8 text-xs font-bold text-gray-400 uppercase tracking-wider w-[40%]">Campaign</th>
                                        <th className="text-right py-5 px-8 text-xs font-bold text-gray-400 uppercase tracking-wider w-[30%]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {teams.map(team => {
                                        const teamTasks = getTeamTasks(team.id);
                                        const completedTasks = teamTasks.filter(t => t.status === 'Complete').length;
                                        const progress = teamTasks.length > 0 ? (completedTasks / teamTasks.length) * 100 : 0;

                                        // Determine status based on progress
                                        let status = 'Pending';
                                        let statusColor = 'bg-gray-100 text-gray-600 border-gray-200';
                                        let statusIcon = <Clock size={12} className="mr-1.5" />;

                                        if (progress >= 80) {
                                            status = 'Success';
                                            statusColor = 'bg-black text-white border-black';
                                            statusIcon = <CheckCircle2 size={12} className="mr-1.5" />;
                                        } else if (progress === 0 && teamTasks.length === 0) {
                                            status = 'Inactive';
                                            statusColor = 'bg-white text-gray-400 border-gray-200 border';
                                            statusIcon = <MoreHorizontal size={12} className="mr-1.5" />;
                                        } else if (progress < 30) {
                                            status = 'At Risk';
                                            statusColor = 'bg-white text-black border-black border';
                                            statusIcon = <AlertCircle size={12} className="mr-1.5" />;
                                        }

                                        // Get Team Lead (first member)
                                        const leadId = team.members[0];
                                        const lead = getUser(leadId);

                                        return (
                                            <tr key={team.id} className="group hover:bg-gray-50 transition-colors cursor-pointer">
                                                {/* Creator Column */}
                                                <td className="py-5 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm group-hover:border-gray-300 transition-colors">
                                                                {lead?.avatarUrl ? (
                                                                    <img src={lead.avatarUrl} alt={lead.name} className="w-full h-full object-cover grayscale" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400 bg-gray-100">
                                                                        {lead?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-black border-2 border-white rounded-full"></div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm mb-0.5">{lead?.name || 'Unknown Lead'}</div>
                                                            <div className="text-xs text-gray-500 font-medium">Team Lead</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Campaign Column */}
                                                <td className="py-5 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 transition-transform group-hover:scale-105 bg-black"
                                                        >
                                                            <span className="font-bold text-lg">{team.name.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm mb-0.5">{team.name}</div>
                                                            <div className="text-xs text-gray-500 font-medium flex items-center">
                                                                <Users size={12} className="mr-1" />
                                                                {team.members.length} Members
                                                                <span className="mx-1.5 text-gray-300">•</span>
                                                                <CheckCircle2 size={12} className="mr-1" />
                                                                {teamTasks.length} Tasks
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status Column */}
                                                <td className="py-5 px-8 text-right">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                                                        {statusIcon}
                                                        {status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
