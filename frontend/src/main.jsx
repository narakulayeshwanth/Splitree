import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#161d2e', color: '#e2e8f0', border: '1px solid rgba(16,185,129,0.2)', fontSize: 14 },
          success: { iconTheme: { primary: '#10b981', secondary: '#161d2e' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);
