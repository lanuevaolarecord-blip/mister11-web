import React from 'react';
import {
  Radar, RadarChart as RechartsRadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(18, 24, 38, 0.95)',
        border: '1px solid rgba(123, 97, 255, 0.5)',
        boxShadow: '0 0 15px rgba(0, 245, 168, 0.3)',
        borderRadius: '8px',
        padding: '10px 15px',
        color: '#FFF',
        fontFamily: 'Orbitron, sans-serif'
      }}>
        <p style={{ margin: 0, color: '#00F5A8', fontWeight: 'bold' }}>{payload[0].payload.subject}</p>
        <p style={{ margin: 0, fontSize: '1.2rem' }}>
          <span style={{ color: '#7B61FF' }}>⚡</span> {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const RadarChart = ({ data, color = '#00F5A8', secondaryColor = '#7B61FF', height = 300 }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ 
      width: '100%', 
      height, 
      background: 'radial-gradient(circle at center, rgba(18,24,38,1) 0%, rgba(10,14,23,1) 100%)', 
      padding: '16px', 
      borderRadius: '16px',
      border: '1px solid rgba(123, 97, 255, 0.2)',
      boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)'
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <defs>
            <linearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.8}/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <PolarGrid stroke="rgba(160, 174, 192, 0.2)" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#A0AEC0', fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
          
          <Radar 
            name="Evaluación" 
            dataKey="value" 
            stroke="url(#neonGradient)" 
            strokeWidth={3}
            fill="url(#neonGradient)" 
            fillOpacity={0.2} 
            activeDot={{ r: 6, fill: '#FFD700', filter: 'url(#glow)', stroke: '#FFF', strokeWidth: 2 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
