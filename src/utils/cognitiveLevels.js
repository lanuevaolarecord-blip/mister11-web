/**
 * src/utils/cognitiveLevels.js
 * MÍSTER11 v1.1.65 — Motor de Progresión Adaptativa por Categoría y Edad
 * Fuente de verdad: APÉNDICE B
 */

/**
 * Calcula la categoría federativa según la fecha de nacimiento.
 * @param {string|Date|number} birthDate 
 * @returns {'benjamin'|'alevin'|'infantil'|'cadete'|'juvenil_adulto'}
 */
export function getCategoria(birthDate) {
  if (!birthDate) return 'juvenil_adulto';
  const birth = new Date(birthDate).getTime();
  if (isNaN(birth)) return 'juvenil_adulto';
  const edad = Math.floor((Date.now() - birth) / 31557600000);
  if (edad <= 9) return 'benjamin';
  if (edad <= 11) return 'alevin';
  if (edad <= 13) return 'infantil';
  if (edad <= 15) return 'cadete';
  return 'juvenil_adulto';
}

export const NIVELES = ['bronce', 'plata', 'oro', 'diamante', 'leyenda'];

export const NIVEL_LABELS = {
  bronce: { es: 'Bronce', en: 'Bronze', badge: '🥉', color: '#CD7F32' },
  plata: { es: 'Plata', en: 'Silver', badge: '🥈', color: '#9E9E9E' },
  oro: { es: 'Oro', en: 'Gold', badge: '🥇', color: '#F1C40F' },
  diamante: { es: 'Diamante', en: 'Diamond', badge: '💎', color: '#00BCD4' },
  leyenda: { es: 'Leyenda', en: 'Legend', badge: '👑', color: '#9C27B0' },
};

/* Umbrales REALISTAS por categoría (para subir al siguiente nivel) */
export const UMBRALES = {
  benjamin: {
    semaforo: [{ med: 500, fs: 3 }, { med: 450, fs: 2 }, { med: 400, fs: 1 }, { med: 360, fs: 0 }],
    freno: [{ p: 70, ff: 4 }, { p: 78, ff: 2 }, { p: 85, ff: 1 }, { p: 90, ff: 0 }],
    ojo: [{ a: 3 }, { a: 4 }, { a: 5 }, { a: 5 }],
    memoria: [{ s: 5 }, { s: 6 }, { s: 7 }, { s: 8 }],
    decision: [{ p: 60 }, { p: 70 }, { p: 80 }, { p: 88 }]
  },
  alevin: {
    semaforo: [{ med: 450, fs: 3 }, { med: 400, fs: 2 }, { med: 350, fs: 1 }, { med: 300, fs: 0 }],
    freno: [{ p: 75, ff: 4 }, { p: 82, ff: 2 }, { p: 88, ff: 1 }, { p: 93, ff: 0 }],
    ojo: [{ a: 3 }, { a: 4 }, { a: 5 }, { a: 5 }],
    memoria: [{ s: 6 }, { s: 7 }, { s: 8 }, { s: 9 }],
    decision: [{ p: 65 }, { p: 75 }, { p: 85 }, { p: 92 }]
  },
  infantil: {
    semaforo: [{ med: 400, fs: 3 }, { med: 350, fs: 2 }, { med: 300, fs: 1 }, { med: 260, fs: 0 }],
    freno: [{ p: 80, ff: 4 }, { p: 86, ff: 2 }, { p: 92, ff: 1 }, { p: 95, ff: 0 }],
    ojo: [{ a: 4 }, { a: 4 }, { a: 5 }, { a: 5 }],
    memoria: [{ s: 6 }, { s: 7 }, { s: 8 }, { s: 9 }],
    decision: [{ p: 70 }, { p: 80 }, { p: 88 }, { p: 94 }]
  },
  cadete: {
    semaforo: [{ med: 380, fs: 3 }, { med: 320, fs: 2 }, { med: 280, fs: 1 }, { med: 240, fs: 0 }],
    freno: [{ p: 82, ff: 4 }, { p: 88, ff: 2 }, { p: 94, ff: 1 }, { p: 96, ff: 0 }],
    ojo: [{ a: 4 }, { a: 5 }, { a: 5 }, { a: 5 }],
    memoria: [{ s: 7 }, { s: 8 }, { s: 9 }, { s: 10 }],
    decision: [{ p: 75 }, { p: 85 }, { p: 92 }, { p: 96 }]
  },
  juvenil_adulto: {
    semaforo: [{ med: 360, fs: 3 }, { med: 300, fs: 2 }, { med: 260, fs: 1 }, { med: 220, fs: 0 }],
    freno: [{ p: 85, ff: 4 }, { p: 90, ff: 2 }, { p: 95, ff: 1 }, { p: 97, ff: 0 }],
    ojo: [{ a: 4 }, { a: 5 }, { a: 5 }, { a: 5 }],
    memoria: [{ s: 7 }, { s: 8 }, { s: 9 }, { s: 10 }],
    decision: [{ p: 78 }, { p: 88 }, { p: 94 }, { p: 97 }]
  }
};

