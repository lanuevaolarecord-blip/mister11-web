import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from '../firebase/firestore-proxy';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { Save, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadPDF } from '../utils/download';
import { APP_VERSION } from '../constants/appVersion';
import { exportMonthlyPlan } from '../utils/exportMonthlyPlan';
import '../styles/planificacion.css';

// --- CONSTANTS ---
const MONTHS = ['Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'];
const DAYS_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const MATRIX_ROWS = [
  { id: 'periodo',   label: 'PERÍODO',        type: 'select', options: ['Prep','Comp','Trans'], colorClass: 'row-periodo' },
  { id: 'carga',     label: 'TIPO MICRO',     type: 'select', options: ['Carga','Ajuste','Choque','Comp','Recup'], colorClass: 'row-carga' },
  { id: 'microciclo',label: 'Nº MICROCICLO',  type: 'number', colorClass: 'row-micro' },
  { id: 'fisio',     label: 'TEST FÍSICO',    type: 'check',  colorClass: 'row-fisio' },
  { id: 'infl',      label: 'DINÁMICA CARGA', type: 'badge',  colorClass: 'row-infl' },
  { id: 'volume',    label: 'VOLUMEN (MIN)',  type: 'number', colorClass: 'row-activ' },
  { id: 'sessions',  label: 'SESIONES',       type: 'number', colorClass: 'row-artist' }
];

// Función auxiliar: obtiene la etiqueta del mes abreviado en español desde una fecha Date
const getMonthLabel = (date) => {
  const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return labels[date.getMonth()];
};

const generateMicrocycles = (startDate = '2025-09-01', sessionDuration = 90, trainingDays = [0, 2, 4]) => {
  const baseDate = new Date(startDate + 'T00:00:00');
  return Array.from({ length: 40 }, (_, i) => {
    // Calcular la fecha de inicio de cada microciclo (1 microciclo = 1 semana)
    const microDate = new Date(baseDate);
    microDate.setDate(baseDate.getDate() + i * 7);
    const month = getMonthLabel(microDate);

    const isPrep = i < 8;
    const isTrans = i > 36;
    const period = isPrep ? 'Prep' : (isTrans ? 'Trans' : 'Comp');
    return {
      id: i + 1,
      month,
      periodo: period,
      carga: isPrep ? 'Carga' : 'Comp',
      microciclo: i + 1,
      fisio: i % 3 !== 0,
      infl: i % 4 === 0 ? '\u2197' : (i % 4 === 1 ? '\u2198' : ''),
      activ: '2H',
      artist: Math.floor(20 + (i % 20)),
      mocior: Math.floor(13 + (i % 18)),
      sessions: trainingDays.length,
      volume: trainingDays.length * sessionDuration,
      physical: isPrep ? 40 : 20,
      technical: 40,
      tactical: isPrep ? 20 : 40,
    };
  });
};

// ── CIRCULAR GAUGE SVG ──────────────────────────────────────────────
const CircularGauge = ({ value, max, size = 90, color = '#4CAF7D', bgColor = '#e5e7eb', label }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bgColor} strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'var(--font-heading)', fontSize: size > 80 ? 22 : 16, fontWeight:900, color, lineHeight:1 }}>{value}</span>
        {label && <span style={{ fontSize:9, color:'#888', fontWeight:600, marginTop:2 }}>{label}</span>}
      </div>
    </div>
  );
};

// ── PROGRESS BAR ────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background:'rgba(0,0,0,0.08)', borderRadius:4, height:8, flex:1, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background: color, borderRadius:4, transition:'width 0.4s ease' }} />
    </div>
  );
};

