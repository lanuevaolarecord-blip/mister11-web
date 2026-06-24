import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadPDF } from './download.js';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

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
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const generatedDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Línea separadora dorada
    doc.setFillColor(...ACCENT_COLOR);
    doc.rect(0, pageH - 12, pageW, 0.5, 'F');
    // Texto del pie — marca izquierda
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...THEME_COLOR);
    doc.text('MISTER11', 15, pageH - 6);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(' · El banquillo en tu bolsillo · Generado: ' + generatedDate, 31, pageH - 6);
    // Número de página — derecha
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...THEME_COLOR);
    doc.text(`${i} / ${pageCount}`, pageW - 15, pageH - 6, { align: 'right' });
  }
};



/**
 * PLANIFICACIÓN - Macrociclo (Landscape, dark theme)
 */
export const generatePlanificacionPDF = async (macroInfo, microcycles, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
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
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
};

/**
 * TESTS - Informe Colectivo
 */
export const generateTestsReport = async (tests, players, historyData, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
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
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
};

/**
 * TESTS - Informe Individual (Para el jugador o padre)
 */
export const generatePlayerTestReport = async (player, tests, historyData, activeTeam = null, graficaDataUrl = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
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
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
};

/**
 * Dibuja una tarjeta de información compacta (etiqueta + valor) en posición x,y
 */
const drawInfoCard = (doc, x, y, w, h, label, value, bgColor = [245, 247, 250], labelColor = [100, 120, 110], valueColor = [27, 58, 45]) => {
  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...labelColor);
  doc.text(label, x + 3, y + 5);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...valueColor);
  doc.text(String(value || '—').slice(0, 22), x + 3, y + 12);
};

/**
 * Dibuja una línea separadora con título de sección
 */
const drawSectionHeader = (doc, y, title, pageW) => {
  doc.setFillColor(...THEME_COLOR);
  doc.rect(15, y, pageW - 30, 0.5, 'F');
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(15, y, 4, 7, 'F');
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...THEME_COLOR);
  doc.text(title, 22, y + 5.5);
  return y + 12;
};

/**
 * SESIONES - Ficha individual profesional con capturas de pizarra
 * @param {Object} session - Sesión a exportar
 * @param {Object} activeTeam - Equipo activo
 * @param {Array} pizarras - Ejercicios tipo pizarra
 * @param {Array} captures - Capturas de la pizarra táctica
 * @param {Array} players - Lista de jugadores del equipo
 */
