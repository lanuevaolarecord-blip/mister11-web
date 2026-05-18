import React from 'react';
import {
  Radar, RadarChart as RechartsRadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '10px 15px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>{payload[0].payload.subject}</p>
        <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const RadarChart = ({ data, color = 'var(--primary)', secondaryColor = 'var(--gold)', height = 300 }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minHeight: height,
      background: 'transparent',
      padding: '10px',
      position: 'relative'
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <defs>
            <linearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.8}/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <PolarGrid stroke="rgba(27, 58, 45, 0.2)" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--text-primary)', fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          
          <Radar 
            name="Evaluación" 
            dataKey="value" 
            stroke="url(#neonGradient)" 
            strokeWidth={3}
            fill="url(#neonGradient)" 
            fillOpacity={0.2} 
            activeDot={{ r: 6, fill: 'var(--gold)', filter: 'url(#glow)', stroke: 'var(--white)', strokeWidth: 2 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
