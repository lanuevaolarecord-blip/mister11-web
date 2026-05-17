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
  },
  PRO: {
    TEAMS: 100,
    PLAYERS: 1000,
    SESSIONS: 1000,
    PDF_EXPORT: true,
  }
};

export const usePlan = () => {
  const { user } = useAuth();
  const [dbPlan, setDbPlan] = useState('free');
  const [dbProExpiration, setDbProExpiration] = useState(null);
  const [loading, setLoading] = useState(true);

  // Local simulation state to satisfy testing
  const [simulatedPlan, setSimulatedPlan] = useState(() => {
    return localStorage.getItem('mister11_simulated_plan') || 'pro'; // Default to PRO trial
  });

  const [trialStart, setTrialStart] = useState(() => {
    let start = localStorage.getItem('mister11_trial_start');
    if (!start) {
      start = String(Date.now());
      localStorage.setItem('mister11_trial_start', start);
    }
    return Number(start);
  });

  useEffect(() => {
    if (!user) {
      setDbPlan('free');
      setDbProExpiration(null);
      setLoading(false);
      return;
    }

    if (user.uid === 'invitado-local') {
      setDbPlan('free');
      setDbProExpiration(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDbPlan(data.plan || 'free');
        setDbProExpiration(data.proExpiration || null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading plan:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const toggleSimulatedPlan = () => {
    const next = simulatedPlan === 'pro' ? 'free' : 'pro';
    setSimulatedPlan(next);
    localStorage.setItem('mister11_simulated_plan', next);
  };

  const resetTrial = () => {
    const start = String(Date.now());
    localStorage.setItem('mister11_trial_start', start);
    setTrialStart(Number(start));
    setSimulatedPlan('pro');
    localStorage.setItem('mister11_simulated_plan', 'pro');
  };

  const now = new Date();

  // Calculate trial days remaining
  const msPassed = Date.now() - trialStart;
  const daysPassed = Math.floor(msPassed / (24 * 60 * 60 * 1000));
  const trialDaysRemaining = Math.max(0, 7 - daysPassed);
  const isTrialExpired = trialDaysRemaining <= 0;

  // Real plan calculations
  const isRealExpired = dbProExpiration && dbProExpiration.toDate() < now;
  const isRealPro = (dbPlan === 'pro' || dbPlan === 'club') && !isRealExpired;

  // Final PRO status (simulated OR real)
  const isPro = (simulatedPlan === 'pro' && !isTrialExpired) || isRealPro;
  const currentLimits = isPro ? LIMITS.PRO : LIMITS.FREE;

  return {
    plan: isPro ? 'pro' : 'free',
    isPro,
    limits: currentLimits,
    loading,
    proExpiration: dbProExpiration?.toDate(),
    isExpired: isTrialExpired && !isRealPro,
    simulatedPlan,
    toggleSimulatedPlan,
    trialDaysRemaining,
    resetTrial
  };
};
