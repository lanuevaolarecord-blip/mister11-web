/**
 * src/config/plans.js
 * FUENTE ÚNICA DE VERDAD: Planes, Precios (IVA Incluido), Límites y Stripe Price IDs.
 * Temporada = 10 meses de competición (Septiembre - Junio), Julio y Agosto incluidos/gratis.
 */

export const PLANS = {
  free: {
    id: 'free',
    nombre: 'Plan Gratuito',
    tagline: 'Para empezar a digitalizar tu equipo',
    precioMes: 0,
    precioTemporada: null,
    teamLimit: 1,
    staffLimit: 1,
    playerLimit: 23,
    sessionLimit: 10,
    iaLimit: 5,
    pdfExport: false,
    liveStats: false,
    playerPortal: false,
    advancedStats: false,
    seasonPlanning: false,
    tests: false,
    multiCoach: false,
    clubPanel: false,
    features: [
      '1 equipo (hasta 23 jugadores)',
      '1 entrenador / staff',
      'Hasta 10 sesiones de entrenamiento',
      'Pizarra táctica básica',
      '5 generaciones con IA',
      'Consentimientos RGPD con firma digital'
    ],
    stripePriceIds: {
      monthly: null,
      season: null
    },
    ivaIncluido: true,
    temporadaMeses: 10,
    badge: null
  },
  pro: {
    id: 'pro',
    nombre: 'Plan PRO',
    tagline: 'Para el entrenador que quiere el máximo rendimiento',
    precioMes: 7.99,
    precioTemporada: 69,
    teamLimit: 3,
    staffLimit: 1,
    playerLimit: 23,
    sessionLimit: 1000,
    iaLimit: 1000,
    pdfExport: true,
    liveStats: true,
    playerPortal: true,
    advancedStats: true,
    seasonPlanning: true,
    tests: true,
    multiCoach: false,
    clubPanel: false,
    features: [
      'Hasta 3 equipos (23 jugadores/equipo)',
      '1 entrenador por equipo',
      'Sesiones ilimitadas con exportación PDF',
      'Pizarra táctica animada (exportar PNG/MP4)',
      'Live Stats en directo y actas de partido en PDF',
      'IA generadora ilimitada + prevención de lesiones',
      'Portal del Jugador completo y wellness diario',
      'Tests físicos, psicológicos y radar charts',
      'Planificación de temporada (micro/meso/macro)'
    ],
    stripePriceIds: {
      monthly: 'price_1Tg6PHQm2eOxraPCNfjgeUNV',
      season: 'price_1U83AQQm2eOxraPC5kEgNZ4k'
    },
    ivaIncluido: true,
    temporadaMeses: 10,
    badge: null
  },
  club_starter: {
    id: 'club_starter',
    nombre: 'Club Starter',
    tagline: 'Para clubes pequeños y escuelas formativas (hasta 6 equipos)',
    precioMes: 24.99,
    precioTemporada: 219,
    teamLimit: 6,
    staffLimit: 4,
    playerLimit: 23,
    sessionLimit: 1000,
    iaLimit: 1000,
    pdfExport: true,
    liveStats: true,
    playerPortal: true,
    advancedStats: true,
    seasonPlanning: true,
    tests: true,
    multiCoach: true,
    clubPanel: true,
    features: [
      'Hasta 6 equipos del club (23 jug./equipo)',
      'Hasta 4 entrenadores / staff por equipo',
      'Todo lo incluido en el Plan PRO',
      'Panel de gestión de club multi-equipo',
      'Multi-entrenador con roles y permisos',
      'Estadísticas agregadas de equipos',
      'Soporte prioritario'
    ],
    stripePriceIds: {
      monthly: 'price_1Tg6SgQm2eOxraPC1GNMhp4N',
      season: 'price_1U83BmQm2eOxraPCXPlibBOp'
    },
    ivaIncluido: true,
    temporadaMeses: 10,
    costePorEntrenadorMesTemporada: '5,50 €',
    badge: null
  },
  club_pro: {
    id: 'club_pro',
    nombre: 'Club PRO',
    tagline: 'Para clubes en crecimiento y academias estructuradas',
    precioMes: 49.99,
    precioTemporada: 449,
    teamLimit: 15,
    staffLimit: 10,
    playerLimit: 23,
    sessionLimit: 1000,
    iaLimit: 1000,
    pdfExport: true,
    liveStats: true,
    playerPortal: true,
    advancedStats: true,
    seasonPlanning: true,
    tests: true,
    multiCoach: true,
    clubPanel: true,
    features: [
      'Hasta 15 equipos del club (23 jug./equipo)',
      'Hasta 10 entrenadores / staff por equipo',
      'Todo lo incluido en Club Starter',
      'Panel avanzado de dirección deportiva',
      'Informes consolidados de club en PDF/CSV',
      'Gestión de cantera e histórico global',
      'Soporte prioritario 24/7'
    ],
    stripePriceIds: {
      monthly: 'price_1U82j8Qm2eOxraPC4ckIyGR6',
      season: 'price_1U83CPQm2eOxraPCCXqpJed7'
    },
    ivaIncluido: true,
    temporadaMeses: 10,
    costePorEntrenadorMesTemporada: '3,00 €',
    badge: 'MÁS POPULAR'
  },
  club_premium: {
    id: 'club_premium',
    nombre: 'Club Premium',
    tagline: 'Para canteras grandes, federaciones y clubes de élite',
    precioMes: 99.99,
    precioTemporada: 899,
    teamLimit: 40,
    staffLimit: Infinity,
    playerLimit: 23,
    sessionLimit: 1000,
    iaLimit: 1000,
    pdfExport: true,
    liveStats: true,
    playerPortal: true,
    advancedStats: true,
    seasonPlanning: true,
    tests: true,
    multiCoach: true,
    clubPanel: true,
    features: [
      'Hasta 40 equipos del club (23 jug./equipo)',
      'Staff ilimitado (todos los entrenadores y especialistas)',
      'Todo lo incluido en Club PRO',
      'Panel integral para grandes escuelas y canteras',
      'Códigos de canje y licencias multi-sede',
      'Onboarding personalizado y soporte VIP dedicado'
    ],
    stripePriceIds: {
      monthly: 'price_1U82kIQm2eOxraPCql6yWRok',
      season: 'price_1U83CwQm2eOxraPCME2OhzIC'
    },
    ivaIncluido: true,
    temporadaMeses: 10,
    badge: 'MÁXIMA CAPACIDAD'
  }
};

