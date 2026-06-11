import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User } from 'lucide-react';
import './ModeSwitcher.css';

const ModeSwitcher = () => {
  const { currentMode, toggleMode, isClubMember } = useAuth();

  if (!isClubMember) return null;

  return (
    <div className="mode-switcher-container">
      <button 
        type="button"
        className={`mode-btn ${currentMode === 'pro' ? 'active' : ''}`}
        onClick={() => currentMode !== 'pro' && toggleMode()}
        title="Modo Entrenador Pro"
      >
        <User size={16} />
        <span>ENTRENADOR</span>
      </button>
      <button 
        type="button"
        className={`mode-btn ${currentMode === 'club' ? 'active' : ''}`}
        onClick={() => currentMode !== 'club' && toggleMode()}
        title="Modo Club"
      >
        <Shield size={16} />
        <span>CLUB</span>
      </button>
    </div>
  );
};

export default ModeSwitcher;
