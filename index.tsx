import './src/polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './MainApp';
import './index.css';

// BOUNTY FIX: Suppress logs in production
if (import.meta.env.PROD) {
  console.log = () => { };
  console.debug = () => { };
  console.info = () => { };
  // Keep warn and error for critical telemetry
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);