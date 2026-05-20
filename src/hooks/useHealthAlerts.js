import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, onSnapshot, orderBy, where, Timestamp } from 'firebase/firestore';

export const useHealthAlerts = () => {
  const { user, activeTeamId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activeTeamId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    // Calcular la fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateString = sevenDaysAgo.toISOString().split('T')[0];

    const q = query(
      collection(db, `users/${user.uid}/teams/${activeTeamId}/evaluaciones`),
      where('date', '>=', dateString),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeAlerts = [];
      const recentEvals = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        // Solo tomar la más reciente por jugador y tipo en los últimos 7 días
        if (!recentEvals[data.jugadorId]) recentEvals[data.jugadorId] = {};
        
        if (data.categoria === 'bienestar' && !recentEvals[data.jugadorId].bienestar) {
          recentEvals[data.jugadorId].bienestar = data;
          if (data.puntuacionTotal <= 12) {
            activeAlerts.push({
              id: doc.id,
              jugadorId: data.jugadorId,
              playerName: data.nombreJugador,
              type: 'bienestar',
              level: 'high',
              message: `Bienestar muy bajo (${data.puntuacionTotal}/25). Riesgo de sobrecarga.`,
              date: data.date
            });
          }
        }

        if (data.categoria === 'rpe' && !recentEvals[data.jugadorId].rpe) {
          recentEvals[data.jugadorId].rpe = data;
          if (data.rpeValue >= 8) {
            activeAlerts.push({
              id: doc.id,
              jugadorId: data.jugadorId,
              playerName: data.nombreJugador,
              type: 'rpe',
              level: 'high',
              message: `RPE muy alto (${data.rpeValue}/10). Fatiga aguda detectada.`,
              date: data.date
            });
          }
        }
      });

      setAlerts(activeAlerts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeTeamId]);

  return { alerts, loading };
};
