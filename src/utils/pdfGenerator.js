import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Configuración de colores corporativos
const THEME_COLOR = [27, 58, 45]; // #1B3A2D
const ACCENT_COLOR = [212, 168, 67]; // #D4A843
const TEXT_COLOR = [255, 255, 255]; // #FFFFFF

const addHeader = (doc, title, subtitle) => {
  doc.setFillColor(...THEME_COLOR);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(24);
  doc.text('MÍSTER11', 105, 20, { align: 'center' });
  
  doc.setTextColor(...ACCENT_COLOR);
  doc.setFontSize(14);
  doc.text(title, 105, 30, { align: 'center' });
  
  if (subtitle) {
    doc.setTextColor(200);
    doc.setFontSize(10);
    doc.text(subtitle, 105, 36, { align: 'center' });
  }
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} | Generado por Míster11`, 105, 285, { align: 'center' });
  }
};

/**
 * PLANIFICACIÓN - Macrociclo (Landscape, dark theme)
 */
export const generatePlanificacionPDF = (macroInfo, microcycles) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth(); // 297mm landscape

  // ── CABECERA ─────────────────────────────────────────────────────────────
  doc.setFillColor(27, 58, 45);
  doc.rect(0, 0, pageW, 36, 'F');

  doc.setTextColor(212, 168, 67);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('MÍSTER11', pageW / 2, 14, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(undefined, 'normal');
  doc.text('Planificación Estratégica', pageW / 2, 22, { align: 'center' });

  doc.setTextColor(204, 204, 204);
  doc.setFontSize(9);
  const subtitle = `${macroInfo.category || 'Equipo'} · Temporada ${macroInfo.startDate || ''} — ${macroInfo.endDate || ''}  ·  Entrenador: ${macroInfo.trainer || 'Míster'}`;
  doc.text(subtitle, pageW / 2, 30, { align: 'center' });

  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 10, 42);

  // ── TABLA MACROCICLO ───────────────────────────────────────────────────
  const head = [['Mes', 'Periodo', 'Etapa', 'Nº Meso', 'Nº Micro', 'Tipo Micro', 'Nº Ses.', 'Vol.(min)', '% Físico', '% Técnico', '% Táctico']];
  const body = microcycles.map(m => [
    m.month, m.period, m.etapa, m.mesoId, m.id,
    m.type, m.sessions, m.volume,
    `${m.physical}%`, `${m.technical}%`, `${m.tactical}%`,
  ]);

  doc.autoTable({
    startY: 46,
    head,
    body,
    headStyles: {
      fillColor: [27, 58, 45],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      textColor: [204, 204, 204],
      fontSize: 7.5,
      halign: 'center',
      fillColor: [27, 58, 45],
    },
    alternateRowStyles: {
      fillColor: [20, 46, 34],
    },
    styles: { cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 18 }, 1: { cellWidth: 30 }, 2: { cellWidth: 28 },
      3: { cellWidth: 18 }, 4: { cellWidth: 20 }, 5: { cellWidth: 28 },
      6: { cellWidth: 18 }, 7: { cellWidth: 20 },
      8: { cellWidth: 18 }, 9: { cellWidth: 20 }, 10: { cellWidth: 20 },
    },
    margin: { left: 10, right: 10 },
  });

  // ── OBJETIVOS ──────────────────────────────────────────────────────────────
  const finalY = (doc.lastAutoTable?.finalY || 46) + 10;
  if (finalY < doc.internal.pageSize.getHeight() - 30) {
    doc.setFillColor(27, 58, 45);
    doc.rect(10, finalY, pageW - 20, 7, 'F');
    doc.setTextColor(212, 168, 67);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Objetivos de la Temporada', 14, finalY + 5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8.5);
    const objLines = doc.splitTextToSize(macroInfo.objective || 'Sin objetivos definidos.', pageW - 24);
    doc.text(objLines, 14, finalY + 13);
  }

  // ── PIE DE PÁGINA ──────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}  |  Generado por Míster11 Tactical Engine`,
      pageW / 2, doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  const safeName = (macroInfo.category || 'Equipo').replace(/\s+/g, '_');
  const year = (macroInfo.startDate || '').split('-')[0] || new Date().getFullYear();
  doc.save(`Planificacion_${safeName}_${year}.pdf`);
};

/**
 * TESTS - Informe Colectivo
 */