/**
 * Normaliza y obtiene la definición de un plan por su ID.
 * Mapea usuarios antiguos con plan 'club' a 'club_premium' (grandfathered).
 * @param {string} planId 
 * @returns {typeof PLANS.free}
 */
export const getPlanById = (planId) => {
  if (!planId) return PLANS.free;
  const normalized = String(planId).toLowerCase().trim();

  // Grandfathering: 'club' antiguo -> 'club_premium'
  if (normalized === 'club') {
    return PLANS.club_premium;
  }

  return PLANS[normalized] || PLANS.free;
};

/**
 * Helper para desglose de IVA (21% España) con redondeo exacto a 2 decimales.
 * @param {number} precioBruto Precio final con IVA incluido
 * @returns {{ bruto: number, base: number, iva: number }}
 */
export const calcularDesgloseIVA = (precioBruto) => {
  if (!precioBruto || typeof precioBruto !== 'number') {
    return { bruto: 0, base: 0, iva: 0 };
  }
  const base = Math.round((precioBruto / 1.21) * 100) / 100;
  const iva = Math.round((precioBruto - base) * 100) / 100;
  return {
    bruto: precioBruto,
    base,
    iva
  };
};

/**
 * Busca a qué plan y ciclo corresponde un Stripe Price ID.
 * @param {string} priceId 
 * @returns {{ planId: string, ciclo: 'monthly' | 'season', plan: object } | null}
 */
export const findPlanByPriceId = (priceId) => {
  if (!priceId) return null;
  for (const [planId, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceIds.monthly === priceId) {
      return { planId, ciclo: 'monthly', plan };
    }
    if (plan.stripePriceIds.season === priceId) {
      return { planId, ciclo: 'season', plan };
    }
  }
  return null;
};
