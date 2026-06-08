import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

export const LIMITS = {
  FREE: {
    TEAMS: 1,
    PLAYERS: 15,
    SESSIONS: 10,
    PDF_EXPORT: false,
    IA_GENERATIONS: 5,
  },
  PRO: {
    TEAMS: 100,
    PLAYERS: 1000,
    SESSIONS: 1000,
    PDF_EXPORT: true,
    IA_GENERATIONS: 1000,
  }
};

export const DEVELOPER_EMAILS = [
  'lavozdelformador@gmail.com',
  'lanuevaolarecord@gmail.com',
  'jhocao111294@gmail.com'
];

export const usePlan = () => {
  const { user, activeTeamId } = useAuth();
  const [dbPlan, setDbPlan] = useState('free');
  const [dbProExpiration, setDbProExpiration] = useState(null);
  const [dbTrialStartDate, setDbTrialStartDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated plan toggle (only for developer testing in the UI)
  const [simulatedPlan, setSimulatedPlan] = useState(() => {
    return localStorage.getItem('mister11_simulated_plan') || '';
  });

  useEffect(() => {
    if (!user) {
      setDbPlan('free');
      setDbProExpiration(null);
      setDbTrialStartDate(null);
      setLoading(false);
      return;
    }

    if (user.uid === 'invitado-local') {
      setDbPlan('trial');
      setDbProExpiration(null);
      // Guests get a local trial fallback
      setDbTrialStartDate(new Date(Number(localStorage.getItem('mister11_trial_start') || Date.now())));
      setLoading(false);
      return;
    }

    if (!activeTeamId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid, 'teams', activeTeamId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDbPlan(data.plan || 'free');
        setDbProExpiration(data.proExpiration || null);
        // trialStartDate comes from Firestore (server-side, tamper-proof)
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

    return () => unsub();
  }, [user, activeTeamId]);

  const toggleSimulatedPlan = () => {
    // For developers: toggle between showing PRO UI vs FREE UI (simulation only)
    const next = simulatedPlan === 'free' ? '' : 'free';
    setSimulatedPlan(next);
    if (next) {
      localStorage.setItem('mister11_simulated_plan', next);
    } else {
      localStorage.removeItem('mister11_simulated_plan');
    }
  };

  const resetTrial = () => {
    // Reset simulation: remove 'free' simulation to return to full developer access
    setSimulatedPlan('');
    localStorage.removeItem('mister11_simulated_plan');
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
  const isOnTrial = (dbPlan === 'trial') && !isTrialExpired;

  // --- Real PRO plan ---
  const isDeveloper = user && user.email && DEVELOPER_EMAILS.includes(user.email.toLowerCase());
  const isRealExpired = dbProExpiration && (typeof dbProExpiration.toDate === 'function' ? dbProExpiration.toDate() : new Date(dbProExpiration)) < now;
  const isRealPro = (dbPlan === 'pro' || dbPlan === 'club') && !isRealExpired;

  // isRealPaidPro = true ONLY when there is a real paid Stripe subscription (not simulated, not trial)
  const isRealPaidPro = isRealPro;

  // Developers always have full PRO access — simulation is UI-only for testing UX
  // isSimulatingFree = developer is deliberately testing free-plan UI (doesn't remove access)
  const isSimulatingFree = isDeveloper && simulatedPlan === 'free';

  // --- Final PRO status ---
  // Developers ALWAYS get isPro=true (lifetime unlimited access)
  // For regular users: trial or real paid plan grants PRO
  const isPro = isDeveloper || isRealPro || isOnTrial;

  // currentLimits: developers always get PRO limits regardless of simulation
  const currentLimits = isPro ? LIMITS.PRO : LIMITS.FREE;

  // isProActive: for legacy compatibility — same as isPro
  const isProActive = isPro;

  return {
    plan: isPro ? 'pro' : 'free',
    isPro,
    isDeveloper,
    isSimulatingFree,
    limits: currentLimits,
    loading,
    proExpiration: dbProExpiration?.toDate ? dbProExpiration.toDate() : (dbProExpiration ? new Date(dbProExpiration) : null),
    isExpired: isDeveloper ? false : (isTrialExpired && !isRealPro),
    simulatedPlan,
    toggleSimulatedPlan,
    trialDaysRemaining,
    trialHoursRemaining,
    resetTrial,
    isOnTrial,
    isTrialExpired,
    dbPlan,
    isProActive,
    isRealPaidPro
  };
};
