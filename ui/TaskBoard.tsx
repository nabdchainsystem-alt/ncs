
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type, Schema } from "@google/genai";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export enum Status {
    Done = 'Done',
    Working = 'Working on it',
    Stuck = 'Stuck',
    Empty = ''
}

export enum Priority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
    Empty = ''
}

export type ColumnType = 'name' | 'person' | 'status' | 'priority' | 'date' | 'text';

export interface IColumn {
    id: string;
    title: string;
    type: ColumnType;
    width: string;
}

export interface IPerson {
    id: string;
    name: string;
    initials: string;
    color: string; // Tailwind class or hex
}

export interface ITask {
    id: string;
    name: string;
    status: Status;
    priority: Priority;
    dueDate: string;
    personId: string | null;
    textValues: Record<string, string>; // For dynamic text columns: key is column.id
}

export interface IGroup {
    id: string;
    title: string;
    color: string; // Hex color for the group side border
    tasks: ITask[];
}

export interface IBoard {
    id: string;
    name: string;
    columns: IColumn[];
    groups: IGroup[];
}

export type AIGeneratedTask = {
    name: string;
    priority: string;
    dueDateOffsetDays: number; // How many days from now
};

export interface DragItem {
    taskId: string;
    groupId: string;
}

// ==========================================
// 2. CONSTANTS & CONFIG
// ==========================================

// Monday.com inspired vibrant colors
export const STATUS_COLORS: Record<Status, string> = {
    [Status.Done]: 'bg-[#00C875] hover:bg-[#00B66A] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Status.Working]: 'bg-[#FDAB3D] hover:bg-[#E69A35] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Status.Stuck]: 'bg-[#E2445C] hover:bg-[#CE3D53] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Status.Empty]: 'bg-[#C4C4C4] hover:bg-[#B0B0B0] text-white',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
    [Priority.High]: 'bg-[#333333] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Priority.Medium]: 'bg-[#401694] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Priority.Low]: 'bg-[#579BFC] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Priority.Empty]: 'bg-[#C4C4C4] text-white',
};

export const GROUP_COLORS = [
    '#579bfc', // Blue
    '#00c875', // Green
    '#ffcb00', // Yellow
    '#ff5ac4', // Pink
    '#a25ddc', // Purple
    '#0086c0', // Dark Blue
    '#784bd1', // Deep Purple
];

export const PEOPLE: IPerson[] = [
    { id: 'p1', name: 'Alex', initials: 'AL', color: 'bg-blue-500' },
    { id: 'p2', name: 'Sam', initials: 'SA', color: 'bg-amber-500' },
    { id: 'p3', name: 'Jordan', initials: 'JO', color: 'bg-purple-600' },
    { id: 'p4', name: 'Taylor', initials: 'TA', color: 'bg-emerald-500' },
    { id: 'p5', name: 'Casey', initials: 'CA', color: 'bg-rose-500' },
    { id: 'p6', name: 'Drew', initials: 'DR', color: 'bg-indigo-500' },
];

const INITIAL_DATA: IBoard = {
    id: 'board-1',
    name: 'Marketing Campaign Launch',
    columns: [
        { id: 'col_name', title: 'Item', type: 'name', width: '380px' },
        { id: 'col_person', title: 'Owner', type: 'person', width: '100px' },
        { id: 'col_status', title: 'Status', type: 'status', width: '140px' },
        { id: 'col_priority', title: 'Priority', type: 'priority', width: '140px' },
        { id: 'col_date', title: 'Due Date', type: 'date', width: '120px' },
    ],
    groups: [
        {
            id: 'group-1',
            title: 'Planning Phase',
            color: GROUP_COLORS[0],
            tasks: [
                { id: 't1', name: 'Define Target Audience', status: Status.Working, priority: Priority.High, dueDate: '2024-06-01', personId: 'p1', textValues: {} },
                { id: 't2', name: 'Competitor Analysis', status: Status.Done, priority: Priority.Medium, dueDate: '2024-05-28', personId: 'p2', textValues: {} },
            ],
        },
        {
            id: 'group-2',
            title: 'Execution',
            color: GROUP_COLORS[3],
            tasks: [
                { id: 't3', name: 'Social Media Content', status: Status.Empty, priority: Priority.High, dueDate: '2024-06-15', personId: 'p4', textValues: {} },
            ],
        },
    ],
};

// ==========================================
// 3. AI SERVICE LOGIC
// ==========================================

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
const modelId = 'gemini-2.5-flash';

const taskSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        tasks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "A concise, actionable task name." },
                    priority: { type: Type.STRING, description: "Priority level: 'High', 'Medium', or 'Low'." },
                    dueDateOffsetDays: { type: Type.INTEGER, description: "Suggested due date as number of days from today (e.g., 2 for 2 days from now)." }
                },
                required: ["name", "priority", "dueDateOffsetDays"]
            }
        },
        groupName: { type: Type.STRING, description: "A suggested title for this group of tasks." }
    },
    required: ["tasks", "groupName"]
};

