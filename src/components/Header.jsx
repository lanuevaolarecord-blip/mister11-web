import React from 'react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'DASHBOARD';
      case '/pizarra': return 'PIZARRA TÁCTICA';
      case '/equipo': return 'MI EQUIPO';
      case '/sesiones': return 'SESIONES';
      case '/planificacion': return 'PLANIFICACIÓN';
      case '/tests': return 'TESTS';
      case '/partidos': return 'PARTIDOS';
      case '/ia-generadora': return 'IA GENERADORA';
      default: return 'MISTER 11';
    }
  };

  return (
    <header className="header">
      <h1>{getPageTitle()}</h1>
      
      <div className="header-actions">
        <button className="icon-btn" title="Notificaciones">
          🔔
        </button>
        <button className="icon-btn" title="Ajustes">
          ⚙️
        </button>
      </div>
    </header>
  );
};

export default Header;