export const generateSessionPDF = async (session, activeTeam = null, pizarras = [], captures = [], players = []) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF de Sesión...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ─── CABECERA PROFESIONAL ─────────────────────────────────────────────────
    await addHeader(doc, 'FICHA DE ENTRENAMIENTO', session.nombre || session.title || session.titulo || 'Sesión sin nombre', activeTeam);

    // Banda dorada decorativa bajo el header
    doc.setFillColor(...ACCENT_COLOR);
    doc.rect(0, 40, pageW, 2, 'F');

    // ─── TARJETAS DE METADATOS ────────────────────────────────────────────────
    const metaY = 46;
    const cardW = (pageW - 38) / 4;
    const date = (session.date || session.fecha || new Date().toLocaleDateString()).split('-').reverse().join('/');
    drawInfoCard(doc, 15,          metaY, cardW, 18, 'FECHA',       date);
    drawInfoCard(doc, 16 + cardW,  metaY, cardW, 18, 'HORA',        session.time || session.hora || '18:00');
    drawInfoCard(doc, 17 + cardW*2,metaY, cardW, 18, 'DURACIÓN',    `${session.duration || session.duracion || 90} min`);
    drawInfoCard(doc, 18 + cardW*3,metaY, cardW, 18, 'INTENSIDAD',  session.intensity || session.intensidad || 'Media');

    const meta2Y = metaY + 22;
    const cardW2 = (pageW - 32) / 3;
    drawInfoCard(doc, 15,           meta2Y, cardW2, 18, 'CATEGORÍA', session.category || session.categoria || 'General');
    drawInfoCard(doc, 17 + cardW2,  meta2Y, cardW2, 18, 'MATERIAL',  (session.materials || session.material || 'Balones, conos').slice(0, 30));
    drawInfoCard(doc, 19 + cardW2*2,meta2Y, cardW2 - 4, 18, 'BLOQUES', `${(session.blocks || session.bloques || []).length} bloques`);

    // Objetivo
    if (session.objectives || session.objetivo) {
      const objText = session.objectives || session.objetivo || '';
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(60, 80, 70);
      const objLines = doc.splitTextToSize(`🎯 Objetivo: ${objText}`, pageW - 30);
      doc.text(objLines, 15, meta2Y + 24);
    }

    let currentY = meta2Y + 34;

    // ─── DIAGRAMA TÁCTICO PRINCIPAL ───────────────────────────────────────────
    let sessionDiagram = null;
    const blocks = session.blocks || session.bloques || [];

    if (session.linkedPizarraId) {
      const found = (pizarras || []).find(p => p.id === session.linkedPizarraId);
      if (found && found.thumbnail) {
        sessionDiagram = found.thumbnail;
      } else {
        try {
          const { getDoc: fsGetDoc, doc: fsDoc } = await import('firebase/firestore');
          const { db: fsDb, auth: fsAuth } = await import('../firebaseConfig');
          const user = fsAuth.currentUser;
          if (user && activeTeam?.id) {
            const pizarraRef = fsDoc(fsDb, 'users', user.uid, 'teams', activeTeam.id, 'pizarras', session.linkedPizarraId);
            const pizarraSnap = await fsGetDoc(pizarraRef);
            if (pizarraSnap.exists() && pizarraSnap.data().thumbnail) {
              sessionDiagram = pizarraSnap.data().thumbnail;
            }
          }
        } catch (err) {
          console.warn('No se pudo recuperar la pizarra desde Firestore:', err);
        }
      }
    }

    // Fallback al diagrama del primer bloque
    if (!sessionDiagram) {
      const firstBlockWithImg = blocks.find(b => b.imagenProtocolo);
      if (firstBlockWithImg) sessionDiagram = firstBlockWithImg.imagenProtocolo;
    }

    if (sessionDiagram) {
      if (currentY + 75 > pageH - 25) { doc.addPage(); currentY = 20; }
      currentY = drawSectionHeader(doc, currentY, '🗺️  DIAGRAMA TÁCTICO PRINCIPAL', pageW);
      try {
        const imgBase64 = await getImageBase64(sessionDiagram);
        if (imgBase64) {
          // Marco decorativo
          doc.setDrawColor(...THEME_COLOR);
          doc.setLineWidth(0.5);
          doc.rect(14, currentY - 1, pageW - 28, 72);
          doc.addImage(imgBase64, 'PNG', 15, currentY, pageW - 30, 70);
          currentY += 75;
        }
      } catch (e) { console.warn('No se pudo cargar el diagrama principal:', e); }
    }

    // ─── BLOQUES DE LA SESIÓN ─────────────────────────────────────────────────
    if (currentY + 15 > pageH - 25) { doc.addPage(); currentY = 20; }
    currentY = drawSectionHeader(doc, currentY, '📋  BLOQUES DE ENTRENAMIENTO', pageW);

    if (blocks.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.setFont(undefined, 'italic');
      doc.text('No hay bloques definidos para esta sesión.', 15, currentY);
      currentY += 10;
    } else {
      const blockColors = [
        [245, 247, 250], [240, 252, 245], [250, 248, 240], [248, 243, 255]
      ];
      for (let bi = 0; bi < blocks.length; bi++) {
        const b = blocks[bi];
        const descLines = doc.splitTextToSize(b.description || b.descripcion || 'Sin descripción', pageW - 55);
        const blockH = 8 + (descLines.length * 4.5) + 6;
        
        if (currentY + blockH > pageH - 25) { doc.addPage(); currentY = 20; }

        const bg = blockColors[bi % blockColors.length];
        doc.setFillColor(...bg);
        doc.roundedRect(15, currentY, pageW - 30, blockH, 2, 2, 'F');

        doc.setFillColor(...THEME_COLOR);
        doc.circle(22, currentY + 5, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text(String(bi + 1), 22, currentY + 7, { align: 'center' });

        doc.setTextColor(...THEME_COLOR);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(b.name || b.titulo || `Bloque ${bi+1}`, 30, currentY + 6.5);

        const typeTag = b.type || b.tipo || 'General';
        const durTag = `${b.duration || b.tiempo || 0} min`;
        doc.setFontSize(7.5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 100, 90);
        doc.text(`[${typeTag}]`, pageW - 45, currentY + 6.5);
        doc.setTextColor(...ACCENT_COLOR);
        doc.text(durTag, pageW - 25, currentY + 6.5);

        // Descripción
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 70, 65);
        doc.text(descLines, 28, currentY + 13);
        currentY += blockH + 2;

        // Imagen del bloque con diseno mejorado
        if (b.imagenProtocolo) {
          if (currentY + 65 > pageH - 25) { doc.addPage(); currentY = 20; }
          try {
            const imgBase64 = await getImageBase64(b.imagenProtocolo);
            if (imgBase64) {
              doc.setDrawColor(200, 210, 205);
              doc.setLineWidth(0.3);
              doc.rect(25, currentY, pageW - 50, 62);
              doc.addImage(imgBase64, 'PNG', 26, currentY + 1, pageW - 52, 60);
              currentY += 65;
            }
          } catch (e) { console.warn('No se pudo cargar imagen del bloque:', e); }
        }
        currentY += 3;
      }
    }

    // CAPTURAS DE PIZARRA TACTICA
    const linkedCaptures = (captures || []).filter(c => c.sessionId === session.id);
    const displayCaptures = linkedCaptures.length > 0
      ? linkedCaptures.slice(0, 8)
      : (captures || []).slice(0, 6);

    if (displayCaptures.length > 0) {
      if (currentY + 15 > pageH - 25) { doc.addPage(); currentY = 20; }
      currentY = drawSectionHeader(doc, currentY, 'CAPTURAS DE PIZARRA TACTICA', pageW);

      const capImgW = (pageW - 42) / 2;
      const capImgH = capImgW * 0.65;
      let capImgX = 15;
      let capRowY = currentY;

      for (let ci = 0; ci < displayCaptures.length; ci++) {
        const cap = displayCaptures[ci];
        const imgSrc = cap.dataUrl || cap.url || cap.imageUrl || cap.thumbnail || cap.imageData;
        if (!imgSrc) continue;

        if (capRowY + capImgH + 15 > pageH - 25) {
          doc.addPage(); capRowY = 20; capImgX = 15;
        }

        try {
          const imgBase64 = await getImageBase64(imgSrc);
          if (imgBase64) {
            doc.setFillColor(245, 247, 250);
            doc.roundedRect(capImgX - 1, capRowY - 1, capImgW + 2, capImgH + 13, 2, 2, 'F');
            doc.setDrawColor(...THEME_COLOR);
            doc.setLineWidth(0.3);
            doc.roundedRect(capImgX - 1, capRowY - 1, capImgW + 2, capImgH + 13, 2, 2, 'S');
            doc.addImage(imgBase64, 'PNG', capImgX, capRowY, capImgW, capImgH);
            doc.setFontSize(7);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(80, 100, 90);
            const capLabel = (cap.title || cap.label || cap.name || ('Captura ' + (ci + 1))).slice(0, 35);
            doc.text(capLabel, capImgX + 1, capRowY + capImgH + 9);
          }
        } catch (e) { console.warn('Error cargando captura ' + ci + ':', e); }

        if (ci % 2 === 0) {
          capImgX = 15 + capImgW + 12;
        } else {
          capImgX = 15;
          capRowY += capImgH + 18;
          currentY = capRowY;
        }
      }
      if (displayCaptures.length % 2 !== 0) {
        currentY = capRowY + capImgH + 18;
      }
    }

    // CONVOCATORIA
    const sessionPlayerIds = session.players || session.convocados || [];
    const convocados = (players || []).filter(p => sessionPlayerIds.includes(p.id));

    if (convocados.length > 0) {
      if (currentY + 20 > pageH - 25) { doc.addPage(); currentY = 20; }
      currentY = drawSectionHeader(doc, currentY, 'CONVOCATORIA (' + convocados.length + ' jugadores)', pageW);

      const convCols = 2;
      const convColW = (pageW - 30) / convCols;
      const convRowH = 8;
      const convStartY = currentY;

      for (let pi = 0; pi < convocados.length; pi++) {
        const p = convocados[pi];
        const colIdx = pi % convCols;
        const rowIdx = Math.floor(pi / convCols);
        const cx = 15 + (colIdx * convColW);
        const cy = convStartY + (rowIdx * convRowH);
        if (cy + convRowH > pageH - 25) break;
        doc.setFillColor(pi % 2 === 0 ? 248 : 255, 248, 248);
        doc.rect(cx, cy, convColW - 3, convRowH - 1, 'F');
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...THEME_COLOR);
        doc.text(String(p.number || p.dorsal || '-'), cx + 2, cy + 5.5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text((p.name || p.nombre || 'Jugador').slice(0, 20), cx + 10, cy + 5.5);
        doc.setTextColor(130);
        doc.text((p.position || p.posicion || ''), cx + convColW - 22, cy + 5.5);
      }
      currentY = convStartY + (Math.ceil(convocados.length / convCols)) * convRowH + 6;
    }

    // NOTAS Y OBSERVACIONES
    if (currentY + 40 > pageH - 25) { doc.addPage(); currentY = 20; }
    currentY = drawSectionHeader(doc, currentY, 'NOTAS POST-SESION', pageW);
    doc.setFillColor(252, 252, 248);
    doc.setDrawColor(200, 210, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, currentY, pageW - 30, 38, 2, 2, 'FD');
    for (let li = 0; li < 4; li++) {
      doc.setDrawColor(220, 225, 220);
      doc.setLineWidth(0.2);
      doc.line(22, currentY + 8 + (li * 8), pageW - 22, currentY + 8 + (li * 8));
    }

    // PIE DE PAGINA
    addFooter(doc);
    const safeTitle = (session.title || session.titulo || 'Sesion').replace(/[^a-z0-9]/gi, '_');
    await savePdfUniversal(doc, 'Sesion_' + safeTitle + '_' + (session.date || 'Hoy').replace(/-/g, '') + '.pdf');
  } catch (err) {
    console.error('Error al generar PDF de sesion:', err);
    alert('Error al generar el PDF de la sesion.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};

/**
 * INFORME DE TEMPORADA - Completo con estadísticas de jugadores
 */
export const generateSeasonReport = async (team, players, matches) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
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
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
};

/**
 * HOJA DE CONVOCATORIA - Para un partido con lista de convocados
 */
export const generateMatchConvocation = async (match, players, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
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
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
};

/**
 * EXPEDIENTE - Jugador individual
 */
export const generateExpediente = async (player, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
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
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
};

export const generateExercisesReport = async (exercises, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const doc = new jsPDF();
    const teamName = activeTeam?.nombre || 'Míster 11';
    await addHeader(doc, 'BIBLIOTECA DE EJERCICIOS', `Equipo: ${teamName}`, activeTeam);

    const tableData = exercises.map(ex => [
      ex.name || ex.titulo || 'Sin nombre',
      (ex.category || 'General').toUpperCase(),
      (ex.targetZones || []).join(', ') || 'N/A',
      `${ex.series || 3} series` + (ex.reps ? ` x ${ex.reps} reps` : '') + (ex.durationSeconds ? ` x ${ex.durationSeconds}s` : ''),
      ex.description || ex.descripcion || 'Sin descripción'
    ]);

    autoTable(doc, {
      startY: 48,
      head: [['Ejercicio', 'Categoría', 'Zonas Objetivo', 'Parámetros', 'Descripción']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: THEME_COLOR, textColor: TEXT_COLOR },
      styles: { fontSize: 9 },
      columnStyles: {
        4: { cellWidth: 70 }
      }
    });

    await savePdfUniversal(doc, `biblioteca_ejercicios_${teamName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating exercises report:', error);
    alert('Error al generar el PDF.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};

/**
 * INFORME POST-PARTIDO - Completo con cuestionario e imágenes
 */
export const generatePostMatchReportPDF = async (match, players, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const rival = match.rival || 'Rival';
    
    await addHeader(doc, 'INFORME POST-PARTIDO', `vs ${rival}`, activeTeam);
    
    // 1. Detalles del encuentro
    doc.setTextColor(45, 45, 45);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Detalles del Encuentro', 15, 50);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Fecha: ${match.date || '--/--/----'}`, 15, 57);
    doc.text(`Hora: ${match.time || '--:--'}`, 80, 57);
    doc.text(`Lugar: ${match.location || 'No especificado'}`, 140, 57);
    
    doc.text(`Condición: ${match.type || 'Local'}`, 15, 64);
    doc.text(`Formación inicial: ${match.lineup || '4-3-3'}`, 80, 64);
    
    // Resultado destacado
    doc.setFillColor(27, 58, 45); // THEME_COLOR
    doc.rect(140, 62, 55, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    const goalsLocal = match.type === 'Local' ? (match.goalsFor ?? 0) : (match.goalsAgainst ?? 0);
    const goalsVisit = match.type === 'Local' ? (match.goalsAgainst ?? 0) : (match.goalsFor ?? 0);
    doc.text(`${goalsLocal} - ${goalsVisit}`, 167.5, 70, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text('RESULTADO FINAL', 167.5, 74, { align: 'center' });
    
    // MVP y Goleadores
    doc.setTextColor(45, 45, 45);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Destacados del Partido', 15, 80);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`MVP: ${match.mvp || 'No especificado'}`, 15, 87);
    
    let scorersText = match.scorers;
    if (!scorersText && match.goleadoresList && match.goleadoresList.length > 0) {
      scorersText = match.goleadoresList
        .map(g => {
          const p = players.find(pl => pl.id === g.jugadorId);
          return `${p ? (p.name || p.nombre) : 'Jugador'} (${g.minuto}')`;
        })
        .join(', ');
    }
    if (!scorersText) scorersText = 'No especificado';

    let cardsText = '';
    if (match.tarjetasList && match.tarjetasList.length > 0) {
      cardsText = match.tarjetasList
        .map(t => {
          const p = players.find(pl => pl.id === t.jugadorId);
          const tipo = t.tipo === 'amarilla' ? 'Amarilla' : 'Roja';
          return `${tipo} - ${p ? (p.name || p.nombre) : 'Jugador'} (${t.minuto}')`;
        })
        .join(', ');
    }
    if (!cardsText) cardsText = 'Ninguna';

    const splitScorers = doc.splitTextToSize(`Goleadores/Asistencias: ${scorersText}`, pageW - 30);
    doc.text(splitScorers, 15, 94);
    
    let currentY = 94 + (splitScorers.length * 5);
    
    const splitCards = doc.splitTextToSize(`Tarjetas: ${cardsText}`, pageW - 30);
    doc.text(splitCards, 15, currentY);
    
    currentY += (splitCards.length * 5) + 6;
    
    // Alineación si hay convocados
    const convocados = players.filter(p => match.convocados?.includes(p.id));
    if (convocados.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Convocados y Alineación', 15, currentY);
      currentY += 5;
      
      const tableBody = convocados.map((p, i) => [
        p.number || p.dorsal || i + 1,
        p.name || p.nombre || '-',
        p.position || p.posicion || '-',
        i < 11 ? 'XI Titular' : 'Suplente'
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Nombre del Jugador', 'Posición', 'Rol']],
        body: tableBody,
        headStyles: { fillColor: THEME_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { textColor: [45, 45, 45], fontSize: 8.5 },
        alternateRowStyles: { fillColor: [245, 240, 232] },
        styles: { cellPadding: 2 },
        margin: { left: 15, right: 15 }
      });
      currentY = doc.lastAutoTable.finalY + 12;
    }
    
    // 2. Cuestionario guiado (respuestas)
    const reportQuestions = [
      { key: 'tactical', label: 'Rendimiento Táctico' },
      { key: 'physical', label: 'Rendimiento Físico/Mental' },
      { key: 'improvement', label: 'Puntos de Mejora' },
      { key: 'highlights', label: 'Notas Destacadas y MVP' }
    ];
    
    // Notas generales
    if (match.notes) {
      if (currentY > pageH - 40) {
        doc.addPage();
        currentY = 48;
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Análisis General (Notas Tácticas)', 15, currentY);
      currentY += 6;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9.5);
      const splitNotes = doc.splitTextToSize(match.notes, pageW - 30);
      doc.text(splitNotes, 15, currentY);
      currentY += (splitNotes.length * 5) + 10;
    }
    
    // Preguntas guiadas
    for (const q of reportQuestions) {
      const answer = (match.postMatchAnswers && match.postMatchAnswers[q.key]) || '';
      if (answer) {
        if (currentY > pageH - 45) {
          doc.addPage();
          currentY = 48;
        }
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text(q.label, 15, currentY);
        currentY += 6;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9.5);
        const splitAns = doc.splitTextToSize(answer, pageW - 30);
        doc.text(splitAns, 15, currentY);
        currentY += (splitAns.length * 5) + 10;
      }
    }
    
    // 3. Imágenes adjuntas
    const images = match.postMatchImages || [];
    if (images.length > 0) {
      if (currentY > pageH - 75) {
        doc.addPage();
        currentY = 48;
      }
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Imágenes Adjuntas', 15, currentY);
      currentY += 8;
      
      let imgX = 15;
      const imgW = 85;
      const imgH = 64; // Aspect ratio ~ 4:3
      
      for (let i = 0; i < images.length; i++) {
        // Verificar si cabe en la página
        if (currentY + imgH > pageH - 25) {
          doc.addPage();
          currentY = 48;
          imgX = 15;
        }
        
        try {
          doc.addImage(images[i], 'JPEG', imgX, currentY, imgW, imgH);
        } catch (e) {
          console.error("Error al añadir imagen al PDF:", e);
        }
        
        // Colocar dos imágenes por fila
        if (i % 2 === 0 && i < images.length - 1) {
          imgX = 110;
        } else {
          imgX = 15;
          currentY += imgH + 8;
        }
      }
    }
    
    addFooter(doc);
    const safeRival = rival.replace(/\s+/g, '_');
    const safeDate = (match.date || 'Hoy').replace(/-+/g, '_');
    await savePdfUniversal(doc, `Informe_PostPartido_${safeRival}_${safeDate}.pdf`);
  } catch (error) {
    console.error('Error generating post-match report:', error);
    alert('Error al generar el PDF del informe.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};

/**
 * EJERCICIO IA / GENERADO - Ficha de Ejercicio en PDF
 */
export const generateExercisePDF = async (exercise, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF del Ejercicio...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    
    // Título del PDF
    const title = exercise.title || exercise.name || 'Ejercicio Generado';
    await addHeader(doc, `FICHA DE EJERCICIO IA`, title, activeTeam);
    
    // Contenido del Ejercicio
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    let currentY = 50;
    
    // Si hay un contenido/descripción estructurado
    const textContent = exercise.content || exercise.description || '';
    
    if (textContent) {
      const textLines = doc.splitTextToSize(textContent, 180);
      
      // Itera sobre las líneas y maneja saltos de página automáticamente
      for (let i = 0; i < textLines.length; i++) {
        if (currentY > 270) {
          doc.addPage();
          // Cabecera simplificada para nuevas páginas
          doc.setFillColor(...THEME_COLOR);
          doc.rect(0, 0, pageW, 15, 'F');
          doc.setTextColor(...TEXT_COLOR);
          doc.setFontSize(9);
          doc.text(`Ficha: ${title}`, 15, 10);
          currentY = 25;
        }
        
        const line = textLines[i];
        if (line.startsWith('## ') || line.startsWith('### ')) {
          doc.setFont(undefined, 'bold');
          doc.setFontSize(13);
          doc.setTextColor(...THEME_COLOR);
          doc.text(line.replace(/#+\s+/, ''), 15, currentY);
          currentY += 8;
        } else if (line.startsWith('**') && line.endsWith('**')) {
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(0, 0, 0);
          doc.text(line.replace(/\*\*/g, ''), 15, currentY);
          currentY += 6;
        } else {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          doc.text(line, 15, currentY);
          currentY += 5;
        }
      }
    }
    
    addFooter(doc);
    const safeTitle = (exercise.name || exercise.title || 'Ejercicio').replace(/[^a-z0-9]/gi, '_');
    await savePdfUniversal(doc, `Ejercicio_${safeTitle}.pdf`);
  } catch (err) {
    console.error('Error al generar PDF del ejercicio:', err);
    alert('Error al generar el PDF del ejercicio.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};

/**
 * INFORME SEMANAL - Resumen de la semana (entrenamientos, partidos, alertas, RPE)
 */
export const generateWeeklyReportPDF = async (weeklyData, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando Informe Semanal...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    
    const { weekStart, weekEnd, sessions = [], matches = [], activeAlerts = 0, testsCount = 0 } = weeklyData;
    
    const weekStr = `${weekStart.split('-').reverse().join('/')} al ${weekEnd.split('-').reverse().join('/')}`;
    await addHeader(doc, `INFORME SEMANAL DE RENDIMIENTO`, `Semana del ${weekStr}`, activeTeam);
    
    // --- RESUMEN DE ACTIVIDAD ---
    doc.setTextColor(...THEME_COLOR);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('Resumen General de Actividad', 15, 50);
    
    // Grid de Estadísticas
    doc.setFillColor(245, 240, 232); // Fondo claro
    doc.rect(15, 55, pageW - 30, 25, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const totalSessions = sessions.length;
    const totalMatches = matches.length;
    
    doc.text(`Entrenamientos Realizados:`, 20, 63);
    doc.setFont(undefined, 'bold');
    doc.text(`${totalSessions}`, 70, 63);
    
    doc.setFont(undefined, 'normal');
    doc.text(`Partidos Jugados:`, 20, 71);
    doc.setFont(undefined, 'bold');
    doc.text(`${totalMatches}`, 70, 71);
    
    doc.setFont(undefined, 'normal');
    doc.text(`Alertas de Salud Activas:`, 110, 63);
    doc.setFont(undefined, 'bold');
    if (activeAlerts > 0) {
      doc.setTextColor(200, 50, 50); // Rojo si hay alertas
    }
    doc.text(`${activeAlerts}`, 160, 63);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text(`Evaluaciones / Tests:`, 110, 71);
    doc.setFont(undefined, 'bold');
    doc.text(`${testsCount}`, 160, 71);
    
    let currentY = 90;
    
    // --- TABLA DE ENTRENAMIENTOS ---
    if (sessions.length > 0) {
      doc.setTextColor(...THEME_COLOR);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(13);
      doc.text('Sesiones de Entrenamiento', 15, currentY);
      currentY += 6;
      
      const sessionData = sessions.map(s => [
        s.date ? s.date.split('-').reverse().join('/') : 'S/D',
        s.title || 'Entrenamiento',
        s.type || 'Físico/Táctico',
        `${s.duration || 90} min`,
        s.intensity || 'Media'
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Fecha', 'Título', 'Enfoque', 'Duración', 'Intensidad']],
        body: sessionData,
        headStyles: { fillColor: THEME_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { textColor: [45, 45, 45], fontSize: 8.5 },
        alternateRowStyles: { fillColor: [245, 240, 232] },
        styles: { cellPadding: 2.5 },
        margin: { left: 15, right: 15 }
      });
      currentY = doc.lastAutoTable.finalY + 12;
    }
    
    // --- TABLA DE PARTIDOS ---
    if (matches.length > 0) {
      if (currentY > pageH - 50) {
        doc.addPage();
        currentY = 48;
      }
      
      doc.setTextColor(...THEME_COLOR);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(13);
      doc.text('Partidos de la Semana', 15, currentY);
      currentY += 6;
      
      const matchData = matches.map(m => {
        const dateStr = m.date ? m.date.split('-').reverse().join('/') : 'S/D';
        const rivalStr = m.rival || 'Rival';
        const scoreStr = m.status === 'Terminado' ? `${m.goalsFor} - ${m.goalsAgainst}` : 'Pendiente';
        return [
          dateStr,
          `vs ${rivalStr}`,
          m.type || 'Local',
          scoreStr,
          m.location || 'Sin Ubicación'
        ];
      });
      
      autoTable(doc, {
        startY: currentY,
        head: [['Fecha', 'Rival', 'Condición', 'Resultado', 'Ubicación']],
        body: matchData,
        headStyles: { fillColor: THEME_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { textColor: [45, 45, 45], fontSize: 8.5 },
        alternateRowStyles: { fillColor: [245, 240, 232] },
        styles: { cellPadding: 2.5 },
        margin: { left: 15, right: 15 }
      });
      currentY = doc.lastAutoTable.finalY + 12;
    }
    
    addFooter(doc);
    const safeDate = weekEnd.replace(/-+/g, '_');
    await savePdfUniversal(doc, `Informe_Semanal_${safeDate}.pdf`);
  } catch (error) {
    console.error('Error generating weekly report PDF:', error);
    alert('Error al generar el PDF del informe semanal.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
