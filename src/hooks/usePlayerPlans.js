import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';
import { t, isEn } from '../i18n/index.js';

export const usePlayerPlans = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [playerPlans, setPlayerPlans] = useState([]);
  const [teamPlans, setTeamPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setPlayerPlans([]);
      setTeamPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);
    const unsubPlayerPlans = subscribeToCollection(`${path}/playerPlans`, (data) => {
      setPlayerPlans(data);
    });

    const unsubTeamPlans = subscribeToCollection(`${path}/teamPlans`, (data) => {
      setTeamPlans(data);
      setLoading(false);
    });

    return () => {
      unsubPlayerPlans();
      unsubTeamPlans();
    };
  }, [user, teamId, getTeamPath]);

  const addPlayerPlan = async (planData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    const docId = await addDocument(`${path}/playerPlans`, {
      ...planData,
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
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    await updateDocument(`${path}/playerPlans`, planId, data);
  };

  const addTeamPlan = async (planData) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    const docId = await addDocument(`${path}/teamPlans`, {
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
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    await updateDocument(`${path}/teamPlans`, planId, data);
  };

  const removePlayerPlan = async (id) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    await deleteDocument(`${path}/playerPlans`, id);
    await createNotification('info', {
      template: 'notifications.individualPlanRemoved',
      text: t('notifications.individualPlanRemoved')
    });
  };

  const removeTeamPlan = async (id) => {
    if (!user || !teamId) return;
    const path = getTeamPath(teamId);
    await deleteDocument(`${path}/teamPlans`, id);
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
