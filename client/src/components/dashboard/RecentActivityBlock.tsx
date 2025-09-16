import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ShieldCheck, CheckCircle2, AlertTriangle, Truck, FileText, UserRound } from 'lucide-react';
import cardTheme from '../../styles/cardTheme';

export type RecentActivityItem = {
  id: string;
  category: string;
  title: string;
  meta: string;
  icon: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

type Props = {
  items?: RecentActivityItem[];
  categories?: string[];
  initialCategory?: string;
  footerActionLabel?: string;
  onFooterAction?: () => void;
};

const defaultItems: RecentActivityItem[] = [
  { id: 'def-1', category: 'Approvals', title: 'Purchase Order PO-2049 approved', meta: 'Maya • 2h ago', icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, actionLabel: 'View' },
  { id: 'def-2', category: 'Requests', title: 'Request RQ-1182 created', meta: 'Omar • 4h ago', icon: <FileText className="h-4 w-4 text-sky-500" />, actionLabel: 'Open' },
  { id: 'def-3', category: 'Inventory', title: 'Inbound WH-A received (24 pallets)', meta: 'Lina • 1d ago', icon: <Truck className="h-4 w-4 text-indigo-500" />, actionLabel: 'Details' },
  { id: 'def-4', category: 'Vendors', title: 'Vendor Nova Chemicals uploaded compliance form', meta: 'Ziad • 2d ago', icon: <UserRound className="h-4 w-4 text-purple-500" />, actionLabel: 'Download' },
];

export default function RecentActivityBlock({
  items = defaultItems,
  categories,
  initialCategory = 'All',
  footerActionLabel = 'View All Activity',
  onFooterAction,
}: Props) {
  const computedCategories = React.useMemo(() => {
    if (categories && categories.length) return categories;
    const unique = Array.from(new Set(items.map((item) => item.category)));
    return unique;
  }, [categories, items]);

  const [activeCategory, setActiveCategory] = React.useState(initialCategory);

  React.useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const filterTabs = React.useMemo(() => ['All', ...computedCategories], [computedCategories]);

  const filteredItems = activeCategory === 'All'
    ? items
    : items.filter((item) => item.category === activeCategory);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const isActive = activeCategory === tab;
          const pill = isActive ? cardTheme.pill('positive') : cardTheme.pill('neutral');
          return (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${isActive ? 'shadow-sm' : ''}`}
              style={{ background: pill.bg, color: pill.text }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-5">
        <AnimatePresence initial={false} mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="relative pl-10"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              {index !== filteredItems.length - 1 ? (
                <span className="absolute left-[13px] top-5 h-full w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              ) : null}
              <span
                className="absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full border bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900"
                style={{ borderColor: cardTheme.border() }}
              >
                {item.icon}
              </span>
              <motion.div
                className="rounded-2xl border px-4 py-3"
                style={{ borderColor: cardTheme.border(), background: cardTheme.surface() }}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{item.meta}</span>
                    </div>
                  </div>
                  {item.actionLabel ? (
                    <button
                      className="rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={item.onAction}
                    >
                      {item.actionLabel}
                    </button>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={onFooterAction}
        >
          {footerActionLabel}
        </button>
      </div>
    </div>
  );
}
