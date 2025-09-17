import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import cardTheme from '../../styles/cardTheme';
import { ChevronDown, Plus, Upload, PackagePlus, Boxes, Users, Wallet, FileText } from 'lucide-react';

export type PageHeaderItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

export type PageHeaderProps = {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  menuItems?: PageHeaderItem[];
};

const DEFAULT_ITEMS: PageHeaderItem[] = [
  { key: 'new-request', label: 'New Request', icon: <Plus className="w-4.5 h-4.5" /> },
  { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-4.5 h-4.5" /> },
  { key: 'import-materials', label: 'Import Materials', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" /> },
  { key: 'import-vendors', label: 'Import Vendors', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-payment-request', label: 'New Payment Request', icon: <FileText className="w-4.5 h-4.5" /> },
];

export default function PageHeader({
  title,
  showSearch = true,
  searchPlaceholder = 'Search across requests, vendors, orders, inventory…',
  onSearch,
  menuItems,
}: PageHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const items = menuItems && menuItems.length ? menuItems : DEFAULT_ITEMS;
  const mode = cardTheme.runtimeMode();

  return (
    <div className="w-full relative" style={{ zIndex: 10 }}>
      <div className="flex items-center flex-wrap" style={{ gap: cardTheme.gap }}>
        {/* Left: optional title pill */}
        {title ? (
          <div className="shrink-0 rounded-2xl border bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold shadow-card" style={{ borderColor: cardTheme.border() }}>
            {title}
          </div>
        ) : null}

        {/* Middle: search */}
        {showSearch && (
          <form
            className="flex-1 min-w-[240px]"
            onSubmit={(e) => { e.preventDefault(); onSearch?.(q.trim()); }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-xl border bg-white dark:bg-gray-900 px-4 text-sm input-focus"
              style={{ borderColor: cardTheme.border() }}
            />
          </form>
        )}

        {/* Right: single caret button */}
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              aria-label="Actions"
              aria-expanded={open}
              className="h-11 w-11 rounded-xl border bg-white dark:bg-gray-900 grid place-items-center shadow-sm transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
              style={{ borderColor: cardTheme.border(mode), boxShadow: open ? cardTheme.shadow(mode) : undefined }}
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-700 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            sideOffset={8}
            align="end"
            className="rounded-2xl border bg-white dark:bg-gray-900 shadow-lg p-1 min-w-[260px] will-change-transform"
            style={{ borderColor: cardTheme.border(), animation: 'menu-in 160ms cubic-bezier(0.22,1,0.36,1)' }}
          >
            {items.map((it) => (
              <DropdownMenu.Item
                key={it.key}
                aria-disabled={it.disabled ? true : undefined}
                onSelect={(e) => {
                  e.preventDefault();
                  it.onClick?.();
                  setOpen(false);
                }}
                className={`group outline-none rounded-xl px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 ${
                  it.disabled ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <span
                  className={`shrink-0 grid place-items-center h-6 w-6 transition-transform duration-150 ease-out group-hover:scale-110 group-active:scale-95 motion-reduce:transition-none ${
                    it.disabled ? 'text-gray-400' : ''
                  }`}
                >
                  {it.icon}
                </span>
                <span
                  className={`text-sm transition-transform duration-150 ease-out group-hover:translate-x-[2px] motion-reduce:transition-none ${
                    it.disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {it.label}
                </span>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      <style>{`
        @keyframes menu-in { from { opacity:0; transform: translateY(-6px);} to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
