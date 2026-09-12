/**
 * src/components/canonical/PitchFrame.jsx
 * Míster11 — Marco de Terreno de Juego Canónico 105:68 (App + PDF)
 *
 * Especificación Reglamentaria (105m x 68m = 1050 x 680 px):
 * - viewBox: 0 0 1050 680 (proporción exacta 1.544:1)
 * - preserveAspectRatio: "xMidYMid meet"
 * - Franjas de siega profesionales sutiles (alfa 4-6%)
 * - Porterías con postes dorados #D4A843 ubicadas fuera de la línea de gol
 * - Líneas oficiales: rgba(242,237,228,0.55) en dark / rgba(27,58,45,0.45) en light
 */

import React from 'react';
import { PITCH_DIMENSIONS, getPitchFrameSvgMarkup } from './pitchMarkup.js';

export { PITCH_DIMENSIONS, getPitchFrameSvgMarkup };


export const PitchFrame = ({
  isDark = true,
  showTacticalCorridors = false,
  showGoals = true,
  showStripes = true,
  corridorsLabel = false,
  isEn = false,
  children,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`pitch-frame-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1050px',
        aspectRatio: '1050 / 680',
        margin: '0 auto',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        ...style
      }}
    >
      <svg
        viewBox="0 0 1050 680"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          id="pitch-markings"
          dangerouslySetInnerHTML={{
            __html: getPitchFrameSvgMarkup({
              isDark,
              showTacticalCorridors,
              showGoals,
              showStripes,
              corridorsLabel,
              isEn
            })
          }}
        />
        {children}
      </svg>
    </div>
  );
};

export default PitchFrame;
