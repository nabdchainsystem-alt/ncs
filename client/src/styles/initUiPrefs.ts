const THEME_KEY = 'ncs:theme';
const DIR_KEY = 'ncs:dir';

function prefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function initUiPrefs() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  let theme: string | null = null;
  try {
    theme = window.localStorage.getItem(THEME_KEY);
  } catch {
    theme = null;
  }

  if (!theme || (theme !== 'light' && theme !== 'dark')) {
    theme = prefersDark() ? 'dark' : 'light';
  }

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  let direction: string | null = null;
  try {
    direction = window.localStorage.getItem(DIR_KEY);
  } catch {
    direction = null;
  }
  const dirValue = direction === 'rtl' ? 'rtl' : 'ltr';
  root.setAttribute('dir', dirValue);
}
