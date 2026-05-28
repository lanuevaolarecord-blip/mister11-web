import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadPDF } from './download.js';

const THEME_COLOR = [27, 58, 45];
const ACCENT_COLOR = [212, 168, 67];

const getImageBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
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
    return null;
  }
};

export const generateGlobalTeamReport = async (players, tests, evaluaciones, activeTeam = null) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando PDF...' } }));
  await new Promise(r => setTimeout(r, 150));
  try {
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // 1. Cabecera
  doc.setFillColor(27, 58, 45);
  doc.rect(0, 0, pageW, 45, 'F');
  
  const mr11LogoData = await getImageBase64('/logo_mister11.png');
  if (mr11LogoData) {
    doc.addImage(mr11LogoData, 'PNG', 15, 6, 16, 16);
  }
  doc.setTextColor(212, 168, 67);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('MÍSTER11', 35, 17);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('INFORME GLOBAL DE RENDIMIENTO', pageW / 2, 32, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(`Equipo: ${activeTeam?.nombre || 'General'} | Fecha: ${new Date().toLocaleDateString()}`, pageW / 2, 40, { align: 'center' });

  let yPos = 55;

  // 2. Procesar datos
  if (!players || players.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.text('No hay jugadores registrados en el equipo.', 15, yPos);
    save(doc, 'Informe_Global_Vacio.pdf');
    return;
  }

  // Agrupar evaluaciones por jugador para calcular promedios
  const stats = players.map(p => {
    const pEvals = evaluaciones?.filter(e => e.playerId === p.id) || [];
    let physical = 0, technical = 0, tactical = 0;
    let counts = { p: 0, tec: 0, tac: 0 };
    
    // Las evaluaciones en firebase tienen la estructura { ..., val: string/number }
    pEvals.forEach(ev => {
      const testDef = tests?.find(t => t.id === ev.testId);
      if (!testDef) return;
      const v = parseFloat(String(ev.val).replace(',', '.')) || 0;
      
      const cat = (testDef.category || '').toLowerCase();
      const type = (testDef.type || '').toLowerCase();
      
      if (cat.includes('técnic') || cat.includes('tecnic') || cat.includes('pase') || cat.includes('control') || type === 'tecnico') {
        technical += v; counts.tec++;
      } else if (cat.includes('táctic') || cat.includes('tactic') || cat.includes('decisión') || type === 'tactico') {
        tactical += v; counts.tac++;
      } else if (cat.includes('físic') || cat.includes('fisic') || cat.includes('velocidad') || cat.includes('resistencia') || cat.includes('fuerza') || cat.includes('agilidad') || type === 'fisico') {
        physical += v; counts.p++;
      }
    });

    return {
      ...p,
      avgP: counts.p ? (physical / counts.p) : 0,
      avgTec: counts.tec ? (technical / counts.tec) : 0,
      avgTac: counts.tac ? (tactical / counts.tac) : 0,
      totalEvals: pEvals.length
    };
  });

  const teamAvgP = stats.reduce((acc, p) => acc + p.avgP, 0) / stats.length;
  const teamAvgTec = stats.reduce((acc, p) => acc + p.avgTec, 0) / stats.length;
  const teamAvgTac = stats.reduce((acc, p) => acc + p.avgTac, 0) / stats.length;

  // 3. Resumen Global
  doc.setTextColor(27, 58, 45);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('1. PROMEDIOS DEL EQUIPO', 15, yPos);
  yPos += 10;

  const summaryData = [
    ['Área', 'Promedio Global'],
    ['Física', teamAvgP.toFixed(2)],
    ['Técnica', teamAvgTec.toFixed(2)],
    ['Táctica', teamAvgTac.toFixed(2)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    headStyles: { fillColor: THEME_COLOR, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // 4. TOP Jugadores
  if (yPos > pageH - 50) { doc.addPage(); yPos = 20; }
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('2. TOP RENDIMIENTO (TOP 3 POR ÁREA)', 15, yPos);
  yPos += 10;

  const topP = [...stats].filter(p => p.avgP > 0).sort((a, b) => b.avgP - a.avgP).slice(0, 3);
  const topTec = [...stats].filter(p => p.avgTec > 0).sort((a, b) => b.avgTec - a.avgTec).slice(0, 3);
  const topTac = [...stats].filter(p => p.avgTac > 0).sort((a, b) => b.avgTac - a.avgTac).slice(0, 3);

  const topData = [
    ['Área', '1º Puesto', '2º Puesto', '3º Puesto'],
    ['Mejor Física', topP[0]?.name || '-', topP[1]?.name || '-', topP[2]?.name || '-'],
    ['Mejor Técnica', topTec[0]?.name || '-', topTec[1]?.name || '-', topTec[2]?.name || '-'],
    ['Mejor Táctica', topTac[0]?.name || '-', topTac[1]?.name || '-', topTac[2]?.name || '-']
  ];

  autoTable(doc, {
    startY: yPos,
    head: [topData[0]],
    body: topData.slice(1),
    headStyles: { fillColor: [46, 125, 50], textColor: 255 }, // Verde
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // 5. Jugadores que requieren atención
  if (yPos > pageH - 50) { doc.addPage(); yPos = 20; }
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('3. JUGADORES QUE REQUIEREN ATENCIÓN', 15, yPos);
  yPos += 10;

  const attentionData = [];
  stats.forEach(p => {
    let reasons = [];
    if (p.avgP > 0 && p.avgP < teamAvgP * 0.8) reasons.push('Física baja');
    if (p.avgTec > 0 && p.avgTec < teamAvgTec * 0.8) reasons.push('Técnica baja');
    if (p.avgTac > 0 && p.avgTac < teamAvgTac * 0.8) reasons.push('Táctica baja');
    
    if (reasons.length > 0) {
      attentionData.push([p.name || p.nombre, reasons.join(', ')]);
    }
  });

  if (attentionData.length === 0) {
    attentionData.push(['Ninguno', 'Todos rinden cerca o por encima del promedio.']);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Jugador', 'Áreas a mejorar']],
    body: attentionData,
    headStyles: { fillColor: [198, 40, 40], textColor: 255 }, // Rojo
    alternateRowStyles: { fillColor: [255, 240, 240] },
  });
  yPos = doc.lastAutoTable.finalY + 15;

  // 6. Resumen de Evaluaciones por Jugador
  if (yPos > pageH - 60) { doc.addPage(); yPos = 20; }
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(27, 58, 45);
  doc.text('4. REPORTE GENERAL DE JUGADORES', 15, yPos);
  yPos += 10;

  const tableData = stats.map(p => [
    p.name || p.nombre || '-',
    p.totalEvals,
    p.avgP.toFixed(2),
    p.avgTec.toFixed(2),
    p.avgTac.toFixed(2)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Jugador', 'Nº Evals', 'Prom. Físico', 'Prom. Técnico', 'Prom. Táctico']],
    body: tableData,
    headStyles: { fillColor: THEME_COLOR, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  save(doc, `Informe_Global_${activeTeam?.nombre?.replace(/\s+/g, '_') || 'Equipo'}.pdf`);
};

const save = async (doc, filename) => {
  try {
    const pdfBase64 = doc.output('dataurlstring').split(',')[1];
    await downloadPDF(pdfBase64, filename);
  } catch (error) {
    console.error('Error al guardar PDF:', error);
    alert('Error al guardar el PDF. Revisa tu espacio y permisos.');
  }
};
