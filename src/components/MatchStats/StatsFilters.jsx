import React, { useState } from 'react';
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
      {/* ── 1. Filtros de Tiempo ────────────────────────────────────────── */}
      <div className="filter-group">
        <div className="filter-label">
          <Clock size={16} className="filter-icon" />
          <span>TIEMPO</span>
        </div>
        <div className="filter-btn-group">
          {['all', '1T', '2T', 'extra'].map(t => (
            <button
              key={t}
              type="button"
              className={`filter-pill-btn ${timeFilter === t ? 'active' : ''}`}
              onClick={() => setTimeFilter(t)}
            >
              {t === 'all' ? 'Todo' : t === 'extra' ? 'Prórroga' : t}
            </button>
          ))}
        </div>
        
        {/* Selector de Rango de Minutos */}
        <div className="time-range-slider-wrapper">
          <span className="time-range-text">{timeRange[0]}′ - {timeRange[1]}′</span>
          <div className="time-range-inputs">
            <input
              type="range"
              min="0"
              max="90"
              value={timeRange[0]}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), timeRange[1] - 5);
                setTimeRange([val, timeRange[1]]);
              }}
              className="range-input"
              aria-label="Minuto inicial"
            />
            <input
              type="range"
              min="0"
              max="90"
              value={timeRange[1]}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), timeRange[0] + 5);
                setTimeRange([timeRange[0], val]);
              }}
              className="range-input"
              aria-label="Minuto final"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Filtros de Equipo ────────────────────────────────────────── */}
      <div className="filter-group">
        <div className="filter-label">
          <Users size={16} className="filter-icon" />
          <span>EQUIPO</span>
        </div>
        <div className="filter-btn-group">
          <button
            type="button"
            className={`filter-pill-btn ${teamFilter === 'both' ? 'active' : ''}`}
            onClick={() => setTeamFilter('both')}
          >
            Ambos
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${teamFilter === 'home' ? 'active' : ''}`}
            onClick={() => setTeamFilter('home')}
            title={homeTeamName}
          >
            {homeTeamName.length > 12 ? `${homeTeamName.substring(0, 10)}...` : homeTeamName}
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${teamFilter === 'away' ? 'active' : ''}`}
            onClick={() => setTeamFilter('away')}
            title={awayTeamName}
          >
            {awayTeamName.length > 12 ? `${awayTeamName.substring(0, 10)}...` : awayTeamName}
          </button>
        </div>
      </div>

      {/* ── 3. Filtros de Jugador ───────────────────────────────────────── */}
      <div className="filter-group relative-filter">
        <div className="filter-label">
          <User size={16} className="filter-icon" />
          <span>JUGADORES</span>
          {selectedPlayers.length > 0 && (
            <span className="badge-count">{selectedPlayers.length}</span>
          )}
        </div>
        
        <div className="player-selector-trigger" onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}>
          <span className="trigger-text">
            {selectedPlayers.length === 0 
              ? 'Todos los jugadores' 
              : `${selectedPlayers.length} seleccionado(s)`}
          </span>
          <ChevronDown size={16} />
        </div>

        {showPlayerDropdown && (
          <div className="player-dropdown-menu">
            <div className="dropdown-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar dorsal o nombre..."
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
                Limpiar selección
              </button>
            </div>

            <div className="dropdown-list">
              {filteredPlayersList.length === 0 ? (
                <div className="empty-list-msg">No se encontraron jugadores</div>
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
                        {p.nombre || p.name || `Jugador #${p.dorsal || ''}`}
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
          <span>ZONA DEL CAMPO</span>
        </div>
        <div className="filter-btn-group zones-group">
          {[
            { id: 'all', label: 'Todo' },
            { id: 'def', label: 'Defensiva' },
            { id: 'mid', label: 'Media' },
            { id: 'att', label: 'Ofensiva' }
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
          <span>ACCIONES</span>
        </div>
        <div className="action-checkboxes-row">
          {[
            { key: 'passes', label: 'Pases', color: '#3B82F6' },
            { key: 'shots', label: 'Tiros', color: '#10B981' },
            { key: 'defense', label: 'Defensa', color: '#F59E0B' },
            { key: 'fouls', label: 'Faltas', color: '#EF4444' },
            { key: 'setPieces', label: 'ABP', color: '#8B5CF6' },
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
