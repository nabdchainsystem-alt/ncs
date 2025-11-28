import { Task } from './types';

import { getApiUrl } from '../../utils/config';

const API_URL = getApiUrl();

export const taskService = {
    getTasks: async (userId?: string): Promise<Task[]> => {
        const [tasksRes, spacesRes] = await Promise.all([
            fetch(`${API_URL}/tasks`),
            fetch(`${API_URL}/spaces`)
        ]);

        const tasks: Task[] = await tasksRes.json();
        const spaces: any[] = await spacesRes.json(); // Using any to avoid circular dependency for now, or import Space type

        if (!userId) return tasks;

        return tasks.filter(task => {
            // 1. If task has no spaceId or is 'default', treat as legacy/shared (or maybe personal? let's keep shared for now to avoid hiding old data)
            if (!task.spaceId || task.spaceId === 'default') return true;

            const space = spaces.find((s: any) => s.id === task.spaceId);

            // 2. If space not found, maybe show it?
            if (!space) return true;

            // 3. Check Space Type
            if (space.type === 'department' || space.type === 'shared') return true;

            // 4. If Personal, must be Owner
            if (space.type === 'personal') {
                return space.ownerId === userId;
            }

            // Fallback
            return true;
        });
    },

    updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return res.json();
    },

    createTask: async (task: Omit<Task, 'id'>): Promise<Task> => {
        const newTask = { ...task, id: `TASK-${Math.floor(1000 + Math.random() * 9000)}` };
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });
        return res.json();
    },

    deleteTask: async (taskId: string): Promise<void> => {
        await fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' });
    },

    deleteTasksBySpaceId: async (spaceId: string): Promise<void> => {
        const tasks = await taskService.getTasks();
        const spaceTasks = tasks.filter(t => t.spaceId === spaceId);
        await Promise.all(spaceTasks.map(t => taskService.deleteTask(t.id)));
    }
};
