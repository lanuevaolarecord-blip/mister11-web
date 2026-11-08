import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Check, RefreshCw, Info, ChevronRight, Eye } from 'lucide-react';
import { PILOT_VECTOR_ILLUSTRATIONS } from '../../data/vectorIllustrations';
import { canPrescribeAtHome } from '../../utils/exerciseSafety';
import { SYSTEM_CORE_EXERCISES } from '../../data/systemCoreExercises';

/**
 * src/components/admin/PilotIllustrationsReview.jsx
 * Míster11 — Visor de Revisión y Certificación del Piloto B5-A de Ilustraciones Vectoriales.
 *
 * Cumple Regla de UI:
 * - Android First: Touch targets >= 48px, tipografía legible, 100% vectorial (sin fotos).
 * - Botones Primarios: Fondo Azul Institucional (#0A2540), texto blanco.
 * - Botones Éxito: Fondo Verde Campo (#059669), confirmación de revisión.
 * - Tarjetas: Fondo blanco con borde sutil y sombra suave.
 */
export const PilotIllustrationsReview = () => {
  // Estado local para permitir al dueño revisar y certificar interactivamente
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('mister11_pilot_illustrations_reviews');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    const initial = {};
    Object.keys(PILOT_VECTOR_ILLUSTRATIONS).forEach(id => {
      initial[id] = { reviewed: false };
    });
    return initial;
  });

  const [selectedId, setSelectedId] = useState('sys-1');

  const toggleApproval = (id) => {
    setReviews(prev => {
      const next = {
        ...prev,
        [id]: { reviewed: !prev[id]?.reviewed, reviewedAt: new Date().toISOString() }
      };
      localStorage.setItem('mister11_pilot_illustrations_reviews', JSON.stringify(next));
      return next;
    });
  };

  const currentItem = PILOT_VECTOR_ILLUSTRATIONS[selectedId];
  const isApproved = Boolean(reviews[selectedId]?.reviewed);

  // Simular objeto de ejercicio para comprobar prescripción en canPrescribeAtHome
  const mockExercise = {
    ...(SYSTEM_CORE_EXERCISES.find(e => e.id === selectedId) || {}),
    illustration: {
      type: 'vector_svg',
      status: 'pilot_pending_review',
      reviewed_by_human: isApproved
    }
  };
  const prescriptionCheck = canPrescribeAtHome(mockExercise);

  return (
    <div style={{
      padding: '16px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Cabecera Android First */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(10, 37, 64, 0.06)',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            background: '#0A2540',
            color: '#FFFFFF',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <Eye size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0A2540', fontWeight: 800 }}>
              Piloto B5-A: Ilustraciones Vectoriales (Bajo Riesgo)
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Validación y revisión visual sin fotos ni IA alucinada
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '8px 0 0 0' }}>
          Este visor permite al dueño revisar las 4 ilustraciones biomecánicas vectoriales deterministas y su clínica asociada.
          El sistema opera en modo <strong>FAIL-CLOSED</strong>: ningún ejercicio del piloto puede prescribirse hasta que el dueño lo certifique como aprobado.
        </p>
      </div>

      {/* Selector de Ejercicios en Pestañas Touch (min 48px) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {Object.values(PILOT_VECTOR_ILLUSTRATIONS).map(item => {
          const itemApproved = Boolean(reviews[item.id]?.reviewed);
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{
                minHeight: '52px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: isSelected ? '2px solid #0A2540' : '1px solid #E2E8F0',
                background: isSelected ? '#F0F9FF' : '#FFFFFF',
                color: '#0A2540',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.88rem',
                boxShadow: isSelected ? '0 2px 6px rgba(10, 37, 64, 0.12)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{item.nameEs}</span>
              {itemApproved ? (
                <span style={{ color: '#059669', display: 'flex' }}><ShieldCheck size={18} /></span>
              ) : (
                <span style={{ color: '#D97706', display: 'flex' }}><ShieldAlert size={18} /></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tarjeta Principal del Ejercicio Seleccionado */}
      {currentItem && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(10, 37, 64, 0.08)',
          overflow: 'hidden'
        }}>
          {/* Header del Ejercicio */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#E2E8F0',
                  color: '#0A2540',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {currentItem.id}
                </span>
                <span style={{
                  background: '#ECFDF5',
                  color: '#059669',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  Tier: {currentItem.tier_riesgo.toUpperCase()} (Sin fisio requerido)
                </span>
                <span style={{
                  background: '#F8FAFC',
                  color: '#475569',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem'
                }}>
                  Edad Mín: {currentItem.edadMin} años
                </span>
              </div>
              <h3 style={{ margin: '8px 0 0 0', color: '#0A2540', fontSize: '1.2rem' }}>
                {currentItem.nameEs}
              </h3>
            </div>

            {/* Botón de Aprobación por el Dueño (Android First: >= 48px) */}
            <button
              onClick={() => toggleApproval(currentItem.id)}
              style={{
                minHeight: '48px',
                padding: '0 20px',
                borderRadius: '8px',
                background: isApproved ? '#059669' : '#0A2540',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: isApproved ? '0 2px 6px rgba(5, 150, 105, 0.3)' : '0 2px 6px rgba(10, 37, 64, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {isApproved ? (
                <>
                  <Check size={18} />
                  APROBADO POR DUEÑO
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  APROBAR ILUSTRACIÓN
                </>
              )}
            </button>
          </div>

          {/* Estado de Prescripción Fail-Closed */}
          <div style={{
            padding: '12px 20px',
            background: isApproved ? '#F0FDF4' : '#FFFBEB',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {isApproved ? (
              <>
                <ShieldCheck size={20} color="#059669" />
                <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 600 }}>
                  ESTADO: APROBADO — Ejercicio habilitado para prescripción casera ({prescriptionCheck.prescribable ? 'Prescribible' : prescriptionCheck.badge}).
                </span>
              </>
            ) : (
              <>
                <ShieldAlert size={20} color="#D97706" />
                <span style={{ fontSize: '0.85rem', color: '#92400E', fontWeight: 600 }}>
                  ESTADO: FAIL-CLOSED — Bloqueado en prescripción ({prescriptionCheck.badge || 'Pendiente de aprobación'}).
                </span>
              </>
            )}
          </div>

          {/* Lienzo Vectorial SVG */}
          <div style={{
            padding: '24px',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0'
          }}>
            <div 
              style={{
                width: '100%',
                maxWidth: '420px',
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}
              dangerouslySetInnerHTML={{ __html: currentItem.svg }} 
            />
          </div>

          {/* Datos Clínicos y Puntos Técnicos */}
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#0A2540', fontWeight: 700 }}>
                Zonas Diana Anatómicas
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {currentItem.clinicalData.targetZones.map((z, idx) => (
                  <span key={idx} style={{
                    background: '#E0F2FE',
                    color: '#0369A1',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>
                    {z}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#0A2540', fontWeight: 700 }}>
                Puntos Clave de Ejecución (Coaching Points)
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
                {currentItem.clinicalData.coachingPoints.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#B91C1C', fontWeight: 700 }}>
                Errores Comunes a Evitar (Seguridad)
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: '#7F1D1D', lineHeight: 1.6 }}>
                {currentItem.clinicalData.mistakesToAvoid.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PilotIllustrationsReview;
