
import React, { useState, useRef, useEffect } from 'react';
import { Thread, Board, Priority, Language } from '../types';
import { Search, Plus, MoreHorizontal, Sparkles, FolderPlus, Trash2, Calendar, Flag, ChevronDown, CornerDownLeft } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SidebarProps {
  boards: Board[];
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: (boardId: string) => void;
  onNewBoard: () => void;
  onDeleteBoard: (boardId: string) => void;
  width: number;

  onCapture: () => void;
  onQuickCapture: (text: string) => void;
}

const formatDate = (date: Date, lang: Language) => {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }).format(date);
};

export const Sidebar: React.FC<SidebarProps> = ({
  boards,
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onNewBoard,
  onDeleteBoard,
  width,
  onCapture,
  onQuickCapture
}) => {
  const { t, language } = useLanguage();
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set(boards.map(b => b.id)));

  // Inline Capture State
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const captureInputRef = useRef<HTMLTextAreaElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCapturing && captureInputRef.current) {
      captureInputRef.current.focus();
    }
  }, [isCapturing]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (captureContainerRef.current && !captureContainerRef.current.contains(event.target as Node)) {
        if (!captureText.trim()) {
          setIsCapturing(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [captureText]);

  const handleQuickCaptureSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (captureText.trim()) {
      onQuickCapture(captureText);
      setCaptureText('');
      setIsCapturing(false);
    }
  };

  const toggleBoard = (boardId: string) => {
    const newExpanded = new Set(expandedBoards);
    if (newExpanded.has(boardId)) {
      newExpanded.delete(boardId);
    } else {
      newExpanded.add(boardId);
    }
    setExpandedBoards(newExpanded);
  };

  const getPriorityColor = (priority?: Priority) => {
    switch (priority) {
      case 'high': return 'text-stone-800 dark:text-stone-200 fill-stone-800 dark:fill-stone-200';
      case 'medium': return 'text-stone-500 dark:text-stone-400';
      default: return 'text-stone-300 dark:text-stone-600';
    }
  };

  return (
    <div
      style={{ width: `${width}px` }}
      className="flex flex-col h-full border-e border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 backdrop-blur-xl relative group transition-all"
    >
      {/* Header Area */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur space-y-4">

        {/* Title */}
        <h2 className={`text-sm font-semibold font-sans ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'} text-stone-500 uppercase`}>
          {t('discussion.title')}
        </h2>

        {/* Action Stack */}
        <div className="flex flex-col gap-2 relative">
          {/* New Board Button */}
          <button
            onClick={onNewBoard}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-700 hover:text-stone-900 dark:hover:text-stone-100 transition-all group/btn shadow-sm"
          >
            <div className="p-1 rounded bg-stone-100 dark:bg-stone-900 text-stone-500 group-hover/btn:text-stone-800 dark:group-hover/btn:text-stone-200 transition-colors">
              <FolderPlus size={14} />
            </div>
            <span className="text-xs font-medium font-sans">{t('discussion.new_board')}</span>
          </button>

          {/* Capture Button / Expanded Card */}
          {isCapturing ? (
            <div ref={captureContainerRef} className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-2 mb-3 text-stone-800 dark:text-stone-200">
                <div className="w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 flex items-center justify-center">
                  <Sparkles size={10} />
                </div>
                <span className="font-serif italic text-sm">{t('discussion.capture')}</span>
              </div>
              <textarea
                ref={captureInputRef}
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                placeholder={t('discussion.capture_your_thought')}
                className="w-full h-20 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-2 text-xs font-serif resize-none focus:ring-1 focus:ring-stone-400 focus:outline-none mb-3 text-stone-800 dark:text-stone-200 placeholder:text-stone-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickCaptureSubmit();
                  }
                  if (e.key === 'Escape') setIsCapturing(false);
                }}
              />
              <button
                onClick={() => handleQuickCaptureSubmit()}
                className="w-full bg-stone-500 hover:bg-stone-600 text-white py-1.5 rounded-md text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors"
              >
                {t('discussion.add')} <CornerDownLeft size={10} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCapturing(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-700 hover:text-stone-900 dark:hover:text-stone-100 transition-all group/btn shadow-sm"
            >
              <div className="p-1 rounded bg-stone-100 dark:bg-stone-900 text-stone-500 group-hover/btn:text-stone-800 dark:group-hover/btn:text-stone-200 transition-colors">
                <Sparkles size={14} />
              </div>
              <span className="text-xs font-medium font-sans">{t('discussion.capture')}</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 text-stone-400 rtl:rotate-90" size={14} />
          <input
            type="text"
            placeholder={t('discussion.search')}
            className="w-full ps-8 pe-3 py-1.5 text-sm bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 font-sans transition-shadow placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {boards.map(board => {
          const boardThreads = threads.filter(t => t.boardId === board.id);
          const isExpanded = expandedBoards.has(board.id);

          return (
            <div key={board.id} className="mb-2">
              {/* Board Header */}
              <div className="flex items-center justify-between px-4 py-2 group/board">
                <button
                  onClick={() => toggleBoard(board.id)}
                  className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 font-serif font-medium text-sm flex-1 text-start"
                >
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : 'ltr:-rotate-90 rtl:rotate-90'}`}>
                    <ChevronDown size={14} />
                  </div>
                  {board.name}
                  <span className="text-xs text-stone-400 font-sans font-normal ms-1">({boardThreads.length})</span>
                </button>
                <div className="flex items-center opacity-0 group-hover/board:opacity-100 transition-opacity gap-1">
                  <button
                    onClick={() => onDeleteBoard(board.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button
                    onClick={() => onNewThread(board.id)}
                    className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Threads List */}
              {isExpanded && (
                <div className="space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-300 origin-top">
                  {boardThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => onSelectThread(thread.id)}
                      className={`
                        group/item px-4 py-3 cursor-pointer transition-all duration-200
                        ${activeThreadId === thread.id
                          ? 'bg-stone-800 dark:bg-stone-800 border-s-4 border-s-stone-600 dark:border-s-stone-400 ps-3 shadow-sm'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/50 border-s-4 border-s-transparent hover:ps-3.5 ps-4'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-serif text-sm truncate font-medium ${activeThreadId === thread.id ? 'text-stone-50 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'}`}>
                          {thread.title}
                        </h3>
                        <div className="flex items-center gap-2 ms-2">
                          {thread.dueDate && (
                            <Calendar size={10} className={`${activeThreadId === thread.id ? 'text-stone-400' : 'text-stone-400'}`} />
                          )}
                          <Flag size={10} className={getPriorityColor(thread.priority)} />
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className={`font-serif text-xs line-clamp-1 leading-relaxed flex-1 ${activeThreadId === thread.id ? 'text-stone-300' : 'text-stone-500 dark:text-stone-500'}`}>
                          {thread.preview}
                        </p>
                        <span className="text-[10px] font-sans text-stone-400 whitespace-nowrap ms-2">
                          {formatDate(thread.updatedAt, language)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {boardThreads.length === 0 && (
                    <div className="ps-8 py-2">
                      <p className="text-xs text-stone-400 italic">{t('discussion.no_threads')}</p>
                      <button
                        onClick={() => onNewThread(board.id)}
                        className="text-xs font-sans text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline mt-1"
                      >
                        {t('discussion.start_writing')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / User Profile Stub */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-stone-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-stone-300 dark:bg-stone-700 flex items-center justify-center text-[10px] font-bold text-stone-600 dark:text-stone-200">
            {language === 'ar' ? 'أ' : 'JD'}
          </div>
          <span className="text-xs font-sans">{language === 'ar' ? 'أحمد محمد' : 'John Doe'}</span>
        </div>
        <MoreHorizontal size={16} className="cursor-pointer hover:text-stone-800 dark:hover:text-stone-200" />
      </div>
    </div>
  );
};
