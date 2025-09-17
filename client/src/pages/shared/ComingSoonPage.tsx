import React from 'react';
import { Plus, Upload, FileCog } from 'lucide-react';
import PageHeader, { type PageHeaderItem } from '../../components/layout/PageHeader';

export type ComingSoonAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  message?: string;
};

type ComingSoonPageProps = {
  title: string;
  searchPlaceholder?: string;
  actions?: ComingSoonAction[];
};

const DEFAULT_ACTIONS: ComingSoonAction[] = [
  { key: 'create', label: 'Create Item', icon: <Plus className="w-4.5 h-4.5" /> },
  { key: 'import', label: 'Import Data', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'generate', label: 'Generate Report', icon: <FileCog className="w-4.5 h-4.5" /> },
];

export default function ComingSoonPage({ title, searchPlaceholder, actions }: ComingSoonPageProps) {
  const [toast, setToast] = React.useState<{ id: number; message: string } | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  const showToast = React.useCallback((message: string) => {
    const msg = message || 'Coming Soon';
    setToast({ id: Date.now(), message: msg });
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const menuItems = React.useMemo<PageHeaderItem[]>(() => {
    const base = actions && actions.length ? actions : DEFAULT_ACTIONS;
    return base.map((action) => ({
      key: action.key,
      label: action.label,
      icon: action.icon,
      disabled: true,
      onClick: () => showToast(action.message ?? 'Coming Soon'),
    }));
  }, [actions, showToast]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader title={title} searchPlaceholder={searchPlaceholder} menuItems={menuItems} />

      <section className="min-h-[320px] rounded-3xl border border-dashed border-gray-300 bg-white/70 shadow-sm grid place-items-center">
        <div className="text-center space-y-2">
          <div className="text-4xl sm:text-5xl">🚧</div>
          <div className="text-xl sm:text-2xl font-semibold text-gray-600">Coming Soon</div>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            We are building this experience. Stay tuned for release updates.
          </p>
        </div>
      </section>

      {toast ? (
        <div
          key={toast.id}
          className="fixed right-6 bottom-6 z-[60] min-w-[220px] max-w-xs rounded-xl bg-gray-900/95 px-4 py-3 text-sm font-medium text-white shadow-2xl ring-1 ring-black/5"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
