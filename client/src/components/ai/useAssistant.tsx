import React from 'react';

type AssistantCtx = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setLastFocus: (el: HTMLElement | null) => void;
  lastFocus: HTMLElement | null;
  onSubmit: (prompt: string) => Promise<string>;
};

const Ctx = React.createContext<AssistantCtx | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = React.useState(false);
  const [lastFocus, setLastFocusState] = React.useState<HTMLElement | null>(null);

  const setLastFocus = (el: HTMLElement | null) => setLastFocusState(el);

  const open = React.useCallback(() => {
    setLastFocusState(document.activeElement as HTMLElement);
    setOpen(true);
  }, []);
  const close = React.useCallback(() => {
    setOpen(false);
    // restore focus after closing
    setTimeout(() => {
      try { lastFocus?.focus(); } catch {}
    }, 0);
  }, [lastFocus]);
  const toggle = React.useCallback(() => (isOpen ? close() : open()), [isOpen, open, close]);

  // Global hotkeys: Cmd/Ctrl+K open/close; ESC closes when open
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if (isModK) { e.preventDefault(); toggle(); }
      if (e.key === 'Escape' && isOpen) { e.preventDefault(); close(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, toggle, close]);

  const onSubmit = async (prompt: string): Promise<string> => {
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
      const r = await fetch(`${API_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });
      if (!r.ok) {
        try {
          const d = await r.json();
          if (d?.error === 'missing_openai_key') {
            return 'Server missing OPENAI_API_KEY. Add it to server/.env then restart the server.';
          }
          const details = d?.details || d?.error || 'assistant_failed';
          throw new Error(details);
        } catch {
          throw new Error('assistant_failed');
        }
      }
      const data = await r.json();
      return String(data?.text || '');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Assistant submit failed', e);
      return 'Sorry, the assistant is unavailable right now.';
    }
  };

  const value: AssistantCtx = { isOpen, open, close, toggle, lastFocus, setLastFocus, onSubmit };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssistant() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}
