import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown, Lock, CheckCircle2, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Room } from '../../../features/rooms/types';
import TaskBoard, { TaskBoardHandle } from '../../../ui/TaskBoard';
import { IBoard, INITIAL_DATA } from '../../rooms/boardTypes';
import { v4 as uuidv4 } from 'uuid';
import { useQuickAction } from '../../../hooks/useQuickAction';

interface QuickTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (boardData: IBoard, destination: { type: 'main' | 'room', roomId?: string }) => void;
    rooms?: Room[];
    darkMode?: boolean;
}

const DRAFT_STORAGE_KEY = 'taskboard-quick-draft';

export const QuickTaskModal: React.FC<QuickTaskModalProps> = ({ isOpen, onClose, onSend, rooms = [], darkMode = false }) => {

    const [isVisible, setIsVisible] = useState(false);
    const [destination, setDestination] = useState<{ type: 'main' | 'room', roomId?: string, name: string }>({ type: 'main', name: 'My Tasks' });
    const [isDestOpen, setIsDestOpen] = useState(false);
    const boardRef = useRef<TaskBoardHandle>(null);

    const handleClose = () => {
        // Optional: clear draft on cancel? Or keep it? keeping it is safer.
        onClose();
    }

    const { ref, setIsActive } = useQuickAction<HTMLDivElement>({
        onCancel: handleClose,
        initialActive: isOpen
    });

    useEffect(() => {
        setIsActive(isOpen);
    }, [isOpen, setIsActive]);


    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setDestination({ type: 'main', name: 'My Tasks' });
            setIsDestOpen(false);
            // Initialize draft if empty
            if (!localStorage.getItem(DRAFT_STORAGE_KEY)) {
                // Create a fresh board with one empty group
                const initBoard: IBoard = {
                    ...INITIAL_DATA,
                    id: 'draft-board',
                    name: 'Draft Task',
                    groups: [
                        {
                            ...INITIAL_DATA.groups[0],
                            id: uuidv4(),
                            title: 'New Group',
                            tasks: []
                        }
                    ]
                };
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(initBoard));
            }
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const handleSend = () => {
        try {
            // Persist any inline drafts to the board before exporting so we capture unsaved rows
            const boardData = boardRef.current?.exportBoardWithDrafts();
            if (!boardData) {
                const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
                if (!saved) return;
                onSend(JSON.parse(saved) as IBoard, { type: destination.type, roomId: destination.roomId });
                localStorage.removeItem(DRAFT_STORAGE_KEY);
                return;
            }

            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(boardData));
            onSend(boardData, { type: destination.type, roomId: destination.roomId });
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
            console.error("Failed to read draft board", e);
        }
    };



    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 z-[9999] flex items-center justify-center`}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute inset-0 ${isOpen ? 'bg-black/60 backdrop-blur-md' : ''}`}
                        onClick={handleClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={ref}
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`w-full max-w-[95vw] h-auto max-h-[85vh] relative z-10`}
                    >
                        <div className={`relative w-full max-h-full flex flex-col rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-white/40'}`}>
                            {/* Content - Task Board */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-[300px]">
                                {/* We use a key to force re-mount when opening to ensure it reads fresh storage if needed, though storageKey handles it mostly */}
                                {isVisible && (
                                    <div className="min-w-full h-full">
                                        <TaskBoard
                                            ref={boardRef}
                                            storageKey={DRAFT_STORAGE_KEY}
                                            darkMode={darkMode}
                                            minimal={true}
                                            showGroupHeader={true}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className={`px-6 py-4 flex items-center justify-between border-t border-gray-100/10 shrink-0 ${darkMode ? 'bg-black/20' : 'bg-white/40'}`}>

                                {/* Destination Selector */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDestOpen(!isDestOpen)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <span className="opacity-60">Save As:</span>
                                        <span className={`font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {destination.type === 'room' && <Lock size={12} className="text-indigo-400" />}
                                            {destination.type === 'main' && <User size={12} className="text-blue-400" />}
                                            {destination.name}
                                        </span>
                                        <ChevronDown size={14} className={`opacity-50 transition-transform ${isDestOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDestOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsDestOpen(false)}></div>
                                            <div className={`absolute bottom-full left-0 mb-2 w-64 rounded-xl shadow-xl border overflow-hidden p-1 z-20 animate-in slide-in-from-bottom-2 fade-in duration-200 ${darkMode ? 'bg-[#1a1d24] border-gray-700' : 'bg-white border-gray-200'}`}>

                                                <button
                                                    onClick={() => { setDestination({ type: 'main', name: 'My Tasks' }); setIsDestOpen(false); }}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-md ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                            <User size={14} />
                                                        </div>
                                                        <span>My Tasks</span>
                                                    </div>
                                                    {destination.type === 'main' && <CheckCircle2 size={16} className="text-blue-500" />}
                                                </button>

                                                <div className={`my-1 mx-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                                                <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Private Rooms</div>

                                                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                                                    {rooms.length === 0 ? (
                                                        <div className={`px-3 py-2 text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No rooms found</div>
                                                    ) : (
                                                        rooms.map(room => (
                                                            <button
                                                                key={room.id}
                                                                onClick={() => { setDestination({ type: 'room', roomId: room.id, name: room.name }); setIsDestOpen(false); }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                                                        style={{ backgroundColor: room.color || '#3b82f6' }}
                                                                    >
                                                                        {room.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="truncate max-w-[140px]">{room.name}</span>
                                                                </div>
                                                                {destination.roomId === room.id && <CheckCircle2 size={16} className="text-indigo-500" />}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleClose}
                                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg active:scale-95 transition-all ${darkMode ? 'bg-[#2a2e35] hover:bg-[#32363e] border border-gray-700' : 'bg-[#2a2e35] hover:bg-[#32363e] border border-gray-700'}`}
                                    >
                                        <span>Send Task</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
