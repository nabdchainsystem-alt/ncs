import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import './index.css';
import { initUiPrefs } from './styles/initUiPrefs';

declare global {
  interface Window {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
}

if (typeof window !== 'undefined') {
  const existingProcess = window.process ?? {};
  const existingEnv = existingProcess.env ?? {};
  window.process = {
    ...existingProcess,
    env: {
      NODE_ENV: import.meta.env.MODE,
      ...existingEnv,
      REDUX_LOGGING: existingEnv.REDUX_LOGGING ?? '',
    },
  };
}

const queryClient = new QueryClient();

initUiPrefs();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
