import { Team } from '../../types/shared';
import { supabase, getCompanyId } from '../../lib/supabase';

export const teamService = {
    getTeams: async (): Promise<Team[]> => {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .eq('company_id', getCompanyId());

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
