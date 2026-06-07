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
  const { user } = useAuth();
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

    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDbPlan(data.plan || 'free');
        setDbProExpiration(data.proExpiration || null);
        // trialStartDate comes from Firestore (server-side, tamper-proof)
        if (data.trialStartDate) {
          setDbTrialStartDate(data.trialStartDate.toDate());
        } else {
          setDbTrialStartDate(null);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading plan:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const toggleSimulatedPlan = () => {
    const next = isPro ? 'free' : 'pro';
    setSimulatedPlan(next);
    localStorage.setItem('mister11_simulated_plan', next);
  };

  const resetTrial = () => {
    // Only resets the local simulation (for developer testing)
    setSimulatedPlan('pro');
    localStorage.setItem('mister11_simulated_plan', 'pro');
  };

  const now = new Date();

  // --- Trial calculation (now based on Firestore date, tamper-proof) ---
  const trialStart = dbTrialStartDate || now;
  const msPassed = now - trialStart;
  const daysPassed = Math.floor(msPassed / (24 * 60 * 60 * 1000));
  const trialDaysRemaining = Math.max(0, 7 - daysPassed);
  const isTrialExpired = trialDaysRemaining <= 0;
  const isOnTrial = (dbPlan === 'trial') && !isTrialExpired;

  // --- Real PRO plan ---
  const isDeveloper = user && user.email && DEVELOPER_EMAILS.includes(user.email.toLowerCase());
  const isRealExpired = dbProExpiration && dbProExpiration.toDate && dbProExpiration.toDate() < now;
  const isRealPro = (dbPlan === 'pro' || dbPlan === 'club') && !isRealExpired;

  // --- Final PRO status ---
  const isPro = isRealPro || isOnTrial || (simulatedPlan === 'pro') || (isDeveloper && simulatedPlan !== 'free');
  const currentLimits = isPro ? LIMITS.PRO : LIMITS.FREE;

  return {
    plan: isPro ? 'pro' : 'free',
    isPro,
    isDeveloper,
    limits: currentLimits,
    loading,
    proExpiration: dbProExpiration?.toDate ? dbProExpiration.toDate() : null,
    isExpired: isDeveloper ? false : (isTrialExpired && !isRealPro),
    simulatedPlan,
    toggleSimulatedPlan,
    trialDaysRemaining,
    resetTrial,
    isOnTrial,
    dbPlan,
  };
};
