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
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { ACHIEVEMENT_TIERS } from '../../config/achievements';
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

export const PlayerAchievementsTab = ({ achievements, loading, isParentView = false, playerName = '' }) => {
  const [selectedTier, setSelectedTier] = useState('ALL'); // 'ALL' | 'BRONZE' | 'SILVER' | 'GOLD'

  if (loading) {
    return (
      <div className="achievements-loading">
        <div className="achievements-spinner" />
        <p>Cargando vitrina de logros...</p>
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
              {isParentView ? `Logros de ${playerName}` : 'Tus Logros Deportivos'}
            </h3>
            <p className="achievements-hero-subtitle">
              Temporada 2026-27 · Fútbol Formativo
            </p>
          </div>
        </div>
        <div className="achievements-stats-pill">
          <div className="stat-box">
            <span className="stat-num">{unlockedCount} / {achievements.length}</span>
            <span className="stat-lbl">Desbloqueados</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-box">
            <span className="stat-num xp-gold">✨ {totalXP} XP</span>
            <span className="stat-lbl">Experiencia</span>
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
          🏆 Todos ({achievements.length})
        </button>
        {Object.entries(ACHIEVEMENT_TIERS).map(([key, tier]) => {
          const count = achievements.filter(a => a.tier === key).length;
          return (
            <button
              key={key}
              type="button"
              className={`tier-filter-btn tier-${key.toLowerCase()} ${selectedTier === key ? 'active' : ''}`}
              onClick={() => setSelectedTier(key)}
            >
              <span>{tier.icon}</span> {tier.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de Logros */}
      <div className="achievements-grid">
        {filteredAchievements.map((ach) => {
          const IconComp = ICON_MAP[ach.icon] || Trophy;
          const tier = ach.tierInfo;
          const isUnlocked = ach.isUnlocked;

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
                  <span>{tier.icon} {tier.name}</span>
                  <span className="ach-xp-tag">+{ach.xp} XP</span>
                </div>
              </div>

              <div className="ach-card-body">
                <h4 className="ach-name">{ach.name}</h4>
                <p className="ach-desc">{ach.desc}</p>
              </div>

              <div className="ach-card-footer">
                {!ach.isActive ? (
                  <div className="ach-inactive-notice">
                    <span>⏸️ Sin sesiones programadas esta semana</span>
                  </div>
                ) : (
                  <>
                    <div className="ach-progress-header">
                      <span className="ach-period-tag">{tier.periodLabel}</span>
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
                      <CheckCircle2 size={14} color="#10B981" /> ¡Completado!
                    </span>
                  ) : (
                    <span className="ach-status-locked">
                      <Lock size={13} /> {ach.percent}% completado
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
