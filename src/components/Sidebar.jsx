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
import { t } from '../i18n/translations';

const Sidebar = () => {
  const { settings } = useSettings();
  const navItems = [
    { path: '/', label: t('nav.dashboard', settings.language), icon: LayoutDashboard },
    { path: '/pizarra', label: t('nav.pizarra', settings.language), icon: Presentation },
    { path: '/equipo', label: t('nav.equipo', settings.language), icon: Users },
    { path: '/sesiones', label: t('nav.sesiones', settings.language), icon: CalendarDays },
    { path: '/planificacion', label: t('nav.planificacion', settings.language), icon: TrendingUp },
    { path: '/tests', label: t('nav.tests', settings.language), icon: Activity },
    { path: '/partidos', label: t('nav.partidos', settings.language), icon: Trophy },
    { path: '/ia-generadora', label: t('nav.ia', settings.language), icon: Sparkles },
    { path: '/admin', label: t('nav.admin', settings.language), icon: ShieldCheck },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src="/logo_mister11.png" alt="Míster11" height="40"/>
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
          <div className="user-avatar" style={{background: '#4CAF7D', color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', width:'36px', height:'36px', flexShrink:0}}>
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
            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#AAAAAA', 
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
