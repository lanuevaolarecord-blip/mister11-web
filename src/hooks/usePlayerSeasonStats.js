import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { calculatePlayerMatchStats, calculateAllPlayersStats } from '../utils/playerMatchStats';

export const usePlayerSeasonStats = (teamId, playerId = null) => {
  const { user, getTeamPath } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const path = getTeamPath(teamId);
    const matchesRef = collection(db, `${path}/matches`);
    const unsub = onSnapshot(matchesRef, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMatches(docs);
      setLoading(false);
    }, (err) => {
      console.warn('[usePlayerSeasonStats] Error loading matches:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, teamId, getTeamPath]);

  const playerStats = useMemo(() => {
    if (!playerId) return null;
    return calculatePlayerMatchStats(playerId, matches);
  }, [playerId, matches]);

  const allPlayersStats = useMemo(() => {
    return (playersList = []) => calculateAllPlayersStats(playersList, matches);
  }, [matches]);

  return {
    matches,
    playerStats,
    allPlayersStats,
    loading
  };
};
