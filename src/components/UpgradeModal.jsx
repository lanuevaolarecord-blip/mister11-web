import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { STRIPE_PRICE_IDS } from '../config/stripe';
import { useAuth } from '../context/AuthContext';
import './UpgradeModal.css';

/**
 * Crea una sesión de Stripe Checkout usando la extensión oficial de Firebase.
 * La extensión escucha la colección `customers/{uid}/checkout_sessions`
 * y retorna la URL de pago cuando está lista.
 */
const createStripeCheckoutSession = async (uid, priceId, successUrl, cancelUrl, teamId) => {
  const sessionRef = await addDoc(
    collection(db, 'customers', uid, 'checkout_sessions'),
    {
      price: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        teamId: teamId || ''
      }
    }
  );
  return sessionRef;
};

const UpgradeModal = ({ isOpen, onClose, message, urgency = false }) => {
  const { activeTeamId } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [stripeError, setStripeError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const unsubscribeRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup listeners on unmount or close
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleSubscribe = async (priceId, planName) => {
    setLoadingPlan(planName);
    setStripeError(null);
    setStatusMsg('Preparando sesión de pago...');

    // Validate price ID
    if (!priceId || priceId === 'undefined') {
      setStripeError({
        type: 'config',
        message: `El precio del Plan ${planName} no está configurado. Verifica la variable VITE_STRIPE_PRICE_${planName.toUpperCase()} en Vercel.`,
      });
      setLoadingPlan(null);
      setStatusMsg('');
      return;
    }

    // Guest / demo mode
    const activeUid = localStorage.getItem('mister11_active_user_uid');
    if (activeUid === 'invitado-local') {
      alert('El pago no está disponible en modo invitado. Inicia sesión primero.');
      setLoadingPlan(null);
      setStatusMsg('');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setStripeError({ type: 'auth', message: 'Debes iniciar sesión para suscribirte.' });
      setLoadingPlan(null);
      setStatusMsg('');
      return;
    }

    try {
      console.log('Llamando a createCheckoutSession con priceId:', priceId, 'y teamId:', activeTeamId);
      setStatusMsg('Creando sesión en Stripe...');

      // Guardar el plan elegido en localStorage ANTES de salir a Stripe
      // Esto permite actualizar el plan al regresar aunque no haya webhook configurado
      const planTypeName = planName.toLowerCase(); // 'pro' o 'club'
      localStorage.setItem('mister11_pending_plan', planTypeName);
      localStorage.setItem('mister11_pending_plan_teamId', activeTeamId || '');

      const sessionRef = await createStripeCheckoutSession(
        user.uid,
        priceId,
        `${window.location.origin}/dashboard?payment=success`,
        `${window.location.origin}/pricing`,
        activeTeamId
      );
      console.log('Resultado (documento creado):', sessionRef.id);

      setStatusMsg('Esperando confirmación de Stripe...');

      // Listen for the extension to populate the URL (or error)
      unsubscribeRef.current = onSnapshot(sessionRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (data?.error) {
          // Stripe extension returned an error
          if (unsubscribeRef.current) unsubscribeRef.current();
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setStripeError({
            type: 'stripe',
            message: data.error?.message || JSON.stringify(data.error),
            code: data.error?.code || '',
          });
          setLoadingPlan(null);
          setStatusMsg('');
          return;
        }

        if (data?.url) {
          // Got the Stripe Checkout URL — redirect
          if (unsubscribeRef.current) unsubscribeRef.current();
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          window.location.assign(data.url);
        }
      }, (err) => {
        // Firestore listener error (usually permissions)
        setStripeError({
          type: 'firestore',
          message: err.message,
          code: err.code,
        });
        setLoadingPlan(null);
        setStatusMsg('');
      });

      // Timeout after 30 seconds
      timeoutRef.current = setTimeout(() => {
        if (unsubscribeRef.current) unsubscribeRef.current();
        setStripeError({
          type: 'timeout',
          message: 'El tiempo de espera agotó (30s). Verifica que la extensión de Stripe está activa en Firebase.',
        });
        setLoadingPlan(null);
        setStatusMsg('');
      }, 30000);

    } catch (error) {
      console.error('[Stripe Checkout]', error);
      setStripeError({
        type: error.code === 'permission-denied' ? 'permissions' : 'unknown',
        message: error.message,
        code: error.code,
      });
      setLoadingPlan(null);
      setStatusMsg('');
    }
  };

  const getErrorHelp = (error) => {
    if (!error) return null;
    if (error.type === 'permissions' || error.code === 'permission-denied') {
      return (
        <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          💡 <strong>Solución:</strong> Las reglas de Firestore no permiten escribir en{' '}
          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: '3px' }}>
            customers/{'{'}uid{'}'}/checkout_sessions
          </code>.{' '}
          Hay que actualizar las reglas en Firebase Console o con{' '}
          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: '3px' }}>firebase deploy --only firestore:rules</code>.
        </div>
      );
    }
    if (error.type === 'timeout') {
      return (
        <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          💡 La extensión "Run Payments with Stripe" puede no estar activa o configurada en Firebase.
          Ve a <a href="https://console.firebase.google.com/project/mister11/extensions" target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF7D' }}>Firebase Extensions</a> para verificarla.
        </div>
      );
    }
    if (error.type === 'stripe') {
      return (
        <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          💡 Error de Stripe. Verifica que el Price ID existe en tu{' '}
          <a href="https://dashboard.stripe.com/test/products" target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF7D' }}>
            dashboard de Stripe (modo test)
          </a>.
        </div>
      );
    }
    return null;
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

        {/* Status message while loading */}
        {loadingPlan && statusMsg && (
          <div style={{
            margin: '8px 20px 0',
            padding: '10px 14px',
            background: 'rgba(0,75,135,0.1)',
            border: '1px solid rgba(0,75,135,0.25)',
            borderRadius: '8px',
            fontSize: '0.82rem',
            color: 'rgba(100,160,220,0.9)',
            textAlign: 'center',
          }}>
            ⏳ {statusMsg}
          </div>
        )}

        {/* Error panel */}
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
              ⚠️ {stripeError.type === 'config' ? 'Error de configuración' :
                   stripeError.type === 'auth' ? 'No autenticado' :
                   stripeError.type === 'permissions' ? 'Error de permisos Firestore' :
                   stripeError.type === 'timeout' ? 'Tiempo de espera agotado' :
                   'Error al iniciar el pago'}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {stripeError.code && <><strong>Código:</strong> {stripeError.code}<br /></>}
              <strong>Detalle:</strong> {stripeError.message}
            </div>
            {getErrorHelp(stripeError)}
            <button onClick={() => setStripeError(null)} style={{
              marginTop: '8px', background: 'none', border: 'none',
              color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer',
              textDecoration: 'underline', padding: 0
            }}>
              Cerrar este mensaje
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="upgrade-plans-grid">

          {/* PRO PLAN */}
          <div className="upgrade-plan-card upgrade-plan-pro">
            <div className="upgrade-plan-badge badge-popular">⭐ MÁS POPULAR</div>
            <div className="upgrade-plan-icon">🚀</div>
            <h3 className="upgrade-plan-name">Plan PRO</h3>
            <div className="upgrade-plan-price">
              <span className="price-amount">7,99€</span>
              <span className="price-period">/mes</span>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>IVA incluido · Cancela cuando quieras</p>
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

          {/* CLUB PLAN */}
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
