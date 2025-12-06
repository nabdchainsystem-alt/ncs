
import React, { useState } from 'react';
import { CheckCircle2, Trash2, Archive, Calendar, FolderInput, Bell, ArrowRight, X, Clock, BrainCircuit, ThumbsUp, ThumbsDown, User, Layers } from 'lucide-react';
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

type ProcessingStep = 'initial' | 'not_actionable' | 'actionable_type' | 'delegate_details' | 'defer_details' | 'project_details';

export const GTDClarify = ({ item, onProcess, onCreateProject, onNavigate, projects }: GTDClarifyProps) => {
    const [step, setStep] = useState<ProcessingStep>('initial');
    const [inputVal, setInputVal] = useState('');
    const [dateVal, setDateVal] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Reset on new item
    React.useEffect(() => {
        setStep('initial');
        setInputVal('');
        setDateVal('');
        setIsDatePickerOpen(false);
    }, [item?.id]);

    const handleProcess = (updates: Partial<GTDItem>) => {
        onProcess(item.id, updates);
    };

    const renderCardContent = (title: string, children: React.ReactNode, backAction?: () => void) => (
        <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 relative">
                    <div className="text-3xl font-serif text-stone-800 italic leading-snug mb-4">"{item.text}"</div>
                    {/* Item Meta */}
                    <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-wider text-stone-300">
                        <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>ID #{item.id}</span>
                    </div>
                </div>
            </div>

            <div className="bg-stone-50/50 backdrop-blur-sm rounded-3xl p-8 border border-stone-100 shadow-inner">
                <h4 className="text-xl font-serif text-stone-600 mb-8 text-center italic">{title}</h4>
                {children}
            </div>

            {backAction && (
                <button
                    onClick={backAction}
                    className="mx-auto mt-6 flex items-center gap-2 text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    <ArrowRight className="rotate-180" size={14} /> Back
                </button>
            )}
        </div>
    );

    // --- Content Logic ---
    let content = null;

    if (!item) {
        content = (
            <div className="h-full w-full flex flex-col items-center justify-center text-stone-300 animate-fade-in-up">
                <CheckCircle2 size={96} strokeWidth={0.5} className="mb-8 opacity-20 text-stone-900" />
                <h3 className="text-4xl font-serif text-stone-400 italic mb-4">Inbox Zero</h3>
                <p className="text-stone-400 font-sans tracking-widest uppercase text-xs font-bold">You are clear.</p>
            </div>
        );
    } else if (step === 'initial') {
        content = renderCardContent("Is this actionable?", (
            <div className="grid grid-cols-2 gap-6">
                <button
                    onClick={() => setStep('not_actionable')}
                    className="group bg-white p-8 rounded-2xl border border-stone-200 shadow-sm hover:border-stone-400 hover:shadow-lg transition-all text-center"
                >
                    <ThumbsDown size={32} className="mx-auto mb-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                    <span className="block text-lg font-bold text-stone-700 mb-2">No</span>
                    <span className="text-xs text-stone-400 font-sans">Trash, Reference, or Someday</span>
                </button>

                <button
                    onClick={() => setStep('actionable_type')}
                    className="group bg-stone-900 p-8 rounded-2xl shadow-xl hover:bg-black hover:-translate-y-1 transition-all text-center"
                >
                    <ThumbsUp size={32} className="mx-auto mb-4 text-stone-400 group-hover:text-amber-400 transition-colors" />
                    <span className="block text-lg font-bold text-white mb-2">Yes</span>
                    <span className="text-xs text-stone-400 font-sans">Do, Delegate, Defer, or Project</span>
                </button>
            </div>
        ));
    } else if (step === 'not_actionable') {
        content = renderCardContent("Organize non-actionables", (
            <div className="grid grid-cols-3 gap-4">
                <button
                    onClick={() => handleProcess({ status: 'trash' })}
                    className="bg-white hover:bg-red-50 p-6 rounded-2xl border border-stone-200 hover:border-red-200 transition-all flex flex-col items-center gap-3 group"
                >
                    <Trash2 size={24} className="text-stone-400 group-hover:text-red-500" />
                    <span className="font-bold text-stone-600 group-hover:text-red-700">Trash</span>
                </button>
                <button
                    onClick={() => handleProcess({ status: 'reference' })}
                    className="bg-white hover:bg-blue-50 p-6 rounded-2xl border border-stone-200 hover:border-blue-200 transition-all flex flex-col items-center gap-3 group"
                >
                    <Archive size={24} className="text-stone-400 group-hover:text-blue-500" />
                    <span className="font-bold text-stone-600 group-hover:text-blue-700">Reference</span>
                </button>
                <button
                    onClick={() => handleProcess({ status: 'someday' })}
                    className="bg-white hover:bg-amber-50 p-6 rounded-2xl border border-stone-200 hover:border-amber-200 transition-all flex flex-col items-center gap-3 group"
                >
                    <Clock size={24} className="text-stone-400 group-hover:text-amber-500" />
                    <span className="font-bold text-stone-600 group-hover:text-amber-700">Someday</span>
                </button>
            </div>
        ), () => setStep('initial'));
    } else if (step === 'actionable_type') {
        content = renderCardContent("What is the next step?", (
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <button
                        onClick={() => setStep('project_details')}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 p-4 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-all flex items-center justify-between group px-6"
                    >
                        <div className="flex items-center gap-3">
                            <Layers size={20} className="text-indigo-400 group-hover:text-indigo-600" />
                            <div className="text-left">
                                <span className="block font-bold text-indigo-900">It's a Project</span>
                                <span className="text-xs text-indigo-400">Requires multiple steps</span>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-indigo-300" />
                    </button>
                </div>

                <button
                    onClick={() => handleProcess({ status: 'done' })}
                    className="bg-white hover:bg-emerald-50 p-4 rounded-xl border border-stone-200 hover:border-emerald-200 transition-all flex flex-col items-center gap-2 group"
                >
                    <CheckCircle2 size={24} className="text-stone-400 group-hover:text-emerald-500" />
                    <span className="font-bold text-sm text-stone-600 group-hover:text-emerald-700">Do it (&lt; 2m)</span>
                </button>

                <button
                    onClick={() => setStep('delegate_details')}
                    className="bg-white hover:bg-purple-50 p-4 rounded-xl border border-stone-200 hover:border-purple-200 transition-all flex flex-col items-center gap-2 group"
                >
                    <User size={24} className="text-stone-400 group-hover:text-purple-500" />
                    <span className="font-bold text-sm text-stone-600 group-hover:text-purple-700">Delegate</span>
                </button>

                <button
                    onClick={() => handleProcess({ status: 'actionable' })}
                    className="bg-white hover:bg-stone-50 p-4 rounded-xl border border-stone-200 hover:border-stone-300 transition-all flex flex-col items-center gap-2 group"
                >
                    <CheckCircle2 size={24} className="text-stone-400 group-hover:text-stone-600" />
                    <span className="font-bold text-sm text-stone-600 group-hover:text-stone-800">Next Action</span>
                </button>

                <button
                    onClick={() => setStep('defer_details')}
                    className="bg-white hover:bg-orange-50 p-4 rounded-xl border border-stone-200 hover:border-orange-200 transition-all flex flex-col items-center gap-2 group"
                >
                    <Calendar size={24} className="text-stone-400 group-hover:text-orange-500" />
                    <span className="font-bold text-sm text-stone-600 group-hover:text-orange-700">Defer (Calendar)</span>
                </button>
            </div>
        ), () => setStep('initial'));
    } else if (step === 'delegate_details') {
        content = renderCardContent("Who are you waiting for?", (
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Enter name (e.g., Alice)..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full p-4 bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-serif italic text-lg"
                    autoFocus
                />
                <button
                    disabled={!inputVal.trim()}
                    onClick={() => handleProcess({ status: 'waiting', delegatedTo: inputVal })}
                    className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold tracking-wide hover:bg-black disabled:opacity-50 transition-all"
                >
                    Confirm Waiting For
                </button>
            </div>
        ), () => setStep('actionable_type'));
    } else if (step === 'defer_details') {
        content = renderCardContent("When do you need to see this?", (
            <div className="space-y-4 relative">
                <button
                    onClick={() => setIsDatePickerOpen(true)}
                    className="w-full p-4 bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-serif italic text-lg text-left text-stone-700 flex justify-between items-center"
                >
                    {dateVal ? new Date(dateVal).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "Select Value..."}
                    <Calendar size={20} className="text-stone-400" />
                </button>
                {isDatePickerOpen && (
                    <div className="absolute top-full left-0 mt-2 z-50 shadow-2xl rounded-2xl overflow-hidden">
                        <DatePicker
                            date={dateVal}
                            onSelect={(d) => { setDateVal(d); setIsDatePickerOpen(false); }}
                            onClose={() => setIsDatePickerOpen(false)}
                        />
                    </div>
                )}
                <button
                    disabled={!dateVal}
                    onClick={() => handleProcess({ status: 'actionable', dueDate: new Date(dateVal).getTime() })}
                    className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold tracking-wide hover:bg-black disabled:opacity-50 transition-all"
                >
                    Add to Calendar
                </button>
            </div>
        ), () => setStep('actionable_type'));
    } else if (step === 'project_details') {
        content = renderCardContent("Define the Outcome (Project Name)", (
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="e.g. Vacation in Hawaii..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full p-4 bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 font-serif italic text-lg"
                    autoFocus
                />
                <button
                    disabled={!inputVal.trim()}
                    onClick={() => {
                        onCreateProject(inputVal, [item.text]);
                        onProcess(item.id, { status: 'trash' });
                        onNavigate('organize');
                    }}
                    className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold tracking-wide hover:bg-black disabled:opacity-50 transition-all"
                >
                    Create Project
                </button>
            </div>
        ), () => setStep('actionable_type'));
    }

    return (
        <div className="h-full flex flex-col font-serif p-6 max-w-[90rem] mx-auto w-full">
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-stone-900 uppercase tracking-widest mb-2 select-none">
                    Clarify
                </h1>
            </div>

            <div className="flex-1 w-full min-h-0 relative">
                {content}
            </div>
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
