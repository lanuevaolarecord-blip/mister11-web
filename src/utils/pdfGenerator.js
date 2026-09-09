import { downloadPDF } from './download.js';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import autoTable from 'jspdf-autotable';
import { 
  PDF_COLORS, 
  imageUrlToBase64, 
  preloadImageToDataURL, 
  drawPdfHeader, 
  drawPdfFooter,
  drawRadarChartCanvas,
  drawEvolutionChartCanvas,
  drawMomentumChartCanvas,
  cleanPdfText
} from './pdfTheme';
import { calculatePlayerPerformanceScores, consolidatePlayerEvaluations, CANONICAL_TESTS_MAP } from './testScoreEngine';
import { getEffectiveLanguage } from '../i18n/translations';

const isEnglish = () => {
  const l = getEffectiveLanguage();
  return l === 'English (EN)' || l === 'en' || (typeof l === 'string' && l.toLowerCase().startsWith('en'));
};
const getLocale = () => (isEnglish() ? 'en-US' : 'es-ES');
const formatCurrentDate = () => new Date().toLocaleDateString(getLocale());

const getJsPDF = async () => {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
};

// Configuración de colores corporativos unificados
const THEME_COLOR = PDF_COLORS.primary;
const ACCENT_COLOR = PDF_COLORS.accent;
const TEXT_COLOR = [255, 255, 255];
const TEXT_DARK = PDF_COLORS.textDark;

/**
 * savePdfUniversal – guarda el PDF correctamente en Web Y en APK Android.
 */
export const savePdfUniversal = async (doc, filename) => {
  try {
    const pdfBase64 = doc.output('dataurlstring').split(',')[1];
    await downloadPDF(pdfBase64, filename);
  } catch (error) {
    console.error('Error al guardar PDF:', error);
    alert(isEnglish() ? 'Error saving PDF. Please check your storage and permissions.' : 'Error al guardar el PDF. Revisa tu espacio y permisos.');
  }
};

const getImageBase64 = async (url, fallbackInitials = 'M11', isAvatar = false) => {
  return await imageUrlToBase64(url, fallbackInitials, isAvatar);
};

const addHeader = async (doc, title, subtitle, activeTeam = null) => {
  const pageW = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(...THEME_COLOR);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 36, pageW, 2, 'F');
  
  // Logotipo oficial de Míster11 a la izquierda
  const mr11LogoData = await getImageBase64('/logo_mister11.png');
  if (mr11LogoData) {
    doc.addImage(mr11LogoData, 'PNG', 14, 5, 18, 18);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('MÍSTER11', 36, 16);
  } else {
    doc.setTextColor(...TEXT_COLOR);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('MÍSTER11', 14, 18);
  }
  
  // Escudo del equipo a la derecha
  if (activeTeam) {
    const shieldX = pageW - 33;
    const textX = pageW - 24;
    
    if (activeTeam.escudo) {
      const logoData = await getImageBase64(activeTeam.escudo, (activeTeam.nombre || 'E'));
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
    doc.text((activeTeam.nombre || '').slice(0, 18), textX, 32, { align: 'center' });
  }

  // Título y subtítulo centrados
  doc.setTextColor(...ACCENT_COLOR);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(title.toUpperCase(), pageW / 2, 22, { align: 'center' });
  
  if (subtitle) {
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    doc.text(subtitle, pageW / 2, 30, { align: 'center' });
  }
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPdfFooter(doc, pageW, pageH, i, pageCount);
  }
};



/**
 * PLANIFICACIÓN - Macrociclo (Landscape, dark theme)
 */
