import React, { useState } from 'react';

const EscudoEquipo = ({ src, nombreEquipo, size = '60px', borderRadius = '50%' }) => {
  const [cargando, setCargando] = useState(true);
  
  if (!src) {
    return (
      <div 
        style={{
          width: size, 
          height: size, 
          borderRadius: borderRadius, 
          background: 'var(--accent)', 
          color: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: `calc(${size} / 2.5)`
        }}
      >
        {(nombreEquipo || 'E').charAt(0)}
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      {cargando && (
        <div 
          style={{
            width: size, 
            height: size, 
            borderRadius: borderRadius,
            background: '#e0e0e0',
            animation: 'pulse 1.5s infinite ease-in-out',
            position: 'absolute',
            top: 0, left: 0
          }}
        />
      )}
      <img
        src={src}
        alt={`Escudo de ${nombreEquipo}`}
        onLoad={() => setCargando(false)}
        style={{ 
          display: cargando ? 'none' : 'block',
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          borderRadius: borderRadius
        }}
        loading="lazy"
      />
    </div>
  );
};

export default EscudoEquipo;
