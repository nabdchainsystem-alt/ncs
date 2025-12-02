import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

interface NotepadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotepadModal: React.FC<NotepadModalProps> = ({ isOpen, onClose }) => {
    const [content, setContent] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('notepad-content');
        if (saved) setContent(saved);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setContent(newVal);
        localStorage.setItem('notepad-content', newVal);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-[600px] h-[700px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#FEF3C7] border-b border-[#FDE68A]">
                    <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-black/5 rounded transition-colors text-gray-700">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="font-semibold text-gray-800 text-sm">
                            {format(new Date(), 'MMMM d, yyyy')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-black/5 rounded transition-colors text-gray-700">
                            <MoreHorizontal size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-black/5 rounded transition-colors text-gray-700"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white p-6">
                    <textarea
                        className="w-full h-full resize-none outline-none text-gray-700 text-base leading-relaxed placeholder-gray-400"
                        placeholder="Write or type '/' for commands and AI actions"
                        value={content}
                        onChange={handleChange}
                        autoFocus
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};