export const generateTestsReport = (tests, players, historyData) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'INFORME DE RENDIMIENTO FÍSICO Y TÉCNICO', `Fecha: ${new Date().toLocaleDateString()}`);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Resultados Recientes por Jugador', 15, 50);

  // Preparar encabezados
  const head = ['Jugador', ...tests.map(t => `${t.name} (${t.unit})`)];
  
  // Extraer valores más recientes
  const recentData = players.map(p => {
    const rowData = { player: p.nombre };
    tests.forEach(t => {
      const pHistory = historyData[p.id]?.[t.id];
      if (pHistory && pHistory.length > 0) {
        // Asumimos que el último elemento es el más reciente (o el primero dependiendo de la implementación)
        // En nuestro mock el último index es el más reciente
        rowData[t.id] = pHistory[pHistory.length - 1].val;
      } else {
        rowData[t.id] = null;
      }
    });
    return rowData;
  });

  // Calcular min/max para cada test para aplicar colores
  const testStats = {};
  tests.forEach(t => {
    const vals = recentData.map(r => r[t.id]).filter(v => v !== null && v !== undefined);
    if (vals.length > 0) {
      testStats[t.id] = {
        min: Math.min(...vals),
        max: Math.max(...vals),
        lowerIsBetter: t.unit === 'seg'
      };
    }
  });

  const body = recentData.map(r => {
    return [
      r.player,
      ...tests.map(t => r[t.id] !== null && r[t.id] !== undefined ? r[t.id] : '-')
    ];
  });

  doc.autoTable({
    startY: 55,
    head: [head],
    body: body,
    headStyles: { fillColor: THEME_COLOR, textColor: TEXT_COLOR },
    styles: { fontSize: 8 },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index > 0) {
        const testIndex = data.column.index - 1;
        const test = tests[testIndex];
        const val = data.cell.raw;
        
        if (val !== '-' && testStats[test.id]) {
          const stats = testStats[test.id];
          if (stats.min !== stats.max) {
            // Check if it's the best or worst
            const isBest = stats.lowerIsBetter ? (val === stats.min) : (val === stats.max);
            const isWorst = stats.lowerIsBetter ? (val === stats.max) : (val === stats.min);
            
            if (isBest) {
              data.cell.styles.textColor = [76, 175, 125]; // Verde
              data.cell.styles.fontStyle = 'bold';
            } else if (isWorst) {
              data.cell.styles.textColor = [239, 68, 68]; // Rojo
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('* Verde: Mejor resultado en el equipo | Rojo: Resultado más bajo', 15, finalY + 10);

  addFooter(doc);
  doc.save(`Tests_Equipo_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
};

/**
 * SESIONES - Ficha individual
 */
export const generateSessionPDF = (session) => {
  const doc = new jsPDF();
  
  addHeader(doc, `FICHA DE ENTRENAMIENTO`, session.title || session.titulo);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Fecha: ${session.date || session.fecha || new Date().toLocaleDateString()}`, 15, 50);
  doc.text(`Hora: ${session.time || '18:00'}`, 80, 50);
  doc.text(`Duración: ${session.duration || session.duracion} min`, 140, 50);
  
  doc.text(`Intensidad: ${session.intensity || 'Media'}`, 15, 58);
  doc.text(`Tipo: ${session.category || 'Mixta'}`, 80, 58);

  doc.setFontSize(14);
  doc.setTextColor(...THEME_COLOR);
  doc.text('Bloques de la Sesión', 15, 75);
  doc.setTextColor(0);

  let currentY = 85;
  const blocks = session.blocks || session.bloques || [];
  
  if (blocks.length === 0) {
    doc.setFontSize(11);
    doc.text('No hay bloques definidos para esta sesión.', 15, currentY);
    currentY += 10;
  } else {
    blocks.forEach((b, i) => {
      // Check for page break
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${i+1}. ${b.name || b.titulo} (${b.duration || b.tiempo} min) [${b.type || '-'}]`, 15, currentY);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const descLines = doc.splitTextToSize(b.description || b.descripcion || 'Sin descripción', 180);
      doc.text(descLines, 15, currentY + 6);
      
      currentY += 8 + (descLines.length * 5) + 5;
    });
  }

  // Check for page break before notes
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(...THEME_COLOR);
  doc.text('Notas y Observaciones Post-Sesión', 15, currentY + 15);
  
  // Dibujar caja para notas
  doc.setDrawColor(200);
  doc.setFillColor(250);
  doc.rect(15, currentY + 20, 180, 50, 'FD');

  addFooter(doc);
  const safeTitle = (session.title || session.titulo || 'Sesion').replace(/[^a-z0-9]/gi, '_');
  doc.save(`Sesion_${safeTitle}_${session.date || session.fecha || 'Hoy'}.pdf`);
};

/**
 * INFORME DE TEMPORADA - Completo con estadísticas de jugadores
 */
export const generateSeasonReport = (team, players, matches) => {
  const doc = new jsPDF();
  const teamName = team?.nombre || 'Equipo';
  const season = team?.temporada || new Date().getFullYear();

  addHeader(doc, 'INFORME DE TEMPORADA', `${teamName} · Temporada ${season}`);

  doc.setTextColor(45, 45, 45);
  doc.setFontSize(11);
  doc.text(`Categoría: ${team?.categoria || '-'}`, 15, 50);
  doc.text(`Temporada: ${season}`, 110, 50);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 15, 57);
  doc.text(`Total jugadores: ${players.length}`, 110, 57);

  doc.setFontSize(13);
  doc.setTextColor(...THEME_COLOR);
  doc.setFont(undefined, 'bold');
  doc.text('Estadísticas de Plantilla', 15, 70);
  doc.setFont(undefined, 'normal');

  doc.autoTable({
    startY: 74,
    head: [['#', 'Jugador', 'Posición', 'Min.', 'PJ', 'Goles', 'Asist.', 'TA', 'TR', 'Estado']],
    body: players.map(p => [
      p.dorsal || '-',
      p.nombre || '-',
      p.posicion || '-',
      p.minutosTemporada || 0,
      p.partidosJugados || 0,
      p.goles || 0,
      p.asistencias || 0,
      p.tarjetasAmarillas || 0,
      p.tarjetasRojas || 0,
      p.lesionActiva ? 'LESIONADO' : 'Disponible',
    ]),
    headStyles: { fillColor: THEME_COLOR, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { textColor: [45,45,45], fontSize: 8, halign: 'center' },
    columnStyles: { 1: { halign: 'left' } },
    alternateRowStyles: { fillColor: [245, 240, 232] },
    styles: { cellPadding: 2.5, fillColor: [255,255,255] },
    margin: { left: 15, right: 15 },
  });

  if (matches && matches.length > 0) {
    const y1 = (doc.lastAutoTable?.finalY || 100) + 12;
    doc.setFontSize(13);
    doc.setTextColor(...THEME_COLOR);
    doc.setFont(undefined, 'bold');
    doc.text('Historial de Partidos', 15, y1);
    doc.setFont(undefined, 'normal');

    doc.autoTable({
      startY: y1 + 4,
      head: [['Fecha', 'Rival', 'Campo', 'Resultado']],
      body: matches.map(m => [
        m.fecha || '-',
        m.rival || '-',
        m.esLocal ? 'Local' : 'Visitante',
        m.resultado ? `${m.resultado.local ?? '-'} - ${m.resultado.visitante ?? '-'}` : 'Pendiente',
      ]),
      headStyles: { fillColor: THEME_COLOR, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: [45,45,45], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 240, 232] },
      styles: { fillColor: [255,255,255] },
      margin: { left: 15, right: 15 },
    });
  }

  addFooter(doc);
  doc.save(`Informe_Temporada_${teamName.replace(/\s+/g,'_')}.pdf`);
};

/**
 * HOJA DE CONVOCATORIA - Para un partido con lista de convocados
 */
export const generateMatchConvocation = (match, players) => {
  const doc = new jsPDF();
  addHeader(doc, 'HOJA DE CONVOCATORIA', `vs. ${match.rival}`);

  doc.setTextColor(45, 45, 45);
  doc.setFontSize(12);
  doc.text(`Rival: ${match.rival || '-'}`, 15, 50);
  doc.text(`Fecha: ${match.fecha || '-'}`, 80, 50);
  doc.text(`Hora: ${match.hora || '--:--'}`, 150, 50);
  doc.text(`Lugar: ${match.lugar || 'Por determinar'}`, 15, 58);
  if (match.formacion) doc.text(`Formación: ${match.formacion}`, 110, 58);

  const convocados = players.filter(p => match.convocados?.includes(p.id));

  doc.setFontSize(13);
  doc.setTextColor(...THEME_COLOR);
  doc.setFont(undefined, 'bold');
  doc.text(`Convocados (${convocados.length})`, 15, 70);
  doc.setFont(undefined, 'normal');

  doc.autoTable({
    startY: 74,
    head: [['#', 'Nombre del Jugador', 'Posición']],
    body: convocados.length > 0
      ? convocados.map((p, i) => [p.dorsal || i+1, p.nombre, p.posicion || '-'])
      : [['', 'No hay convocados registrados para este partido.', '']],
    headStyles: { fillColor: THEME_COLOR, textColor: [255,255,255], fontStyle: 'bold' },
    bodyStyles: { textColor: [45,45,45], fontSize: 10 },
    alternateRowStyles: { fillColor: [245,240,232] },
    styles: { fillColor: [255,255,255] },
    margin: { left: 15, right: 15 },
  });

  addFooter(doc);
  const safeRival = (match.rival || 'Partido').replace(/\s+/g,'_');
  doc.save(`Convocatoria_${safeRival}_${match.fecha || 'Hoy'}.pdf`);
};
