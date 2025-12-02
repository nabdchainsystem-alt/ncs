import { Task, Project, User } from '../types/shared';

export const financeService = {
    /**
     * Calculates the cost of a specific task based on actual hours and user rate.
     */
    calculateTaskCost: (task: Task, assignee?: User): number => {
        if (!assignee || !assignee.hourlyRate || !task.actualHours) return 0;
        return task.actualHours * assignee.hourlyRate;
    },

    /**
     * Calculates the total spent amount for a project based on all its tasks.
     */
    calculateProjectBurn: (project: Project, projectTasks: Task[], users: User[]): number => {
        let totalSpent = 0;

        projectTasks.forEach(task => {
            const assignee = users.find(u => u.id === task.assigneeId);
            if (assignee) {
                totalSpent += financeService.calculateTaskCost(task, assignee);
            }
        });

        return totalSpent;
    },

    /**
     * Calculates the remaining budget for a project.
     */
    calculateRemainingBudget: (project: Project, spent: number): number => {
        return project.budget - spent;
    },

    /**
     * Returns the health status of the project budget.
     */
    getBudgetHealth: (project: Project, spent: number): 'Good' | 'At Risk' | 'Critical' => {
        const percentage = (spent / project.budget) * 100;
        if (percentage > 90) return 'Critical';
        if (percentage > 75) return 'At Risk';
        return 'Good';
    }
};
