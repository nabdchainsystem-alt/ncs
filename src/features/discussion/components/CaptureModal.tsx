import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CornerDownLeft, X } from 'lucide-react';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (text: string) => void;

}

export const CaptureModal: React.FC<CaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const [text, setText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      // Trigger animation frame to ensure browser paints initial state before transitioning
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsVisible(false);
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim()) {
      onCapture(text);
      setText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-xl transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Close Button */}
      <button
        onClick={onClose}
        className={`absolute top-6 end-6 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all duration-500 delay-200 z-20 ${isVisible ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}
      >
        <X size={24} />
      </button>

      {/* Content */}
      <div className={`relative z-10 w-full max-w-2xl flex flex-col items-center gap-12 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
        <h1 className={`font-serif text-5xl md:text-7xl font-bold ${language === 'ar' ? 'tracking-normal' : 'tracking-[0.2em]'} text-stone-900 dark:text-stone-100 uppercase select-none drop-shadow-sm transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {t('discussion.capture')}
        </h1>

        <div className={`w-full relative group transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={t('discussion.write_it_down')}
            className="w-full bg-transparent text-center font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-700 focus:outline-none pb-4 border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-100 transition-colors caret-stone-900 dark:caret-stone-100"
          />

          <div
            onClick={() => handleSubmit()}
            className={`
              absolute end-0 bottom-4 text-[10px] font-sans font-bold ${language === 'ar' ? 'tracking-normal' : 'tracking-widest'} uppercase
              px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500
              flex items-center gap-1 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-600 dark:hover:text-stone-300 transition-all duration-300
              ${text.trim() ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
            `}
          >
            {language === 'en' ? 'ENTER' : 'إدخال'}
            <CornerDownLeft size={10} />
          </div>
        </div>
      </div>
    </div>
  );
};