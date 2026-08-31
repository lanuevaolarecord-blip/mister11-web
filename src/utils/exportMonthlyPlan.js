import { PDF_COLORS, drawPdfHeader, drawPdfFooter } from './pdfTheme';
import { savePdfUniversal } from './pdfGenerator';

export const exportMonthlyPlan = async (mesocycle, macroInfo, activeTeam, appVersion) => {
  if (!mesocycle) return;

  const { default: jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.default || autoTableMod;

  const monthsList = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const formattedMonth = (mesocycle.month || 'Mes').charAt(0).toUpperCase() + (mesocycle.month || 'mes').slice(1).toLowerCase();
  const mesoNum = monthsList.indexOf(formattedMonth) + 1;
  const mesoNumStr = mesoNum > 0 ? `Nº ${mesoNum}` : '';

  // Creamos el documento PDF en formato Portrait (vertical)
  const doc = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();

  // Paleta de colores Míster11 unificada
  const cDark = PDF_COLORS.primary;
  const cGold = PDF_COLORS.accent;
  const cBeige = PDF_COLORS.bgLight;
  const cText = PDF_COLORS.textDark;

  drawPdfHeader(doc, `PLANIFICACIÓN MENSUAL — ${(mesocycle.month || 'MES').toUpperCase()}`, `Mesociclo ${mesoNumStr} | ${activeTeam?.nombre || 'Mi Equipo'}`, pdfWidth);

  let yPos = 44;
  const microsList = Array.isArray(mesocycle.micros) ? mesocycle.micros : [];

  // Bloque de Resumen del Mesociclo
  doc.setFillColor(cBeige[0], cBeige[1], cBeige[2]);
  doc.rect(12, yPos, pdfWidth - 24, 25, 'F');

  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMEN GENERAL DEL MES', 16, yPos + 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(cText[0], cText[1], cText[2]);
  doc.text(`Mes: ${(mesocycle.month || '').toUpperCase()} (Meso ${mesoNumStr})`, 16, yPos + 13);
  doc.text(`Semanas registradas: ${microsList.length}`, 16, yPos + 19);

  doc.text(`Volumen total del mes: ${mesocycle.volume || 0} min`, 80, yPos + 13);
  doc.text(`Sesiones del mes: ${mesocycle.sessions || 0}`, 80, yPos + 19);

  const tipoCarga = (mesocycle.carga || 0) >= (microsList.length / 2) ? 'CARGA' : 'COMPETICIÓN';
  doc.text(`Orientación del mes: ${tipoCarga}`, 150, yPos + 13);
  
  yPos += 30;

  // Objetivos de Planificación / Notas
  doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
  doc.setFillColor(255, 255, 255);
  doc.rect(12, yPos, pdfWidth - 24, 22);

  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OBJETIVOS DEL MES / NOTAS TÁCTICAS:', 16, yPos + 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(cText[0], cText[1], cText[2]);
  
  const defaultObjective = `Optimizar el volumen de entrenamiento e intensificar el enfoque táctico/técnico para el mes de ${mesocycle.month || 'la temporada'}. Consolidar las fases de posesión de balón y transiciones rápidas defensa-ataque.`;
  const splitObjective = doc.splitTextToSize(macroInfo?.objective || defaultObjective, pdfWidth - 36);
  doc.text(splitObjective, 16, yPos + 11);

  yPos += 28;

  // Tabla comparativa de microciclos del mes
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DISTRIBUCIÓN Y DINÁMICA DE CARGAS', 12, yPos);

  const headers = ['Métrica / Variable', ...microsList.map(m => `Semana ${m.id || ''} (Micro ${m.microciclo || m.id || ''})`)];
  const rows = [
    ['Mes / Mesociclo', ...microsList.map(m => `${m.month || mesocycle.month || ''} (Meso ${monthsList.indexOf((m.month || mesocycle.month || '').charAt(0).toUpperCase() + (m.month || mesocycle.month || '').slice(1).toLowerCase()) + 1})`)],
    ['Período', ...microsList.map(m => m.periodo || 'Competitivo')],
    ['Tipo de Microciclo (Carga)', ...microsList.map(m => m.carga || 'Carga')],
    ['Nº Microciclo', ...microsList.map(m => m.microciclo || m.id || '-')],
    ['Test Físico', ...microsList.map(m => m.fisio ? 'Sí' : 'No')],
    ['Tendencia Carga', ...microsList.map(m => m.infl || 'Estable')],
    ['Sesiones', ...microsList.map(m => m.sessions || 0)],
    ['Volumen (minutos)', ...microsList.map(m => `${m.volume || 0} min`)],
    ['Físico (%)', ...microsList.map(m => `${m.physical || 0}%`)],
    ['Técnico (%)', ...microsList.map(m => `${m.technical || 0}%`)],
    ['Táctico (%)', ...microsList.map(m => `${m.tactical || 0}%`)],
  ];

  autoTable(doc, {
    startY: yPos + 3,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: cDark,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', width: 50 }
    },
    styles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle'
    },
    margin: { left: 12, right: 12 }
  });

  // Espacio dinámico para el detalle por microciclo
  let currentY = doc.lastAutoTable.finalY + 12;

  microsList.forEach((micro, idx) => {
    // Si se pasa del límite, agregar nueva página
    if (currentY > pdfHeight - 55) {
      doc.addPage();
      drawPdfHeader(doc, `Detalle de Microciclos — ${(mesocycle.month || '').toUpperCase()}`, activeTeam?.nombre || 'Mi Equipo', pdfWidth);
      currentY = 44;
    }

    doc.setFillColor(cBeige[0], cBeige[1], cBeige[2]);
    doc.rect(12, currentY, pdfWidth - 24, 6, 'F');
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`DETALLE DE LA SEMANA ${idx + 1} (MICROCICLO #${micro.microciclo || idx + 1})`, 15, currentY + 4.5);

    currentY += 10;

    doc.setTextColor(cText[0], cText[1], cText[2]);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);

    const colWidth = (pdfWidth - 24) / 4;
    doc.text(`Período: ${micro.periodo || 'Competitivo'}`, 15, currentY);
    doc.text(`Tipo Microciclo: ${micro.carga || 'Carga'}`, 15 + colWidth, currentY);
    doc.text(`Sesiones: ${micro.sessions || 0}`, 15 + colWidth * 2, currentY);
    doc.text(`Volumen: ${micro.volume || 0} min`, 15 + colWidth * 3, currentY);

    currentY += 6;

    doc.setFont('Helvetica', 'bold');
    doc.text('Distribución de Carga:', 15, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Física: ${micro.physical || 0}% | Técnica: ${micro.technical || 0}% | Táctica: ${micro.tactical || 0}%`, 50, currentY);

    currentY += 12;
  });

  // Footer dinámico en todas las páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPdfFooter(doc, pdfWidth, pdfHeight, i, totalPages);
  }

  // Descarga universal del PDF
  const filename = `planificacion_mensual_${(mesocycle.month || 'mes').toLowerCase()}_${(activeTeam?.nombre || 'mister11').replace(/\s+/g, '_')}.pdf`;
  await savePdfUniversal(doc, filename);
};

