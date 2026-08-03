import React from 'react';

const AnimationPanel = ({
  frames,
  frameIdx,
  isPlaying,
  loadFrame,
  stopAnimation,
  playAnimation,
  addFrame,
  deleteFrame,
}) => {
  return (
    <div className="pizarra-timeline">
      <div className="timeline-scroll-wrapper">
        <button className="timeline-btn-nav" onClick={() => loadFrame(0)}
          disabled={isPlaying || frameIdx === 0}>⏮</button>
        <button className="timeline-btn-nav"
          onClick={() => loadFrame(Math.max(0, frameIdx - 1))}
          disabled={isPlaying || frameIdx === 0}>◀</button>

        {isPlaying
          ? <button className="timeline-btn-nav play" onClick={stopAnimation}>⏹</button>
          : <button className="timeline-btn-nav play" onClick={playAnimation}
              disabled={frames.length < 2}>▶</button>
        }

        <button className="timeline-btn-nav"
          onClick={() => loadFrame(Math.min(frames.length - 1, frameIdx + 1))}
          disabled={isPlaying || frameIdx === frames.length - 1}>▶</button>
        <button className="timeline-btn-nav"
          onClick={() => loadFrame(frames.length - 1)}
          disabled={isPlaying || frameIdx === frames.length - 1}>⏭</button>

        <span className="frame-counter">
          {frames.length > 0 ? frameIdx + 1 : 0}/{frames.length}
        </span>

        <div className="timeline-chips">
          {frames.map((f, i) => (
            <div key={f.id}
              className={`frame-chip ${i === frameIdx ? 'active' : ''}`}
              onClick={() => !isPlaying && loadFrame(i)}>
              {i + 1}
            </div>
          ))}
        </div>

        <button className="btn-add-frame" onClick={addFrame} disabled={isPlaying}>+ Frame</button>
        <button className="btn-trash-frame" onClick={deleteFrame}
          disabled={isPlaying || frames.length <= 1}>🗑</button>
      </div>
    </div>
  );
};

export default AnimationPanel;
