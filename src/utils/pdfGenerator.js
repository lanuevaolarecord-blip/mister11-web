import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadPDF } from './download.js';

// Configuración de colores corporativos
const THEME_COLOR = [27, 58, 45]; // #1B3A2D
const ACCENT_COLOR = [212, 168, 67]; // #D4A843
const TEXT_COLOR = [255, 255, 255]; // #FFFFFF

/**
 * savePdfUniversal – guarda el PDF correctamente en Web Y en APK Android.
 * En Android (Capacitor) usa Filesystem → carpeta Descargas.
 * En web usa el método clásico blob + <a download>.
 */
export const savePdfUniversal = async (doc, filename) => {
  try {
    const pdfBase64 = doc.output('dataurlstring').split(',')[1];
    await downloadPDF(pdfBase64, filename);
  } catch (error) {
    console.error('Error al guardar PDF:', error);
    alert('Error al guardar el PDF. Revisa tu espacio y permisos.');
  }
};

const getImageBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) {
    return url;
  }
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error al obtener base64 de la imagen:", url, e);
    return null;
  }
};

const addHeader = async (doc, title, subtitle, activeTeam = null) => {
  const pageW = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(...THEME_COLOR);
  doc.rect(0, 0, pageW, 40, 'F');
  
  // Logotipo oficial de Míster11 a la izquierda
  const mr11LogoData = await getImageBase64('/logo_mister11.png');
  if (mr11LogoData) {
    doc.addImage(mr11LogoData, 'PNG', 15, 5, 18, 18);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('MÍSTER11', 37, 16);
  } else {
    doc.setTextColor(...TEXT_COLOR);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('MÍSTER11', 15, 18);
  }
  
  // Escudo del equipo a la derecha
  if (activeTeam) {
    const shieldX = pageW - 33;
    const textX = pageW - 24;
    
    if (activeTeam.escudo) {
      const logoData = await getImageBase64(activeTeam.escudo);
      if (logoData) {
        doc.addImage(logoData, 'PNG', shieldX, 5, 18, 18);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.circle(textX, 14, 9, 'F');
        doc.setTextColor(...THEME_COLOR);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text((activeTeam.nombre || 'E').charAt(0), textX - 2, 18);
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.circle(textX, 14, 9, 'F');
      doc.setTextColor(...THEME_COLOR);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text((activeTeam.nombre || 'E').charAt(0), textX - 2, 18);
    }
    
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'normal');
    doc.text(activeTeam.nombre || '', textX, 33, { align: 'center' });
  }

  // Título y subtítulo centrados
  doc.setTextColor(...ACCENT_COLOR);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(title, pageW / 2, 26, { align: 'center' });
  
  if (subtitle) {
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    doc.text(subtitle, pageW / 2, 32, { align: 'center' });
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
export const generatePlanificacionPDF = async (macroInfo, microcycles, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth(); // 297mm landscape

  // ── CABECERA ─────────────────────────────────────────────────────────────
  doc.setFillColor(27, 58, 45);
  doc.rect(0, 0, pageW, 36, 'F');

  // Logotipo oficial de Míster11 a la izquierda
  const mr11LogoData = await getImageBase64('/logo_mister11.png');
  if (mr11LogoData) {
    doc.addImage(mr11LogoData, 'PNG', 15, 4, 16, 16);
    doc.setTextColor(212, 168, 67);
    doc.setFontSize(15);
    doc.setFont(undefined, 'bold');
    doc.text('MÍSTER11', 35, 14);
  } else {
    doc.setTextColor(212, 168, 67);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('MÍSTER11', 15, 14);
  }

  // Escudo del equipo a la derecha
  if (activeTeam) {
    const shieldX = pageW - 31;
    const textX = pageW - 23;
    
    if (activeTeam.escudo) {
      const logoData = await getImageBase64(activeTeam.escudo);
      if (logoData) {
        doc.addImage(logoData, 'PNG', shieldX, 4, 16, 16);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.circle(textX, 12, 8, 'F');
        doc.setTextColor(27, 58, 45);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text((activeTeam.nombre || 'E').charAt(0), textX - 2, 16);
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.circle(textX, 12, 8, 'F');
      doc.setTextColor(27, 58, 45);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text((activeTeam.nombre || 'E').charAt(0), textX - 2, 16);
    }
    
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'normal');
    doc.text(activeTeam.nombre || '', textX, 29, { align: 'center' });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(undefined, 'normal');
  doc.text('Planificación Estratégica', pageW / 2, 18, { align: 'center' });

  doc.setTextColor(204, 204, 204);
  doc.setFontSize(9);
  const subtitle = `${macroInfo.category || 'Equipo'} · Temporada ${macroInfo.startDate || ''} — ${macroInfo.endDate || ''}  ·  Entrenador: ${macroInfo.trainer || 'Míster'}`;
  doc.text(subtitle, pageW / 2, 26, { align: 'center' });

  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 10, 42);

  // ── OBJETIVOS ──────────────────────────────────────────────────────────────
  let currentY = 46;
  if (macroInfo.objective) {
    doc.setFillColor(27, 58, 45);
    doc.rect(10, 40, pageW - 20, 7, 'F');
    doc.setTextColor(212, 168, 67);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Objetivos de la Temporada', 14, 45);
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8.5);
    const objLines = doc.splitTextToSize(macroInfo.objective, pageW - 24);
    doc.text(objLines, 14, 53);
    
    currentY = 53 + (objLines.length * 4) + 6;
  }

  // ── TABLA MACROCICLO ───────────────────────────────────────────────────
  const head = [['Mes', 'Periodo', 'Etapa', 'Nº Meso', 'Nº Micro', 'Tipo Micro', 'Nº Ses.', 'Vol.(min)', '% Físico', '% Técnico', '% Táctico']];
  const body = microcycles.map(m => [
    m.month, m.period, m.etapa, m.mesoId, m.id,
    m.type, m.sessions, m.volume,
    `${m.physical}%`, `${m.technical}%`, `${m.tactical}%`,
  ]);

  const macroTable = autoTable(doc, {
    startY: currentY,
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
  savePdfUniversal(doc, `Planificacion_${safeName}_${year}.pdf`);
};

/**
 * TESTS - Informe Colectivo
 */
export const generateTestsReport = async (tests, players, historyData, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();

  await addHeader(doc, 'INFORME DE RENDIMIENTO GLOBAL', `Fecha: ${new Date().toLocaleDateString()}`, activeTeam);

  // ── BANDA KPI ──────────────────────────────────────────────────────────────
  const totalPlayers = players.length;
  const totalTests   = tests.length;
  const evaluated    = players.filter(p => tests.some(t => historyData[p.id]?.[t.id]?.length > 0)).length;
  const today        = new Date().toLocaleDateString();

  doc.setFillColor(20, 46, 34);
  doc.rect(0, 40, pageW, 16, 'F');

  const kpis = [
    { label: 'Jugadores',  value: totalPlayers },
    { label: 'Evaluados',  value: evaluated },
    { label: 'Pruebas',    value: totalTests },
    { label: 'Fecha',      value: today },
  ];
  kpis.forEach((k, i) => {
    const x = 15 + i * (pageW / 4);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...ACCENT_COLOR);
    doc.text(String(k.value), x, 50);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(180, 200, 180);
    doc.text(k.label.toUpperCase(), x, 54);
  });

  let finalY = 62;

  const renderCategoryTable = (groupTests, groupName, headFill, headText) => {
    if (groupTests.length === 0) return;

    if (finalY > doc.internal.pageSize.getHeight() - 40 && finalY !== 62) {
      doc.addPage();
      finalY = 20;
    } else if (finalY !== 62) {
      // Separador dorado entre categorías
      doc.setDrawColor(...ACCENT_COLOR);
      doc.setLineWidth(0.4);
      doc.line(10, finalY + 6, pageW - 10, finalY + 6);
      finalY += 14;
    }

    // Etiqueta de sección
    doc.setFillColor(...headFill);
    doc.rect(10, finalY - 5, pageW - 20, 8, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...headText);
    doc.setFont(undefined, 'bold');
    doc.text(groupName.toUpperCase(), 14, finalY + 1);
    finalY += 8;

    const head = ['Jugador', ...groupTests.map(t => `${t.name}\n(${t.unit})`)];

    const recentData = players.map(p => {
      const rowData = { player: p.name || p.nombre || '-' };
      groupTests.forEach(t => {
        const pHistory = historyData[p.id]?.[t.id];
        rowData[t.id] = pHistory?.length > 0 ? pHistory[pHistory.length - 1].val : null;
      });
      return rowData;
    });

    const testStats = {};
    groupTests.forEach(t => {
      const vals = recentData.map(r => r[t.id]).filter(v => v !== null && v !== undefined);
      if (vals.length > 0) {
        testStats[t.id] = { min: Math.min(...vals), max: Math.max(...vals), lowerIsBetter: t.unit === 'seg' };
      }
    });

    const body = recentData.map(r => [
      r.player,
      ...groupTests.map(t => r[t.id] !== null && r[t.id] !== undefined ? r[t.id] : '-')
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [head],
      body,
      headStyles: {
        fillColor: headFill,
        textColor: headText,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        cellPadding: 3,
      },
      bodyStyles: {
        fillColor: [27, 58, 45],
        textColor: [200, 220, 210],
        fontSize: 8,
        halign: 'center',
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [20, 46, 34],
      },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', textColor: [212, 168, 67] } },
      margin: { left: 10, right: 10 },
      styles: { lineColor: [40, 70, 55], lineWidth: 0.2 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index > 0) {
          const test = groupTests[data.column.index - 1];
          const val  = data.cell.raw;
          if (val !== '-' && testStats[test?.id]) {
            const s = testStats[test.id];
            if (s.min !== s.max) {
              const isBest  = s.lowerIsBetter ? (val === s.min) : (val === s.max);
              const isWorst = s.lowerIsBetter ? (val === s.max) : (val === s.min);
              if (isBest)  { data.cell.styles.textColor = [76, 175, 125]; data.cell.styles.fontStyle = 'bold'; }
              if (isWorst) { data.cell.styles.textColor = [239, 68, 68];  data.cell.styles.fontStyle = 'bold'; }
            }
          }
        }
      },
    });
    finalY = doc.lastAutoTable.finalY;
  };

  const physicalTests = tests.filter(t => t.type === 'fisico' || !t.type);
  const psychoTests   = tests.filter(t => t.type === 'psicosocial');
  const socioTests    = tests.filter(t => t.type === 'socioemocional');

  renderCategoryTable(physicalTests, 'Pruebas Físicas y Técnicas',   THEME_COLOR,  ACCENT_COLOR);
  renderCategoryTable(psychoTests,   'Pruebas Psicosociales',        ACCENT_COLOR, THEME_COLOR);
  renderCategoryTable(socioTests,    'Pruebas Socioemocionales',     ACCENT_COLOR, THEME_COLOR);

  // Leyenda
  const legendY = Math.min(finalY + 10, doc.internal.pageSize.getHeight() - 16);
  doc.setFontSize(8);
  doc.setFont(undefined, 'italic');
  doc.setTextColor(76, 175, 125);
  doc.text('■ ', 10, legendY);
  doc.setTextColor(120);
  doc.text('Mejor del equipo    ', 15, legendY);
  doc.setTextColor(239, 68, 68);
  doc.text('■ ', 55, legendY);
  doc.setTextColor(120);
  doc.text('Resultado más bajo', 60, legendY);

  addFooter(doc);
  savePdfUniversal(doc, `Tests_Equipo_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
};

/**
 * TESTS - Informe Individual (Para el jugador o padre)
 */
export const generatePlayerTestReport = async (player, tests, historyData, activeTeam = null, graficaDataUrl = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  await addHeader(doc, 'INFORME DE RENDIMIENTO INDIVIDUAL', `Fecha: ${new Date().toLocaleDateString()}`, activeTeam);

  // ── TARJETA DE JUGADOR ────────────────────────────────────────────────────
  doc.setFillColor(...THEME_COLOR);
  doc.rect(10, 44, pageW - 20, 22, 'F');

  // Avatar circular placeholder
  doc.setFillColor(...ACCENT_COLOR);
  doc.circle(24, 55, 8, 'F');
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...THEME_COLOR);
  const initials = (player.name || player.nombre || 'J').charAt(0).toUpperCase();
  doc.text(initials, 21.5, 58);

  // Nombre del jugador
  doc.setTextColor(...ACCENT_COLOR);
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text(player.name || player.nombre || 'Jugador', 36, 51);

  // Dorsal | Posición
  doc.setTextColor(180, 220, 200);
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.text(`Dorsal: ${player.number || player.dorsal || '-'}   |   Posición: ${player.position || player.posicion || '-'}`, 36, 58);

  // Overall a la derecha
  const allVals = tests.map(t => historyData[player.id]?.[t.id]).filter(h => h?.length > 0).map(h => h[h.length - 1].val);
  const overallAvg = allVals.length > 0 ? Math.round(allVals.reduce((a, b) => a + b, 0) / allVals.length) : null;
  if (overallAvg !== null) {
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...ACCENT_COLOR);
    doc.text(String(overallAvg), pageW - 24, 54, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(180, 220, 200);
    doc.text('MEDIA', pageW - 24, 61, { align: 'center' });
  }

  // ── TEXTO INTRODUCTORIO ───────────────────────────────────────────────────
  doc.setFillColor(250, 248, 240);
  doc.rect(10, 68, pageW - 20, 14, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'italic');
  const introText = 'Estimado padre/tutor: Este informe resume los resultados de las pruebas físicas y técnicas realizadas por el jugador. Ayuda a entender sus fortalezas y áreas de mejora.';
  doc.text(doc.splitTextToSize(introText, pageW - 28), 14, 74);

  const generateRows = (testsGroup, isPhysical) => {
    const rows = [];
    testsGroup.forEach(t => {
      const pHistory = historyData[player.id]?.[t.id];
      let latestVal = '-', prevVal = '-', evolution = '-';
      if (pHistory?.length > 0) {
        latestVal = pHistory[pHistory.length - 1].val;
        if (pHistory.length > 1) {
          prevVal = pHistory[pHistory.length - 2].val;
          const diff = latestVal - prevVal;
          const improved = t.unit === 'seg' ? diff < 0 : diff > 0;
          evolution = diff === 0 ? 'Mantenido' : (improved ? '(+) Mejora' : '(-) Baja');
        }
      }
      if (isPhysical) {
        let valoracion = latestVal !== '-' ? (evolution.includes('Mejora') ? 'Excelente' : (evolution.includes('Baja') ? 'Mejorable' : 'Bien')) : '-';
        rows.push([t.name, `${latestVal} ${latestVal !== '-' ? t.unit : ''}`, `${prevVal !== '-' ? prevVal + ' ' + t.unit : '-'}`, evolution, valoracion]);
      } else {
        rows.push([t.name, `${latestVal} ${latestVal !== '-' ? t.unit : ''}`, t.interpretacion || t.desc || 'Análisis pendiente']);
      }
    });
    return rows;
  };

  const physicalRows = generateRows(tests.filter(t => t.type === 'fisico' || !t.type), true);
  const psychoRows   = generateRows(tests.filter(t => t.type === 'psicosocial'), false);
  const socioRows    = generateRows(tests.filter(t => t.type === 'socioemocional'), false);

  // ── TABLA FÍSICA ─────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 85,
    head: [['Prueba Física / Técnica', 'Resultado Actual', 'Eval. Anterior', 'Evolución', 'Valoración']],
    body: physicalRows,
    headStyles: { fillColor: THEME_COLOR, textColor: ACCENT_COLOR, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fillColor: [27, 58, 45], textColor: [200, 220, 210], fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [20, 46, 34] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: ACCENT_COLOR, halign: 'left' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
    },
    styles: { lineColor: [40, 70, 55], lineWidth: 0.2 },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const v = String(data.cell.raw);
        if (v.includes('Mejora'))   data.cell.styles.textColor = [76, 175, 125];
        else if (v.includes('Baja')) data.cell.styles.textColor = [239, 68, 68];
        else                         data.cell.styles.textColor = [200, 200, 200];
      }
      if (data.section === 'body' && data.column.index === 4) {
        const v = String(data.cell.raw);
        if (v.includes('Excelente')) data.cell.styles.textColor = [76, 175, 125];
        else if (v.includes('Mejorable')) data.cell.styles.textColor = [239, 68, 68];
        else data.cell.styles.textColor = [212, 168, 67];
      }
    },
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  // ── TABLA PSICOSOCIAL ─────────────────────────────────────────────────────
  if (psychoRows.length > 0) {
    if (finalY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); finalY = 20; }
    autoTable(doc, {
      startY: finalY,
      head: [['Perfil Psicosocial', 'Puntuación', 'Interpretación']],
      body: psychoRows,
      headStyles: { fillColor: ACCENT_COLOR, textColor: THEME_COLOR, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fillColor: [27, 58, 45], textColor: [200, 220, 210], fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [20, 46, 34] },
      columnStyles: { 0: { fontStyle: 'bold', textColor: ACCENT_COLOR } },
      styles: { lineColor: [40, 70, 55], lineWidth: 0.2 },
    });
    finalY = doc.lastAutoTable.finalY + 10;
  }

  // ── TABLA SOCIOEMOCIONAL ──────────────────────────────────────────────────
  if (socioRows.length > 0) {
    if (finalY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); finalY = 20; }
    autoTable(doc, {
      startY: finalY,
      head: [['Bienestar en el Equipo', 'Puntuación', 'Interpretación']],
      body: socioRows,
      headStyles: { fillColor: ACCENT_COLOR, textColor: THEME_COLOR, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fillColor: [27, 58, 45], textColor: [200, 220, 210], fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [20, 46, 34] },
      columnStyles: { 0: { fontStyle: 'bold', textColor: ACCENT_COLOR } },
      styles: { lineColor: [40, 70, 55], lineWidth: 0.2 },
    });
    finalY = doc.lastAutoTable.finalY + 15;
  }

  // ── GRÁFICA DE RENDIMIENTO ────────────────────────────────────────────────
  if (graficaDataUrl) {
    if (finalY + 90 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); finalY = 20; }
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...THEME_COLOR);
    doc.text('Perfil de Rendimiento Actual', 15, finalY);
    doc.setDrawColor(...ACCENT_COLOR);
    doc.setLineWidth(0.6);
    doc.line(15, finalY + 1, 15 + doc.getTextWidth('Perfil de Rendimiento Actual'), finalY + 1);
    doc.addImage(graficaDataUrl, 'PNG', 15, finalY + 5, pageW - 30, 80);
    finalY += 95;
  }

  // ── BLOQUE DE RECOMENDACIÓN ───────────────────────────────────────────────
  if (finalY + 30 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); finalY = 20; }

  doc.setFillColor(250, 248, 240);
  doc.rect(10, finalY, pageW - 20, 28, 'F');
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(10, finalY, 3, 28, 'F');

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...THEME_COLOR);
  doc.text('Recomendación del Cuerpo Técnico', 17, finalY + 8);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const adviceText = 'Sigue entrenando con constancia y compromiso. Es fundamental mantener una buena alimentación y descanso para continuar con la progresión atlética mostrada en las últimas evaluaciones.';
  doc.text(doc.splitTextToSize(adviceText, pageW - 30), 17, finalY + 16);

  addFooter(doc);
  const safeName = (player.name || player.nombre || 'Jugador').replace(/\s+/g, '_');
  savePdfUniversal(doc, `Informe_Tests_${safeName}.pdf`);
};


/**
 * SESIONES - Ficha individual
 */
export const generateSessionPDF = async (session, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
  const doc = new jsPDF();
  
  await addHeader(doc, `FICHA DE ENTRENAMIENTO`, session.nombre || session.title || session.titulo || 'Sesión sin nombre', activeTeam);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Fecha: ${session.fechaCreacion || session.date || session.fecha || new Date().toLocaleDateString()}`, 15, 50);
  doc.text(`Hora: ${session.time || '18:00'}`, 80, 50);
  doc.text(`Duración: ${session.duration || session.duracion || '90'} min`, 140, 50);
  
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
    for (const b of blocks) {
      // Check for page break
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${blocks.indexOf(b)+1}. ${b.name || b.titulo} (${b.duration || b.tiempo} min) [${b.type || '-'}]`, 15, currentY);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const descLines = doc.splitTextToSize(b.description || b.descripcion || 'Sin descripción', 180);
      doc.text(descLines, 15, currentY + 6);
      
      currentY += 8 + (descLines.length * 5) + 5;

      if (b.imagenProtocolo) {
        if (currentY > 220) {
          doc.addPage();
          currentY = 20;
        }
        try {
          const imgBase64 = await getImageBase64(b.imagenProtocolo);
          if (imgBase64) {
            // Draw image with max width 180, height auto (approx 100 for aspect ratio)
            doc.addImage(imgBase64, 'PNG', 15, currentY, 180, 100);
            currentY += 110;
          }
        } catch (e) {
          console.warn('Could not load block image for PDF', e);
        }
      }
    }
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
  savePdfUniversal(doc, `Sesion_${safeTitle}_${session.date || session.fecha || 'Hoy'}.pdf`);
};

/**
 * INFORME DE TEMPORADA - Completo con estadísticas de jugadores
 */
export const generateSeasonReport = async (team, players, matches) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
  const doc = new jsPDF();
  const teamName = team?.nombre || 'Equipo';
  const season = team?.temporada || new Date().getFullYear();

  await addHeader(doc, 'INFORME DE TEMPORADA', `${teamName} · Temporada ${season}`, team);

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

  const seasonTable = autoTable(doc, {
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
    const y1 = (seasonTable?.finalY || 100) + 12;
    doc.setFontSize(13);
    doc.setTextColor(...THEME_COLOR);
    doc.setFont(undefined, 'bold');
    doc.text('Historial de Partidos', 15, y1);
    doc.setFont(undefined, 'normal');

    autoTable(doc, {
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
  savePdfUniversal(doc, `Informe_Temporada_${teamName.replace(/\s+/g,'_')}.pdf`);
};

/**
 * HOJA DE CONVOCATORIA - Para un partido con lista de convocados
 */
export const generateMatchConvocation = async (match, players, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
  const doc = new jsPDF();
  const matchName = match.rival ? `Partido vs ${match.rival}` : (match.nombre || match.title || 'Partido Oficial');
  await addHeader(doc, 'HOJA DE CONVOCATORIA', matchName, activeTeam);

  doc.setTextColor(45, 45, 45);
  doc.setFontSize(12);
  const tituloPartido = (match.nombre || match.title || 'Partido Oficial');
  doc.text(`Partido: ${tituloPartido.length > 25 ? tituloPartido.substring(0, 25) + '...' : tituloPartido}`, 15, 50);
  const rivalText = match.rival || '-';
  doc.text(`Rival: ${rivalText.length > 20 ? rivalText.substring(0, 20) + '...' : rivalText}`, 95, 50);
  doc.text(`Fecha: ${match.date || match.fecha || '-'}`, 155, 50);
  doc.text(`Hora: ${match.time || match.hora || '--:--'}`, 15, 58);
  doc.text(`Lugar: ${match.location || match.lugar || 'Por determinar'}`, 95, 58);
  if (match.lineup || match.formacion) doc.text(`Formación: ${match.lineup || match.formacion}`, 155, 58);

  const convocados = players.filter(p => match.convocados?.includes(p.id));

  doc.setFontSize(13);
  doc.setTextColor(...THEME_COLOR);
  doc.setFont(undefined, 'bold');
  doc.text(`Convocados (${convocados.length})`, 15, 70);
  doc.setFont(undefined, 'normal');

  autoTable(doc, {
    startY: 74,
    head: [['#', 'Nombre del Jugador', 'Posición']],
    body: convocados.length > 0
      ? convocados.map((p, i) => [p.number || p.dorsal || i+1, p.name || p.nombre || '-', p.position || p.posicion || '-'])
      : [['', 'No hay convocados registrados para este partido.', '']],
    headStyles: { fillColor: THEME_COLOR, textColor: [255,255,255], fontStyle: 'bold' },
    bodyStyles: { textColor: [45,45,45], fontSize: 10 },
    alternateRowStyles: { fillColor: [245,240,232] },
    styles: { fillColor: [255,255,255] },
    margin: { left: 15, right: 15 },
  });

  addFooter(doc);
  const safeRival = (match.rival || 'Partido').replace(/\s+/g,'_');
  savePdfUniversal(doc, `Convocatoria_${safeRival}_${match.date || match.fecha || 'Hoy'}.pdf`);
};

/**
 * EXPEDIENTE - Jugador individual
 */
export const generateExpediente = async (player, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
  const doc = new jsPDF();
  await addHeader(doc, 'EXPEDIENTE DEPORTIVO', `${player.name || player.nombre}`, activeTeam);

  doc.setTextColor(45, 45, 45);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Datos Personales', 15, 50);
  
  doc.setFont(undefined, 'normal');
  doc.text(`Dorsal: ${player.number || player.dorsal || '-'}`, 15, 60);
  doc.text(`Posición: ${player.position || player.posicion || '-'}`, 80, 60);
  doc.text(`Categoría: ${activeTeam?.categoria || player.category || '-'}`, 140, 60);
  
  doc.text(`Pierna: ${player.foot || '-'}`, 15, 68);
  doc.text(`Altura: ${player.height ? player.height + ' cm' : '-'}`, 80, 68);
  doc.text(`Peso: ${player.weight ? player.weight + ' kg' : '-'}`, 140, 68);
  
  // Estado médico
  doc.setFont(undefined, 'bold');
  doc.text('Estado Médico Actual:', 15, 85);
  doc.setFont(undefined, 'normal');
  if (player.injuries) {
    doc.setTextColor(200, 0, 0);
    doc.text(`LESIONADO - ${player.injuryType || 'No especificado'}`, 65, 85);
  } else {
    doc.setTextColor(0, 150, 0);
    doc.text('APTO', 65, 85);
  }

  doc.setTextColor(45, 45, 45);
  doc.setFont(undefined, 'bold');
  doc.text('Resumen de Rendimiento', 15, 105);
  doc.setFont(undefined, 'normal');
  
  autoTable(doc, {
    startY: 110,
    head: [['Partidos', 'Minutos', 'Goles', 'Asistencias', 'Tarjetas']],
    body: [[
      player.partidosJugados || 0,
      player.minutosTemporada || 0,
      player.goles || 0,
      player.asistencias || 0,
      (player.tarjetasAmarillas || 0) + 'A / ' + (player.tarjetasRojas || 0) + 'R'
    ]],
    headStyles: { fillColor: THEME_COLOR, textColor: [255,255,255], fontStyle: 'bold' },
    bodyStyles: { textColor: [45,45,45] },
  });

  addFooter(doc);
  const safeName = (player.name || player.nombre || 'Jugador').replace(/\s+/g,'_');
  savePdfUniversal(doc, `Expediente_${safeName}.pdf`);
};
