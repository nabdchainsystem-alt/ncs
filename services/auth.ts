import { User } from '../types/shared';

// Mock User Database
const USERS = [
  {
    email: 'max@nabdchain.com',
    password: '1',
    user: {
      id: 'u1',
      name: 'Max Nabd',
      avatar: 'MN',
      color: '#7B61FF',
      email: 'max@nabdchain.com'
    }
  },
  {
    email: 'hasan@nabdchain.com',
    password: '1',
    user: {
      id: 'u2',
      name: 'Hasan Nabd',
      avatar: 'HN',
      color: '#00E1D4',
      email: 'hasan@nabdchain.com'
    }
  },
  {
    email: 'master@nabdchain.com',
    password: '1',
    user: {
      id: 'u3',
      name: 'Master User',
      avatar: 'MU',
      color: '#FF0000',
      email: 'master@nabdchain.com'
    }
  }
];

export const authService = {
  login: async (email: string, pass: string): Promise<User | null> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const account = USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

    if (account) {
      localStorage.setItem('clickup_user', JSON.stringify(account.user));
      return account.user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem('clickup_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('clickup_user');
    return stored ? JSON.parse(stored) : null;
  }
};