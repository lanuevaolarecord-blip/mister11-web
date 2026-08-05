import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const { t } = useTranslation();

  const MAIN_ITEMS = [
    { ruta: '/',              icono: '🏠', labelKey: 'bottomnav.home' },
    { ruta: '/pizarra',       icono: '📋', labelKey: 'bottomnav.pizarra' },
    { ruta: '/equipo',        icono: '👥', labelKey: 'bottomnav.equipo' },
    { ruta: '/ia-generadora', icono: '✨', labelKey: 'bottomnav.ia' },
  ];

  const MORE_ITEMS = [
    { ruta: '/planificacion', icono: '📅', labelKey: 'bottomnav.planificacion' },
    { ruta: '/sesiones',      icono: '📝', labelKey: 'bottomnav.sesiones' },
    { ruta: '/partidos',      icono: '⚽', labelKey: 'bottomnav.partidos' },
    { ruta: '/tests',         icono: '📊', labelKey: 'bottomnav.tests' },
    { ruta: '/admin',         icono: '⚙️', labelKey: 'bottomnav.ajustes' },
  ];

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
              <span>{t(item.labelKey)}</span>
            </div>
          );
        })}

        <div
          className={`bottom-nav-item ${showMore || isMoreActive ? 'active' : ''}`}
          onClick={() => setShowMore(true)}
        >
          <span className="bottom-nav-icon">☰</span>
          <span>{t('bottomnav.more')}</span>
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
          <div className="bottom-sheet-title">{t('bottomnav.moreModules')}</div>
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
                  <span className="bottom-sheet-label">{t(item.labelKey)}</span>
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

