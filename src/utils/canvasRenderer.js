/**
 * src/utils/canvasRenderer.js
 * Míster11 — Utilidades de renderizado en Canvas 2D
 * Paleta Oficial Tierra y Campo (Verde Selva #1B3A2D, Verde Campo #4CAF7D, Oro #D4A843).
 * Cero emojis: renderizado vectorial nativo de glifos e iconos Lucide.
 */

// Paleta oficial
export const PALETTE = {
  SELVA_DARK: '#0D2118',
  SELVA: '#1B3A2D',
  SELVA_LIGHT: '#254E3D',
  CAMPO: '#4CAF7D',
  CAMPO_LIGHT: '#68C494',
  ORO: '#D4A843',
  ORO_LIGHT: '#F0C764',
  ARENA: '#F5F0E8',
  BLANCO: '#FFFFFF',
  MUTED: '#94A3B8',
  DARK_PANEL: 'rgba(13, 33, 24, 0.75)',
  CARD_BG: 'rgba(27, 58, 45, 0.65)'
};

/**
 * Carga una imagen de forma asíncrona con crossOrigin
 */
export const loadImage = (src) => {
  return new Promise((resolve) => {
    if (!src || typeof src !== 'string' || src.trim() === '') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

/**
 * Fondo degradado de alta gama Verde Selva -> Verde Campo
 */
export const drawGradientBackground = (ctx, width, height) => {
  const grad = ctx.createLinearGradient(0, 0, width * 0.4, height);
  grad.addColorStop(0, PALETTE.SELVA_DARK);
  grad.addColorStop(0.4, PALETTE.SELVA);
  grad.addColorStop(1, PALETTE.SELVA_LIGHT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Viñeta y brillo radial sutil
  const radial = ctx.createRadialGradient(
    width * 0.5, height * 0.35, 80,
    width * 0.5, height * 0.5, width * 0.8
  );
  radial.addColorStop(0, 'rgba(76, 175, 125, 0.12)');
  radial.addColorStop(0.6, 'rgba(27, 58, 45, 0.05)');
  radial.addColorStop(1, 'rgba(13, 33, 24, 0.6)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);
};

/**
 * Patrón geométrico sutil de líneas tácticas de campo de fútbol
 */
export const drawBrandTexture = (ctx, width, height) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(76, 175, 125, 0.07)';
  ctx.lineWidth = 3;

  // Círculo central estilizado
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.48, width * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  // Punto central
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.48, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(76, 175, 125, 0.09)';
  ctx.fill();

  // Líneas de medio campo y bandas
  ctx.beginPath();
  ctx.moveTo(40, height * 0.48);
  ctx.lineTo(width - 40, height * 0.48);
  ctx.stroke();

  // Área de castigo sutil en parte inferior
  ctx.beginPath();
  ctx.rect(width * 0.2, height * 0.76, width * 0.6, height * 0.22);
  ctx.stroke();

  // Marco exterior decorativo fino
  ctx.strokeStyle = 'rgba(212, 168, 67, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(32, 32, width - 64, height - 64);

  // Acentos en las cuatro esquinas
  const cornerLen = 28;
  ctx.strokeStyle = PALETTE.ORO;
  ctx.lineWidth = 3;
  // Superior Izq
  ctx.beginPath(); ctx.moveTo(32, 32 + cornerLen); ctx.lineTo(32, 32); ctx.lineTo(32 + cornerLen, 32); ctx.stroke();
  // Superior Der
  ctx.beginPath(); ctx.moveTo(width - 32 - cornerLen, 32); ctx.lineTo(width - 32, 32); ctx.lineTo(width - 32, 32 + cornerLen); ctx.stroke();
  // Inferior Izq
  ctx.beginPath(); ctx.moveTo(32, height - 32 - cornerLen); ctx.lineTo(32, height - 32); ctx.lineTo(32 + cornerLen, height - 32); ctx.stroke();
  // Inferior Der
  ctx.beginPath(); ctx.moveTo(width - 32 - cornerLen, height - 32); ctx.lineTo(width - 32, height - 32); ctx.lineTo(width - 32, height - 32 - cornerLen); ctx.stroke();

  ctx.restore();
};

/**
 * Dibuja un icono Lucide vectorial nativo en el Canvas (CERO emojis)
 */
export const drawLucideIcon = (ctx, iconName, x, y, size = 20, color = PALETTE.BLANCO) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const s = size;
  const cx = x + s / 2;
  const cy = y + s / 2;

  switch (iconName) {
    case 'Calendar':
    case 'calendar': {
      // Rectángulo con barra superior y puntos
      ctx.beginPath();
      ctx.rect(x + 2, y + 4, s - 4, s - 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 9);
      ctx.lineTo(x + s - 2, y + 9);
      ctx.stroke();
      // Puntos de fijación
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 1); ctx.lineTo(x + 6, y + 4);
      ctx.moveTo(x + s - 6, y + 1); ctx.lineTo(x + s - 6, y + 4);
      ctx.stroke();
      break;
    }
    case 'Clock':
    case 'clock': {
      // Círculo + manecillas
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - s / 3.5);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + s / 4, cy);
      ctx.stroke();
      break;
    }
    case 'MapPin':
    case 'mapPin': {
      // Chincheta de mapa
      ctx.beginPath();
      ctx.arc(cx, y + s * 0.38, s * 0.3, Math.PI * 0.8, Math.PI * 2.2);
      ctx.lineTo(cx, y + s - 2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, y + s * 0.38, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'Goal':
    case 'glove':
    case 'shield': {
      // Insignia de guardameta / escudo
      ctx.beginPath();
      ctx.moveTo(cx, y + 2);
      ctx.lineTo(x + s - 3, y + 5);
      ctx.lineTo(x + s - 4, y + s * 0.65);
      ctx.quadraticCurveTo(cx, y + s, cx, y + s);
      ctx.quadraticCurveTo(cx, y + s, x + 4, y + s * 0.65);
      ctx.lineTo(x + 3, y + 5);
      ctx.closePath();
      ctx.stroke();
      // Cruz central
      ctx.beginPath();
      ctx.moveTo(cx, y + 6); ctx.lineTo(cx, y + s - 4);
      ctx.moveTo(x + 6, cy); ctx.lineTo(x + s - 6, cy);
      ctx.stroke();
      break;
    }
    default: {
      // Círculo con punto
      ctx.beginPath();
      ctx.arc(cx, cy, s / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
};

/**
 * Dibuja escudo de equipo con fallback profesional a medallón neutro
 */
export const drawTeamCrest = (ctx, img, x, y, size, teamName = 'M11') => {
  ctx.save();
  const radius = size / 2;
  const cx = x + radius;
  const cy = y + radius;

  // Sombra suave
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  // Borde circular exterior dorado
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ORO;
  ctx.fill();

  ctx.shadowColor = 'transparent';

  // Fondo del escudo
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.SELVA_DARK;
  ctx.fill();

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x + 2, y + 2, size - 4, size - 4);
    ctx.restore();
  } else {
    // Medallón neutro con iniciales
    const initials = (teamName || 'M11')
      .split(' ')
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 3)
      .join('')
      .toUpperCase();

    ctx.fillStyle = PALETTE.BLANCO;
    ctx.font = `bold ${Math.round(size * 0.38)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, cx, cy);
  }

  ctx.restore();
};

/**
 * Dibuja la foto del jugador con fallback OBLIGATORIO a círculo Verde Campo + inicial
 */
export const drawPlayerPhoto = (ctx, img, x, y, size, name = 'J') => {
  ctx.save();
  const radius = size / 2;
  const cx = x + radius;
  const cy = y + radius;

  // Borde fino
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.CAMPO;
  ctx.fill();

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1.5, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x + 1.5, y + 1.5, size - 3, size - 3);
    ctx.restore();
  } else {
    // Fallback: inicial en blanco
    const initial = (name || 'J').trim().charAt(0).toUpperCase();
    ctx.fillStyle = PALETTE.BLANCO;
    ctx.font = `bold ${Math.round(size * 0.52)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, cx, cy);
  }

  ctx.restore();
};

/**
 * Encabezado bilingüe de sección de posición en Oro
 */
export const drawPositionHeader = (ctx, textEs, textEn, x, y, width) => {
  ctx.save();
  // Fondo de cinta estilizada
  const h = 34;
  const grad = ctx.createLinearGradient(x, y, x + width, y);
  grad.addColorStop(0, 'rgba(212, 168, 67, 0.22)');
  grad.addColorStop(0.5, 'rgba(212, 168, 67, 0.08)');
  grad.addColorStop(1, 'rgba(212, 168, 67, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, h);

  // Línea acento lateral Oro
  ctx.fillStyle = PALETTE.ORO;
  ctx.fillRect(x, y, 5, h);

  // Texto bilingüe: ES / EN
  ctx.fillStyle = PALETTE.ORO;
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(textEs.toUpperCase(), x + 16, y + h / 2);

  const esWidth = ctx.measureText(textEs.toUpperCase()).width;
  ctx.fillStyle = 'rgba(245, 240, 232, 0.65)';
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(`/  ${textEn.toUpperCase()}`, x + 16 + esWidth + 8, y + h / 2);

  ctx.restore();
};

/**
 * Fila o tarjeta de jugador en el Canvas
 */
export const drawPlayerRow = (ctx, player, img, x, y, width, height, isGk = false) => {
  ctx.save();

  // Fondo sutil para tarjeta de jugador
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, 6);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();

  // Borde muy sutil
  ctx.strokeStyle = 'rgba(76, 175, 125, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Avatar circular
  const avatarSize = height - 12;
  const avatarX = x + 8;
  const avatarY = y + 6;
  drawPlayerPhoto(ctx, img, avatarX, avatarY, avatarSize, player.name || player.nombre);

  // Dorsal destacado en Verde Campo u Oro
  const dorsal = player.number !== undefined && player.number !== null ? String(player.number) : (player.dorsal ? String(player.dorsal) : '-');
  const dorsalX = avatarX + avatarSize + 12;
  const centerY = y + height / 2;

  ctx.fillStyle = isGk ? PALETTE.ORO : PALETTE.CAMPO_LIGHT;
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(dorsal, dorsalX, centerY);

  // Distintivo de portero si aplica
  let nameOffset = dorsalX + 34;
  if (isGk) {
    drawLucideIcon(ctx, 'Goal', nameOffset, centerY - 8, 16, PALETTE.ORO);
    nameOffset += 22;
  }

  // Nombre del jugador
  const fullName = (player.name || player.nombre || '').trim();
  ctx.fillStyle = PALETTE.BLANCO;
  ctx.font = '600 19px system-ui, -apple-system, sans-serif';
  ctx.fillText(fullName, nameOffset, centerY);

  ctx.restore();
};

/**
 * Pie institucional con entrenador y logo Míster11
 */
export const drawCoachFooter = (ctx, coachName, width, y) => {
  ctx.save();
  // Línea divisoria en Oro
  ctx.strokeStyle = 'rgba(212, 168, 67, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(48, y);
  ctx.lineTo(width - 48, y);
  ctx.stroke();

  // Entrenador / Coach
  const coachText = (coachName || 'Míster Principal').toUpperCase();
  ctx.fillStyle = PALETTE.ORO;
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ENTRENADOR / COACH:', 56, y + 30);

  ctx.fillStyle = PALETTE.BLANCO;
  ctx.font = '700 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(coachText, 250, y + 30);

  // Marca Míster11 (derecha)
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.ORO;
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('MÍSTER 11', width - 56, y + 24);

  ctx.fillStyle = 'rgba(245, 240, 232, 0.6)';
  ctx.font = '500 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Generado con Míster11 · Paleta Oficial Tierra y Campo', width - 56, y + 44);

  ctx.restore();
};

/**
 * Exporta el canvas a blob PNG y devuelve url de descarga
 */
export const exportCanvasToPNG = (canvas, filename = 'convocatoria.png') => {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('No se pudo generar el Blob del canvas'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, filename });
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
};
