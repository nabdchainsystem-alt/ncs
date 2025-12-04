import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import RoomCalendar from '../features/rooms/RoomCalendar';

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-[95vw] h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                    <h2 className="text-xl font-semibold text-gray-800">Calendar</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 bg-gray-50/50 overflow-hidden">
                    <div className="h-full p-4">
                        <RoomCalendar refreshTrigger={Date.now().toString()} />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
