import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, createNotification } from '../firebase/db';

export const usePlayerPlans = (teamId) => {
  const { user } = useAuth();
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
    const unsubPlayerPlans = subscribeToCollection(`users/${user.uid}/teams/${teamId}/playerPlans`, (data) => {
      setPlayerPlans(data);
    });

    const unsubTeamPlans = subscribeToCollection(`users/${user.uid}/teams/${teamId}/teamPlans`, (data) => {
      setTeamPlans(data);
      setLoading(false);
    });

    return () => {
      unsubPlayerPlans();
      unsubTeamPlans();
    };
  }, [user, teamId]);

  const addPlayerPlan = async (planData) => {
    if (!user || !teamId) return;
    const docId = await addDocument(`users/${user.uid}/teams/${teamId}/playerPlans`, {
      ...planData,
      createdAt: new Date().toISOString(),
      active: true
    });
    await createNotification('success', 'Plan individual asignado correctamente');
    return docId;
  };

  const updatePlayerPlan = async (planId, data) => {
    if (!user || !teamId) return;
    await updateDocument(`users/${user.uid}/teams/${teamId}/playerPlans`, planId, data);
  };

  const addTeamPlan = async (planData) => {
    if (!user || !teamId) return;
    const docId = await addDocument(`users/${user.uid}/teams/${teamId}/teamPlans`, {
      ...planData,
      createdAt: new Date().toISOString(),
      active: true
    });
    await createNotification('success', 'Plan de equipo asignado correctamente');
    return docId;
  };

  const updateTeamPlan = async (planId, data) => {
    if (!user || !teamId) return;
    await updateDocument(`users/${user.uid}/teams/${teamId}/teamPlans`, planId, data);
  };

  const removePlayerPlan = async (id) => {
    if (!user || !teamId) return;
    await deleteDocument(`users/${user.uid}/teams/${teamId}/playerPlans`, id);
    await createNotification('info', 'Plan individual eliminado');
  };

  const removeTeamPlan = async (id) => {
    if (!user || !teamId) return;
    await deleteDocument(`users/${user.uid}/teams/${teamId}/teamPlans`, id);
    await createNotification('info', 'Plan de equipo eliminado');
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
