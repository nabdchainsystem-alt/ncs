import { User, Task, Status } from '../types/shared';

export const resourceService = {
    /**
     * Calculates the current load of a user based on active tasks and their estimated hours.
     * Returns a percentage (0-100+).
     */
    calculateUserLoad: (user: User, activeTasks: Task[]): number => {
        if (!user.weeklyCapacity || user.weeklyCapacity === 0) return 0;

        // Filter tasks assigned to this user that are In Progress
        const userTasks = activeTasks.filter(t =>
            t.assigneeId === user.id &&
            t.status === Status.InProgress
        );

        // Sum up estimated hours for these tasks
        // Assumption: These hours are spread over the week. 
        // For a simple v1, we sum total remaining estimated hours.
        const totalEstimatedHours = userTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

        return Math.round((totalEstimatedHours / user.weeklyCapacity) * 100);
    },

    /**
     * Checks if a user can accept a new task without exceeding capacity threshold (e.g., 100%).
     */
    canAssignTask: (user: User, newTask: Task, activeTasks: Task[], threshold: number = 100): boolean => {
        const currentLoad = resourceService.calculateUserLoad(user, activeTasks);
        const newTaskLoad = (newTask.estimatedHours || 0) / (user.weeklyCapacity || 40) * 100;

        return (currentLoad + newTaskLoad) <= threshold;
    },

    /**
     * Returns a color code for the load level.
     */
    getLoadColor: (load: number): string => {
        if (load < 50) return '#22c55e'; // Green (Underutilized)
        if (load < 80) return '#3b82f6'; // Blue (Optimal)
        if (load < 100) return '#eab308'; // Yellow (High)
        return '#ef4444'; // Red (Overloaded)
    }
};
