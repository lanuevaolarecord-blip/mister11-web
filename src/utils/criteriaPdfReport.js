/**
 * src/utils/criteriaPdfReport.js
 * Míster11 — Generador PDF del Manual de Criterios de Captura
 *
 * Genera un PDF imprimible para el segundo anotador/delegado a pie de campo
 * con definiciones operativas binarias, ejemplos de banda y métricas alimentadas.
 */

import { savePdfUniversal } from './pdfGenerator';
import { cleanPdfText, drawPdfFooter, PDF_COLORS } from './pdfTheme';
import { CAPTURE_CRITERIA } from '../config/captureCriteria';

const getPdfLibs = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.default || autoTableMod;
  return { jsPDF, autoTable };
};

/**
 * Genera y descarga el PDF imprimible del Manual de Criterios de Captura.
 * @param {Object} options
 * @param {string} [options.teamName]
 * @param {string} [options.language]
 */
export async function generateCriteriaPdfReport({ teamName = 'Míster11', language = 'es' } = {}) {
  const { jsPDF, autoTable } = await getPdfLibs();
  const isEn = String(language).toLowerCase().includes('en');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  let currentY = 36;

  // ── 1. Cabecera Institucional ──────────────────────────────────────────────
  doc.setFillColor(30, 58, 138); // Azul Institucional #1E3A8A
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(
    cleanPdfText(isEn ? 'TACTICAL CAPTURE CRITERIA MANUAL' : 'MANUAL DE CRITERIOS DE CAPTURA TÁCTICA'),
    margin,
    28
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    cleanPdfText(isEn ? `${teamName} · Official Touchline Protocol` : `${teamName} · Protocolo Oficial de Banda`),
    margin,
    46
  );

  currentY = 80;

  // ── 2. Introducción y Regla Operativa ───────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    cleanPdfText(isEn ? 'OPERATIONAL GUIDELINES (SINGLE SOURCE OF TRUTH)' : 'DIRECTRICES OPERATIVAS (FUENTE ÚNICA DE VERDAD)'),
    margin,
    currentY
  );
  currentY += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const introText = isEn
    ? 'This document establishes the official recording benchmarks for in-match statistics. Every event is evaluated through a strict binary rule (YES/NO) to ensure consistency, transparency, and prevent subjective inflation.'
    : 'Este documento establece las reglas oficiales de registro estadístico en vivo. Cada acción se evalúa mediante una regla binaria estricta (SÍ/NO) para garantizar coherencia y evitar inflaciones subjetivas.';
  
  const splitIntro = doc.splitTextToSize(cleanPdfText(introText), pageWidth - margin * 2);
  doc.text(splitIntro, margin, currentY);
  currentY += (splitIntro.length * 12) + 12;

  // ── 3. Tabla de Criterios ──────────────────────────────────────────────────
  const tableHeaders = isEn
    ? [['Event', 'Binary Operational Rule', 'When YES / When NO', 'Touchline Example', 'Button & Feeds']]
    : [['Evento', 'Regla Binaria Operativa', 'Cuándo SÍ / Cuándo NO', 'Ejemplo a pie de banda', 'Botón y Métricas']];

  const tableRows = CAPTURE_CRITERIA.map(item => {
    const eventName = isEn ? item.nameEn : item.nameEs;
    const rule = isEn ? item.binaryRuleEn : item.binaryRuleEs;
    const yesNo = isEn
      ? `YES: ${item.whenYesEn}\nNO: ${item.whenNoEn}`
      : `SÍ: ${item.whenYesEs}\nNO: ${item.whenNoEs}`;
    const example = isEn ? item.touchlineExampleEn : item.touchlineExampleEs;
    const feeds = `${item.buttonLabel}\n-> ${item.feeds.join(', ')}`;

    return [
      cleanPdfText(eventName),
      cleanPdfText(rule),
      cleanPdfText(yesNo),
      cleanPdfText(example),
      cleanPdfText(feeds),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    margin: { left: margin, right: margin, bottom: 45 },
    styles: {
      fontSize: 8,
      cellPadding: 6,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      valign: 'top',
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 120 },
      2: { cellWidth: 130 },
      3: { cellWidth: 100 },
      4: { cellWidth: 93 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: () => {
      // Pie de página institucional
      drawPdfFooter(doc, {
        teamName,
        isEn,
        footerText: isEn ? 'Míster11 · Data Capture Standards' : 'Míster11 · Manual de Criterios de Captura',
      });
    },
  });

  const filename = isEn ? 'Mister11_Capture_Criteria_Manual.pdf' : 'Mister11_Manual_Criterios_Captura.pdf';
  savePdfUniversal(doc, filename);
  return doc;
}

export default generateCriteriaPdfReport;
