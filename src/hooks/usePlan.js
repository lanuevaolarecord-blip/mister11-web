import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { DEVELOPER_EMAILS } from '../config/admins';
import { PLANS, getPlanById, findPlanByPriceId } from '../config/plans';

/**
 * Objeto de límites heredado para compatibilidad.
 * Mapea directamente desde la fuente única de verdad src/config/plans.js.
 */
export const LIMITS = {
  FREE: {
    TEAMS: PLANS.free.teamLimit,
    STAFF: PLANS.free.staffLimit,
    PLAYERS: PLANS.free.playerLimit,
    SESSIONS: PLANS.free.sessionLimit,
    PDF_EXPORT: PLANS.free.pdfExport,
    IA_GENERATIONS: PLANS.free.iaLimit,
  },
  PRO: {
    TEAMS: PLANS.pro.teamLimit,
    STAFF: PLANS.pro.staffLimit,
    PLAYERS: PLANS.pro.playerLimit,
    SESSIONS: PLANS.pro.sessionLimit,
    PDF_EXPORT: PLANS.pro.pdfExport,
    IA_GENERATIONS: PLANS.pro.iaLimit,
  },
  CLUB_STARTER: {
    TEAMS: PLANS.club_starter.teamLimit,
    STAFF: PLANS.club_starter.staffLimit,
    PLAYERS: PLANS.club_starter.playerLimit,
    SESSIONS: PLANS.club_starter.sessionLimit,
    PDF_EXPORT: PLANS.club_starter.pdfExport,
    IA_GENERATIONS: PLANS.club_starter.iaLimit,
  },
  CLUB_PRO: {
    TEAMS: PLANS.club_pro.teamLimit,
    STAFF: PLANS.club_pro.staffLimit,
    PLAYERS: PLANS.club_pro.playerLimit,
    SESSIONS: PLANS.club_pro.sessionLimit,
    PDF_EXPORT: PLANS.club_pro.pdfExport,
    IA_GENERATIONS: PLANS.club_pro.iaLimit,
  },
  CLUB_PREMIUM: {
    TEAMS: PLANS.club_premium.teamLimit,
    STAFF: PLANS.club_premium.staffLimit,
    PLAYERS: PLANS.club_premium.playerLimit,
    SESSIONS: PLANS.club_premium.sessionLimit,
    PDF_EXPORT: PLANS.club_premium.pdfExport,
    IA_GENERATIONS: PLANS.club_premium.iaLimit,
  },
  // Legacy alias: 'CLUB' mapea a CLUB_PREMIUM (grandfathered)
  CLUB: {
    TEAMS: PLANS.club_premium.teamLimit,
    STAFF: PLANS.club_premium.staffLimit,
    PLAYERS: PLANS.club_premium.playerLimit,
    SESSIONS: PLANS.club_premium.sessionLimit,
    PDF_EXPORT: PLANS.club_premium.pdfExport,
    IA_GENERATIONS: PLANS.club_premium.iaLimit,
  }
};

