import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Presentation, 
  Users, 
  CalendarDays, 
  TrendingUp, 
  Activity, 
  Trophy, 
  Sparkles,
  LogOut
} from 'lucide-react';
import { auth, signOut } from '../firebaseConfig';

const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'DASHBOARD', icon: LayoutDashboard },
    { path: '/pizarra', label: 'PIZARRA TÁCTICA', icon: Presentation },
    { path: '/equipo', label: 'MI EQUIPO', icon: Users },
    { path: '/sesiones', label: 'SESIONES', icon: CalendarDays },
    { path: '/planificacion', label: 'PLANIFICACIÓN', icon: TrendingUp },
    { path: '/tests', label: 'TESTS', icon: Activity },
    { path: '/partidos', label: 'PARTIDOS', icon: Trophy },
    { path: '/ia-generadora', label: 'IA GENERADORA', icon: Sparkles },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" className="logo-icon">
          <circle cx="40" cy="40" r="39" fill="#1B3A2D"/>
          <circle cx="40" cy="40" r="37" fill="none" stroke="#D4A843" strokeWidth="2.5"/>
          <line x1="40" y1="4" x2="40" y2="76" stroke="#4CAF7D" strokeWidth="0.8" opacity="0.2"/>
          <circle cx="40" cy="40" r="14" fill="none" stroke="#4CAF7D" strokeWidth="0.8" opacity="0.2"/>
          <text x="40" y="35" textAnchor="middle" fontFamily="Georgia,serif" fontSize="22" fontWeight="700" fill="#FFFFFF">M</text>
          <rect x="26" y="38" width="28" height="2.5" rx="1.25" fill="#D4A843"/>
          <text x="40" y="54" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="15" fontWeight="700" fill="#4CAF7D">11</text>
          <circle cx="40" cy="2.5" r="3" fill="#D4A843"/>
          <circle cx="40" cy="77.5" r="3" fill="#D4A843"/>
          <circle cx="2.5" cy="40" r="3" fill="#D4A843"/>
          <circle cx="77.5" cy="40" r="3" fill="#D4A843"/>
        </svg>
        <span className="logo-text">MISTER<span>11</span></span>
      </div>
      
      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.path}
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="user-profile" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div className="user-avatar">
            {auth.currentUser?.photoURL ? (
              <img src={auth.currentUser.photoURL} alt="Avatar" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
            ) : (
              auth.currentUser?.displayName?.charAt(0) || 'M'
            )}
          </div>
          <div className="user-info">
            <span className="user-name">{auth.currentUser?.displayName?.split(' ')[0] || 'Míster'}</span>
            <span className="user-role">Entrenador</span>
          </div>
        </div>
        <button 
          onClick={() => signOut(auth)} 
          style={{
            background: 'transparent', border: '1px solid #444', color: '#888', 
            padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px',
            marginTop: '5px'
          }}
        >
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
