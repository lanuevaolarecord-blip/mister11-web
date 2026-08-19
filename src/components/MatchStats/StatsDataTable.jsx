import React, { useState, useMemo } from 'react';
import { Table, Search, ArrowUpDown, Download, Check } from 'lucide-react';

export const StatsDataTable = ({
  playerStats = [],
  teamName = 'Local'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('rating');
  const [sortAsc, setSortAsc] = useState(false);

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
      const pasesTot = (p.pasesExitosos || 0) + (p.pasesFallidos || 0);
      const passPct = pasesTot > 0 ? Math.round(((p.pasesExitosos || 0) / pasesTot) * 100) : 0;
      const xG = p.xG || ((p.tirosPuerta || 0) * 0.25 + (p.goles || 0) * 0.4).toFixed(2);
      
      // Cálculo de nota táctica 1-10
      const score = 6.0 + 
        (p.goles || 0) * 1.2 + 
        (p.asistencias || 0) * 0.8 + 
        (p.pasesClave || 0) * 0.3 + 
        (p.recuperaciones || 0) * 0.15 - 
        (p.faltas || 0) * 0.2;
      const rating = Math.min(10, Math.max(4.0, score)).toFixed(1);

      return {
        id: p.id || `p-${idx}`,
        dorsal: p.dorsal || p.number || (idx + 1),
        nombre: p.nombre || p.name || `Jugador #${idx + 1}`,
        posicion: p.posicion || p.position || 'MED',
        minutos: p.minutos || p.minutes || 90,
        goles: p.goles || 0,
        asistencias: p.asistencias || 0,
        tiros: p.tiros || 0,
        tirosPuerta: p.tirosPuerta || 0,
        pasesTot,
        pasesExitosos: p.pasesExitosos || 0,
        passPct,
        pasesClave: p.pasesClave || 0,
        recuperaciones: p.recuperaciones || 0,
        entradas: p.entradas || 0,
        faltas: p.faltas || 0,
        xG: Number(xG),
        rating: Number(rating)
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
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [processedData, searchTerm, sortField, sortAsc]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = ['Dorsal', 'Nombre', 'Posición', 'Min', 'Goles', 'Asist', 'Tiros', 'Pases', 'Precisión %', 'Pases Clave', 'Recuperaciones', 'xG', 'Nota'];
    const rows = sortedAndFiltered.map(p => [
      p.dorsal,
      `"${p.nombre}"`,
      p.posicion,
      p.minutos,
      p.goles,
      p.asistencias,
      p.tiros,
      `${p.pasesExitosos}/${p.pasesTot}`,
      `${p.passPct}%`,
      p.pasesClave,
      p.recuperaciones,
      p.xG,
      p.rating
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estadisticas_jugadores_${teamName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="stats-table-container">
      {/* Barra superior de la tabla */}
      <div className="table-controls-bar">
        <div className="table-title">
          <Table size={18} />
          <h3>Rendimiento Individual de Jugadores ({teamName})</h3>
        </div>

        <div className="table-actions-right">
          <div className="table-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button type="button" onClick={handleExportCSV} className="export-csv-btn" title="Descargar CSV para Excel">
            <Download size={14} />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabla con scroll horizontal responsivo */}
      <div className="table-responsive-wrapper">
        <table className="pro-stats-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('dorsal')} className="sortable center">#</th>
              <th onClick={() => handleSort('nombre')} className="sortable left">Jugador</th>
              <th onClick={() => handleSort('posicion')} className="sortable center">Pos</th>
              <th onClick={() => handleSort('rating')} className="sortable center highlight-col">Nota <ArrowUpDown size={12} /></th>
              <th onClick={() => handleSort('goles')} className="sortable center">GOL</th>
              <th onClick={() => handleSort('asistencias')} className="sortable center">AST</th>
              <th onClick={() => handleSort('xG')} className="sortable center">xG</th>
              <th onClick={() => handleSort('tiros')} className="sortable center">Tiros</th>
              <th onClick={() => handleSort('pasesExitosos')} className="sortable center">Pases (Acierto)</th>
              <th onClick={() => handleSort('pasesClave')} className="sortable center">Pases Clave</th>
              <th onClick={() => handleSort('recuperaciones')} className="sortable center">Recup.</th>
              <th onClick={() => handleSort('faltas')} className="sortable center">Faltas</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.length === 0 ? (
              <tr>
                <td colSpan={12} className="no-data-cell">No se encontraron estadísticas para los filtros aplicados.</td>
              </tr>
            ) : (
              sortedAndFiltered.map(p => (
                <tr key={p.id}>
                  <td className="center bold-dorsal">#{p.dorsal}</td>
                  <td className="left player-name-cell">
                    <strong>{p.nombre}</strong>
                  </td>
                  <td className="center"><span className="pos-badge">{p.posicion}</span></td>
                  <td className="center">
                    <span className={`rating-pill ${p.rating >= 8 ? 'high' : p.rating >= 6.5 ? 'mid' : 'low'}`}>
                      {p.rating}
                    </span>
                  </td>
                  <td className="center font-semibold">{p.goles > 0 ? `⚽ ${p.goles}` : '—'}</td>
                  <td className="center">{p.asistencias > 0 ? `👟 ${p.asistencias}` : '—'}</td>
                  <td className="center text-gold">{p.xG > 0 ? p.xG : '0.00'}</td>
                  <td className="center">{p.tirosPuerta}/{p.tiros}</td>
                  <td className="center">
                    <span className="pass-stat-box">
                      {p.pasesExitosos}/{p.pasesTot} ({p.passPct}%)
                    </span>
                  </td>
                  <td className="center">{p.pasesClave > 0 ? p.pasesClave : '—'}</td>
                  <td className="center">{p.recuperaciones}</td>
                  <td className="center">{p.faltas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
