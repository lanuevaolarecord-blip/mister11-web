import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── FIELD VIEW PER SPACE ────────────────────────────────────────────────────
const FIELD_CONFIGS = {
  'Área penal':       { view: 'penalty', color: '#1a6632' },
  'Medio campo':      { view: 'half',    color: '#1a6632' },
  '3/4 campo':        { view: '3q',      color: '#1a6632' },
  'Campo completo':   { view: 'full',    color: '#1a6632' },
  'Espacio reducido': { view: 'small',   color: '#2a4a2a' },
  'Sala / Gimnasio':  { view: 'small',   color: '#2a2a4a' },
};

// ─── PLAYER LAYOUT ───────────────────────────────────────────────────────────
const getPositions = (numPlayers, withGoalkeeper) => {
  const total = Math.max(4, Math.min(22, numPlayers));
  const attackerCount = Math.floor(total / 2);
  const defenderCount = total - attackerCount;
  const attackers = [];
  const defenders = [];

  const spread = (count, ryBase, ryStep) =>
    Array.from({ length: count }, (_, i) => {
      const cols = Math.max(1, Math.ceil(count / 2));
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        rx: 0.2 + (cols === 1 ? 0.3 : (col / (cols - 1)) * 0.6),
        ry: ryBase + row * ryStep,
      };
    });

  attackers.push(...spread(attackerCount, 0.12, 0.14));
  defenders.push(...spread(defenderCount, 0.52, 0.12));

  const goalkeeper = withGoalkeeper ? { rx: 0.5, ry: 0.88 } : null;
  return { attackers, defenders, goalkeeper };
};

// ─── CANVAS DRAW ─────────────────────────────────────────────────────────────
const drawField = (ctx, W, H, view, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.5;
  const p = 16;

  const rect = (x, y, w, h) => ctx.strokeRect(x, y, w, h);
  const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const arc = (cx, cy, r, s = 0, e = Math.PI * 2) => { ctx.beginPath(); ctx.arc(cx, cy, r, s, e); ctx.stroke(); };
  const dot = (cx, cy, r = 3) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fill(); };

  if (view === 'full') {
    rect(p, p, W - p * 2, H - p * 2);
    line(p, H / 2, W - p, H / 2);
    arc(W / 2, H / 2, H * 0.08);
    const paW = (W - p * 2) * 0.5, paH = H * 0.15;
    rect(p + (W - p * 2 - paW) / 2, p, paW, paH);
    rect(p + (W - p * 2 - paW) / 2, H - p - paH, paW, paH);
    const gW = (W - p * 2) * 0.2, gH = H * 0.04;
    rect(W / 2 - gW / 2, p - gH, gW, gH);
    rect(W / 2 - gW / 2, H - p, gW, gH);
  } else if (view === 'half') {
    rect(p, p, W - p * 2, H - p * 2);
    const paW = (W - p * 2) * 0.55, paH = H * 0.28;
    rect(p + (W - p * 2 - paW) / 2, p, paW, paH);
    const gW = (W - p * 2) * 0.22, gH = H * 0.07;
    rect(W / 2 - gW / 2, p - gH, gW, gH);
  } else if (view === '3q') {
    rect(p, p, W - p * 2, H - p * 2);
    const paW = (W - p * 2) * 0.55, paH = H * 0.2;
    rect(p + (W - p * 2 - paW) / 2, p, paW, paH);
    const gW = (W - p * 2) * 0.22, gH = H * 0.05;
    rect(W / 2 - gW / 2, p - gH, gW, gH);
    ctx.setLineDash([5, 5]);
    line(p, H * 0.72, W - p, H * 0.72);
    ctx.setLineDash([]);
  } else if (view === 'penalty') {
    rect(p, p, W - p * 2, H - p * 2);
    dot(W / 2, H * 0.35);
    arc(W / 2, H * 0.35, H * 0.14, Math.PI * 1.15, Math.PI * 1.85);
    const gW = (W - p * 2) * 0.28, gH = H * 0.09;
    rect(W / 2 - gW / 2, p - gH, gW, gH);
  } else {
    // small
    rect(p, p, W - p * 2, H - p * 2);
    line(p, H / 2, W - p, H / 2);
    arc(W / 2, H / 2, H * 0.09);
  }
};

