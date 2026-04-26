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
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { auth, signOut } from '../firebaseConfig';
import { useSettings } from '../hooks/useSettings';

const Sidebar = () => {
  const { settings } = useSettings();
  const navItems = [
    { path: '/', label: 'DASHBOARD', icon: LayoutDashboard },
    { path: '/pizarra', label: 'PIZARRA TÁCTICA', icon: Presentation },
    { path: '/equipo', label: 'MI EQUIPO', icon: Users },
    { path: '/sesiones', label: 'SESIONES', icon: CalendarDays },
    { path: '/planificacion', label: 'PLANIFICACIÓN', icon: TrendingUp },
    { path: '/tests', label: 'TESTS', icon: Activity },
    { path: '/partidos', label: 'PARTIDOS', icon: Trophy },
    { path: '/ia-generadora', label: 'IA GENERADORA', icon: Sparkles },
    { path: '/admin', label: 'ADMINISTRACIÓN', icon: ShieldCheck },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src="/logo_mister11.png" alt="Mister 11 Logo" className="logo-img" />
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
          <div className="user-avatar" style={{background: 'var(--accent)', color: 'white', fontWeight: 'bold', fontSize: '14px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', width:'36px', height:'36px', flexShrink:0}}>
            {auth.currentUser?.displayName?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <div className="user-info">
            <span className="user-name">{settings.profileName || auth.currentUser?.displayName?.split(' ')[0] || 'Míster'}</span>
            <span className="user-role">{settings.specialty || 'Entrenador'}</span>
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
