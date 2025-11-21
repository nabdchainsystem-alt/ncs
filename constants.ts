import { Task } from './features/tasks/types';
import { Message } from './features/inbox/types';

// Empty initial state as requested
export const MOCK_TASKS: Task[] = [];

export const MOCK_MESSAGES: Message[] = [];

export const USERS = {
  '1': { id: '1', name: 'Alex', avatar: 'A', color: '#ef4444' },
  '2': { id: '2', name: 'Sam', avatar: 'S', color: '#3b82f6' },
  '3': { id: '3', name: 'Jordan', avatar: 'J', color: '#10b981' },
  'me': { id: 'me', name: 'Me', avatar: 'ME', color: '#7b68ee' },
};