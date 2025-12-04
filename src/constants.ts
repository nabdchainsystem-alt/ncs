import { Task } from './features/tasks/types';
import { Message } from './features/inbox/types';

// Empty initial state as requested
export const MOCK_TASKS: Task[] = [];

export const MOCK_MESSAGES: Message[] = [];

export const USERS = {
  'u1': {
    id: 'u1',
    name: 'Max Nabd',
    avatar: '/founder.png',
    color: '#7B61FF',
    email: 'max@nabdchain.com'
  },
  'u2': {
    id: 'u2',
    name: 'Hasan Nabd',
    avatar: 'HN',
    color: '#00E1D4',
    email: 'hasan@nabdchain.com'
  },
  // Fallback user for legacy "me" references
  'me': { id: 'me', name: 'You', avatar: 'YOU', color: '#7b68ee', email: 'me@workspace.local' },
};
