import React, { useState, useEffect } from 'react';
import { useToast } from '../../ui/Toast';
import { Team as SharedTeam, User } from '../../types/shared';
import { Team as UITeam, Member } from './types';
import { teamService } from './teamService';
import { authService } from '../../services/auth';
import { CreateTeamModal } from './CreateTeamModal';
import { InviteMemberModal } from './InviteMemberModal';
import TeamsDashboard from './components/TeamsDashboard';
import TeamDetail from './components/TeamDetail';

import TeamsSidebar from './components/TeamsSidebar';

export const TeamPage: React.FC = () => {
    const [teams, setTeams] = useState<UITeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsData, usersData] = await Promise.all([
                teamService.getTeams(),
                authService.getUsers()
            ]);

            const adaptedTeams = adaptTeams(teamsData, usersData);
            setTeams(adaptedTeams);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
            showToast('Failed to load teams', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Adapter: Convert SharedTeam (Backend) -> UITeam (Frontend)
    const adaptTeams = (sharedTeams: SharedTeam[], users: User[]): UITeam[] => {
        const userMap = new Map(users.map(u => [u.id, u]));

        return sharedTeams.map(t => {
            // Map member IDs to Member objects
            const members: Member[] = t.members.map(memberId => {
                const user = userMap.get(memberId);
                return {
                    id: memberId,
                    name: user?.name || 'Unknown User',
                    role: (user?.role === 'Admin' || user?.role === 'Manager') ? 'Admin' : 'Viewer',
                    avatarUrl: user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || '?'}&background=random`,
                    status: 'online' // Mock status for now
                };
            });

            // Mock missing UI fields
            return {
                id: t.id,
                name: t.name,
                description: "A cross-functional team dedicated to delivering excellence.", // Mock
                category: "General", // Mock
                members: members,
                activities: [], // Mock
                projects: [], // Mock
                unreadCount: 0 // Mock
            };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-stone-50 dark:bg-stone-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 dark:border-stone-200"></div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-full overflow-hidden">
            <TeamsSidebar onInviteClick={() => setIsInviteModalOpen(true)} />
            <main className="flex-1 h-full overflow-hidden relative">
                {selectedTeamId ? (
                    <TeamDetail
                        team={teams.find(t => t.id === selectedTeamId)!}
                        onBack={() => setSelectedTeamId(null)}
                    />
                ) : (
                    <TeamsDashboard
                        teams={teams}
                        onTeamClick={(id) => setSelectedTeamId(id)}
                        onCreateClick={() => setIsCreateModalOpen(true)}
                    />
                )}
            </main>

            <CreateTeamModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTeamCreated={() => {
                    fetchData();
                    setIsCreateModalOpen(false);
                }}
            />

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                teamId={selectedTeamId || teams[0]?.id}
            />
        </div>
    );
};
