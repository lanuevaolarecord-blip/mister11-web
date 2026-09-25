/**
 * src/utils/convocationPNGGenerator.js
 * Míster11 — Generador de imagen PNG para convocatorias profesionales
 * 
 * Basado en la gramática visual de convocatorias profesionales de élite:
 * - Lienzo 1080x1920 (9:16)
 * - Paleta Oficial Tierra y Campo (Verde Selva, Verde Campo, Oro)
 * - CERO emojis (iconos Lucide vectoriales nativos)
 * - CERO assets con copyright de terceros
 * - Hora de convocatoria calculada automáticamente como (hora partido - 1h)
 * - Bloques de posición bilingües en Oro con orden canónico (GK -> DEF -> MID -> FWD)
 */

import {
  PALETTE,
  loadImage,
  drawGradientBackground,
  drawBrandTexture,
  drawLucideIcon,
  drawTeamCrest,
  drawOpponentBadge,
  drawPlayerPhoto,
  drawPositionHeader,
  drawPlayerRow,
  drawCoachFooter,
  exportCanvasToPNG
} from './canvasRenderer';

/**
 * Normaliza y clasifica la posición de un jugador en 4 grupos canónicos
 */
export const classifyPosition = (pos = '') => {
  const p = String(pos).trim().toUpperCase();
  if (['POR', 'GK', 'ARQ', 'PORTERO', 'GOALKEEPER', 'ARQUERO'].some(k => p === k || p.includes(k))) {
    return 'GK';
  }
  if ([
    'DEF', 'DF', 'CB', 'LB', 'RB', 'LTD', 'LTI', 'LD', 'LI', 'CAD', 'CAI', 'LWB', 'RWB',
    'DEFENSA', 'CENTRAL', 'LATERAL', 'CEN', 'LAT', 'DEFENDER'
  ].some(k => p === k || p.includes(k))) {
    return 'DEF';
  }
  if ([
    'MED', 'MC', 'MCD', 'MCO', 'MI', 'MD', 'MID',
    'CENTROCAMPISTA', 'MEDIOCAMPISTA', 'VOL', 'VOLANTE', 'PIVOTE', 'INTERIOR', 'MIDFIELDER'
  ].some(k => p === k || p.includes(k))) {
    return 'MID';
  }
  return 'FWD'; // Por defecto o DEL / DC / EXT / ED / EI / FORWARD / DELANTERO
};

/**
 * Calcula la hora de convocatoria restando 1 hora a la hora del partido
 */
export const calculateConvocationTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return '--:--';
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return '--:--';

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);

  if (isNaN(hours)) return '--:--';

  // Restar 1 hora
  hours = (hours - 1 + 24) % 24;
  const padH = String(hours).padStart(2, '0');
  return `${padH}:${minutes}`;
};

/**
 * Genera el PNG de convocatoria profesional en alta resolución
 */
