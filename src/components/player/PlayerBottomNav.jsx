import { useTranslation } from '../../hooks/useTranslation';
import './PlayerBottomNav.css';

export const PlayerBottomNav = ({ activeTab, onTabChange, hasUnreadMessages = false }) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home', label: t('player.nav.home'), icon: Home },
    { id: 'schedule', label: t('player.nav.schedule'), icon: Calendar },
    { id: 'achievements', label: t('player.nav.achievements'), icon: Trophy },
    { id: 'chat', label: t('player.nav.chat'), icon: MessageSquare, hasBadge: hasUnreadMessages },
    { id: 'stats', label: t('player.nav.stats'), icon: BarChart2 },
    { id: 'profile', label: t('player.nav.profile'), icon: User },
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
