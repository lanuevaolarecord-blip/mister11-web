import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { STRIPE_PRICE_IDS } from '../config/stripe';
import './UpgradeModal.css';

// Firebase Stripe Extension function names to try (in order)
const CHECKOUT_FUNCTION_NAMES = [
  'ext-firestore-stripe-payments-createCheckoutSession',
  'ext-firebase-stripe-payments-createCheckoutSession',
  'ext-firebase-stripe-createCheckoutSession',
  'createCheckoutSession',
];

const UpgradeModal = ({ isOpen, onClose, message, urgency = false }) => {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [stripeError, setStripeError] = useState(null);

  if (!isOpen) return null;

  const handleSubscribe = async (priceId, planName) => {
    setLoadingPlan(planName);
    setStripeError(null);

    // Validate price ID is configured
    if (!priceId || priceId === 'undefined') {
      setStripeError({
        type: 'config',
        message: `El ID de precio para el Plan ${planName} no está configurado. Verifica las variables de entorno VITE_STRIPE_PRICE_${planName.toUpperCase()} en Vercel.`,
        priceId: priceId,
      });
      setLoadingPlan(null);
      return;
    }

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
      // Also try with europe-west1 region if us-central1 fails
      const functionsEU = getFunctions(undefined, 'europe-west1');

      let result = null;
      let lastError = null;

      // Try each function name and region combination
      const attempts = [
        { fn: functions, name: CHECKOUT_FUNCTION_NAMES[0] },
        { fn: functions, name: CHECKOUT_FUNCTION_NAMES[1] },
        { fn: functions, name: CHECKOUT_FUNCTION_NAMES[2] },
        { fn: functionsEU, name: CHECKOUT_FUNCTION_NAMES[0] },
        { fn: functionsEU, name: CHECKOUT_FUNCTION_NAMES[2] },
      ];

      for (const attempt of attempts) {
        try {
          console.log(`[Stripe] Trying: ${attempt.name}...`);
          const fn = httpsCallable(attempt.fn, attempt.name, { timeout: 15000 });
          result = await fn({
            priceId: priceId,
            successUrl: `${window.location.origin}/dashboard?subscribed=1`,
            cancelUrl: `${window.location.origin}/admin`,
          });
          console.log(`[Stripe] Success with: ${attempt.name}`, result?.data);
          break; // success — stop trying
        } catch (err) {
          console.warn(`[Stripe] Failed ${attempt.name}:`, err.code, err.message);
          lastError = err;
          // Only continue if it's a "not found" error
          const isNotFound = err.code === 'functions/not-found' ||
            err.message?.toLowerCase().includes('not found') ||
            err.message?.toLowerCase().includes('internal');
          if (!isNotFound) break; // Non-404 error, stop trying
        }
      }

      if (result && result.data && result.data.url) {
        window.location.assign(result.data.url);
      } else if (lastError) {
        throw lastError;
      } else {
        throw new Error('No se devolvió URL de redirección desde Stripe.');
      }
    } catch (error) {
      console.error('[Stripe] Final error:', error);
      setStripeError({
        type: 'firebase',
        code: error.code || 'unknown',
        message: error.message || 'Error desconocido',
        priceId: priceId,
      });
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

        {/* Error panel — shows when Stripe fails */}
        {stripeError && (
          <div style={{
            margin: '12px 20px 0',
            padding: '14px 16px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            fontSize: '0.82rem',
            lineHeight: '1.5'
          }}>
            <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '6px' }}>
              ⚠️ {stripeError.type === 'config' ? 'Error de configuración' : 'Error al iniciar el pago'}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {stripeError.type === 'config' ? (
                stripeError.message
              ) : (
                <>
                  <strong>Código:</strong> {stripeError.code}<br />
                  <strong>Detalle:</strong> {stripeError.message}
                </>
              )}
            </div>
            {stripeError.type === 'firebase' && (
              <details style={{ marginTop: '6px' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  ℹ️ Información de diagnóstico
                </summary>
                <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                  Price ID: {stripeError.priceId}<br />
                  Funciones probadas: ext-firestore-stripe-payments-createCheckoutSession,<br />
                  ext-firebase-stripe-createCheckoutSession (us-central1 + europe-west1)
                </div>
              </details>
            )}
            {stripeError.type === 'firebase' && (stripeError.code === 'functions/not-found' || stripeError.message?.includes('not found')) && (
              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                💡 <strong>Solución:</strong> La extensión de Stripe no está instalada en Firebase. Ve a la{' '}
                <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF7D' }}>
                  consola de Firebase
                </a>{' '}
                → Extensions → Instala "Run Payments with Stripe".
              </div>
            )}
            <button
              onClick={() => setStripeError(null)}
              style={{
                marginTop: '8px',
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Cerrar este mensaje
            </button>
          </div>
        )}

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

        {/* Test mode note */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))',
          background: 'rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary, rgba(255,255,255,0.4))', margin: 0 }}>
            🧪 <strong>Modo de prueba Stripe:</strong> Usa tarjeta <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '3px' }}>4242 4242 4242 4242</code>, cualquier fecha futura y CVC 123.
          </p>
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
