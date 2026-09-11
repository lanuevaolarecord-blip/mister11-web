import React, { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { generateSwotAiSummary } from '../utils/swotRules';
import { Sparkles, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';
import './SwotMatrix.css';

export const SwotMatrix = ({
  derivedSwot = {},
  matchData = {},
  onNavigateToSection = () => {},
  onSaveManualItem = null,
}) => {
  const { t, isEn } = useTranslation();

  const [manualItems, setManualItems] = useState({
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  });

  const [newItemText, setNewItemText] = useState({
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: ''
  });

  const [activeAddQuadrant, setActiveAddQuadrant] = useState(null);
  const [aiSummary, setAiSummary] = useState(matchData?.swotAiSummary || '');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Combinar ítems derivados por reglas + manuales
  const quadrants = useMemo(() => {
    const rawQ = derivedSwot?.quadrants || {};
    return {
      strengths: [...(rawQ.strengths || []), ...(manualItems.strengths || [])],
      weaknesses: [...(rawQ.weaknesses || []), ...(manualItems.weaknesses || [])],
      opportunities: [...(rawQ.opportunities || []), ...(manualItems.opportunities || [])],
      threats: [...(rawQ.threats || []), ...(manualItems.threats || [])],
    };
  }, [derivedSwot, manualItems]);

  const handleAddManualItem = (quadrant) => {
    const text = (newItemText[quadrant] || '').trim();
    if (!text) return;

    const newItem = {
      id: `manual_${Date.now()}`,
      quadrant,
      text,
      textKey: null,
      isRule: false,
      isManual: true,
      metricRefs: [{ label: t('swot.manual_badge'), value: 'Míster' }]
    };

    setManualItems(prev => ({
      ...prev,
      [quadrant]: [...prev[quadrant], newItem]
    }));

    setNewItemText(prev => ({ ...prev, quadrant: '' }));
    setActiveAddQuadrant(null);

    if (onSaveManualItem) {
      onSaveManualItem(quadrant, newItem);
    }
  };

  const handleGenerateAi = async () => {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const summary = await generateSwotAiSummary({
        swotQuadrants: quadrants,
        isEn,
        teamName: matchData?.local || matchData?.equipoLocal || 'Mi Equipo',
        t
      });
      setAiSummary(summary);
    } catch (err) {
      console.error('[SwotMatrix] Error generando resumen IA:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleChipClick = (metricRef) => {
    if (metricRef?.targetRef) {
      onNavigateToSection(metricRef.targetRef);
      const el = document.getElementById(metricRef.targetRef);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const renderQuadrantCard = (quadrantKey, title, icon, colorClass) => {
    const items = quadrants[quadrantKey] || [];

    return (
      <div className={`swot-quadrant-card ${colorClass}`}>
        <div className="swot-quadrant-header">
          <h4 className="swot-quadrant-title">
            <span>{icon}</span>
            <span>{title}</span>
            <span className="swot-count-pill">{items.length}</span>
          </h4>
          <button
            type="button"
            className="swot-add-btn"
            onClick={() => setActiveAddQuadrant(activeAddQuadrant === quadrantKey ? null : quadrantKey)}
            title={t('swot.add_manual')}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Formulario rápido para agregar ítem manual */}
        {activeAddQuadrant === quadrantKey && (
          <div className="swot-manual-input-box">
            <input
              type="text"
              className="swot-input-text"
              placeholder={isEn ? "Add observation..." : "Escribe una observación..."}
              value={newItemText[quadrantKey] || ''}
              onChange={(e) => setNewItemText(prev => ({ ...prev, [quadrantKey]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAddManualItem(quadrantKey)}
            />
            <button
              type="button"
              className="swot-input-submit-btn"
              onClick={() => handleAddManualItem(quadrantKey)}
            >
              ✓
            </button>
          </div>
        )}

        {/* Lista de ítems del cuadrante */}
        <div className="swot-items-list">
          {items.length === 0 ? (
            <div className="swot-empty-msg">{t('swot.no_items')}</div>
          ) : (
            items.map((item, idx) => {
              const textContent = item.textKey ? t(item.textKey) : item.text;
              return (
                <div key={item.id || idx} className="swot-item-row">
                  <div className="swot-item-header">
                    <span className={`swot-origin-tag ${item.isManual ? 'tag-manual' : 'tag-rule'}`}>
                      {item.isManual ? t('swot.manual_badge') : t('swot.auto_badge')}
                    </span>
                    {item.metricRefs && item.metricRefs.map((ref, rIdx) => (
                      <button
                        key={rIdx}
                        type="button"
                        className="swot-metric-chip"
                        onClick={() => handleChipClick(ref)}
                      >
                        <span>{ref.label}: {ref.value}</span>
                        {ref.targetRef && <ArrowUpRight size={12} />}
                      </button>
                    ))}
                  </div>
                  <div className="swot-item-text">{textContent}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="swot-matrix-wrapper">
      <div className="swot-header-toolbar">
        <div>
          <h3 className="swot-main-title">🎯 {t('swot.title')}</h3>
          <p className="swot-main-subtitle">
            {isEn
              ? 'Tactical analysis derived deterministically from match metrics with full traceability.'
              : 'Análisis táctico derivado de las métricas reales del partido con trazabilidad completa.'}
          </p>
        </div>

        <button
          type="button"
          className="swot-ai-btn"
          onClick={handleGenerateAi}
          disabled={isGeneratingAi}
        >
          {isGeneratingAi ? (
            <>
              <RefreshCw size={16} className="spin-icon" />
              <span>{t('swot.generating_ai')}</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>{t('swot.btn_generate_ai')}</span>
            </>
          )}
        </button>
      </div>

      {/* Grid 2x2 */}
      <div className="swot-grid-2x2">
        {renderQuadrantCard('strengths', t('swot.strengths'), '🟢', 'swot-strengths')}
        {renderQuadrantCard('weaknesses', t('swot.weaknesses'), '🔴', 'swot-weaknesses')}
        {renderQuadrantCard('opportunities', t('swot.opportunities'), '🟡', 'swot-opportunities')}
        {renderQuadrantCard('threats', t('swot.threats'), '🟠', 'swot-threats')}
      </div>

      {/* Resumen Táctico redactado por IA */}
      {aiSummary && (
        <div className="swot-ai-summary-card">
          <div className="swot-ai-summary-header">
            <span className="swot-ai-badge">
              <Sparkles size={14} />
              <span>{t('swot.ai_summary_title')}</span>
            </span>
          </div>
          <div className="swot-ai-summary-text">
            {aiSummary.split('\n\n').map((paragraph, pIdx) => (
              <p key={pIdx} style={{ margin: '0 0 10px 0', lineHeight: 1.6 }}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwotMatrix;
