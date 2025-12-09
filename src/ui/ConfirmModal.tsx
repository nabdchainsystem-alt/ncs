import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useQuickAction } from '../hooks/useQuickAction';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    darkMode?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    darkMode
}) => {
    const { ref, setIsActive } = useQuickAction<HTMLDivElement>({
        onConfirm: () => {
            onConfirm();
            onClose();
        },
        onCancel: onClose,
        initialActive: isOpen
    });

    useEffect(() => {
        setIsActive(isOpen);
    }, [isOpen, setIsActive]);

    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: darkMode ? 'text-red-400 bg-red-500/10' : 'text-red-500 bg-red-50',
            button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
            border: darkMode ? 'border-red-900/30' : 'border-red-100'
        },
        warning: {
            icon: darkMode ? 'text-amber-400 bg-amber-500/10' : 'text-amber-500 bg-amber-50',
            button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
            border: darkMode ? 'border-amber-900/30' : 'border-amber-100'
        },
        info: {
            icon: darkMode ? 'text-blue-400 bg-blue-500/10' : 'text-blue-500 bg-blue-50',
            button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
            border: darkMode ? 'border-blue-900/30' : 'border-blue-100'
        }
    };

    const theme = colors[variant];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div ref={ref} className={`rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${theme.icon}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                {title}
                            </h3>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`transition-colors -mt-1 -mr-1 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${darkMode ? 'bg-transparent border-gray-700 text-gray-300 hover:bg-white/5' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 ${theme.button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
