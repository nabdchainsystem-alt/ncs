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
                    if (parsed?.columns && parsed?.groups) return parsed as IBoard;
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
            tasks: []
        };
        setBoard(prev => ({ ...prev, groups: [newGroup, ...prev.groups] }));
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

    const addColumn = (type: string = 'text', title: string = 'New Column') => {
        const newColId = `col_${uuidv4().slice(0, 4)}`;
        // Cast type to any to bypass strict check for now, or ensure it matches ColumnType
        const newColumn: IColumn = {
            id: newColId,
            title: title,
            type: type as any,
            width: '140px'
        };
        setBoard(prev => ({
            ...prev,
            columns: [...prev.columns, newColumn]
        }));
    };

    const updateColumnTitle = (colId: string, newTitle: string) => {
        setBoard(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === colId ? { ...c, title: newTitle } : c)
        }));
    };

    const deleteColumn = (colId: string) => {
        setBoard(prev => ({
            ...prev,
            columns: prev.columns.filter(c => c.id !== colId)
        }));
    };

    const duplicateColumn = (colId: string) => {
        setBoard(prev => {
            const colIndex = prev.columns.findIndex(c => c.id === colId);
            if (colIndex === -1) return prev;

            const col = prev.columns[colIndex];
            const newCol: IColumn = {
                ...col,
                id: `col_${uuidv4().slice(0, 4)}`,
                title: `${col.title} Copy`
            };

            const newColumns = [...prev.columns];
            newColumns.splice(colIndex + 1, 0, newCol);

            return {
                ...prev,
                columns: newColumns
            };
        });
    };

    const moveColumn = (colId: string, direction: 'left' | 'right' | 'start' | 'end') => {
        setBoard(prev => {
            const currentIndex = prev.columns.findIndex(c => c.id === colId);
            if (currentIndex === -1) return prev;

            const newColumns = [...prev.columns];
            const col = newColumns[currentIndex];
            newColumns.splice(currentIndex, 1);

            if (direction === 'start') {
                newColumns.unshift(col);
            } else if (direction === 'end') {
                newColumns.push(col);
            } else if (direction === 'left') {
                const newIndex = Math.max(0, currentIndex - 1);
                newColumns.splice(newIndex, 0, col);
            } else if (direction === 'right') {
                const newIndex = Math.min(newColumns.length, currentIndex + 1);
                newColumns.splice(newIndex, 0, col);
            }

            return { ...prev, columns: newColumns };
        });
    };

    const reorderColumn = (fromIndex: number, toIndex: number) => {
        setBoard(prev => {
            // Prevent moving the first column (Name) or moving anything to the first position
            if (fromIndex === 0 || toIndex === 0) return prev;
            if (fromIndex === toIndex) return prev;

            const newColumns = [...prev.columns];
            const [movedCol] = newColumns.splice(fromIndex, 1);
            newColumns.splice(toIndex, 0, movedCol);

            return { ...prev, columns: newColumns };
        });
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
                tasks: newTasks
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
        deleteColumn,
        duplicateColumn,
        moveColumn,
        reorderColumn,
        handleGeneratePlan,
        handleAnalyzeBoard
    };
};
