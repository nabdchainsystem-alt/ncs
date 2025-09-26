import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { toast } from 'react-hot-toast';
import {
  ChevronDown,
  Plus,
  Upload,
  PackagePlus,
  Boxes,
  Users,
  Wallet,
  FileText,
  Clock3,
  CalendarDays,
  Calendar,
  Sun,
  MoonStar,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import cardTheme from '../../styles/cardTheme';
import { useLiveWeather } from '../../features/overview/hooks';
import type { LiveWeatherSnapshot, WeatherIconKey } from '../../features/overview/weather';

export type PageHeaderItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  comingSoonMessage?: string;
  separatorBefore?: boolean;
};

export type PageHeaderProps = {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  menuItems?: PageHeaderItem[];
  variant?: 'default' | 'widgets';
  metrics?: PageHeaderMetric[];
};

export type PageHeaderMetric = {
  key: string;
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
};

type WidgetDescriptor = PageHeaderMetric;

type WeatherLocationState = {
  latitude: number;
  longitude: number;
};

const WEATHER_ICON_MAP: Record<WeatherIconKey, { day: LucideIcon; night: LucideIcon }> = {
  clear: { day: Sun, night: MoonStar },
  partly: { day: Sun, night: MoonStar },
  cloud: { day: Cloud, night: Cloud },
  rain: { day: CloudRain, night: CloudRain },
  storm: { day: CloudLightning, night: CloudLightning },
  snow: { day: CloudSnow, night: CloudSnow },
  fog: { day: CloudFog, night: CloudFog },
};

const DEFAULT_WEATHER_ICON = { day: Cloud, night: Cloud } satisfies Record<'day' | 'night', LucideIcon>;

const DEFAULT_LOCATION: WeatherLocationState = {
  latitude: 24.7136,
  longitude: 46.6753,
};

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function formatNumeric(value: number): string {
  try {
    return numberFormatter.format(value);
  } catch {
    return String(value);
  }
}

function WidgetBadge({ icon, label, value, tone = 'neutral' }: Omit<WidgetDescriptor, 'key'>) {
  const displayValue = React.useMemo(() => {
    if (typeof value === 'number') return formatNumeric(value);
    return value;
  }, [value]);

  const labelText = `${label}: ${typeof displayValue === 'string' ? displayValue : ''}`;

  return (
    <div className={`rq-chiplet rq-chiplet--${tone}`} aria-label={labelText.trim()}>
      <span className="rq-chiplet__icon" aria-hidden>
        {icon}
      </span>
      <span className="rq-chiplet__value">{displayValue}</span>
    </div>
  );
}

