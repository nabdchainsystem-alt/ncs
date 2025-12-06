import React, { useEffect, useState } from 'react';
import { X, Lock, CheckSquare, ChevronRight } from 'lucide-react';

export type TaskDestination = 'private-room' | 'tasks';

interface SendTaskLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (destination: TaskDestination) => void;
    darkMode?: boolean;
}

export const SendTaskLocationModal: React.FC<SendTaskLocationModalProps> = ({ isOpen, onClose, onSelect, darkMode = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-black/40 backdrop-blur-md opacity-100' : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'}`}>
            <div className={`w-full max-w-md transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>
                <div className={`relative rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border p-1 ${darkMode ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-white/40'}`}>

                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`}
                    >
                        <X size={20} />
                    </button>

                    <div className="p-6 pb-2 text-center">
                        <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Send to...</h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose where you want to save this task</p>
                    </div>

                    <div className="p-4 space-y-3">
                        <button
                            onClick={() => onSelect('private-room')}
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between group transition-all duration-200 ${darkMode ? 'border-gray-700 hover:bg-gray-800 hover:border-gray-600 bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50 hover:border-blue-100 bg-white shadow-sm hover:shadow-md'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Lock size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Private Room</h4>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Safe & secure personal space</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className={`transform transition-transform group-hover:translate-x-1 ${darkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-300 group-hover:text-indigo-500'}`} />
                        </button>

                        <button
                            onClick={() => onSelect('tasks')}
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between group transition-all duration-200 ${darkMode ? 'border-gray-700 hover:bg-gray-800 hover:border-gray-600 bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50 hover:border-blue-100 bg-white shadow-sm hover:shadow-md'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                    <CheckSquare size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tasks</h4>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add to your main task board</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className={`transform transition-transform group-hover:translate-x-1 ${darkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-300 group-hover:text-blue-500'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
