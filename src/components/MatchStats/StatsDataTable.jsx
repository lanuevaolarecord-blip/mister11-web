import React, { useState, useMemo } from 'react';
import { Table, Search, ArrowUpDown, Download, Check, HelpCircle, X } from 'lucide-react';
import { downloadCSV } from '../../utils/downloadCSV.js';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { getEffectiveLanguage } from '../../i18n/translations';

export const StatsDataTable = ({
  playerStats = [],
  teamName = 'Local'
}) => {
  const { isEn } = useTranslation();
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('rating');
  const [sortAsc, setSortAsc] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const processedData = useMemo(() => {
    return playerStats.map((p, idx) => {
      const pasesC = Number(p.pasesExitosos || 0);
      const pasesF = Number(p.pasesFallidos || 0);
      const pasesTot = pasesC + pasesF;
      const passPct = pasesTot > 0 ? Math.round((pasesC / pasesTot) * 100) : null;

      const duelosG = Number(p.duelosGanados ?? p.entradas ?? 0);
      const duelosP = Number(p.duelosPerdidos ?? 0);
      const duelosTot = duelosG + duelosP;
      const duelPct = duelosTot > 0 ? Math.round((duelosG / duelosTot) * 100) : null;

      const tirosP = Number(p.tirosPuerta || 0);
      const tirosTot = Math.max(tirosP, Number(p.tiros || 0));
      const shotPct = tirosTot > 0 ? Math.round((tirosP / tirosTot) * 100) : null;

      const recup = Number(p.recuperaciones || 0);
      const perd = Number(p.perdidas || 0);

      const goles = Number(p.goles || 0);
      const asistencias = Number(p.asistencias || 0);
      const faltas = Number(p.faltas || 0);
      const amarillas = Number(p.amarillas || 0);
      const rojas = Number(p.rojas || 0);
      const paradas = Number(p.paradas || p.saves || 0);
      const pasesClave = Number(p.pasesClave || 0);
      const minutos = Number(p.minutos ?? 0);

      const xG = p.xG !== undefined && p.xG !== null 
        ? Number(p.xG) 
        : parseFloat(((tirosP * 0.35) + (Math.max(0, tirosTot - tirosP) * 0.05) + (goles * 0.4)).toFixed(2));
      
      // Cálculo de nota táctica 4.0 - 10.0 (solo si jugó o tuvo acciones)
      let rating = null;
      if (p.rating !== undefined && p.rating !== null && !isNaN(Number(p.rating))) {
        rating = Number(p.rating);
      } else if (minutos > 0 || goles > 0 || asistencias > 0 || paradas > 0 || tirosTot > 0 || pasesTot > 0 || duelosTot > 0 || recup > 0 || perd > 0 || faltas > 0 || amarillas > 0 || rojas > 0) {
        const score = 6.0 + 
          (goles * 1.2) + 
          (asistencias * 0.8) + 
          (paradas * 0.4) +
          (pasesClave * 0.3) + 
          (recup * 0.15) +
          (duelosG * 0.2) -
          (duelosP * 0.15) -
          (perd * 0.15) -
          (faltas * 0.2) -
          (amarillas * 0.5) -
          (rojas * 2.0);
        rating = Number(Math.min(10.0, Math.max(4.0, score)).toFixed(1));
      }

      return {
        id: p.id || `p-${idx}`,
        dorsal: p.dorsal || p.number || (idx + 1),
        nombre: p.nombre || p.name || `Jugador #${idx + 1}`,
        posicion: p.posicion || p.position || 'MED',
        minutos,
        goles,
        asistencias,
        paradas,
        tiros: tirosTot,
        tirosPuerta: tirosP,
        shotPct,
        pasesExitosos: pasesC,
        pasesFallidos: pasesF,
        pasesTot,
        passPct,
        duelosGanados: duelosG,
        duelosPerdidos: duelosP,
        duelosTot,
        duelPct,
        recuperaciones: recup,
        perdidas: perd,
        pasesClave,
        faltas,
        amarillas,
        rojas,
        xG,
        rating
      };
    });
  }, [playerStats]);

  // Filtrado y ordenamiento
  const sortedAndFiltered = useMemo(() => {
    return processedData
      .filter(p => {
        const q = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(q) || String(p.dorsal).includes(q);
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === null && valB !== null) return 1;
        if (valB === null && valA !== null) return -1;
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA ?? 0) - (valB ?? 0) : (valB ?? 0) - (valA ?? 0);
      });
  }, [processedData, searchTerm, sortField, sortAsc]);

  // Exportar a CSV estructurado y con compatibilidad total con Excel (BOM UTF-8 y delimitador ;)
  const handleExportCSV = async () => {
    const isEn = getEffectiveLanguage() === 'English (EN)';
    const headers = isEn ? [
       'Jersey', 'Name', 'Position', 'Minutes', 'Rating', 'Goals', 'Assists', 'xG',
       'Shots on Target', 'Total Shots', '% Shot Accuracy', 'Goalkeeper Saves',
       'Completed Passes', 'Failed Passes', 'Total Passes', '% Pass Accuracy',
       'Duels Won', 'Duels Lost', 'Total Duels', '% Duel Success',
       'Recoveries', 'Losses', 'Fouls', 'Yellow Cards', 'Red Cards'
     ] : [
       'Dorsal', 'Nombre', 'Posición', 'Minutos', 'Nota', 'Goles', 'Asistencias', 'xG',
       'Tiros Puerta', 'Tiros Totales', '% Puntería', 'Paradas Portero',
       'Pases Completados', 'Pases Fallidos', 'Pases Totales', '% Precisión Pase',
       'Duelos Ganados', 'Duelos Perdidos', 'Duelos Totales', '% Éxito Duelos',
       'Recuperaciones', 'Pérdidas', 'Faltas', 'Tarjetas Amarillas', 'Tarjetas Rojas'
     ];
     const rows = sortedAndFiltered.map(p => [
       p.dorsal,
       `"${p.nombre}"`,
       p.posicion,
       p.minutos,
       p.rating !== null ? p.rating : '-',
       p.goles,
       p.asistencias,
       p.xG.toFixed(2),
       p.tirosPuerta,
       p.tiros,
       p.shotPct !== null ? `${p.shotPct}%` : '-',
       p.paradas,
       p.pasesExitosos,
       p.pasesFallidos,
       p.pasesTot,
       p.passPct !== null ? `${p.passPct}%` : '-',
       p.duelosGanados,
       p.duelosPerdidos,
       p.duelosTot,
       p.duelPct !== null ? `${p.duelPct}%` : '-',
       p.recuperaciones,
       p.perdidas,
       p.faltas,
       p.amarillas,
       p.rojas
     ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const filename = isEn
      ? `player_stats_${teamName.toLowerCase().replace(/\s+/g, '_')}.csv`
      : `estadisticas_jugadores_${teamName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    await downloadCSV(csvContent, filename);
  };

  return (
    <div className="stats-table-container">
      {/* Barra superior de la tabla */}
      <div className="table-controls-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: darkMode ? '#FFFFFF' : '#0F172A', fontWeight: 900 }}>
          <Table size={18} color={darkMode ? '#FBBF24' : '#B45309'} />
          <h3 style={{ margin: 0, fontSize: '15px' }}>Rendimiento Individual ({teamName})</h3>
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="how-it-works-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              background: darkMode ? 'rgba(212,168,67,0.15)' : '#FEF3C7',
              color: darkMode ? '#FBBF24' : '#92400E',
              border: darkMode ? '1px solid rgba(212,168,67,0.4)' : '1px solid #FCD34D',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={13} />
            <span>¿Cómo se mide?</span>
          </button>
        </div>

        <div className="table-actions-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="table-search-box" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: darkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
            border: darkMode ? '1px solid rgba(255,255,255,0.15)' : '1.5px solid #CBD5E1',
            borderRadius: '8px',
            padding: '6px 10px',
            color: darkMode ? '#FFFFFF' : '#0F172A'
          }}>
            <Search size={14} style={{ color: darkMode ? '#94A3B8' : '#64748B' }} />
            <input
              type="text"
              placeholder={isEn ? 'Search player...' : 'Buscar jugador...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                color: darkMode ? '#FFFFFF' : '#0F172A'
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="export-csv-btn"
            title={isEn ? "Download CSV for Excel" : "Descargar CSV para Excel"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '36px',
              padding: '0 12px',
              borderRadius: '8px',
              border: darkMode ? '1px solid #D4A843' : '1.5px solid #CBD5E1',
              background: darkMode ? 'transparent' : '#FFFFFF',
              color: darkMode ? '#FFFFFF' : '#0F172A',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Download size={14} color={darkMode ? '#FBBF24' : '#059669'} />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Modal explicativo de fórmulas */}
      {showHelpModal && (
        <div className="event-selector-overlay" onClick={() => setShowHelpModal(false)} style={{ zIndex: 99999 }}>
          <div className="event-selector-modal" onClick={e => e.stopPropagation()} style={{
            maxWidth: '540px',
            width: '92vw',
            padding: '22px',
            borderRadius: '16px',
            background: darkMode ? '#1B3A2D' : '#FFFFFF',
            border: darkMode ? '1px solid #2d4a2d' : '1px solid #CBD5E1',
            color: darkMode ? '#FFFFFF' : '#0F172A',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: darkMode ? '#4ADE80' : '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={18} /> ¿Cómo se miden las métricas individuales?
              </h3>
              <button type="button" onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', color: darkMode ? '#94A3B8' : '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: darkMode ? '#CBD5E1' : '#334155', lineHeight: 1.5 }}>
              <div><strong>⭐ Nota (4.0 - 10.0):</strong> Nota mixta: base 6.0 + Goles (+1.2) + Asistencias (+0.8) + Pases Clave (+0.3) + Recuperaciones (+0.15) + Duelos Ganados (+0.2) − Duelos Perdidos (−0.15) − Pérdidas (−0.15) − Faltas (−0.2).</div>
              <div><strong>⚽ xG (Goles Esperados):</strong> Probabilidad matemática acumulada según disparos a puerta (0.25) y goles directos (0.40).</div>
              <div><strong>👟 Pases C/F (%):</strong> Pases Completados (C) vs Fallidos (F) y % de acierto sobre el total intentado.</div>
              <div><strong>⚔️ Duelos G/P (%):</strong> Duelos Ganados (G) vs Perdidos (P) y % de eficacia en disputas de balón.</div>
              <div><strong>🛡️ Recup / Pérd:</strong> Balones recuperados vs pérdidas de posesión.</div>
              <div><strong>🎯 Tiros P/Tot (%):</strong> Disparos a puerta sobre el total de tiros realizados y porcentaje de puntería.</div>
            </div>
          </div>
        </div>
      )}

      {/* Banner informativo de fuentes de datos */}
      <div style={{
        margin: '0 0 12px 0',
        padding: '10px 14px',
        borderRadius: '8px',
        background: darkMode ? 'rgba(212, 168, 67, 0.1)' : '#FEF3C7',
        border: darkMode ? '1px solid rgba(212, 168, 67, 0.3)' : '1px solid #FCD34D',
        fontSize: '11.5px',
        color: darkMode ? '#FBBF24' : '#92400E',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>💡</span>
        <span>
          <strong>Rendimiento Individual Verificable:</strong> Las estadísticas se consolidan automáticamente desde la <strong>Captura en Vivo</strong> (pulsando el chip del jugador activo), <strong>📋 Carga Post-Partido</strong> y el <strong>Acta Oficial</strong>. Los jugadores sin minutos ni acciones se muestran con nota pendiente (—).
        </span>
      </div>

      {/* Tabla con scroll horizontal responsivo */}
      <div className="table-responsive-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="pro-stats-table" style={{ minWidth: '860px' }}>
          <thead>
            <tr>
              <th onClick={() => handleSort('dorsal')} className="sortable center">#</th>
              <th onClick={() => handleSort('nombre')} className="sortable left">Jugador</th>
              <th onClick={() => handleSort('posicion')} className="sortable center">Pos</th>
              <th onClick={() => handleSort('minutos')} className="sortable center">Min <ArrowUpDown size={11} /></th>
              <th onClick={() => handleSort('rating')} className="sortable center highlight-col">Nota <ArrowUpDown size={12} /></th>
              <th onClick={() => handleSort('goles')} className="sortable center">GOL</th>
              <th onClick={() => handleSort('asistencias')} className="sortable center">AST</th>
              <th onClick={() => handleSort('xG')} className="sortable center">xG</th>
              <th onClick={() => handleSort('pasesExitosos')} className="sortable center">Pases C/F (%)</th>
              <th onClick={() => handleSort('duelosGanados')} className="sortable center">Duelos G/P (%)</th>
              <th onClick={() => handleSort('recuperaciones')} className="sortable center">Rec / Pérd</th>
              <th onClick={() => handleSort('tirosPuerta')} className="sortable center">Tiros P/Tot (%)</th>
              <th onClick={() => handleSort('paradas')} className="sortable center" title={isEn ? 'Goalkeeper Saves' : 'Paradas de Portero'}>PAR <ArrowUpDown size={11} /></th>
              <th onClick={() => handleSort('faltas')} className="sortable center">Faltas</th>
              <th onClick={() => handleSort('amarillas')} className="sortable center">Tarjetas</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.length === 0 ? (
              <tr>
                <td colSpan={15} className="no-data-cell">{isEn ? 'No players found for the applied filters.' : 'No se encontraron jugadores para los filtros aplicados.'}</td>
              </tr>
            ) : (
              sortedAndFiltered.map(p => (
                <tr key={p.id}>
                  <td className="center bold-dorsal">#{p.dorsal}</td>
                  <td className="left player-name-cell">
                    <strong>{p.nombre}</strong>
                  </td>
                  <td className="center"><span className="pos-badge">{p.posicion}</span></td>
                  <td className="center font-semibold" style={{ color: p.minutos > 0 ? (darkMode ? '#FFFFFF' : '#0F172A') : (darkMode ? '#64748B' : '#94A3B8') }}>
                    {p.minutos > 0 ? `${p.minutos}'` : '0\''}
                  </td>
                  <td className="center">
                    {p.rating !== null ? (
                      <span className={`rating-pill ${p.rating >= 8 ? 'high' : p.rating >= 6.5 ? 'mid' : 'low'}`}>
                        {p.rating}
                      </span>
                    ) : (
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: darkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                        color: darkMode ? '#94A3B8' : '#64748B'
                      }}>
                        —
                      </span>
                    )}
                  </td>
                  <td className="center font-semibold">{p.goles > 0 ? `⚽ ${p.goles}` : '—'}</td>
                  <td className="center font-semibold">{p.asistencias > 0 ? `👟 ${p.asistencias}` : '—'}</td>
                  <td className="center text-gold">{p.xG > 0 ? p.xG.toFixed(2) : '0.00'}</td>
                  <td className="center">
                    {p.pasesTot > 0 ? (
                      <span className="pass-stat-box" style={{ fontWeight: 700 }}>
                        {p.pasesExitosos}/{p.pasesFallidos} <small style={{ opacity: 0.8 }}>({p.passPct}%)</small>
                      </span>
                    ) : (
                      <span style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>0/0 (—)</span>
                    )}
                  </td>
                  <td className="center">
                    {p.duelosTot > 0 ? (
                      <span style={{ fontWeight: 700 }}>
                        {p.duelosGanados}/{p.duelosPerdidos} <small style={{ opacity: 0.8 }}>({p.duelPct}%)</small>
                      </span>
                    ) : (
                      <span style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>0/0 (—)</span>
                    )}
                  </td>
                  <td className="center">
                    {(p.recuperaciones > 0 || p.perdidas > 0) ? (
                      <span style={{ fontWeight: 700 }}>
                        <span style={{ color: '#3B82F6' }}>{p.recuperaciones}</span> / <span style={{ color: '#EF4444' }}>{p.perdidas}</span>
                      </span>
                    ) : (
                      <span style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>0 / 0</span>
                    )}
                  </td>
                  <td className="center">
                    {p.tiros > 0 ? (
                      <span style={{ fontWeight: 700 }}>
                        {p.tirosPuerta}/{p.tiros} <small style={{ opacity: 0.8 }}>({p.shotPct}%)</small>
                      </span>
                    ) : (
                      <span style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>0/0 (—)</span>
                    )}
                  </td>
                  <td className="center font-semibold" style={{ color: p.paradas > 0 ? (darkMode ? '#4ADE80' : '#059669') : 'inherit' }}>
                    {p.paradas > 0 ? `🧤 ${p.paradas}` : '—'}
                  </td>
                  <td className="center" style={{ fontWeight: p.faltas > 0 ? 800 : 400, color: p.faltas > 0 ? (darkMode ? '#FBBF24' : '#B45309') : 'inherit' }}>
                    {p.faltas}
                  </td>
                  <td className="center">
                    {(p.amarillas > 0 || p.rojas > 0) ? (
                      <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                        {p.amarillas > 0 && <span style={{ background: '#F59E0B25', color: '#F59E0B', border: '1px solid #F59E0B50', padding: '1px 5px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800 }}>{p.amarillas} 🟨</span>}
                        {p.rojas > 0 && <span style={{ background: '#EF444425', color: '#EF4444', border: '1px solid #EF444450', padding: '1px 5px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800 }}>{p.rojas} 🟥</span>}
                      </span>
                    ) : (
                      <span style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsDataTable;
