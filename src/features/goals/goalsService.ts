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

const API_URL = 'http://localhost:3001/goals';

class GoalsService {
    async getGoals(): Promise<Goal[]> {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch goals');
            return await response.json();
        } catch (error) {
            console.error('Error fetching goals:', error);
            return [];
        }
    }

    async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
        const newGoal = { ...goal, id: uuidv4() };
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGoal)
            });
            if (!response.ok) throw new Error('Failed to create goal');
            return await response.json();
        } catch (error) {
            console.error('Error creating goal:', error);
            throw error;
        }
    }

    async updateGoal(goal: Goal): Promise<Goal> {
        try {
            const response = await fetch(`${API_URL}/${goal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goal)
            });
            if (!response.ok) throw new Error('Failed to update goal');
            return await response.json();
        } catch (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
    }

    async deleteGoal(id: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete goal');
        } catch (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }
}

export const goalsService = new GoalsService();
