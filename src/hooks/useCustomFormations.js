import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../firebase/db';

export const useCustomFormations = () => {
  const { user, clubId, currentMode } = useAuth();
  const [customFormations, setCustomFormations] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCollectionPath = () => {
    if (!user || user.uid === 'invitado-local') return null;
    if (currentMode === 'club' && clubId) {
      return `clubs/${clubId}/customFormations`;
    }
    return `users/${user.uid}/customFormations`;
  };

  useEffect(() => {
    const path = getCollectionPath();
    if (!path) {
      setCustomFormations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection(path, (data) => {
      setCustomFormations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, clubId, currentMode]);

  const addCustomFormation = async (formationData) => {
    const path = getCollectionPath();
    if (!path) {
      // Si estamos en modo invitado local, guardamos en memoria o simulamos
      if (user?.uid === 'invitado-local') {
        const newId = `custom-${Date.now()}`;
        setCustomFormations(prev => [...prev, { id: newId, ...formationData }]);
        return newId;
      }
      throw new Error("No authenticated user or active context");
    }
    return await addDocument(path, formationData);
  };

  const updateCustomFormation = async (id, formationData) => {
    const path = getCollectionPath();
    if (!path) {
      if (user?.uid === 'invitado-local') {
        setCustomFormations(prev => prev.map(f => f.id === id ? { id, ...formationData } : f));
        return;
      }
      throw new Error("No authenticated user or active context");
    }
    return await updateDocument(path, id, formationData);
  };

  const deleteCustomFormation = async (id) => {
    const path = getCollectionPath();
    if (!path) {
      if (user?.uid === 'invitado-local') {
        setCustomFormations(prev => prev.filter(f => f.id !== id));
        return;
      }
      throw new Error("No authenticated user or active context");
    }
    return await deleteDocument(path, id);
  };

  return { customFormations, loading, addCustomFormation, updateCustomFormation, deleteCustomFormation };
};
