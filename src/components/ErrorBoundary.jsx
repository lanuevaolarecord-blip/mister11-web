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
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: '#F8FAFC',
          backgroundColor: '#0B1317'
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            backgroundColor: '#162228',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: '#4CAF7D' }}>
              Ha ocurrido un problema imprevisto
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#CBD5E1', margin: 0, lineHeight: '1.5' }}>
              No te preocupes, el resto de la aplicación y tus datos siguen seguros. Puedes recargar esta sección o volver al Dashboard.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#4CAF7D',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: '800',
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
                type="button"
                onClick={this.handleGoDashboard}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🏠 Volver al Dashboard
              </button>
            </div>

            {this.state.error && (
              <details style={{ marginTop: '1rem', textAlign: 'left', width: '100%', fontSize: '0.85rem', color: '#94A3B8' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: '700', color: '#D4A843' }}>
                  Ver detalles técnicos del error
                </summary>
                <pre style={{
                  backgroundColor: '#000000',
                  color: '#F87171',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: '12px'
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
