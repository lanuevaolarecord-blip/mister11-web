import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera y descarga un informe PDF con los 4 microciclos de un mes seleccionado.
 * 
 * @param {Object} mesocycle - El mesociclo a exportar.
 * @param {Object} macroInfo - Datos generales del macrociclo/temporada.
 * @param {Object} activeTeam - El equipo activo seleccionado.
 * @param {string} appVersion - Versión actual de la app.
 */
export const exportMonthlyPlan = (mesocycle, macroInfo, activeTeam, appVersion) => {
  if (!mesocycle) return;

  // Creamos el documento PDF en formato Portrait (vertical)
  const doc = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();

  // Paleta de colores Míster11
  const cDark = [0, 75, 135]; // Azul Institucional (#004B87)
  const cGold = [212, 168, 67]; // Dorado (#D4A843)
  const cBeige = [245, 240, 232]; // Beige claro (#F5F0E8)
  const cText = [45, 45, 45]; // Texto oscuro

  // Encabezado
  const drawHeader = (titleSub) => {
    // Banner superior azul
    doc.setFillColor(cDark[0], cDark[1], cDark[2]);
    doc.rect(0, 0, pdfWidth, 24, 'F');
    
    // Línea divisoria dorada
    doc.setFillColor(cGold[0], cGold[1], cGold[2]);
    doc.rect(0, 24, pdfWidth, 1.5, 'F');

    // Título Principal
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MÍSTER 11 - PLANIFICACIÓN MENSUAL', 12, 11);

    // Subtítulo
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(210, 225, 245);
    doc.text(titleSub.toUpperCase(), 12, 17);

    // Nombre de equipo
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const teamName = (activeTeam?.nombre || activeTeam?.name || 'MI EQUIPO').toUpperCase();
    doc.text(teamName, pdfWidth - 12, 11, { align: 'right' });

    // Versión y Fecha
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(210, 225, 245);
    const todayStr = new Date().toLocaleDateString('es-ES');
    doc.text(`Fecha: ${todayStr} | Versión: ${appVersion}`, pdfWidth - 12, 17, { align: 'right' });
  };

  // Pie de página
  const drawFooter = (pageNum, totalPages) => {
    doc.setFillColor(cDark[0], cDark[1], cDark[2]);
    doc.rect(0, pdfHeight - 10, pdfWidth, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text('Míster 11 - El banquillo en tu bolsillo', 12, pdfHeight - 4);
    doc.text(`Página ${pageNum} de ${totalPages}`, pdfWidth - 12, pdfHeight - 4, { align: 'right' });
  };

  drawHeader(`Mesociclo: ${mesocycle.month.toUpperCase()}`);

  let yPos = 32;

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
  doc.text(`Mes: ${mesocycle.month.toUpperCase()}`, 16, yPos + 13);
  doc.text(`Semanas registradas: ${mesocycle.micros.length}`, 16, yPos + 19);

  doc.text(`Volumen total del mes: ${mesocycle.volume} min`, 80, yPos + 13);
  doc.text(`Sesiones del mes: ${mesocycle.sessions}`, 80, yPos + 19);

  const tipoCarga = mesocycle.carga >= mesocycle.micros.length / 2 ? 'CARGA' : 'COMPETICIÓN';
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
  
  const defaultObjective = `Optimizar el volumen de entrenamiento e intensificar el enfoque táctico/técnico para el mes de ${mesocycle.month}. Consolidar las fases de posesión de balón y transiciones rápidas defensa-ataque.`;
  const splitObjective = doc.splitTextToSize(macroInfo?.objective || defaultObjective, pdfWidth - 36);
  doc.text(splitObjective, 16, yPos + 11);

  yPos += 28;

  // Tabla comparativa de microciclos del mes
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DISTRIBUCIÓN Y DINÁMICA DE CARGAS', 12, yPos);

  const headers = ['Métrica / Variable', ...mesocycle.micros.map(m => `Semana ${m.id} (Micro ${m.microciclo})`)];
  const rows = [
    ['Período', ...mesocycle.micros.map(m => m.periodo)],
    ['Tipo de Microciclo', ...mesocycle.micros.map(m => m.carga)],
    ['Test Físico', ...mesocycle.micros.map(m => m.fisio ? 'Sí' : 'No')],
    ['Tendencia Carga', ...mesocycle.micros.map(m => m.infl || 'Estable')],
    ['Sesiones', ...mesocycle.micros.map(m => m.sessions)],
    ['Volumen (minutos)', ...mesocycle.micros.map(m => `${m.volume} min`)],
    ['Físico (%)', ...mesocycle.micros.map(m => `${m.physical}%`)],
    ['Técnico (%)', ...mesocycle.micros.map(m => `${m.technical}%`)],
    ['Táctico (%)', ...mesocycle.micros.map(m => `${m.tactical}%`)],
  ];

  autoTable(doc, {
    startY: yPos + 3,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: cDark,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', width: 50 }
    },
    styles: {
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle'
    },
    margin: { left: 12, right: 12 }
  });

  // Espacio dinámico para el detalle por microciclo
  let currentY = doc.lastAutoTable.finalY + 12;

  mesocycle.micros.forEach((micro, idx) => {
    // Si se pasa del límite, agregar nueva página
    if (currentY > pdfHeight - 55) {
      drawFooter(doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
      doc.addPage();
      drawHeader(`Detalle de Microciclos - ${mesocycle.month.toUpperCase()}`);
      currentY = 32;
    }

    doc.setFillColor(cBeige[0], cBeige[1], cBeige[2]);
    doc.rect(12, currentY, pdfWidth - 24, 6, 'F');
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`DETALLE DE LA SEMANA ${idx + 1} (MICROCICLO #${micro.microciclo})`, 15, currentY + 4.5);

    currentY += 10;

    doc.setTextColor(cText[0], cText[1], cText[2]);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);

    const colWidth = (pdfWidth - 24) / 4;
    doc.text(`Período: ${micro.periodo}`, 15, currentY);
    doc.text(`Tipo Microciclo: ${micro.carga}`, 15 + colWidth, currentY);
    doc.text(`Sesiones: ${micro.sessions}`, 15 + colWidth * 2, currentY);
    doc.text(`Volumen: ${micro.volume} min`, 15 + colWidth * 3, currentY);

    currentY += 6;

    doc.setFont('Helvetica', 'bold');
    doc.text('Distribución de Carga:', 15, currentY);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Física: ${micro.physical}% | Técnica: ${micro.technical}% | Táctica: ${micro.tactical}%`, 50, currentY);

    currentY += 12;
  });

  // Footer dinámico en todas las páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // Descarga del PDF
  const filename = `planificacion_mensual_${mesocycle.month.toLowerCase()}_${activeTeam?.nombre || 'mister11'}.pdf`;
  doc.save(filename);
};
