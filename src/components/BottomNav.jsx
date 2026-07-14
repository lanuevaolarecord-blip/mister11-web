import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MAIN_ITEMS = [
  { ruta: '/',              icono: '🏠', label: 'Inicio' },
  { ruta: '/pizarra',       icono: '📋', label: 'Pizarra' },
  { ruta: '/equipo',        icono: '👥', label: 'Equipo' },
  { ruta: '/ia-generadora', icono: '✨', label: 'IA' },
];

const MORE_ITEMS = [
  { ruta: '/planificacion', icono: '📅', label: 'Planificación' },
  { ruta: '/sesiones',      icono: '📝', label: 'Sesiones' },
  { ruta: '/partidos',      icono: '⚽', label: 'Partidos' },
  { ruta: '/tests',         icono: '📊', label: 'Tests' },
  { ruta: '/admin',         icono: '⚙️', label: 'Ajustes' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const handleNavigate = (ruta) => {
    setShowMore(false);
    navigate(ruta);
  };

  const isMoreActive = MORE_ITEMS.some(item => 
    location.pathname === item.ruta || 
    (item.ruta !== '/' && location.pathname.startsWith(item.ruta))
  );

  return (
    <>
      <nav className="bottom-nav">
        {MAIN_ITEMS.map((item) => {
          const activo = location.pathname === item.ruta ||
            (item.ruta !== '/' && 
             location.pathname.startsWith(item.ruta));
          return (
            <div
              key={item.ruta}
              className={`bottom-nav-item ${activo ? 'active' : ''}`}
              onClick={() => handleNavigate(item.ruta)}
            >
              <span className="bottom-nav-icon">{item.icono}</span>
              <span>{item.label}</span>
            </div>
          );
        })}

        <div
          className={`bottom-nav-item ${showMore || isMoreActive ? 'active' : ''}`}
          onClick={() => setShowMore(true)}
        >
          <span className="bottom-nav-icon">☰</span>
          <span>Más</span>
        </div>
      </nav>

      {/* Bottom Sheet Menu */}
      <div 
        className={`bottom-sheet-overlay ${showMore ? 'open' : ''}`} 
        onClick={() => setShowMore(false)}
      >
        <div 
          className={`bottom-sheet ${showMore ? 'open' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bottom-sheet-header">
            <div className="bottom-sheet-drag-handle" />
            <button className="bottom-sheet-close" onClick={() => setShowMore(false)}>✕</button>
          </div>
          <div className="bottom-sheet-title">MÁS MÓDULOS</div>
          <div className="bottom-sheet-grid">
            {MORE_ITEMS.map((item) => {
              const activo = location.pathname === item.ruta ||
                (item.ruta !== '/' && 
                 location.pathname.startsWith(item.ruta));
              return (
                <div
                  key={item.ruta}
                  className={`bottom-sheet-item ${activo ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.ruta)}
                >
                  <span className="bottom-sheet-icon">{item.icono}</span>
                  <span className="bottom-sheet-label">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomNav;
