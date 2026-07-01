import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { DEVELOPER_EMAILS } from '../config/admins';

export const LIMITS = {
  FREE: {
    TEAMS: 1,
    PLAYERS: 15,
    SESSIONS: 10,
    PDF_EXPORT: false,
    IA_GENERATIONS: 5,
  },
  PRO: {
    TEAMS: 3,
    PLAYERS: 66, // 66 total distribuibles entre los 3 equipos del plan PRO
    SESSIONS: 1000,
    PDF_EXPORT: true,
    IA_GENERATIONS: 1000,
  },
  CLUB: {
    TEAMS: 100,
    PLAYERS: 1000,
    SESSIONS: 1000,
    PDF_EXPORT: true,
    IA_GENERATIONS: 1000,
  }
};

// Importado desde src/config/admins.js (fuente única de verdad)
export { DEVELOPER_EMAILS };

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
  // La comprobación se hace contra el token de Firebase (no localStorage).
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
      
      // Intentar leer desde localStorage o Cookies para evitar bypass fácil (ALTO-06)
      let localStart = localStorage.getItem('mister11_trial_start');
      let cookieStart = getCookie('mister11_trial_start');
      
      let finalStart = localStart || cookieStart;
      if (!finalStart) {
        finalStart = String(Date.now());
        localStorage.setItem('mister11_trial_start', finalStart);
        setCookie('mister11_trial_start', finalStart, 365); // Expira en 1 año
      } else {
        // Sincronizar
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
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find(sub => sub.status === 'active' || sub.status === 'trialing');

      if (activeSub) {
        let planType = 'pro';
        if (activeSub.role === 'club' || (activeSub.metadata && activeSub.metadata.plan === 'club')) {
          planType = 'club';
        } else if (activeSub.items && activeSub.items[0]) {
          const priceId = activeSub.items[0].price?.id;
          if (priceId && priceId.includes('club')) {
            planType = 'club';
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

  const toggleSimulatedPlan = () => {
    // Solo disponible para desarrolladores. No se persiste en localStorage
    // para evitar que usuarios normales lo manipulen.
    if (!isDeveloper) return;
    setSimulatedPlan(prev => (prev === 'free' ? '' : 'free'));
  };

  const resetTrial = () => {
    if (!isDeveloper) return;
    setSimulatedPlan('');
  };

  const now = new Date();

  // --- Trial calculation (now based on Firestore date, tamper-proof) ---
  const trialStart = dbTrialStartDate || now;
  const msPassed = now - trialStart;
  const hoursPassed = Math.floor(msPassed / (60 * 60 * 1000));
  const daysPassed = Math.floor(msPassed / (24 * 60 * 60 * 1000));
  const trialDaysRemaining = Math.max(0, 7 - daysPassed);
  const trialHoursRemaining = Math.max(0, 7 * 24 - hoursPassed);
  const isTrialExpired = trialDaysRemaining <= 0;

  // --- Real PRO plan ---
  const isDeveloper = user && user.email && DEVELOPER_EMAILS.includes(user.email.toLowerCase());
  
  // Combine Firestore team plan expiration with active Stripe subscription expiration
  const activeExpiration = dbProExpiration || stripeProExpiration;
  const isRealExpired = activeExpiration && (typeof activeExpiration.toDate === 'function' ? activeExpiration.toDate() : new Date(activeExpiration)) < now;
  
  const activeTeam = teams?.find(t => t.id === activeTeamId) || null;
  const isActiveTeamClub = activeTeam?.source === 'club';

  const isClubActive = isClubMember && club && club.status === 'active';
  
  // Lógica del plan individual del usuario
  const currentPlan = dbPlan === 'pro' || dbPlan === 'club' ? dbPlan : stripeActivePlan;
  const isRealPro = (currentPlan === 'pro' || currentPlan === 'club') && !isRealExpired;
  const isOnTrial = (dbPlan === 'trial') && !isTrialExpired && !isRealPro;

  // isPro depende de si es un equipo del club (entonces depende de isClubActive) o personal (depende del plan individual)
  const isPro = isDeveloper || (isActiveTeamClub ? isClubActive : (isRealPro || isOnTrial));

  // isRealPaidPro = true si hay una suscripción de pago real en el contexto activo
  const isRealPaidPro = isDeveloper || (isActiveTeamClub ? isClubActive : isRealPro);

  // Developers always have full PRO access — simulation is UI-only for testing UX
  // isSimulatingFree = developer is deliberately testing free-plan UI (doesn't remove access)
  const isSimulatingFree = isDeveloper && simulatedPlan === 'free';

  // Límites según el tipo de equipo activo
  const isClub = isDeveloper || (isActiveTeamClub && isClubActive);
  const currentLimits = isClub ? LIMITS.CLUB : (isPro ? LIMITS.PRO : LIMITS.FREE);

  // isProActive: for legacy compatibility — same as isPro
  const isProActive = isPro;

  const effectivePlan = isClub ? 'club' : (isPro ? 'pro' : 'free');

  return {
    plan: isPro ? (effectivePlan !== 'free' ? effectivePlan : 'pro') : 'free',
    isPro,
    isDeveloper,
    isSimulatingFree,
    limits: currentLimits,
    loading,
    proExpiration: activeExpiration?.toDate ? activeExpiration.toDate() : (activeExpiration ? new Date(activeExpiration) : null),
    isExpired: isDeveloper ? false : (isTrialExpired && !isRealPro && !isClubActive),
    simulatedPlan,
    toggleSimulatedPlan,
    trialDaysRemaining,
    trialHoursRemaining,
    resetTrial,
    isOnTrial,
    isTrialExpired,
    dbPlan: currentPlan,
    isProActive,
    isRealPaidPro,
    isClubMember,
    clubRole,
    isClubActive
  };
};
