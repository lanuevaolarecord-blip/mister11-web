import { PLANS } from './plans';

export const STRIPE_PRICE_IDS = {
  // Pro
  pro: PLANS.pro.stripePriceIds.monthly,
  pro_season: PLANS.pro.stripePriceIds.season,

  // Club Starter
  club_starter: PLANS.club_starter.stripePriceIds.monthly,
  club_starter_season: PLANS.club_starter.stripePriceIds.season,

  // Club Pro
  club_pro: PLANS.club_pro.stripePriceIds.monthly,
  club_pro_season: PLANS.club_pro.stripePriceIds.season,

  // Club Premium
  club_premium: PLANS.club_premium.stripePriceIds.monthly,
  club_premium_season: PLANS.club_premium.stripePriceIds.season,

  // Legacy compat
  club: PLANS.club_pro.stripePriceIds.monthly
};

export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
