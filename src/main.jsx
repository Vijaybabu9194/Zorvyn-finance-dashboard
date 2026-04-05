import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { FinanceProvider } from './state/FinanceContext';
import './styles.css';

const appVersion = '2026-04-05-ui-redesign-v2';
const savedVersion = localStorage.getItem('finance-dashboard-version');

if (savedVersion !== appVersion) {
  localStorage.setItem('finance-dashboard-version', appVersion);

  if ('caches' in window) {
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }
}

const savedTheme = localStorage.getItem('finance-dashboard-theme');
document.body.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </React.StrictMode>
);
