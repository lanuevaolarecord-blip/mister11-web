import React, { useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import html2canvas from 'html2canvas';

// ── Colores institucionales ──────────────────────────────────────────────────
const C_DARK    = '#1B3A2D';
const C_GOLD    = '#D4A843';
const C_BEIGE   = '#F5F0E8';
const C_GREEN   = '#4CAF7D';
const C_TEXT    = '#2D2D2D';
const C_BORDER  = '#E0DACA';

// ── SVG Radar Chart (sin ResponsiveContainer, siempre visible) ──────────────
const SvgRadar = ({ data, size = 320 }) => {
  if (!data || data.length === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.38;
  const n  = data.length;
  const hasData = data.some(d => d.value > 0);

  const angleOf = i => (2 * Math.PI * i) / n - Math.PI / 2;

  // Grid rings
  const rings = [20, 40, 60, 80, 100].map(pct => (
    <polygon
      key={pct}
      points={Array.from({ length: n }, (_, i) => {
        const a = angleOf(i);
        const rr = r * (pct / 100);
        return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
      }).join(' ')}
      fill="none"
      stroke={C_BORDER}
      strokeWidth={pct === 100 ? 1.5 : 0.8}
      strokeDasharray={pct === 100 ? 'none' : '3,3'}
    />
  ));

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const a = angleOf(i);
    return (
      <line
        key={i}
        x1={cx} y1={cy}
        x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
        stroke={C_BORDER} strokeWidth={1}
      />
    );
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const a  = angleOf(i);
    const rr = r * Math.min(1, (d.value || 0) / 100);
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) };
  });
  const polyStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Labels
  const labels = data.map((d, i) => {
    const a  = angleOf(i);
    const labelR = r + 28;
    const x = cx + labelR * Math.cos(a);
    const y = cy + labelR * Math.sin(a);
    return (
      <g key={i}>
        <text
          x={x} y={y - 6}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={12} fontWeight="bold" fill={C_DARK}
        >
          {d.subject}
        </text>
        <text
          x={x} y={y + 9}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={11} fill={C_GOLD} fontWeight="700"
        >
          {d.value || 0}
        </text>
      </g>
    );
  });

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {rings}
      {axes}
      {hasData && (
        <>
          <polygon
            points={polyStr}
            fill={C_DARK}
            fillOpacity={0.35}
            stroke={C_GOLD}
            strokeWidth={2.5}
          />
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={5}
              fill={C_GOLD} stroke="white" strokeWidth={2} />
          ))}
        </>
      )}
      {labels}
    </svg>
  );
};

