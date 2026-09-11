import React, { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { CAPTURE_CRITERIA, CRITERIA_CATEGORIES } from '../config/captureCriteria';
import { generateCriteriaPdfReport } from '../utils/criteriaPdfReport';
import './CaptureCriteriaModal.css';

/**
 * CaptureCriteriaModal
 * Modal interactivo con manual de criterios de captura táctica.
 * Incluye buscador en tiempo real, acordeón por categorías y descarga PDF imprimible.
 */
export const CaptureCriteriaModal = ({
  isOpen,
  onClose,
  teamName = 'Mi Equipo',
}) => {
  const { t, isEn } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const filteredCriteria = useMemo(() => {
    return CAPTURE_CRITERIA.filter(item => {
      // Filtro de categoría
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (isEn ? item.nameEn : item.nameEs).toLowerCase();
        const short = (isEn ? item.shortEn : item.shortEs).toLowerCase();
        const rule = (isEn ? item.binaryRuleEn : item.binaryRuleEs).toLowerCase();
        return name.includes(q) || short.includes(q) || rule.includes(q);
      }
      return true;
    });
  }, [searchQuery, selectedCategory, isEn]);

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await generateCriteriaPdfReport({
        teamName,
        language: isEn ? 'en' : 'es',
      });
    } catch (err) {
      console.error("Error al exportar PDF de criterios:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="criteria-modal-overlay" onClick={onClose}>
      <div className="criteria-modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="criteria-modal-header">
          <div className="criteria-title-row">
            <h3 className="criteria-title">
              <span>❓</span>
              <span>{isEn ? 'Capture Criteria Manual' : 'Manual de Criterios de Captura'}</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="criteria-btn-pdf"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                title={isEn ? 'Download printable PDF for touchline staff' : 'Descargar PDF imprimible para el delegado'}
              >
                {exportingPdf ? (isEn ? 'Exporting...' : 'Exportando...') : (isEn ? '📄 PDF Manual' : '📄 Manual en PDF')}
              </button>
              <button type="button" className="criteria-close-btn" onClick={onClose}>✕</button>
            </div>
          </div>

          <p className="criteria-subtitle">
            {isEn
              ? 'Binary operational definitions (YES/NO) to ensure honest, reproducible data without subjective inflation.'
              : 'Definiciones operativas binarias (SÍ/NO) para un registro honesto, comparable y sin inflaciones subjetivas.'}
          </p>

          {/* Barra de Búsqueda */}
          <div className="criteria-search-bar">
            <input
              type="text"
              className="criteria-search-input"
              placeholder={isEn ? 'Search action or rule (e.g. shot, save, duel)...' : 'Buscar acción o regla (ej. tiro, parada, duelo)...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="criteria-search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          {/* Píldoras de Categorías */}
          <div className="criteria-cats-scroll">
            {CRITERIA_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`criteria-cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {isEn ? cat.labelEn : cat.labelEs}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Fichas de Criterios */}
        <div className="criteria-modal-body">
          {filteredCriteria.length === 0 ? (
            <div className="criteria-empty">
              <p>{isEn ? 'No criteria found matching your search.' : 'No se encontraron criterios que coincidan con la búsqueda.'}</p>
            </div>
          ) : (
            <div className="criteria-list">
              {filteredCriteria.map(item => {
                const isExpanded = expandedId === item.id;
                const name = isEn ? item.nameEn : item.nameEs;
                const shortDesc = isEn ? item.shortEn : item.shortEs;
                const binaryRule = isEn ? item.binaryRuleEn : item.binaryRuleEs;
                const whenYes = isEn ? item.whenYesEn : item.whenYesEs;
                const whenNo = isEn ? item.whenNoEn : item.whenNoEs;
                const example = isEn ? item.touchlineExampleEn : item.touchlineExampleEs;

                return (
                  <div key={item.id} className="criteria-card">
                    <div
                      className="criteria-card-header"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <div className="criteria-card-title-block">
                        <strong className="criteria-card-name">{name}</strong>
                        <span className="criteria-card-short">{shortDesc}</span>
                      </div>
                      <span className="criteria-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isExpanded && (
                      <div className="criteria-card-body">
                        {/* Regla Binaria */}
                        <div className="criteria-section rule-box">
                          <span className="criteria-label">⚖️ {isEn ? 'Binary Test:' : 'Regla Binaria:'}</span>
                          <p className="criteria-rule-text">{binaryRule}</p>
                        </div>

                        {/* Cuándo SÍ / Cuándo NO */}
                        <div className="criteria-grid-2">
                          <div className="criteria-subbox yes">
                            <span className="criteria-label-sub">✅ {isEn ? 'WHEN IT COUNTS:' : 'CUÁNDO SÍ CUENTA:'}</span>
                            <p>{whenYes}</p>
                          </div>
                          <div className="criteria-subbox no">
                            <span className="criteria-label-sub">❌ {isEn ? 'WHEN IT DOES NOT:' : 'CUÁNDO NO CUENTA:'}</span>
                            <p>{whenNo}</p>
                          </div>
                        </div>

                        {/* Ejemplo de Banda */}
                        <div className="criteria-section">
                          <span className="criteria-label">👀 {isEn ? 'Touchline Example:' : 'Ejemplo a pie de banda:'}</span>
                          <p className="criteria-example-text">"{example}"</p>
                        </div>

                        {/* Botón y Métricas */}
                        <div className="criteria-meta-row">
                          <div>
                            <span className="criteria-label-small">{isEn ? 'Button in App:' : 'Botón en la App:'}</span>
                            <span className="criteria-tag-btn">{item.buttonLabel}</span>
                          </div>
                          <div>
                            <span className="criteria-label-small">{isEn ? 'Feeds:' : 'Alimenta:'}</span>
                            <div className="criteria-feeds-chips">
                              {item.feeds.map((f, i) => (
                                <span key={i} className="criteria-feed-chip">{f}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="criteria-modal-footer">
          <button type="button" className="criteria-btn-done" onClick={onClose}>
            {isEn ? 'Close' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptureCriteriaModal;
