
import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, Clock, MoreHorizontal, Plus, Calendar, ArrowRight } from 'lucide-react';
import { useToast } from '../../ui/Toast';
import { getApiUrl } from '../../utils/config';
import { Team, User } from '../../types/shared';
import { Task } from '../tasks/types';

export const TeamPage: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto custom-scrollbar">
            {/* Header Section */}
            <div className="flex items-end justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Team Overview</h1>
                    <p className="text-gray-400 text-lg">Manage your squads and track their progress across the organization.</p>
                </div>
                <button className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-brand-primary/20 flex items-center space-x-2">
                    <Plus size={18} />
                    <span>Create Team</span>
                </button>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {teams.map(team => {
                    const teamTasks = getTeamTasks(team.id);
                    const completedTasks = teamTasks.filter(t => t.status === 'Complete').length;
                    const progress = teamTasks.length > 0 ? (completedTasks / teamTasks.length) * 100 : 0;

                    return (
                        <div key={team.id} className="group bg-[#2a2e35] border border-gray-800 rounded-3xl overflow-hidden hover:border-gray-600 transition-all duration-300 shadow-xl hover:shadow-2xl relative">
                            {/* Decorative Top Bar */}
                            <div className="h-2 w-full" style={{ background: team.color }} />

                            <div className="p-6">
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ backgroundColor: `${team.color}20`, color: team.color }}>
                                            {team.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">{team.name}</h3>
                                            <span className="text-sm text-gray-500">{team.members.length} Members</span>
                                        </div>
                                    </div>
                                    <button className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>

                                {/* Members Avatars */}
                                <div className="flex items-center -space-x-3 mb-8 pl-2">
                                    {team.members.map((memberId, i) => {
                                        const user = getUser(memberId);
                                        return (
                                            <div key={memberId} className="relative group/avatar" style={{ zIndex: 10 - i }}>
                                                <div className="w-10 h-10 rounded-full border-2 border-[#2a2e35] overflow-hidden bg-gray-800" title={user?.name}>
                                                    {user?.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 bg-gray-900">
                                                            {user?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <button className="w-10 h-10 rounded-full border-2 border-[#2a2e35] bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-0">
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-8">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Task Completion</span>
                                        <span className="text-white font-medium">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${progress}%`, backgroundColor: team.color }}
                                        />
                                    </div>
                                </div>

                                {/* Recent Tasks */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Tasks</h4>
                                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-md">{teamTasks.length} Total</span>
                                    </div>

                                    <div className="space-y-3">
                                        {teamTasks.slice(0, 3).map(task => (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/60 rounded-xl border border-gray-800 transition-colors group/task cursor-pointer">
                                                <div className="flex items-center space-x-3 min-w-0">
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'Complete' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                    <span className="text-sm text-gray-300 truncate group-hover/task:text-white transition-colors">{task.title}</span>
                                                </div>
                                                {task.dueDate && (
                                                    <div className="flex items-center text-[10px] text-gray-500 shrink-0 ml-2">
                                                        <Calendar size={10} className="mr-1" />
                                                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {teamTasks.length === 0 && (
                                            <div className="text-center py-6 text-gray-600 text-sm italic border border-dashed border-gray-800 rounded-xl">
                                                No active tasks
                                            </div>
                                        )}
                                    </div>

                                    {teamTasks.length > 3 && (
                                        <button className="w-full mt-4 py-2 text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center space-x-1">
                                            <span>View all {teamTasks.length} tasks</span>
                                            <ArrowRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

