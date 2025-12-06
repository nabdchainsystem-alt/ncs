import React, { useEffect, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useQuickAction } from '../hooks/useQuickAction';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    defaultValue?: string;
    darkMode?: boolean;
}

export const InputModal: React.FC<InputModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    placeholder = 'Enter value...',
    confirmText = 'Create',
    cancelText = 'Cancel',
    defaultValue = '',
    darkMode
}) => {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    const { ref, setIsActive } = useQuickAction<HTMLDivElement>({
        onConfirm: () => {
            if (value.trim()) {
                onConfirm(value.trim());
                onClose();
            }
        },
        onCancel: onClose,
        initialActive: isOpen
    });

    useEffect(() => {
        setIsActive(isOpen);
        if (isOpen) {
            setValue(defaultValue);
            // Small timeout to allow animation to start and focus to work
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, defaultValue, setIsActive]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onConfirm(value.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div ref={ref} className={`rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className={`p-1 rounded-md transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <input
                                ref={inputRef}
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={placeholder}
                                className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none text-base ${darkMode
                                    ? 'bg-gray-900 border-gray-700 focus:border-indigo-500 text-white placeholder-gray-600'
                                    : 'bg-gray-50 border-gray-200 focus:border-black text-gray-900 placeholder-gray-400'
                                    }`}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all active:scale-95 ${darkMode
                                    ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {cancelText}
                            </button>
                            <button
                                type="submit"
                                disabled={!value.trim()}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 active:scale-95 rounded-xl shadow-lg shadow-black/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                            >
                                <span>{confirmText}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
