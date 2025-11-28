import { Space } from './types';

import { getApiUrl } from '../../utils/config';

const API_URL = getApiUrl();

export const spaceService = {
    getSpaces: async (userId?: string): Promise<Space[]> => {
        const res = await fetch(`${API_URL}/spaces`);
        const allSpaces: Space[] = await res.json();

        if (!userId) return allSpaces;

        return allSpaces.filter(space =>
            space.type === 'department' ||
            space.type === 'shared' ||
            space.ownerId === userId ||
            !space.ownerId // Legacy spaces visible to all
        );
    },

    createSpace: async (name: string, color?: string, ownerId?: string, type: 'personal' | 'department' | 'shared' = 'personal'): Promise<Space> => {
        const newSpace: Space = {
            id: `SPACE-${Date.now()}`,
            name,
            color: color || '#' + Math.floor(Math.random() * 16777215).toString(16),
            ownerId,
            type
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
