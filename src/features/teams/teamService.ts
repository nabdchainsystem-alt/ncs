import { Team } from '../../types/shared';
import { supabase, getCompanyId } from '../../lib/supabase';
import { authService } from '../../services/auth';

export const teamService = {
    getTeams: async (): Promise<Team[]> => {
        const currentUser = authService.getCurrentUser();
        const isSuperAdmin = currentUser?.email === 'master@nabdchain.com' || currentUser?.email === 'max@nabdchain.com';

        let query = supabase.from('teams').select('*');

        if (!isSuperAdmin) {
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
    }
};
