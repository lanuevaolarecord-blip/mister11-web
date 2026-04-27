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
 * PLANIFICACIÓN - Macrociclo
 */
export const generatePlanificacionPDF = (macroInfo, microcycles) => {
  const doc = new jsPDF();
  
  addHeader(doc, `PLANIFICACIÓN ESTRATÉGICA`, `${macroInfo.category || 'Equipo'} | Temporada: ${macroInfo.startDate} a ${macroInfo.endDate}`);

  // General Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Entrenador: ${macroInfo.trainer || 'Míster'}`, 15, 50);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 15, 57);

  // Table Data
  doc.setFontSize(14);
  doc.text('Detalle del Macrociclo', 15, 70);

  const tableBody = microcycles.map(m => [
    m.month,
    m.period,
    m.etapa,
    m.mesoId,
    m.id,
    m.type,
    m.sessions,
    m.volume,
    `${m.physical}%`,
    `${m.technical}%`,
    `${m.tactical}%`
  ]);

  doc.autoTable({
    startY: 75,
    head: [['Mes', 'Periodo', 'Etapa', 'Meso', 'Micro', 'Tipo', 'Ses', 'Vol(m)', 'Fis%', 'Tec%', 'Tac%']],
    body: tableBody,
    headStyles: { fillColor: THEME_COLOR, textColor: TEXT_COLOR },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  // Objetivos
  const finalY = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(14);
  doc.text('Objetivos de la Temporada', 15, finalY + 15);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(macroInfo.objective || 'Sin objetivos definidos', 180), 15, finalY + 22);

  addFooter(doc);
  doc.save(`Planificacion_${macroInfo.category || 'Equipo'}_${macroInfo.startDate.split('-')[0]}.pdf`);
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
 * Genera un informe de temporada completo en PDF
 */
export const generateSeasonReport = (team, players, matches, sessions) => {
  const doc = new jsPDF();
  addHeader(doc, 'INFORME DE TEMPORADA', team.nombre);

  // --- INFO GENERAL ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Categoría: ${team.categoria}`, 15, 50);
  doc.text(`Temporada: ${team.temporada}`, 15, 57);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 15, 64);

  // --- PLANTILLA TABLE ---
  doc.setFontSize(16);
  doc.text('Plantilla y Estadísticas', 15, 80);
  
  const playerRows = players.map(p => [
    p.dorsal || '-',
    p.nombre,
    p.posicion || '-',
    p.minutosTemporada || 0,
    p.lesionActiva ? 'LESIONADO' : 'OK'
  ]);

  doc.autoTable({
    startY: 85,
    head: [['#', 'Jugador', 'Posición', 'Minutos', 'Estado']],
    body: playerRows,
    headStyles: { fillColor: THEME_COLOR },
  });

  // --- PARTIDOS TABLE ---
  const finalY = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(16);
  doc.text('Últimos Partidos', 15, finalY + 15);

  const matchRows = matches.map(m => [
    m.fecha,
    m.rival,
    m.esLocal ? 'Local' : 'Visitante',
    m.resultado ? `${m.resultado.local}-${m.resultado.visitante}` : 'Pendiente'
  ]);

  doc.autoTable({
    startY: finalY + 20,
    head: [['Fecha', 'Rival', 'Campo', 'Resultado']],
    body: matchRows,
    headStyles: { fillColor: THEME_COLOR },
  });

  addFooter(doc);
  doc.save(`Informe_${team.nombre}_${team.temporada}.pdf`);
};

/**
 * Genera la hoja de convocatoria para un partido
 */
export const generateMatchConvocation = (match, players) => {
  const doc = new jsPDF();
  addHeader(doc, 'HOJA DE CONVOCATORIA', `Rival: ${match.rival}`);

  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text(`Fecha: ${match.fecha} | Hora: ${match.hora || '--:--'}`, 15, 55);
  doc.text(`Lugar: ${match.lugar || 'Por determinar'}`, 15, 62);

  const convocados = players.filter(p => match.convocados?.includes(p.id)) || [];
  
  doc.autoTable({
    startY: 75,
    head: [['#', 'Nombre del Jugador', 'Posición']],
    body: convocados.map(p => [p.dorsal || '-', p.nombre, p.posicion || '-']),
    headStyles: { fillColor: THEME_COLOR },
  });

  addFooter(doc);
  doc.save(`Convocatoria_${match.rival}_${match.fecha}.pdf`);
};
