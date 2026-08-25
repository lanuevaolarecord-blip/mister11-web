import { 
  User, 
  MessageSquare,
  Zap, 
  HeartPulse, 
  ClipboardList, 
  BarChart3, 
  CalendarCheck 
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import './PlayerTabs.css';

export const PLAYER_TABS = [
  { id: 'GENERAL', labelKey: 'player.tab.general', defaultLabel: 'GENERAL', icon: User },
  { id: 'FÍSICO', labelKey: 'player.tab.physical', defaultLabel: 'FÍSICO', icon: Zap },
  { id: 'SALUD', labelKey: 'player.tab.health', defaultLabel: 'SALUD', icon: HeartPulse },
  { id: 'PLANES', labelKey: 'player.tab.plans', defaultLabel: 'PLANES', icon: ClipboardList },
  { id: 'ASISTENCIA', labelKey: 'player.tab.attendance', defaultLabel: 'ASISTENCIA', icon: CalendarCheck }
];

export const PlayerTabs = ({ activeTab, onTabChange, className = '' }) => {
  const { t } = useTranslation();

  const handleKeyDown = (e, tabId, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTabChange(tabId);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % PLAYER_TABS.length;
      onTabChange(PLAYER_TABS[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + PLAYER_TABS.length) % PLAYER_TABS.length;
      onTabChange(PLAYER_TABS[prevIndex].id);
    }
  };

  return (
    <div 
      className={`player-tabs-navigation ${className}`}
      role="tablist"
      aria-label="Secciones del perfil de jugador"
    >
      {PLAYER_TABS.map((tab, idx) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        const translatedLabel = t(tab.labelKey) || tab.defaultLabel;

        return (
          <button
            key={tab.id}
            id={`player-tab-${tab.id.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
            role="tab"
            type="button"
            className={`player-tab-card ${isActive ? 'active' : ''}`}
            aria-selected={isActive}
            aria-controls={`player-panel-${tab.id.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id, idx)}
          >
            <div className="player-tab-icon-wrap">
              <IconComponent size={18} className="player-tab-icon" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="player-tab-label">{translatedLabel}</span>
            {isActive && <div className="player-tab-active-indicator" />}
          </button>
        );
      })}
    </div>
  );
};

export default PlayerTabs;