const drawPlayer = (ctx, x, y, label, color, r = 13) => {
  // Shadow
  ctx.beginPath(); ctx.arc(x + 1.5, y + 1.5, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  // Fill
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.stroke();
  // Text
  ctx.fillStyle = '#fff';
  ctx.font = `bold 9px 'Inter', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
};

const drawArrow = (ctx, x1, y1, x2, y2) => {
  if (Math.hypot(x2 - x1, y2 - y1) < 25) return;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([6, 3]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - 0.45), y2 - 10 * Math.sin(angle - 0.45));
  ctx.lineTo(x2 - 10 * Math.cos(angle + 0.45), y2 - 10 * Math.sin(angle + 0.45));
  ctx.closePath(); ctx.fill();
  ctx.restore();
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const ExerciseDiagram = ({ espacio, jugadores, resultText }) => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const config = FIELD_CONFIGS[espacio] || FIELD_CONFIGS['Campo completo'];
  const text = (resultText || '').toLowerCase();
  const withGoalkeeper = config.view !== 'small' && (
    text.includes('portero') || text.includes('portería') || text.includes('porteria')
  );

  const { attackers, defenders, goalkeeper } = getPositions(jugadores, withGoalkeeper);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth || 600;
    const H = 300;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    drawField(ctx, W, H, config.view, config.color);

    attackers.forEach((p, i) =>
      drawPlayer(ctx, p.rx * W, p.ry * H, `A${i + 1}`, '#4CAF7D')
    );
    defenders.forEach((p, i) =>
      drawPlayer(ctx, p.rx * W, p.ry * H, `D${i + 1}`, '#EF4444')
    );
    if (goalkeeper) {
      drawPlayer(ctx, goalkeeper.rx * W, goalkeeper.ry * H, 'P', '#D4A843');
    }

    // Auto movement arrows
    if (attackers.length >= 2) {
      const a0 = attackers[0], a1 = attackers[1];
      drawArrow(ctx, a0.rx * W, a0.ry * H, a1.rx * W + W * 0.08, a1.ry * H + H * 0.1);
    }
    if (attackers.length >= 1 && defenders.length >= 1) {
      const a = attackers[Math.floor(attackers.length / 2)];
      const d = defenders[0];
      drawArrow(ctx, a.rx * W, a.ry * H + 18, d.rx * W, d.ry * H - 18);
    }
    if (defenders.length >= 2) {
      const d0 = defenders[0], d1 = defenders[defenders.length - 1];
      drawArrow(ctx, d0.rx * W, d0.ry * H, (d0.rx + d1.rx) / 2 * W, (d0.ry + d1.ry) / 2 * H);
    }
  }, [espacio, jugadores, config, attackers, defenders, goalkeeper]);

  return (
    <div className="exercise-diagram">
      <div className="diagram-header">
        <div>
          <span className="diagram-title">📐 Diagrama del Ejercicio</span>
          <span className="diagram-sub">{espacio} · {jugadores} jugadores</span>
        </div>
      </div>

      <div className="diagram-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#4CAF7D' }} />A = Atacante</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#EF4444' }} />D = Defensor</span>
        {withGoalkeeper && (
          <span className="legend-item"><span className="legend-dot" style={{ background: '#D4A843' }} />P = Portero</span>
        )}
        <span className="legend-item">
          <span className="legend-arrow-icon">⇢</span> Movimiento
        </span>
      </div>

      <canvas ref={canvasRef} className="diagram-canvas" />

      <div className="diagram-actions">
        <button className="btn-outline" onClick={() => navigate('/pizarra')}>
          ✏️ Editar en Pizarra
        </button>
      </div>
    </div>
  );
};

export default ExerciseDiagram;