const Planificacion = () => {
  const { user, activeTeamId, getTeamPath } = useAuth();
  const { activeTeam } = useTeams();
  const { darkMode } = useTheme();
  const { isProActive } = usePlan();
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });

  const [macroInfo, setMacroInfo] = useState({
    startDate: '2025-09-01',
    endDate: '2026-06-15',
    category: activeTeam?.categoria || activeTeam?.category || 'Infantil A',
    objective: 'Adapteremos al equipo en la parte técnica y táctica, mediante trabajos de posición y finalización.',
    trainer: user?.displayName || 'Míster',
    sessionDuration: 90,
    trainingDays: [0, 2, 4],
  });

  const [microcycles, setMicrocycles] = useState(() => generateMicrocycles());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('macrociclo'); // 'macrociclo' | 'mesociclo' | 'microciclo' | 'objetivos'
  const [selectedMicro, setSelectedMicro] = useState(1);
  const [selectedMesoItem, setSelectedMesoItem] = useState(null);

  const mesocycles = useMemo(() => {
    const groups = {};
    microcycles.forEach(mc => {
      if (!groups[mc.month]) groups[mc.month] = { month: mc.month, micros: [], volume: 0, sessions: 0, carga: 0 };
      groups[mc.month].micros.push(mc);
      groups[mc.month].volume += mc.volume;
      groups[mc.month].sessions += mc.sessions;
      if (mc.carga === 'Carga') groups[mc.month].carga += 1;
    });
    return Object.values(groups);
  }, [microcycles]);

  // Macro-ciclo counts
  const [macroCounts, setMacroCounts] = useState({ sesiones: 3, sesionesMax: 10, trabajo: 4, trabajoMax: 10, compet: 2, competMax: 10 });
  const [isLoaded, setIsLoaded] = useState(false);

  // ── LOAD FROM FIRESTORE ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!user || !activeTeamId) return;
      try {
        const ref = doc(db, getTeamPath(), 'planificacion', 'config');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (d.macroInfo) setMacroInfo(prev => ({ ...prev, ...d.macroInfo }));
          if (d.microcycles?.length > 0) setMicrocycles(d.microcycles);
          if (d.macroCounts) setMacroCounts(d.macroCounts);
        }
      } catch (e) { 
        console.error(e); 
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, [user, activeTeamId]);

  // Auto-save planning configuration to Firestore on changes (with a 1.5s debounce)
  useEffect(() => {
    if (!user || !activeTeamId || !isLoaded) return;

    const timer = setTimeout(async () => {
      try {
        const ref = doc(db, getTeamPath(), 'planificacion', 'config');
        await setDoc(ref, { 
          macroInfo, 
          microcycles, 
          macroCounts, 
          updatedAt: serverTimestamp() 
        }, { merge: true });
        console.log("Planificación auto-guardada con éxito");
      } catch (e) {
        console.error("Error en auto-guardado de planificación:", e);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [macroInfo, microcycles, macroCounts, user, activeTeamId, isLoaded]);

  // ── SINCRONIZACIÓN EN CASCADA: Recalcular sessions/volume en todos los microciclos
  // cuando el usuario cambia los días de entrenamiento, la duración de sesión o la fecha de inicio.
  // Esto mantiene la coherencia de datos entre el macrociclo global y la tabla de microciclos.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isLoaded) return; // No sincronizar antes de que Firestore haya cargado los datos iniciales

    const sessionsPerWeek = macroInfo.trainingDays.length;
    const volPerWeek = sessionsPerWeek * Number(macroInfo.sessionDuration || 90);

    // Recalcular también el mes de cada microciclo si cambió startDate
    const baseDate = macroInfo.startDate ? new Date(macroInfo.startDate + 'T00:00:00') : null;
    const monthLabels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    setMicrocycles(prev => prev.map((m, idx) => {
      const updated = {
        ...m,
        sessions: sessionsPerWeek,  // Sincroniza sesiones/semana en todos los microciclos
        volume: volPerWeek,          // Sincroniza volumen/semana (min) en todos los microciclos
      };
      // Re-derivar el mes desde la fecha de inicio si está disponible
      if (baseDate) {
        const microDate = new Date(baseDate);
        microDate.setDate(baseDate.getDate() + idx * 7);
        updated.month = monthLabels[microDate.getMonth()];
      }
      return updated;
    }));
  // Usamos JSON.stringify(trainingDays) para comparación estable de arrays en el dep array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(macroInfo.trainingDays), macroInfo.sessionDuration, macroInfo.startDate, isLoaded]);


  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !activeTeamId) { showToast('Inicia sesión para guardar', 'error'); return; }
    setSaving(true);
    try {
      const ref = doc(db, getTeamPath(), 'planificacion', 'config');
      await setDoc(ref, { macroInfo, microcycles, macroCounts, updatedAt: serverTimestamp() }, { merge: true });
      showToast('Planificación guardada ✓');
    } catch (e) { showToast('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  }, [user, macroInfo, microcycles, macroCounts, showToast, activeTeamId]);

  const handleExportMonthlyPDF = async () => {
    if (!isProActive) {
      setUpgradeModal({ open: true, message: 'La exportación del mesociclo a PDF es una función PRO. Sube de nivel para usarla.' });
      return;
    }
    showToast('Generando PDF del mesociclo...', 'info');
    try {
      const meso = mesocycles.find(m => m.month === selectedMesoItem);
      if (!meso) {
        showToast('Error: No se encontró la información del mes.', 'error');
        return;
      }
      exportMonthlyPlan(meso, macroInfo, activeTeam, APP_VERSION);
      showToast('PDF del mesociclo generado con éxito ✓');
    } catch (err) {
      console.error(err);
      showToast('Error al exportar PDF.', 'error');
    }
  };

  const handleExportPDF = async () => {
    if (!isProActive) {
      setUpgradeModal({ open: true, message: 'La exportación del plan estratégico a PDF es una función PRO. Sube de nivel para usarla.' });
      return;
    }
    showToast('Generando PDF...', 'info');

    try {
      const isLandscape = activeTab === 'macrociclo' || (activeTab === 'mesociclo' && selectedMesoItem);
      const doc = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      // Colores institucionales y tema
      const cDark = [27, 58, 45]; // Verde Institucional (#1B3A2D)
      const cGold = [212, 168, 67]; // #D4A843 (RGB)
      const cBeige = [245, 240, 232]; // #F5F0E8 (RGB)
      const cText = [45, 45, 45];

      // Función para dibujar encabezado común
      const drawHeader = (titleSub) => {
        // Banner principal verde institucional
        doc.setFillColor(cDark[0], cDark[1], cDark[2]);
        doc.rect(0, 0, pdfWidth, 24, 'F');
        
        // Línea decorativa dorada inferior
        doc.setFillColor(cGold[0], cGold[1], cGold[2]);
        doc.rect(0, 24, pdfWidth, 1.5, 'F');

        // Texto principal
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('MÍSTER 11 - PLANIFICACIÓN ESTRATÉGICA', 12, 11);

        // Subtítulo
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(210, 225, 215);
        doc.text(titleSub.toUpperCase(), 12, 17);

        // Nombre del equipo y fecha en el lado derecho
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        const teamNameText = (activeTeam?.nombre || activeTeam?.name || 'MI EQUIPO').toUpperCase();
        doc.text(teamNameText, pdfWidth - 12, 11, { align: 'right' });

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(210, 225, 215);
        const todayStr = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha: ${todayStr} | Versión: ${APP_VERSION}`, pdfWidth - 12, 17, { align: 'right' });
      };

      // Función para dibujar pie de página
      const drawFooter = (pageNum, totalPages) => {
        doc.setFillColor(cDark[0], cDark[1], cDark[2]);
        doc.rect(0, pdfHeight - 10, pdfWidth, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'normal');
        doc.text('Míster 11 - Inteligencia y Gestión Deportiva', 12, pdfHeight - 4);
        doc.text(`Página ${pageNum} de ${totalPages}`, pdfWidth - 12, pdfHeight - 4, { align: 'right' });
      };

      // Función auxiliar para dibujar un indicador de métrica circular en el PDF
      const drawCircleMetric = (x, y, value, max, label, color, bgColor) => {
        // Círculo de fondo (relleno)
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.circle(x, y, 5.5, 'F');

        // Borde del círculo
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.8);
        doc.circle(x, y, 5.5, 'S');

        // Valor numérico
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(color[0], color[1], color[2]);
        const displayVal = max === 100 ? `${value}%` : String(value);
        doc.text(displayVal, x, y + 2.2, { align: 'center' });

        // Etiqueta
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(cDark[0], cDark[1], cDark[2]);
        doc.text(label.toUpperCase(), x, y + 8.5, { align: 'center' });

        // Rango/Fracción
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(cText[0], cText[1], cText[2]);
        const ratioVal = max === 100 ? 'SCORE' : `${value}/${max}`;
        doc.text(ratioVal, x, y + 11.5, { align: 'center' });
      };

      // 1. MACROCICLO TAB
      if (activeTab === 'macrociclo') {
        drawHeader('MACROCICLO COMPLETO (MATRIZ Y DATOS GENERALES)');

        let yPos = 35;

        // Cuadro de Información General
        doc.setFillColor(cBeige[0], cBeige[1], cBeige[2]);
        doc.rect(12, yPos, pdfWidth - 24, 32, 'F');
        
        doc.setTextColor(cDark[0], cDark[1], cDark[2]);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('INFORMACIÓN DE TEMPORADA', 16, yPos + 6);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(cText[0], cText[1], cText[2]);
        doc.text(`Inicio: ${macroInfo.startDate}   Fin: ${macroInfo.endDate}`, 16, yPos + 13);
        doc.text(`Categoría: ${macroInfo.category || 'Infantil A'}`, 16, yPos + 19);
        doc.text(`Entrenador: ${macroInfo.trainer || 'Sin Entrenador'}`, 16, yPos + 25);

        doc.text(`Horas Totales: ${totalHours}h ${remainingMins}min (${totalMinutes} min)`, 110, yPos + 13);
        doc.text(`Duración Sesión: ${macroInfo.sessionDuration} min`, 110, yPos + 19);
        const daysText = macroInfo.trainingDays.map(d => DAYS_LABELS[d]).join(', ');
        doc.text(`Días de Entreno: ${daysText}`, 110, yPos + 25);

        // Indicadores macro-ciclo visuales
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(cDark[0], cDark[1], cDark[2]);
        doc.text('MÉTRICAS CLAVE (CARGA)', 222.5, yPos + 6, { align: 'center' });

        // Dibujar los 4 indicadores circulares alineados
        drawCircleMetric(185, yPos + 16, overallScore, 100, 'Global', cDark, [232, 245, 238]);
        drawCircleMetric(210, yPos + 16, computedMetrics.sesiones, computedMetrics.sesionesMax, 'Sesiones', [27, 58, 45], [232, 245, 238]);
        drawCircleMetric(235, yPos + 16, computedMetrics.trabajo, computedMetrics.trabajoMax, 'Trabajo', [76, 175, 125], [232, 245, 238]);
        drawCircleMetric(260, yPos + 16, computedMetrics.compet, computedMetrics.competMax, 'Compet.', [212, 168, 67], [253, 243, 220]);

        yPos += 37;

        // Objetivo General
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
        doc.rect(12, yPos, pdfWidth - 24, 18);
        
        doc.setTextColor(cDark[0], cDark[1], cDark[2]);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('OBJETIVO GENERAL DE LA TEMPORADA:', 16, yPos + 5);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(cText[0], cText[1], cText[2]);
        const splitObjective = doc.splitTextToSize(macroInfo.objective || 'Sin objetivo general configurado.', pdfWidth - 36);
        doc.text(splitObjective, 16, yPos + 10);

        yPos += 26;

        // Matriz de Planificación (40 Microciclos)
        // La dividiremos en 4 tablas de 10 microciclos cada una para encajar en páginas apaisadas A4.
        const chunkLength = 10;
        const totalMicros = microcycles.length;
        
        for (let chunkIdx = 0; chunkIdx < 4; chunkIdx++) {
          const start = chunkIdx * chunkLength;
          const end = Math.min(start + chunkLength, totalMicros);
          const chunkMicros = microcycles.slice(start, end);

          // Si es la segunda página o posterior de la matriz, agregamos una página y dibujamos encabezado
          if (chunkIdx > 0) {
            doc.addPage();
            drawHeader(`MATRIZ DE PLANIFICACIÓN (MICROCICLOS ${start + 1} AL ${end})`);
            yPos = 30;
          } else {
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(cDark[0], cDark[1], cDark[2]);
            doc.text(`MATRIZ DE MICROCICLOS - PARTE ${chunkIdx + 1}/4`, 12, yPos - 2);
          }

          // Columnas representarán a cada microciclo. Columna 0 es la etiqueta del renglón.
          const headers = ['MÉTRICA / VARIABLE', ...chunkMicros.map(m => `Micro ${m.id}`)];
          
          const rows = [
            ['Mes / Mesociclo', ...chunkMicros.map(m => `${m.month} (Meso ${MONTHS.indexOf(m.month) + 1})`)],
            ['Período', ...chunkMicros.map(m => m.periodo)],
            ['Tipo Micro (Carga)', ...chunkMicros.map(m => m.carga)],
            ['Nº Microciclo', ...chunkMicros.map(m => m.id)],
            ['Test Físico', ...chunkMicros.map(m => m.fisio ? '✓' : '')],
            ['Dinámica Carga', ...chunkMicros.map(m => m.infl || '')],
            ['Volumen (min)', ...chunkMicros.map(m => m.volume)],
            ['Sesiones', ...chunkMicros.map(m => m.sessions)],
            ['% Físico', ...chunkMicros.map(m => `${m.physical}%`)],
            ['% Técnico', ...chunkMicros.map(m => `${m.technical}%`)],
            ['% Táctico', ...chunkMicros.map(m => `${m.tactical}%`)],
          ];

          autoTable(doc, {
            startY: yPos,
            head: [headers],
            body: rows,
            theme: 'grid',
            headStyles: {
              fillColor: cDark,
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold',
              halign: 'center'
            },
            columnStyles: {
              0: { fillColor: cBeige, textColor: cDark, fontStyle: 'bold', fontSize: 8, halign: 'left', cellWidth: 45 }
            },
            styles: {
              fontSize: 8,
              halign: 'center',
              valign: 'middle'
            },
            margin: { left: 12, right: 12 }
          });
        }
      }

      // 2. MESOCICLO TAB
      else if (activeTab === 'mesociclo') {
        if (!selectedMesoItem) {
          // Vista general de todos los mesociclos
          drawHeader('MESOCICLOS - VISTA GENERAL');
          
          let yPos = 35;
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(cDark[0], cDark[1], cDark[2]);
          doc.text('RESUMEN MENSUAL DE LA PLANIFICACIÓN', 12, yPos);

          const headers = ['Mesociclo / Mes', 'Semanas', 'Volumen Total', 'Sesiones Totales', 'Tipo Predominante'];
          const rows = mesocycles.map(meso => [
            `Meso ${MONTHS.indexOf(meso.month) + 1} (${meso.month.toUpperCase()})`,
            `${meso.micros.length} semanas`,
            `${meso.volume} min`,
            meso.sessions,
            meso.carga >= meso.micros.length / 2 ? 'CARGA' : 'COMPETICIÓN'
          ]);

          autoTable(doc, {
            startY: yPos + 5,
            head: [headers],
            body: rows,
            theme: 'striped',
            headStyles: {
              fillColor: cDark,
              textColor: [255, 255, 255],
              fontSize: 9,
              fontStyle: 'bold'
            },
            styles: {
              fontSize: 9,
              valign: 'middle'
            },
            margin: { left: 12, right: 12 }
          });
        } else {
          // Vista de detalle de un mes específico (Landscape para tabla horizontal)
          drawHeader(`DETALLE DEL MESOCICLO: ${selectedMesoItem.toUpperCase()}`);
          
          const meso = mesocycles.find(m => m.month === selectedMesoItem);
          const chunkMicros = meso?.micros || [];
          
          let yPos = 35;
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(cDark[0], cDark[1], cDark[2]);
          doc.text(`SEMANAS REGISTRADAS EN EL MES DE ${selectedMesoItem.toUpperCase()}`, 12, yPos);

          const headers = ['METRICA / VARIABLE', ...chunkMicros.map(m => `Semana ${m.id}`)];
          const rows = [
            ['Mes / Mesociclo', ...chunkMicros.map(m => `${m.month} (Meso ${MONTHS.indexOf(m.month) + 1})`)],
            ['Período', ...chunkMicros.map(m => m.periodo)],
            ['Nº Microciclo', ...chunkMicros.map(m => m.id)],
            ['Test Físico', ...chunkMicros.map(m => m.fisio ? '✓' : '')],
            ['Dinámica Carga', ...chunkMicros.map(m => m.infl || '')],
            ['Volumen (min)', ...chunkMicros.map(m => m.volume)],
            ['Sesiones', ...chunkMicros.map(m => m.sessions)],
            ['% Físico', ...chunkMicros.map(m => `${m.physical}%`)],
            ['% Técnico', ...chunkMicros.map(m => `${m.technical}%`)],
            ['% Táctico', ...chunkMicros.map(m => `${m.tactical}%`)],
          ];

          autoTable(doc, {
            startY: yPos + 5,
            head: [headers],
            body: rows,
            theme: 'grid',
            headStyles: {
              fillColor: cDark,
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold',
              halign: 'center'
            },
            columnStyles: {
              0: { fillColor: cBeige, textColor: cDark, fontStyle: 'bold', fontSize: 8, halign: 'left', cellWidth: 45 }
            },
            styles: {
              fontSize: 8,
              halign: 'center',
              valign: 'middle'
            },
            margin: { left: 12, right: 12 }
          });
        }
      }

      // 3. MICROCICLO SEMANAL TAB
      else if (activeTab === 'microciclo') {
        drawHeader(`MICROCICLO SEMANAL - SEMANA ${selectedMicro}`);
        
        const mc = microcycles.find(m => m.id === selectedMicro) || microcycles[0];
        
        let yPos = 35;

        // Card de Información del Microciclo
        doc.setFillColor(cBeige[0], cBeige[1], cBeige[2]);
        doc.rect(12, yPos, pdfWidth - 24, 20, 'F');
        
        doc.setTextColor(cDark[0], cDark[1], cDark[2]);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`SEMANAS Y METAS - SEMANA ${mc.id} (${mc.month.toUpperCase()})`, 16, yPos + 6);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(cText[0], cText[1], cText[2]);
        doc.text(`Período: ${mc.periodo}  |  Carga: ${mc.carga}  |  Sesiones: ${mc.sessions}  |  Volumen Semanal: ${mc.volume} minutos`, 16, yPos + 13);

        yPos += 28;

        // Tabla de los 7 días
        const headers = ['Día', 'Actividad / Estado', 'Distribución de Trabajo (% Fis / Tec / Tac)'];
        const rows = DAYS_LABELS.map((day, idx) => {
          const isTrainingDay = macroInfo.trainingDays.includes(idx);
          const isMatchDay = idx === 6; // Domingo default
          
          let activityText = 'Descanso';
          let detailsText = '-';
          
          if (isMatchDay) {
            activityText = 'DÍA DE PARTIDO';
          } else if (isTrainingDay) {
            activityText = `Sesión de Entrenamiento (${macroInfo.sessionDuration} min)`;
            detailsText = `Físico: ${mc.physical}%  |  Técnico: ${mc.technical}%  |  Táctico: ${mc.tactical}%`;
          }
          
          return [day.toUpperCase(), activityText, detailsText];
        });

        autoTable(doc, {
          startY: yPos,
          head: [headers],
          body: rows,
          theme: 'striped',
          headStyles: {
            fillColor: cDark,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 9,
            valign: 'middle'
          },
          columnStyles: {
            0: { fontStyle: 'bold', textColor: cDark, cellWidth: 25 },
            1: { cellWidth: 65 }
          },
          margin: { left: 12, right: 12 }
        });
      }

      // 4. OBJETIVOS TAB
      else if (activeTab === 'objetivos') {
        drawHeader('PLANIFICACIÓN ESTRATÉGICA - OBJETIVOS');
        
        let yPos = 35;
        
        // OBJETIVO GENERAL
        doc.setFillColor(cDark[0], cDark[1], cDark[2]);
        doc.rect(12, yPos, pdfWidth - 24, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('🎯 OBJETIVO GENERAL DE TEMPORADA', 16, yPos + 5);

        doc.setFillColor(cBeige[0], cBeige[1], cBeige[2]);
        doc.rect(12, yPos + 7, pdfWidth - 24, 25, 'F');
        
        doc.setTextColor(cText[0], cText[1], cText[2]);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        const splitGeneral = doc.splitTextToSize(macroInfo.objective || 'No se ha configurado un objetivo general.', pdfWidth - 32);
        doc.text(splitGeneral, 16, yPos + 13);

        yPos += 40;

        // OBJETIVOS ESPECÍFICOS (Físico, Técnico, Táctico, Mental)
        const specificObjs = [
          { title: '💪 OBJETIVO FÍSICO', val: macroInfo.objFisico, key: 'objFisico', placeholder: 'Mejorar la resistencia aeróbica y la velocidad de reacción...' },
          { title: '⚽ OBJETIVO TÉCNICO', val: macroInfo.objTecnico, key: 'objTecnico', placeholder: 'Mejorar el control y el pase en espacios reducidos...' },
          { title: '♟️ OBJETIVO TÁCTICO', val: macroInfo.objTactico, key: 'objTactico', placeholder: 'Dominar la presión alta y la salida de balón...' },
          { title: '🧠 OBJETIVO MENTAL', val: macroInfo.objMental, key: 'objMental', placeholder: 'Desarrollar la concentración y el trabajo en equipo...' },
        ];

        specificObjs.forEach(obj => {
          doc.setFillColor(cDark[0], cDark[1], cDark[2]);
          doc.rect(12, yPos, pdfWidth - 24, 7, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(obj.title, 16, yPos + 5);

          // Fondo blanco con borde para los específicos
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(cBeige[0], cBeige[1], cBeige[2]);
          doc.rect(12, yPos + 7, pdfWidth - 24, 22, 'FD');
          
          doc.setTextColor(cText[0], cText[1], cText[2]);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          const splitText = doc.splitTextToSize(obj.val || obj.placeholder, pdfWidth - 32);
          doc.text(splitText, 16, yPos + 13);

          yPos += 36;
        });
      }

      // 5. Dibujar numeración de páginas y pies de página retroactivamente
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
      }

      // 6. Descargar PDF utilizando el helper nativo / web
      const pdfBase64 = doc.output('dataurlstring').split(',')[1];
      let tabName = activeTab.toUpperCase();
      if (activeTab === 'mesociclo' && selectedMesoItem) {
        tabName += `_${selectedMesoItem.toUpperCase()}`;
      }
      const fileName = `Planificacion_${activeTeam?.name || 'Equipo'}_${tabName}.pdf`;

      await downloadPDF(pdfBase64, fileName);
      showToast('PDF exportado ✓');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Error al exportar PDF.', 'error');
    }
  };

  const toggleDay = (idx) => {
    setMacroInfo(prev => {
      const days = prev.trainingDays.includes(idx)
        ? prev.trainingDays.filter(d => d !== idx)
        : [...prev.trainingDays, idx];
      return { ...prev, trainingDays: days };
    });
  };

  const handleMicroChange = (id, field, value) => {
    setMicrocycles(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // ── COMPUTED VALUES ──────────────────────────────────────────────
  const weeklyVolume = macroInfo.trainingDays.length * Number(macroInfo.sessionDuration || 0);
  const totalMinutes = microcycles.reduce((a, m) => a + Number(m.volume || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  const computedMetrics = useMemo(() => {
    let activeMicros = [];
    let title = "MACRO-CICLO";
    
    if (activeTab === 'macrociclo') {
      activeMicros = microcycles;
      title = "MACRO-CICLO";
    } else if (activeTab === 'mesociclo') {
      if (selectedMesoItem) {
        const meso = mesocycles.find(m => m.month === selectedMesoItem);
        activeMicros = meso?.micros || [];
        title = `MESO-CICLO: ${selectedMesoItem.toUpperCase()}`;
      } else {
        activeMicros = microcycles;
        title = "MESO-CICLOS (VISTA GENERAL)";
      }
    }
    
    const sesiones = activeMicros.reduce((sum, m) => sum + (Number(m.sessions) || 0), 0);
    // FIX: El denominador se deriva del mismo parámetro base que el numerador.
    // Antes: activeMicros.length * 4 (hardcodeado → daba 160 con 40 micros, incorrecto si hay ≠4 días)
    // Ahora: activeMicros.length * trainingDays.length (siempre sincronizado con la configuración activa)
    const sesionesMax = activeMicros.length * macroInfo.trainingDays.length;
    
    const trabajo = activeMicros.filter(m => ['Carga', 'Ajuste', 'Choque', 'Recup'].includes(m.carga)).length;
    const trabajoMax = activeMicros.length;
    
    const compet = activeMicros.filter(m => m.carga === 'Comp').length;
    const competMax = activeMicros.length;
    
    const avg = activeMicros.reduce((a, m) => a + (Number(m.physical||0) + Number(m.technical||0) + Number(m.tactical||0)) / 3, 0) / (activeMicros.length || 1);
    const overall = Math.round(avg);

    return {
      title,
      sesiones,
      sesionesMax,
      trabajo,
      trabajoMax,
      compet,
      competMax,
      overall
    };
  }, [activeTab, selectedMesoItem, microcycles, mesocycles, macroInfo]);

  const overallScore = useMemo(() => {
    const avg = microcycles.reduce((a, m) => a + (Number(m.physical||0) + Number(m.technical||0) + Number(m.tactical||0)) / 3, 0) / (microcycles.length || 1);
    return Math.round(avg);
  }, [microcycles]);

  // Group microcycles by month for matrix header
  const monthGroups = useMemo(() => {
    const groups = {};
    microcycles.forEach(m => {
      if (!groups[m.month]) groups[m.month] = [];
      groups[m.month].push(m);
    });
    return groups;
  }, [microcycles]);

  const themeClass = darkMode ? 'dark' : 'light';

  const formatDate = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className={`plan-page ${themeClass}`}>
      {/* TOAST */}
      {toast && (
        <div className={`plan-toast ${toast.type === 'error' ? 'plan-toast-error' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="plan-page-header">
        <h1 className="page-title">PLANIFICACIÓN ESTRATÉGICA</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <FileText size={15} /> EXPORTAR PDF
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Save size={15} /> {saving ? 'GUARDANDO...' : 'GUARDAR'}
          </button>
        </div>
      </div>

      {/* ── TAB BAR ───────────────────────────────────────── */}
      <div className="plan-tab-bar">
        {[
          { id: 'macrociclo', label: 'MACROCICLO (PLANTILLA)' },
          { id: 'mesociclo',  label: 'MESOCICLO' },
          { id: 'microciclo', label: 'MICROCICLO SEMANAL' },
          { id: 'objetivos',  label: 'OBJETIVOS' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`plan-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────── */}
      <div id="plan-export-container">
        {activeTab === 'macrociclo' && (<>
      <div className="plan-top-grid">

        {/* CARD 1 — FECHAS DE TEMPORADA */}
        <div className="plan-card plan-card-fechas">
          <div className="plan-card-label">
            <span className="plan-icon">📅</span> RANGO DE FECHAS
          </div>
          <div className="plan-date-row">
            <div className="plan-date-block">
              <label>Inicio</label>
              <input type="date" value={macroInfo.startDate}
                onChange={e => setMacroInfo(p => ({ ...p, startDate: e.target.value }))}
                className="plan-date-input" />
            </div>
            <div className="plan-date-block">
              <label>Fin</label>
              <input type="date" value={macroInfo.endDate}
                onChange={e => setMacroInfo(p => ({ ...p, endDate: e.target.value }))}
                className="plan-date-input" />
            </div>
          </div>
        </div>

        {/* CARD 2 — DÍAS DE ENTRENAMIENTO */}
        <div className="plan-card plan-card-dias">
          <div className="plan-card-label">
            <span className="plan-icon">⚙</span> DÍAS DE ENTRENAMIENTO
          </div>
          <div className="plan-days-row">
            {DAYS_LABELS.map((day, idx) => (
              <button key={idx}
                className={`plan-day-btn ${macroInfo.trainingDays.includes(idx) ? 'active' : ''}`}
                onClick={() => toggleDay(idx)}>
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* CARD 3 — CATEGORÍA */}
        <div className="plan-card plan-card-categoria">
          <div className="plan-card-label">
            <span className="plan-icon">⊞</span> CATEGORÍA
          </div>
          <input
            className="plan-cat-input"
            value={macroInfo.category}
            onChange={e => setMacroInfo(p => ({ ...p, category: e.target.value }))}
            placeholder="Ej: Infantil A"
          />
          <div className="plan-trainer-row">
            <span className="plan-trainer-label">
              <span style={{ marginRight: 6 }}>👤</span> ENTRENADOR
            </span>
          </div>
          <div className="plan-trainer-name-row">
            <div className="plan-trainer-avatar">
              {(macroInfo.trainer || 'M').charAt(0).toUpperCase()}
            </div>
            <input
              className="plan-trainer-input"
              value={macroInfo.trainer}
              onChange={e => setMacroInfo(p => ({ ...p, trainer: e.target.value }))}
              placeholder="Nombre entrenador"
            />
          </div>
        </div>

        {/* CARD 4 — VOLUMEN TEMPORADA */}
        <div className="plan-card plan-card-volumen">
          <div className="plan-card-label">
            <span className="plan-icon">⌛</span> VOLUMEN TEMPORADA
          </div>
          <div className="plan-volumen-body">
            <CircularGauge value={weeklyVolume} max={600} size={96} color="#4CAF7D" bgColor="#e0ede6" label="min/sem" />
            <div className="plan-volumen-text">
              <div className="plan-volumen-big">{weeklyVolume} <span className="plan-volumen-unit">min</span></div>
              <div className="plan-volumen-sub">{totalHours}h {remainingMins}min ({totalMinutes} minutos totales)</div>
              <div className="plan-session-dur-row">
                <label className="plan-session-label">Duración sesión:</label>
                <input type="number" value={macroInfo.sessionDuration} min={30} max={180}
                  onChange={e => setMacroInfo(p => ({ ...p, sessionDuration: Number(e.target.value) }))}
                  className="plan-dur-input" />
                <span className="plan-session-label">min</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CARD 5 — OBJETIVO GENERAL (100% Ancho) */}
      <div className="plan-card plan-card-objetivo">
        <div className="plan-card-label">
          <span className="plan-icon">🎯</span> OBJETIVO GENERAL DE LA TEMPORADA
        </div>
        <div className="plan-objetivo-body">
          <textarea
            className="plan-objetivo-textarea"
            value={macroInfo.objective}
            onChange={e => setMacroInfo(p => ({ ...p, objective: e.target.value }))}
            rows={3}
            placeholder="Escribe el objetivo general de la temporada..."
          />
          <div className="plan-objetivo-icon">🤝</div>
        </div>
      </div>

      {/* ── ROW 2: MACRO-CICLO ──────────────────────────────────────── */}
      <div className="plan-macro-card">
        <div className="plan-macro-header">
          <span className="plan-macro-title-icon">⟳</span>
          <span className="plan-macro-title">{computedMetrics.title}</span>
          <div className="plan-macro-legend">
            <span className="plan-legend-chip chip-sesiones">Sesiones {computedMetrics.sesiones}/{computedMetrics.sesionesMax}</span>
            <span className="plan-legend-chip chip-trabajo">🏋 Trabajo {computedMetrics.trabajo}/{computedMetrics.trabajoMax}</span>
            <span className="plan-legend-chip chip-compet">● Compet. {computedMetrics.compet}/{computedMetrics.competMax}</span>
          </div>
        </div>

        <div className="plan-macro-body">
          {/* Left: score circle */}
          <div className="plan-macro-score">
            <CircularGauge value={computedMetrics.sesiones} max={computedMetrics.sesionesMax} size={100} color="#1B3A2D" bgColor="#E8F5EE" />
          </div>

          {/* Center & right: 3 metric groups */}
          <div className="plan-macro-metrics">

            {/* SESIONES */}
            <div className="plan-metric-group">
              <div className="plan-metric-header">
                <span className="plan-metric-icon">📅</span>
                <span className="plan-metric-name">SESIONES</span>
                <span className="plan-metric-count">{computedMetrics.sesiones}/{computedMetrics.sesionesMax}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, minHeight: '32px' }}>
                <ProgressBar value={computedMetrics.sesiones} max={computedMetrics.sesionesMax} color="#1B3A2D" />
                <span className="plan-metric-value-display" style={{ fontWeight: 800, fontSize: '13px', color: '#1B3A2D', whiteSpace: 'nowrap' }}>
                  {computedMetrics.sesiones} / {computedMetrics.sesionesMax}
                </span>
              </div>
            </div>

            {/* Score 2 */}
            <div className="plan-macro-score-mid">
              <CircularGauge value={computedMetrics.trabajo} max={computedMetrics.trabajoMax} size={90} color="#4CAF7D" bgColor="#E8F5EE" />
            </div>

            {/* TRABAJO */}
            <div className="plan-metric-group">
              <div className="plan-metric-header">
                <span className="plan-metric-icon">🏋</span>
                <span className="plan-metric-name">TRABAJO</span>
                <span className="plan-metric-badge">Tektips</span>
                <span className="plan-metric-count">{computedMetrics.trabajo}/{computedMetrics.trabajoMax}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, minHeight: '32px' }}>
                <ProgressBar value={computedMetrics.trabajo} max={computedMetrics.trabajoMax} color="#4CAF7D" />
                <span className="plan-metric-value-display" style={{ fontWeight: 800, fontSize: '13px', color: '#4CAF7D', whiteSpace: 'nowrap' }}>
                  {computedMetrics.trabajo} / {computedMetrics.trabajoMax}
                </span>
              </div>
            </div>

            {/* Score 3 */}
            <div className="plan-macro-score-mid">
              <CircularGauge value={computedMetrics.compet} max={computedMetrics.competMax} size={90} color="#D4A843" bgColor="#FDF3DC" />
            </div>

            {/* COMPET */}
            <div className="plan-metric-group">
              <div className="plan-metric-header">
                <span className="plan-metric-icon">🏆</span>
                <span className="plan-metric-name">COMPET.</span>
                <span className="plan-metric-badge chip-compet-badge">Competencia</span>
                <span className="plan-metric-count">{computedMetrics.compet}/{computedMetrics.competMax}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, minHeight: '32px' }}>
                <ProgressBar value={computedMetrics.compet} max={computedMetrics.competMax} color="#D4A843" />
                <span className="plan-metric-value-display" style={{ fontWeight: 800, fontSize: '13px', color: '#D4A843', whiteSpace: 'nowrap' }}>
                  {computedMetrics.compet} / {computedMetrics.competMax}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── ROW 3: PLANNING MATRIX ─────────────────────────────────── */}
      <div className="plan-matrix-card">
        <div className="plan-matrix-title">MATRIZ DE PLANIFICACIÓN</div>
        <div className="plan-matrix-scroll">
          <table className="plan-matrix-table">
            <thead>
              {/* Month header row */}
              <tr className="plan-mrow plan-mrow-month">
                <th className="plan-msticky plan-mlabel-cell">MESES</th>
                {Object.entries(monthGroups).map(([month, weeks]) => (
                  <th key={month} colSpan={weeks.length} className="plan-month-header">
                    {month}
                  </th>
                ))}
              </tr>
              {/* Carga sub-header */}
              <tr className="plan-mrow plan-mrow-carga">
                <th className="plan-msticky plan-mlabel-cell">TIPO MICRO</th>
                {microcycles.map(m => (
                  <th key={m.id} className="plan-mcell plan-mcell-carga">
                    <select value={m.carga} onChange={e => handleMicroChange(m.id, 'carga', e.target.value)}
                      className="plan-cell-select plan-cell-select-carga">
                      <option>Carga</option>
                      <option>Ajuste</option>
                      <option>Choque</option>
                      <option>Comp</option>
                      <option>Recup</option>
                    </select>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* CARGA row */}
              <tr className="plan-mrow plan-mrow-alt">
                <td className="plan-msticky plan-mlabel-cell">PERÍODOS</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <select value={m.periodo} onChange={e => handleMicroChange(m.id, 'periodo', e.target.value)}
                      className="plan-cell-select">
                      <option>Prep</option><option>Comp</option><option>Trans</option>
                    </select>
                  </td>
                ))}
              </tr>

              {/* Nº MICROCICLO */}
              <tr className="plan-mrow">
                <td className="plan-msticky plan-mlabel-cell">Nº MICROCICLO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell plan-mcell-num">
                    {m.id}
                  </td>
                ))}
              </tr>

              {/* FISIOLÓGICO — checkmarks */}
              <tr className="plan-mrow plan-mrow-fisio">
                <td className="plan-msticky plan-mlabel-cell">TEST FÍSICO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell" style={{ cursor:'pointer' }}
                    onClick={() => handleMicroChange(m.id, 'fisio', !m.fisio)}>
                    <span className={`plan-check ${m.fisio ? 'plan-check-active' : ''}`}>
                      {m.fisio ? '✓' : ''}
                    </span>
                  </td>
                ))}
              </tr>

              {/* INFL EMBD — arrows */}
              <tr className="plan-mrow plan-mrow-infl">
                <td className="plan-msticky plan-mlabel-cell">DINÁMICA CARGA</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell" style={{ cursor:'pointer' }}
                    onClick={() => {
                      const next = m.infl === '' ? '↗' : m.infl === '↗' ? '↘' : m.infl === '↘' ? '↗' : '';
                      handleMicroChange(m.id, 'infl', next);
                    }}>
                    <span className={`plan-arrow-badge plan-arrow-${m.infl === '↗' ? 'up' : m.infl === '↘' ? 'down' : 'none'}`}>
                      {m.infl || ''}
                    </span>
                  </td>
                ))}
              </tr>

              {/* VOLUMEN (MIN) */}
              <tr className="plan-mrow plan-mrow-activ">
                <td className="plan-msticky plan-mlabel-cell">VOLUMEN (MIN)</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.volume}
                      onChange={e => handleMicroChange(m.id, 'volume', e.target.value)} />
                  </td>
                ))}
              </tr>

              {/* SESIONES */}
              <tr className="plan-mrow">
                <td className="plan-msticky plan-mlabel-cell">SESIONES</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.sessions}
                      onChange={e => handleMicroChange(m.id, 'sessions', e.target.value)} />
                  </td>
                ))}
              </tr>

              {/* Deleted MOCIOR BMIN */}

              {/* % FÍSICO */}
              <tr className="plan-mrow plan-mrow-fisic">
                <td className="plan-msticky plan-mlabel-cell">% FÍSICO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.physical}
                      onChange={e => handleMicroChange(m.id, 'physical', e.target.value)} />
                  </td>
                ))}
              </tr>

              {/* % TÉCNICO */}
              <tr className="plan-mrow plan-mrow-tecnico">
                <td className="plan-msticky plan-mlabel-cell">% TÉCNICO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.technical}
                      onChange={e => handleMicroChange(m.id, 'technical', e.target.value)} />
                  </td>
                ))}
              </tr>

              {/* % TÁCTICO */}
              <tr className="plan-mrow plan-mrow-tactico">
                <td className="plan-msticky plan-mlabel-cell">% TÁCTICO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.tactical}
                      onChange={e => handleMicroChange(m.id, 'tactical', e.target.value)} />
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Matrix footer */}
        <div className="plan-matrix-footer">
          <div className="plan-matrix-footer-info">
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              {totalHours}h {remainingMins}min
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
              ({totalMinutes} minutos totales) · {macroInfo.trainingDays.length} días/sem
            </span>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 24px', fontSize:13 }}>
            <Save size={15} /> {saving ? 'GUARDANDO...' : 'GUARDAR PLANIFICACIÓN'}
          </button>
        </div>
      </div>

      </>) /* end macrociclo tab */}

      {/* ── MESOCICLO TAB ─────────────────────────────────── */}
      {activeTab === 'mesociclo' && (
        <div className="plan-meso-tab">
          {!selectedMesoItem ? (
            <div className="plan-meso-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {mesocycles.map((meso, idx) => (
                <div key={idx} className="plan-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedMesoItem(meso.month)}>
                  <div className="plan-card-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><span className="plan-icon">📆</span> MES {meso.month.toUpperCase()}</span>
                    <span className="plan-legend-chip chip-sesiones">{meso.micros.length} Semanas</span>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e8e0d0', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>VOLUMEN TOTAL</span>
                      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>{meso.volume} min</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e8e0d0', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>SESIONES</span>
                      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>{meso.sessions}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>TIPO PREDOMINANTE</span>
                      <span className={`plan-metric-badge ${meso.carga >= meso.micros.length / 2 ? '' : 'chip-compet-badge'}`}>
                        {meso.carga >= meso.micros.length / 2 ? 'CARGA' : 'COMPETICIÓN'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="plan-meso-detail">
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button 
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 13, background: '#fff', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setSelectedMesoItem(null)}
                >
                  ← Volver a Mesociclos
                </button>
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>Detalle del Mes: {selectedMesoItem.toUpperCase()}</h3>
                <button 
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: 13, background: '#004B87', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleExportMonthlyPDF}
                >
                  📄 Exportar mes a PDF
                </button>
              </div>
              <div className="plan-matrix-container" style={{ overflowX: 'auto', background: darkMode ? 'var(--bg-secondary)' : '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <table className="plan-matrix-table" style={{ width: '100%', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th className="plan-msticky plan-mheader" style={{ width: '140px' }}>MES</th>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <th key={m.id} className="plan-mheader">
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-color)' }}>{m.month.toUpperCase()}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* PERÍODOS */}
                    <tr className="plan-mrow plan-mrow-alt">
                      <td className="plan-msticky plan-mlabel-cell">PERÍODOS</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell">
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{m.periodo}</span>
                        </td>
                      ))}
                    </tr>
                    {/* Nº MICROCICLO */}
                    <tr className="plan-mrow">
                      <td className="plan-msticky plan-mlabel-cell">Nº MICROCICLO</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell plan-mcell-num">{m.id}</td>
                      ))}
                    </tr>
                    {/* TEST FÍSICO */}
                    <tr className="plan-mrow plan-mrow-fisio">
                      <td className="plan-msticky plan-mlabel-cell">TEST FÍSICO</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell">
                          <span className={`plan-check ${m.fisio ? 'plan-check-active' : ''}`}>{m.fisio ? '✓' : ''}</span>
                        </td>
                      ))}
                    </tr>
                    {/* DINÁMICA CARGA */}
                    <tr className="plan-mrow plan-mrow-infl">
                      <td className="plan-msticky plan-mlabel-cell">DINÁMICA CARGA</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell">
                          <span className={`plan-arrow-badge plan-arrow-${m.infl === '↗' ? 'up' : m.infl === '↘' ? 'down' : 'none'}`}>
                            {m.infl || ''}
                          </span>
                        </td>
                      ))}
                    </tr>
                    {/* VOLUMEN (MIN) */}
                    <tr className="plan-mrow plan-mrow-activ">
                      <td className="plan-msticky plan-mlabel-cell">VOLUMEN (MIN)</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell"><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.volume}</span></td>
                      ))}
                    </tr>
                    {/* SESIONES */}
                    <tr className="plan-mrow">
                      <td className="plan-msticky plan-mlabel-cell">SESIONES</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell"><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.sessions}</span></td>
                      ))}
                    </tr>
                    {/* % FÍSICO */}
                    <tr className="plan-mrow plan-mrow-fisic">
                      <td className="plan-msticky plan-mlabel-cell">% FÍSICO</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell"><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.physical}</span></td>
                      ))}
                    </tr>
                    {/* % TÉCNICO */}
                    <tr className="plan-mrow plan-mrow-tecnico">
                      <td className="plan-msticky plan-mlabel-cell">% TÉCNICO</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell"><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.technical}</span></td>
                      ))}
                    </tr>
                    {/* % TÁCTICO */}
                    <tr className="plan-mrow plan-mrow-tactico">
                      <td className="plan-msticky plan-mlabel-cell">% TÁCTICO</td>
                      {mesocycles.find(m => m.month === selectedMesoItem)?.micros.map(m => (
                        <td key={m.id} className="plan-mcell"><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.tactical}</span></td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MICROCICLO SEMANAL TAB ────────────────────────── */}
      {activeTab === 'microciclo' && (
        <div className="plan-micro-tab">
          <div className="plan-card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div className="plan-card-label"><span className="plan-icon">📅</span> SELECCIONAR SEMANA</div>
            <select 
              className="plan-dur-input" 
              style={{ width: 'auto', minWidth: '160px' }}
              value={selectedMicro} 
              onChange={e => setSelectedMicro(Number(e.target.value))}
            >
              {microcycles.map(mc => (
                <option key={mc.id} value={mc.id}>Semana {mc.microciclo} - {mc.month} ({mc.periodo})</option>
              ))}
            </select>
            {microcycles.find(m => m.id === selectedMicro) && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <span className="plan-legend-chip chip-sesiones">{microcycles.find(m => m.id === selectedMicro).carga}</span>
                <span className="plan-legend-chip chip-trabajo">{microcycles.find(m => m.id === selectedMicro).volume} min</span>
              </div>
            )}
          </div>
          
          <div className="plan-micro-week" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DAYS_LABELS.map((day, idx) => {
              const currentMicro = microcycles.find(m => m.id === selectedMicro) || microcycles[0];
              const isTrainingDay = macroInfo.trainingDays.includes(idx);
              const isMatchDay = idx === 6; // Sunday default
              const isRestDay = !isTrainingDay && !isMatchDay;
              
              let statusText = 'Descanso';
              let statusColor = '#888';
              let statusBg = 'transparent';
              
              if (isMatchDay) {
                statusText = 'Día de Partido';
                statusColor = '#8C6D1F';
                statusBg = '#FDF3DC';
              } else if (isTrainingDay) {
                statusText = `Sesión (${macroInfo.sessionDuration} min)`;
                statusColor = 'var(--text-primary)';
                statusBg = '#E8F5EE';
              }
              
              return (
                <div key={idx} className="plan-card" style={{ flexDirection: 'row', alignItems: 'center', padding: '12px 16px', background: isRestDay ? (darkMode ? 'transparent' : '#fdfdfd') : '' }}>
                  <div style={{ width: 60, fontSize: 13, fontWeight: 900, color: isRestDay ? '#aaa' : 'var(--text-primary)' }}>{day}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, color: statusColor, background: statusBg, border: `1px solid ${statusBg !== 'transparent' ? statusColor + '40' : '#ddd'}` }}>
                      {statusText}
                    </span>
                  </div>
                  {isTrainingDay && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{currentMicro.physical}%</div>
                        <div style={{ fontSize: 9 }}>Físico</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{currentMicro.technical}%</div>
                        <div style={{ fontSize: 9 }}>Técnico</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{currentMicro.tactical}%</div>
                        <div style={{ fontSize: 9 }}>Táctico</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── OBJETIVOS TAB ─────────────────────────────────── */}
      {activeTab === 'objetivos' && (
        <div className="plan-objetivos-tab">
          <div className="plan-card" style={{ marginBottom: 16 }}>
            <div className="plan-card-label"><span className="plan-icon">🎯</span> OBJETIVO GENERAL DE TEMPORADA</div>
            <textarea
              className="plan-objetivo-textarea"
              style={{ minHeight: 120, border: '1px solid #e0d9cc', borderRadius: 8, padding: '10px 12px', background: '#fff', width: '100%', boxSizing: 'border-box' }}
              value={macroInfo.objective}
              onChange={e => setMacroInfo(p => ({ ...p, objective: e.target.value }))}
              placeholder="Describe el objetivo principal de la temporada..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: '💪', label: 'OBJETIVO FÍSICO', key: 'objFisico', placeholder: 'Mejorar la resistencia aeróbica y la velocidad de reacción...' },
              { icon: '⚽', label: 'OBJETIVO TÉCNICO', key: 'objTecnico', placeholder: 'Mejorar el control y el pase en espacios reducidos...' },
              { icon: '♟️', label: 'OBJETIVO TÁCTICO', key: 'objTactico', placeholder: 'Dominar la presión alta y la salida de balón...' },
              { icon: '🧠', label: 'OBJETIVO MENTAL', key: 'objMental', placeholder: 'Desarrollar la concentración y el trabajo en equipo...' },
            ].map(({ icon, label, key, placeholder }) => (
              <div key={key} className="plan-card">
                <div className="plan-card-label"><span className="plan-icon">{icon}</span> {label}</div>
                <textarea
                  className="plan-objetivo-textarea"
                  style={{ minHeight: 90, border: '1px solid #e0d9cc', borderRadius: 8, padding: '8px 10px', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                  value={macroInfo[key] || ''}
                  onChange={e => setMacroInfo(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <UpgradeModal isOpen={upgradeModal.open} onClose={() => setUpgradeModal({ ...upgradeModal, open: false })} message={upgradeModal.message} />
      </div>
    </div>
  );
};

export default Planificacion;
