import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { STRIPE_PRICE_IDS } from '../config/stripe';
import './UpgradeModal.css';

const UpgradeModal = ({ isOpen, onClose, message, urgency = false }) => {
  const [loadingPlan, setLoadingPlan] = useState(null);

  if (!isOpen) return null;

  const handleSubscribe = async (priceId, planName) => {
    setLoadingPlan(planName);
    const activeUid = localStorage.getItem('mister11_active_user_uid');

    if (activeUid === 'invitado-local') {
      localStorage.setItem('mister11_simulated_plan', planName.toLowerCase() === 'pro' ? 'pro' : 'club');
      alert(`¡Modo ${planName.toUpperCase()} Simulado activado!`);
      onClose();
      window.location.reload();
      return;
    }

    try {
      const functions = getFunctions();
      let createCheckoutSession = httpsCallable(functions, 'ext-firestore-stripe-payments-createCheckoutSession');
      let result;
      try {
        result = await createCheckoutSession({
          priceId: priceId,
          successUrl: `${window.location.origin}/dashboard?subscribed=1`,
          cancelUrl: `${window.location.origin}/admin`,
        });
      } catch (firstErr) {
        if (firstErr.message?.includes('not found') || firstErr.message?.includes('NOT_FOUND') || firstErr.code === 'not-found') {
          console.warn('Retrying with alternate function name...');
          createCheckoutSession = httpsCallable(functions, 'ext-firebase-stripe-createCheckoutSession');
          result = await createCheckoutSession({
            priceId: priceId,
            successUrl: `${window.location.origin}/dashboard?subscribed=1`,
            cancelUrl: `${window.location.origin}/admin`,
          });
        } else {
          throw firstErr;
        }
      }

      if (result && result.data && result.data.url) {
        window.location.assign(result.data.url);
      } else {
        throw new Error('No se devolvió URL de redirección.');
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      alert('No se pudo iniciar el proceso de pago. Inténtalo de nuevo.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const proBenefits = [
    { icon: '♾️', text: 'Equipos y jugadores ilimitados' },
    { icon: '📄', text: 'Exportación de informes en PDF/CSV' },
    { icon: '🤖', text: 'Generación ilimitada con IA' },
    { icon: '🎨', text: 'Pizarra táctica (exportar PNG/MP4)' },
    { icon: '📊', text: 'Tests y evaluaciones avanzadas' },
    { icon: '🔓', text: 'Acceso completo sin restricciones' },
  ];

  const clubBenefits = [
    { icon: '✅', text: 'Todo lo del Plan PRO incluido' },
    { icon: '👥', text: 'Licencia multi-entrenador (varios usuarios)' },
    { icon: '📈', text: 'Informes consolidados de todo el club' },
    { icon: '⚡', text: 'Soporte prioritario 24/7' },
    { icon: '🔧', text: 'Acceso beta a nuevas funciones' },
    { icon: '🏅', text: 'Panel administrativo del club' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upgrade-modal-wrapper" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="upgrade-modal-header">
          <button className="upgrade-close-x" onClick={onClose} aria-label="Cerrar">✕</button>
          {urgency && <div className="upgrade-urgency-pill">⏰ ¡PRUEBA POR VENCER!</div>}
          <div className="upgrade-crown-anim">👑</div>
          <h2 className="upgrade-title">Desbloquea Míster11 PRO</h2>
          <p className="upgrade-subtitle">
            {message || 'Lleva la gestión de tu equipo al siguiente nivel con funciones ilimitadas.'}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="upgrade-plans-grid">

          {/* --- PRO PLAN --- */}
          <div className="upgrade-plan-card upgrade-plan-pro">
            <div className="upgrade-plan-badge badge-popular">⭐ MÁS POPULAR</div>
            <div className="upgrade-plan-icon">🚀</div>
            <h3 className="upgrade-plan-name">Plan PRO</h3>
            <div className="upgrade-plan-price">
              <span className="price-amount">7,99€</span>
              <span className="price-period">/mes</span>
            </div>
            <ul className="upgrade-benefits-list">
              {proBenefits.map((b, i) => (
                <li key={i} className="upgrade-benefit-row">
                  <span className="benefit-emoji">{b.icon}</span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
            <button
              id="btn-subscribe-pro"
              className="upgrade-subscribe-btn btn-pro"
              disabled={loadingPlan !== null}
              onClick={() => handleSubscribe(STRIPE_PRICE_IDS.pro, 'Pro')}
            >
              {loadingPlan === 'Pro' ? '⏳ Procesando...' : 'EMPEZAR CON PRO'}
            </button>
          </div>

          {/* --- CLUB PLAN --- */}
          <div className="upgrade-plan-card upgrade-plan-club">
            <div className="upgrade-plan-badge badge-club">🏆 PARA CLUBS</div>
            <div className="upgrade-plan-icon">🏟️</div>
            <h3 className="upgrade-plan-name">Plan CLUB</h3>
            <div className="upgrade-plan-price">
              <span className="price-amount">39,99€</span>
              <span className="price-period">/mes</span>
            </div>
            <ul className="upgrade-benefits-list">
              {clubBenefits.map((b, i) => (
                <li key={i} className="upgrade-benefit-row">
                  <span className="benefit-emoji">{b.icon}</span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
            <button
              id="btn-subscribe-club"
              className="upgrade-subscribe-btn btn-club"
              disabled={loadingPlan !== null}
              onClick={() => handleSubscribe(STRIPE_PRICE_IDS.club, 'Club')}
            >
              {loadingPlan === 'Club' ? '⏳ Procesando...' : 'EMPEZAR CON CLUB'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="upgrade-modal-footer">
          <p className="upgrade-guarantee">🔒 Pago seguro con Stripe · Cancela en cualquier momento · Sin permanencia</p>
          <button className="upgrade-later-link" onClick={onClose}>
            Continuar con plan gratuito
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