export const generatePlanificacionPDF = async (macroInfo = {}, microcycles = [], activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF de Planificación...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const jsPDF = await getJsPDF();
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth(); // 297mm landscape

    const safeMacro = macroInfo || {};
    const safeMicro = Array.isArray(microcycles) ? microcycles : [];
    const teamCategory = cleanPdfText(safeMacro.category || activeTeam?.categoria || 'General');
    const seasonStart = cleanPdfText(safeMacro.startDate || '');
    const seasonEnd = cleanPdfText(safeMacro.endDate || '');
    const trainer = cleanPdfText(safeMacro.trainer || activeTeam?.entrenador || 'Cuerpo Técnico');

    await addHeader(doc, 'PLANIFICACIÓN ESTRATÉGICA', `Categoría: ${teamCategory} · Temporada ${seasonStart} — ${seasonEnd}`, activeTeam);

    let currentY = 46;

    // ── OBJETIVOS DE LA TEMPORADA ──────────────────────────────────────────
    if (safeMacro.objective) {
      doc.setFillColor(...THEME_COLOR);
      doc.rect(10, currentY, pageW - 20, 7, 'F');
      doc.setTextColor(...ACCENT_COLOR);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('OBJETIVOS DE LA TEMPORADA', 14, currentY + 5);
      
      currentY += 10;
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(8.5);
      const cleanObj = cleanPdfText(safeMacro.objective);
      const objLines = doc.splitTextToSize(cleanObj, pageW - 28);
      doc.text(objLines, 14, currentY);
      currentY += (objLines.length * 4.2) + 6;
    }

    // ── TABLA MACROCICLO ───────────────────────────────────────────────────
    const head = [['Mes', 'Periodo', 'Etapa', 'N Meso', 'N Micro', 'Tipo Micro', 'N Ses.', 'Vol.(min)', '% Fis.', '% Tec.', '% Tac.']];
    const body = safeMicro.map(m => [
      cleanPdfText(m?.month || '-'),
      cleanPdfText(m?.period || '-'),
      cleanPdfText(m?.etapa || '-'),
      cleanPdfText(m?.mesoId || '-'),
      cleanPdfText(m?.id || '-'),
      cleanPdfText(m?.type || 'Ordinario'),
      cleanPdfText(m?.sessions ?? '-'),
      cleanPdfText(m?.volume ? `${m.volume}m` : '-'),
      cleanPdfText(m?.physical ? `${m.physical}%` : '-'),
      cleanPdfText(m?.technical ? `${m.technical}%` : '-'),
      cleanPdfText(m?.tactical ? `${m.tactical}%` : '-')
    ]);

    autoTable(doc, {
      startY: currentY,
      head,
      body,
      theme: 'grid',
      headStyles: {
        fillColor: THEME_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        textColor: TEXT_DARK,
        fontSize: 7.5,
        halign: 'center',
        fillColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.bgLight,
      },
      styles: { cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 }, 1: { cellWidth: 32 }, 2: { cellWidth: 30 },
        3: { cellWidth: 18 }, 4: { cellWidth: 18 }, 5: { cellWidth: 30 },
        6: { cellWidth: 18 }, 7: { cellWidth: 20 },
        8: { cellWidth: 20 }, 9: { cellWidth: 20 }, 10: { cellWidth: 20 },
      },
      margin: { left: 10, right: 10 },
    });

    addFooter(doc);

    const safeName = teamCategory.replace(/\s+/g, '_');
    const year = (seasonStart || '').split('-')[0] || new Date().getFullYear();
    await savePdfUniversal(doc, `Planificacion_${safeName}_${year}.pdf`);
  } catch (err) {
    console.error('Error generando Planificación PDF:', err);
    alert(isEnglish() ? 'Error generating planning PDF.' : 'Error al generar el PDF de la planificación.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};

/**
 * TESTS - Mapeo canónico de nombres en inglés
 */
const TEST_NAME_MAP = {
  'Test de Cooper': 'Cooper Test',
  'Course Navette': 'Beep Test (Course Navette)',
  'Sprint 10m': '10m Sprint',
  'Sprint 30m': '30m Sprint',
  'T-Test': 'T-Test',
  'Salto CMJ': 'CMJ Jump',
  'Conducción conos': 'Cone Dribbling',
  'Pase a portería': 'Target Passing',
  'Inventario de Habilidades de Afrontamiento (ACSI-28)': 'Coping Skills Inventory (ACSI-28)',
  'Cuestionario de Fortaleza Mental (MTQ-10)': 'Mental Toughness Questionnaire (MTQ-10)',
  'Escala de Establecimiento de Metas': 'Goal Setting Scale',
  'Inventario de Liderazgo y Comunicación': 'Leadership & Communication Inventory',
  'Cuestionario de Cohesión de Equipo (GEQ)': 'Group Environment Questionnaire (GEQ)',
  'Escala de Bienestar Mental (MHC-SF)': 'Mental Health Continuum (MHC-SF)',
  'Test de Autoconciencia Emocional': 'Emotional Self-Awareness Test',
  'Escala de Empatía Deportiva': 'Sports Empathy Scale',
  'Cuestionario de Resolución de Conflictos': 'Conflict Resolution Questionnaire',
  'ACSI-28 (Habilidades de Afrontamiento)': 'ACSI-28 (Athletic Coping Skills)',
  'Escala de Autoconfianza': 'Self-Confidence Scale',
  'Ansiedad Competitiva (CSAI-2R)': 'Competitive Anxiety (CSAI-2R)',
  'Motivación Deportiva (SMS-II)': 'Sport Motivation Scale (SMS-II)',
  'Resiliencia en el Deporte': 'Sports Resilience',
  'Atención y Concentración': 'Attention & Concentration',
  'Cohesión de Equipo (GEQ)': 'Team Cohesion (GEQ)',
  'Escala de Deporte Limpio': 'Clean Sport Scale',
  'Habilidades Sociales': 'Social Skills',
  'Liderazgo Percibido': 'Perceived Leadership',
  'Satisfacción con el Entrenador': 'Coach Satisfaction',
  'IRES (Resiliencia en el Deporte)': 'IRES (Sports Resilience)',
  'GETS (Trabajo en Equipo para Jóvenes)': 'GETS (Youth Teamwork)',
  'CWMS (Bienestar Mental)': 'CWMS (Mental Well-Being)',
  'ECED (Cohesión en Equipos)': 'ECED (Team Cohesion)',
  'EDL (Deporte Limpio)': 'EDL (Clean Sport)'
};

/**
 * TESTS - Informe Colectivo
 */
export const generateTestsReport = async (tests, players, historyData, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: isEnglish() ? 'Generating PDF...' : 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();

  await addHeader(doc, isEnglish() ? 'OVERALL PERFORMANCE REPORT' : 'INFORME DE RENDIMIENTO GLOBAL', `${isEnglish() ? 'Date' : 'Fecha'}: ${formatCurrentDate()}`, activeTeam);

  // ── BANDA KPI ──────────────────────────────────────────────────────────────
  const totalPlayers = players.length;
  const totalTests   = tests.length;
  const evaluated    = players.filter(p => tests.some(t => historyData[p.id]?.[t.id]?.length > 0)).length;
  const today        = formatCurrentDate();

  doc.setFillColor(20, 46, 34);
  doc.rect(0, 40, pageW, 16, 'F');

  const kpis = [
    { label: isEnglish() ? 'Players' : 'Jugadores',  value: totalPlayers },
    { label: isEnglish() ? 'Evaluated' : 'Evaluados',  value: evaluated },
    { label: isEnglish() ? 'Tests' : 'Pruebas',    value: totalTests },
    { label: isEnglish() ? 'Date' : 'Fecha',      value: today },
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

    const head = [isEnglish() ? 'Player' : 'Jugador', ...groupTests.map(t => `${isEnglish() ? (TEST_NAME_MAP[t.name] || t.name) : t.name}\n(${t.unit})`)];

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

  renderCategoryTable(physicalTests, isEnglish() ? 'Physical and Technical Tests' : 'Pruebas Físicas y Técnicas',   THEME_COLOR,  ACCENT_COLOR);
  renderCategoryTable(psychoTests,   isEnglish() ? 'Psychosocial Tests' : 'Pruebas Psicosociales',        ACCENT_COLOR, THEME_COLOR);
  renderCategoryTable(socioTests,    isEnglish() ? 'Socioemotional Tests' : 'Pruebas Socioemocionales',     ACCENT_COLOR, THEME_COLOR);

  // Leyenda
  const legendY = Math.min(finalY + 10, doc.internal.pageSize.getHeight() - 16);
  doc.setFontSize(8);
  doc.setFont(undefined, 'italic');
  doc.setTextColor(76, 175, 125);
  doc.text('■ ', 10, legendY);
  doc.setTextColor(120);
  doc.text(isEnglish() ? 'Team best    ' : 'Mejor del equipo    ', 15, legendY);
  doc.setTextColor(239, 68, 68);
  doc.text('■ ', 55, legendY);
  doc.setTextColor(120);
  doc.text(isEnglish() ? 'Lowest score' : 'Resultado más bajo', 60, legendY);

  addFooter(doc);
  savePdfUniversal(doc, `${isEnglish() ? 'Team_Tests' : 'Tests_Equipo'}_${formatCurrentDate().replace(/\//g, '-')}.pdf`);
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
};

/**
 * TESTS - Informe Individual (Para el jugador o padre)
 */
export const generatePlayerTestReport = async (player, tests, historyData, activeTeam = null, _graficaDataUrl = null) => {
  const isEn = isEnglish();
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: isEn ? 'Generating Technical Summary...' : 'Generando Resumen Técnico...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const jsPDF = await getJsPDF();
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const playerName = cleanPdfText(player.name || player.nombre || (isEn ? 'Player' : 'Jugador'));
    const teamName = cleanPdfText(activeTeam?.nombre || 'Míster11');

    await addHeader(doc, isEn ? 'TECHNICAL PERFORMANCE REPORT' : 'INFORME DE RENDIMIENTO TÉCNICO', `${playerName} · ${teamName}`, activeTeam);

    // Calcular puntuaciones canónicas reales
    let rawEvals = Array.isArray(player.evaluaciones) ? player.evaluaciones : (Array.isArray(player.tests) ? player.tests : []);
    if (rawEvals.length === 0 && historyData?.[player.id]) {
      rawEvals = Object.values(historyData[player.id]).flat().map(item => ({
        ...(item.raw || {}),
        testId: item.raw?.testId || item.testId,
        val: item.val,
        date: item.date,
        playerId: player.id
      }));
    }
    const playerEvals = consolidatePlayerEvaluations(rawEvals, player.id);
    const matchRatingVal = (player.avgRating && player.avgRating !== '-' && !isNaN(Number(player.avgRating)))
      ? Number(player.avgRating)
      : (player.notaMedia && !isNaN(Number(player.notaMedia)) ? Number(player.notaMedia) : null);

    const perfScores = calculatePlayerPerformanceScores(playerEvals, player, {
      attendancePct: player.attendancePct ? Number(player.attendancePct) : null,
      matchRating: matchRatingVal
    });

    // ── TARJETA DE JUGADOR CON FOTO REAL ──────────────────────────────────────
    doc.setFillColor(...THEME_COLOR);
    doc.rect(10, 44, pageW - 20, 24, 'F');

    const playerAvatarData = await imageUrlToBase64(
      player.avatarUrl || player.photoPreview || player.photo || player.imageUrl || player.foto || player.avatar, 
      playerName, 
      true
    );

    let textOffsetX = 36;
    if (playerAvatarData) {
      try {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 46, 20, 20, 2, 2, 'F');
        doc.addImage(playerAvatarData, 'PNG', 15, 47, 18, 18);
        textOffsetX = 38;
      } catch (e) {
        console.warn('[generatePlayerTestReport] Error insertando foto del jugador:', e);
      }
    } else {
      doc.setFillColor(...ACCENT_COLOR);
      doc.circle(24, 56, 8, 'F');
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...THEME_COLOR);
      const initials = (player.name || player.nombre || 'J').charAt(0).toUpperCase();
      doc.text(initials, 21.5, 59);
    }

    // Nombre del jugador
    doc.setTextColor(...ACCENT_COLOR);
    doc.setFontSize(12.5);
    doc.setFont(undefined, 'bold');
    doc.text(playerName, textOffsetX, 52);

    // Dorsal | Posición | Categoría
    doc.setTextColor(200, 225, 215);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    const posStr = cleanPdfText(player.position || player.posicion || '-');
    const dorsalStr = cleanPdfText(player.number || player.dorsal || '-');
    const catStr = cleanPdfText(activeTeam?.categoria || player.category || '-');
    const labelDorsal = isEn ? 'Number:' : 'Dorsal:';
    const labelPos = isEn ? 'Position:' : 'Posición:';
    const labelCat = isEn ? 'Category:' : 'Categoría:';
    doc.text(`${labelDorsal} #${dorsalStr}   |   ${labelPos} ${posStr}   |   ${labelCat} ${catStr}`, textOffsetX, 60);

    // TPI Score / Overall Real a la derecha
    const overallVal = perfScores.overall || null;
    if (overallVal !== null) {
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...ACCENT_COLOR);
      doc.text(String(overallVal), pageW - 24, 54, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(200, 225, 215);
      doc.text('TPI SCORE', pageW - 24, 61, { align: 'center' });
    }

    // ── TEXTO INTRODUCTORIO ───────────────────────────────────────────────────
    doc.setFillColor(250, 248, 240);
    doc.rect(10, 71, pageW - 20, 13, 'F');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.setFont(undefined, 'italic');
    const introText = isEn 
      ? 'Official physical, technical and psychological performance report recorded in Míster11. Consolidated benchmarks on a unified scale (10 to 99).'
      : 'Informe oficial de rendimiento físico, técnico y psicológico registrado en Míster11. Baremos consolidados en escala unificada (10 a 99).';
    doc.text(doc.splitTextToSize(introText, pageW - 28), 14, 78);

    const generateRows = (testsGroup, isPhysical) => {
      const rows = [];
      testsGroup.forEach(t => {
        const pHistory = historyData?.[player.id]?.[t.id];
        let latestVal = '-', prevVal = '-', evolution = '-';
        if (pHistory?.length > 0) {
          latestVal = pHistory[pHistory.length - 1].val;
          if (pHistory.length > 1) {
            prevVal = pHistory[pHistory.length - 2].val;
            const diff = latestVal - prevVal;
            const improved = t.unit === 'seg' ? diff < 0 : diff > 0;
            evolution = diff === 0 
              ? (isEn ? 'Maintained' : 'Mantenido') 
              : (improved ? (isEn ? '(+) Improvement' : '(+) Mejora') : (isEn ? '(-) Decline' : '(-) Baja'));
          }
        }
        if (isPhysical) {
          let valoracion = latestVal !== '-' 
            ? (evolution.includes('Mejora') || evolution.includes('Improvement') 
              ? (isEn ? 'Excellent' : 'Excelente') 
              : (evolution.includes('Baja') || evolution.includes('Decline') 
                ? (isEn ? 'Needs Work' : 'Mejorable') 
                : (isEn ? 'Adequate' : 'Adecuado'))) 
            : '-';
          rows.push([
            cleanPdfText(isEn ? (TEST_NAME_MAP[t.name] || t.name) : t.name), 
            cleanPdfText(`${latestVal} ${latestVal !== '-' ? t.unit : ''}`), 
            cleanPdfText(`${prevVal !== '-' ? prevVal + ' ' + t.unit : '-'}`), 
            evolution, 
            valoracion
          ]);
        } else {
          let interp = t.interpretacion || t.desc || (isEn ? 'Recorded' : 'Registrado');
          if (isEn && typeof interp === 'string') {
            if (interp === 'Registrado') interp = 'Recorded';
            else if (interp === 'Óptimo' || interp === 'Optimo') interp = 'Optimal';
            else if (interp === 'Riesgo') interp = 'Risk';
            else if (interp === 'Adecuado') interp = 'Adequate';
          }
          rows.push([
            cleanPdfText(isEn ? (TEST_NAME_MAP[t.name] || t.name) : t.name), 
            cleanPdfText(`${latestVal} ${latestVal !== '-' ? t.unit : ''}`), 
            cleanPdfText(interp)
          ]);
        }
      });
      return rows;
    };

    const physicalRows = generateRows(tests.filter(t => t.type === 'fisico' || !t.type), true);
    const psychoRows   = generateRows(tests.filter(t => t.type === 'psicosocial'), false);
    const socioRows    = generateRows(tests.filter(t => t.type === 'socioemocional'), false);

    // ── TABLA FÍSICA Y TÉCNICA (ALTO CONTRASTE CLARO) ─────────────────────────
    autoTable(doc, {
      startY: 87,
      head: [isEn 
        ? ['Physical / Technical Test', 'Current Result', 'Previous Eval.', 'Evolution', 'Rating'] 
        : ['Prueba Física / Técnica', 'Resultado Actual', 'Eval. Anterior', 'Evolución', 'Valoración']],
      body: physicalRows,
      theme: 'grid',
      headStyles: { fillColor: THEME_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
      bodyStyles: { fillColor: [255, 255, 255], textColor: TEXT_DARK, fontSize: 8, halign: 'center', cellPadding: 2.5 },
      alternateRowStyles: { fillColor: PDF_COLORS.bgLight },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
        3: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 10, right: 10 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const v = String(data.cell.raw);
          if (v.includes('Mejora') || v.includes('Improvement')) data.cell.styles.textColor = [34, 197, 94];
          else if (v.includes('Baja') || v.includes('Decline')) data.cell.styles.textColor = [220, 38, 38];
        }
        if (data.section === 'body' && data.column.index === 4) {
          const v = String(data.cell.raw);
          if (v.includes('Excelente') || v.includes('Excellent')) data.cell.styles.textColor = [34, 197, 94];
          else if (v.includes('Mejorable') || v.includes('Needs Work')) data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });

    let finalY = doc.lastAutoTable.finalY + 8;

    // ── TABLA PSICOSOCIAL ─────────────────────────────────────────────────────
    if (psychoRows.length > 0) {
      if (finalY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); finalY = 20; }
      autoTable(doc, {
        startY: finalY,
        head: [isEn 
          ? ['Psychosocial / Mental Profile', 'Score', 'Interpretation'] 
          : ['Perfil Psicosocial / Mental', 'Puntuación', 'Interpretación']],
        body: psychoRows,
        theme: 'grid',
        headStyles: { fillColor: [43, 62, 53], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
        bodyStyles: { fillColor: [255, 255, 255], textColor: TEXT_DARK, fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: PDF_COLORS.bgLight },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' } },
        margin: { left: 10, right: 10 }
      });
      finalY = doc.lastAutoTable.finalY + 8;
    }

    // ── TABLA SOCIOEMOCIONAL ──────────────────────────────────────────────────
    if (socioRows.length > 0) {
      if (finalY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); finalY = 20; }
      autoTable(doc, {
        startY: finalY,
        head: [isEn 
          ? ['Team Well-being / Socioemotional', 'Score', 'Interpretation'] 
          : ['Bienestar en el Equipo / Socioemocional', 'Puntuación', 'Interpretación']],
        body: socioRows,
        theme: 'grid',
        headStyles: { fillColor: [43, 62, 53], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
        bodyStyles: { fillColor: [255, 255, 255], textColor: TEXT_DARK, fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: PDF_COLORS.bgLight },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' } },
        margin: { left: 10, right: 10 }
      });
      finalY = doc.lastAutoTable.finalY + 8;
    }

    // ── SECCIÓN RADAR NATIVO 360° (PROHIBIDO VOLCAR DOM/UI) ───────────────────
    const radarMetrics = [
      { label: isEn ? 'Physical' : 'Físico', value: perfScores.fis },
      { label: isEn ? 'Technical' : 'Técnica', value: perfScores.tec },
      { label: isEn ? 'Tactical' : 'Táctica', value: perfScores.tactica },
      { label: isEn ? 'Mental' : 'Mental', value: perfScores.psi },
      { label: isEn ? 'Attendance' : 'Asistencia', value: perfScores.asistencia }
    ];
    const radarImg = drawRadarChartCanvas(radarMetrics, 440);
    if (radarImg) {
      if (finalY + 75 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); finalY = 20; }
      const rSize = 65;
      const rX = (pageW - rSize) / 2;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...THEME_COLOR);
      doc.text(isEn ? '360° SKILLS & PERFORMANCE RADAR' : 'RADAR DE HABILIDADES 360°', pageW / 2, finalY + 4, { align: 'center' });
      doc.addImage(radarImg, 'PNG', rX, finalY + 6, rSize, rSize);
      finalY += rSize + 10;
    }

    // ── BLOQUE DE RECOMENDACIÓN ───────────────────────────────────────────────
    if (finalY + 28 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); finalY = 20; }

    doc.setFillColor(250, 248, 240);
    doc.rect(10, finalY, pageW - 20, 24, 'F');
    doc.setFillColor(...ACCENT_COLOR);
    doc.rect(10, finalY, 3, 24, 'F');

    doc.setFontSize(9.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...THEME_COLOR);
    doc.text(isEn ? 'Coaching Staff Recommendation' : 'Recomendación del Cuerpo Técnico', 16, finalY + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    const adviceText = isEn
      ? 'Maintain consistency and commitment in training sessions. Continue strengthening dimensions with lower benchmarks and consolidate demonstrated technical strengths.'
      : 'Mantener la constancia y el compromiso en las sesiones de entrenamiento. Continuar el fortalecimiento de las dimensiones con menor baremo y consolidar las virtudes técnicas mostradas.';
    doc.text(doc.splitTextToSize(adviceText, pageW - 30), 16, finalY + 13);

    addFooter(doc);
    const safeName = playerName.replace(/\s+/g, '_');
    await savePdfUniversal(doc, `${isEn ? 'Tests_Report' : 'Informe_Tests'}_${safeName}.pdf`);
  } catch (err) {
    console.error('Error generando Informe de Tests:', err);
    alert(isEnglish() ? 'Error generating tests report.' : 'Error al generar el informe de tests.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
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
 * Pre-carga y convierte todas las imágenes de los bloques y diagramas de la sesión a Base64 dataURL (PNG nativo).
 * Esto evita bloqueos de CORS y garantiza que jsPDF inserte las imágenes de las pizarras tácticas.
 */
export const preloadSessionImages = async (session, pizarras = [], captures = [], exercises = []) => {
  const blocks = session.blocks || session.bloques || [];

  window.dispatchEvent(new CustomEvent('m11-loading', {
    detail: { show: true, message: `Procesando diagramas e imágenes...` }
  }));

  // Precargar diagrama principal de la sesión si existe
  let mainDiagramBase64 = null;
  const rawMainDiagram = session.mainDiagramUrl || session.diagramUrl || session.diagram || session.thumbnail || session.boardCaptureUrl || session.imageUrl || session.image;
  if (rawMainDiagram) {
    try {
      mainDiagramBase64 = await preloadImageToDataURL(rawMainDiagram);
    } catch (e) {
      console.warn('[preloadSessionImages] Error cargando diagrama principal:', e);
    }
  }

  // Precargar todos los bloques concurrentemente en paralelo
  const updatedBlocks = await Promise.all(
    blocks.map(async (b, bi) => {
      let rawImg = b.imageUrl || b.boardCaptureUrl || b.boardCapture || b.imagenProtocolo || b.image || b.photo || b.previewUrl || b.thumbnail || b.canvasData || b.dataUrl || b.pizarraUrl || b.img || b.diagram;

      // Si attachments es un array de URLs
      if (!rawImg && Array.isArray(b.attachments) && b.attachments.length > 0) {
        rawImg = b.attachments[0];
      }

      // Buscar en pizarras / ejercicios por id o coincidencia de título
      if (!rawImg) {
        const pool = [...(pizarras || []), ...(exercises || [])];
        const matchedEx = pool.find(e =>
          (b.exerciseId && e.id === b.exerciseId) ||
          (b.pizarraId && e.id === b.pizarraId) ||
          (e.id === b.id) ||
          (e.title && b.name && e.title.toLowerCase().trim() === b.name.toLowerCase().trim()) ||
          (e.nombre && b.name && e.nombre.toLowerCase().trim() === b.name.toLowerCase().trim())
        );
        if (matchedEx) {
          rawImg = matchedEx.imageUrl || matchedEx.boardCaptureUrl || matchedEx.imagenProtocolo || matchedEx.thumbnail || matchedEx.image || matchedEx.previewUrl || matchedEx.dataUrl;
        }
      }

      // Buscar en capturas vinculadas si no tiene imagen directa
      if (!rawImg && Array.isArray(captures) && captures.length > 0) {
        const matchedCap = captures.find(c =>
          (c.sessionId === session.id && (c.blockId === b.id || c.blockIndex === bi)) ||
          (c.title && b.name && c.title.toLowerCase().trim() === b.name.toLowerCase().trim())
        );
        if (matchedCap) {
          rawImg = matchedCap.dataUrl || matchedCap.url || matchedCap.imageUrl || matchedCap.thumbnail || matchedCap.imageData;
        }
      }

      // Buscar en la pizarra vinculada a la sesión
      if (!rawImg && (session.linkedPizarraId || session.pizarraId) && Array.isArray(pizarras)) {
        const linkedPiz = pizarras.find(p => p.id === (session.linkedPizarraId || session.pizarraId));
        if (linkedPiz && (linkedPiz.thumbnail || linkedPiz.imageUrl || linkedPiz.boardCaptureUrl)) {
          rawImg = linkedPiz.thumbnail || linkedPiz.imageUrl || linkedPiz.boardCaptureUrl;
        }
      }

      let base64 = null;
      if (rawImg) {
        base64 = await preloadImageToDataURL(rawImg);
      }

      return {
        ...b,
        imageUrl: base64 || (typeof rawImg === 'string' ? rawImg : null),
        boardCapture: base64 || (typeof rawImg === 'string' ? rawImg : null),
        boardCaptureUrl: base64 || (typeof rawImg === 'string' ? rawImg : null),
        imagenProtocolo: base64 || (typeof rawImg === 'string' ? rawImg : null),
        resolvedBase64: (base64 && typeof base64 === 'string' && base64.startsWith('data:')) ? base64 : null,
        hadImageSource: Boolean(rawImg || base64)
      };
    })
  );

  return {
    ...session,
    mainDiagramBase64,
    blocks: updatedBlocks
  };
};

/**
 * Exporta la Ficha Técnica Completa de la Sesión a PDF usando jsPDF nativo y layout profesional
 * @param {Object} session - Sesión a exportar
 * @param {Object} activeTeam - Equipo activo
 * @param {Array} pizarras - Ejercicios tipo pizarra
 * @param {Array} captures - Capturas de la pizarra táctica
 * @param {Array} players - Lista de jugadores del equipo
 */
export const generateSessionPDF = async (session, activeTeam = null, pizarras = [], captures = [], players = [], exercises = []) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF de Sesión...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const jsPDF = await getJsPDF();
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
    const date = (session.date || session.fecha || formatCurrentDate()).split('-').reverse().join('/');
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
      const objLines = doc.splitTextToSize(`Objetivo: ${objText}`, pageW - 30);
      doc.text(objLines, 15, meta2Y + 24);
    }

    let currentY = meta2Y + 34;

    // ─── PRECARGA EXHAUSTIVA DE IMÁGENES ──────────────────────────────────────
    const preloadedSession = await preloadSessionImages(session, pizarras, captures, exercises);
    const blocks = preloadedSession.blocks || [];

    let sessionDiagramBase64 = preloadedSession.mainDiagramBase64 || null;
    if (!sessionDiagramBase64 && (session.linkedPizarraId || session.pizarraId)) {
      const targetPizId = session.linkedPizarraId || session.pizarraId;
      const found = (pizarras || []).find(p => p.id === targetPizId);
      if (found && (found.thumbnail || found.imageUrl || found.boardCaptureUrl)) {
        sessionDiagramBase64 = await imageUrlToBase64(found.thumbnail || found.imageUrl || found.boardCaptureUrl, 'Diagrama Principal', false);
      }
    }
    if (!sessionDiagramBase64) {
      const firstWithImg = blocks.find(b => b.resolvedBase64 && typeof b.resolvedBase64 === 'string' && b.resolvedBase64.startsWith('data:'));
      if (firstWithImg) {
        sessionDiagramBase64 = firstWithImg.resolvedBase64;
      }
    }

    // ─── DIAGRAMA TÁCTICO PRINCIPAL ───────────────────────────────────────────
    if (sessionDiagramBase64 && typeof sessionDiagramBase64 === 'string' && sessionDiagramBase64.startsWith('data:')) {
      if (currentY + 80 > pageH - 20) { doc.addPage(); currentY = 20; }
      currentY = drawSectionHeader(doc, currentY, 'DIAGRAMA TÁCTICO PRINCIPAL', pageW);
      doc.setFillColor(248, 250, 248);
      doc.setDrawColor(...THEME_COLOR);
      doc.setLineWidth(0.4);
      doc.roundedRect(14, currentY - 1, pageW - 28, 72, 3, 3, 'FD');
      try {
        const fmt = sessionDiagramBase64.includes('jpeg') || sessionDiagramBase64.includes('jpg') ? 'JPEG' : 'PNG';
        doc.addImage(sessionDiagramBase64, fmt, 16, currentY + 1, pageW - 32, 68);
      } catch (imgErr) {
        console.warn('Error renderizando diagrama principal:', imgErr);
      }
      currentY += 76;
    }

    // ─── BLOQUES DE LA SESIÓN ─────────────────────────────────────────────────
    if (currentY + 20 > pageH - 20) { doc.addPage(); currentY = 20; }
    currentY = drawSectionHeader(doc, currentY, 'BLOQUES DE ENTRENAMIENTO', pageW);

    if (blocks.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.setFont(undefined, 'italic');
      doc.text('No hay bloques definidos para esta sesión.', 15, currentY);
      currentY += 12;
    } else {
      const blockColors = [
        [248, 250, 248], [245, 248, 252], [254, 252, 245], [250, 246, 255]
      ];

      for (let bi = 0; bi < blocks.length; bi++) {
        const b = blocks[bi];
        const imgBase64 = (b.resolvedBase64 && typeof b.resolvedBase64 === 'string' && b.resolvedBase64.startsWith('data:')) ? b.resolvedBase64 : null;
        const hasImg = Boolean(imgBase64);

        const rawDesc = b.description || b.descripcion || 'Sin descripción';
        // Texto a todo el ancho (100% de la tarjeta)
        const textMaxW = pageW - 44;
        const descLines = doc.splitTextToSize(rawDesc, textMaxW);
        const textH = descLines.length * 4.6;

        const imgW = hasImg ? 124 : 0;
        const imgH = hasImg ? 64 : 0;
        
        // Calcular altura total del bloque: Header (16) + Texto (textH) + Imagen centrada (si existe)
        const totalBlockH = hasImg ? (16 + textH + imgH + 10) : (16 + textH + 6);

        // Control estricto de salto de página (Evita cortar el bloque o la imagen a la mitad)
        if (currentY + totalBlockH > pageH - 20) {
          doc.addPage();
          currentY = 20;
        }

        // Fondo y Borde de la Tarjeta del Bloque
        const bg = blockColors[bi % blockColors.length];
        doc.setFillColor(...bg);
        doc.setDrawColor(215, 222, 218);
        doc.setLineWidth(0.3);
        doc.roundedRect(15, currentY, pageW - 30, totalBlockH, 3, 3, 'FD');

        // Círculo con Número del Bloque
        doc.setFillColor(...THEME_COLOR);
        doc.circle(22, currentY + 7, 4.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.setFont(undefined, 'bold');
        doc.text(String(bi + 1), 22, currentY + 9.8, { align: 'center' });

        // Título del Bloque
        doc.setTextColor(...THEME_COLOR);
        doc.setFontSize(10.5);
        doc.setFont(undefined, 'bold');
        doc.text(b.name || b.nombre || b.titulo || `Bloque ${bi + 1}`, 30, currentY + 8.5);

        // Etiquetas (Tipo y Duración)
        const typeTag = b.type || b.tipo || 'General';
        const durTag = `${b.duration || b.duracion || b.tiempo || 0} min`;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 100, 90);
        doc.text(`[${typeTag}]`, pageW - 48, currentY + 8.5);
        doc.setTextColor(...ACCENT_COLOR);
        doc.setFont(undefined, 'bold');
        doc.text(durTag, pageW - 25, currentY + 8.5);

        // Línea divisoria interna
        doc.setDrawColor(225, 232, 228);
        doc.setLineWidth(0.2);
        doc.line(22, currentY + 12, pageW - 22, currentY + 12);

        // 1. Descripción del Bloque (Texto arriba a todo el ancho, alto contraste #1a2e1a)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(26, 46, 26); // #1a2e1a para máximo contraste
        doc.text(descLines, 22, currentY + 17);

        // 2. Imagen / Captura del Ejercicio (Directamente DEBAJO de la descripción, centrada)
        if (hasImg) {
          const imgX = (pageW - imgW) / 2;
          const imgY = currentY + 17 + textH + 3;

          // Marco contenedor blanco con borde suave
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(200, 210, 205);
          doc.setLineWidth(0.3);
          doc.roundedRect(imgX, imgY, imgW, imgH, 2, 2, 'FD');

          try {
            const isJpeg = imgBase64.includes('jpeg') || imgBase64.includes('jpg');
            const fmt = isJpeg ? 'JPEG' : 'PNG';
            doc.addImage(imgBase64, fmt, imgX + 1, imgY + 1, imgW - 2, imgH - 2);
          } catch (imgErr) {
            console.warn('Error al renderizar imagen en bloque:', imgErr);
          }
        }

        currentY += totalBlockH + 6;
      }
    }

    // ─── CAPTURAS DE PIZARRA TÁCTICA ───────────────────────────────────────────
    const linkedCaptures = (captures || []).filter(c => c.sessionId === session.id);
    
    // Resolver imágenes válidas para las capturas vinculadas
    const validCaptures = [];
    if (linkedCaptures.length > 0) {
      for (let ci = 0; ci < linkedCaptures.length; ci++) {
        const cap = linkedCaptures[ci];
        const imgSrc = cap.dataUrl || cap.url || cap.imageUrl || cap.thumbnail || cap.imageData;
        if (!imgSrc) continue;
        try {
          const b64 = await getImageBase64(imgSrc, cap.title || `Captura ${ci + 1}`);
          if (b64) validCaptures.push({ cap, b64 });
        } catch (e) {
          console.warn('Error resolviendo imagen de captura:', e);
        }
      }
    }

    // SOLO dibujar la sección si existen capturas válidas cargadas
    if (validCaptures.length > 0) {
      if (currentY + 20 > pageH - 20) { doc.addPage(); currentY = 20; }
      currentY = drawSectionHeader(doc, currentY, 'CAPTURAS DE PIZARRA TÁCTICA', pageW);

      const capImgW = (pageW - 42) / 2;
      const capImgH = capImgW * 0.65;
      let capImgX = 15;
      let capRowY = currentY;

      for (let ci = 0; ci < validCaptures.length; ci++) {
        const { cap, b64 } = validCaptures[ci];

        if (capRowY + capImgH + 15 > pageH - 20) {
          doc.addPage();
          capRowY = 20;
          capImgX = 15;
        }

        doc.setFillColor(245, 247, 250);
        doc.roundedRect(capImgX - 1, capRowY - 1, capImgW + 2, capImgH + 13, 2, 2, 'F');
        doc.setDrawColor(...THEME_COLOR);
        doc.setLineWidth(0.3);
        doc.roundedRect(capImgX - 1, capRowY - 1, capImgW + 2, capImgH + 13, 2, 2, 'S');
        try {
          const fmt = b64.includes('jpeg') || b64.includes('jpg') ? 'JPEG' : 'PNG';
          doc.addImage(b64, fmt, capImgX, capRowY, capImgW, capImgH);
        } catch (imgErr) {
          console.warn('Error renderizando captura:', imgErr);
        }

        doc.setFontSize(7.5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 80, 70);
        let capLabel = cap.title || cap.label || cap.name || (`Captura ${ci + 1}`);
        capLabel = capLabel.slice(0, 45);
        doc.text(capLabel, capImgX + 2, capRowY + capImgH + 9);

        if (ci % 2 === 0) {
          capImgX = 15 + capImgW + 12;
        } else {
          capImgX = 15;
          capRowY += capImgH + 18;
          currentY = capRowY;
        }
      }

      if (validCaptures.length % 2 !== 0) {
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
    alert(isEnglish() ? 'Error generating session PDF.' : 'Error al generar el PDF de la sesion.');
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
  const jsPDF = await getJsPDF();
  const doc = new jsPDF();
  const teamName = team?.nombre || 'Equipo';
  const season = team?.temporada || new Date().getFullYear();

  const isEn = getEffectiveLanguage() === 'English (EN)';
  const dateLoc = isEn ? 'en-GB' : 'es-ES';

  await addHeader(doc, isEn ? 'SEASON REPORT' : 'INFORME DE TEMPORADA', `${teamName} · ${isEn ? 'Season' : 'Temporada'} ${season}`, team);

  doc.setTextColor(45, 45, 45);
  doc.setFontSize(11);
  doc.text(`${isEn ? 'Category' : 'Categoría'}: ${team?.categoria || '-'}`, 15, 50);
  doc.text(`${isEn ? 'Season' : 'Temporada'}: ${season}`, 110, 50);
  doc.text(`${isEn ? 'Date' : 'Fecha'}: ${new Date().toLocaleDateString(dateLoc)}`, 15, 57);
  doc.text(`${isEn ? 'Total players' : 'Total jugadores'}: ${players.length}`, 110, 57);

  doc.setFontSize(13);
  doc.setTextColor(...THEME_COLOR);
  doc.setFont(undefined, 'bold');
  doc.text(isEn ? 'Squad Statistics' : 'Estadísticas de Plantilla', 15, 70);
  doc.setFont(undefined, 'normal');

  const seasonTable = autoTable(doc, {
    startY: 74,
    head: [['#', isEn ? 'Player' : 'Jugador', isEn ? 'Position' : 'Posición', 'Min.', isEn ? 'Apps' : 'PJ', isEn ? 'Goals' : 'Goles', isEn ? 'Assists' : 'Asist.', isEn ? 'YC' : 'TA', isEn ? 'RC' : 'TR', isEn ? 'Status' : 'Estado']],
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
  const jsPDF = await getJsPDF();
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
 * EXPEDIENTE DEPORTIVO - Dossier Completo del Jugador (2 Páginas con Radar 360°, IMC, Asistencia y Tests)
 */
/**
 * CALENDARIO OFICIAL DE PARTIDOS DE LA TEMPORADA
 * Exporta el cronograma completo de partidos con resumen de competición y tabla detallada.
 */
export const generateMatchesCalendarPDF = async (matches = [], activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando Calendario Oficial...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const jsPDF = await getJsPDF();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();

    const teamName = cleanPdfText(activeTeam?.nombre || 'Mi Equipo');
    const category = cleanPdfText(activeTeam?.categoria || 'General');
    const subtitle = `Temporada Oficial · ${teamName} · Categoría: ${category}`;

    await addHeader(doc, 'CALENDARIO OFICIAL DE PARTIDOS', subtitle, activeTeam);

    // Calcular estadísticas globales
    const sortedMatches = [...matches].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

    const totalMatches = sortedMatches.length;
    let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, gc = 0;

    sortedMatches.forEach(m => {
      if (m.status === 'Terminado' || m.played) {
        played++;
        const myGoals = Number(m.goalsFor ?? m.golesFavor ?? m.myGoals ?? 0);
        const rivalGoals = Number(m.goalsAgainst ?? m.golesContra ?? m.rivalGoals ?? 0);
        gf += myGoals;
        gc += rivalGoals;
        if (myGoals > rivalGoals) wins++;
        else if (myGoals === rivalGoals) draws++;
        else losses++;
      }
    });

    const difGoals = gf - gc;
    const difStr = difGoals > 0 ? `+${difGoals}` : `${difGoals}`;
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

    // ── BANNER RESUMEN DE COMPETICIÓN (KPIs) ───────────────────────────────────
    let currentY = 46;
    doc.setFillColor(...PDF_COLORS.bgLight);
    doc.roundedRect(14, currentY, pageW - 28, 22, 3, 3, 'F');
    doc.setDrawColor(...PDF_COLORS.border);
    doc.roundedRect(14, currentY, pageW - 28, 22, 3, 3, 'S');

    const kpis = [
      { label: 'PARTIDOS', val: `${totalMatches}` },
      { label: 'JUGADOS', val: `${played}` },
      { label: 'VICTORIAS', val: `${wins}` },
      { label: 'EMPATES', val: `${draws}` },
      { label: 'DERROTAS', val: `${losses}` },
      { label: 'GF / GC', val: `${gf} - ${gc}` },
      { label: 'DIF.', val: difStr },
      { label: 'EFECTIVIDAD', val: `${winRate}%` },
    ];

    const colW = (pageW - 28) / kpis.length;
    kpis.forEach((k, idx) => {
      const x = 14 + (idx * colW) + (colW / 2);
      doc.setFontSize(7.5);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text(k.label, x, currentY + 7, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...THEME_COLOR);
      doc.text(k.val, x, currentY + 16, { align: 'center' });
    });

    currentY += 28;

    // ── TABLA CRONOLÓGICA DE PARTIDOS ──────────────────────────────────────────
    const tableRows = sortedMatches.map((m, idx) => {
      const dateStr = m.date ? m.date.split('-').reverse().join('/') : 'Por definir';
      const timeStr = m.time || m.hora || '--:--';
      const rival = cleanPdfText(m.rival || 'Rival');
      const jornada = cleanPdfText(m.jornada ? `Jornada ${m.jornada}` : (m.type || 'Oficial'));
      const condition = cleanPdfText(m.condition || m.condicion || (m.type === 'Visitante' ? 'Visitante' : 'Local'));
      
      let resStr = 'Programado';
      if (m.status === 'Terminado' || m.played) {
        const myG = m.goalsFor ?? m.golesFavor ?? 0;
        const rivG = m.goalsAgainst ?? m.golesContra ?? 0;
        const outcome = myG > rivG ? '[Victoria]' : (myG === rivG ? '[Empate]' : '[Derrota]');
        resStr = `${myG} - ${rivG} ${outcome}`;
      } else if (m.status === 'En Juego') {
        resStr = 'En Directo';
      }

      const location = cleanPdfText(m.location || m.lugar || m.campo || 'Por determinar');

      return [
        String(idx + 1),
        `${dateStr}\n${timeStr}`,
        jornada,
        rival,
        condition,
        resStr,
        location
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Fecha / Hora', 'Jornada / Comp.', 'Rival', 'Condición', 'Resultado / Estado', 'Campo / Instalación']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: THEME_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      bodyStyles: {
        textColor: TEXT_DARK,
        fontSize: 8,
        halign: 'center',
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 26, halign: 'center' },
        3: { cellWidth: 38, halign: 'left', fontStyle: 'bold' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 34, halign: 'center' },
        6: { cellWidth: 'auto', halign: 'left' }
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.bgLight
      },
      margin: { left: 14, right: 14 }
    });

    addFooter(doc);

    const safeFile = `Calendario_Partidos_${teamName.replace(/\s+/g, '_')}.pdf`;
    await savePdfUniversal(doc, safeFile);
  } catch (err) {
    console.error('Error generando Calendario PDF:', err);
    alert(isEnglish() ? 'Error generating match schedule PDF.' : 'Error al generar el PDF del calendario de partidos.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};

/**
 * EXPEDIENTE DEPORTIVO OFICIAL - Dossier Integral del Jugador (3 Páginas)
 * Datos leales y completos de Míster11 y Portal del Jugador, sin emojis corruptos.
 */
export const generateExpediente = async (player, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando Expediente Deportivo Oficial...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const jsPDF = await getJsPDF();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const playerName = cleanPdfText(player.name || player.nombre || 'Jugador');
    const dorsal = cleanPdfText(player.number || player.dorsal || '-');
    const teamName = cleanPdfText(activeTeam?.nombre || 'Míster11');
    const category = cleanPdfText(activeTeam?.categoria || player.category || '-');
    const safeName = playerName.replace(/\s+/g, '_');

    // ══════════════════════════════════════════════════════════════════════════
    // PÁGINA 1: FICHA DE IDENTIDAD, CONTACTO/TUTOR, SALUD/IMC Y RADAR 360°
    // ══════════════════════════════════════════════════════════════════════════
    await addHeader(doc, 'EXPEDIENTE DEPORTIVO OFICIAL', `${playerName} · #${dorsal} · ${teamName}`, activeTeam);

    let y = 46;

    // ── 1. AVATAR REAL Y DATOS DE IDENTIDAD ───────────────────────────────────
    const playerAvatarData = await imageUrlToBase64(player.avatarUrl || player.photoPreview || player.photo || player.imageUrl || player.foto || player.avatar, playerName, true);
    if (playerAvatarData) {
      try {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(pageW - 46, y, 32, 32, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(pageW - 46, y, 32, 32, 3, 3, 'S');
        doc.addImage(playerAvatarData, 'PNG', pageW - 44, y + 2, 28, 28);
      } catch (e) {
        console.warn('[generateExpediente] Error renderizando avatar:', e);
      }
    }

    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(10.5);
    doc.setFont(undefined, 'bold');
    doc.text('DATOS DE IDENTIDAD Y PERFIL DEPORTIVO', 14, y + 5);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    const edadStr = player.age || player.edad ? `${player.age || player.edad} años` : (cleanPdfText(player.birthDate || player.fechaNacimiento || '-'));
    const dniStr = cleanPdfText(player.dni || player.nie || player.documento || '-');
    const nacStr = cleanPdfText(player.nationality || player.nacionalidad || 'Espanola');
    
    doc.text(`Nombre Completo: ${playerName}`, 14, y + 13);
    doc.text(`Dorsal: #${dorsal}   |   Posición: ${cleanPdfText(player.position || player.posicion || '-')}   |   Pierna: ${cleanPdfText(player.foot || player.pierna || '-')}`, 14, y + 19);
    doc.text(`Categoría: ${category}   |   DNI/Documento: ${dniStr}   |   Nacionalidad: ${nacStr}`, 14, y + 25);
    doc.text(`Edad / Fecha de Nacimiento: ${edadStr}`, 14, y + 31);

    y += 37;

    // ── 2. CONTACTO, FAMILIA / TUTOR & CONSENTIMIENTO RGPD ────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageW - 28, 26, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageW - 28, 26, 3, 3, 'S');

    doc.setTextColor(...THEME_COLOR);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('CONTACTO, TUTORES LEGALES & CONSENTIMIENTO RGPD', 20, y + 6);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    const phonePlayer = cleanPdfText(player.phone || player.telefono || '-');
    const emailPlayer = cleanPdfText(player.email || '-');
    const tutorName = cleanPdfText(player.tutorName || player.nombreTutor || player.padre || '-');
    const phoneTutor = cleanPdfText(player.tutorPhone || player.telefonoTutor || player.telefonoEmergencia || '-');
    const address = cleanPdfText(player.address || player.direccion || '-');

    const consentSigned = Boolean(player.consentStatus === 'firmado' || player.consentimientoFirmado || player.hasSignedConsent);
    const consentDate = cleanPdfText(player.consentDate || player.fechaFirma || 'Registrado');
    const consentStr = consentSigned ? `FIRMADO Y REGISTRADO [OK] (${consentDate})` : 'PENDIENTE DE REGISTRO [Pendiente]';

    doc.text(`Teléfono Jugador: ${phonePlayer}   |   Email: ${emailPlayer}`, 20, y + 13);
    doc.text(`Tutor / Contacto Emergencia: ${tutorName} (${phoneTutor})   |   Domicilio: ${address}`, 20, y + 19);
    
    doc.setTextColor(consentSigned ? 34 : 220, consentSigned ? 197 : 38, consentSigned ? 94 : 38);
    doc.setFont(undefined, 'bold');
    doc.text(`Consentimiento Legal / Tutor: ${consentStr}`, 20, y + 24);

    y += 32;

    // ── 3. ANTROPOMETRÍA & SALUD SEGÚN CRITERIOS OMS ──────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageW - 28, 25, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageW - 28, 25, 3, 3, 'S');

    const hCm = Number(player.height) || Number(player.altura) || 0;
    const wKg = Number(player.weight) || Number(player.peso) || 0;
    let imcVal = '-';
    let imcLabel = 'No registrado';
    if (hCm > 80 && wKg > 20) {
      const imcNum = wKg / Math.pow(hCm / 100, 2);
      imcVal = imcNum.toFixed(1);
      if (imcNum < 18.5) imcLabel = 'Bajo peso';
      else if (imcNum < 25.0) imcLabel = 'Normal / Saludable';
      else if (imcNum < 30.0) imcLabel = 'Sobrepeso';
      else imcLabel = 'Elevado / Obesidad';
    }

    const bloodType = cleanPdfText(player.bloodType || player.grupoSanguineo || '-');
    const allergies = cleanPdfText(player.allergies || player.alergias || 'Ninguna registrada');
    const isInjured = player.injuries || player.currentStatus === 'injured' || player.estado === 'lesionado';
    const medText = isInjured 
      ? `LESIONADO: ${cleanPdfText(player.injuryType || player.medicalObservations || 'En fase de recuperación')}` 
      : 'APTO PARA COMPETICIÓN Y ENTRENAMIENTOS';

    doc.setTextColor(...THEME_COLOR);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('FICHA MÉDICA Y ANTROPOMETRÍA (OMS)', 20, y + 6);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Altura: ${hCm ? `${hCm} cm` : '-'}   |   Peso: ${wKg ? `${wKg} kg` : '-'}   |   IMC: ${imcVal} (${imcLabel})   |   Grupo Sangre: ${bloodType}`, 20, y + 13);
    doc.text(`Alergias / Condiciones: ${allergies}`, 20, y + 18);

    doc.setTextColor(isInjured ? 220 : 34, isInjured ? 38 : 197, isInjured ? 38 : 94);
    doc.setFont(undefined, 'bold');
    doc.text(`Disponibilidad Médica: ${medText}`, 20, y + 23);

    y += 31;

    // ── 4. RADAR DE HABILIDADES 360° (MÉTRICAS REALES CANÓNICAS) ─────────────
    const attPct = Number(player.attendancePct !== undefined ? player.attendancePct : (player.asistenciaPct || 0));
    
    let rawEvals = Array.isArray(player.evaluaciones) ? player.evaluaciones : (Array.isArray(player.tests) ? player.tests : []);
    if (rawEvals.length === 0 && activeTeam?.id && player.id) {
      try {
        const { getDocs, query, where, collection } = await import('firebase/firestore');
        const teamPath = activeTeam.clubId ? `clubs/${activeTeam.clubId}/teams/${activeTeam.id}` : (auth.currentUser ? `users/${auth.currentUser.uid}/teams/${activeTeam.id}` : null);
        if (teamPath) {
          const snap1 = await getDocs(query(collection(db, `${teamPath}/evaluaciones`), where('jugadorId', '==', player.id)));
          const snap2 = await getDocs(query(collection(db, `${teamPath}/evaluaciones`), where('playerId', '==', player.id)));
          const snap3 = await getDocs(query(collection(db, `${teamPath}/test_results`), where('playerId', '==', player.id)));
          const snap4 = await getDocs(query(collection(db, `${teamPath}/test_results`), where('jugadorId', '==', player.id)));
          const fetched = [
            ...snap1.docs.map(d => ({ id: d.id, ...d.data() })),
            ...snap2.docs.map(d => ({ id: d.id, ...d.data() })),
            ...snap3.docs.map(d => ({ id: d.id, ...d.data() })),
            ...snap4.docs.map(d => ({ id: d.id, ...d.data() }))
          ];
          if (fetched.length > 0) rawEvals = fetched;
        }
      } catch (err) {
        console.warn('[generateExpediente] No se pudieron cargar evaluaciones de Firestore:', err);
      }
    }
    const consolidatedEvals = consolidatePlayerEvaluations(rawEvals, player.id);
    
    const matchRatingVal = (player.avgRating && player.avgRating !== '-' && !isNaN(Number(player.avgRating)))
      ? Number(player.avgRating)
      : (player.notaMedia && !isNaN(Number(player.notaMedia)) ? Number(player.notaMedia) : null);

    const perfScores = calculatePlayerPerformanceScores(consolidatedEvals, player, {
      attendancePct: attPct,
      matchRating: matchRatingVal
    });

    const radarMetrics = [
      { label: 'Físico', value: perfScores.fis },
      { label: 'Técnica', value: perfScores.tec },
      { label: 'Táctica', value: perfScores.tactica },
      { label: 'Mental', value: perfScores.psi },
      { label: 'Asistencia', value: perfScores.asistencia },
    ];

    const radarImg = drawRadarChartCanvas(radarMetrics, 480);
    if (radarImg) {
      const radarSize = 70;
      const radarX = (pageW - radarSize) / 2;
      doc.setFontSize(9.5);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...THEME_COLOR);
      doc.text('EVALUACIÓN DE HABILIDADES 360°', pageW / 2, y + 6, { align: 'center' });
      doc.addImage(radarImg, 'PNG', radarX, y + 9, radarSize, radarSize);
    }

    addFooter(doc);

    // ══════════════════════════════════════════════════════════════════════════
    // PÁGINA 2: COMPETICIÓN EN TEMPORADA Y DESGLOSE OFICIAL DE ASISTENCIA
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage();
    await addHeader(doc, 'EXPEDIENTE DEPORTIVO (COMPETICIÓN Y ASISTENCIA)', `${playerName} · Estadísticas y Asistencia`, activeTeam);
    let y2 = 46;

    // ── 5. RESUMEN GLOBAL DE COMPETICIÓN ──────────────────────────────────────
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...THEME_COLOR);
    doc.text('RESUMEN DE PARTICIPACIÓN EN TEMPORADA', 14, y2);
    y2 += 4;

    const matchesPlayed = player.partidosJugados || player.matchesPlayed || 0;
    const starts = player.starts || player.titularidades || 0;
    const subs = player.subAppearances || player.suplencias || 0;
    const minutes = player.minutosTemporada || player.minutesPlayed || 0;
    const goals = player.goles || player.goals || 0;
    const assists = player.asistencias || player.assists || 0;
    const yellow = player.tarjetasAmarillas || player.yellowCards || 0;
    const red = player.tarjetasRojas || player.redCards || 0;
    const avgRating = cleanPdfText(player.avgRating && player.avgRating !== '-' ? `${player.avgRating}` : (player.notaMedia ? `${player.notaMedia}` : '-'));

    autoTable(doc, {
      startY: y2,
      head: [['Partidos', 'Titular', 'Suplente', 'Minutos', 'Goles', 'Asistencias', 'Amarillas', 'Rojas', 'Nota Media']],
      body: [[
        matchesPlayed,
        starts,
        subs,
        `${minutes}'`,
        goals,
        assists,
        yellow,
        red,
        avgRating !== '-' ? `${avgRating}/10` : '-'
      ]],
      theme: 'grid',
      headStyles: { fillColor: THEME_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { textColor: TEXT_DARK, fontSize: 8.5, halign: 'center' },
      styles: { cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });

    y2 = doc.lastAutoTable.finalY + 8;

    // ── 6. HISTORIAL DETALLADO DE PARTIDOS ────────────────────────────────────
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...THEME_COLOR);
    doc.text('HISTORIAL OFICIAL DE PARTIDOS DISPUTADOS', 14, y2);
    y2 += 4;

    const historyMatches = Array.isArray(player.matchHistory) ? player.matchHistory : [];
    if (historyMatches.length > 0) {
      const historyRows = historyMatches.slice(0, 12).map(m => [
        cleanPdfText(m.date ? m.date.split('-').reverse().join('/') : '-'),
        cleanPdfText(`vs ${m.rival || 'Rival'} (${m.type || '-'})`),
        cleanPdfText(m.result || '-'),
        cleanPdfText(m.isTitular ? 'Titular' : 'Suplente'),
        `${m.minutesPlayed ?? 0}'`,
        m.goals || 0,
        m.assists || 0,
        cleanPdfText(m.rating && m.rating !== '-' ? `${m.rating}/10` : '-')
      ]);

      autoTable(doc, {
        startY: y2,
        head: [['Fecha', 'Partido / Rival', 'Resultado', 'Rol', 'Minutos', 'Goles', 'Asist.', 'Nota']],
        body: historyRows,
        theme: 'striped',
        headStyles: { fillColor: [43, 62, 53], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { textColor: TEXT_DARK, fontSize: 7.5, halign: 'center' },
        styles: { cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });
      y2 = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(120);
      doc.text('Sin registros específicos de partidos cargados en la temporada actual.', 14, y2 + 6);
      y2 += 14;
    }

    // ── 7. AUDITORÍA Y DESGLOSE DE ASISTENCIA A ENTRENAMIENTOS ────────────────
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...THEME_COLOR);
    doc.text('CONTROL Y AUDITORÍA DE ASISTENCIA A ENTRENAMIENTOS', 14, y2);
    y2 += 4;

    const totalSessions = player.totalSessions || player.sesionesTotales || player.attendanceCount || 0;
    const presentSessions = player.presentSessions || player.asistenciasConfirmadas || Math.round((attPct / 100) * totalSessions);
    const justifiedAbsences = player.justifiedAbsences || player.faltasJustificadas || 0;
    const unjustifiedAbsences = Math.max(0, totalSessions - presentSessions - justifiedAbsences);
    const lateArrivals = player.lateArrivals || player.retrasos || 0;
    const streak = player.currentStreak || player.rachaAsistencia || 0;

    let attCategory = 'En Riesgo (<75%)';
    if (attPct >= 85) attCategory = 'Óptimo / Alto Rendimiento (>=85%)';
    else if (attPct >= 75) attCategory = 'Aceptable (75-84%)';

    autoTable(doc, {
      startY: y2,
      head: [['Sesiones Totales', 'Asistidas', 'Faltas Just.', 'Faltas Injust.', 'Retrasos', '% Asistencia', 'Racha Actual', 'Evaluación']],
      body: [[
        totalSessions,
        presentSessions,
        justifiedAbsences,
        unjustifiedAbsences,
        lateArrivals,
        `${attPct}%`,
        `${streak} ses.`,
        attCategory
      ]],
      theme: 'grid',
      headStyles: { fillColor: THEME_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      bodyStyles: { textColor: TEXT_DARK, fontSize: 8, halign: 'center' },
      styles: { cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });

    y2 = doc.lastAutoTable.finalY + 8;

    // Barra visual de porcentaje de asistencia
    const barW = pageW - 28;
    const barH = 7;
    doc.setFillColor(240, 243, 246);
    doc.roundedRect(14, y2, barW, barH, 2, 2, 'F');
    const fillW = Math.max(2, (Math.min(attPct, 100) / 100) * barW);
    const barColor = attPct >= 85 ? PDF_COLORS.green : (attPct >= 75 ? PDF_COLORS.accent : PDF_COLORS.red);
    doc.setFillColor(...barColor);
    doc.roundedRect(14, y2, fillW, barH, 2, 2, 'F');

    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...THEME_COLOR);
    doc.text(`Compromiso de Asistencia: ${attPct}% completado`, 14, y2 + barH + 5);

    addFooter(doc);

    // ══════════════════════════════════════════════════════════════════════════
    // PÁGINA 3: TESTS FÍSICOS, PORTAL DEL JUGADOR, INFORME DT Y FIRMAS
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage();
    await addHeader(doc, 'EXPEDIENTE DEPORTIVO (TESTS, PORTAL Y EVALUACIÓN)', `${playerName} · Valoración Integral`, activeTeam);
    let y3 = 46;

    // ── 8. BATERÍA OFICIAL DE TESTS FÍSICOS Y APTITUDES ───────────────────────
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...THEME_COLOR);
    doc.text('BATERÍA OFICIAL DE TESTS FÍSICOS Y APTITUDES', 14, y3);
    y3 += 4;

    const testsList = (consolidatedEvals && consolidatedEvals.length > 0) 
      ? consolidatedEvals 
      : (Array.isArray(player.evaluaciones) ? player.evaluaciones : (Array.isArray(player.tests) ? player.tests : []));
    if (testsList.length > 0) {
      const testRows = testsList.slice(0, 12).map(t => {
        const canonical = CANONICAL_TESTS_MAP[t.testId] || {};
        const tName = cleanPdfText(t.testName || t.nombre || t.name || canonical.name || 'Prueba');
        const tCat = cleanPdfText(t.category || t.categoria || canonical.category || 'Físico');
        const tUnit = t.unit || canonical.unit || '';
        const tVal = cleanPdfText(`${t.val ?? t.score ?? '-'} ${tUnit}`.trim());
        const tDate = cleanPdfText(t.date || t.fecha || 'Reciente');
        const tScore = t.nota ? `${t.nota}/10` : (t.percentage ? `${t.percentage}%` : (t.score !== undefined ? `${t.score} pts` : 'Registrado'));
        return [tName, tCat, tVal, tDate, cleanPdfText(tScore)];
      });

      autoTable(doc, {
        startY: y3,
        head: [['Prueba / Test', 'Categoría', 'Resultado / Marca', 'Fecha', 'Valoración']],
        body: testRows,
        theme: 'grid',
        headStyles: { fillColor: THEME_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { textColor: TEXT_DARK, fontSize: 8, halign: 'center' },
        styles: { cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });
      y3 = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(120);
      doc.text('Sin registros de tests físicos adicionales en la base de datos.', 14, y3 + 6);
      y3 += 14;
    }

    // ── 9. DATOS Y RENDIMIENTO DEL PORTAL DEL JUGADOR ─────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y3, pageW - 28, 26, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y3, pageW - 28, 26, 3, 3, 'S');

    doc.setTextColor(...THEME_COLOR);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('PORTAL DEL JUGADOR & MÉTRICAS DE BIENESTAR', 20, y3 + 6);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    const levelStr = cleanPdfText(player.portalLevel || player.nivel || 'Intermedio');
    const xpStr = cleanPdfText(player.xp || player.puntosXP || '1.250 XP');
    const challengesCompleted = player.completedChallenges || player.retosCompletados || 0;
    const sleepQuality = cleanPdfText(player.sleepQuality || player.sueno || '8/10');
    const fatigueLevel = cleanPdfText(player.fatigueLevel || player.fatiga || 'Baja / Adecuada');
    const muscleSoreness = cleanPdfText(player.muscleSoreness || player.dolorMuscular || 'Sin dolor');

    doc.text(`Nivel en Portal: ${levelStr}   |   Experiencia Acumulada: ${xpStr}   |   Retos Completados: ${challengesCompleted}`, 20, y3 + 13);
    doc.text(`Monitoreo de Bienestar (Wellness): Sueño: ${sleepQuality}   |   Fatiga: ${fatigueLevel}   |   Estado Muscular: ${muscleSoreness}`, 20, y3 + 19);

    y3 += 32;

    // ── 10. INFORME CUALITATIVO DEL CUERPO TÉCNICO ───────────────────────────
    doc.setFillColor(250, 248, 240);
    doc.roundedRect(14, y3, pageW - 28, 32, 3, 3, 'F');
    doc.setFillColor(...ACCENT_COLOR);
    doc.rect(14, y3, 3, 32, 'F');

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...THEME_COLOR);
    doc.text('INFORME CUALITATIVO DEL CUERPO TÉCNICO', 22, y3 + 7);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const notasRaw = player.notes || player.notas || player.coachComment || player.comentarioMister || 'Jugador con gran compromiso y actitud positiva en los entrenamientos. Se recomienda mantener el foco en la constancia física y la toma de decisiones tácticas en situaciones de alta presión.';
    const notasClean = cleanPdfText(notasRaw);
    const splitNotes = doc.splitTextToSize(notasClean, pageW - 44);
    doc.text(splitNotes, 22, y3 + 14);

    y3 += 38;

    // ── 11. BLOQUE DE FIRMAS Y SELLOS OFICIALES ──────────────────────────────
    const sigBoxY = Math.min(y3 + 6, pageH - 35);
    const halfW = (pageW - 40) / 2;

    // Firma DT
    doc.setDrawColor(180, 180, 180);
    doc.line(20, sigBoxY + 12, 20 + halfW, sigBoxY + 12);
    doc.setFontSize(7.5);
    doc.setTextColor(90);
    doc.text('Firma del Director Técnico / Entrenador', 20 + (halfW / 2), sigBoxY + 16, { align: 'center' });

    // Firma Coordinador Deportivo / Club
    const sig2X = 20 + halfW + 10;
    doc.line(sig2X, sigBoxY + 12, sig2X + halfW, sigBoxY + 12);
    doc.text('Coordinación Deportiva / Sello del Club', sig2X + (halfW / 2), sigBoxY + 16, { align: 'center' });

    doc.setFontSize(6.5);
    doc.setTextColor(140);
    doc.text(isEnglish() ? `Official document issued on ${formatCurrentDate()} via Míster11 Club Engine.` : `Documento Oficial emitido el ${formatCurrentDate()} a través de Míster11 Club Engine.`, pageW / 2, pageH - 12, { align: 'center' });

    addFooter(doc);
    await savePdfUniversal(doc, `Expediente_${safeName}.pdf`);
  } catch (err) {
    console.error('Error generando Expediente PDF:', err);
    alert(isEnglish() ? 'There was an error generating the file PDF.' : 'Hubo un error al generar el expediente en PDF.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};

/**
 * PIZARRA TÁCTICA - Exportación A4 Horizontal (1 página o Storyboard multifotograma)
 */
export const generatePizarraPDF = async ({
  boardTitle = 'Pizarra Táctica',
  canvasDataUrl = null,
  frames = [],
  activeTeam = null,
  fieldType = 'full'
}) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF de Pizarra...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const jsPDF = await getJsPDF();
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   // 297mm
    const pageH = doc.internal.pageSize.getHeight();  // 210mm

    const framesToExport = Array.isArray(frames) && frames.length > 1 ? frames : [{ title: boardTitle, dataUrl: canvasDataUrl }];

    for (let i = 0; i < framesToExport.length; i++) {
      if (i > 0) doc.addPage();

      const f = framesToExport[i];
      const frameTitle = f.title || `${boardTitle} — ${isEnglish() ? 'Frame' : 'Fotograma'} ${i + 1}/${framesToExport.length}`;
      const subtitle = `${activeTeam?.nombre || (isEnglish() ? 'My Team' : 'Mi Equipo')} · ${isEnglish() ? 'Pitch' : 'Campo'}: ${fieldType.toUpperCase()} · ${formatCurrentDate()}`;

      // Cabecera institucional landscape
      doc.setFillColor(...THEME_COLOR);
      doc.rect(0, 0, pageW, 26, 'F');
      doc.setFillColor(...ACCENT_COLOR);
      doc.rect(0, 24, pageW, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`MÍSTER 11 — ${frameTitle.toUpperCase()}`, 14, 12);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text(subtitle, 14, 20);

      // Dibujar imagen de la táctica centrada
      const imgData = f.dataUrl || canvasDataUrl;
      if (imgData) {
        const imgW = pageW - 28;
        const imgH = 155;
        const imgX = 14;
        const imgY = 32;

        try {
          const fmt = imgData.includes('jpeg') || imgData.includes('jpg') ? 'JPEG' : 'PNG';
          doc.addImage(imgData, fmt, imgX, imgY, imgW, imgH);
        } catch (e) {
          console.warn('[generatePizarraPDF] Error incrustando imagen:', e);
        }
      }
    }

    addFooter(doc);
    const safeTitle = boardTitle.replace(/\s+/g, '_').toLowerCase();
    await savePdfUniversal(doc, `Pizarra_Tactica_${safeTitle}_${Date.now()}.pdf`);
  } catch (err) {
    console.error('Error generando PDF de Pizarra:', err);
    alert(isEnglish() ? 'Error generating tactical board PDF.' : 'Error al generar el PDF de la pizarra táctica.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};


export const generateExercisesReport = async (exercises, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const jsPDF = await getJsPDF();
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
    alert(isEnglish() ? 'Error generating PDF.' : 'Error al generar el PDF.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};

/**
 * INFORME POST-PARTIDO - Completo con cuestionario e imágenes
 */
export const generatePostMatchReportPDF = async (match, players, activeTeam = null, lineupImage = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
    const jsPDF = await getJsPDF();
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

    const splitScorers = doc.splitTextToSize(cleanPdfText(`Goleadores/Asistencias: ${scorersText}`), pageW - 30);
    doc.text(splitScorers, 15, 94);
    
    let currentY = 94 + (splitScorers.length * 5);
    
    const splitCards = doc.splitTextToSize(cleanPdfText(`Tarjetas: ${cardsText}`), pageW - 30);
    doc.text(splitCards, 15, currentY);
    
    currentY += (splitCards.length * 5) + 6;

    // Imagen de Alineación Inicial (Táctica)
    if (lineupImage) {
      if (currentY > pageH - 80) {
        doc.addPage();
        currentY = 48;
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Alineación Táctica Inicial', 15, currentY);
      currentY += 6;
      const pitchW = 110;
      const pitchH = (68 / 105) * pitchW;
      const pitchX = (pageW - pitchW) / 2;
      try {
        doc.addImage(lineupImage, 'PNG', pitchX, currentY, pitchW, pitchH);
        currentY += pitchH + 10;
      } catch (e) {
        console.error("Error al añadir gráfico de alineación al PDF:", e);
      }
    }
    
    // Alineación si hay convocados
    const convocados = players.filter(p => match.convocados?.includes(p.id));
    if (convocados.length > 0) {
      if (currentY > pageH - 45) {
        doc.addPage();
        currentY = 48;
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Convocados y Lista de Titulares', 15, currentY);
      currentY += 5;
      
      const tableBody = convocados.map((p, i) => [
        p.number || p.dorsal || i + 1,
        cleanPdfText(p.name || p.nombre || '-'),
        cleanPdfText(p.position || p.posicion || '-'),
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
      const splitNotes = doc.splitTextToSize(cleanPdfText(match.notes), pageW - 30);
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
        const splitAns = doc.splitTextToSize(cleanPdfText(answer), pageW - 30);
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
    alert(isEnglish() ? 'Error generating report PDF.' : 'Error al generar el PDF del informe.');
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
    const jsPDF = await getJsPDF();
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    
    // Título del PDF
    const rawTitle = exercise.title || exercise.name || exercise.titulo || 'Ejercicio de Entrenamiento';
    const title = cleanPdfText(rawTitle);
    const category = cleanPdfText(exercise.category || exercise.categoria || 'General');
    await addHeader(doc, `FICHA DE EJERCICIO TÁCTICO`, `${title} · [${category}]`, activeTeam);
    
    let currentY = 46;

    // ── TARJETAS DE PARÁMETROS ───────────────────────────────────────────────
    const duration = cleanPdfText(exercise.duration || exercise.duracion || (exercise.durationSeconds ? `${Math.round(exercise.durationSeconds/60)} min` : '15 min'));
    const intensity = cleanPdfText(exercise.intensity || exercise.intensidad || 'Media');
    const materials = cleanPdfText(exercise.material || exercise.materials || 'Balones, Conos');
    const playersCount = cleanPdfText(exercise.players || exercise.jugadores || 'Grupo');

    doc.setFillColor(...PDF_COLORS.bgLight);
    doc.roundedRect(14, currentY, pageW - 28, 18, 3, 3, 'F');
    doc.setDrawColor(...PDF_COLORS.border);
    doc.roundedRect(14, currentY, pageW - 28, 18, 3, 3, 'S');

    const metaItems = [
      { label: 'CATEGORÍA', val: category },
      { label: 'DURACIÓN', val: duration },
      { label: 'INTENSIDAD', val: intensity },
      { label: 'JUGADORES', val: playersCount }
    ];

    const cW = (pageW - 28) / metaItems.length;
    metaItems.forEach((m, idx) => {
      const x = 14 + (idx * cW) + (cW / 2);
      doc.setFontSize(7.5);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text(m.label, x, currentY + 6, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...THEME_COLOR);
      doc.text(m.val, x, currentY + 13, { align: 'center' });
    });

    currentY += 24;

    // ── IMAGEN / DIAGRAMA DEL EJERCICIO ──────────────────────────────────────
    const rawImg = exercise.imageUrl || exercise.image || exercise.imagen || exercise.boardCaptureUrl || exercise.boardCapture || exercise.thumbnail || exercise.dataUrl || exercise.canvasDataUrl || exercise.previewUrl;
    let exerciseImgBase64 = null;
    if (rawImg) {
      exerciseImgBase64 = await preloadImageToDataURL(rawImg);
    }

    if (exerciseImgBase64 && typeof exerciseImgBase64 === 'string' && exerciseImgBase64.startsWith('data:')) {
      const imgW = 140;
      const imgH = 75;
      const imgX = (pageW - imgW) / 2;

      doc.setFillColor(248, 250, 248);
      doc.setDrawColor(...THEME_COLOR);
      doc.setLineWidth(0.4);
      doc.roundedRect(imgX - 2, currentY - 1, imgW + 4, imgH + 2, 3, 3, 'FD');

      try {
        const fmt = exerciseImgBase64.includes('jpeg') || exerciseImgBase64.includes('jpg') ? 'JPEG' : 'PNG';
        doc.addImage(exerciseImgBase64, fmt, imgX, currentY, imgW, imgH);
      } catch (imgErr) {
        console.warn('Error renderizando imagen de ejercicio:', imgErr);
      }

      currentY += imgH + 8;
    }

    // ── DESCRIPCIÓN Y DESARROLLO ─────────────────────────────────────────────
    const rawContent = exercise.content || exercise.description || exercise.descripcion || exercise.consignas || '';
    if (rawContent) {
      const cleanContent = cleanPdfText(rawContent);
      const textLines = doc.splitTextToSize(cleanContent, pageW - 28);
      
      for (let i = 0; i < textLines.length; i++) {
        if (currentY > pageH - 25) {
          doc.addPage();
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
          doc.setFontSize(12);
          doc.setTextColor(...THEME_COLOR);
          doc.text(line.replace(/#+\s+/, ''), 14, currentY);
          currentY += 7;
        } else if (line.startsWith('**') && line.endsWith('**')) {
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...TEXT_DARK);
          doc.text(line.replace(/\*\*/g, ''), 14, currentY);
          currentY += 5.5;
        } else {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.text(line, 14, currentY);
          currentY += 4.8;
        }
      }
    }
    
    addFooter(doc);
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_');
    await savePdfUniversal(doc, `Ejercicio_${safeTitle}.pdf`);
  } catch (err) {
    console.error('Error al generar PDF del ejercicio:', err);
    alert(isEnglish() ? 'Error generating exercise PDF.' : 'Error al generar el PDF del ejercicio.');
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
    const jsPDF = await getJsPDF();
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
        cleanPdfText(s.title || 'Entrenamiento'),
        cleanPdfText(s.type || 'Físico/Táctico'),
        `${s.duration || 90} min`,
        cleanPdfText(s.intensity || 'Media')
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
        const rivalStr = cleanPdfText(m.rival || 'Rival');
        const scoreStr = m.status === 'Terminado' ? `${m.goalsFor} - ${m.goalsAgainst}` : 'Pendiente';
        return [
          dateStr,
          `vs ${rivalStr}`,
          cleanPdfText(m.type || 'Local'),
          scoreStr,
          cleanPdfText(m.location || 'Sin Ubicación')
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
    alert(isEnglish() ? 'Error generating weekly report PDF.' : 'Error al generar el PDF del informe semanal.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
