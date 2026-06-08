import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { STRIPE_PRICE_IDS } from '../config/stripe';
import './UpgradeModal.css';

const UpgradeModal = ({ isOpen, onClose, message }) => {
  const [loadingPlan, setLoadingPlan] = useState(null);

  if (!isOpen) return null;

  const handleSubscribe = async (priceId, planName) => {
    setLoadingPlan(planName);
    try {
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'ext-firebase-stripe-createCheckoutSession');
      
      const result = await createCheckoutSession({
        priceId: priceId,
        successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/dashboard`,
      });
      
      if (result.data && result.data.url) {
        window.location.assign(result.data.url);
      } else {
        throw new Error("No se devolvió URL de redirección.");
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      alert(`No se pudo iniciar el pago para el plan ${planName}.`);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content upgrade-modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="crown-icon">👑</div>
          <h2>¡Sube de nivel con Míster11!</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <p className="upgrade-message">
            {message || "Desbloquea todas las herramientas avanzadas para llevar la gestión de tus plantillas al siguiente nivel."}
          </p>

          <div className="plans-grid">
            {/* PLAN PRO */}
            <div className="plan-selection-card">
              <div className="plan-badge">POPULAR</div>
              <h3>Plan PRO</h3>
              <div className="plan-price">7,99 €<span>/mes</span></div>
              <ul className="plan-features">
                <li>✅ Equipos y jugadores ilimitados</li>
                <li>✅ Exportación de informes (PDF/CSV)</li>
                <li>✅ Generación ilimitada por IA</li>
                <li>✅ Pizarra Táctica (Exportar PNG/MP4)</li>
              </ul>
              <button 
                className="btn-primary-blue-allcaps subscribe-btn"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#004B87',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                disabled={loadingPlan !== null}
                onClick={() => handleSubscribe(STRIPE_PRICE_IDS.pro, 'Pro')}
              >
                {loadingPlan === 'Pro' ? 'CARGANDO...' : 'SUSCRIBIRSE PRO'}
              </button>
            </div>

            {/* PLAN CLUB */}
            <div className="plan-selection-card premium">
              <div className="plan-badge gold">CLUB</div>
              <h3>Plan CLUB</h3>
              <div className="plan-price">39,99 €<span>/mes</span></div>
              <ul className="plan-features">
                <li>✅ Todo lo del Plan PRO</li>
                <li>✅ Licencia multi-entrenador</li>
                <li>✅ Informes consolidados de club</li>
                <li>✅ Soporte prioritario 24/7</li>
              </ul>
              <button 
                className="btn-primary-blue-allcaps subscribe-btn"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#2E7D5C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                disabled={loadingPlan !== null}
                onClick={() => handleSubscribe(STRIPE_PRICE_IDS.club, 'Club')}
              >
                {loadingPlan === 'Club' ? 'CARGANDO...' : 'SUSCRIBIRSE CLUB'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button 
            className="btn-secondary" 
            style={{ width: '100%', minHeight: '48px' }} 
            onClick={onClose}
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
