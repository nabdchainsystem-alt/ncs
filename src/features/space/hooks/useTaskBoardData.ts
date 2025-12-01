import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IBoard, ITask, IGroup, IColumn, Status, Priority, DragItem, INITIAL_DATA, GROUP_COLORS } from '../boardTypes';
import { generateProjectPlan, analyzeBoardStatus } from '../aiService';

export const useTaskBoardData = (storageKey: string) => {
    const [board, setBoard] = useState<IBoard>(() => {
        try {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);

                    // Migration: If board has columns (old style) and groups don't, migrate.
                    if (parsed.columns && Array.isArray(parsed.columns) && parsed.groups) {
                        const migratedGroups = parsed.groups.map((g: any) => ({
                            ...g,
                            columns: g.columns || [...parsed.columns] // Copy board columns to group if missing
                        }));
                        // Return new structure, removing board.columns implicitly by casting or just ignoring it
                        return { ...parsed, groups: migratedGroups } as IBoard;
                    }

                    // Validation/Repair: Ensure all groups have columns
                    if (parsed.groups && Array.isArray(parsed.groups)) {
                        const repairedGroups = parsed.groups.map((g: any) => {
                            if (g.columns && Array.isArray(g.columns)) return g;
                            // Fallback for groups without columns
                            return {
                                ...g,
                                columns: [
                                    { id: 'col_name', title: 'Item', type: 'name', width: '300px' },
                                    { id: 'col_person', title: 'Owner', type: 'person', width: '96px' },
                                    { id: 'col_status', title: 'Status', type: 'status', width: '128px' },
                                    { id: 'col_priority', title: 'Priority', type: 'priority', width: '128px' },
                                    { id: 'col_date', title: 'Due Date', type: 'date', width: '110px' },
                                ]
                            };
                        });
                        return { ...parsed, groups: repairedGroups } as IBoard;
                    }
                }
            }
        } catch (err) {
            console.warn('Failed to load saved board', err);
        }
        return INITIAL_DATA;
    });

    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    // Persist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(board));
        } catch (err) {
            console.warn('Failed to save board', err);
        }
    }, [board, storageKey]);

    // --- Actions ---

    const updateTask = (groupId: string, taskId: string, updates: Partial<ITask>) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id !== groupId) return g;
                return {
                    ...g,
                    tasks: g.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
                };
            })
        }));
    };

    const toggleTaskSelection = (groupId: string, taskId: string, selected: boolean) => {
        updateTask(groupId, taskId, { selected });
    };

    const toggleGroupSelection = (groupId: string, selected: boolean) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (groupId !== 'all' && g.id !== groupId) return g;
                return {
                    ...g,
                    tasks: g.tasks.map(t => ({ ...t, selected }))
                };
            })
        }));
    };

    const updateTaskTextValue = (groupId: string, taskId: string, colId: string, value: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id !== groupId) return g;
                return {
                    ...g,
                    tasks: g.tasks.map(t => {
                        if (t.id !== taskId) return t;
                        return {
                            ...t,
                            textValues: { ...t.textValues, [colId]: value }
                        };
                    })
                };
            })
        }));
    };

    const addTask = (groupId: string, title?: string, initialData?: Partial<ITask>) => {
        const newTask: ITask = {
            id: uuidv4(),
            name: title?.trim() || 'New Item',
            status: Status.New,
            priority: Priority.Normal,
            dueDate: '',
            personId: null,
            textValues: {},
            selected: false,
            ...initialData
        };
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => g.id === groupId ? { ...g, tasks: [...g.tasks, newTask] } : g)
        }));
    };

    const deleteTask = (groupId: string, taskId: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g)
        }));
    };

    const addGroup = () => {
        const newGroup: IGroup = {
            id: uuidv4(),
            title: 'New Group',
            color: GROUP_COLORS[board.groups.length % GROUP_COLORS.length],
            columns: [
                { id: 'col_name', title: 'Item', type: 'name', width: '300px' },
                { id: 'col_person', title: 'Owner', type: 'person', width: '96px' },
                { id: 'col_status', title: 'Status', type: 'status', width: '128px' },
                { id: 'col_priority', title: 'Priority', type: 'priority', width: '128px' },
                { id: 'col_date', title: 'Due Date', type: 'date', width: '110px' },
            ],
            tasks: []
        };
        setBoard(prev => ({ ...prev, groups: [...prev.groups, newGroup] }));
    };

    const deleteGroup = (groupId: string) => {
        setBoard(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== groupId) }));
    };

    const updateGroupTitle = (groupId: string, newTitle: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => g.id === groupId ? { ...g, title: newTitle } : g)
        }));
    };

    const toggleGroupPin = (groupId: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => g.id === groupId ? { ...g, isPinned: !g.isPinned } : g)
        }));
    };

    const addColumn = (groupId: string, type: string = 'text', title: string = 'New Column', options?: { id: string; label: string; color: string; }[], currency?: string) => {
        const newColId = `col_${uuidv4().slice(0, 4)}`;
        // Cast type to any to bypass strict check for now, or ensure it matches ColumnType
        const newColumn: IColumn = {
            id: newColId,
            title: title,
            type: type as any,
            width: '140px',
            options: options,
            currency: currency
        };
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => g.id === groupId ? { ...g, columns: [...g.columns, newColumn] } : g)
        }));
    };

    const updateColumnTitle = (groupId: string, colId: string, newTitle: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id !== groupId) return g;
                return {
                    ...g,
                    columns: g.columns.map(c => c.id === colId ? { ...c, title: newTitle } : c)
                };
            })
        }));
    };

    const updateColumnWidth = (groupId: string, colId: string, newWidth: number) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id !== groupId) return g;
                return {
                    ...g,
                    columns: g.columns.map(c => c.id === colId ? { ...c, width: `${newWidth}px` } : c)
                };
            })
        }));
    };

    const deleteColumn = (groupId: string, colId: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id !== groupId) return g;
                return {
                    ...g,
                    columns: g.columns.filter(c => c.id !== colId)
                };
            })
        }));
    };

    const duplicateColumn = (groupId: string, colId: string) => {
        setBoard(prev => ({
            ...prev,
            groups: prev.groups.map(g => {
                if (g.id !== groupId) return g;
                const colIndex = g.columns.findIndex(c => c.id === colId);
                if (colIndex === -1) return g;
                const col = g.columns[colIndex];
                const newCol = { ...col, id: `col_${uuidv4().slice(0, 4)}`, title: `${col.title} (Copy)` };
                const newColumns = [...g.columns];
                newColumns.splice(colIndex + 1, 0, newCol);
                return { ...g, columns: newColumns };
            })
        }));
    };

    const moveColumn = (groupId: string, dragIndex: number, hoverIndex: number) => {
        setBoard(prev => {
            const group = prev.groups.find(g => g.id === groupId);
            if (!group) return prev;

            const newColumns = [...group.columns];
            const [draggedCol] = newColumns.splice(dragIndex, 1);
            newColumns.splice(hoverIndex, 0, draggedCol);

            return {
                ...prev,
                groups: prev.groups.map(g => {
                    if (g.id !== groupId) return g;
                    return { ...g, columns: newColumns };
                })
            };
        });
    };

    const reorderColumn = (groupId: string, fromIndex: number, toIndex: number) => {
        moveColumn(groupId, fromIndex, toIndex);
    };


    // --- AI Features ---

    const handleGeneratePlan = async () => {
        if (!aiPrompt.trim()) return;
        setIsAiLoading(true);
        setAiAnalysis(null);

        const result = await generateProjectPlan(aiPrompt);

        if (result) {
            const today = new Date();
            const newTasks: ITask[] = result.tasks.map(t => {
                const d = new Date(today);
                d.setDate(today.getDate() + t.dueDateOffsetDays);

                return {
                    id: uuidv4(),
                    name: t.name,
                    status: Status.New,
                    priority: (t.priority as Priority) || Priority.Medium,
                    dueDate: d.toISOString().split('T')[0],
                    personId: null,
                    textValues: {}
                };
            });

            const newGroup: IGroup = {
                id: uuidv4(),
                title: result.groupName || 'AI Generated Plan',
                color: GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)],
                tasks: newTasks,
                columns: [
                    { id: 'col_name', title: 'Item', type: 'name', width: '300px' },
                    { id: 'col_person', title: 'Owner', type: 'person', width: '96px' },
                    { id: 'col_status', title: 'Status', type: 'status', width: '128px' },
                    { id: 'col_priority', title: 'Priority', type: 'priority', width: '128px' },
                    { id: 'col_date', title: 'Due Date', type: 'date', width: '110px' },
                ]
            };

            setBoard(prev => ({ ...prev, groups: [newGroup, ...prev.groups] }));
            setAiPrompt('');
        }
        setIsAiLoading(false);
    };

    const handleAnalyzeBoard = async () => {
        setIsAiLoading(true);

        const summary = board.groups.map(g =>
            `Group: ${g.title}. Tasks: ${g.tasks.map(t => `${t.name} (${t.status})`).join(', ')}`
        ).join('\n');

        const result = await analyzeBoardStatus(summary);
        setAiAnalysis(result);
        setIsAiLoading(false);
    };

    return {
        board,
        setBoard,
        aiPrompt,
        setAiPrompt,
        isAiLoading,
        aiAnalysis,
        setAiAnalysis,
        updateTask,
        toggleTaskSelection,
        toggleGroupSelection,
        updateTaskTextValue,
        addTask,
        deleteTask,
        addGroup,
        deleteGroup,
        updateGroupTitle,
        toggleGroupPin,
        addColumn,
        updateColumnTitle,
        updateColumnWidth,
        deleteColumn,
        duplicateColumn,
        moveColumn,
        reorderColumn,
        handleGeneratePlan,
        handleAnalyzeBoard
    };
};
