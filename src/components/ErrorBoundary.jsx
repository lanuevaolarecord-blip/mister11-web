import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error de renderizado capturado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-main, #ffffff)',
          backgroundColor: 'var(--bg-main, #0B1317)'
        }}>
          <div style={{
            maxWidth: '520px',
            backgroundColor: 'var(--bg-card, #162228)',
            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0, color: '#4CAF7D' }}>
              Ha ocurrido un problema imprevisto
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.5' }}>
              No te preocupes, el resto de la aplicación y tus datos siguen seguros. Puedes recargar esta sección o volver al Dashboard.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#4CAF7D',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔄 Recargar página
              </button>
              <button
                onClick={this.handleGoDashboard}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🏠 Volver al Dashboard
              </button>
            </div>

            {this.state.error && (
              <details style={{ marginTop: '1rem', textAlign: 'left', width: '100%', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Detalles técnicos del error</summary>
                <pre style={{
                  backgroundColor: '#000000',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
