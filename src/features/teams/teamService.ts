import { Team } from '../../types/shared';
import { supabase, getCompanyId } from '../../lib/supabase';
import { authService } from '../../services/auth';

export const teamService = {
    getTeams: async (): Promise<Team[]> => {
        const currentUser = authService.getCurrentUser();
        const isSuperAdmin = currentUser?.email === 'master@nabdchain.com' || currentUser?.email === 'max@nabdchain.com';
        const isGeneralServer = getCompanyId() === 'view-wf54321';

        let query = supabase.from('teams').select('*');

        if (!isSuperAdmin && !isGeneralServer) {
            query = query.eq('company_id', getCompanyId());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching teams:', error);
            return [];
        }
        // Ensure members is string[]
        return (data || []).map((t: any) => ({
            ...t,
            members: t.members || []
        })) as Team[];
    },

    createTeam: async (team: Omit<Team, 'id'>): Promise<Team> => {
        const newTeam = {
            ...team,
            id: `team-${Date.now()}`, // Simple ID generation
            company_id: getCompanyId()
        };

        const { data, error } = await supabase
            .from('teams')
            .insert(newTeam)
            .select()
            .single();

        if (error) throw error;
        return data as Team;
    },

    deleteTeam: async (id: string) => {
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) {
            console.error('Error deleting team:', error);
            throw error;
        }
    },

    inviteMember: async (teamId: string | undefined, email: string, role: string) => {
        // 1. Check if user already exists
        const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .eq('email', email)
            .single();

        if (users) {
            // User exists
            if (teamId) {
                // Add to specific team
                const { data: team } = await supabase
                    .from('teams')
                    .select('members')
                    .eq('id', teamId)
                    .single();

                if (team) {
                    const currentMembers = team.members || [];
                    if (!currentMembers.includes(users.id)) {
                        const updatedMembers = [...currentMembers, users.id];
                        const { error } = await supabase
                            .from('teams')
                            .update({ members: updatedMembers })
                            .eq('id', teamId);

                        if (error) throw error;
                        return { status: 'added', message: `Added ${users.name} to the team.` };
                    } else {
                        return { status: 'exists', message: 'User is already in the team.' };
                    }
                }
            } else {
                // User exists, but no team specified. 
                // In a real app we might just say "User is already in the workspace".
                return { status: 'exists', message: `${users.name} is already a member.` };
            }
        }

        // 2. User does not exist, try to send real email via Edge Function
        try {
            const currentUser = authService.getCurrentUser();
            const { data: funcData, error: funcError } = await supabase.functions.invoke('invite-user', {
                body: {
                    teamId: teamId || null,
                    email,
                    role,
                    invitedBy: currentUser?.id
                }
            });

            if (funcError) throw funcError;
            return { status: 'invited', message: `Invitation sent to ${email} (via Email Service).` };

        } catch (funcError) {
            console.warn('Edge Function failed, falling back to database insert:', funcError);

            // Fallback: Create invitation directly in DB (no email sent)
            const { error } = await supabase
                .from('team_invitations')
                .insert({
                    team_id: teamId || null,
                    email: email,
                    role: role,
                    status: 'pending'
                });

            if (error) throw error;
            return { status: 'invited', message: `Invitation recorded (Email service unavailable).` };
        }
    },

    getPendingInvitations: async (teamId: string): Promise<any[]> => {
        const { data, error } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('team_id', teamId)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching invitations:', error);
            return [];
        }
        return data || [];
    },

    getWorkspaceInvitations: async (): Promise<any[]> => {
        const { data, error } = await supabase
            .from('team_invitations')
            .select('*')
            .is('team_id', null)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching workspace invitations:', error);
            return [];
        }
        return data || [];
    },

    cancelInvitation: async (id: string) => {
        const { error } = await supabase
            .from('team_invitations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error cancelling invitation:', error);
            throw error;
        }
    }
};
