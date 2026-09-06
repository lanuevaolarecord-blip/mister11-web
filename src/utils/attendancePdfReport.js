import { savePdfUniversal } from './pdfGenerator';
import { getEffectiveLanguage } from '../i18n/translations';
import { drawPdfFooter, cleanPdfText, imageUrlToBase64, PDF_COLORS } from './pdfTheme';
import { calculateSquadAveragePct } from './attendanceMath';

const getPdfLibs = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.default || autoTableMod;
  return { jsPDF, autoTable };
};

/**
 * Renderiza la gráfica de evolución temporal de asistencia en un canvas en alta resolución (2x).
 * Incluye serie de Asistencia Real (verde), Ausencias (rojo), Tardanzas (naranja) y la línea del 70% de alerta.
 */
const drawAttendanceTrendChartCanvas = (trendData = [], threshold = 70, isEn = false, width = 760, height = 300) => {
  try {
    const scale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo blanco con esquinas redondeadas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Marco sutil exterior
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    const padL = 48;
    const padR = 24;
    const padT = 42;
    const padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Título de la Gráfica
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.fillText(
      isEn ? 'ATTENDANCE EVOLUTION ACROSS SESSIONS & MATCHES' : 'EVOLUCIÓN TEMPORAL DE ASISTENCIA (SESIONES Y PARTIDOS)',
      padL,
      22
    );

    // Leyendas en la esquina superior derecha
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'right';

    // 1. Umbral Alerta 70%
    let curX = width - padR;
    ctx.fillStyle = '#EF4444';
    ctx.fillText(isEn ? `Alert (<${threshold}%)` : `Alerta (<${threshold}%)`, curX, 22);
    curX -= (isEn ? 82 : 88);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(curX + 16, 18);
    ctx.lineTo(curX + 3, 18);
    ctx.stroke();
    ctx.setLineDash([]);
    curX -= 12;

    // 2. Tardes (Naranja)
    ctx.fillStyle = '#F97316';
    ctx.fillText(isEn ? 'Late' : 'Tardes', curX, 22);
    curX -= 40;
    ctx.beginPath();
    ctx.arc(curX + 14, 19, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#F97316';
    ctx.fill();
    curX -= 12;

    // 3. Ausencias (Rojo)
    ctx.fillStyle = '#EF4444';
    ctx.fillText(isEn ? 'Absent' : 'Ausencias', curX, 22);
    curX -= 55;
    ctx.beginPath();
    ctx.arc(curX + 14, 19, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    curX -= 12;

    // 4. Asistencia Real (Verde)
    ctx.fillStyle = '#16A34A';
    ctx.fillText(isEn ? 'Attendance (P+T)' : 'Asistencia (P+T)', curX, 22);
    curX -= 90;
    ctx.beginPath();
    ctx.arc(curX + 14, 19, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#16A34A';
    ctx.fill();

    // Líneas horizontales de guía (100%, 70% alerta, 50%, 0%)
    const gridLevels = [
      { pct: 100, label: '100%', color: '#E2E8F0', isAlert: false },
      { pct: threshold, label: `${threshold}%`, color: 'rgba(239, 68, 68, 0.45)', isAlert: true },
      { pct: 50, label: '50%', color: '#E2E8F0', isAlert: false },
      { pct: 0, label: '0%', color: '#CBD5E1', isAlert: false }
    ];

    gridLevels.forEach((lvl) => {
      const yPos = padT + plotH - (lvl.pct / 100) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yPos);
      ctx.lineTo(width - padR, yPos);
      ctx.strokeStyle = lvl.color;
      ctx.lineWidth = lvl.isAlert ? 1.5 : 1;
      if (lvl.isAlert) {
        ctx.setLineDash([5, 3]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = lvl.isAlert ? 'bold 9px Arial, sans-serif' : '9px Arial, sans-serif';
      ctx.fillStyle = lvl.isAlert ? '#EF4444' : '#94A3B8';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(lvl.label, padL - 6, yPos);
    });

    if (!trendData || trendData.length === 0) {
      // Estado sin datos suficientes
      ctx.font = 'italic 11px Arial, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.textAlign = 'center';
      ctx.fillText(
        isEn
          ? 'No session or match records available yet to plot trend.'
          : 'Aún no hay suficientes sesiones o partidos registrados para trazar la tendencia.',
        width / 2,
        padT + plotH / 2
      );
      return canvas.toDataURL('image/png', 0.95);
    }

    const count = trendData.length;
    const stepX = count > 1 ? plotW / (count - 1) : 0;
    const getY = (pctVal) => padT + plotH - (Math.max(0, Math.min(100, Number(pctVal) || 0)) / 100) * plotH;

    const points = trendData.map((d, i) => {
      const x = count === 1 ? padL + plotW / 2 : padL + i * stepX;
      return {
        x,
        yAtt: getY(d.pct),
        yAbs: getY(d.pctAbsent),
        yLate: getY(d.pctLate),
        raw: d
      };
    });

    // ── 1. Área sombreada bajo la curva de asistencia verde ──
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, padT + plotH);
      points.forEach((p) => ctx.lineTo(p.x, p.yAtt));
      ctx.lineTo(points[points.length - 1].x, padT + plotH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
      ctx.fill();
    }

    // ── 2. Línea de Ausencias (Rojo punteado) ──
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yAbs);
      points.forEach((p) => ctx.lineTo(p.x, p.yAbs));
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── 3. Línea de Tardanzas (Naranja continuo) ──
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yLate);
      points.forEach((p) => ctx.lineTo(p.x, p.yLate));
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // ── 4. Línea de Asistencia Real (Verde Principal grueso) ──
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yAtt);
      points.forEach((p) => ctx.lineTo(p.x, p.yAtt));
      ctx.strokeStyle = '#16A34A';
      ctx.lineWidth = 2.8;
      ctx.stroke();
    }

    // ── 5. Nodos y Etiquetas de Datos ──
    points.forEach((p) => {
      // Nodo Tardanzas
      if (Number(p.raw.pctLate) > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.yLate, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#F97316';
        ctx.fill();
      }

      // Nodo Ausencias
      if (Number(p.raw.pctAbsent) > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.yAbs, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444';
        ctx.fill();
      }

      // Nodo Principal de Asistencia
      const isProv = p.raw.isProvisional === true;
      const nodeColor = isProv ? '#F59E0B' : '#16A34A';
      ctx.beginPath();
      ctx.arc(p.x, p.yAtt, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Etiqueta de % sobre el nodo
      ctx.font = 'bold 9px Arial, sans-serif';
      ctx.fillStyle = nodeColor;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(p.raw.pct)}%`, p.x, p.yAtt - 8);

      // Etiqueta de fecha en el eje X
      const dateLabel = cleanPdfText(p.raw.formattedDate || p.raw.date || '');
      ctx.font = '8.5px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText(dateLabel, p.x, padT + plotH + 16);
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (err) {
    console.error('Error dibujando gráfica de tendencia temporal:', err);
    return null;
  }
};

/**
 * Renderiza una gráfica Donut en alta resolución con el desglose total de registros:
 * Presentes (#22C55E), Ausentes (#EF4444), Tardes (#F97316), Justificados (#3B82F6), Lesión (#8B5CF6).
 */
const drawAttendanceDonutChartCanvas = (
  { present = 0, absent = 0, late = 0, justified = 0, injured = 0 },
  avgPct = 0,
  isEn = false,
  width = 460,
  height = 240
) => {
  try {
    const scale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Título de la tarjeta Donut
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.fillText(
      isEn ? 'TOTAL RECORD BREAKDOWN' : 'DESGLOSE GLOBAL DE REGISTROS',
      16,
      20
    );

    const slices = [
      { label: isEn ? 'Present' : 'Presentes', val: present, color: '#22C55E' },
      { label: isEn ? 'Late' : 'Tardes', val: late, color: '#F97316' },
      { label: isEn ? 'Absent' : 'Ausentes', val: absent, color: '#EF4444' },
      { label: isEn ? 'Justified' : 'Justificados', val: justified, color: '#3B82F6' },
      { label: isEn ? 'Injured' : 'Lesionados', val: injured, color: '#8B5CF6' }
    ].filter((s) => s.val > 0);

    const totalVal = slices.reduce((acc, s) => acc + s.val, 0);

    // Centro del donut
    const cx = 95;
    const cy = 130;
    const outerR = 64;
    const innerR = 40;

    if (totalVal === 0) {
      // Donut gris vacío
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerR, Math.PI * 2, 0, true);
      ctx.fillStyle = '#F1F5F9';
      ctx.fill();

      ctx.font = 'italic 10px Arial, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.textAlign = 'center';
      ctx.fillText(isEn ? 'No records' : 'Sin registros', cx, cy + 4);
    } else {
      let currentAngle = -Math.PI / 2;

      slices.forEach((s) => {
        const sliceAngle = (s.val / totalVal) * (Math.PI * 2);
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, currentAngle, currentAngle + sliceAngle, false);
        ctx.arc(cx, cy, innerR, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        currentAngle += sliceAngle;
      });

      // Texto central del Donut
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.fillText(`${avgPct}%`, cx, cy - 2);

      ctx.font = '8px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(isEn ? 'Attendance' : 'Asistencia', cx, cy + 12);
    }

    // Leyenda detallada a la derecha
    const legX = 185;
    let legY = 46;

    const allLegendItems = [
      { label: isEn ? 'Present' : 'Presentes', val: present, color: '#22C55E' },
      { label: isEn ? 'Late' : 'Tardes', val: late, color: '#F97316' },
      { label: isEn ? 'Absent' : 'Ausentes', val: absent, color: '#EF4444' },
      { label: isEn ? 'Justified' : 'Justificados', val: justified, color: '#3B82F6' },
      { label: isEn ? 'Injured' : 'Lesionados', val: injured, color: '#8B5CF6' }
    ];

    allLegendItems.forEach((item) => {
      const pct = totalVal > 0 ? Math.round((item.val / totalVal) * 100) : 0;

      // Caja de color
      ctx.fillStyle = item.color;
      ctx.fillRect(legX, legY, 10, 10);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(legX, legY, 10, 10);

      // Texto etiqueta
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legX + 16, legY + 9);

      // Cantidad y porcentaje
      ctx.font = '10px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.val} (${pct}%)`, width - 20, legY + 9);

      legY += 26;
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (err) {
    console.error('Error dibujando gráfica donut de asistencia:', err);
    return null;
  }
};

/**
 * generateAttendancePdfReport
 * Genera el informe oficial completo de control de asistencia de la plantilla en PDF,
 * con gráficas visuales de evolución temporal, gráfico donut de registros, KPIs globales,
 * ranking de constancia y alertas, garantizando cero caracteres corruptos o solapamientos.
 */
export const generateAttendancePdfReport = async ({
  teamName = 'Mi Equipo',
  activeTeam = null,
  squadStats = [],
  trendData = [],
  threshold = 70,
  language = null,
  isEn: isEnProp = false
}) => {
  const effLang = getEffectiveLanguage(language);
  const isEn = isEnProp || effLang === 'English (EN)';

  window.dispatchEvent(
    new CustomEvent('m11-loading', {
      detail: { show: true, message: isEn ? 'Generating Attendance PDF Report...' : 'Generando Informe de Asistencia...' }
    })
  );
  await new Promise((r) => setTimeout(r, 120));

  try {
    const { jsPDF, autoTable } = await getPdfLibs();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const colorPrimary = PDF_COLORS.primary; // [23, 45, 33]
    const colorAccent = PDF_COLORS.accent;   // [212, 168, 67]

    const titleText = isEn ? 'TEAM ATTENDANCE CONTROL REPORT' : 'INFORME OFICIAL DE CONTROL DE ASISTENCIA';

    // ── 1. ENCABEZADO INSTITUCIONAL SEGURO (SIN COLISIONES) ────────────────
    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFillColor(...colorAccent);
    doc.rect(0, 34, pageW, 2, 'F');

    // Logo oficial de Míster11 a la izquierda
    const mr11LogoData = await imageUrlToBase64('/logo_mister11.png', 'M11', false);
    if (mr11LogoData) {
      doc.addImage(mr11LogoData, 'PNG', 14, 8, 18, 18);
    }

    // Escudo del equipo a la derecha
    if (activeTeam?.escudo) {
      const shieldData = await imageUrlToBase64(activeTeam.escudo, cleanPdfText(teamName), false);
      if (shieldData) {
        doc.addImage(shieldData, 'PNG', pageW - 32, 8, 18, 18);
      }
    }

    // Título Principal Centrado
    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorAccent);
    doc.text(titleText, pageW / 2, 14, { align: 'center' });

    // Subtítulo con Metadatos del Equipo y Fecha
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    const fechaStr = new Date().toLocaleDateString(isEn ? 'en-US' : 'es-ES');
    const displayTeamName = cleanPdfText(activeTeam?.nombre || activeTeam?.name || teamName);
    doc.text(
      `${isEn ? 'Date' : 'Fecha'}: ${fechaStr}   |   ${isEn ? 'Team' : 'Equipo'}: ${displayTeamName}   |   ${isEn ? 'Alert Threshold' : 'Umbral Alerta'}: ${threshold}%`,
      pageW / 2,
      22,
      { align: 'center' }
    );

    // Tagline institucional
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      isEn ? 'OFFICIAL PLATFORM TRACKING & AUDIT SYSTEM · MÍSTER 11' : 'SISTEMA OFICIAL DE REGISTRO Y CONTROL DE ASISTENCIA · MÍSTER 11',
      pageW / 2,
      29,
      { align: 'center' }
    );

    let y = 43;

    // ── 2. CÁLCULO DE MÉTRICAS GLOBALES & DISTRIBUCIÓN ────────────────────
    const avgPct = calculateSquadAveragePct(squadStats);

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalJustified = 0;
    let totalLate = 0;
    let totalInjured = 0;

    let countOptimo = 0;   // >= 85%
    let countAceptable = 0; // 70-84%
    let countRiesgo = 0;    // < 70%

    squadStats.forEach((s) => {
      totalPresent += Number(s.present || 0);
      totalAbsent += Number(s.absent || 0);
      totalJustified += Number(s.justified || 0);
      totalLate += Number(s.late || 0);
      totalInjured += Number(s.injured || 0);

      if (s.hasData && typeof s.pct === 'number') {
        if (s.pct >= 85) countOptimo++;
        else if (s.pct >= threshold) countAceptable++;
        else countRiesgo++;
      }
    });

    const totalEvaluated = countOptimo + countAceptable + countRiesgo;

    // ── 3. TARJETAS DE KPIS GLOBALES (4 COLUMNAS) ─────────────────────────
    const cardW = (pageW - 28 - 9) / 4;
    const kpiCards = [
      {
        label: isEn ? 'AVERAGE ATTENDANCE' : 'MEDIA ASISTENCIA',
        val: `${avgPct}%`,
        color: avgPct >= threshold ? [34, 197, 94] : [220, 38, 38]
      },
      {
        label: isEn ? 'TOTAL PRESENT' : 'ASISTENCIAS',
        val: totalPresent,
        color: colorPrimary
      },
      {
        label: isEn ? 'ABSENT / LATE' : 'FALTAS / RETRASOS',
        val: `${totalAbsent} / ${totalLate}`,
        color: totalAbsent > 0 ? [220, 38, 38] : colorPrimary
      },
      {
        label: isEn ? 'AT RISK' : 'EN RIESGO',
        val: `${countRiesgo} jug.`,
        color: countRiesgo > 0 ? [220, 38, 38] : [34, 197, 94]
      }
    ];

    kpiCards.forEach((c, idx) => {
      const cx = 14 + idx * (cardW + 3);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cx, y, cardW, 20, 2.5, 2.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cx, y, cardW, 20, 2.5, 2.5, 'S');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cx + 3, y + 6);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...c.color);
      doc.text(String(c.val), cx + 3, y + 15);
    });

    y += 26;

    // ── 4. GRÁFICA 1: EVOLUCIÓN TEMPORAL DE ASISTENCIA (CANVAS HD) ─────────
    const trendChartImg = drawAttendanceTrendChartCanvas(trendData, threshold, isEn, 760, 280);
    const trendH = 72;
    if (trendChartImg) {
      doc.addImage(trendChartImg, 'PNG', 14, y, pageW - 28, trendH);
      y += trendH + 7;
    }

    // ── 5. SECCIÓN INFERIOR: GRÁFICA DONUT + DISTRIBUCIÓN DE PLANTILLA ─────
    const sectionH = 54;
    const halfW = (pageW - 28 - 6) / 2;

    // A) Gráfica Donut de registros a la izquierda
    const donutImg = drawAttendanceDonutChartCanvas(
      {
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        justified: totalJustified,
        injured: totalInjured
      },
      avgPct,
      isEn,
      460,
      270
    );

    if (donutImg) {
      doc.addImage(donutImg, 'PNG', 14, y, halfW, sectionH);
    }

    // B) Tarjeta de Distribución de la Plantilla a la derecha
    const rightX = 14 + halfW + 6;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(rightX, y, halfW, sectionH, 2.5, 2.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightX, y, halfW, sectionH, 2.5, 2.5, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(
      isEn ? 'SQUAD ATTENDANCE TIERS' : 'DISTRIBUCIÓN DE LA PLANTILLA',
      rightX + 6,
      y + 8
    );

    // Barra de distribución horizontal
    const barX = rightX + 6;
    const barY = y + 13;
    const barW = halfW - 12;
    const barH = 7;

    const pctOptimo = totalEvaluated > 0 ? countOptimo / totalEvaluated : 0;
    const pctAceptable = totalEvaluated > 0 ? countAceptable / totalEvaluated : 0;
    const pctRiesgo = totalEvaluated > 0 ? countRiesgo / totalEvaluated : 0;

    let curBarX = barX;
    if (pctOptimo > 0) {
      const wOpt = barW * pctOptimo;
      doc.setFillColor(34, 197, 94);
      doc.rect(curBarX, barY, wOpt, barH, 'F');
      curBarX += wOpt;
    }
    if (pctAceptable > 0) {
      const wAcep = barW * pctAceptable;
      doc.setFillColor(212, 168, 67);
      doc.rect(curBarX, barY, wAcep, barH, 'F');
      curBarX += wAcep;
    }
    if (pctRiesgo > 0) {
      const wRiesg = barW * pctRiesgo;
      doc.setFillColor(220, 38, 38);
      doc.rect(curBarX, barY, wRiesg, barH, 'F');
    }
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(barX, barY, barW, barH, 'S');

    // Desglose de Niveles
    let itemY = y + 26;
    const tiers = [
      {
        label: isEn ? 'Optimal (>=85%)' : 'Óptimo (>=85%)',
        count: countOptimo,
        pct: Math.round(pctOptimo * 100),
        color: [34, 197, 94]
      },
      {
        label: isEn ? `Acceptable (${threshold}-84%)` : `Aceptable (${threshold}-84%)`,
        count: countAceptable,
        pct: Math.round(pctAceptable * 100),
        color: [212, 168, 67]
      },
      {
        label: isEn ? `At Risk (<${threshold}%)` : `Bajo Umbral (<${threshold}%)`,
        count: countRiesgo,
        pct: Math.round(pctRiesgo * 100),
        color: [220, 38, 38]
      }
    ];

    tiers.forEach((t) => {
      doc.setFillColor(...t.color);
      doc.rect(barX, itemY - 2.5, 3.5, 3.5, 'F');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(t.label, barX + 6, itemY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${t.count} jug. (${t.pct}%)`, rightX + halfW - 6, itemY, { align: 'right' });

      itemY += 8.5;
    });

    // ── 6. PÁGINA 2: AUDITORÍA DETALLADA, TABLA, ALERTAS Y FIRMA ───────────
    doc.addPage();

    // Encabezado de Continuidad en Página 2
    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setFillColor(...colorAccent);
    doc.rect(0, 19, pageW, 1, 'F');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(
      isEn ? 'MÍSTER 11 · SQUAD ATTENDANCE AUDIT & BREAKDOWN' : 'MÍSTER 11 · AUDITORÍA INDIVIDUAL Y CONTROL DE ASISTENCIA',
      14,
      10
    );

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(
      isEn
        ? `Official Individual Breakdown · ${displayTeamName} · Threshold: ${threshold}%`
        : `Desglose Individual Oficial · ${displayTeamName} · Umbral de Convocatoria: ${threshold}%`,
      14,
      16
    );

    let p2Y = 26;

    // Tabla Completa de la Plantilla
    const tableHead = isEn
      ? [['#', 'Player Name', 'Pos', 'Present', 'Absent', 'Justif.', 'Late', 'Injured', '% Att.', 'Status']]
      : [['#', 'Jugador', 'Pos', 'Presente', 'Ausente', 'Justif.', 'Tarde', 'Lesión', '% Asist.', 'Estado']];

    const sortedStats = [...squadStats].sort((a, b) => {
      if (!a.hasData && !b.hasData) return 0;
      if (!a.hasData) return 1;
      if (!b.hasData) return -1;
      return (b.pct ?? 0) - (a.pct ?? 0);
    });

    const tableBody = sortedStats.map((s) => {
      const hasPct = s.hasData && typeof s.pct === 'number';
      let statusTag = '-';
      if (hasPct) {
        if (s.pct >= 85) statusTag = isEn ? 'OPTIMAL' : 'ÓPTIMO';
        else if (s.pct >= threshold) statusTag = isEn ? 'REGULAR' : 'ACEPTABLE';
        else statusTag = isEn ? 'AT RISK' : 'BAJO UMBRAL';
      }

      return [
        cleanPdfText(s.player?.number || '-'),
        cleanPdfText(s.player?.name || 'Jugador'),
        cleanPdfText(s.player?.position || '-'),
        s.present || 0,
        s.absent || 0,
        s.justified || 0,
        s.late || 0,
        s.injured || 0,
        hasPct ? `${s.pct}%` : (isEn ? 'No data' : 'Sin datos'),
        statusTag
      ];
    });

    autoTable(doc, {
      startY: p2Y,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: colorPrimary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      styles: { fontSize: 7.8, cellPadding: 2.2, textColor: [15, 23, 42] },
      columnStyles: {
        0: { width: 9, halign: 'center' },
        1: { halign: 'left', fontStyle: 'bold' },
        2: { width: 12, halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { fontStyle: 'bold', halign: 'center' },
        9: { fontStyle: 'bold', halign: 'center' }
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 9) {
          const raw = String(data.cell.raw);
          if (raw.includes('ÓPTIMO') || raw.includes('OPTIMAL')) {
            data.cell.styles.textColor = [34, 197, 94];
          } else if (raw.includes('BAJO') || raw.includes('AT RISK')) {
            data.cell.styles.textColor = [220, 38, 38];
          } else if (raw.includes('ACEPTABLE') || raw.includes('REGULAR')) {
            data.cell.styles.textColor = [212, 168, 67];
          }
        }
      }
    });

    p2Y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : p2Y + 40) + 10;

    // Alertas de Jugadores Bajo el Umbral
    const lowAttenders = squadStats.filter((s) => s.hasData && typeof s.pct === 'number' && s.pct < threshold);
    if (lowAttenders.length > 0) {
      if (p2Y + 36 > pageH - 45) {
        doc.addPage();
        p2Y = 24;
      }

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(
        isEn
          ? `[ALERT] PLAYERS WITH ATTENDANCE UNDER ${threshold}%`
          : `[ALERTA] JUGADORES CON ASISTENCIA INFERIOR AL ${threshold}%`,
        14,
        p2Y
      );
      p2Y += 4;

      const riskRows = lowAttenders.map((s) => [
        `#${cleanPdfText(s.player?.number || '-')} ${cleanPdfText(s.player?.name || 'Jugador')} (${cleanPdfText(s.player?.position || '')})`,
        `${s.pct}% ${isEn ? 'Attendance' : 'Asistencia'}`,
        `${s.absent} ${isEn ? 'unexcused absences' : 'faltas injustificadas'}, ${s.late} ${isEn ? 'lates' : 'tardanzas'}`
      ]);

      autoTable(doc, {
        startY: p2Y,
        body: riskRows,
        theme: 'striped',
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [185, 28, 28] },
        columnStyles: { 0: { fontStyle: 'bold', width: 68 } }
      });

      p2Y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : p2Y + 20) + 10;
    }

    // ── 7. BLOQUE DE FIRMA Y CONFORMIDAD OFICIAL ───────────────────────────
    if (p2Y + 30 > pageH - 25) {
      doc.addPage();
      p2Y = 25;
    }

    const sigBoxW = 75;
    const sigX = pageW - 14 - sigBoxW;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(sigX, p2Y + 18, sigX + sigBoxW, p2Y + 18);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(
      isEn ? 'Staff / Head Coach Signature' : 'Firma del Cuerpo Técnico / Club',
      sigX + sigBoxW / 2,
      p2Y + 22,
      { align: 'center' }
    );

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      isEn ? 'Document certified by Míster11' : 'Certificado oficial generado por Míster11',
      sigX + sigBoxW / 2,
      p2Y + 26,
      { align: 'center' }
    );

    // ── 8. PIE DE PÁGINA UNIFICADO EN TODAS LAS PÁGINAS ────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, pageW, pageH, i, totalPages);
    }

    const safeTeam = teamName.replace(/\s+/g, '_').toLowerCase();
    const pdfName = `Control_Asistencia_${safeTeam}_${new Date().toISOString().split('T')[0]}.pdf`;
    await savePdfUniversal(doc, pdfName);
  } catch (error) {
    console.error('Error al generar PDF de Asistencia:', error);
    alert(isEn ? 'Error generating Attendance PDF' : 'Error al generar el PDF de Asistencia');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
