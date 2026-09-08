import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { 
  Clock, 
  Users, 
  User, 
  Target, 
  BarChart2, 
  ChevronDown, 
  Search, 
  Filter, 
  X,
  Check
} from 'lucide-react';

export const StatsFilters = ({
  timeFilter,
  setTimeFilter,
  timeRange,
  setTimeRange,
  teamFilter,
  setTeamFilter,
  selectedPlayers,
  setSelectedPlayers,
  availablePlayers = [],
  zoneFilter,
  setZoneFilter,
  actionTypes,
  setActionTypes,
  homeTeamName = 'Local',
  awayTeamName = 'Visitante'
}) => {
  const { isEn } = useTranslation();
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');

  const togglePlayerSelection = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const toggleActionType = (typeKey) => {
    setActionTypes(prev => ({
      ...prev,
      [typeKey]: !prev[typeKey]
    }));
  };

  const filteredPlayersList = availablePlayers.filter(p => {
    const name = (p.nombre || p.name || `Jugador ${p.dorsal || ''}`).toLowerCase();
    const dorsal = String(p.dorsal || p.number || '');
    const q = playerSearch.toLowerCase();
    return name.includes(q) || dorsal.includes(q);
  });

  return (
    <div className="stats-filters-container">
      {/* ── 1. Filtros de Tiempo Coherentes por Mitades ─────────────────── */}
      <div className="filter-group">
        <div className="filter-label">
          <Clock size={16} className="filter-icon" />
          <span>{isEn ? 'TIME' : 'TIEMPO'}</span>
        </div>
        <div className="filter-btn-group">
          {[
            { id: 'all', label: isEn ? 'All' : 'Todo', range: [0, 90] },
            { id: '1T', label: isEn ? '1H (1′-45′)' : '1T (1′-45′)', range: [1, 45] },
            { id: '2T', label: isEn ? '2H (46′-90′)' : '2T (46′-90′)', range: [46, 90] },
            { id: 'extra', label: isEn ? 'Extra Time' : 'Prórroga', range: [91, 120] }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              className={`filter-pill-btn ${timeFilter === t.id ? 'active' : ''}`}
              onClick={() => {
                setTimeFilter(t.id);
                setTimeRange(t.range);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="time-range-summary-badge">
          <span>{isEn ? 'Active range:' : 'Tramo activo:'} <strong>{timeRange[0]}′ {isEn ? 'to' : 'a'} {timeRange[1]}′</strong></span>
        </div>
      </div>

      {/* ── 2. Filtros de Equipo ────────────────────────────────────────── */}
      <div className="filter-group">
        <div className="filter-label">
          <Users size={16} className="filter-icon" />
          <span>{isEn ? 'TEAM' : 'EQUIPO'}</span>
        </div>
        <div className="filter-btn-group team-btn-group">
          <button
            type="button"
            className={`filter-pill-btn ${teamFilter === 'both' ? 'active' : ''}`}
            onClick={() => setTeamFilter('both')}
          >
            {isEn ? 'Both' : 'Ambos'}
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${teamFilter === 'home' ? 'active' : ''}`}
            onClick={() => setTeamFilter('home')}
            title={homeTeamName}
          >
            {homeTeamName}
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${teamFilter === 'away' ? 'active' : ''}`}
            onClick={() => setTeamFilter('away')}
            title={awayTeamName}
          >
            {awayTeamName}
          </button>
        </div>
      </div>

      {/* ── 3. Filtros de Jugador ───────────────────────────────────────── */}
      <div className="filter-group relative-filter">
        <div className="filter-label">
          <User size={16} className="filter-icon" />
          <span>{isEn ? 'PLAYERS' : 'JUGADORES'}</span>
          {selectedPlayers.length > 0 && (
            <span className="badge-count">{selectedPlayers.length}</span>
          )}
        </div>
        
        <div className="player-selector-trigger" onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}>
          <span className="trigger-text">
            {selectedPlayers.length === 0 
              ? (isEn ? 'All players' : 'Todos los jugadores')
              : (isEn ? `${selectedPlayers.length} selected` : `${selectedPlayers.length} seleccionado(s)`)}
          </span>
          <ChevronDown size={16} />
        </div>

        {showPlayerDropdown && (
          <div className="player-dropdown-menu">
            <div className="dropdown-search">
              <Search size={14} />
              <input
                type="text"
                placeholder={isEn ? 'Search number or name...' : 'Buscar dorsal o nombre...'}
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                autoFocus
              />
              {playerSearch && (
                <button type="button" onClick={() => setPlayerSearch('')} className="clear-btn">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="dropdown-actions">
              <button 
                type="button" 
                className="action-link"
                onClick={() => setSelectedPlayers([])}
              >
                {isEn ? 'Clear selection' : 'Limpiar selección'}
              </button>
            </div>

            <div className="dropdown-list">
              {filteredPlayersList.length === 0 ? (
                <div className="empty-list-msg">{isEn ? 'No players found' : 'No se encontraron jugadores'}</div>
              ) : (
                filteredPlayersList.map(p => {
                  const isSelected = selectedPlayers.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => togglePlayerSelection(p.id)}
                    >
                      <div className="player-badge-num">
                        {p.dorsal || p.number || '•'}
                      </div>
                      <span className="player-name-text">
                        {p.nombre || p.name || (isEn ? `Player #${p.dorsal || ''}` : `Jugador #${p.dorsal || ''}`)}
                      </span>
                      {isSelected && <Check size={16} className="check-icon" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Filtros de Zona Táctica ──────────────────────────────────── */}
      <div className="filter-group">
        <div className="filter-label">
          <Target size={16} className="filter-icon" />
          <span>{isEn ? 'FIELD ZONE' : 'ZONA DEL CAMPO'}</span>
        </div>
        <div className="filter-btn-group zones-group">
          {[
            { id: 'all', label: isEn ? 'All' : 'Todo' },
            { id: 'def', label: isEn ? 'Defensive' : 'Defensiva' },
            { id: 'mid', label: isEn ? 'Midfield' : 'Media' },
            { id: 'att', label: isEn ? 'Offensive' : 'Ofensiva' }
          ].map(z => (
            <button
              key={z.id}
              type="button"
              className={`filter-pill-btn ${zoneFilter === z.id ? 'active' : ''}`}
              onClick={() => setZoneFilter(z.id)}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Filtros por Tipo de Acción ───────────────────────────────── */}
      <div className="filter-group">
        <div className="filter-label">
          <BarChart2 size={16} className="filter-icon" />
          <span>{isEn ? 'ACTIONS' : 'ACCIONES'}</span>
        </div>
        <div className="action-checkboxes-row">
          {[
            { key: 'passes', label: isEn ? 'Passes' : 'Pases', color: '#3B82F6' },
            { key: 'shots', label: isEn ? 'Shots' : 'Tiros', color: '#10B981' },
            { key: 'defense', label: isEn ? 'Defense' : 'Defensa', color: '#F59E0B' },
            { key: 'fouls', label: isEn ? 'Fouls' : 'Faltas', color: '#EF4444' },
            { key: 'setPieces', label: isEn ? 'SP' : 'ABP', color: '#8B5CF6' },
          ].map(act => (
            <label key={act.key} className="action-checkbox-item">
              <input
                type="checkbox"
                checked={!!actionTypes[act.key]}
                onChange={() => toggleActionType(act.key)}
              />
              <span className="custom-box" style={{ borderColor: act.color }}>
                {actionTypes[act.key] && <Check size={12} color={act.color} />}
              </span>
              <span className="checkbox-text">{act.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
