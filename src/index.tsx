import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global Error Handler for "White Page" Debugging
window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.backgroundColor = '#fee2e2';
  errorDiv.style.color = '#991b1b';
  errorDiv.style.padding = '20px';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.borderBottom = '2px solid #b91c1c';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.innerHTML = `<strong>Global Error:</strong> ${event.message} <br/><small>${event.filename}:${event.lineno}:${event.colno}</small>`;
  document.body.appendChild(errorDiv);
  console.error("Global Error Caught:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.bottom = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.backgroundColor = '#fef3c7';
  errorDiv.style.color = '#92400e';
  errorDiv.style.padding = '20px';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.borderTop = '2px solid #d97706';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.innerHTML = `<strong>Unhandled Rejection:</strong> ${event.reason}`;
  document.body.appendChild(errorDiv);
  console.error("Unhandled Rejection Caught:", event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);