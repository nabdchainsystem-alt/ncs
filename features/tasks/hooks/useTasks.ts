import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { Status } from '../../../types/shared';
import { taskService } from '../taskService';
import { spaceService } from '../../space/spaceService';
import { widgetService } from '../../dashboards/widgetService';
import { useToast } from '../../../ui/Toast';

export const useTasks = (viewState: 'landing' | 'login' | 'app', activePage: string) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchTasks = useCallback(async () => {
        try {
            setIsLoading(true);
            const tasksData = await taskService.getTasks();
            // We might want to fetch spaces and widgets here too if they are needed globally or by the task view
            // But for now, let's stick to what App.tsx was doing, which was fetching everything.
            // However, to keep this hook focused, maybe we should only fetch tasks?
            // App.tsx fetched spaces and widgets too. Let's keep it similar for now to avoid breaking changes,
            // but ideally these should be separate.
            // Actually, App.tsx setPageWidgets with widgetsData.
            // Let's just fetch tasks here. The widgets logic will go to useWidgets.

            const sortedData = tasksData.sort((a, b) => (a.order || 0) - (b.order || 0));
            setTasks(sortedData);
        } catch (error) {
            showToast('Failed to load tasks from backend', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (viewState === 'app') {
            fetchTasks();
        }
    }, [viewState, fetchTasks]);

    const handleStatusChange = async (taskId: string, newStatus: Status) => {
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        ));

        try {
            await taskService.updateTask(taskId, { status: newStatus });
        } catch (error) {
            setTasks(previousTasks);
            showToast('Failed to update task status', 'error');
        }
    };

    const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
        ));

        try {
            await taskService.updateTask(taskId, updates);
            showToast('Task updated', 'success');
        } catch (error) {
            setTasks(previousTasks);
            showToast('Failed to update task', 'error');
        }
    };

    const handleReorder = (newTasks: Task[]) => {
        setTasks(newTasks);
        // Persistence logic would go here
    };

    const handleQuickCreate = async () => {
        const title = prompt("Enter task title:");
        if (!title) return;

        showToast('Creating task...', 'info');
        try {
            const newTask = await taskService.createTask({
                title,
                status: Status.Todo,
                priority: 'None' as any,
                assignees: [],
                tags: activePage === 'backend' ? ['Backend'] : [],
                description: '',
                order: tasks.length,
                spaceId: 'default'
            });
            setTasks(prev => [...prev, newTask]);
            showToast('Task created successfully', 'success');
        } catch (e) {
            showToast('Failed to create task', 'error');
        }
    };

    return {
        tasks,
        isLoading,
        handleStatusChange,
        handleUpdateTask,
        handleReorder,
        handleQuickCreate,
        fetchTasks
    };
};
