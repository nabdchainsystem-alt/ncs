import React from 'react';
import { X, Inbox, CheckCircle2, Layers, CheckSquare, Zap } from 'lucide-react';

interface GTDInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GTDInfoModal: React.FC<GTDInfoModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const steps = [
        {
            icon: Inbox,
            title: "1. Capture",
            description: "Collect what has your attention. Use the Inbox to write down tasks, ideas, and reminders immediately so you don't forget them.",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            icon: CheckCircle2,
            title: "2. Clarify",
            description: "Process what you've captured. Decide if it's actionable. If yes, decide the next action. If no, trash it, store it for reference, or put it on hold.",
            color: "text-amber-600",
            bg: "bg-amber-50"
        },
        {
            icon: Layers,
            title: "3. Organize",
            description: "Put everything in the right place. Add actionable items to your lists (Next Actions, Projects, Waiting For, Calendar).",
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
        {
            icon: CheckSquare,
            title: "4. Reflect",
            description: "Review frequently. Update your lists, clear your mind, and get perspective. Weekly Review is key to keeping the system trusted.",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            icon: Zap,
            title: "5. Engage",
            description: "Simply do. Use your system to make confident choices about what to do right now, based on context, time, and energy available.",
            color: "text-orange-600",
            bg: "bg-orange-50"
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-8 pb-4 border-b border-stone-100">
                    <div>
                        <h2 className="text-3xl font-serif italic text-stone-900 mb-1">Getting Things Done</h2>
                        <p className="text-sm text-stone-500 font-sans">The art of stress-free productivity.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {steps.map((step, index) => (
                            <div key={index} className="p-6 rounded-2xl border border-stone-100 hover:shadow-lg hover:border-stone-200 transition-all duration-300 group bg-stone-50/50">
                                <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <step.icon size={24} className={step.color} />
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-2 font-serif">{step.title}</h3>
                                <p className="text-sm text-stone-600 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                        {/* Visual Flow or Extra Info */}
                        <div className="p-6 rounded-2xl bg-stone-900 text-white flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-bold mb-2 font-serif italic">Why GTD?</h3>
                            <p className="text-sm text-stone-300 leading-relaxed">
                                "Your mind is for having ideas, not holding them."
                            </p>
                            <p className="text-xs text-stone-500 mt-2 uppercase tracking-widest font-bold">
                                — David Allen
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-stone-50 border-t border-stone-100 text-center">
                    <button
                        onClick={onClose}
                        className="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
                    >
                        Start Organizing
                    </button>
                </div>
            </div>
        </div>
    );
};
