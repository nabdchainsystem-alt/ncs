import { User } from '../types/shared';
import { supabase, getCompanyId } from '../lib/supabase';

export const authService = {
  login: async (email: string, pass: string): Promise<User | null> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Fetch users from Supabase
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('company_id', getCompanyId());

      if (error) throw error;

      if (users && users.length > 0) {
        // In a real app we would verify password hash here.
        // For now we check plain text to match existing behavior
        const user = (users as any[]).find(u => u.password === pass);

        if (user) {
          // Store the user session
          localStorage.setItem('clickup_user', JSON.stringify(user));
          return user as User;
        }
      }
    } catch (error) {
      console.warn("Backend login failed, trying mock users:", error);

      // Fallback to mock users if backend is not available (e.g. on Vercel)
      const mockUser = MOCK_USERS.find(u => u.email === email && u.password === pass);
      if (mockUser) {
        localStorage.setItem('clickup_user', JSON.stringify(mockUser));
        return mockUser;
      }
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
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', currentUser.id);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update user in backend:", error);
    }

    return updatedUser;
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', getCompanyId());

      if (error) throw error;
      return data as User[];
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return MOCK_USERS; // Fallback to mock users
    }
  }
};

// Mock users for Vercel/Demo environment
const MOCK_USERS: any[] = [
  {
    id: "u1",
    name: "Max Nabd",
    email: "max@nabdchain.com",
    password: "1",
    role: "Admin",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Max"
  },
  {
    id: "u6",
    name: "SMT Master",
    email: "master.smt@nabdchain-smt.com",
    password: "master.max",
    role: "Admin",
    avatarUrl: "",
    color: "#FF0000"
  }
];