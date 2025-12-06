import React from 'react';
import { Check, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDClarifyProps {
    item?: GTDItem;
    onProcess: (id: number, updates: Partial<GTDItem>) => void;
    projects: Project[];
}

export const GTDClarify = ({ item, onProcess, projects }: GTDClarifyProps) => {
    const [step, setStep] = React.useState<'initial' | 'action_details'>('initial');
    const [context, setContext] = React.useState('office');

    // Reset step when item changes
    React.useEffect(() => {
        setStep('initial');
    }, [item?.id]);

    const handleTrash = () => {
        if (item) onProcess(item.id, { status: 'trash' });
    };

    const handleReference = () => {
        if (item) onProcess(item.id, { status: 'reference' });
    };

    const handleDoIt = () => {
        // Simple "Do it now" if < 2 mins (mark done)
        if (item) onProcess(item.id, { status: 'done' });
    };

    const handleActionable = () => {
        setStep('action_details');
    };

    const handleSaveAction = () => {
        if (item) {
            onProcess(item.id, {
                status: 'actionable',
                contextId: context,
                energy: 'Medium', // Default for now
                time: '15m'
            });
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 font-serif relative">
            <div className="text-center mb-6 max-w-lg z-10">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block font-sans">Step 2</span>
                <h3 className="text-5xl font-serif text-stone-900 mb-4 tracking-tight italic">
                    {step === 'initial' ? 'Clarify' : 'Organize'}
                </h3>
                {step === 'initial' && (
                    <p className="text-sm text-stone-500 leading-relaxed font-sans max-w-md mx-auto">
                        Process what you’ve captured into clear and concrete action steps. You'll decide if an item is a project, next action, or reference material.
                    </p>
                )}
            </div>

            {item ? (
                <>
                    <div className="w-full max-w-md text-center mb-10">
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-stone-100 transform rotate-1 transition-transform hover:rotate-0">
                            <p className="text-2xl text-stone-800 italic">"{item.text}"</p>
                        </div>
                    </div>

                    {step === 'initial' ? (
                        <div className="grid grid-cols-4 gap-4 w-full max-w-lg">
                            <button onClick={handleTrash} className="flex flex-col items-center p-3 text-stone-400 hover:text-red-500 hover:bg-stone-50 rounded-xl transition-all">
                                <Trash2 size={20} className="mb-2" />
                                <span className="text-xs font-sans font-bold">Trash</span>
                            </button>
                            <button onClick={handleReference} className="flex flex-col items-center p-3 text-stone-400 hover:text-blue-500 hover:bg-stone-50 rounded-xl transition-all">
                                <Inbox size={20} className="mb-2" />
                                <span className="text-xs font-sans font-bold">Reference</span>
                            </button>
                            <button onClick={handleDoIt} className="flex flex-col items-center p-3 text-stone-400 hover:text-green-500 hover:bg-stone-50 rounded-xl transition-all">
                                <Check size={20} className="mb-2" />
                                <span className="text-xs font-sans font-bold">Do It Now</span>
                            </button>
                            <button onClick={handleActionable} className="flex flex-col items-center p-3 text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all shadow-sm">
                                <ArrowRight size={20} className="mb-2" />
                                <span className="text-xs font-sans font-bold">Next Action</span>
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-xs animate-fade-in-up">
                            <p className="text-sm text-stone-500 mb-4 text-center font-sans">Where does this happen?</p>
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                {['office', 'home', 'calls', 'errands'].map(ctx => (
                                    <button
                                        key={ctx}
                                        onClick={() => setContext(ctx)}
                                        className={`p-2 rounded-lg text-sm border capitalize ${context === ctx ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200'}`}
                                    >
                                        {ctx}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleSaveAction}
                                className="w-full py-3 bg-stone-800 text-white rounded-xl shadow-md font-sans font-bold tracking-wider hover:bg-black transition-colors"
                            >
                                SAVE ACTION
                            </button>
                            <button
                                onClick={() => setStep('initial')}
                                className="w-full py-2 mt-2 text-stone-400 text-xs hover:text-stone-600"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center text-stone-300">
                    <CheckCircle2 size={48} strokeWidth={1} className="mb-4 opacity-50" />
                    <p className="text-lg italic">Inbox Zero! Great job.</p>
                </div>
            )}
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
