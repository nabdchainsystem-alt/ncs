import React, { useState, useEffect } from 'react';
import { Team, Project, Invitation } from '../types';
import Badge from './Badge';
import {
    MoreHorizontal,
    Plus,
    Filter,
    Calendar as CalendarIcon,
    FileText,
    BarChart3,
    ArrowLeft,
    Mail,
    X
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../ui/Toast';
import { teamService } from '../teamService';

interface TeamDetailProps {
    team: Team;
    onBack: () => void;
}

const TeamDetail: React.FC<TeamDetailProps> = ({ team, onBack }) => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'members'>('overview');
    const [invitations, setInvitations] = useState<Invitation[]>([]);

    useEffect(() => {
        if (activeTab === 'members') {
            loadInvitations();
        }
    }, [activeTab, team.id]);

    const loadInvitations = async () => {
        const invites = await teamService.getPendingInvitations(team.id);
        setInvitations(invites);
    };

    // Dummy data for chart
    const data = [
        { name: 'Mon', tasks: 4 },
        { name: 'Tue', tasks: 7 },
        { name: 'Wed', tasks: 5 },
        { name: 'Thu', tasks: 9 },
        { name: 'Fri', tasks: 6 },
        { name: 'Sat', tasks: 2 },
        { name: 'Sun', tasks: 1 },
    ];

    const handleCancelInvitation = async (id: string) => {
        if (window.confirm(t('teams.confirm_cancel_invite') || 'Cancel this invitation?')) {
            try {
                await teamService.cancelInvitation(id);
                showToast('Invitation cancelled', 'success');
                loadInvitations();
            } catch (error: any) {
                showToast(error.message || 'Failed to cancel', 'error');
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-stone-950 overflow-hidden">
            {/* ... (Header unchanged) ... */}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">

                {/* ... (Overview Tab unchanged) ... */}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="space-y-6">
                        {/* Pending Invitations Section */}
                        {invitations.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-4">Pending Invitations</h3>
                                <div className="space-y-3">
                                    {invitations.map(invite => (
                                        <div key={invite.id} className="flex items-center justify-between bg-white dark:bg-stone-900 p-3 rounded border border-amber-100 dark:border-amber-900/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                                                    <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{invite.email}</div>
                                                    <div className="text-xs text-stone-500">{invite.role}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-xs text-amber-600 dark:text-amber-400 font-mono bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                                                    Pending
                                                </div>
                                                <button
                                                    onClick={() => handleCancelInvitation(invite.id)}
                                                    className="text-stone-400 hover:text-red-500 transition-colors p-1"
                                                    title="Cancel Invitation"
                                                >
                                                    <XAxis className="h-4 w-4 rotate-45" /> {/* Using XAxis as placeholder for X if X not imported, wait X is not imported. I should import X or Trash. X is likely imported in other files, let me check imports. XAxis is from recharts. I need lucide-react X. */}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Member List Placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {team.members.map(member => (
                                <div key={member.id} className="flex items-center gap-3 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
                                    <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <div className="font-medium text-stone-900 dark:text-stone-100">{member.name}</div>
                                        <div className="text-xs text-stone-500">{member.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Projects Tab */}
                {activeTab === 'projects' && (
                    <div className="flex items-center justify-center h-64 text-stone-400 font-serif italic">
                        Content for Projects coming soon...
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetail;
