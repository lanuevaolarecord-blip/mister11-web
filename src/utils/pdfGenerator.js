import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Genera un informe de temporada completo en PDF
 */
export const generateSeasonReport = (team, players, matches, sessions) => {
  const doc = new jsPDF();
  const themeColor = [27, 58, 45]; // #1B3A2D

  // --- HEADER ---
  doc.setFillColor(...themeColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('MÍSTER11', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`INFORME DE TEMPORADA: ${team.nombre}`, 105, 30, { align: 'center' });

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
    headStyles: { fillColor: themeColor },
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
    headStyles: { fillColor: themeColor },
  });

  // --- FOOTER ---
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} | Generado por Míster11 Tactical Engine`, 105, 285, { align: 'center' });
  }

  doc.save(`Informe_${team.nombre}_${team.temporada}.pdf`);
};

/**
 * Genera la hoja de convocatoria para un partido
 */
export const generateMatchConvocation = (match, players) => {
  const doc = new jsPDF();
  const themeColor = [27, 58, 45];

  // HEADER
  doc.setFillColor(...themeColor);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('HOJA DE CONVOCATORIA', 105, 25, { align: 'center' });

  // MATCH DETAILS
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text(`Rival: ${match.rival}`, 15, 55);
  doc.text(`Fecha: ${match.fecha} | Hora: ${match.hora || '--:--'}`, 15, 62);
  doc.text(`Lugar: ${match.lugar || 'Por determinar'}`, 15, 69);

  // CONVOCADOS LIST
  const convocados = players.filter(p => match.convocados?.includes(p.id)) || [];
  
  doc.autoTable({
    startY: 80,
    head: [['#', 'Nombre del Jugador', 'Posición']],
    body: convocados.map(p => [p.dorsal || '-', p.nombre, p.posicion || '-']),
    headStyles: { fillColor: themeColor },
  });

  doc.save(`Convocatoria_${match.rival}_${match.fecha}.pdf`);
};

/**
 * Genera la ficha técnica de una sesión
 */
export const generateSessionPDF = (session) => {
  const doc = new jsPDF();
  const themeColor = [27, 58, 45];

  doc.setFillColor(...themeColor);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(session.titulo, 105, 20, { align: 'center' });

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(`Fecha: ${session.fecha} | Duración: ${session.duracion} min`, 15, 45);
  doc.text(`Objetivos: ${session.objetivos || 'No definidos'}`, 15, 52);

  // Bloques
  if (session.bloques) {
    session.bloques.forEach((b, i) => {
      doc.setFontSize(14);
      doc.text(`${i+1}. ${b.titulo} (${b.tiempo} min)`, 15, 70 + (i * 40));
      doc.setFontSize(11);
      doc.text(doc.splitTextToSize(b.descripcion, 180), 15, 77 + (i * 40));
    });
  }

  doc.save(`Sesion_${session.titulo}.pdf`);
};
