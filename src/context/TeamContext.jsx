import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const auth = useAuth();
  
  // Re-exponer los valores relativos a equipos desde useAuth para consistencia arquitectónica
  const value = {
    teams: auth.teams,
    activeTeamId: auth.activeTeamId,
    changeActiveTeam: auth.changeActiveTeam,
    getTeamPath: auth.getTeamPath,
    currentMode: auth.currentMode,
    toggleMode: auth.toggleMode
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    // Fallback de seguridad al contexto de Auth que ya expone estos mismos valores
    try {
      const auth = useAuth();
      return {
        teams: auth.teams,
        activeTeamId: auth.activeTeamId,
        changeActiveTeam: auth.changeActiveTeam,
        getTeamPath: auth.getTeamPath,
        currentMode: auth.currentMode,
        toggleMode: auth.toggleMode
      };
    } catch (e) {
      return {
        teams: [],
        activeTeamId: null,
        changeActiveTeam: () => {},
        getTeamPath: () => '',
        currentMode: 'pro',
        toggleMode: () => {}
      };
    }
  }
  return context;
};
