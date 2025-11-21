import { Task } from '../../types';

const API_URL = 'http://localhost:3001';

export const taskService = {
    getTasks: async (): Promise<Task[]> => {
        const res = await fetch(`${API_URL}/tasks`);
        return res.json();
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
