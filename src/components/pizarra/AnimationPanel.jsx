import React from 'react';
import {
  SkipBack,
  ChevronLeft,
  Square,
  Play,
  ChevronRight,
  SkipForward,
  Plus,
  Trash2,
  Film
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const AnimationPanel = ({
  frames = [],
  frameIdx = 0,
  isPlaying = false,
  loadFrame,
  stopAnimation,
  playAnimation,
  addFrame,
  deleteFrame,
  onOpenExportModal
}) => {
  const { t, isEn } = useTranslation();

  return (
    <div className="pizarra-timeline">
      <div className="timeline-scroll-wrapper">
        <button
          type="button"
          className="timeline-btn-nav"
          onClick={() => loadFrame(0)}
          disabled={isPlaying || frameIdx === 0}
          aria-label={t('board.timeline.firstFrame')}
          title={t('board.timeline.firstFrame')}
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          className="timeline-btn-nav"
          onClick={() => loadFrame(Math.max(0, frameIdx - 1))}
          disabled={isPlaying || frameIdx === 0}
          aria-label={t('board.timeline.prevFrame')}
          title={t('board.timeline.prevFrame')}
        >
          <ChevronLeft size={16} />
        </button>

        {isPlaying ? (
          <button
            type="button"
            className="timeline-btn-nav play"
            onClick={stopAnimation}
            aria-label={t('board.timeline.stopAria')}
            title={t('board.timeline.stop')}
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="timeline-btn-nav play"
            onClick={playAnimation}
            disabled={frames.length < 2}
            aria-label={t('board.timeline.playAria')}
            title={t('board.timeline.play')}
          >
            <Play size={16} />
          </button>
        )}

        <button
          type="button"
          className="timeline-btn-nav"
          onClick={() => loadFrame(Math.min(frames.length - 1, frameIdx + 1))}
          disabled={isPlaying || frameIdx === frames.length - 1}
          aria-label={t('board.timeline.nextFrame')}
          title={t('board.timeline.nextFrame')}
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          className="timeline-btn-nav"
          onClick={() => loadFrame(frames.length - 1)}
          disabled={isPlaying || frameIdx === frames.length - 1}
          aria-label={t('board.timeline.lastFrame')}
          title={t('board.timeline.lastFrame')}
        >
          <SkipForward size={16} />
        </button>

        <span className="frame-counter">
          {frames.length > 0 ? frameIdx + 1 : 0}/{frames.length}
        </span>

        <div className="timeline-chips">
          {frames.map((f, i) => {
            const isActive = i === frameIdx;
            let positions = Array.isArray(f?.positions) ? f.positions : [];
            if (positions.length === 0 && f?.state) {
              try {
                const s = typeof f.state === 'string' ? JSON.parse(f.state) : f.state;
                positions = Array.isArray(s?.positions) ? s.positions : (Array.isArray(s?.objects) ? s.objects : []);
              } catch (_) {}
            }
            const pieceCount = positions.length;
            const tooltip = `Frame ${i + 1} (${pieceCount} ${isEn ? 'pieces' : 'piezas'})`;

            return (
              <div
                key={f.id || i}
                className={`frame-chip ${isActive ? 'active' : ''}`}
                onClick={() => !isPlaying && loadFrame(i)}
                title={tooltip}
                aria-label={tooltip}
                role="button"
                tabIndex={0}
                style={{
                  minWidth: '56px',
                  height: '48px',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? '#1B3A2D' : '#142820',
                  border: isActive ? '2px solid #4CAF7D' : '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '6px',
                  cursor: isPlaying ? 'not-allowed' : 'pointer'
                }}
              >
                {f?.thumbnail ? (
                  <img
                    src={f.thumbnail}
                    alt={`Frame ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <svg
                    viewBox="0 0 100 65"
                    style={{ width: '100%', height: '100%', display: 'block', opacity: 0.95 }}
                  >
                    {/* Césped canónico Tierra y Campo */}
                    <rect x="0" y="0" width="100" height="65" fill="#1B3A2D" />
                    {/* Líneas tácticas */}
                    <rect x="4" y="4" width="92" height="57" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
                    <line x1="50" y1="4" x2="50" y2="61" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
                    <circle cx="50" cy="32.5" r="9" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
                    {/* Puntos de piezas tácticas */}
                    {positions.map((pos, pIdx) => {
                      const px = Math.max(5, Math.min(95, (pos.x !== undefined ? pos.x : (pos.xRel !== undefined ? pos.xRel : 0.5)) * 100));
                      const py = Math.max(5, Math.min(60, (pos.y !== undefined ? pos.y : (pos.yRel !== undefined ? pos.yRel : 0.5)) * 65));
                      const isBall = pos.isBall || pos.category === 'ball' || pos.data?.type === 'ball';
                      const isEquipA = pos.team === 'A' || pos.data?.team === 'A' || (!pos.team && pos.category === 'player');
                      const fill = isBall ? '#F5F0E8' : (isEquipA ? '#D4A843' : '#4CAF7D');
                      return (
                        <circle
                          key={pIdx}
                          cx={px}
                          cy={py}
                          r={isBall ? 2 : 2.8}
                          fill={fill}
                          stroke="#142820"
                          strokeWidth="0.5"
                        />
                      );
                    })}
                  </svg>
                )}
                {/* Badge número de frame */}
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: '3px',
                    background: isActive ? '#4CAF7D' : 'rgba(0,0,0,0.7)',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    lineHeight: '12px',
                    padding: '0 4px',
                    borderRadius: '3px',
                    pointerEvents: 'none'
                  }}
                >
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="btn-add-frame"
          onClick={addFrame}
          disabled={isPlaying}
          aria-label={t('board.timeline.addFrame')}
          title={t('board.timeline.addFrame')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} />
          <span>{t('board.timeline.frameLabel')}</span>
        </button>
        <button
          type="button"
          className="btn-trash-frame"
          onClick={deleteFrame}
          disabled={isPlaying || frames.length <= 1}
          aria-label={t('board.timeline.deleteFrame')}
          title={t('board.timeline.deleteFrame')}
        >
          <Trash2 size={16} />
        </button>

        {typeof onOpenExportModal === 'function' && (
          <button
            type="button"
            className="btn-export-timeline"
            onClick={onOpenExportModal}
            disabled={isPlaying || frames.length < 2}
            style={{
              minHeight: '48px',
              padding: '0 14px',
              backgroundColor: '#1B3A2D',
              border: '1.5px solid #4CAF7D',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: isPlaying || frames.length < 2 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '8px',
              opacity: isPlaying || frames.length < 2 ? 0.6 : 1
            }}
            title={t('board.timeline.exportAnimation')}
          >
            <Film size={15} />
            <span>{t('board.timeline.export')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AnimationPanel;
