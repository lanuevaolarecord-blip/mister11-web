/**
 * MatchErrorBoundary.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Error Boundary especializado para el Módulo de Partidos de Míster11.
 * 
 * Previene que cualquier documento de partido corrupto, legacy o con errores
 * tumbe la aplicación, ofreciendo siempre TRES rutas de rescate claras:
 *  1. 🔄 Recargar página
 *  2. 📋 Volver a la lista de partidos
 *  3. 🔧 Reparar y abrir (Saneado automático con sanitizeMatchData)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { Component } from 'react';

class MatchErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRepairing: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[MatchErrorBoundary] Error crítico capturado en partido:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleBackToList = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isRepairing: false });
    if (this.props.onBackToList) {
      this.props.onBackToList();
    }
  };

  handleRepairAndOpen = async () => {
    this.setState({ isRepairing: true });
    try {
      if (this.props.onRepairAndOpen) {
        await this.props.onRepairAndOpen();
      }
      this.setState({ hasError: false, error: null, errorInfo: null, isRepairing: false });
    } catch (err) {
      console.error('[MatchErrorBoundary] Error durante la reparación asistida:', err);
      this.setState({ isRepairing: false, error: err });
    }
  };

  render() {
    if (this.state.hasError) {
      const match = this.props.matchData || {};
      const matchTitle = match.rival
        ? `${match.local || 'Mi Equipo'} vs ${match.rival}`
        : (match.id ? `Partido #${match.id}` : 'Partido');

      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#FFFFFF',
          backgroundColor: '#0B1317'
        }}>
          <div style={{
            maxWidth: '580px',
            width: '100%',
            backgroundColor: '#162228',
            border: '1.5px solid #F59E0B',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3.2rem', lineHeight: '1' }}>🛡️</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#F59E0B' }}>
                Protección Anti-Crash Activada
              </h2>
              <span style={{ fontSize: '0.88rem', color: '#94A3B8' }}>
                Partido: <strong style={{ color: '#F1F5F9' }}>{matchTitle}</strong> {match.date && `(${match.date})`}
              </span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.5' }}>
              Este partido contenía datos heredados o inconsistencias en su estructura. La aplicación ha aislado el error para proteger tu sesión. Puedes repararlo automáticamente y continuar.
            </p>

            {/* Tres Botones de Acción */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%'
            }}>
              <button
                type="button"
                onClick={this.handleRepairAndOpen}
                disabled={this.state.isRepairing}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  flex: '1 1 auto',
                  justifyContent: 'center',
                  minWidth: '180px'
                }}
              >
                {this.state.isRepairing ? '⏳ Reparando datos...' : '🔧 Reparar y abrir partido'}
              </button>

              <button
                type="button"
                onClick={this.handleBackToList}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '12px 18px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: '1 1 auto',
                  justifyContent: 'center'
                }}
              >
                📋 Volver a la lista
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔄 Recargar página
              </button>
            </div>

            {/* Detalles Técnicos Plegables */}
            {this.state.error && (
              <details style={{ marginTop: '12px', textAlign: 'left', width: '100%', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '6px', color: '#F59E0B' }}>
                  🔍 Ver detalle técnico del incidente
                </summary>
                <pre style={{
                  backgroundColor: '#000000',
                  padding: '10px',
                  borderRadius: '6px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  color: '#F87171',
                  margin: 0
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

export default MatchErrorBoundary;
