import React, { useState, useMemo } from 'react';
import {
  Check,
  Shield,
  AlertCircle,
  Sparkles,
  Loader2,
  Trash2,
  Users,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import { t } from '../../i18n/translations';
import { PlayerAvatar } from '../PlayerAvatar';
import { classifyPosition, calculateConvocationTime, generateConvocationPNG } from '../../utils/convocationPNGGenerator';
import { ConvocationPreviewModal } from './ConvocationPreviewModal';

const MAX_CONVOCATION = 18;

export const ConvocationSelector = ({
  matchData = {},
  players = [],
  teamData = {},
  teamId = null,
  teamPath = null,
  coachName = 'Míster Principal',
  lang = 'es',
  currentUserId = null,
  onSaveConvocation = null
}) => {
  // Lista de IDs seleccionados (inicialmente si matchData ya tenía convocados, cargarlos)
  const [selectedIds, setSelectedIds] = useState(() => {
    if (matchData?.convocados && Array.isArray(matchData.convocados)) {
      return matchData.convocados.slice(0, MAX_CONVOCATION);
    }
    return [];
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPNG, setGeneratedPNG] = useState(null); // { blob, url, filename }
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Clasificar plantilla en las 4 posiciones canónicas
  const groupedPlayers = useMemo(() => {
    const groups = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: []
    };

    players.forEach(p => {
      const cat = classifyPosition(p.position || p.posicion || p.role);
      groups[cat].push(p);
    });

    // Ordenar por dorsal numérico
    const sortFn = (a, b) => {
      const numA = parseInt(a.number !== undefined ? a.number : (a.dorsal || 999), 10);
      const numB = parseInt(b.number !== undefined ? b.number : (b.dorsal || 999), 10);
      return numA - numB;
    };

    return {
      GK: groups.GK.sort(sortFn),
      DEF: groups.DEF.sort(sortFn),
      MID: groups.MID.sort(sortFn),
      FWD: groups.FWD.sort(sortFn)
    };
  }, [players]);

  const selectedCount = selectedIds.length;
  const isAtLimit = selectedCount >= MAX_CONVOCATION;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const togglePlayer = (player) => {
    const id = player.id || player.uid || player.docId;
    if (!id) return;

    if (selectedIds.includes(id)) {
      const next = selectedIds.filter(x => x !== id);
      setSelectedIds(next);
      if (onSaveConvocation) onSaveConvocation(next);
    } else {
      if (isAtLimit) {
        showToast(t('convocation.limitReached', lang));
        return;
      }
      const next = [...selectedIds, id];
      setSelectedIds(next);
      if (onSaveConvocation) onSaveConvocation(next);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    if (onSaveConvocation) onSaveConvocation([]);
  };

  const selectedPlayersList = useMemo(() => {
    return players.filter(p => selectedIds.includes(p.id || p.uid || p.docId));
  }, [players, selectedIds]);

  const handleGenerate = async () => {
    if (selectedCount === 0) {
      showToast(t('convocation.noPlayersSelected', lang));
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateConvocationPNG({
        teamData,
        matchData,
        selectedPlayers: selectedPlayersList,
        coachName,
        lang,
        orientation: 'vertical'
      });
      setGeneratedPNG(result);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('[ConvocationSelector] Error generating PNG:', err);
      showToast(err.message || 'Error al generar PNG');
    } finally {
      setIsGenerating(false);
    }
  };

  const opponentName = matchData?.rival || matchData?.opponent || 'Rival';
  const matchDate = matchData?.date || matchData?.fecha || 'Por definir';
  const matchTime = matchData?.time || matchData?.hora || '12:00';
  const callTime = calculateConvocationTime(matchTime);
  const matchLocation = matchData?.location || matchData?.lugar || 'Campo Municipal';

  const categoryConfigs = [
    { key: 'GK', es: t('convocation.positions.gk', lang), en: t('convocation.positionsEn.gk', lang), list: groupedPlayers.GK, isGk: true },
    { key: 'DEF', es: t('convocation.positions.def', lang), en: t('convocation.positionsEn.def', lang), list: groupedPlayers.DEF, isGk: false },
    { key: 'MID', es: t('convocation.positions.mid', lang), en: t('convocation.positionsEn.mid', lang), list: groupedPlayers.MID, isGk: false },
    { key: 'FWD', es: t('convocation.positions.fwd', lang), en: t('convocation.positionsEn.fwd', lang), list: groupedPlayers.FWD, isGk: false }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Toast flotante */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#1B3A2D',
            color: '#FFFFFF',
            border: '1.5px solid #D4A843',
            borderRadius: '10px',
            padding: '12px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '700'
          }}
        >
          <AlertCircle size={18} color="#D4A843" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tarjeta de Resumen del Partido */}
      <div
        style={{
          backgroundColor: '#1B3A2D',
          borderRadius: '12px',
          padding: '18px 22px',
          border: '1px solid rgba(76, 175, 125, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          color: '#FFFFFF'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#D4A843', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t('convocation.tab', lang)} · VS {opponentName.toUpperCase()}
          </span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800' }}>
            {teamData?.name || 'Mi Equipo'} vs {opponentName}
          </h3>
        </div>

        {/* Chips de datos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#E2E8F0' }}>
            <Calendar size={15} color="#4CAF7D" />
            <span>{matchDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#E2E8F0' }}>
            <Clock size={15} color="#D4A843" />
            <span>{matchTime} (Conv: <strong>{callTime}</strong>)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#E2E8F0' }}>
            <MapPin size={15} color="#4CAF7D" />
            <span>{matchLocation}</span>
          </div>
        </div>
      </div>

      {/* Barra de Control de Convocatoria */}
      <div
        style={{
          backgroundColor: '#132B21',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid rgba(212, 168, 67, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}
      >
        {/* Contador en vivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: isAtLimit ? 'rgba(212, 168, 67, 0.2)' : 'rgba(76, 175, 125, 0.2)',
              border: `1.5px solid ${isAtLimit ? '#D4A843' : '#4CAF7D'}`,
              color: isAtLimit ? '#F0C764' : '#68C494',
              fontWeight: '900',
              fontSize: '15px'
            }}
          >
            {t('convocation.counter', lang, { count: selectedCount })}
          </div>
          {selectedCount < MAX_CONVOCATION && selectedCount > 0 && (
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              {t('convocation.missingPlayersWarning', lang)}
            </span>
          )}
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                backgroundColor: 'transparent',
                color: '#FCA5A5',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '48px'
              }}
            >
              <Trash2 size={15} />
              <span>{t('convocation.cleanSelection', lang)}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={selectedCount === 0 || isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '8px',
              border: '1.5px solid #D4A843',
              backgroundColor: '#D4A843',
              color: '#0D2118',
              fontWeight: '900',
              fontSize: '14px',
              cursor: selectedCount === 0 || isGenerating ? 'not-allowed' : 'pointer',
              opacity: selectedCount === 0 || isGenerating ? 0.6 : 1,
              minHeight: '48px',
              minWidth: '48px',
              boxShadow: '0 4px 14px rgba(212, 168, 67, 0.3)'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>{t('convocation.generating', lang)}</span>
              </>
            ) : (
              <>
                <Sparkles size={17} />
                <span>{t('convocation.generate', lang)}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de Jugadores Agrupada por Posición */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {categoryConfigs.map((cat) => (
          <div
            key={cat.key}
            style={{
              backgroundColor: '#1B3A2D',
              borderRadius: '12px',
              border: '1px solid rgba(76, 175, 125, 0.2)',
              overflow: 'hidden'
            }}
          >
            {/* Header de Categoría en Oro */}
            <div
              style={{
                backgroundColor: '#132B21',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(212, 168, 67, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#D4A843', fontWeight: '800', fontSize: '15px' }}>
                  {cat.es}
                </span>
                <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>
                  / {cat.en}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#68C494', fontWeight: '700' }}>
                {cat.list.filter(p => selectedIds.includes(p.id || p.uid || p.docId)).length} / {cat.list.length}
              </span>
            </div>

            {/* Grid de Jugadores */}
            <div
              style={{
                padding: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '10px'
              }}
            >
              {cat.list.length === 0 ? (
                <div style={{ padding: '12px', color: '#94A3B8', fontSize: '13px', fontStyle: 'italic' }}>
                  Sin jugadores registrados en esta posición.
                </div>
              ) : (
                cat.list.map((player) => {
                  const pid = player.id || player.uid || player.docId;
                  const isChecked = selectedIds.includes(pid);

                  return (
                    <div
                      key={pid}
                      onClick={() => togglePlayer(player)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: isChecked ? 'rgba(76, 175, 125, 0.16)' : '#132B21',
                        border: `1.5px solid ${isChecked ? '#4CAF7D' : 'rgba(255, 255, 255, 0.08)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        minHeight: '48px',
                        userSelect: 'none'
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: `1.5px solid ${isChecked ? '#4CAF7D' : '#64748B'}`,
                          backgroundColor: isChecked ? '#4CAF7D' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isChecked && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                      </div>

                      {/* Avatar */}
                      <PlayerAvatar player={player} size={36} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: '900',
                              color: cat.isGk ? '#D4A843' : '#68C494'
                            }}
                          >
                            {player.number !== undefined && player.number !== null ? `#${player.number}` : '-'}
                          </span>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#FFFFFF',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {player.name || player.nombre}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          {cat.isGk && <Shield size={12} color="#D4A843" />}
                          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>
                            {player.position || player.posicion || cat.key}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Previsualización y Descarga */}
      <ConvocationPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pngUrl={generatedPNG?.url}
        pngBlob={generatedPNG?.blob}
        filename={generatedPNG?.filename}
        teamId={teamId}
        teamPath={teamPath}
        matchData={matchData}
        selectedPlayers={selectedPlayersList}
        lang={lang}
        currentUserId={currentUserId}
        onRegenerate={handleGenerate}
      />
    </div>
  );
};

export default ConvocationSelector;
