import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Shield, 
  Activity, 
  Zap, 
  TrendingUp, 
  Users, 
  Target, 
  Sparkles, 
  Award, 
  Star, 
  Brain, 
  ClipboardCheck, 
  Calendar,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { ACHIEVEMENT_TIERS } from '../../config/achievements';
import { useTranslation } from '../../hooks/useTranslation';
import './PlayerAchievementsTab.css';

const ICON_MAP = {
  Flame,
  Shield,
  Activity,
  Zap,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Award,
  Star,
  Brain,
  ClipboardCheck,
  Calendar,
  Trophy
};

export const PlayerAchievementsTab = ({ achievements = [], loading, isParentView = false, playerName = '' }) => {
  const { t, isEn } = useTranslation();
  const [selectedTier, setSelectedTier] = useState('ALL'); // 'ALL' | 'BRONZE' | 'SILVER' | 'GOLD'

  if (loading) {
    return (
      <div className="achievements-loading">
        <div className="achievements-spinner" />
        <p>{t('player.achievements.loading')}</p>
      </div>
    );
  }

  const filteredAchievements = selectedTier === 'ALL' 
    ? achievements 
    : achievements.filter(a => a.tier === selectedTier);

  const totalXP = achievements
    .filter(a => a.isUnlocked)
    .reduce((sum, a) => sum + (a.xp || 0), 0);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <div className="player-tab-content player-achievements-tab">
      
      {/* Banner de Nivel & XP */}
      <div className="achievements-hero-card">
        <div className="achievements-hero-left">
          <div className="achievements-trophy-badge">
            <Trophy size={32} color="#C9A84C" />
          </div>
          <div>
            <h3 className="achievements-hero-title">
              {isParentView 
                ? t('player.achievements.titleParent', { name: playerName }) 
                : t('player.achievements.title')}
            </h3>
            <p className="achievements-hero-subtitle">
              {t('player.achievements.season')}
            </p>
          </div>
        </div>
        <div className="achievements-stats-pill">
          <div className="stat-box">
            <span className="stat-num">{unlockedCount} / {achievements.length}</span>
            <span className="stat-lbl">{t('player.achievements.unlocked')}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-box">
            <span className="stat-num xp-gold">✨ {totalXP} XP</span>
            <span className="stat-lbl" style={{ fontWeight: 800 }}>{t('player.achievements.xpTitle')}</span>
            <span style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
              {t('player.achievements.xpSubtitle')}
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Tiers */}
      <div className="achievements-tier-filters">
        <button
          type="button"
          className={`tier-filter-btn ${selectedTier === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedTier('ALL')}
        >
          🏆 {t('player.achievements.filterAll', { count: achievements.length })}
        </button>
        {Object.entries(ACHIEVEMENT_TIERS).map(([key, tier]) => {
          const count = achievements.filter(a => a.tier === key).length;
          const tierLabel = tier.nameKey ? t(tier.nameKey, {}, tier.name) : tier.name;
          return (
            <button
              key={key}
              type="button"
              className={`tier-filter-btn tier-${key.toLowerCase()} ${selectedTier === key ? 'active' : ''}`}
              onClick={() => setSelectedTier(key)}
            >
              <span>{tier.icon}</span> {tierLabel} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de Logros */}
      <div className="achievements-grid">
        {filteredAchievements.map((ach) => {
          const IconComp = ICON_MAP[ach.icon] || Trophy;
          const tier = ach.tierInfo || ACHIEVEMENT_TIERS[ach.tier] || ACHIEVEMENT_TIERS.BRONZE;
          const isUnlocked = ach.isUnlocked;
          const achName = ach.nameKey ? t(ach.nameKey, {}, ach.name) : ach.name;
          const achDesc = ach.descKey ? t(ach.descKey, {}, ach.desc) : ach.desc;
          const tierLabel = tier.nameKey ? t(tier.nameKey, {}, tier.name) : tier.name;
          const periodLabel = tier.periodKey ? t(tier.periodKey, {}, tier.periodLabel) : tier.periodLabel;

          return (
            <div 
              key={ach.id} 
              className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'} tier-${ach.tier.toLowerCase()}`}
              style={{
                '--tier-color': tier.color,
                '--tier-bg': tier.bg,
                '--tier-border': tier.border
              }}
            >
              <div className="ach-card-top">
                <div className="ach-icon-box">
                  <IconComp size={24} color={isUnlocked ? tier.color : '#94A3B8'} />
                </div>
                <div className="ach-tier-badge">
                  <span>{tier.icon} {tierLabel}</span>
                  <span className="ach-xp-tag">+{ach.xp} XP</span>
                </div>
              </div>

              <div className="ach-card-body">
                <h4 className="ach-name">{achName}</h4>
                <p className="ach-desc">{achDesc}</p>
              </div>

              <div className="ach-card-footer">
                {!ach.isActive ? (
                  <div className="ach-inactive-notice">
                    <span>{t('player.achievements.noSessions')}</span>
                  </div>
                ) : (
                  <>
                    <div className="ach-progress-header">
                      <span className="ach-period-tag">{periodLabel}</span>
                      <span className="ach-progress-numbers">
                        {ach.progress} / {ach.target}
                      </span>
                    </div>
                    <div className="ach-progress-bar-bg">
                      <div 
                        className="ach-progress-bar-fill"
                        style={{ 
                          width: `${ach.percent}%`,
                          backgroundColor: tier.color 
                        }}
                      />
                    </div>
                  </>
                )}

                <div className="ach-status-row">
                  {isUnlocked ? (
                    <span className="ach-status-unlocked">
                      <CheckCircle2 size={14} color="#10B981" /> {t('player.achievements.completed')}
                    </span>
                  ) : ach.isPendingActa ? (
                    <span className="ach-status-pending" style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800' }}>
                      ⏳ {t('player.achievements.pendingActa')}
                    </span>
                  ) : (
                    <span className="ach-status-locked">
                      <Lock size={13} /> {t('player.achievements.inProgress', { percent: ach.percent })}
                    </span>
                  )}
                  {ach.isRsvpIntentionOnly && (
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic', marginLeft: 'auto' }}>
                      {t('player.achievements.intentionOnlyNote')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PlayerAchievementsTab;
