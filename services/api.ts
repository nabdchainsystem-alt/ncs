import { Task, Message, Space } from '../types';

const API_URL = 'http://localhost:3001';
const DELAY_MS = 200; // Reduced latency for local server

// Helper to simulate network delay (optional, can be removed for speed)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- SPACES ---
  getSpaces: async (): Promise<Space[]> => {
    const res = await fetch(`${API_URL}/spaces`);
    return res.json();
  },

  createSpace: async (name: string): Promise<Space> => {
    const newSpace: Space = {
      id: `SPACE-${Date.now()}`,
      name,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
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

    // Also delete tasks in this space
    const tasks = await api.getTasks();
    const spaceTasks = tasks.filter(t => t.spaceId === id);
    await Promise.all(spaceTasks.map(t => api.deleteTask(t.id)));
  },

  // --- TASKS ---
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

  // --- MESSAGES ---
  getMessages: async (): Promise<Message[]> => {
    const res = await fetch(`${API_URL}/messages`);
    return res.json();
  },

  markMessageRead: async (msgId: string): Promise<void> => {
    await fetch(`${API_URL}/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true })
    });
  },

  sendMessage: async (subject: string, content: string): Promise<Message> => {
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
    const res = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg)
    });
    return res.json();
  },

  // --- WIDGETS (Custom Tables) ---
  getWidgets: async (): Promise<Record<string, any[]>> => {
    const res = await fetch(`${API_URL}/widgets`);
    return res.json();
  },

  updateWidgets: async (widgets: Record<string, any[]>): Promise<void> => {
    // json-server replaces the entire object if we PUT to /widgets
    // But since widgets is a single object in db.json, we might need to handle it carefully.
    // If db.json structure is "widgets": { ... }, then GET /widgets returns the object.
    // PUT /widgets should replace it.
    await fetch(`${API_URL}/widgets`, {
      method: 'PUT', // PUT replaces the entire resource
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(widgets)
    });
  }
};