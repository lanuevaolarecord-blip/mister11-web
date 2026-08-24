import React from 'react';
import { Home, Calendar, Trophy, MessageSquare, BarChart2, User } from 'lucide-react';
import './PlayerBottomNav.css';

export const PlayerBottomNav = ({ activeTab, onTabChange, hasUnreadMessages = false }) => {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'achievements', label: 'Logros', icon: Trophy },
    { id: 'chat', label: 'Míster', icon: MessageSquare, hasBadge: hasUnreadMessages },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'profile', label: 'Ficha', icon: User },
  ];

  return (
    <nav className="player-bottom-nav" role="navigation" aria-label="Navegación inferior del portal">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`player-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
          >
            <div className="player-nav-icon-wrapper">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {tab.hasBadge && <span className="player-nav-unread-dot" />}
            </div>
            <span className="player-nav-label">{tab.label}</span>
            {isActive && <div className="player-nav-indicator" />}
          </button>
        );
      })}
    </nav>
  );
};

export default PlayerBottomNav;
