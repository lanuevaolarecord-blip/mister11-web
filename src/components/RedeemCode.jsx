import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, increment, Timestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { Ticket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const RedeemCode = () => {
  const { user } = useAuth();
  const { isPro, proExpiration } = usePlan();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleRedeem = async () => {
    if (!code.trim() || !user) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Verificar si ya tiene Pro activo
      if (isPro && proExpiration) {
        setMessage({ 
          type: 'info', 
          text: `Ya tienes Plan Pro activo hasta el ${proExpiration.toLocaleDateString()}.` 
        });
        setLoading(false);
        return;
      }

      const codeStr = code.trim().toUpperCase();
      let durationDays = 30;
      const isBetaCode = codeStr === 'BETA2026';

      if (isBetaCode) {
        durationDays = 90; // Código especial BETA2026 otorga 90 días
      } else {
        // 2. Buscar el código en Firestore
        const codeRef = doc(db, 'promoCodes', codeStr);
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists()) {
          throw new Error('Código no válido.');
        }

        const codeData = codeSnap.data();

        // 3. Validaciones de negocio
        if (!codeData.active) {
          throw new Error('Este código ya no está activo.');
        }
        if (codeData.usedCount >= codeData.maxUses) {
          throw new Error('Este código ha alcanzado su límite de usos.');
        }

        durationDays = codeData.durationDays || 30;

        // Incrementar contador de usos del código
        await updateDoc(codeRef, {
          usedCount: increment(1)
        });
      }

      // 4. Calcular nueva fecha de expiración (hoy + durationDays)
      const expirationDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // 5. Actualizar usuario y sus equipos con writeBatch
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        plan: 'pro',
        proExpiration: Timestamp.fromDate(expirationDate),
        updatedAt: Timestamp.now()
      }, { merge: true });

      const teamsRef = collection(db, 'users', user.uid, 'teams');
      const teamsSnap = await getDocs(teamsRef);
      teamsSnap.forEach((teamDoc) => {
        batch.update(teamDoc.ref, {
          plan: 'pro',
          proExpiration: Timestamp.fromDate(expirationDate),
          updatedAt: Timestamp.now()
        });
      });

      await batch.commit();

      setMessage({ 
        type: 'success', 
        text: `¡Felicidades! Plan Pro activado hasta el ${expirationDate.toLocaleDateString()}.` 
      });
      setCode('');

      // Recargar la página después de 1.5s para aplicar cambios reactivos
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error("Error al canjear código:", error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al procesar el código. Inténtalo de nuevo.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-card redeem-card">
      <div className="card-header-icon">
        <Ticket size={20} />
        <h3>Código Promocional</h3>
      </div>
      
      <div className="settings-form">
        <p className="card-desc">Si tienes un código de acceso beta o promocional, canjéalo aquí para desbloquear funciones Pro.</p>
        
        <div className="promo-input-group">
          <input 
            type="text" 
            placeholder="Introduce tu código (ej. BETA2026)" 
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={loading}
          />
          <button 
            className="btn-primary" 
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Canjear'}
          </button>
        </div>

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : 
             message.type === 'error' ? <AlertCircle size={16} /> : <Ticket size={16} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedeemCode;
