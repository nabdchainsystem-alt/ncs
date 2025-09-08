import React, { createContext, useContext, useState } from 'react';
import { Task, TaskStatus } from './taskTypes';

interface TaskContextType {
  tasks: Task[];
  addTask: (t: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  filterByStatus: (status: TaskStatus) => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  // Mock data مؤقتًا
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Finish onboarding flow', status: 'To do', assignee: 'Ali', tags: ['High'], commentsCount: 2 },
    { id: '2', title: 'Design new dashboard', status: 'In Progress', assignee: 'Sara', tags: ['UI'], commentsCount: 5 },
    { id: '3', title: 'Release v1.0', status: 'Completed', assignee: 'Omar', tags: ['Release'], commentsCount: 1 },
  ]);

  function addTask(t: Omit<Task, 'id'>) {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random());
    setTasks(prev => [...prev, { ...t, id }]);
  }

  function updateTask(id: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));
  }

  function removeTask(id: string) {
    setTasks(prev => prev.filter(task => task.id !== id));
  }

  function filterByStatus(status: TaskStatus) {
    return tasks.filter(task => task.status === status);
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, removeTask, filterByStatus }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskStore() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskStore must be used within TaskStoreProvider');
  return ctx;
}