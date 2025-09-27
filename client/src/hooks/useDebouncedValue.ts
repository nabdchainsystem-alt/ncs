import React from 'react';

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), Math.max(0, delay));
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
