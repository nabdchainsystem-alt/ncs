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
        <button key={c} onClick={() => onPick(c)} className="px-3 py-1.5 text-sm rounded-full border hover:bg-gray-50 dark:hover:bg-gray-800">
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
          transition={{ duration: 0.16 }}
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 backdrop-blur-xl bg-black/40" onClick={close} />
          <div className="absolute inset-0 p-4 sm:p-6 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[920px] rounded-2xl border shadow-xl bg-white/90 dark:bg-gray-900/90 relative overflow-hidden"
              style={{ borderColor: cardTheme.border() }}
            >
              {/* Orb watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
                <div className="w-72 h-72 rounded-full"
                     style={{
                       background: `radial-gradient(circle at 40% 40%, ${chartTheme.palette[0]}33, transparent 60%), radial-gradient(circle at 70% 60%, ${chartTheme.palette[1]}33, transparent 60%)`,
                       filter: 'blur(20px)'
                     }}
                />
              </div>

              <div className="p-6 sm:p-8" style={{ gap: cardTheme.gap }}>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button className="h-9 w-9 rounded-xl border bg-white/80 dark:bg-gray-900/80 grid place-items-center" onClick={close} aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-semibold">What can I help with?</div>
                  <div className="mt-1 text-sm text-gray-500">Search across requests, vendors, orders, inventory…</div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5">
                  <div className="h-14 sm:h-14 rounded-full border px-3 pl-2 pr-2 bg-white/90 dark:bg-gray-900/90 shadow-sm flex items-center gap-2" style={{ borderColor: cardTheme.border() }}>
                    <button type="button" className="h-9 w-9 rounded-lg border grid place-items-center"><Plus className="w-4.5 h-4.5" /></button>
                    <input ref={inputRef} value={q} onChange={(e)=> setQ(e.currentTarget.value)} placeholder="Ask anything" className="flex-1 bg-transparent outline-none text-[15px]" />
                    <button type="button" className="h-9 w-9 rounded-lg border grid place-items-center"><Mic className="w-4.5 h-4.5" /></button>
                    {/* Submit (Enter) button */}
                    <button type="submit" aria-label="Submit" className="h-9 px-3 rounded-lg border inline-flex items-center gap-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}<span className="hidden sm:inline">Enter</span>
                    </button>
                  </div>
                </form>

                <div className="mt-4">
                  <Suggestions onPick={(s)=> setQ(s)} />
                </div>

                <div className="mt-6">
                  <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Recent</div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {['Open requests today','Vendors with pending docs','RFQs above 100k'].map((t) => (
                      <button key={t} onClick={()=> setQ(t)} className="px-2.5 py-1 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-800">{t}</button>
                    ))}
                  </div>
                </div>

                {answer ? (
                  <div className="mt-6 p-4 rounded-xl border bg-white/70 dark:bg-gray-900/70 text-sm" style={{ borderColor: cardTheme.border() }}>
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
