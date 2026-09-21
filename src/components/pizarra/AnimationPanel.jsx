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
  const { t } = useTranslation();

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
          {frames.map((f, i) => (
            <div
              key={f.id || i}
              className={`frame-chip ${i === frameIdx ? 'active' : ''}`}
              onClick={() => !isPlaying && loadFrame(i)}
            >
              {i + 1}
            </div>
          ))}
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
          <span>Frame</span>
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
