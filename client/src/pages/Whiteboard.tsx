import React from 'react';
import { Tab, Tabs } from '@mui/material';
import { RotateCcw } from 'lucide-react';
import { Tldraw, type Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import PageHeader, { type PageHeaderItem } from '../components/layout/PageHeader';

const STORAGE_KEY = 'ncs-whiteboard';

const DIAGRAMS_URL =
  import.meta.env.VITE_DIAGRAMS_URL
  || 'https://embed.diagrams.net/?embed=1&ui=atlas&libs=general;flowchart;uml;er;bpmn;network';

type BoardTab = 'tldraw' | 'mercury';

export default function Whiteboard() {
  const [editorInstance, setEditorInstance] = React.useState<Editor | null>(null);
  const [activeTab, setActiveTab] = React.useState<BoardTab>('tldraw');

  const handleMount = React.useCallback((editor: Editor) => {
    setEditorInstance(editor);
    if (typeof window === 'undefined') return;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const snapshot = JSON.parse(saved);
        if (typeof editor.loadSnapshot === 'function') {
          editor.loadSnapshot(snapshot);
        } else {
          (editor.store as { loadSnapshot?: (data: unknown) => void }).loadSnapshot?.(snapshot);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('whiteboard: failed to load snapshot', error);
    }

    editor.updateInstanceState({ isReadonly: false });
  }, []);

  React.useEffect(() => {
    const editor = editorInstance;
    if (!editor || typeof window === 'undefined') return undefined;

    let timeoutId: number | null = null;

    const persist = () => {
      try {
        const store = editor.store as {
          getSnapshot?: () => unknown;
          serialize?: () => unknown;
        };
        const snapshot = store.getSnapshot?.() ?? store.serialize?.();
        if (!snapshot) return;

        const payload = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
        window.localStorage.setItem(STORAGE_KEY, payload);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('whiteboard: failed to persist snapshot', error);
      }
    };

    const schedulePersist = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        persist();
      }, 350);
    };

    persist();

    const storeWithListen = editor.store as { listen?: (cb: () => void) => (() => void) | void };
    const unsubscribe = storeWithListen.listen?.(schedulePersist);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      unsubscribe?.();
      persist();
    };
  }, [editorInstance]);

  const handleNewBoard = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm('Start a new blank board? This will clear the saved whiteboard.');
    if (!confirmed) return;

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('whiteboard: failed to clear saved board', error);
    }
    window.location.reload();
  }, []);

  const menuItems = React.useMemo<PageHeaderItem[]>(() => [
    {
      key: 'new-board',
      label: 'New Board',
      icon: <RotateCcw className="w-4.5 h-4.5" />,
      onClick: handleNewBoard,
    },
  ], [handleNewBoard]);

  const handleTabChange = React.useCallback((_: React.SyntheticEvent, value: string) => {
    setActiveTab(value as BoardTab);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-6 pb-0 sm:px-6 lg:px-8">
        <PageHeader title="Whiteboard" showSearch={false} menuItems={menuItems} />
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            mt: 3,
            minHeight: 0,
            '& .MuiTabs-flexContainer': { gap: '0.5rem', borderBottom: '1px solid rgb(229 231 235)' },
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 0,
              px: 0,
              py: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#6B7280',
            },
            '& .MuiTab-root.Mui-selected': {
              color: '#111827',
            },
            '& .MuiTabs-indicator': {
              height: '3px',
              borderRadius: '9999px',
            },
          }}
        >
          <Tab disableRipple label="Mercury Board" value="tldraw" />
          <Tab disableRipple label="Mercury" value="mercury" />
      </Tabs>
      </div>
      <div className="flex-1 min-h-0 px-4 pb-6 sm:px-6 lg:px-8">
        {activeTab === 'tldraw' ? (
          <div className="relative h-full min-h-0 overflow-hidden rounded-3xl bg-white dark:bg-gray-950">
            <Tldraw onMount={handleMount} />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-3xl border border-gray-200 shadow-card dark:border-gray-800"
            />
          </div>
        ) : (
          <iframe
            src={DIAGRAMS_URL}
            title="Mercury"
            className="w-full h-[calc(100vh-112px)] border-0 rounded-2xl shadow-card bg-surface"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation"
            referrerPolicy="no-referrer"
            allow="clipboard-read; clipboard-write; fullscreen"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
