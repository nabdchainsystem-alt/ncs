import { useState, useEffect } from 'react';
import { authService } from '../../../services/auth';
import { roomService } from '../../rooms/roomService';
import { IBoard, ITask, Status, Priority } from '../../rooms/boardTypes';
import { Room } from '../../rooms/types';

export interface AggregatedTask extends ITask {
    source: string; // 'Personal' or Room Name
    roomId?: string; // if from a room
    roomColor?: string;
}

export const useAllTasks = () => {
    const [tasks, setTasks] = useState<AggregatedTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const user = authService.getCurrentUser();
                const userId = user?.id;
                const aggregated: AggregatedTask[] = [];

                // 1. Fetch Personal Tasks
                const personalStorageKey = userId ? `taskboard-${userId}` : 'taskboard-default';
                const personalData = localStorage.getItem(personalStorageKey);
                if (personalData) {
                    try {
                        const board: IBoard = JSON.parse(personalData);
                        if (board.groups) {
                            board.groups.forEach(group => {
                                group.tasks.forEach(task => {
                                    if (task.status !== Status.Done) { // Filter out done tasks if needed, or keep all
                                        aggregated.push({
                                            ...task,
                                            source: 'Personal',
                                            roomColor: '#3b82f6' // Default blue
                                        });
                                    }
                                });
                            });
                        }
                    } catch (e) {
                        console.error('Failed to parse personal tasks', e);
                    }
                }

                // 2. Fetch Room Tasks
                if (userId) {
                    const rooms = await roomService.getRooms(userId);

                    for (const room of rooms) {
                        const viewsKey = `room-views-${room.id}`;
                        const viewsData = localStorage.getItem(viewsKey);

                        if (viewsData) {
                            try {
                                const parsedViews = JSON.parse(viewsData);
                                const views = parsedViews.views || [];

                                // Find all list views
                                const listViews = views.filter((v: any) => v.type === 'list');

                                for (const view of listViews) {
                                    const taskKey = `taskboard-${room.id}-${view.id}`;
                                    const taskData = localStorage.getItem(taskKey);

                                    if (taskData) {
                                        try {
                                            const board: IBoard = JSON.parse(taskData);
                                            if (board.groups) {
                                                board.groups.forEach(group => {
                                                    group.tasks.forEach(task => {
                                                        if (task.status !== Status.Done) {
                                                            aggregated.push({
                                                                ...task,
                                                                source: room.name,
                                                                roomId: room.id,
                                                                roomColor: room.color
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                        } catch (e) {
                                            console.error(`Failed to parse tasks for room ${room.name}`, e);
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error(`Failed to parse views for room ${room.name}`, e);
                            }
                        }
                    }
                }

                // Sort by urgency/priority (custom sort logic)
                const priorityOrder = {
                    [Priority.Urgent]: 0,
                    [Priority.High]: 1,
                    [Priority.Medium]: 2,
                    [Priority.Normal]: 3,
                    [Priority.Low]: 4,
                };

                aggregated.sort((a, b) => {
                    // Sort by Priority first
                    const pA = priorityOrder[a.priority] ?? 99;
                    const pB = priorityOrder[b.priority] ?? 99;
                    if (pA !== pB) return pA - pB;

                    // Then by Due Date (if exists)
                    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    if (a.dueDate) return -1;
                    if (b.dueDate) return 1;

                    return 0;
                });

                setTasks(aggregated);

            } catch (error) {
                console.error('Error fetching all tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();

        // Listen for storage changes to auto-update (basic implementation)
        const handleStorageChange = () => fetchTasks();
        window.addEventListener('storage', handleStorageChange);
        // Custom event for local updates
        window.addEventListener('local-storage-update', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('local-storage-update', handleStorageChange);
        };

    }, []);

    return { tasks, loading };
};