// ── Gráfica de evolución (línea) ──────────────────────────────────────────────
const MiniLineChart = ({ data, isTime }) => {
  if (!data || data.length === 0) return null;

  if (data.length === 1) {
    const e = data[0];
    const date = (e.date || '').split('-').reverse().slice(0, 2).join('/');
    return (
      <div style={{
        height: 160, background: C_BEIGE, borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6
      }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: C_DARK }}>{e.val}</span>
        <span style={{ fontSize: 12, color: '#7A7065' }}>Primera evaluación · {date}</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 160, background: C_BEIGE, borderRadius: 10, padding: '8px 4px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 10, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C_BORDER} />
          <XAxis dataKey="date" fontSize={10} stroke={C_TEXT}
            tickFormatter={t => t.split('-').reverse().slice(0, 2).join('/')} />
          <YAxis fontSize={10} stroke={C_TEXT}
            domain={['dataMin - 1', 'dataMax + 1']} reversed={isTime} />
          <Tooltip
            contentStyle={{ background: C_DARK, color: '#FFF', borderRadius: 8, border: 'none', fontSize: 12 }}
            itemStyle={{ color: C_GOLD }}
          />
          <Line type="monotone" dataKey="val" stroke={C_GREEN} strokeWidth={2.5}
            dot={{ r: 4, fill: C_DARK, stroke: C_GOLD, strokeWidth: 2 }}
            activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Modal principal ──────────────────────────────────────────────────────────
const PlayerAnalyticsModal = ({ player, tests, historyData, onClose, onExportPDF }) => {
  const contentRef = useRef(null);

  if (!player) return null;

  // Calcular stats para el radar
  let fis = 0, tec = 0, psi = 0, soc = 0, countFis = 0, countTec = 0, countPsi = 0, countSoc = 0;
  let totalTests = 0;

  tests.forEach(t => {
    const h = historyData[player.id]?.[t.id] || [];
    if (h.length === 0) return;
    totalTests++;
    const val = h[h.length - 1].val || 0;
    let norm = 0;
    if (t.unit === 'seg')   norm = Math.max(0, 100 - val * 8);
    else if (t.unit === 'cm')    norm = Math.min(100, val * 2.5);
    else if (t.unit === 'nivel') norm = Math.min(100, val * 10);
    else if (t.unit === 'm')     norm = Math.min(100, val / 28);
    else                         norm = Math.min(100, val * 4);

    if (t.type === 'fisico' && t.category !== 'Técnica') { fis += norm; countFis++; }
    if (t.type === 'fisico' && t.category === 'Técnica') { tec += norm; countTec++; }
    if (t.type === 'psicosocial' || t.type === 'psicodeportivo') { psi += norm; countPsi++; }
    if (t.type === 'socioemocional' || t.type === 'sociodeportivo') { soc += norm; countSoc++; }
  });

  fis = countFis > 0 ? Math.round(fis / countFis) : 0;
  tec = countTec > 0 ? Math.round(tec / countTec) : 0;
  psi = countPsi > 0 ? Math.round(psi / countPsi) : 0;
  soc = countSoc > 0 ? Math.round(soc / countSoc) : 0;
  const overall = totalTests > 0 ? Math.round((fis + tec + psi + soc) / 4) : 0;

  const radarData = [
    { subject: 'FÍS', value: fis },
    { subject: 'TÉC', value: tec },
    { subject: 'PSI', value: psi },
    { subject: 'SOC', value: soc },
  ];

  const initials = (player.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Tests con historial del jugador
  const testsWithData = tests.filter(t => (historyData[player.id]?.[t.id] || []).length > 0);

  const handleExport = async () => {
    if (onExportPDF) {
      onExportPDF(player);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(27, 58, 45, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div
        ref={contentRef}
        style={{
          background: '#FAFAF7',
          borderRadius: 20,
          width: '100%',
          maxWidth: 1000,
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: C_DARK, color: '#FFF',
          padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: C_GOLD, color: C_DARK,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800
            }}>
              {initials}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#FFF' }}>{player.name}</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                #{player.number} · {player.position} · {totalTests} evaluaciones registradas
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleExport}
              style={{
                background: C_GOLD, color: C_DARK, border: 'none',
                borderRadius: 8, padding: '10px 18px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer'
              }}
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)', color: '#FFF', border: 'none',
                borderRadius: 8, padding: '10px 16px',
                fontWeight: 700, fontSize: 16, cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px' }}>

          {/* Top section: Radar + Stats */}
          <div style={{
            display: 'flex', gap: 28, marginBottom: 32,
            flexWrap: 'wrap'
          }}>
            {/* Radar */}
            <div style={{
              background: C_BEIGE, borderRadius: 16,
              padding: '20px 24px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12,
              flexShrink: 0
            }}>
              <h3 style={{ margin: 0, color: C_DARK, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
                PERFIL DE RENDIMIENTO
              </h3>
              <SvgRadar data={radarData} size={300} />
            </div>

            {/* Stats panel */}
            <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Overall */}
              <div style={{
                background: C_DARK, borderRadius: 16, padding: '20px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 2 }}>ÍNDICE GLOBAL</span>
                <span style={{ fontSize: 56, fontWeight: 900, color: C_GOLD, lineHeight: 1 }}>{overall || '--'}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>sobre 100</span>
              </div>
              {/* Attribute badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'FÍSICO', value: fis, color: '#4CAF7D' },
                  { label: 'TÉCNICO', value: tec, color: '#2196F3' },
                  { label: 'PSICO', value: psi, color: C_GOLD },
                  { label: 'SOCIAL', value: soc, color: '#9C27B0' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: '#FFF', borderRadius: 12, padding: '14px 16px',
                    border: `2px solid ${C_BORDER}`, textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 11, color: '#7A7065', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color }}>{value || '--'}</div>
                    {/* Progress bar */}
                    <div style={{ height: 4, background: C_BORDER, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${value}%`,
                        background: color, borderRadius: 2,
                        transition: 'width 1s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evolution charts */}
          {testsWithData.length === 0 ? (
            <div style={{
              background: C_BEIGE, borderRadius: 16, padding: 40,
              textAlign: 'center', color: '#7A7065'
            }}>
              <p style={{ fontSize: 18 }}>📊 Sin evaluaciones aún. Usa el botón <strong>"🎯 Datos Demo"</strong> para ver las gráficas.</p>
            </div>
          ) : (
            <>
              <h3 style={{ color: C_DARK, fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>
                EVOLUCIÓN POR PRUEBA
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20
              }}>
                {testsWithData.map(t => {
                  const history = (historyData[player.id]?.[t.id] || []).map(h => ({
                    ...h,
                    val: parseFloat(String(h.val).replace(',', '.')) || 0
                  }));
                  const vals = history.map(h => h.val);
                  const first = vals[0];
                  const last = vals[vals.length - 1];
                  const isTime = t.unit === 'seg';
                  const diff = last - first;
                  const improved = vals.length > 1 && (isTime ? diff < 0 : diff > 0);
                  const noChange = vals.length < 2 || diff === 0;

                  return (
                    <div key={t.id} style={{
                      background: '#FFF', borderRadius: 14, padding: '16px',
                      border: `1px solid ${C_BORDER}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#7A7065', marginBottom: 2 }}>{t.category}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C_DARK }}>{t.name}</div>
                        </div>
                        {noChange ? (
                          <span style={{
                            fontSize: 11, background: C_BEIGE, color: '#7A7065',
                            borderRadius: 20, padding: '3px 10px', alignSelf: 'flex-start', fontWeight: 600
                          }}>
                            {last} {t.unit}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 11,
                            background: improved ? '#E8F5E9' : '#FFEBEE',
                            color: improved ? '#2E7D32' : '#C62828',
                            borderRadius: 20, padding: '3px 10px', alignSelf: 'flex-start', fontWeight: 700
                          }}>
                            {improved ? '▲' : '▼'} {Math.abs((diff / first) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <MiniLineChart data={history} isTime={isTime} />
                      {/* Progress bar */}
                      <div style={{ marginTop: 10 }}>
                        <div style={{ height: 6, background: C_BEIGE, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, Math.abs(last))}%`,
                            background: C_GOLD, borderRadius: 3
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerAnalyticsModal;
