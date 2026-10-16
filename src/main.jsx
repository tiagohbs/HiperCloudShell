import React from 'react';
import ReactDOM from 'react-dom/client';
import './tauri-bridge.js';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HiperCloudShell Frontend Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', fontFamily: 'monospace', color: '#f87171', background: '#0a101f', height: '100vh', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#fca5a5' }}>
            ⚠️ Ocorreu um erro no HiperCloudShell
          </h2>
          <p style={{ marginBottom: '12px', color: '#e2e8f0' }}>{this.state.error?.toString()}</p>
          <pre style={{ background: '#070b14', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack || this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '8px 16px', background: '#d4a81e', color: '#1a1005', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Recarregar Aplicação
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global unhandled error logging
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[Global Error]:', event.error || event.message);
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
