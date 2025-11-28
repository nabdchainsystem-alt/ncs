import { User } from '../types/shared';
import { getApiUrl } from '../utils/config';

const API_URL = getApiUrl();

export const authService = {
  login: async (email: string, pass: string): Promise<User | null> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Fetch users from the tenant-specific backend
      const res = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`);
      const users = await res.json();

      if (users && users.length > 0) {
        const user = users[0];
        // Store the user session
        localStorage.setItem('clickup_user', JSON.stringify(user));
        return user;
      }
    } catch (error) {
      console.error("Login failed:", error);
    }

    return null;
  },

  logout: () => {
    localStorage.removeItem('clickup_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('clickup_user');
    return stored ? JSON.parse(stored) : null;
  },

  updateCurrentUser: async (updates: Partial<User>): Promise<User | null> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return null;

    const updatedUser = { ...currentUser, ...updates };

    // Update in localStorage
    localStorage.setItem('clickup_user', JSON.stringify(updatedUser));

    // Update in backend
    try {
      await fetch(`${API_URL}/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error("Failed to update user in backend:", error);
    }

    return updatedUser;
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const res = await fetch(`${API_URL}/users`);
      return res.json();
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  }
};