function buildWeatherWidget(snapshot: LiveWeatherSnapshot | undefined, loading: boolean): WidgetDescriptor {
  const temperature = typeof snapshot?.temperatureC === 'number'
    ? `${Math.round(snapshot.temperatureC)}°`
    : loading
      ? 'Updating…'
      : '—';
  const condition = snapshot?.condition ?? (loading ? 'Fetching weather' : 'Weather');
  const iconKey = snapshot?.iconKey ?? 'cloud';
  const isNight = snapshot?.isNight ?? false;
  const Icon = (WEATHER_ICON_MAP[iconKey] ?? DEFAULT_WEATHER_ICON)[isNight ? 'night' : 'day'];

  return {
    key: 'weather',
    label: condition,
    value: temperature,
    icon: <Icon className="h-4 w-4" />,
    tone: 'info',
  } satisfies WidgetDescriptor;
}

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
  variant = 'default',
  metrics = [],
}: PageHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const items = menuItems && menuItems.length ? menuItems : DEFAULT_ITEMS;
  const showWidgetPanel = variant === 'widgets';
  const [now, setNow] = React.useState(() => new Date());
  const [location, setLocation] = React.useState<WeatherLocationState | null>(() =>
    showWidgetPanel ? DEFAULT_LOCATION : null,
  );
  const { data: liveWeather, isLoading: loadingWeather } = useLiveWeather({
    latitude: location?.latitude,
    longitude: location?.longitude,
    enabled: showWidgetPanel && Boolean(location),
  });

  React.useEffect(() => {
    if (!showWidgetPanel) return;
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [showWidgetPanel]);

  React.useEffect(() => {
    if (!showWidgetPanel) return;
    setLocation((prev) => prev ?? DEFAULT_LOCATION);
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        // fallback silently when user denies access
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }, [showWidgetPanel]);

  const timeString = React.useMemo(
    () => now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    [now],
  );
  const dayString = React.useMemo(
    () => now.toLocaleDateString('en-US', { weekday: 'long' }),
    [now],
  );
  const dateString = React.useMemo(
    () => now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [now],
  );

  const widgetItems = React.useMemo(() => {
    if (!showWidgetPanel) return [] as WidgetDescriptor[];
    const list: WidgetDescriptor[] = [
      {
        key: 'time',
        label: 'Time',
        value: timeString,
        icon: <Clock3 className="h-4 w-4" />,
      },
      {
        key: 'day',
        label: 'Day',
        value: dayString,
        icon: <CalendarDays className="h-4 w-4" />,
      },
      {
        key: 'date',
        label: 'Date',
        value: dateString,
        icon: <Calendar className="h-4 w-4" />,
      },
      buildWeatherWidget(liveWeather, loadingWeather),
    ];

    if (metrics.length) {
      for (const metric of metrics) {
        list.push({ ...metric, tone: metric.tone ?? 'neutral' });
      }
    }

    return list;
  }, [showWidgetPanel, timeString, dayString, dateString, liveWeather, loadingWeather, metrics]);

  const mode = cardTheme.runtimeMode();

  return (
    <>
      <div className="rq-header" data-mode={mode} data-variant={showWidgetPanel ? 'metrics' : 'plain'}>
        {title ? (
          <div className="rq-header__title" data-rq-role="title">
            {title}
          </div>
        ) : null}

        {showWidgetPanel ? (
          <div className="rq-header__metrics" role="toolbar" aria-label={`${title ?? 'Page'} live metrics`}>
            {widgetItems.map(({ key, ...rest }) => (
              <WidgetBadge key={key} {...rest} />
            ))}
          </div>
        ) : null}

        {showSearch ? (
          <form
            className="rq-search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.(q.trim());
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              placeholder={searchPlaceholder}
              className={`rq-search__input ${showWidgetPanel ? 'rq-search__input--metrics' : 'rq-search__input--plain'}`}
            />
          </form>
        ) : null}

        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              aria-label="Actions"
              aria-expanded={open}
              className="rq-actions"
            >
              <ChevronDown className={`rq-actions__icon ${open ? 'rq-actions__icon--open' : ''}`} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            sideOffset={8}
            align="end"
            className="rq-actions-menu"
            style={{ borderColor: cardTheme.border(), boxShadow: cardTheme.shadow(mode) }}
          >
            {items.map((it, index) => {
              const showSeparator = Boolean(it.separatorBefore) && index > 0;
              return (
                <React.Fragment key={it.key}>
                  {showSeparator ? (
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
                  ) : null}
                  <DropdownMenu.Item
                    aria-disabled={it.disabled ? true : undefined}
                    onSelect={(e) => {
                      e.preventDefault();
                      if (it.disabled) {
                        toast(it.comingSoonMessage ?? 'Coming Soon');
                        setOpen(false);
                        return;
                      }
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
                </React.Fragment>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      <style>{`
        :host {
          display: block;
          position: relative;
        }

        .rq-header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: clamp(12px, 3vw, 24px);
          padding: clamp(16px, 3.2vw, 26px);
          border-radius: 26px;
          border: 1px solid rgba(203,210,224,0.45);
          background: rgba(255,255,255,0.94);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 18px 36px rgba(15,23,42,0.1);
        }

        [data-mode="dark"] .rq-header {
          background: rgba(20,24,34,0.9);
          border-color: rgba(80,88,107,0.45);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 44px rgba(6,8,14,0.45);
        }

        .rq-header__title {
          font-weight: 650;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 0.82rem;
          color: rgba(99,105,128,0.88);
          padding-inline: 6px 12px;
          flex: 0 0 auto;
        }

        .rq-header__metrics {
          display: inline-flex;
          flex-wrap: wrap;
          gap: clamp(6px, 1.6vw, 16px);
          flex: 1 1 auto;
        }

        .rq-chiplet {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 36px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid rgba(208,214,229,0.6);
          background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,246,252,0.9) 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 12px 26px rgba(15,23,42,0.16);
          font-size: 0.95rem;
          font-weight: 600;
          color: #111827;
        }

        [data-mode="dark"] .rq-chiplet {
          background: linear-gradient(180deg, rgba(30,34,45,0.9) 0%, rgba(22,26,36,0.82) 100%);
          border-color: rgba(90,98,116,0.45);
          color: rgba(235,237,242,0.9);
        }

        .rq-chiplet__icon {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          color: rgba(37,99,235,0.7);
        }

        .rq-chiplet__value {
          letter-spacing: 0.03em;
        }

        .rq-chiplet--danger {
          border-color: rgba(248,113,113,0.45);
          box-shadow: 0 0 0 3px rgba(248,113,113,0.18), 0 16px 32px rgba(203,28,73,0.18);
        }

        .rq-chiplet--warning {
          border-color: rgba(251,191,36,0.45);
          box-shadow: 0 0 0 3px rgba(251,191,36,0.16), 0 16px 32px rgba(201,162,9,0.14);
        }

        .rq-chiplet--info {
          border-color: rgba(56,189,248,0.4);
          color: hsl(204 80% 32%);
        }

        .rq-search {
          position: relative;
          flex: 0 0 clamp(220px, 26vw, 320px);
        }

        .rq-search__input {
          width: 100%;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(202,209,222,0.55);
          background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,246,252,0.9) 100%);
          padding: 0 18px;
          font-size: 0.94rem;
          color: #111827;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(15,23,42,0.08);
        }

        [data-mode="dark"] .rq-search__input {
          background: rgba(26,29,39,0.88);
          border-color: rgba(92,99,118,0.4);
          color: rgba(229,231,235,0.92);
        }

        .rq-search__input--metrics {
          background: rgba(255,255,255,0.92);
        }

        .rq-search__input--plain {
          background: rgba(255,255,255,0.95);
        }

        .rq-header[data-variant="plain"] {
          justify-content: space-between;
        }

        .rq-header[data-variant="plain"] .rq-header__metrics {
          display: none;
        }

        .rq-header[data-variant="plain"] .rq-search {
          flex: 0 0 clamp(260px, 30vw, 360px);
        }

        .rq-search__input:focus-visible {
          outline: none;
          border-color: rgba(59,130,246,0.55);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.28);
        }

        .rq-actions {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(203,210,224,0.6);
          background: linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(244,246,251,0.88) 100%);
          display: grid;
          place-items: center;
          color: rgba(107,114,128,0.9);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 14px 26px rgba(15,23,42,0.14);
          flex: 0 0 auto;
        }

        [data-mode="dark"] .rq-actions {
          background: rgba(29,33,44,0.92);
          border-color: rgba(88,95,112,0.45);
          color: rgba(203,213,225,0.8);
        }

        .rq-actions:hover {
          transform: translateY(-1px);
        }

        .rq-actions__icon {
          width: 18px;
          height: 18px;
          transition: transform 160ms ease;
        }

        .rq-actions__icon--open {
          transform: rotate(180deg);
        }

        .rq-actions-menu {
          border-radius: 18px;
          background: rgba(255,255,255,0.95);
          padding: 8px;
          min-width: 240px;
        }

        [data-mode="dark"] .rq-actions-menu {
          background: rgba(26,30,40,0.9);
        }

        @media (max-width: 920px) {
          .rq-header {
            flex-direction: column;
            align-items: stretch;
          }

          .rq-header__metrics {
            justify-content: center;
            width: 100%;
          }

          .rq-search {
            width: 100%;
          }

          .rq-header[data-variant="plain"] .rq-search {
            width: 100%;
          }

          .rq-actions {
            align-self: flex-end;
          }
        }
      `}</style>
    </>
  );
}
