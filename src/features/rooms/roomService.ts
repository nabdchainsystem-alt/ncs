import { Room } from './types';

import { getApiUrl } from '../../utils/config';

const API_URL = getApiUrl(); // This line is no longer strictly needed for roomService but kept as per instruction context.

const STORAGE_KEY = 'rooms';

export const roomService = {
    async getRooms(userId: string): Promise<Room[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const rooms: Room[] = stored ? JSON.parse(stored) : [];
            return rooms.filter(s => s.ownerId === userId);
        } catch (error) {
            console.error('Failed to parse rooms:', error);
            return [];
        }
    },

    async createRoom(name: string, color: string, ownerId: string, type: 'personal' | 'shared' = 'personal'): Promise<Room> {
        await new Promise(resolve => setTimeout(resolve, 300));

        const newRoom: Room = {
            id: `SPACE-${Date.now()}`, // Keep ID format for compatibility
            name,
            color,
            ownerId,
            type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const rooms: Room[] = stored ? JSON.parse(stored) : [];
            rooms.push(newRoom);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
            return newRoom;
        } catch (error) {
            console.error('Failed to save room:', error);
            throw new Error('Failed to create room');
        }
    },

    async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
        await new Promise(resolve => setTimeout(resolve, 200));

        const stored = localStorage.getItem(STORAGE_KEY);
        const rooms: Room[] = stored ? JSON.parse(stored) : [];
        const index = rooms.findIndex(s => s.id === id);

        if (index === -1) throw new Error('Room not found');

        const updatedRoom = { ...rooms[index], ...updates, updatedAt: new Date().toISOString() };
        rooms[index] = updatedRoom;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));

        return updatedRoom;
    },

    async deleteRoom(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 200));

        const stored = localStorage.getItem(STORAGE_KEY);
        const rooms: Room[] = stored ? JSON.parse(stored) : [];
        const filtered = rooms.filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
};
