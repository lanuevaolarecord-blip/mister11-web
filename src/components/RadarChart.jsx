import React from 'react';
import {
  Radar, RadarChart as RechartsRadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1B3A2D',
        border: '1px solid #D4A843',
        borderRadius: '8px',
        padding: '10px 15px',
        color: '#FFF',
        fontFamily: 'var(--font-body)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, color: '#D4A843', fontWeight: 'bold', fontSize: '13px' }}>{payload[0].payload.subject}</p>
        <p style={{ margin: 0, fontSize: '1.4rem', color: '#FFF', fontWeight: '800' }}>
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const RadarChart = ({ data, height = 300 }) => {
  const { darkMode } = useTheme();
  const tickColor = darkMode ? '#F5F0E8' : '#1B3A2D';

  if (!data || data.length === 0) return null;
  // Filter out zero-value subjects for cleaner radar display, but keep at least one
  const hasAnyValue = data.some(d => d.value > 0);

  return (
    <div style={{ 
      width: '100%', 
      height: `${height}px`,
      background: 'transparent',
      padding: '10px',
    }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(27, 58, 45, 0.25)" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: tickColor, fontSize: 12, fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          
          <Radar 
            name="Evaluación" 
            dataKey="value" 
            stroke="#D4A843" 
            strokeWidth={3}
            fill="#1B3A2D"
            fillOpacity={hasAnyValue ? 0.4 : 0}
            dot={{ r: 4, fill: '#D4A843', strokeWidth: 2, stroke: '#FFF' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;

