import React from 'react';
import {
  Radar, RadarChart as RechartsRadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const RadarChart = ({ data, color = '#1B3A2D', height = 300 }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height, background: '#F5F0E8', padding: '16px', borderRadius: '12px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#E0DACA" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#2D2D2D', fontSize: 11, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
          <Radar name="Evaluación" dataKey="value" stroke={color} fill={color} fillOpacity={0.6} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1B3A2D', color: '#FFF', borderRadius: '8px', border: 'none' }}
            itemStyle={{ color: '#FFF' }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
