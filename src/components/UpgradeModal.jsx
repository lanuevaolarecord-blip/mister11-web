import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, onSnapshot, doc, getDoc, setDoc, updateDoc, increment, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { PLANS, calcularDesgloseIVA } from '../config/plans';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { isNativeAndroid, openExternal } from '../utils/platform';
import './UpgradeModal.css';

/**
 * Crea una sesión de Stripe Checkout usando la extensión oficial de Firebase.
 * La extensión escucha la colección `customers/{uid}/checkout_sessions`
 * y retorna la URL de pago cuando está lista.
 */
const createStripeCheckoutSession = async (uid, priceId, successUrl, cancelUrl, teamId, planId, billingCycle) => {
  const sessionRef = await addDoc(
    collection(db, 'customers', uid, 'checkout_sessions'),
    {
      price: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        uid: uid,
        planId: planId || 'pro',
        ciclo: billingCycle || 'season',
        teamId: teamId || ''
      }
    }
  );
  return sessionRef;
};

const UpgradeModal = ({ isOpen, onClose, message, urgency = false, isSuccessState = false }) => {
  const { activeTeamId } = useAuth();
  const { t } = useTranslation();
  const isAndroid = isNativeAndroid();
  const [showRedeemView, setShowRedeemView] = useState(false);
  const [billingCycle, setBillingCycle] = useState('season'); // 'season' | 'monthly'
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [stripeError, setStripeError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const unsubscribeRef = useRef(null);
  const timeoutRef = useRef(null);

  // Estados para Canjear Código Promocional
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });

  const handleModalClose = () => {
    setShowRedeemView(false);
    setPromoMessage({ type: '', text: '' });
    onClose();
  };

  const handleRedeemPromoCode = async () => {
    const codeStr = promoCode.trim().toUpperCase();
    if (!codeStr) return;

    const user = auth.currentUser;
    if (!user) {
      setPromoMessage({ type: 'error', text: 'Debes iniciar sesión para canjear un código.' });
      return;
    }

    setRedeeming(true);
    setPromoMessage({ type: '', text: '' });

    try {
      let durationDays = 30; // por defecto 30 días
      const isBetaCode = codeStr === 'BETA2026';

      if (isBetaCode) {
        durationDays = 90; // Código especial BETA2026 otorga 90 días PRO
      } else {
        // Consultar en Firestore para otros códigos
        const codeRef = doc(db, 'promoCodes', codeStr);
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists()) {
          throw new Error('Código promocional no válido.');
        }

        const codeData = codeSnap.data();
        if (!codeData.active) {
          throw new Error('Este código ya no está activo.');
        }
        if (codeData.usedCount >= codeData.maxUses) {
          throw new Error('Este código ha alcanzado su límite de usos.');
        }

        durationDays = codeData.durationDays || 30;

        // Incrementar el contador de usos
        await updateDoc(codeRef, {
          usedCount: increment(1)
        });
      }

      // Calcular fecha de expiración
      const expirationDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // Actualizar el plan del usuario y sus equipos
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

      setPromoMessage({
        type: 'success',
        text: `¡Código canjeado con éxito! Plan PRO activo hasta el ${expirationDate.toLocaleDateString()}.`
      });
      setPromoCode('');

      // Recargar la página después de 1.5s para aplicar cambios reactivos
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('Error al canjear código en modal:', err);
      setPromoMessage({
        type: 'error',
        text: err.message || 'Error al procesar el código.'
      });
    } finally {
      setRedeeming(false);
    }
  };

  // Cleanup listeners on unmount or close
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  if (isSuccessState) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="upgrade-modal-wrapper success-loading-wrapper" onClick={e => e.stopPropagation()} style={{ padding: '24px', maxWidth: '500px' }}>
          <div className="upgrade-modal-header" style={{ borderBottom: 'none', padding: 0 }}>
            <button className="upgrade-close-x" onClick={onClose} aria-label="Cerrar">✕</button>
            <div className="success-spinner-container" style={{ margin: '30px auto 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid rgba(46, 125, 50, 0.15)', borderTopColor: '#2e7d32', borderRadius: '50%' }}></div>
              <h3 style={{ marginTop: '20px', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>¡Pago Recibido!</h3>
            </div>
            <p style={{ 
              fontSize: '0.92rem', 
              lineHeight: '1.6', 
              color: 'var(--text-secondary)', 
              textAlign: 'center',
              margin: '0 auto 20px',
              padding: '0 10px'
            }}>
              Procesando tu suscripción... Stripe está confirmando el pago. Tu cuenta se actualizará automáticamente en unos instantes. Puedes cerrar esta ventana.
            </p>
          </div>
          <div className="upgrade-modal-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <button className="upgrade-subscribe-btn btn-pro" onClick={onClose} style={{ maxWidth: '180px', margin: '0 auto' }}>
              ENTENDIDO
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DIÁLOGO EXCLUSIVO PARA ANDROID NATIVO (CUMPLIMIENTO POLÍTICA GOOGLE PLAY 3.1.1)
  if (isAndroid) {
    return (
      <div className="modal-overlay" onClick={handleModalClose}>
        <div 
          className="upgrade-modal-wrapper android-paywall-modal" 
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: '480px', width: '92vw', padding: '0', overflow: 'hidden' }}
        >
          {/* Header */}
          <div className="upgrade-modal-header" style={{ padding: '28px 20px 20px' }}>
            <button className="upgrade-close-x" onClick={handleModalClose} aria-label="Cerrar">✕</button>
            <div className="upgrade-crown-anim">👑</div>
            <h2 className="upgrade-title" style={{ fontSize: '1.45rem' }}>
              {showRedeemView ? t('paywall.androidRedeemTitle') : t('paywall.androidDialogTitle')}
            </h2>
            <p className="upgrade-subtitle" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
              {showRedeemView 
                ? t('paywall.androidRedeemDesc')
                : (message || t('paywall.androidDialogText'))}
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 20px' }}>
            {showRedeemView ? (
              /* Vista de Canje de Código */
              <div className="android-redeem-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="CÓDIGO (EJ. BETA2026)"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    disabled={redeeming}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.2))',
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      textAlign: 'center',
                      letterSpacing: '1px'
                    }}
                  />
                  <button
                    onClick={handleRedeemPromoCode}
                    disabled={redeeming || !promoCode.trim()}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      borderRadius: '8px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.35)'
                    }}
                  >
                    {redeeming ? '⏳ PROCESANDO...' : 'CANJEAR CÓDIGO'}
                  </button>

                  {promoMessage.text && (
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      textAlign: 'center',
                      lineHeight: '1.4',
                      backgroundColor: promoMessage.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${promoMessage.type === 'success' ? '#10B981' : '#ef4444'}`,
                      color: promoMessage.type === 'success' ? '#10B981' : '#ef4444'
                    }}>
                      {promoMessage.text}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowRedeemView(false);
                      setPromoMessage({ type: '', text: '' });
                    }}
                    style={{
                      marginTop: '8px',
                      minHeight: '48px',
                      background: 'none',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: 'var(--text-secondary, #94a3b8)',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t('paywall.androidBackToInfo')}
                  </button>
                </div>
              </div>
            ) : (
              /* Vista Principal de Diálogo Informativo */
              <div className="android-info-container">
                <div style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 75, 135, 0.1)',
                  border: '1px solid rgba(0, 75, 135, 0.3)',
                  marginBottom: '20px'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.88rem',
                    lineHeight: '1.55',
                    color: 'var(--text-primary, #f1f5f9)',
                    textAlign: 'center'
                  }}>
                    {t('paywall.androidDialogText')}
                  </p>
                </div>

                {/* Beneficios PRO Destacados (vectores y tipografía limpia, sin precios) */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-secondary, #cbd5e1)' }}>
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
                    <span>{t('paywall.benefit1')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-secondary, #cbd5e1)' }}>
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
                    <span>{t('paywall.benefit2')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-secondary, #cbd5e1)' }}>
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
                    <span>{t('paywall.benefit3')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--text-secondary, #cbd5e1)' }}>
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
                    <span>{t('paywall.benefit4')}</span>
                  </div>
                </div>

                {/* Botones de Acción Android */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Botón Primario: Azul Institucional #004B87, Blanco, ALL CAPS, 8px, 48dp */}
                  <button
                    id="btn-android-open-web"
                    onClick={() => openExternal('https://www.mister11.app/planes')}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      backgroundColor: '#004B87',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0,75,135,0.4)'
                    }}
                  >
                    🌐 {t('paywall.androidOpenWeb')}
                  </button>

                  {/* Botón Acción/Éxito: Verde Campo #10B981 */}
                  <button
                    id="btn-android-have-code"
                    onClick={() => setShowRedeemView(true)}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                    }}
                  >
                    🔑 {t('paywall.androidHaveCode')}
                  </button>

                  {/* Botón Cerrar: Ahora no */}
                  <button
                    id="btn-android-not-now"
                    onClick={handleModalClose}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary, #94a3b8)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    {t('paywall.androidNotNow')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSubscribe = async (planKey) => {
    const plan = PLANS[planKey];
    if (!plan) return;

    const priceId = billingCycle === 'season' ? plan.stripePriceIds.season : plan.stripePriceIds.monthly;
    const planName = `${plan.nombre} (${billingCycle === 'season' ? 'Temporada' : 'Mensual'})`;

    setLoadingPlan(planKey);
    setStripeError(null);
    setStatusMsg('Preparando sesión de pago segura...');

    if (!priceId || priceId === 'undefined') {
      setStripeError({
        type: 'config',
        message: `El precio para ${planName} no está configurado en Stripe Sandbox.`,
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
      setStatusMsg('Conectando con Stripe Checkout...');

      // Guardar el plan y ciclo elegido en localStorage
      localStorage.setItem('mister11_pending_plan', planKey);
      localStorage.setItem('mister11_pending_cycle', billingCycle);
      localStorage.setItem('mister11_pending_plan_teamId', activeTeamId || '');

      const sessionRef = await createStripeCheckoutSession(
        user.uid,
        priceId,
        `${window.location.origin}/dashboard?payment=success`,
        `${window.location.origin}/pricing`,
        activeTeamId,
        planKey,
        billingCycle
      );

      setStatusMsg('Esperando confirmación de Stripe...');

      unsubscribeRef.current = onSnapshot(sessionRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (data?.error) {
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
          if (unsubscribeRef.current) unsubscribeRef.current();
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          window.location.assign(data.url);
        }
      });

      timeoutRef.current = setTimeout(() => {
        if (unsubscribeRef.current) unsubscribeRef.current();
        setLoadingPlan(null);
        setStatusMsg('');
        setStripeError({
          type: 'timeout',
          message: 'Tiempo de espera agotado al conectar con Stripe. Revisa tu conexión o inténtalo de nuevo.',
        });
      }, 20000);

    } catch (err) {
      console.error('Error al iniciar suscripción:', err);
      setStripeError({ type: 'generic', message: err.message || 'Error inesperado.' });
      setLoadingPlan(null);
      setStatusMsg('');
    }
  };

  const getErrorHelp = (error) => {
    if (!error) return null;
    if (error.type === 'config') {
      return (
        <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          💡 Revisa los IDs de precios en <code>src/config/plans.js</code>.
        </div>
      );
    }
    return null;
  };

  const payablePlans = ['pro', 'club_starter', 'club_pro', 'club_premium'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upgrade-modal-wrapper" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="upgrade-modal-header">
          <button className="upgrade-close-x" onClick={onClose} aria-label="Cerrar">✕</button>
          {urgency && <div className="upgrade-urgency-pill">⏰ ¡PRUEBA POR VENCER!</div>}
          <div className="upgrade-crown-anim">👑</div>
          <h2 className="upgrade-title">Desbloquea Míster11</h2>
          <p className="upgrade-subtitle">
            {message || 'Herramientas de nivel profesional adaptadas a la realidad del fútbol formativo y amateur.'}
          </p>

          {/* Selector de Ciclo de Facturación (Mensual vs Temporada) */}
          <div className="billing-toggle-container">
            <button
              type="button"
              className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              📅 Mensual
            </button>
            <button
              type="button"
              className={`billing-toggle-btn ${billingCycle === 'season' ? 'active' : ''}`}
              onClick={() => setBillingCycle('season')}
            >
              🏆 Plan Temporada (10 Meses)
              <span className="billing-save-badge">🎁 Julio & Agosto GRATIS</span>
            </button>
          </div>

          <div className="upgrade-tax-notice">
            <span>✅ Todos los precios tienen el <strong>IVA (21%) incluido</strong></span>
            {billingCycle === 'season' && (
              <span className="upgrade-season-hint"> · ⚽ Cobro de 10 meses de competición</span>
            )}
          </div>
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
              ⚠️ Error al procesar el pago
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
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

        {/* Plans Grid (4 Planes de pago) */}
        <div className="upgrade-plans-grid-4">
          {payablePlans.map((planKey) => {
            const plan = PLANS[planKey];
            const isSeason = billingCycle === 'season';
            const price = isSeason ? plan.precioTemporada : plan.precioMes;
            const periodLabel = isSeason ? '/temporada (10m)' : '/mes';
            const taxBreakdown = calcularDesgloseIVA(price);

            return (
              <div
                key={planKey}
                className={`upgrade-plan-card upgrade-plan-${planKey} ${plan.badge ? 'has-badge' : ''}`}
              >
                {plan.badge && (
                  <div className={`upgrade-plan-badge badge-${planKey}`}>
                    ⭐ {plan.badge}
                  </div>
                )}

                <div className="upgrade-plan-header-box">
                  <h3 className="upgrade-plan-name">{plan.nombre}</h3>
                  <p className="upgrade-plan-tagline">{plan.tagline}</p>
                </div>

                <div className="upgrade-plan-price">
                  <span className="price-amount">{price} €</span>
                  <span className="price-period">{periodLabel}</span>
                </div>

                {/* Desglose de IVA */}
                <div className="upgrade-price-breakdown">
                  <span>Base: {taxBreakdown.base.toFixed(2)} €</span>
                  <span> + IVA (21%): {taxBreakdown.iva.toFixed(2)} €</span>
                </div>

                {/* Coste por entrenador en planes de club */}
                {isSeason && plan.costePorEntrenadorMesTemporada && (
                  <div className="upgrade-coach-cost-pill">
                    💡 Solo <strong>{plan.costePorEntrenadorMesTemporada}</strong> / entrenador / mes
                  </div>
                )}

                <div className="upgrade-plan-limits-summary">
                  <div className="limit-pill">🛡️ <strong>{plan.teamLimit}</strong> {plan.teamLimit === 1 ? 'equipo' : 'equipos'}</div>
                  <div className="limit-pill">👥 <strong>{plan.staffLimit === Infinity ? 'Staff Ilimitado' : `${plan.staffLimit} staff/eq`}</strong></div>
                  <div className="limit-pill">🏃 <strong>23</strong> jug./eq</div>
                </div>

                <ul className="upgrade-benefits-list">
                  {plan.features.slice(2).map((feat, i) => (
                    <li key={i} className="upgrade-benefit-row">
                      <span className="benefit-emoji">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  id={`btn-subscribe-${planKey}`}
                  className={`upgrade-subscribe-btn btn-${planKey}`}
                  disabled={loadingPlan !== null}
                  onClick={() => handleSubscribe(planKey)}
                >
                  {loadingPlan === planKey ? '⏳ Procesando...' : `ELEGIR ${plan.nombre.toUpperCase()}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Canjear Código Beta / Promocional */}
        <div className="upgrade-promo-section">
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>🔑 ¿Tienes un código promocional o de prueba beta?</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Introduce tu código (ej. <strong>BETA2026</strong>) para activar el acceso inmediatamente.
          </p>
          <div style={{ display: 'flex', gap: '8px', maxWidth: '360px', margin: '0 auto' }}>
            <input 
              type="text" 
              placeholder="Código (ej. BETA2026)" 
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              disabled={redeeming}
              style={{
                flex: 1,
                padding: '0 12px',
                height: '38px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: '#fff',
                fontSize: '0.82rem',
                textAlign: 'center'
              }}
            />
            <button 
              onClick={handleRedeemPromoCode}
              disabled={redeeming || !promoCode.trim()}
              style={{
                padding: '0 16px',
                height: '38px',
                borderRadius: '6px',
                backgroundColor: '#10B981',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {redeeming ? 'Procesando...' : 'Canjear'}
            </button>
          </div>
          {promoMessage.text && (
            <div style={{
              marginTop: '10px',
              fontSize: '0.8rem',
              color: promoMessage.type === 'success' ? '#10B981' : '#ef4444',
              fontWeight: '600'
            }}>
              {promoMessage.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="upgrade-modal-footer">
          <p className="upgrade-guarantee">🔒 Pago seguro procesado por Stripe · IVA incluido · Cancela en cualquier momento</p>
          <button className="upgrade-later-link" onClick={onClose}>
            Continuar con Plan Gratuito (1 equipo / 1 staff)
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
