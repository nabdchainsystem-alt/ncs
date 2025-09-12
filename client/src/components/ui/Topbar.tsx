

import React from "react";
import { twMerge } from "tailwind-merge";

function IconHamburger(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
function IconMoon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}
function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M15 17h5l-1-1v-4a7 7 0 10-14 0v4l-1 1h5m6 0a3 3 0 11-6 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Topbar({
  className,
  onMenu,
}: {
  className?: string;
  onMenu?: () => void;
}) {
  return (
    <header className={twMerge("w-full bg-white border-b shadow-card relative z-50", className)}>
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: menu + search */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Open menu"
            onClick={onMenu}
            className="h-9 w-9 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            <IconHamburger />
          </button>

          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search or type command…"
              className="h-10 w-[320px] rounded-2xl border pl-9 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 border rounded px-1 py-0.5">⌘K</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button className="h-9 w-9 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50" title="Toggle theme">
            <IconMoon />
          </button>

          <button className="relative h-9 w-9 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50" title="Notifications">
            <IconBell />
            <span className="absolute top-2.5 right-2 h-2 w-2 rounded-full bg-orange-400"></span>
          </button>

          <div className="h-9 px-2 rounded-full border flex items-center gap-2 hover:bg-gray-50">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs font-semibold">U</span>
            <span className="text-sm text-gray-700">User</span>
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-gray-500" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
