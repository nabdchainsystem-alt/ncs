import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';

export type HeaderAction = {
  key: string;
  label?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string; // optional link action
};

export default function HeaderBar({
  title,
  onSearch,
  searchPlaceholder = 'Search…',
  actions = [],
}: {
  title: string;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  actions?: HeaderAction[];
}) {
  const [q, setQ] = React.useState('');

  // Decide how many actions to show inline based on viewport width
  const [inlineCount, setInlineCount] = React.useState(4);
  React.useEffect(() => {
    const update = () => setInlineCount(window.innerWidth < 480 ? 2 : window.innerWidth < 768 ? 3 : 4);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const inline = actions.slice(0, inlineCount);
  const overflow = actions.slice(inlineCount);

  return (
    <header className="w-full">
      <div className="flex items-center gap-3">
        {/* Left: Title inside subtle block */}
        <div className="shrink-0 rounded-2xl border bg-white px-4 py-2.5 text-sm font-semibold shadow-card">
          {title}
        </div>

        {/* Middle: Search fills available space */}
        <form
          className="flex-1 flex"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch?.(q.trim());
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-full border px-4 text-sm input-focus"
          />
        </form>

        {/* Right: Actions (icons) */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {inline.map((a) =>
            a.href ? (
              <a key={a.key} href={a.href} title={a.label} className="px-3 py-2.5 rounded-xl border bg-white hover:bg-gray-50">
                {a.icon}
              </a>
            ) : (
              <button key={a.key} title={a.label} onClick={a.onClick} className="px-3 py-2.5 rounded-xl border bg-white hover:bg-gray-50">
                {a.icon}
              </button>
            )
          )}
          {overflow.length > 0 && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="px-3 py-2.5 rounded-xl border bg-white hover:bg-gray-50" aria-label="More actions">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content sideOffset={6} className="rounded-xl border bg-white p-1 shadow-card text-sm">
                {overflow.map((a) => (
                  <DropdownMenu.Item key={a.key} className="px-3 py-2 rounded hover:bg-gray-50 outline-none" onClick={a.onClick}>
                    <span className="inline-flex items-center gap-2">{a.icon}<span>{a.label || a.key}</span></span>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
        </div>
      </div>
    </header>
  );
}
