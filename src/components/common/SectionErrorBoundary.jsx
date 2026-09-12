/**
 * src/components/common/SectionErrorBoundary.jsx
 * Míster11 — Error Boundary Aislado por Sección (Resiliencia Granular)
 *
 * Previene que un fallo de cálculo, datos corruptos o error de renderizado en
 * una gráfica o bloque estadístico específico bloquee el partido completo.
 * Mantiene el resto del informe, actas, alineación y marcadores 100% operativos.
 */

import React, { Component } from 'react';
import { t } from '../../i18n/translations';
import './SectionErrorBoundary.css';

export class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const code = this.props.sectionCode || 'SEC_UNKNOWN';
    console.error(`[SectionErrorBoundary] Error aislado capturado en sección [${code}]:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      try {
        this.props.onRetry();
      } catch (_) {}
    }
  };

  render() {
    if (this.state.hasError) {
      const code = this.props.sectionCode || 'ERR_SECTION';
      const title = this.props.sectionTitle || t('error.section_unavailable');

      return (
        <div className="section-error-card" role="alert">
          <div className="section-error-header">
            <span className="section-error-icon">⚠️</span>
            <div className="section-error-titles">
              <h4 className="section-error-title">{title}</h4>
              <span className="section-error-badge">
                {t('error.section_code', null, { code })}
              </span>
            </div>
          </div>

          <p className="section-error-desc">
            {t('error.section_desc')}
          </p>

          <div className="section-error-actions">
            <button
              type="button"
              className="section-error-retry-btn"
              onClick={this.handleRetry}
            >
              🔄 {t('error.retry_section')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
