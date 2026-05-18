import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Colores institucionales
const COLOR_PRIMARY = '#1B3A2D';
const COLOR_ACCENT = '#D4A843';
const COLOR_GREEN = '#4CAF7D';
const COLOR_TEXT = '#2D2D2D';

export const GraficaEvolucion = ({ data, isTime }) => {
  if (!data || data.length === 0) return null;

  // Single data point: Recharts can't draw a visible line — show a stat card
  if (data.length === 1) {
    const entry = data[0];
    const displayDate = (entry.date || '').split('-').reverse().slice(0, 2).join('/');
    return (
      <div style={{
        width: '100%', height: 220, background: '#F5F0E8', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px'
      }}>
        <div style={{ fontSize: '42px', fontWeight: '800', color: COLOR_PRIMARY, lineHeight: 1 }}>
          {entry.val}
        </div>
        <div style={{ fontSize: '13px', color: '#7A7065' }}>Primera evaluación · {displayDate}</div>
        <div style={{
          marginTop: '8px', padding: '4px 12px', borderRadius: '20px',
          background: COLOR_ACCENT, color: '#FFF', fontSize: '11px', fontWeight: '600'
        }}>
          Registra más resultados para ver la evolución
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 220, background: '#F5F0E8', padding: '16px', borderRadius: '12px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0DACA" />
          <XAxis dataKey="date" stroke={COLOR_TEXT} fontSize={12} tickFormatter={(tick) => tick.split('-').reverse().slice(0, 2).join('/')} />
          <YAxis stroke={COLOR_TEXT} fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} reversed={isTime} />
          <Tooltip 
            contentStyle={{ backgroundColor: COLOR_PRIMARY, color: '#FFF', borderRadius: '8px', border: 'none' }}
            itemStyle={{ color: COLOR_ACCENT }}
          />
          <Line 
            type="monotone" 
            dataKey="val" 
            stroke={COLOR_GREEN} 
            strokeWidth={3}
            dot={{ r: 5, fill: COLOR_PRIMARY, strokeWidth: 2, stroke: COLOR_ACCENT }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const GraficaResumen = ({ playerStats }) => {
  // playerStats = [{ subject: 'Fuerza', A: 80, fullMark: 100 }, ...]
  if (!playerStats || playerStats.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 250, background: '#F5F0E8', padding: '10px', borderRadius: '12px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={playerStats}>
          <PolarGrid stroke="#E0DACA" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: COLOR_PRIMARY, fontSize: 11, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Jugador" dataKey="A" stroke={COLOR_ACCENT} fill={COLOR_ACCENT} fillOpacity={0.6} />
          <Tooltip 
            contentStyle={{ backgroundColor: COLOR_PRIMARY, color: '#FFF', borderRadius: '8px', border: 'none' }}
            itemStyle={{ color: COLOR_ACCENT }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
