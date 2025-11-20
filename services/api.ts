import { Task, Message, Space } from '../types';

const STORAGE_KEY = 'clickup_clone_db_v2';
const MSG_STORAGE_KEY = 'clickup_clone_msgs_v2';
const SPACES_STORAGE_KEY = 'clickup_clone_spaces_v1';
const DELAY_MS = 400; // Simulate network latency

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize DB
const initDB = () => {
  if (typeof window === 'undefined') return;
  
  // We no longer inject mock tasks. Users start fresh.
  const existingTasks = localStorage.getItem(STORAGE_KEY);
  if (!existingTasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }

  // Messages
  const existingMsgs = localStorage.getItem(MSG_STORAGE_KEY);
  if (!existingMsgs) {
    localStorage.setItem(MSG_STORAGE_KEY, JSON.stringify([]));
  }

  // Spaces
  const existingSpaces = localStorage.getItem(SPACES_STORAGE_KEY);
  if (!existingSpaces) {
    // Start with NO spaces, or maybe one default if you prefer, but request said "create by himself"
    // We will let the sidebar handle the empty state or create a default one via UI if needed.
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify([]));
  }
};

initDB();

export const api = {
  // --- SPACES ---
  getSpaces: async (): Promise<Space[]> => {
    await delay(DELAY_MS);
    const data = localStorage.getItem(SPACES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  createSpace: async (name: string): Promise<Space> => {
    await delay(DELAY_MS);
    const data = localStorage.getItem(SPACES_STORAGE_KEY);
    const spaces: Space[] = data ? JSON.parse(data) : [];
    
    const newSpace: Space = {
      id: `SPACE-${Date.now()}`,
      name,
      color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
    };
    
    spaces.push(newSpace);
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));
    return newSpace;
  },

  updateSpace: async (id: string, updates: Partial<Space>): Promise<void> => {
    await delay(DELAY_MS);
    const data = localStorage.getItem(SPACES_STORAGE_KEY);
    const spaces: Space[] = data ? JSON.parse(data) : [];
    const index = spaces.findIndex(s => s.id === id);
    if (index !== -1) {
        spaces[index] = { ...spaces[index], ...updates };
        localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));
    }
  },

  deleteSpace: async (id: string): Promise<void> => {
    await delay(DELAY_MS);
    // Delete Space
    const data = localStorage.getItem(SPACES_STORAGE_KEY);
    let spaces: Space[] = data ? JSON.parse(data) : [];
    spaces = spaces.filter(s => s.id !== id);
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));

    // Delete Tasks in that Space
    const taskData = localStorage.getItem(STORAGE_KEY);
    let tasks: Task[] = taskData ? JSON.parse(taskData) : [];
    tasks = tasks.filter(t => t.spaceId !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },

  // --- TASKS ---
  getTasks: async (): Promise<Task[]> => {
    await delay(DELAY_MS);
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    await delay(DELAY_MS / 2);
    const data = localStorage.getItem(STORAGE_KEY);
    const tasks: Task[] = data ? JSON.parse(data) : [];
    
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error('Task not found');

    const updatedTask = { ...tasks[index], ...updates };
    tasks[index] = updatedTask;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return updatedTask;
  },

  createTask: async (task: Omit<Task, 'id'>): Promise<Task> => {
    await delay(DELAY_MS);
    const data = localStorage.getItem(STORAGE_KEY);
    const tasks: Task[] = data ? JSON.parse(data) : [];
    
    const newId = `TASK-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newTask: Task = {
      ...task,
      id: newId,
    };
    
    tasks.push(newTask);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return newTask;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await delay(DELAY_MS);
    const data = localStorage.getItem(STORAGE_KEY);
    let tasks: Task[] = data ? JSON.parse(data) : [];
    
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },

  // --- MESSAGES ---
  getMessages: async (): Promise<Message[]> => {
    await delay(DELAY_MS);
    const data = localStorage.getItem(MSG_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  markMessageRead: async (msgId: string): Promise<void> => {
    const data = localStorage.getItem(MSG_STORAGE_KEY);
    const msgs: Message[] = data ? JSON.parse(data) : [];
    const index = msgs.findIndex(m => m.id === msgId);
    if (index !== -1) {
      msgs[index].isRead = true;
      localStorage.setItem(MSG_STORAGE_KEY, JSON.stringify(msgs));
    }
  },

  sendMessage: async (subject: string, content: string): Promise<Message> => {
    await delay(DELAY_MS);
    const data = localStorage.getItem(MSG_STORAGE_KEY);
    const msgs: Message[] = data ? JSON.parse(data) : [];

    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      senderId: 'me',
      subject,
      preview: content.substring(0, 50) + '...',
      content,
      timestamp: new Date().toISOString(),
      isRead: true,
      tags: ['sent']
    };

    msgs.unshift(newMsg);
    localStorage.setItem(MSG_STORAGE_KEY, JSON.stringify(msgs));
    return newMsg;
  }
};