import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db.js';
import { t, isEn } from '../i18n/index.js';
import { buildPlayerPlansFilter } from '../utils/planFilters.js';

export { buildPlayerPlansFilter };

export const usePlayerPlans = (teamId, playerId, options = {}) => {
  const { user, getTeamPath } = useAuth();
  const [playerPlans, setPlayerPlans] = useState([]);
  const [teamPlans, setTeamPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const effectivePath = options.teamPath 
    ? options.teamPath.replace(/^\/+|\/+$/g, '') 
    : (teamId ? getTeamPath(teamId) : null);

  useEffect(() => {
    if (!user || !effectivePath) {
      setPlayerPlans([]);
      setTeamPlans([]);
      setLoading(false);
      return;
    }

    // Si no hay playerId, NUNCA se consulta playerPlans (evita cualquier fuga unscoped)
    if (!playerId) {
      setPlayerPlans([]);
      // Suscribirse a teamPlans si aplica
      const unsubTeamPlans = subscribeToCollection(`${effectivePath}/teamPlans`, (data) => {
        setTeamPlans(data);
        setLoading(false);
      });
      return () => {
        unsubTeamPlans();
      };
    }

    setLoading(true);

    // Consulta SIEMPRE scoped por playerId en Firestore (Capa de Red/Servidor)
    const filters = buildPlayerPlansFilter(playerId);
    const unsubPlayerPlans = subscribeToCollection(`${effectivePath}/playerPlans`, (data) => {
      // Doble defensa en memoria para garantizar pertenencia estricta
      setPlayerPlans(data.filter(p => p.playerId === playerId));
    }, filters);

    // Consulta de planes colectivos (compartidos por diseño)
    const unsubTeamPlans = subscribeToCollection(`${effectivePath}/teamPlans`, (data) => {
      setTeamPlans(data);
      setLoading(false);
    });

    return () => {
      unsubPlayerPlans();
      unsubTeamPlans();
    };
  }, [user, effectivePath, playerId]);

  const addPlayerPlan = async (planData) => {
    if (!user || !effectivePath) return;
    const targetPlayerId = planData.playerId || playerId;
    if (!targetPlayerId) {
      throw new Error('[usePlayerPlans.addPlayerPlan] playerId es obligatorio para asignar un plan individual.');
    }
    const docId = await addDocument(`${effectivePath}/playerPlans`, {
      ...planData,
      playerId: targetPlayerId,
      locale: planData.locale || (isEn() ? 'en' : 'es'),
      createdAt: new Date().toISOString(),
      active: true
    });
    await createNotification('success', {
      template: 'notifications.individualPlanAssigned',
      text: t('notifications.individualPlanAssigned')
    });
    return docId;
  };

  const updatePlayerPlan = async (planId, data) => {
    if (!user || !effectivePath) return;
    await updateDocument(`${effectivePath}/playerPlans`, planId, data);
  };

  const addTeamPlan = async (planData) => {
    if (!user || !effectivePath) return;
    const docId = await addDocument(`${effectivePath}/teamPlans`, {
      ...planData,
      locale: planData.locale || (isEn() ? 'en' : 'es'),
      createdAt: new Date().toISOString(),
      active: true
    });
    await createNotification('success', {
      template: 'notifications.teamPlanAssigned',
      text: t('notifications.teamPlanAssigned')
    });
    return docId;
  };

  const updateTeamPlan = async (planId, data) => {
    if (!user || !effectivePath) return;
    await updateDocument(`${effectivePath}/teamPlans`, planId, data);
  };

  const removePlayerPlan = async (id) => {
    if (!user || !effectivePath) return;
    await deleteDocument(`${effectivePath}/playerPlans`, id);
    await createNotification('info', {
      template: 'notifications.individualPlanRemoved',
      text: t('notifications.individualPlanRemoved')
    });
  };

  const removeTeamPlan = async (id) => {
    if (!user || !effectivePath) return;
    await deleteDocument(`${effectivePath}/teamPlans`, id);
    await createNotification('info', {
      template: 'notifications.teamPlanRemoved',
      text: t('notifications.teamPlanRemoved')
    });
  };

  return { 
    playerPlans, 
    teamPlans, 
    loading, 
    addPlayerPlan, 
    updatePlayerPlan, 
    addTeamPlan, 
    updateTeamPlan,
    removePlayerPlan,
    removeTeamPlan
  };
};
