import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { DEVELOPER_EMAILS } from '../config/admins';
import { PLANS, getPlanById, findPlanByPriceId } from '../config/plans';
import { calculateGracePeriod } from '../utils/downgradeGracePeriod';

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
  const [inheritedTeamPlan, setInheritedTeamPlan] = useState(null);
  const [isTeamOwnerDeveloper, setIsTeamOwnerDeveloper] = useState(false);
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
      setInheritedTeamPlan(null);
      setIsTeamOwnerDeveloper(false);
      setLoading(false);
      return;
    }

    if (user.uid === 'invitado-local') {
      setDbPlan('trial');
      setDbProExpiration(null);
      setStripeActivePlan('free');
      setStripeProExpiration(null);
      setInheritedTeamPlan(null);
      setIsTeamOwnerDeveloper(false);

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

    // 1. Chequeo de privilegios de desarrollador en el propietario del equipo activo
    const directOwnerEmail = (activeTeam?.ownerEmail || activeTeam?.coachEmail || activeTeam?.createdByEmail || '').toLowerCase();
    const directIsOwnerDev = DEVELOPER_EMAILS.some(e => e.toLowerCase() === directOwnerEmail);
    setIsTeamOwnerDeveloper(directIsOwnerDev);

    const directTeamPlan = activeTeam?.subscriptionPlan || activeTeam?.ownerPlan || activeTeam?.plan || null;
    if (directTeamPlan) {
      setInheritedTeamPlan(directTeamPlan);
    }

    let unsub = () => {};

    if (isActiveTeamClub) {
      setDbPlan('free');
      setDbProExpiration(null);
      setDbTrialStartDate(null);
      setLoading(false);
    } else {
      // Si el equipo es compartido o tiene teamPath específico, escuchar ese documento
      const teamDocPath = activeTeam?.teamPath 
        || (activeTeam?.ownerUid ? `users/${activeTeam.ownerUid}/teams/${activeTeamId}` : null)
        || (activeTeam?.userId && activeTeam.userId !== user.uid ? `users/${activeTeam.userId}/teams/${activeTeamId}` : null)
        || `users/${user.uid}/teams/${activeTeamId}`;

      unsub = onSnapshot(doc(db, teamDocPath), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const docOwnerEmail = (data.ownerEmail || data.coachEmail || data.createdByEmail || directOwnerEmail || '').toLowerCase();
          const docIsOwnerDev = DEVELOPER_EMAILS.some(e => e.toLowerCase() === docOwnerEmail);
          setIsTeamOwnerDeveloper(docIsOwnerDev);

          const resolvedPlan = data.plan || data.ownerPlan || data.subscriptionPlan || (docIsOwnerDev ? 'club_premium' : 'free');
          setDbPlan(resolvedPlan);
          setInheritedTeamPlan(resolvedPlan);
          setDbProExpiration(data.proExpiration || null);
          if (data.trialStartDate) {
            setDbTrialStartDate(typeof data.trialStartDate.toDate === 'function' ? data.trialStartDate.toDate() : new Date(data.trialStartDate));
          } else {
            setDbTrialStartDate(null);
          }
        } else {
          if (directIsOwnerDev) {
            setIsTeamOwnerDeveloper(true);
            setDbPlan('club_premium');
            setInheritedTeamPlan('club_premium');
          } else {
            setDbPlan('free');
            setInheritedTeamPlan(null);
            setDbProExpiration(null);
            setDbTrialStartDate(null);
          }
        }
        setLoading(false);
      }, (err) => {
        console.warn("Error loading team doc in usePlan:", err);
        if (directIsOwnerDev) {
          setIsTeamOwnerDeveloper(true);
          setDbPlan('club_premium');
          setInheritedTeamPlan('club_premium');
        }
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

  // Lógica de herencia de privilegios de staff en el equipo activo
  const activeOwnerEmail = (activeTeam?.ownerEmail || activeTeam?.coachEmail || activeTeam?.createdByEmail || '').toLowerCase();
  const isOwnerDeveloper = isTeamOwnerDeveloper || DEVELOPER_EMAILS.some(e => e.toLowerCase() === activeOwnerEmail);
  const isInheritedPro = isOwnerDeveloper || (inheritedTeamPlan === 'pro' || (inheritedTeamPlan && String(inheritedTeamPlan).startsWith('club')));

  // Lógica del plan individual del usuario
  const rawCurrentPlan = dbPlan !== 'free' && dbPlan !== 'trial' ? dbPlan : stripeActivePlan;
  const resolvedPlanDef = getPlanById(rawCurrentPlan);
  const currentPlanId = resolvedPlanDef.id;

  const isRealPaidPro = (currentPlanId !== 'free') && !isRealExpired;
  const isOnTrial = (dbPlan === 'trial') && !isTrialExpired && !isRealPaidPro;

  // isPro si es desarrollador, propietario desarrollador, equipo de club activo, plan de pago activo, trial o staff heredado
  const isPro = isDeveloper || isOwnerDeveloper || (isActiveTeamClub ? isClubActive : (isRealPaidPro || isOnTrial || isInheritedPro));

  // isSimulatingFree: testing UX
  const isSimulatingFree = isDeveloper && simulatedPlan === 'free';

  // Determinación del plan efectivo
  let effectivePlanId = 'free';
  if (isDeveloper) {
    effectivePlanId = isSimulatingFree ? 'free' : 'club_premium';
  } else if (isOwnerDeveloper) {
    effectivePlanId = 'club_premium';
  } else if (isActiveTeamClub && isClubActive) {
    // Si el club tiene un plan específico (ej: club_starter, club_pro, club_premium)
    effectivePlanId = club?.plan ? getPlanById(club.plan).id : 'club_pro';
  } else if (isRealPaidPro) {
    effectivePlanId = currentPlanId;
  } else if (isInheritedPro) {
    effectivePlanId = inheritedTeamPlan || 'pro';
  } else if (isOnTrial) {
    effectivePlanId = 'pro';
  }

  const isStaffHeredado = !isDeveloper && (isOwnerDeveloper || isInheritedPro) && !isRealPaidPro;
  const activePlanDef = isSimulatingFree ? PLANS.free : getPlanById(effectivePlanId);
  const isClub = isDeveloper || isOwnerDeveloper || (activePlanDef.id.startsWith('club') && (isActiveTeamClub ? isClubActive : (isRealPaidPro || isInheritedPro)));

  // Helpers de validación de límites
  const canCreateTeam = (currentTeamsCount) => {
    if (isDeveloper && !isSimulatingFree) return true;
    const personalLimit = getPlanById(isRealPaidPro ? currentPlanId : 'free').teamLimit;
    return (currentTeamsCount || 0) < personalLimit;
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
    isOwnerDeveloper,
    isStaffHeredado,
    isSimulatingFree,
    limits,
    loading,
    proExpiration: activeExpiration?.toDate ? activeExpiration.toDate() : (activeExpiration ? new Date(activeExpiration) : null),
    isExpired: (isDeveloper || isOwnerDeveloper) ? false : (isTrialExpired && !isRealPaidPro && !isClubActive && !isInheritedPro),
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

/**
 * Hook de Permisos por Contexto de Equipo ("Staff Heredado").
 * Si el usuario es Free y el equipo pertenece a un Owner PRO/Club,
 * el usuario hereda los privilegios PRO para ese equipo sin poder crear equipos propios adicionales.
 */
export const useEffectivePlan = (teamId) => {
  const userPlanState = usePlan();
  const { user, teams, activeTeamId } = useAuth();
  const [teamDocData, setTeamDocData] = useState(null);

  const targetTeamId = teamId || activeTeamId;
  const teamFromContext = teams?.find(t => t.id === targetTeamId) || null;

  useEffect(() => {
    if (!targetTeamId || targetTeamId === 'demo-team') {
      setTeamDocData(null);
      return;
    }

    const teamPath = teamFromContext?.teamPath || (teamFromContext?.userId ? `users/${teamFromContext.userId}/teams/${targetTeamId}` : `equipos/${targetTeamId}`);
    const unsub = onSnapshot(doc(db, teamPath), (snap) => {
      if (snap.exists()) {
        setTeamDocData(snap.data());
      } else {
        setTeamDocData(null);
      }
    }, () => {
      setTeamDocData(null);
    });

    return () => unsub();
  }, [targetTeamId, teamFromContext?.teamPath, teamFromContext?.userId]);

  const activeTeamData = teamDocData || teamFromContext;
  const isTeamClub = activeTeamData?.source === 'club' || teamFromContext?.source === 'club';

  // 1. Plan del propietario o del equipo
  const teamOwnerEmail = (activeTeamData?.ownerEmail || activeTeamData?.coachEmail || activeTeamData?.createdByEmail || teamFromContext?.ownerEmail || '').toLowerCase();
  const isTeamOwnerDev = DEVELOPER_EMAILS.some(e => e.toLowerCase() === teamOwnerEmail);

  let teamOwnerPlan = 'free';
  if (isTeamOwnerDev) {
    teamOwnerPlan = 'club_premium';
  } else if (isTeamClub) {
    teamOwnerPlan = 'club_pro';
  } else if (activeTeamData?.ownerPlan) {
    teamOwnerPlan = activeTeamData.ownerPlan;
  } else if (activeTeamData?.plan) {
    teamOwnerPlan = activeTeamData.plan;
  } else if (activeTeamData?.userId === user?.uid) {
    teamOwnerPlan = userPlanState.plan;
  }

  // 2. Verificar periodo de gracia (Caso Límite 2)
  const gracePeriod = calculateGracePeriod(activeTeamData?.downgradeDate);

  // 3. Determinar plan efectivo para este contexto de equipo
  const userPlan = userPlanState.plan;
  const isOwner = activeTeamData?.userId === user?.uid || activeTeamData?.ownerUid === user?.uid;
  const isTeamOwnerPro = (teamOwnerPlan === 'pro' || teamOwnerPlan.startsWith('club')) && !gracePeriod.isBlocked;

  let effectivePlan = userPlan;
  let isStaffHeredado = false;

  if (userPlanState.isDeveloper && !userPlanState.isSimulatingFree) {
    effectivePlan = 'club_premium';
  } else if (isTeamClub) {
    effectivePlan = 'club_pro';
  } else if (gracePeriod.isBlocked) {
    // Si la gracia expiró sin pago, se bloquean funciones PRO para todo el equipo
    effectivePlan = 'free';
  } else if (!isOwner && userPlan === 'free' && isTeamOwnerPro) {
    // Staff Heredado: el usuario Free hereda PRO dentro del equipo
    effectivePlan = teamOwnerPlan;
    isStaffHeredado = true;
  } else if (userPlanState.isPro) {
    effectivePlan = userPlan;
  } else if (isOwner && isTeamOwnerPro) {
    effectivePlan = teamOwnerPlan;
  }

  const isEffectivePro = userPlanState.isDeveloper
    ? !userPlanState.isSimulatingFree
    : (!gracePeriod.isBlocked && (effectivePlan === 'pro' || effectivePlan.startsWith('club') || userPlanState.isPro));

  const ownerName = activeTeamData?.ownerName || activeTeamData?.coachName || teamFromContext?.ownerName || '';
  const ownerUid = activeTeamData?.ownerUid || activeTeamData?.userId || teamFromContext?.userId || '';

  const effectivePlanDef = getPlanById(effectivePlan);
  const effectiveLimits = {
    ...userPlanState.limits,
    PLAYERS: effectivePlanDef.playerLimit,
    SESSIONS: effectivePlanDef.sessionLimit,
    PDF_EXPORT: effectivePlanDef.pdfExport,
    IA_GENERATIONS: effectivePlanDef.iaLimit,
    playerLimit: effectivePlanDef.playerLimit,
    sessionLimit: effectivePlanDef.sessionLimit,
    iaLimit: effectivePlanDef.iaLimit,
  };

  return {
    ...userPlanState,
    effectivePlan,
    plan: effectivePlan,
    isEffectivePro,
    isPro: isEffectivePro,
    isProActive: isEffectivePro,
    isStaffHeredado,
    ownerName,
    ownerUid,
    gracePeriod,
    userPlan,
    teamOwnerPlan,
    limits: effectiveLimits,
    // REGLA CRÍTICA: Un usuario Free invitado a un equipo PRO NO puede crear más de 1 equipo propio
    canCreateTeam: userPlanState.canCreateTeam
  };
};
