
import React, { useState } from 'react';
import { CheckCircle2, Trash2, Archive, Calendar, FolderInput, Bell, ArrowRight, X, Clock, BrainCircuit } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';
import { DatePicker } from '../../../tasks/components/DatePicker';

interface GTDClarifyProps {
    item?: GTDItem;
    onProcess: (id: number, updates: Partial<GTDItem>) => void;
    onCreateProject: (name: string, initialTasks: string[]) => void;
    onNavigate: (tab: 'organize') => void;
    projects: Project[];
    hasMore: boolean;
}

type Step = 'identify_type' | 'reminder_details' | 'project_details' | 'task_details';

export const GTDClarify = ({ item, onProcess, onCreateProject, onNavigate, projects, hasMore }: GTDClarifyProps) => {
    const [step, setStep] = useState<Step>('identify_type');
    const [projectInput, setProjectInput] = useState('');
    const [reminderDate, setReminderDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Reset when item changes
    React.useEffect(() => {
        setStep('identify_type');
        setProjectInput('');
        setReminderDate('');
        setReminderTime('');
        setIsDatePickerOpen(false);
    }, [item?.id]);

    if (!item) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-stone-300 animate-fade-in-up">
                <CheckCircle2 size={64} strokeWidth={1} className="mb-6 opacity-30" />
                <p className="text-2xl font-serif italic mb-2">Inbox Zero!</p>
                <p className="text-sm font-sans">You've processed everything. Time to engage.</p>
            </div>
        );
    }

    // -- Handlers --

    const updateStatus = (status: GTDItem['status'], extra: Partial<GTDItem> = {}) => {
        onProcess(item.id, { status, ...extra });
    };

    const handleTypeSelect = (type: 'task' | 'reminder' | 'project' | 'reference' | 'trash') => {
        switch (type) {
            case 'task':
                updateStatus('actionable', { dueDate: undefined });
                onNavigate('organize');
                break;
            case 'reminder':
                setStep('reminder_details');
                break;
            case 'project':
                setStep('project_details');
                break;
            case 'reference':
                updateStatus('reference');
                break;
            case 'trash':
                updateStatus('trash');
                break;
        }
    };

    const handleCreateProjectConfirm = () => {
        if (projectInput.trim()) {
            onCreateProject(projectInput, [item.text]);
            onProcess(item.id, { status: 'trash' }); // Remove from inbox as it became a project
            setProjectInput('');
        }
    };

    const handleReminderConfirm = () => {
        // Convert date/time string to timestamp for now, or just store as string if our types allow?
        // Our type has dueDate?: number (timestamp).
        const dateStr = reminderDate || new Date().toISOString().split('T')[0];
        const timeStr = reminderTime || '09:00';
        const timestamp = new Date(dateStr + 'T' + timeStr).getTime();

        updateStatus('actionable', {
            dueDate: timestamp,
            time: '5m' // Default small time for reminders
        });
        onNavigate('organize');
    };

    // -- Render Steps --

    const renderHeader = () => (
        <div className="text-center mb-8 max-w-lg z-10 w-full animate-fade-in-down">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block font-sans">Step 2</span>
            <h3 className="text-5xl font-serif text-stone-900 mb-6 tracking-tight italic">Clarify</h3>

            <div className="bg-white px-8 py-6 rounded-2xl shadow-xl border border-stone-100 transform -rotate-1 relative mx-auto max-w-md hover:rotate-0 transition-transform duration-500">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-900 text-white p-2 rounded-full shadow-lg border-4 border-stone-50">
                    <BrainCircuit size={20} />
                </div>
                <p className="text-2xl text-stone-800 italic leading-snug font-serif">"{item.text}"</p>
            </div>
        </div>
    );

    const renderIdentifyType = () => (
        <div className="w-full max-w-4xl animate-fade-in-up">
            <p className="text-center text-stone-500 font-serif italic text-xl mb-8">What is this?</p>
            <div className="grid grid-cols-5 gap-4">

                {/* Task */}
                <button onClick={() => handleTypeSelect('task')} className="flex flex-col items-center p-6 bg-white border-2 border-stone-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 hover:-translate-y-1 transition-all group">
                    <div className="p-4 bg-stone-100 rounded-full mb-4 group-hover:bg-emerald-200 text-stone-400 group-hover:text-emerald-700 transition-colors">
                        <CheckCircle2 size={24} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-stone-600 group-hover:text-emerald-800">Task</span>
                </button>

                {/* Reminder */}
                <button onClick={() => handleTypeSelect('reminder')} className="flex flex-col items-center p-6 bg-white border-2 border-stone-100 rounded-2xl hover:border-amber-500 hover:bg-amber-50 hover:-translate-y-1 transition-all group">
                    <div className="p-4 bg-stone-100 rounded-full mb-4 group-hover:bg-amber-200 text-stone-400 group-hover:text-amber-700 transition-colors">
                        <Bell size={24} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-stone-600 group-hover:text-amber-800">Reminder</span>
                </button>

                {/* Project */}
                <button onClick={() => handleTypeSelect('project')} className="flex flex-col items-center p-6 bg-white border-2 border-stone-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 hover:-translate-y-1 transition-all group">
                    <div className="p-4 bg-stone-100 rounded-full mb-4 group-hover:bg-indigo-200 text-stone-400 group-hover:text-indigo-700 transition-colors">
                        <FolderInput size={24} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-stone-600 group-hover:text-indigo-800">Project</span>
                </button>

                {/* Reference */}
                <button onClick={() => handleTypeSelect('reference')} className="flex flex-col items-center p-6 bg-white border-2 border-stone-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 hover:-translate-y-1 transition-all group">
                    <div className="p-4 bg-stone-100 rounded-full mb-4 group-hover:bg-blue-200 text-stone-400 group-hover:text-blue-700 transition-colors">
                        <Archive size={24} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-stone-600 group-hover:text-blue-800">Reference</span>
                </button>

                {/* Trash */}
                <button onClick={() => handleTypeSelect('trash')} className="flex flex-col items-center p-6 bg-white border-2 border-stone-100 rounded-2xl hover:border-red-500 hover:bg-red-50 hover:-translate-y-1 transition-all group">
                    <div className="p-4 bg-stone-100 rounded-full mb-4 group-hover:bg-red-200 text-stone-400 group-hover:text-red-700 transition-colors">
                        <Trash2 size={24} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-stone-600 group-hover:text-red-800">Trash</span>
                </button>
            </div>
        </div>
    );

    const renderReminderDetails = () => (
        <div className="w-full max-w-md animate-fade-in-up">
            <p className="text-center text-stone-500 font-serif italic text-xl mb-6">When should I remind you?</p>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xl space-y-4">
                <div>
                    <div className="relative">
                        <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Date</label>
                        <button
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:border-stone-900 outline-none font-sans text-left flex items-center gap-2 hover:bg-stone-100 transition-colors"
                        >
                            <Calendar size={16} className="text-stone-400" />
                            <span className={reminderDate ? "text-stone-900" : "text-stone-400 italic"}>
                                {reminderDate ? new Date(reminderDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "Select a date..."}
                            </span>
                        </button>
                        {isDatePickerOpen && (
                            <div className="absolute top-full left-0 mt-2 z-50">
                                <DatePicker
                                    date={reminderDate}
                                    onSelect={(d) => setReminderDate(d)}
                                    onClose={() => setIsDatePickerOpen(false)}
                                    className="border-stone-200 shadow-xl"
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Time</label>
                    <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:border-stone-900 outline-none font-sans"
                    />
                </div>
                <button
                    onClick={handleReminderConfirm}
                    className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold tracking-wide hover:bg-black mt-4 flex items-center justify-center gap-2"
                >
                    <Bell size={18} />
                    Set Reminder
                </button>
            </div>
            <button onClick={() => setStep('identify_type')} className="w-full mt-6 text-stone-400 text-sm hover:text-stone-900">Back</button>
        </div>
    );

    const renderProjectDetails = () => (
        <div className="w-full max-w-lg animate-fade-in-up">
            <p className="text-center text-stone-500 font-serif italic text-xl mb-6">Name your project</p>
            <div className="bg-white p-2 rounded-2xl border-2 border-stone-900 shadow-xl flex items-center">
                <input
                    type="text"
                    value={projectInput}
                    onChange={(e) => setProjectInput(e.target.value)}
                    placeholder="e.g. Plan Summer Vacation"
                    className="flex-1 px-4 py-3 text-lg font-serif outline-none bg-transparent placeholder:italic"
                    autoFocus
                />
                <button
                    onClick={handleCreateProjectConfirm}
                    disabled={!projectInput.trim()}
                    className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-black disabled:opacity-50 transition-colors"
                >
                    Create
                </button>
            </div>
            <button onClick={() => setStep('identify_type')} className="w-full mt-8 text-stone-400 text-sm hover:text-stone-900">Back</button>
        </div>
    );

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 font-serif relative overflow-y-auto">
            {renderHeader()}

            {step === 'identify_type' && renderIdentifyType()}
            {step === 'reminder_details' && renderReminderDetails()}
            {step === 'project_details' && renderProjectDetails()}
        </div>
    );
};

// Helper icon
const Inbox = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
)