export const generateConvocationPNG = async ({
  teamData = {},
  matchData = {},
  selectedPlayers = [],
  selectedStaff = [],
  coachName = 'Míster Principal',
  lang = 'es',
  orientation = 'vertical' // 'vertical' (1080x1920) o 'horizontal' (1920x1080)
}) => {
  // Esperar a que las fuentes estén listas
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  const isVertical = orientation !== 'horizontal';
  const width = isVertical ? 1080 : 1920;
  const height = isVertical ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D de Canvas');

  // 1. Cargar imágenes concurrentemente
  // El escudo del equipo propio sí puede y debe estar en el PNG
  const teamCrestUrl =
    teamData?.escudo ||
    matchData?.escudo ||
    matchData?.teamEscudo ||
    teamData?.crestUrl ||
    teamData?.escudoUrl ||
    teamData?.logoUrl ||
    teamData?.logo ||
    teamData?.photoUrl ||
    teamData?.shield ||
    '/logo_mister11.png';

  const [teamCrestImg] = await Promise.all([
    loadImage(teamCrestUrl)
  ]);

  // Cargar fotos de los jugadores seleccionados (hasta 18-23)
  const playerImgs = await Promise.all(
    selectedPlayers.map(p => {
      const photoSrc =
        p.photoUrl ||
        p.avatarUrl ||
        p.photo ||
        p.photoPreview ||
        p.foto ||
        p.avatar ||
        p.imageUrl ||
        null;
      return loadImage(photoSrc);
    })
  );

  // 2. Fondo y Textura de Marca
  drawGradientBackground(ctx, width, height);
  drawBrandTexture(ctx, width, height);

  // 3. Franja de Cabecera: Escudos + Título de Convocatoria
  const crestSize = 110;
  const headerTopY = 70;

  // Escudo Propio (Izquierda) - El escudo del equipo propio sí puede y debe estar
  const myTeamName = teamData?.nombre || teamData?.name || 'Míster 11';
  drawTeamCrest(ctx, teamCrestImg, 70, headerTopY, crestSize, myTeamName);

  // Medallón / Escudo Rival (Derecha) - Círculo con iniciales (sin logo de terceros por derechos)
  const opponentName = matchData?.rival || matchData?.opponent || 'Rival';
  drawOpponentBadge(ctx, width - 70 - crestSize, headerTopY, crestSize, opponentName);

  // Título central
  const isEn = lang === 'en' || lang === 'English (EN)';
  const mainTitle = isEn ? 'CONVOCATION' : 'CONVOCATORIA';
  const compText = (matchData.competition || matchData.torneo || matchData.tipo || 'LIGA OFICIAL').toUpperCase();
  const roundText = matchData.round || matchData.jornada ? ` · JORNADA ${matchData.round || matchData.jornada}` : '';

  ctx.save();
  ctx.textAlign = 'center';
  // Subtítulo de Competición en Oro
  ctx.fillStyle = PALETTE.ORO;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${compText}${roundText}`, width / 2, headerTopY + 28);

  // Título Principal
  ctx.fillStyle = PALETTE.BLANCO;
  ctx.font = '900 58px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(mainTitle, width / 2, headerTopY + 84);

  // Nombre del equipo local / propio en sutil
  ctx.fillStyle = 'rgba(245, 240, 232, 0.75)';
  ctx.font = '600 22px system-ui, -apple-system, sans-serif';
  ctx.fillText((teamData.name || teamData.nombre || 'MÍSTER 11').toUpperCase(), width / 2, headerTopY + 118);
  ctx.restore();

  // 4. Bloque de Datos del Partido (chips con iconos Lucide vectoriales)
  const matchInfoY = headerTopY + crestSize + 30;
  const matchInfoH = 80;

  ctx.save();
  // Caja contenedora de info con fondo oscuro elegante
  ctx.fillStyle = PALETTE.DARK_PANEL;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(60, matchInfoY, width - 120, matchInfoH, 12);
  } else {
    ctx.rect(60, matchInfoY, width - 120, matchInfoH);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 168, 67, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Chips de información distribuidos uniformemente
  const matchDate = matchData.date || matchData.fecha || 'Por definir';
  const matchTime = matchData.time || matchData.hora || '12:00';
  const callTime = calculateConvocationTime(matchTime);
  const matchLocation = matchData.location || matchData.lugar || matchData.stadium || 'Campo Municipal';

  const colWidth = (width - 120) / 4;
  const itemY = matchInfoY + matchInfoH / 2;

  // Chip 1: VS Rival
  const c1X = 60 + colWidth * 0.5;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.ORO;
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('PARTIDO', c1X, itemY - 14);
  ctx.fillStyle = PALETTE.BLANCO;
  ctx.font = '700 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(`VS ${opponentName.toUpperCase()}`, c1X, itemY + 14);

  // Chip 2: Fecha (Icono Calendar)
  const c2X = 60 + colWidth * 1.5;
  drawLucideIcon(ctx, 'Calendar', c2X - 60, itemY - 10, 20, PALETTE.ORO);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.MUTED;
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('FECHA', c2X - 32, itemY - 12);
  ctx.fillStyle = PALETTE.BLANCO;
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(matchDate, c2X - 32, itemY + 12);

  // Chip 3: Hora Partido + Convocatoria (-1h) (Icono Clock)
  const c3X = 60 + colWidth * 2.5;
  drawLucideIcon(ctx, 'Clock', c3X - 70, itemY - 10, 20, PALETTE.ORO);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.MUTED;
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`CONV. ${callTime} (-1H)`, c3X - 42, itemY - 12);
  ctx.fillStyle = PALETTE.BLANCO;
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(`INICIO: ${matchTime}`, c3X - 42, itemY + 12);

  // Chip 4: Lugar (Icono MapPin)
  const c4X = 60 + colWidth * 3.5;
  drawLucideIcon(ctx, 'MapPin', c4X - 65, itemY - 10, 20, PALETTE.ORO);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.MUTED;
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('LUGAR', c4X - 38, itemY - 12);
  ctx.fillStyle = PALETTE.BLANCO;
  ctx.font = '700 15px system-ui, -apple-system, sans-serif';
  const locTruncated = matchLocation.length > 18 ? matchLocation.slice(0, 16) + '...' : matchLocation;
  ctx.fillText(locTruncated, c4X - 38, itemY + 12);

  ctx.restore();

  // 5. Agrupación y ordenación de convocados
  const playersWithImgs = selectedPlayers.map((p, idx) => ({
    ...p,
    loadedImg: playerImgs[idx],
    cat: classifyPosition(p.position || p.posicion || p.role),
    dorsalNum: parseInt(p.number !== undefined ? p.number : (p.dorsal || 999), 10) || 999
  }));

  // Ordenar por dorsal dentro de cada categoría
  const groups = {
    GK: playersWithImgs.filter(p => p.cat === 'GK').sort((a, b) => a.dorsalNum - b.dorsalNum),
    DEF: playersWithImgs.filter(p => p.cat === 'DEF').sort((a, b) => a.dorsalNum - b.dorsalNum),
    MID: playersWithImgs.filter(p => p.cat === 'MID').sort((a, b) => a.dorsalNum - b.dorsalNum),
    FWD: playersWithImgs.filter(p => p.cat === 'FWD').sort((a, b) => a.dorsalNum - b.dorsalNum)
  };

  // 6. Renderizar las 4 secciones por posición
  const categories = [
    { key: 'GK', es: 'Porteros', en: 'Goalkeepers', list: groups.GK, isGk: true },
    { key: 'DEF', es: 'Defensas', en: 'Defenders', list: groups.DEF, isGk: false },
    { key: 'MID', es: 'Mediocampistas', en: 'Midfielders', list: groups.MID, isGk: false },
    { key: 'FWD', es: 'Delanteros', en: 'Forwards', list: groups.FWD, isGk: false }
  ];

  let currentY = matchInfoY + matchInfoH + 36;
  const sectionMarginX = 60;
  const sectionWidth = width - 120;
  const rowHeight = 48;
  const colGap = 20;
  const colCount = 2; // Grid de 2 columnas como en la referencia 2
  const itemWidth = (sectionWidth - colGap) / colCount;

  for (const cat of categories) {
    // Dibujar encabezado bilingüe en Oro
    drawPositionHeader(ctx, cat.es, cat.en, sectionMarginX, currentY, sectionWidth);
    currentY += 44;

    if (cat.list.length === 0) {
      // Mensaje sutil si no hay jugadores en esa línea
      ctx.save();
      ctx.fillStyle = 'rgba(245, 240, 232, 0.35)';
      ctx.font = 'italic 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(isEn ? 'No players selected in this position' : 'Sin convocados en esta posición', sectionMarginX + 16, currentY + 16);
      ctx.restore();
      currentY += 32;
      continue;
    }

    // Renderizar tarjetas de jugadores en 2 columnas
    for (let i = 0; i < cat.list.length; i++) {
      const p = cat.list[i];
      const colIndex = i % colCount;
      const rowIndex = Math.floor(i / colCount);

      const px = sectionMarginX + colIndex * (itemWidth + colGap);
      const py = currentY + rowIndex * (rowHeight + 10);

      drawPlayerRow(ctx, p, p.loadedImg, px, py, itemWidth, rowHeight, cat.isGk);
    }

    const rowsCount = Math.ceil(cat.list.length / colCount);
    currentY += rowsCount * (rowHeight + 10) + 24;
  }

  // 7. Pie con Cuerpo Técnico y Branding Oficial Míster11
  const footerY = height - 105;
  const staffToDraw = (selectedStaff && selectedStaff.length > 0) ? selectedStaff : coachName;
  drawCoachFooter(ctx, staffToDraw, width, footerY, lang);

  // 8. Exportar a PNG
  const safeDate = (matchDate || 'partido').replace(/[/\\?%*:|"<> ]/g, '_');
  const safeTeam = (teamData.name || 'equipo').replace(/[/\\?%*:|"<> ]/g, '_');
  const filename = `convocatoria_${safeTeam}_${safeDate}.png`;

  return exportCanvasToPNG(canvas, filename);
};
