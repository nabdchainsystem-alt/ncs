import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Plus, Settings, Clock, CornerDownLeft, Loader2 } from 'lucide-react';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { useAssistant } from './useAssistant';

function Suggestions({ onPick }: { onPick: (s: string) => void }) {
  const chips = [
    'Create urgent request for QA',
    'Show open RFQs this week',
    'Top 5 vendors by win rate',
    'Requests over 50k SAR',
    'Lead time last month',
    'Import template',
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {chips.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className="px-3 py-1.5 text-sm rounded-full border border-slate-700/70 bg-slate-900/60 hover:bg-slate-800/70 transition"
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export default function AssistantModal() {
  const { isOpen, close, onSubmit } = useAssistant();
  const [q, setQ] = React.useState('');
  const [answer, setAnswer] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = q.trim();
    if (!v) return;
    setLoading(true);
    const t = await onSubmit(v);
    setAnswer(t);
    setLoading(false);
    setQ('');
  };

  const overlay = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="assistant-overlay"
          className="fixed inset-0 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            className="absolute inset-0 backdrop-blur-[14px] bg-slate-900/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={close}
          />
          <div className="absolute inset-0 p-4 sm:p-6 flex items-center justify-center pointer-events-none">
            <motion.span
              className="absolute bottom-6 right-6 h-32 w-32 rounded-full bg-white/12 blur-xl"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="absolute inset-0 p-4 sm:p-6 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.45, x: 180, y: 180 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.45, x: 160, y: 160 }}
              transition={{ duration: 0.35, ease: [0.18, 0.89, 0.32, 1], type: 'tween' }}
              className="pointer-events-auto w-full max-w-[940px] rounded-3xl border shadow-[0_40px_120px_rgba(15,23,42,0.35)] bg-slate-950/90 dark:bg-slate-950/92 relative overflow-hidden text-slate-100"
              style={{ borderColor: cardTheme.border() }}
            >
              {/* Orb watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
                <motion.div
                  className="w-80 h-80 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
                  style={{
                    background: `radial-gradient(circle at 40% 40%, ${chartTheme.palette[0]}33, transparent 60%), radial-gradient(circle at 70% 60%, ${chartTheme.palette[1]}33, transparent 60%)`,
                    filter: 'blur(24px)'
                  }}
                />
              </div>

              <div className="p-6 sm:p-8" style={{ gap: cardTheme.gap }}>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button className="h-10 w-10 rounded-xl border border-slate-700/70 bg-slate-900/70 grid place-items-center backdrop-blur" onClick={close} aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-semibold text-slate-100">What can I help with?</div>
                  <div className="mt-1 text-sm text-slate-300">Search across requests, vendors, orders, inventory…</div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5">
                  <motion.div
                    className="group flex items-center gap-2 rounded-full border px-4 py-1 bg-slate-900/80 shadow-sm"
                    style={{ borderColor: 'rgba(148, 163, 184, 0.35)' }}
                    initial={false}
                    whileHover={{ boxShadow: '0 18px 42px rgba(15,23,42,0.35)' }}
                  >
                    <button type="button" className="h-10 w-10 rounded-xl border border-slate-700/70 grid place-items-center bg-slate-900/60"><Plus className="w-4.5 h-4.5" /></button>
                    <input
                      ref={inputRef}
                      value={q}
                      onChange={(e)=> setQ(e.currentTarget.value)}
                      placeholder="Ask anything"
                      className="flex-1 bg-transparent outline-none text-[16px] sm:text-[17px] text-slate-100 placeholder:text-slate-500"
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-10 w-10 rounded-xl border border-slate-700/70 grid place-items-center bg-slate-900/60"><Mic className="w-4.5 h-4.5" /></button>
                      <button type="submit" aria-label="Submit" className="h-10 px-4 rounded-xl border border-slate-700/70 inline-flex items-center gap-2 text-sm font-semibold bg-slate-900/60 hover:bg-slate-800/70">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}<span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
                  </motion.div>
                </form>

                <div className="mt-4">
                  <Suggestions onPick={(s)=> setQ(s)} />
                </div>

                <div className="mt-6">
                  <div className="text-xs text-slate-400 mb-1 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Recent</div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {['Open requests today','Vendors with pending docs','RFQs above 100k'].map((t) => (
                      <button key={t} onClick={()=> setQ(t)} className="px-2.5 py-1 rounded-full border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800/70">{t}</button>
                    ))}
                  </div>
                </div>

                {answer ? (
                  <div className="mt-6 p-4 rounded-xl border border-slate-700/70 bg-slate-900/70 text-sm text-slate-200">
                    {answer}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(overlay, document.body);
}
