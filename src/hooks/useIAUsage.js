import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from './usePlan';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * Hook para gestionar los límites mensuales de uso de la IA Generadora de Míster11.
 * Soporta planes Free (10 usos), Pro (100 usos) y Club (500 usos).
 */
export const useIAUsage = () => {
  const { user, activeTeamId, getTeamPath } = useAuth();
  const { plan, isPro, isClubActive } = usePlan();
  
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Calcular el límite según el plan activo
  // Free (sin Pro ni Club): 10
  // Pro (individual): 100
  // Club (miembro de club activo): 500
  let limit = 10;
  if (plan === 'club' || isClubActive) {
    limit = 500;
  } else if (plan === 'pro' || isPro) {
    limit = 100;
  }

  // Obtener el mes actual en formato YYYY-MM
  const getCurrentMonthStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const currentMonth = getCurrentMonthStr();

  // Obtener la referencia al documento de Firestore de forma segura
  const getDocRef = useCallback(() => {
    if (!user || !activeTeamId) return null;
    const basePath = getTeamPath ? getTeamPath() : `users/${user.uid}/teams/${activeTeamId}`;
    if (!basePath) return null;
    return doc(db, basePath, 'iaUsage', 'current');
  }, [user, activeTeamId, getTeamPath]);

  // Escucha en tiempo real del uso mensual
  useEffect(() => {
    const docRef = getDocRef();
    if (!docRef) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.month !== currentMonth) {
          // El mes cambió, inicializar de nuevo
          setDoc(docRef, {
            month: currentMonth,
            count: 0,
            limit: limit
          }, { merge: true }).catch(err => console.error("Error al reiniciar el mes de uso de IA:", err));
          setUsageCount(0);
        } else {
          setUsageCount(data.count || 0);
        }
      } else {
        // Crear documento inicial si no existe
        setDoc(docRef, {
          month: currentMonth,
          count: 0,
          limit: limit
        }, { merge: true }).catch(err => console.error("Error al crear documento inicial de uso de IA:", err));
        setUsageCount(0);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error al suscribirse al uso de la IA:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [getDocRef, currentMonth, limit]);

  /**
   * Comprueba si el usuario tiene usos mensuales disponibles.
   * @returns {Promise<boolean>} true si le quedan usos, false de lo contrario.
   */
  const checkUsage = async () => {
    const docRef = getDocRef();
    if (!docRef) return false;

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.month !== currentMonth) {
          // Si el mes cambió, restablecer a 0
          await setDoc(docRef, {
            month: currentMonth,
            count: 0,
            limit: limit
          }, { merge: true });
          return true;
        }
        return (data.count || 0) < limit;
      }

      // Si no existe, crear y permitir
      await setDoc(docRef, {
        month: currentMonth,
        count: 0,
        limit: limit
      }, { merge: true });
      return true;
    } catch (e) {
      console.error("Error en checkUsage:", e);
      return false;
    }
  };

  /**
   * Incrementa el contador de uso mensual de IA en 1.
   */
  const incrementUsage = async () => {
    const docRef = getDocRef();
    if (!docRef) return;

    try {
      const docSnap = await getDoc(docRef);
      let currentCount = 0;
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.month === currentMonth) {
          currentCount = data.count || 0;
        }
      }

      await setDoc(docRef, {
        month: currentMonth,
        count: currentCount + 1,
        limit: limit
      }, { merge: true });
    } catch (e) {
      console.error("Error en incrementUsage:", e);
    }
  };

  /**
   * Devuelve la cantidad de usos restantes este mes.
   */
  const getRemainingUsages = () => {
    return Math.max(0, limit - usageCount);
  };

  return {
    usageCount,
    limit,
    loading,
    checkUsage,
    incrementUsage,
    getRemainingUsages,
    getUsageLimit: () => limit
  };
};
