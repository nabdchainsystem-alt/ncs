import React, { useState, useEffect } from 'react';
import {
    Users, CheckCircle2, Clock, MoreHorizontal, Plus, Calendar, ArrowRight,
    LayoutGrid, Star, Settings, BarChart2, Search, Filter, Bell, Shield,
    Zap, Activity, TrendingUp, AlertCircle, Truck, Briefcase, LifeBuoy,
    ShoppingCart, Warehouse, Ship, Store, Database, Car
} from 'lucide-react';
import { useToast } from '../../ui/Toast';
import { getApiUrl } from '../../utils/config';
import { Team, User } from '../../types/shared';
import { Task } from '../tasks/types';

export const TeamPage: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const { showToast } = useToast();
    const API_URL = getApiUrl();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsRes, tasksRes, usersRes] = await Promise.all([
                fetch(`${API_URL}/teams`),
                fetch(`${API_URL}/tasks`),
                fetch(`${API_URL}/users`)
            ]);

            const teamsData = await teamsRes.json();
            const tasksData = await tasksRes.json();
            const usersData = await usersRes.json();

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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-white text-gray-900 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <Users className="text-brand-primary" size={18} />
                        <span>Teams</span>
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto px-3 space-y-4 custom-scrollbar">
                    <div className="space-y-0.5">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'all' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            <div className="flex items-center gap-2">
                                <LayoutGrid size={14} />
                                <span>All Teams</span>
                            </div>
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{teams.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'my' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Star size={14} />
                                <span>My Teams</span>
                            </div>
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">2</span>
                        </button>
                    </div>

                    <div>
                        <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Departments</h3>
                        <div className="space-y-0.5">
                            {/* Supply Chain */}
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-800 flex items-center gap-2">
                                <Truck size={14} className="text-gray-500" />
                                Supply Chain
                            </div>
                            <div className="pl-8 space-y-0.5">
                                {['Procurement', 'Warehouse', 'Shipping', 'Planning', 'Fleet', 'Vendors'].map(dept => (
                                    <button key={dept} className="w-full flex items-center px-2 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                        {dept}
                                    </button>
                                ))}
                            </div>

                            {/* Operations */}
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-800 flex items-center gap-2 mt-2">
                                <Settings size={14} className="text-gray-500" />
                                Operations
                            </div>
                            <div className="pl-8 space-y-0.5">
                                {['Maintenance', 'Production', 'Quality'].map(dept => (
                                    <button key={dept} className="w-full flex items-center px-2 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                        {dept}
                                    </button>
                                ))}
                            </div>

                            {/* Business */}
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-800 flex items-center gap-2 mt-2">
                                <Briefcase size={14} className="text-gray-500" />
                                Business
                            </div>
                            <div className="pl-8 space-y-0.5">
                                {['Sales', 'Finance'].map(dept => (
                                    <button key={dept} className="w-full flex items-center px-2 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                        {dept}
                                    </button>
                                ))}
                            </div>

                            {/* Support */}
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-800 flex items-center gap-2 mt-2">
                                <LifeBuoy size={14} className="text-gray-500" />
                                Support
                            </div>
                            <div className="pl-8 space-y-0.5">
                                {['IT', 'HR', 'Marketing'].map(dept => (
                                    <button key={dept} className="w-full flex items-center px-2 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                        {dept}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Insights</h3>
                        <div className="space-y-0.5">
                            <button className="w-full flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                <BarChart2 size={14} className="mr-2" />
                                <span>Capacity</span>
                            </button>
                            <button className="w-full flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                <Activity size={14} className="mr-2" />
                                <span>Velocity</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-3 border-t border-gray-200">
                    <button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-1.5">
                        <Plus size={14} />
                        <span>Create Team</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/50">
                {/* Header */}
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search teams..."
                                className="pl-8 pr-3 py-1.5 bg-gray-100 border-none rounded-md text-xs text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-brand-primary w-56 transition-all"
                            />
                        </div>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                            <Filter size={16} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors relative">
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Team Health Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <TrendingUp className="text-green-600" size={18} />
                                </div>
                                <span className="text-green-600 text-xs font-medium">+12% vs last month</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-0.5">{Math.round(avgCompletion)}%</h3>
                            <p className="text-gray-500 text-xs">Average Task Completion</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Zap className="text-blue-600" size={18} />
                                </div>
                                <span className="text-blue-600 text-xs font-medium">High Velocity</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-0.5">{totalActiveTasks}</h3>
                            <p className="text-gray-500 text-xs">Active Tasks Across Teams</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Shield className="text-purple-600" size={18} />
                                </div>
                                <span className="text-purple-600 text-xs font-medium">All Systems Operational</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-0.5">{teams.length}</h3>
                            <p className="text-gray-500 text-xs">Active Squads Deployed</p>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 mb-4">Active Squads</h2>

                    {/* Teams Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                        {teams.map(team => {
                            const teamTasks = getTeamTasks(team.id);
                            const completedTasks = teamTasks.filter(t => t.status === 'Complete').length;
                            const progress = teamTasks.length > 0 ? (completedTasks / teamTasks.length) * 100 : 0;

                            return (
                                <div key={team.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md relative flex flex-col">
                                    {/* Decorative Top Bar */}
                                    <div className="h-1 w-full" style={{ background: team.color }} />

                                    <div className="p-5 flex-1 flex flex-col">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: team.color }}>
                                                    {team.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{team.name}</h3>
                                                    <span className="text-xs text-gray-500">{team.members.length} Members</span>
                                                </div>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-50 rounded-md">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>

                                        {/* Members Avatars */}
                                        <div className="flex items-center -space-x-2 mb-6 pl-1">
                                            {team.members.map((memberId, i) => {
                                                const user = getUser(memberId);
                                                return (
                                                    <div key={memberId} className="relative group/avatar" style={{ zIndex: 10 - i }}>
                                                        <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100 shadow-sm" title={user?.name}>
                                                            {user?.avatarUrl ? (
                                                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500 bg-gray-100">
                                                                    {user?.name?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <button className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-0 shadow-sm">
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-6">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-gray-500">Task Completion</span>
                                                <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${progress}%`, backgroundColor: team.color }}
                                                />
                                            </div>
                                        </div>

                                        {/* Recent Tasks */}
                                        <div className="mt-auto">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Tasks</h4>
                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{teamTasks.length} Total</span>
                                            </div>

                                            <div className="space-y-2">
                                                {teamTasks.slice(0, 3).map(task => (
                                                    <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors group/task cursor-pointer">
                                                        <div className="flex items-center space-x-2 min-w-0">
                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'Complete' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                            <span className="text-xs text-gray-700 truncate group-hover/task:text-gray-900 transition-colors">{task.title}</span>
                                                        </div>
                                                        {task.dueDate && (
                                                            <div className="flex items-center text-[10px] text-gray-400 shrink-0 ml-2">
                                                                <Calendar size={10} className="mr-1" />
                                                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {teamTasks.length === 0 && (
                                                    <div className="text-center py-4 text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-lg">
                                                        No active tasks
                                                    </div>
                                                )}
                                            </div>

                                            {teamTasks.length > 3 && (
                                                <button className="w-full mt-3 py-1.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-1">
                                                    <span>View all {teamTasks.length} tasks</span>
                                                    <ArrowRight size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="h-9 bg-white border-t border-gray-200 flex items-center justify-between px-6 text-[10px] text-gray-500 flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <Users size={12} className="mr-1.5 text-gray-400" />
                            <span className="font-medium text-gray-600">{totalMembers} Members</span>
                        </div>
                        <div className="h-2.5 w-px bg-gray-200"></div>
                        <div className="flex items-center">
                            <CheckCircle2 size={12} className="mr-1.5 text-green-500" />
                            <span className="font-medium text-gray-600">{Math.round(avgCompletion)}% Completion Rate</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                            <span>System Operational</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                            <Clock size={12} className="mr-1" />
                            <span>Updated just now</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