const generateProjectPlan = async (goal: string): Promise<{ tasks: AIGeneratedTask[], groupName: string } | null> => {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Create a project plan for the following goal: "${goal}". Break it down into 3-6 actionable tasks.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: taskSchema,
                systemInstruction: "You are an expert project manager using a Monday.com style workflow. Be concise and actionable."
            }
        });

        const text = response.text;
        if (!text) return null;

        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error("Error generating plan:", error);
        return null;
    }
};

const analyzeBoardStatus = async (boardSummary: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Analyze this project board summary and give me a 1-sentence executive summary and 2 bullet points of advice/risks:\n\n${boardSummary}`,
            config: {
                systemInstruction: "You are a helpful Agile Coach. Keep it brief, encouraging, but realistic."
            }
        });
        return response.text || "Could not analyze board.";
    } catch (error) {
        console.error("Error analyzing board:", error);
        return "Error connecting to AI assistant.";
    }
};

// ==========================================
// 4. ICONS
// ==========================================

const PlusIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const TrashIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const SparklesIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

const UserIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
    </svg>
);

// ==========================================
// 5. SUB-COMPONENTS
// ==========================================

interface StatusCellProps {
    status: Status;
    onChange: (newStatus: Status) => void;
}

const StatusCell: React.FC<StatusCellProps> = ({ status, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
        });
        setIsOpen(!isOpen);
    };

    return (
        <>
            <div className="relative w-full h-full">
                <div
                    onClick={toggleDropdown}
                    className={`w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 text-xs font-medium text-white relative group ${STATUS_COLORS[status] || STATUS_COLORS[Status.Empty]}`}
                >
                    {/* Corner fold effect for selection hint */}
                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-black/10 opacity-0 group-hover:opacity-100 clip-triangle transition-opacity"></div>
                    <span className="truncate px-1">{status || <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase">Set Status</span>}</span>
                </div>
            </div>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed z-50 bg-white shadow-2xl rounded-lg border border-gray-200 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1"
                        style={{
                            top: coords.top + 4,
                            left: coords.left - (160 - coords.width) / 2,
                            width: '160px'
                        }}
                    >
                        {Object.values(Status).map((s) => (
                            <div
                                key={s}
                                onClick={() => {
                                    onChange(s);
                                    setIsOpen(false);
                                }}
                                className={`px-3 py-2.5 text-xs cursor-pointer hover:brightness-95 rounded text-center font-medium transition-all shadow-sm ${STATUS_COLORS[s] || "bg-gray-100 text-gray-600"}`}
                            >
                                {s || "Empty"}
                            </div>
                        ))}
                    </div>
                </>,
                document.body
            )}
        </>
    );
};

interface PriorityCellProps {
    priority: Priority;
    onChange: (newPriority: Priority) => void;
}

const PriorityCell: React.FC<PriorityCellProps> = ({ priority, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
        });
        setIsOpen(!isOpen);
    };

    return (
        <>
            <div className="relative w-full h-full">
                <div
                    onClick={toggleDropdown}
                    className={`w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 text-xs font-medium relative group ${PRIORITY_COLORS[priority] || PRIORITY_COLORS[Priority.Empty]}`}
                >
                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-black/10 opacity-0 group-hover:opacity-100 clip-triangle transition-opacity"></div>
                    <span className="truncate px-1">{priority || <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase">Set</span>}</span>
                </div>
            </div>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed z-50 bg-white shadow-2xl rounded-lg border border-gray-200 p-1.5 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1"
                        style={{
                            top: coords.top + 4,
                            left: coords.left - (140 - coords.width) / 2,
                            width: '140px'
                        }}
                    >
                        {Object.values(Priority).map((p) => (
                            <div
                                key={p}
                                onClick={() => {
                                    onChange(p);
                                    setIsOpen(false);
                                }}
                                className={`px-2 py-2 text-xs cursor-pointer hover:brightness-90 rounded text-center font-medium transition-all shadow-sm ${PRIORITY_COLORS[p] || "bg-gray-100 text-gray-600"}`}
                            >
                                {p || "Empty"}
                            </div>
                        ))}
                    </div>
                </>,
                document.body
            )}
        </>
    );
};

interface PersonCellProps {
    personId: string | null;
    onChange: (newPersonId: string | null) => void;
}

const PersonCell: React.FC<PersonCellProps> = ({ personId, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const selectedPerson = PEOPLE.find(p => p.id === personId);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX - (90) // Center align approx
        });
        setIsOpen(!isOpen);
    };

    return (
        <>
            <div className="relative w-full h-full flex justify-center items-center group">
                <div
                    onClick={toggleDropdown}
                    className="cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95"
                >
                    {selectedPerson ? (
                        <div className={`w-7 h-7 rounded-full ${selectedPerson.color} text-white text-[10px] flex items-center justify-center font-bold border-2 border-white shadow-sm`} title={selectedPerson.name}>
                            {selectedPerson.initials}
                        </div>
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 border border-transparent hover:border-gray-300 transition-colors">
                            <UserIcon className="w-4 h-4" />
                        </div>
                    )}

                    {!selectedPerson && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                            <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center">
                                <span className="text-black/50 text-lg leading-none pb-1">+</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed z-50 bg-white shadow-2xl rounded-xl border border-gray-200 p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1 min-w-[180px]"
                        style={{ top: coords.top, left: coords.left }}
                    >
                        <div className="text-xs font-semibold text-gray-400 mb-1 px-2 uppercase tracking-wider py-1">Select Person</div>
                        {PEOPLE.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => {
                                    onChange(p.id);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors ${personId === p.id ? 'bg-blue-50' : ''}`}
                            >
                                <div className={`w-6 h-6 rounded-full ${p.color} text-white text-[10px] flex items-center justify-center font-bold`}>
                                    {p.initials}
                                </div>
                                <span className="text-sm text-gray-700 font-medium">{p.name}</span>
                                {personId === p.id && <span className="ml-auto text-blue-500">✓</span>}
                            </div>
                        ))}
                        <div className="border-t border-gray-100 my-1"></div>
                        <div
                            onClick={() => {
                                onChange(null);
                                setIsOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-red-50 text-red-500 text-sm rounded-lg cursor-pointer flex items-center gap-2 transition-colors"
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-xs">✕</span>
                            Clear Selection
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
};

// ==========================================
// 6. MAIN APP COMPONENT
// ==========================================

const TaskBoard: React.FC = () => {
    const [board, setBoard] = useState<IBoard>(INITIAL_DATA);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    // Drag and Drop State
    const dragItem = useRef<DragItem | null>(null);
    const dragNode = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // --- Handlers ---

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

    const addTask = (groupId: string) => {
        const newTask: ITask = {
            id: uuidv4(),
            name: 'New Item',
            status: Status.Empty,
            priority: Priority.Empty,
            dueDate: '',
            personId: null,
            textValues: {}
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

    // --- Column Management ---

    const addColumn = () => {
        const newColId = `col_${uuidv4().slice(0, 4)}`;
        const newColumn: IColumn = {
            id: newColId,
            title: 'New Text',
            type: 'text',
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

    // --- Drag and Drop Logic ---

    const handleDragStart = (e: React.DragEvent, params: DragItem) => {
        dragItem.current = params;
        dragNode.current = e.currentTarget as HTMLDivElement;
        setTimeout(() => setIsDragging(true), 0);
    };

    const handleDragEnter = (e: React.DragEvent, params: DragItem) => {
        e.preventDefault();
        const currentItem = dragItem.current;

        // Strict check to prevent flicker
        if (!currentItem || currentItem.taskId === params.taskId) return;

        dragItem.current = params;

        setBoard(oldBoard => {
            const newGroups = JSON.parse(JSON.stringify(oldBoard.groups));

            const sourceGroupIdx = newGroups.findIndex((g: IGroup) => g.id === currentItem.groupId);
            const destGroupIdx = newGroups.findIndex((g: IGroup) => g.id === params.groupId);

            if (sourceGroupIdx === -1 || destGroupIdx === -1) return oldBoard;

            const sourceGroup = newGroups[sourceGroupIdx];
            const destGroup = newGroups[destGroupIdx];

            const sourceTaskIdx = sourceGroup.tasks.findIndex((t: ITask) => t.id === currentItem.taskId);
            const destTaskIdx = destGroup.tasks.findIndex((t: ITask) => t.id === params.taskId);

            if (sourceTaskIdx === -1 || destTaskIdx === -1) return oldBoard;

            if (sourceGroup.id === destGroup.id) {
                const [removed] = sourceGroup.tasks.splice(sourceTaskIdx, 1);
                sourceGroup.tasks.splice(destTaskIdx, 0, removed);
            } else {
                const [removed] = sourceGroup.tasks.splice(sourceTaskIdx, 1);
                destGroup.tasks.splice(destTaskIdx, 0, removed);
            }

            return { ...oldBoard, groups: newGroups };
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        dragItem.current = null;
        dragNode.current = null;
    };

    const getDragStyle = (taskId: string) => {
        if (dragItem.current?.taskId === taskId) {
            return "opacity-40 bg-gray-50 grayscale";
        }
        return "";
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
                    status: Status.Empty,
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

    // --- Render Helpers ---

    const calculateProgress = (tasks: ITask[]) => {
        if (tasks.length === 0) return { done: 0, working: 0, stuck: 0 };
        const total = tasks.length;
        const done = tasks.filter(t => t.status === Status.Done).length;
        const working = tasks.filter(t => t.status === Status.Working).length;
        const stuck = tasks.filter(t => t.status === Status.Stuck).length;

        return {
            done: (done / total) * 100,
            working: (working / total) * 100,
            stuck: (stuck / total) * 100,
        };
    };

    const gridTemplate = `${board.columns.map(c => c.width).join(' ')} 50px`;

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans text-gray-800">

            {/* Sidebar Navigation */}
            <aside className="w-16 flex-shrink-0 bg-[#292f4c] flex flex-col items-center py-4 text-white border-r border-gray-700 z-40 transition-all">
                <div className="bg-indigo-600 p-2.5 rounded-xl mb-6 cursor-pointer hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div className="flex-1 space-y-4">
                    <div className="p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"><SparklesIcon className="text-yellow-400" /></div>
                </div>
                <div className="mb-4 p-2 hover:bg-white/10 rounded-full cursor-pointer bg-white/5">
                    <UserIcon />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#eceff8]">

                {/* Header */}
                <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-20">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{board.name}</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleAnalyzeBoard}
                            disabled={isAiLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-full hover:shadow-md hover:scale-105 transition-all text-sm font-semibold border border-indigo-100">
                            <SparklesIcon className="w-4 h-4" />
                            {isAiLoading ? 'Thinking...' : 'Analyze Board'}
                        </button>
                        <button
                            onClick={addGroup}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium shadow-sm">
                            <PlusIcon className="w-4 h-4" /> New Group
                        </button>
                    </div>
                </header>

                {/* Scrolling Board Content */}
                <div className="flex-1 overflow-auto custom-scroll p-8 pb-40">

                    {/* AI Output Section */}
                    {aiAnalysis && (
                        <div className="mb-8 p-6 bg-white border border-indigo-100 rounded-2xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
                            <h3 className="text-indigo-900 font-bold text-lg mb-3 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-indigo-500" /> AI Assistant Insights</h3>
                            <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{aiAnalysis}</p>
                            <button onClick={() => setAiAnalysis(null)} className="mt-4 text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wider">Dismiss</button>
                        </div>
                    )}

                    {/* Render Groups */}
                    <div className="space-y-12">
                        {board.groups.map((group) => {
                            const progress = calculateProgress(group.tasks);

                            return (
                                <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200/80 relative flex flex-col">

                                    {/* Group Header */}
                                    <div className="flex items-center px-4 py-4 relative rounded-t-xl bg-white z-10">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                className="cursor-pointer hover:bg-gray-100 p-1.5 rounded transition-colors group/menu relative"
                                            >
                                                <svg className="w-4 h-4 text-gray-400 group-hover/menu:text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </div>
                                            <input
                                                value={group.title}
                                                onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                                                className="text-xl font-bold bg-transparent border border-transparent hover:border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 focus:bg-white w-full max-w-md transition-all"
                                                style={{ color: group.color }}
                                            />
                                            <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded-full">{group.tasks.length} items</span>
                                        </div>
                                        <button onClick={() => deleteGroup(group.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Columns Header */}
                                    <div className="sticky top-0 z-30 bg-white" style={{ boxShadow: '0 2px 5px -2px rgba(0,0,0,0.05)' }}>
                                        <div className="grid gap-px bg-gray-200 border-y border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ gridTemplateColumns: gridTemplate }}>
                                            {board.columns.map((col) => (
                                                <div key={col.id} className="relative group bg-gray-50/80 backdrop-blur-sm hover:bg-gray-100 transition-colors">
                                                    <input
                                                        value={col.title}
                                                        onChange={(e) => updateColumnTitle(col.id, e.target.value)}
                                                        className="w-full h-full bg-transparent px-3 py-2.5 text-center focus:outline-none focus:bg-white focus:text-gray-800 border-b-2 border-transparent focus:border-blue-500"
                                                        style={{ textAlign: col.type === 'name' ? 'left' : 'center' }}
                                                    />
                                                </div>
                                            ))}
                                            {/* Add Column Button Cell */}
                                            <div
                                                className="bg-gray-50/80 flex items-center justify-center hover:bg-blue-50 cursor-pointer transition-colors group"
                                                onClick={addColumn}
                                                title="Add Column"
                                            >
                                                <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:scale-110" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tasks List with Drag & Drop */}
                                    <div className="divide-y divide-gray-100 relative z-0 min-h-[10px]">
                                        {group.tasks.map((task, index) => (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, { taskId: task.id, groupId: group.id })}
                                                onDragEnter={isDragging ? (e) => handleDragEnter(e, { taskId: task.id, groupId: group.id }) : undefined}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(e) => e.preventDefault()}
                                                className={`grid gap-px bg-white hover:bg-gray-50/50 group/row text-sm transition-colors relative ${getDragStyle(task.id)}`}
                                                style={{ gridTemplateColumns: gridTemplate }}
                                            >

                                                {/* Render Cells based on Columns */}
                                                {board.columns.map((col) => {
                                                    const isName = col.type === 'name';

                                                    return (
                                                        <div key={col.id} className={`relative border-r border-gray-100 flex items-center ${isName ? 'justify-start pl-2' : 'justify-center'} min-h-[38px] bg-white group-hover/row:bg-[#f8f9fa] transition-colors`}>

                                                            {isName && (
                                                                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: group.color }}></div>
                                                            )}

                                                            {/* Drag Handle for Name Column */}
                                                            {isName && (
                                                                <div className="cursor-grab active:cursor-grabbing text-gray-300 mr-2 opacity-0 group-hover/row:opacity-100 hover:text-gray-500 p-1">
                                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                                                </div>
                                                            )}

                                                            {col.type === 'name' && (
                                                                <input
                                                                    value={task.name}
                                                                    onChange={(e) => updateTask(group.id, task.id, { name: e.target.value })}
                                                                    className="w-full px-2 py-1.5 bg-transparent focus:outline-none text-gray-700 font-medium truncate"
                                                                />
                                                            )}

                                                            {col.type === 'person' && (
                                                                <PersonCell
                                                                    personId={task.personId}
                                                                    onChange={(pid) => updateTask(group.id, task.id, { personId: pid })}
                                                                />
                                                            )}

                                                            {col.type === 'status' && (
                                                                <div className="w-[90%] h-[80%]">
                                                                    <StatusCell
                                                                        status={task.status}
                                                                        onChange={(s) => updateTask(group.id, task.id, { status: s })}
                                                                    />
                                                                </div>
                                                            )}

                                                            {col.type === 'priority' && (
                                                                <div className="w-[90%] h-[80%]">
                                                                    <PriorityCell
                                                                        priority={task.priority}
                                                                        onChange={(p) => updateTask(group.id, task.id, { priority: p })}
                                                                    />
                                                                </div>
                                                            )}

                                                            {col.type === 'date' && (
                                                                <input
                                                                    type="date"
                                                                    value={task.dueDate}
                                                                    onChange={(e) => updateTask(group.id, task.id, { dueDate: e.target.value })}
                                                                    className="bg-transparent text-xs text-gray-500 focus:outline-none w-full text-center cursor-pointer hover:text-gray-800 font-medium"
                                                                />
                                                            )}

                                                            {col.type === 'text' && (
                                                                <input
                                                                    type="text"
                                                                    value={task.textValues[col.id] || ''}
                                                                    onChange={(e) => updateTaskTextValue(group.id, task.id, col.id, e.target.value)}
                                                                    className="w-full h-full text-center px-2 bg-transparent focus:outline-none text-gray-600"
                                                                    placeholder="-"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Delete Row Action */}
                                                <div className="flex items-center justify-center border-l border-gray-100 bg-white opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => deleteTask(group.id, task.id)}
                                                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all">
                                                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Item Row */}
                                    <div className="grid gap-px bg-white border-t border-gray-200" style={{ gridTemplateColumns: gridTemplate }}>
                                        <div className="flex items-center pl-10 py-2 border-r border-gray-100 relative hover:bg-gray-50 transition-colors">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-bl-xl" style={{ backgroundColor: group.color, opacity: 0.3 }}></div>
                                            <input
                                                type="text"
                                                placeholder="+ Add Item"
                                                className="w-full text-sm focus:outline-none text-gray-500 placeholder-gray-400 bg-transparent"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addTask(group.id);
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        {/* Empty cells for other columns in footer */}
                                        {board.columns.slice(1).map(c => <div key={c.id} className="border-r border-gray-100 bg-gray-50/20"></div>)}
                                        <div className="bg-gray-50/20"></div>
                                    </div>

                                    {/* Group Summary Footer (Progress Bar) */}
                                    <div className="bg-white border-t border-gray-200 rounded-b-xl p-3 flex items-center gap-4">
                                        <div className="w-32"></div> {/* Spacer for alignment roughly */}
                                        <div className="flex-1 h-8 rounded flex overflow-hidden bg-gray-100 max-w-md border border-gray-200">
                                            {progress.done > 0 && <div className="bg-[#00C875] flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500" style={{ width: `${progress.done}%` }} title={`Done: ${Math.round(progress.done)}%`}>{Math.round(progress.done)}%</div>}
                                            {progress.working > 0 && <div className="bg-[#FDAB3D] flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500" style={{ width: `${progress.working}%` }} title={`Working: ${Math.round(progress.working)}%`}>{Math.round(progress.working)}%</div>}
                                            {progress.stuck > 0 && <div className="bg-[#E2445C] flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500" style={{ width: `${progress.stuck}%` }} title={`Stuck: ${Math.round(progress.stuck)}%`}>{Math.round(progress.stuck)}%</div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Floating AI Assistant Bar */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-40">
                    <div className="bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-white/50 p-2 flex items-center gap-3 pl-5 transition-all focus-within:ring-4 ring-indigo-500/10">
                        <SparklesIcon className="text-indigo-500 w-5 h-5 animate-pulse" />
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGeneratePlan()}
                            placeholder="Ask AI to build a plan (e.g. 'Plan a product launch for next month')"
                            className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 py-2 placeholder-gray-500"
                        />
                        <button
                            onClick={handleGeneratePlan}
                            disabled={isAiLoading || !aiPrompt}
                            className="bg-indigo-600 text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:shadow-lg flex items-center gap-2">
                            {isAiLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <span>Generate</span>
                            )}
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default TaskBoard;
