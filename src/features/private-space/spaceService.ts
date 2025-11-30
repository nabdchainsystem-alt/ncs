import { Space } from './types';

import { getApiUrl } from '../../utils/config';

const API_URL = getApiUrl();

export const spaceService = {
    getSpaces: async (): Promise<Space[]> => {
        const res = await fetch(`${API_URL}/spaces`);
        return res.json();
    },

    createSpace: async (name: string, color?: string): Promise<Space> => {
        const newSpace: Space = {
            id: `SPACE-${Date.now()}`,
            name,
            color: color || '#' + Math.floor(Math.random() * 16777215).toString(16)
        };
        const res = await fetch(`${API_URL}/spaces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSpace)
        });
        return res.json();
    },

    updateSpace: async (id: string, updates: Partial<Space>): Promise<void> => {
        await fetch(`${API_URL}/spaces/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    },

    deleteSpace: async (id: string): Promise<void> => {
        await fetch(`${API_URL}/spaces/${id}`, { method: 'DELETE' });
        // Note: Task deletion logic moved to taskService or handled by backend/orchestrator
        // For now, we'll assume the backend handles cascading deletes or we'll add it back if needed
    }
};