export { DEVELOPER_EMAILS, PLANS, getPlanById };

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const setCookie = (name, value, days) => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Strict`;
};

export const usePlan = () => {
  const { user, activeTeamId, clubId, clubRole, isClubMember, club, teams } = useAuth();
  const [dbPlan, setDbPlan] = useState('free');
  const [dbProExpiration, setDbProExpiration] = useState(null);
  const [dbTrialStartDate, setDbTrialStartDate] = useState(null);
  const [stripeActivePlan, setStripeActivePlan] = useState('free');
  const [stripeProExpiration, setStripeProExpiration] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated plan toggle — SOLO para emails de desarrollador verificados.
  const [simulatedPlan, setSimulatedPlan] = useState('');

  useEffect(() => {
    if (!user) {
      setDbPlan('free');
      setDbProExpiration(null);
      setDbTrialStartDate(null);
      setStripeActivePlan('free');
      setStripeProExpiration(null);
      setLoading(false);
      return;
    }

    if (user.uid === 'invitado-local') {
      setDbPlan('trial');
      setDbProExpiration(null);
      setStripeActivePlan('free');
      setStripeProExpiration(null);

      let localStart = localStorage.getItem('mister11_trial_start');
      let cookieStart = getCookie('mister11_trial_start');

      let finalStart = localStart || cookieStart;
      if (!finalStart) {
        finalStart = String(Date.now());
        localStorage.setItem('mister11_trial_start', finalStart);
        setCookie('mister11_trial_start', finalStart, 365);
      } else {
        if (!localStart) localStorage.setItem('mister11_trial_start', finalStart);
        if (!cookieStart) setCookie('mister11_trial_start', finalStart, 365);
      }

      setDbTrialStartDate(new Date(Number(finalStart)));
      setLoading(false);
      return;
    }

    if (!activeTeamId) {
      setLoading(false);
      return;
    }

    const activeTeam = teams?.find(t => t.id === activeTeamId);
    const isActiveTeamClub = activeTeam?.source === 'club';

    let unsub = () => {};

    if (isActiveTeamClub) {
      setDbPlan('free');
      setDbProExpiration(null);
      setDbTrialStartDate(null);
      setLoading(false);
    } else {
      unsub = onSnapshot(doc(db, 'users', user.uid, 'teams', activeTeamId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDbPlan(data.plan || 'free');
          setDbProExpiration(data.proExpiration || null);
          if (data.trialStartDate) {
            setDbTrialStartDate(typeof data.trialStartDate.toDate === 'function' ? data.trialStartDate.toDate() : new Date(data.trialStartDate));
          } else {
            setDbTrialStartDate(null);
          }
        } else {
          setDbPlan('free');
          setDbProExpiration(null);
          setDbTrialStartDate(null);
        }
        setLoading(false);
      }, (err) => {
        console.error("Error loading plan:", err);
        setLoading(false);
      });
    }

    const subsRef = collection(db, 'customers', user.uid, 'subscriptions');
    const unsubSubs = onSnapshot(subsRef, (snapshot) => {
      const activeSub = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .find(sub => sub.status === 'active' || sub.status === 'trialing');

      if (activeSub) {
        let planType = 'pro';

        // 1. Intentar resolver por Price ID exacto de Stripe
        if (activeSub.items && activeSub.items[0]) {
          const priceId = activeSub.items[0].price?.id;
          const matched = findPlanByPriceId(priceId);
          if (matched) {
            planType = matched.planId;
          } else if (priceId && priceId.includes('club')) {
            planType = 'club_pro';
          }
        }

        // 2. Fallbacks de metadata/roles
        if (planType === 'pro' || !planType) {
          if (activeSub.metadata?.plan) {
            planType = activeSub.metadata.plan;
          } else if (activeSub.role && activeSub.role !== 'pro') {
            planType = activeSub.role;
          }
        }

        setStripeActivePlan(planType);
        setStripeProExpiration(activeSub.current_period_end || null);
      } else {
        setStripeActivePlan('free');
        setStripeProExpiration(null);
      }
    }, (err) => {
      console.error("Error loading stripe sub in usePlan:", err);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      unsubSubs();
    };
  }, [user, activeTeamId, teams]);

  const isDeveloper = user && user.email && DEVELOPER_EMAILS.includes(user.email.toLowerCase());

  const toggleSimulatedPlan = () => {
    if (!isDeveloper) return;
    setSimulatedPlan(prev => (prev === 'free' ? '' : 'free'));
  };

  const resetTrial = () => {
    if (!isDeveloper) return;
    setSimulatedPlan('');
  };

  const now = new Date();

  // --- Trial calculation ---
  const trialStart = dbTrialStartDate || now;
  const msPassed = now - trialStart;
  const hoursPassed = Math.floor(msPassed / (60 * 60 * 1000));
  const daysPassed = Math.floor(msPassed / (24 * 60 * 60 * 1000));
  const trialDaysRemaining = Math.max(0, 7 - daysPassed);
  const trialHoursRemaining = Math.max(0, 7 * 24 - hoursPassed);
  const isTrialExpired = trialDaysRemaining <= 0;

  // Combine Firestore team plan expiration with active Stripe subscription expiration
  const activeExpiration = dbProExpiration || stripeProExpiration;
  const isRealExpired = activeExpiration && (typeof activeExpiration.toDate === 'function' ? activeExpiration.toDate() : new Date(activeExpiration)) < now;

  const activeTeam = teams?.find(t => t.id === activeTeamId) || null;
  const isActiveTeamClub = activeTeam?.source === 'club';
  const isClubActive = isClubMember && club && club.status === 'active';

  // Lógica del plan individual del usuario
  const rawCurrentPlan = dbPlan !== 'free' && dbPlan !== 'trial' ? dbPlan : stripeActivePlan;
  const resolvedPlanDef = getPlanById(rawCurrentPlan);
  const currentPlanId = resolvedPlanDef.id;

  const isRealPaidPro = (currentPlanId !== 'free') && !isRealExpired;
  const isOnTrial = (dbPlan === 'trial') && !isTrialExpired && !isRealPaidPro;

  // isPro si es desarrollador, equipo de club activo, plan de pago activo o trial
  const isPro = isDeveloper || (isActiveTeamClub ? isClubActive : (isRealPaidPro || isOnTrial));

  // isSimulatingFree: testing UX
  const isSimulatingFree = isDeveloper && simulatedPlan === 'free';

  // Determinación del plan efectivo
  let effectivePlanId = 'free';
  if (isDeveloper) {
    effectivePlanId = isSimulatingFree ? 'free' : 'club_premium';
  } else if (isActiveTeamClub && isClubActive) {
    // Si el club tiene un plan específico (ej: club_starter, club_pro, club_premium)
    effectivePlanId = club?.plan ? getPlanById(club.plan).id : 'club_pro';
  } else if (isRealPaidPro) {
    effectivePlanId = currentPlanId;
  } else if (isOnTrial) {
    effectivePlanId = 'pro';
  }

  const activePlanDef = isSimulatingFree ? PLANS.free : getPlanById(effectivePlanId);
  const isClub = isDeveloper || (activePlanDef.id.startsWith('club') && (isActiveTeamClub ? isClubActive : isRealPaidPro));

  // Helpers de validación de límites
  const canCreateTeam = (currentTeamsCount) => {
    if (isDeveloper && !isSimulatingFree) return true;
    return (currentTeamsCount || 0) < activePlanDef.teamLimit;
  };

  const canCreateSession = (currentSessionsCount) => {
    if (isDeveloper && !isSimulatingFree) return true;
    return (currentSessionsCount || 0) < activePlanDef.sessionLimit;
  };

  const canInviteStaff = (currentStaffCount) => {
    if (isDeveloper && !isSimulatingFree) return true;
    if (activePlanDef.staffLimit === Infinity) return true;
    return (currentStaffCount || 0) < activePlanDef.staffLimit;
  };

  const hasFeature = (featureKey) => {
    if (isDeveloper && !isSimulatingFree) return true;
    return Boolean(activePlanDef[featureKey]);
  };

  const limits = {
    TEAMS: activePlanDef.teamLimit,
    STAFF: activePlanDef.staffLimit,
    PLAYERS: activePlanDef.playerLimit,
    SESSIONS: activePlanDef.sessionLimit,
    PDF_EXPORT: activePlanDef.pdfExport,
    IA_GENERATIONS: activePlanDef.iaLimit,
    teamLimit: activePlanDef.teamLimit,
    staffLimit: activePlanDef.staffLimit,
    playerLimit: activePlanDef.playerLimit,
    sessionLimit: activePlanDef.sessionLimit,
    iaLimit: activePlanDef.iaLimit,
  };

  return {
    plan: effectivePlanId,
    planDetails: activePlanDef,
    isPro,
    isClub,
    isDeveloper,
    isSimulatingFree,
    limits,
    loading,
    proExpiration: activeExpiration?.toDate ? activeExpiration.toDate() : (activeExpiration ? new Date(activeExpiration) : null),
    isExpired: isDeveloper ? false : (isTrialExpired && !isRealPaidPro && !isClubActive),
    simulatedPlan,
    toggleSimulatedPlan,
    trialDaysRemaining,
    trialHoursRemaining,
    resetTrial,
    isOnTrial,
    isTrialExpired,
    dbPlan: currentPlanId,
    isProActive: isPro,
    isRealPaidPro,
    isClubMember,
    clubRole,
    isClubActive,
    // Helpers granulares
    canCreateTeam,
    canCreateSession,
    canInviteStaff,
    hasFeature
  };
};