/* Dificultad base por categoría (parámetros del juego) */
export const DIFICULTAD = {
  benjamin: {
    semaforo: { ambMin: 600, ambMax: 2000 },
    freno: { redPct: 0.20, window: 1800 },
    ojo: { rivales: 4, tiempo: 6 },
    memoria: { max: 6 },
    decision: { tiempo: 5 }
  },
  alevin: {
    semaforo: { ambMin: 700, ambMax: 2500 },
    freno: { redPct: 0.25, window: 1600 },
    ojo: { rivales: 5, tiempo: 5.5 },
    memoria: { max: 7 },
    decision: { tiempo: 4.5 }
  },
  infantil: {
    semaforo: { ambMin: 800, ambMax: 3000 },
    freno: { redPct: 0.30, window: 1400 },
    ojo: { rivales: 6, tiempo: 5 },
    memoria: { max: 8 },
    decision: { tiempo: 4 }
  },
  cadete: {
    semaforo: { ambMin: 900, ambMax: 3500 },
    freno: { redPct: 0.35, window: 1200 },
    ojo: { rivales: 7, tiempo: 4.5 },
    memoria: { max: 9 },
    decision: { tiempo: 3.5 }
  },
  juvenil_adulto: {
    semaforo: { ambMin: 1000, ambMax: 4000 },
    freno: { redPct: 0.40, window: 1000 },
    ojo: { rivales: 8, tiempo: 4 },
    memoria: { max: 10 },
    decision: { tiempo: 3 }
  }
};

/**
 * Parámetros ajustados por nivel dentro de la categoría
 * @param {'benjamin'|'alevin'|'infantil'|'cadete'|'juvenil_adulto'} cat
 * @param {'bronce'|'plata'|'oro'|'diamante'|'leyenda'} nivel
 */
export function paramsJuego(cat = 'juvenil_adulto', nivel = 'bronce') {
  const safeCat = DIFICULTAD[cat] ? cat : 'juvenil_adulto';
  const b = DIFICULTAD[safeCat];
  const li = Math.max(0, NIVELES.indexOf(nivel));
  return {
    semaforo: {
      ambMin: b.semaforo.ambMin + li * 200,
      ambMax: b.semaforo.ambMax + li * 750
    },
    freno: {
      redPct: Math.min(0.5, b.freno.redPct + li * 0.05),
      window: Math.max(900, b.freno.window - li * 100)
    },
    ojo: {
      rivales: Math.min(9, b.ojo.rivales + li),
      tiempo: Math.max(2.5, b.ojo.tiempo - li * 0.5)
    },
    memoria: {
      max: Math.min(10, b.memoria.max + li)
    },
    decision: {
      tiempo: Math.max(2, b.decision.tiempo - li * 0.5)
    }
  };
}

/**
 * Evalúa si el jugador supera el umbral y sube al siguiente nivel al cerrar sesión.
 * NUNCA baja de nivel. Techo en Leyenda.
 * @param {Object} player - Objeto del jugador (con birthDate y cognitive)
 * @param {'semaforo'|'freno'|'ojo'|'memoria'|'decision'} gameId 
 * @param {Object} met - Métricas de la sesión {med, fs, p, ff, a, s}
 * @returns {{ subio: boolean, nivel: string, techo?: boolean }}
 */
export function evaluarProgresion(player, gameId, met = {}) {
  // Respiración 4-4 y retos no tienen niveles
  if (!gameId || gameId === 'respiracion' || gameId === 'respiracion44' || gameId.startsWith('reto_')) {
    return { subio: false, nivel: 'bronce' };
  }

  const cat = getCategoria(player?.birthDate);
  const currentLevels = player?.cognitive?.levels || {};
  const nivel = currentLevels[gameId] || 'bronce';
  const idx = NIVELES.indexOf(nivel);

  if (idx >= 4) {
    return { subio: false, nivel: 'leyenda', techo: true };
  }

  const catUmbrales = UMBRALES[cat] || UMBRALES.juvenil_adulto;
  const gameUmbrales = catUmbrales[gameId];
  if (!gameUmbrales || !gameUmbrales[idx]) {
    return { subio: false, nivel };
  }

  const u = gameUmbrales[idx];
  let ok = false;

  if (gameId === 'semaforo') {
    // med: mediana en ms (< u.med), fs: salidas en falso (<= u.fs)
    ok = (met.med != null && met.med < u.med) && ((met.fs || 0) <= u.fs);
  } else if (gameId === 'freno') {
    // p: porcentaje acierto (>= u.p), ff: fallos falsas alarmas (<= u.ff)
    ok = ((met.p || 0) >= u.p) && ((met.ff || 0) <= u.ff);
  } else if (gameId === 'ojo') {
    // a: aciertos (>= u.a)
    ok = (met.a || 0) >= u.a;
  } else if (gameId === 'memoria') {
    // s: secuencia máxima alcanzada (>= u.s)
    ok = (met.s || 0) >= u.s;
  } else if (gameId === 'decision') {
    // p: porcentaje acierto (>= u.p)
    ok = (met.p || 0) >= u.p;
  }

  if (ok) {
    const nextLevel = NIVELES[idx + 1];
    return {
      subio: true,
      nivel: nextLevel,
      anterior: nivel,
      techo: nextLevel === 'leyenda'
    };
  }

  return { subio: false, nivel };
}
