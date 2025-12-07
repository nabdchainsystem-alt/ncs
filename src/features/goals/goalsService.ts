import { v4 as uuidv4 } from 'uuid';

export interface SubGoal {
    id: string;
    title: string;
    completed: boolean;
}

export interface Goal {
    id: string;
    title: string;
    category: string;
    dueDate: string;
    progress: number;
    subGoals: SubGoal[];
    status: 'on-track' | 'at-risk' | 'off-track' | 'completed';
    linkToOKR?: string;
    priority: 'High' | 'Medium' | 'Low';
    impact: 'High' | 'Medium' | 'Low';
    description?: string;
}

import { supabase, getCompanyId } from '../../lib/supabase';

class GoalsService {
    async getGoals(): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('company_id', getCompanyId());

        if (error) {
            console.error('Error fetching goals:', error);
            return [];
        }
        return data as Goal[];
    }

    async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
        const newGoal = {
            ...goal,
            id: uuidv4(),
            company_id: getCompanyId()
        };
        const { data, error } = await supabase
            .from('goals')
            .insert(newGoal)
            .select()
            .single();

        if (error) {
            console.error('Error creating goal:', error);
            throw error;
        }
        return data as Goal;
    }

    async updateGoal(goal: Goal): Promise<Goal> {
        const { data, error } = await supabase
            .from('goals')
            .update(goal)
            .eq('id', goal.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
        return data as Goal;
    }

    async deleteGoal(id: string): Promise<void> {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }
}

export const goalsService = new GoalsService();
