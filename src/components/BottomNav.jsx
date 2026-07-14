import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { ruta: '/',              icono: '🏠', label: 'Inicio' },
  { ruta: '/pizarra',       icono: '📋', label: 'Pizarra' },
  { ruta: '/equipo',        icono: '👥', label: 'Equipo' },
  { ruta: '/sesiones',      icono: '📅', label: 'Sesiones' },
  { ruta: '/ia-generadora', icono: '✨', label: 'IA' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const activo = location.pathname === item.ruta ||
          (item.ruta !== '/' && 
           location.pathname.startsWith(item.ruta));
        return (
          <div
            key={item.ruta}
            className={`bottom-nav-item ${activo ? 'active' : ''}`}
            onClick={() => navigate(item.ruta)}
          >
            <span className="bottom-nav-icon">{item.icono}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
