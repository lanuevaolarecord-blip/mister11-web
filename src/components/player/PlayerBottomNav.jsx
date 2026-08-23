import React from 'react';
import { Home, Calendar, BarChart2, User } from 'lucide-react';
import './PlayerBottomNav.css';

export const PlayerBottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'stats', label: 'Mis Stats', icon: BarChart2 },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="player-bottom-nav">
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
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="player-nav-label">{tab.label}</span>
            {isActive && <div className="player-nav-indicator" />}
          </button>
        );
      })}
    </nav>
  );
};
