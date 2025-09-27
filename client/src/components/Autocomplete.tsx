import React from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

type AutocompleteProps<T> = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  fetcher: (term: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  inputClassName?: string;
  containerClassName?: string;
  debounce?: number;
};

function Autocomplete<T>({
  value,
  onChange,
  onSelect,
  fetcher,
  getLabel,
  placeholder,
  disabled,
  emptyMessage = "No results",
  inputClassName,
  containerClassName,
  debounce = 300,
}: AutocompleteProps<T>) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const debouncedValue = useDebouncedValue(value, debounce);
  const requestIdRef = React.useRef(0);

  const close = React.useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    setOptions([]);
  }, []);

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [close]);

  React.useEffect(() => {
    if (!open) return;
    const term = debouncedValue.trim();
    if (!term) {
      setOptions([]);
      setActiveIndex(-1);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;
    setLoading(true);
    fetcher(term)
      .then((results) => {
        if (cancelled || requestIdRef.current !== nextRequestId) return;
        setOptions(results);
        setActiveIndex(results.length ? 0 : -1);
      })
      .catch(() => {
        if (cancelled || requestIdRef.current !== nextRequestId) return;
        setOptions([]);
        setActiveIndex(-1);
      })
      .finally(() => {
        if (cancelled || requestIdRef.current !== nextRequestId) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedValue, fetcher, open]);

  React.useEffect(() => {
    if (disabled) {
      close();
    }
  }, [disabled, close]);

  const handleSelect = React.useCallback(
    (item: T) => {
      const label = getLabel(item);
      onChange(label);
      onSelect(item);
      close();
    },
    [close, getLabel, onChange, onSelect],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => {
        if (!options.length) return -1;
        return prev < options.length - 1 ? prev + 1 : 0;
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => {
        if (!options.length) return -1;
        return prev <= 0 ? options.length - 1 : prev - 1;
      });
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < options.length) {
        event.preventDefault();
        handleSelect(options[activeIndex]);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        close();
      }
    }
  };

  const shouldShowList = open && (loading || options.length > 0 || (debouncedValue.trim().length > 0 && !loading));

  return (
    <div ref={containerRef} className={`relative ${containerClassName ?? ""}`}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.currentTarget.value);
          if (!disabled) {
            setOpen(true);
          }
        }}
        onFocus={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        className={`${inputClassName ?? ""} ${loading ? "pr-8" : ""}`.trim()}
      />
      {loading ? (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </span>
      ) : null}
      {shouldShowList ? (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.length ? (
            <ul role="listbox">
              {options.map((option, index) => {
                const label = getLabel(option);
                const isActive = index === activeIndex;
                return (
                  <li
                    key={`${label}-${index}`}
                    role="option"
                    aria-selected={isActive}
                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-sky-50 ${isActive ? "bg-sky-50 text-sky-700" : "text-gray-700"}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelect(option);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {label}
                  </li>
                );
              })}
            </ul>
          ) : debouncedValue.trim().length > 0 && !loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default Autocomplete;
